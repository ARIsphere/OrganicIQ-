import { GoogleGenAI, Type } from "@google/genai";
import { KeywordData, AuditResult, CompetitorInsight, ContentAnalysis } from "../types";

// Initialize Gemini Client
// Note: process.env.API_KEY is assumed to be available in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

/**
 * Helper to extract JSON from potentially conversational response.
 * Finds the first '{' and last '}' to isolate the JSON object.
 */
const extractJSON = (text: string) => {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const jsonStr = text.substring(start, end + 1);
      return JSON.parse(jsonStr);
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse JSON from response:", text);
    throw new Error("AI response could not be parsed as JSON");
  }
};

/**
 * Generates a keyword strategy based on a niche or topic.
 */
export const generateKeywordStrategy = async (topic: string): Promise<KeywordData[]> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate a list of 10 high-potential SEO keywords for the topic: "${topic}". 
      Estimate monthly search volume (use realistic numbers), difficulty (Low/Medium/High), and search intent.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              keyword: { type: Type.STRING },
              searchVolume: { type: Type.NUMBER },
              difficulty: { type: Type.STRING },
              intent: { type: Type.STRING },
            },
            required: ["keyword", "searchVolume", "difficulty", "intent"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as KeywordData[];
  } catch (error) {
    console.error("Error generating keywords:", error);
    return [];
  }
};

/**
 * Generates a blog post draft based on a title/keyword.
 * Returns a stream to allow real-time typing effect.
 */
export const generateBlogStream = async (topic: string, tone: string) => {
  try {
    const responseStream = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: `Write a comprehensive, SEO-optimized blog post about "${topic}". 
      Tone: ${tone}.
      Format: Use semantic HTML (<h1>, <h2>, <p>, <ul>, <li>). 
      Include a catchy title in an <h1> tag at the beginning.
      Do NOT include markdown code blocks (\`\`\`). Just raw HTML.`,
    });
    return responseStream;
  } catch (error) {
    console.error("Error generating blog:", error);
    throw error;
  }
};

/**
 * Analyzes blog content for on-page SEO optimizations.
 */
export const analyzeContent = async (content: string, keyword: string): Promise<ContentAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze the following blog post HTML content for SEO focusing on the target keyword: "${keyword}".
      
      Content:
      ${content.substring(0, 15000)} 
      
      Provide:
      1. Keyword density analysis for the main keyword and related terms (estimate count and status).
      2. Readability assessment (grade level) and 2 specific improvement suggestions.
      3. 3 SEO-optimized meta description suggestions (max 160 chars).
      4. A checklist of 3-5 specific actionable improvements (e.g., "Add alt text to images", "Shorten paragraphs").
      5. Suggest 3 internal linking opportunities. Suggest topics that would logically exist on a website covering this subject.
      6. Suggest 2 relevant Schema.org structured data types that should be added to this content (e.g., Article, FAQPage). Provide the type name, the reason, and a valid JSON-LD code snippet example populated with placeholder data relevant to the topic.`,
      config: {
        responseMimeType: "application/json",
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
                  status: { type: Type.STRING, enum: ["Low", "Optimal", "High"] },
                },
                required: ["keyword", "count", "status"]
              }
            },
            readability: {
              type: Type.OBJECT,
              properties: {
                level: { type: Type.STRING },
                suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["level", "suggestions"]
            },
            metaDescriptions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            checklist: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
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
                required: ["anchorText", "targetTopic", "relevance"]
              }
            },
            structuredDataSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  code: { type: Type.STRING, description: "Example JSON-LD code snippet" },
                },
                required: ["type", "reason", "code"]
              }
            }
          },
          required: ["keywordAnalysis", "readability", "metaDescriptions", "checklist", "internalLinks", "structuredDataSuggestions"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as ContentAnalysis;
  } catch (error) {
    console.error("Error analyzing content:", error);
    throw error;
  }
};

/**
 * Analyzes a competitor URL using Google Search Grounding.
 */
export const analyzeCompetitor = async (url: string): Promise<CompetitorInsight> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze the specific website ${url} for its SEO strategy and business details. 
      
      CRITICAL INSTRUCTION: First, perform a Google Search for "site:${url} about" and "site:${url} contact" to verify the exact identity and location of the entity behind this specific domain. 
      Do NOT rely on internal knowledge for common names; verify against the actual website content found via search.
      For example, if the site belongs to an American author based in Atlanta, do not confuse them with a Swiss entity of a similar name.
      
      Task:
      1. Identify the Brand Name (e.g. "Violette L. Meier").
      2. Identify the Industry (be specific, e.g. "Author & Artist / Book Publishing").
      3. Estimate Company Size.
      4. Identify the primary Location (City, State, Country) strictly based on the website's text (e.g. "Atlanta, GA, USA").
      5. Identify 3 SEO Strengths.
      6. Identify 3 SEO Weaknesses.
      7. Guess 5 Top Keywords.
      
      Return the response as a valid JSON object with the following structure:
      {
        "competitorName": "string",
        "industry": "string",
        "companySize": "string",
        "location": "string",
        "strengths": ["string", "string", "string"],
        "weaknesses": ["string", "string", "string"],
        "topKeywords": ["string", "string", "string", "string", "string"]
      }
      
      IMPORTANT: Output ONLY the JSON object. Do not add conversational text.`,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType and responseSchema cannot be used with tools
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return extractJSON(text) as CompetitorInsight;
  } catch (error) {
    console.error("Error analyzing competitor:", error);
    throw error;
  }
};

/**
 * Performs a comprehensive SEO site audit including search visibility and simulated crawl data.
 */
export const performSeoAudit = async (url: string): Promise<AuditResult> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Perform a comprehensive "Site Audit" and "Search Visibility" analysis for the domain ${url}.
      
      CRITICAL INSTRUCTION: First, verify the identity of the site at ${url}.
      
      Part 1: Search Visibility Estimation (Based on the niche/brand authority found):
      - Estimate monthly organic traffic.
      - Estimate number of ranking organic keywords.
      - Estimate number of backlinks.
      - Estimate Domain Authority (0-100).

      Part 2: Simulated Site Crawl:
      - Simulate a crawl of the homepage and 4 likely sub-pages (e.g., /blog, /contact, /services, or specific book/product pages found for this entity).
      - Identify Technical SEO issues common for this type of site (e.g., Missing Alt Text, Slow Load Time, Duplicate H1, 404 Errors).
      - Categorize issues into Critical Errors, Warnings, and Recommendations.

      Output Requirement:
      Return a VALID JSON object with this exact structure:
      {
        "score": number, // 0-100 Overall Health Score
        "summary": "string (Executive summary of findings)",
        "metrics": {
          "organicMonthlyTraffic": number,
          "organicKeywords": number,
          "backlinks": number,
          "domainAuthority": number
        },
        "healthBreakdown": {
          "critical": number, // Count of critical errors
          "warnings": number,
          "recommendations": number
        },
        "topIssues": [
          {
            "type": "Critical" | "Warning" | "Recommendation",
            "issue": "string (e.g. '3 pages have low word count')",
            "count": number,
            "difficulty": "Easy" | "Moderate" | "Hard"
          }
        ],
        "pagesCrawled": [
          {
            "url": "string (Full URL)",
            "status": number, // e.g. 200, 404, 500
            "loadTime": "string (e.g. '1.2s')",
            "issues": ["string", "string"] // List of specific issues on this page
          }
        ]
      }
      
      IMPORTANT: Output ONLY the JSON object. Do not add conversational text.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return extractJSON(text) as AuditResult;
  } catch (error) {
    console.error("Error performing audit:", error);
    throw error;
  }
};