import dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, type Schema } from '@google/genai';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import {
  connectGscProperty,
  disconnectGscProperty,
  getGscSummary,
  refreshGscTrends,
  upsertMonthlySnapshot,
} from './src/db/gsc.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_NAME = 'gemini-4-hydrogen';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment. Check Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractJSON<T>(text: string): T {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(text.substring(start, end + 1)) as T;
    }
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Could not parse structured JSON from model output.');
  }
}

function extractNestedErrorMessage(raw: string): string {
  let current = raw;
  for (let i = 0; i < 4; i++) {
    const trimmed = current.trim();
    if (!trimmed.startsWith('{')) break;
    try {
      const parsed = JSON.parse(trimmed) as { error?: { message?: string } | string; message?: string };
      if (typeof parsed.error === 'object' && parsed.error?.message) {
        current = parsed.error.message;
      } else if (typeof parsed.error === 'string') {
        current = parsed.error;
      } else if (typeof parsed.message === 'string') {
        current = parsed.message;
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  return current;
}

function formatApiError(err: unknown): { status: number; message: string } {
  const rawMessage = err instanceof Error ? err.message : 'Unexpected server error';
  const message = extractNestedErrorMessage(rawMessage);
  if (message.includes('PERMISSION_DENIED') || message.includes('403') || message.includes('API_KEY_INVALID')) {
    return { status: 403, message: 'API key permission issue. Verify your key in Settings > Secrets.' };
  }
  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
    return { status: 429, message: 'Rate limit reached. Please retry in a moment.' };
  }
  if (message.includes('UNAVAILABLE') || message.includes('503') || message.includes('high demand')) {
    return { status: 503, message: 'The AI model is temporarily experiencing high demand. Please retry in a moment.' };
  }
  return { status: 500, message };
}

async function generateJsonWithSearchFallback<T>(
  ai: GoogleGenAI,
  contents: string,
  responseSchema: Schema
): Promise<T> {
  try {
    const grounded = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    if (grounded.text) {
      return extractJSON<T>(grounded.text);
    }
  } catch (searchErr) {
    console.warn(
      'Search grounding unavailable, falling back to structured generation:',
      searchErr instanceof Error ? searchErr.message : searchErr
    );
  }

  const fallback = await ai.models.generateContent({
    model: MODEL_NAME,
    contents,
    config: {
      responseMimeType: 'application/json',
      responseSchema,
    },
  });

  if (!fallback.text) {
    throw new Error('Empty response received from model.');
  }
  return JSON.parse(fallback.text) as T;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // 1. Brand Voice & Site Absorption (Soro-style onboarding scan)
  app.post('/api/seo/brand-profile', async (req, res) => {
    try {
      const { domain } = req.body as { domain?: string };
      if (!domain || !domain.trim()) {
        res.status(400).json({ error: 'Domain or website URL is required.' });
        return;
      }

      const cleanUrl = domain.trim().match(/^https?:\/\//i) ? domain.trim() : `https://${domain.trim()}`;
      const ai = getAiClient();

      const parsed = await generateJsonWithSearchFallback<Record<string, unknown>>(
        ai,
        `Scan and research the website "${cleanUrl}" to build an accurate Brand Voice & SEO Autopilot Profile.

Verify what this business actually does, who it serves, and how it writes.
Return ONLY a valid JSON object matching this exact schema:
{
  "domain": "${cleanUrl}",
  "brandName": "string (Actual company or brand name)",
  "industry": "string (Specific industry vertical)",
  "audience": "string (1-2 sentences describing the primary buyer/reader persona)",
  "toneRules": "string (Concrete editorial voice guidelines: style, sentence structure, vocabulary, point of view)",
  "contentPillars": ["string", "string", "string", "string"],
  "seedKeywords": [
    {
      "keyword": "string (specific low-competition long-tail search phrase)",
      "searchVolume": number,
      "difficulty": "Low" | "Medium" | "High",
      "intent": "Informational" | "Commercial" | "Transactional" | "AI Search",
      "cpcEstimate": "string (e.g. '$2.40')",
      "articleTitleIdea": "string"
    }
  ]
}`,
        {
          type: Type.OBJECT,
          properties: {
            domain: { type: Type.STRING },
            brandName: { type: Type.STRING },
            industry: { type: Type.STRING },
            audience: { type: Type.STRING },
            toneRules: { type: Type.STRING },
            contentPillars: { type: Type.ARRAY, items: { type: Type.STRING } },
            seedKeywords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  keyword: { type: Type.STRING },
                  searchVolume: { type: Type.NUMBER },
                  difficulty: { type: Type.STRING },
                  intent: { type: Type.STRING },
                  cpcEstimate: { type: Type.STRING },
                  articleTitleIdea: { type: Type.STRING },
                },
                required: ['keyword', 'searchVolume', 'difficulty', 'intent', 'cpcEstimate', 'articleTitleIdea'],
              },
            },
          },
          required: ['domain', 'brandName', 'industry', 'audience', 'toneRules', 'contentPillars', 'seedKeywords'],
        }
      );

      res.json(parsed);
    } catch (err) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 2. Keyword Strategy Discovery
  app.post('/api/seo/keywords', async (req, res) => {
    try {
      const { topic, language = 'English', domain } = req.body as {
        topic?: string;
        language?: string;
        domain?: string;
      };

      if (!topic || !topic.trim()) {
        res.status(400).json({ error: 'Topic or niche is required.' });
        return;
      }

      const ai = getAiClient();
      const contextLine = domain ? `Target website context: ${domain}.` : '';

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Generate 12 high-potential SEO and AI-Search keywords for the topic: "${topic.trim()}".
Language: ${language}. ${contextLine}
Include a balanced mix of Informational, Commercial, Transactional, and AI Search (conversational buyer questions asked in ChatGPT/Perplexity/Google AI Overviews) queries.
Provide realistic monthly search volumes, difficulty (Low/Medium/High), estimated CPC, and a concrete article title idea for each.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                keyword: { type: Type.STRING },
                searchVolume: { type: Type.NUMBER },
                difficulty: { type: Type.STRING },
                intent: { type: Type.STRING },
                cpcEstimate: { type: Type.STRING },
                articleTitleIdea: { type: Type.STRING },
              },
              required: ['keyword', 'searchVolume', 'difficulty', 'intent', 'cpcEstimate', 'articleTitleIdea'],
            },
          },
        },
      });

      const text = response.text ?? '[]';
      res.json(JSON.parse(text));
    } catch (err) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 3. Streaming Article Generator (SSE)
  app.post('/api/seo/article-stream', async (req, res) => {
    try {
      const {
        topic,
        tone = 'Informative',
        language = 'English',
        format = 'Comprehensive Guide',
        brandVoice,
        brandName,
        internalLinks = [],
      } = req.body as {
        topic?: string;
        tone?: string;
        language?: string;
        format?: string;
        brandVoice?: string;
        brandName?: string;
        internalLinks?: string[];
      };

      if (!topic || !topic.trim()) {
        res.status(400).json({ error: 'Article topic or keyword is required.' });
        return;
      }

      const ai = getAiClient();
      const brandGuidance = brandVoice
        ? `Brand Context: Writing for ${brandName || 'the client brand'}. Follow these Brand Voice rules strictly: ${brandVoice}`
        : '';
      const linkingGuidance =
        internalLinks.length > 0
          ? `Naturally weave in references to these site pillars where relevant: ${internalLinks.join(', ')}.`
          : '';

      const prompt = `Write a publication-ready, deeply researched long-form SEO and AI-Search optimized article in ${language}.
Primary Topic / Target Keyword: "${topic.trim()}"
Article Format: ${format}
Tone of Voice: ${tone}
${brandGuidance}
${linkingGuidance}

Structural & Quality Requirements:
- Output ONLY clean semantic HTML (<h1>, <h2>, <h3>, <p>, <ul>, <li>, <ol>, <blockquote>, <strong>). Never wrap output in markdown code fences.
- Start with a compelling <h1> title.
- Immediately follow the <h1> with a concise, answer-first executive summary <p> designed for Google AI Overviews and ChatGPT citations.
- Use clear, scannable <h2> and <h3> sections with concrete examples, actionable steps, and a dedicated Frequently Asked Questions section at the bottom.
- Write naturally without generic fluff or cliché filler.`;

      const stream = await ai.models.generateContentStream({
        model: MODEL_NAME,
        contents: prompt,
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of stream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err) {
      const formatted = formatApiError(err);
      if (!res.headersSent) {
        res.status(formatted.status).json({ error: formatted.message });
      } else {
        res.write(`data: ${JSON.stringify({ error: formatted.message })}\n\n`);
        res.end();
      }
    }
  });

  // 4. Content SEO & GEO / AI-Search Analyzer
  app.post('/api/seo/analyze-content', async (req, res) => {
    try {
      const { content, keyword } = req.body as { content?: string; keyword?: string };
      if (!content || !keyword) {
        res.status(400).json({ error: 'Both content and target keyword are required.' });
        return;
      }

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Analyze the following HTML article for both traditional Google SEO and Generative AI Search (ChatGPT / Perplexity / Google AI Overviews) optimization, targeting "${keyword}".

Content:
${content.substring(0, 16000)}

Provide:
1. Keyword density analysis for the main keyword and 3-4 semantic terms (count + Low/Optimal/High).
2. Readability assessment (grade level) and 2 concrete clarity improvements.
3. AI Search Readiness (answerFirstScore like "Strong" / "Needs Direct Summary", and 2 recommendations for LLM citation readiness).
4. 3 click-worthy meta description options (under 158 characters each).
5. 4-5 actionable optimization checklist items.
6. 3 internal linking opportunities with anchor text, target topic, and relevance note.
7. 2 relevant Schema.org structured data types (e.g. Article, FAQPage, HowTo) with valid JSON-LD snippets.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              keywordAnalysis: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    keyword: { type: Type.STRING },
                    count: { type: Type.NUMBER },
                    status: { type: Type.STRING, enum: ['Low', 'Optimal', 'High'] },
                  },
                  required: ['keyword', 'count', 'status'],
                },
              },
              readability: {
                type: Type.OBJECT,
                properties: {
                  level: { type: Type.STRING },
                  suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['level', 'suggestions'],
              },
              aiSearchReadiness: {
                type: Type.OBJECT,
                properties: {
                  answerFirstScore: { type: Type.STRING },
                  recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['answerFirstScore', 'recommendations'],
              },
              metaDescriptions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              checklist: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              internalLinks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    anchorText: { type: Type.STRING },
                    targetTopic: { type: Type.STRING },
                    relevance: { type: Type.STRING },
                  },
                  required: ['anchorText', 'targetTopic', 'relevance'],
                },
              },
              structuredDataSuggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    code: { type: Type.STRING },
                  },
                  required: ['type', 'reason', 'code'],
                },
              },
            },
            required: [
              'keywordAnalysis',
              'readability',
              'aiSearchReadiness',
              'metaDescriptions',
              'checklist',
              'internalLinks',
              'structuredDataSuggestions',
            ],
          },
        },
      });

      const text = response.text;
      if (!text) throw new Error('Empty response from content analyzer.');
      res.json(JSON.parse(text));
    } catch (err) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 5. Competitor Intelligence (Search Grounded)
  app.post('/api/seo/competitor', async (req, res) => {
    try {
      const { url } = req.body as { url?: string };
      if (!url || !url.trim()) {
        res.status(400).json({ error: 'Competitor URL is required.' });
        return;
      }

      const cleanUrl = url.trim().match(/^https?:\/\//i) ? url.trim() : `https://${url.trim()}`;
      const ai = getAiClient();

      const parsed = await generateJsonWithSearchFallback<Record<string, unknown>>(
        ai,
        `Analyze the specific website ${cleanUrl} for its SEO strategy and business identity.

Verify the exact brand identity, products/services, and location.
Return ONLY a valid JSON object with this exact structure:
{
  "url": "${cleanUrl}",
  "competitorName": "string",
  "industry": "string",
  "companySize": "string (e.g. '10-50 employees')",
  "location": "string (City, Country)",
  "strengths": ["string", "string", "string"],
  "weaknesses": ["string", "string", "string"],
  "topKeywords": ["string", "string", "string", "string", "string"],
  "contentGapOpportunity": "string (1 specific content gap we can target to outrank them)"
}`,
        {
          type: Type.OBJECT,
          properties: {
            url: { type: Type.STRING },
            competitorName: { type: Type.STRING },
            industry: { type: Type.STRING },
            companySize: { type: Type.STRING },
            location: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            topKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            contentGapOpportunity: { type: Type.STRING },
          },
          required: [
            'url',
            'competitorName',
            'industry',
            'companySize',
            'location',
            'strengths',
            'weaknesses',
            'topKeywords',
            'contentGapOpportunity',
          ],
        }
      );
      res.json(parsed);
    } catch (err) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 6. Instant Technical & Visibility Site Audit (Search Grounded)
  app.post('/api/seo/audit', async (req, res) => {
    try {
      const { url } = req.body as { url?: string };
      if (!url || !url.trim()) {
        res.status(400).json({ error: 'Website domain or URL is required.' });
        return;
      }

      const cleanUrl = url.trim().match(/^https?:\/\//i) ? url.trim() : `https://${url.trim()}`;
      const ai = getAiClient();

      const parsed = await generateJsonWithSearchFallback<Record<string, unknown>>(
        ai,
        `Perform a comprehensive SEO Site Audit and Search Visibility assessment for ${cleanUrl}.

Return ONLY a valid JSON object with this exact structure:
{
  "domain": "${cleanUrl}",
  "score": number,
  "summary": "string (2-3 sentence executive summary)",
  "metrics": {
    "organicMonthlyTraffic": number,
    "organicKeywords": number,
    "backlinks": number,
    "domainAuthority": number
  },
  "healthBreakdown": {
    "critical": number,
    "warnings": number,
    "recommendations": number
  },
  "topIssues": [
    {
      "type": "Critical" | "Warning" | "Recommendation",
      "issue": "string",
      "count": number,
      "difficulty": "Easy" | "Moderate" | "Hard"
    }
  ],
  "pagesCrawled": [
    {
      "url": "string",
      "status": number,
      "loadTime": "string (e.g. '1.1s')",
      "issues": ["string"]
    }
  ]
}`,
        {
          type: Type.OBJECT,
          properties: {
            domain: { type: Type.STRING },
            score: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            metrics: {
              type: Type.OBJECT,
              properties: {
                organicMonthlyTraffic: { type: Type.NUMBER },
                organicKeywords: { type: Type.NUMBER },
                backlinks: { type: Type.NUMBER },
                domainAuthority: { type: Type.NUMBER },
              },
              required: ['organicMonthlyTraffic', 'organicKeywords', 'backlinks', 'domainAuthority'],
            },
            healthBreakdown: {
              type: Type.OBJECT,
              properties: {
                critical: { type: Type.NUMBER },
                warnings: { type: Type.NUMBER },
                recommendations: { type: Type.NUMBER },
              },
              required: ['critical', 'warnings', 'recommendations'],
            },
            topIssues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  issue: { type: Type.STRING },
                  count: { type: Type.NUMBER },
                  difficulty: { type: Type.STRING },
                },
                required: ['type', 'issue', 'count', 'difficulty'],
              },
            },
            pagesCrawled: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  url: { type: Type.STRING },
                  status: { type: Type.NUMBER },
                  loadTime: { type: Type.STRING },
                  issues: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['url', 'status', 'loadTime', 'issues'],
              },
            },
          },
          required: ['domain', 'score', 'summary', 'metrics', 'healthBreakdown', 'topIssues', 'pagesCrawled'],
        }
      );

      res.json({
        ...parsed,
        auditedAt: new Date().toISOString(),
      });
    } catch (err) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 7. CMS Webhook / Payload Publisher
  app.post('/api/cms/publish', async (req, res) => {
    try {
      const { cms, webhookUrl, title, htmlContent, metaDescription, keyword } = req.body as {
        cms: string;
        webhookUrl?: string;
        title: string;
        htmlContent: string;
        metaDescription?: string;
        keyword?: string;
      };

      if (!title || !htmlContent) {
        res.status(400).json({ error: 'Article title and HTML content are required to publish.' });
        return;
      }

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const cmsPayload = {
        cms,
        publishedAt: new Date().toISOString(),
        article: {
          title,
          slug,
          status: 'publish',
          excerpt: metaDescription || '',
          focusKeyword: keyword || '',
          content: htmlContent,
        },
      };

      if (webhookUrl && webhookUrl.trim()) {
        try {
          const parsedUrl = new URL(webhookUrl.trim());
          if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            res.status(400).json({ error: 'Webhook URL must use http:// or https://' });
            return;
          }
          const upstream = await fetch(parsedUrl.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cmsPayload),
          });
          res.json({
            dispatched: true,
            upstreamStatus: upstream.status,
            message: upstream.ok
              ? `Dispatched cleanly to ${cms} webhook (HTTP ${upstream.status}).`
              : `Webhook responded with HTTP ${upstream.status}. Payload preview generated below.`,
            payload: cmsPayload,
          });
          return;
        } catch (hookErr) {
          res.status(502).json({
            error: `Webhook request failed: ${hookErr instanceof Error ? hookErr.message : 'Network error'}`,
          });
          return;
        }
      }

      res.json({
        dispatched: false,
        message: `Validated ${cms} publishing payload for "/${slug}". Connect a live webhook endpoint in Autopilot Setup for 1-click remote push.`,
        payload: cmsPayload,
      });
    } catch (err) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 8. Protected GSC Connection & Monthly SEO Summary Routes (Cloud SQL)
  app.get('/api/gsc/monthly-summary', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@users.organiciq.local`;
      const summary = await getGscSummary(uid, email);
      res.json(summary);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to fetch GSC summary.' });
    }
  });

  app.post('/api/gsc/connect', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { propertyUrl } = req.body as { propertyUrl?: string };
      if (!propertyUrl || !propertyUrl.trim()) {
        res.status(400).json({ error: 'Search Console property identifier is required.' });
        return;
      }
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@users.organiciq.local`;
      const summary = await connectGscProperty(uid, email, propertyUrl.trim());
      res.json(summary);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to connect GSC property.' });
    }
  });

  app.post('/api/gsc/disconnect', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@users.organiciq.local`;
      const summary = await disconnectGscProperty(uid, email);
      res.json(summary);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to disconnect GSC property.' });
    }
  });

  app.post('/api/gsc/refresh', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@users.organiciq.local`;
      const summary = await refreshGscTrends(uid, email);
      res.json(summary);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to refresh GSC trends.' });
    }
  });

  app.post('/api/gsc/snapshot', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { monthKey, clicks, impressions, avgPosition, indexedPages, topQuery } = req.body as {
        monthKey?: string;
        clicks?: number;
        impressions?: number;
        avgPosition?: number;
        indexedPages?: number;
        topQuery?: string;
      };
      if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
        res.status(400).json({ error: 'Month must use YYYY-MM format.' });
        return;
      }
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@users.organiciq.local`;
      const summary = await upsertMonthlySnapshot(uid, email, {
        monthKey,
        clicks: Math.max(0, Number(clicks) || 0),
        impressions: Math.max(1, Number(impressions) || 1),
        avgPosition: Math.min(100, Math.max(1, Number(avgPosition) || 10)),
        indexedPages: Math.max(0, Number(indexedPages) || 0),
        topQuery: (topQuery || '').slice(0, 120),
      });
      res.json(summary);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to record monthly snapshot.' });
    }
  });

  // Vite dev middleware or static dist serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.use((_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`OrganicIQ server listening on http://localhost:${port}`);
  });
}

startServer();
