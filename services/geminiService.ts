import {
  KeywordData,
  AuditResult,
  CompetitorInsight,
  ContentAnalysis,
  BrandProfile,
} from '../types';

async function postJson<T>(endpoint: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }
  return data as T;
}

export interface BrandScanResponse {
  domain: string;
  brandName: string;
  industry: string;
  audience: string;
  toneRules: string;
  contentPillars: string[];
  seedKeywords: KeywordData[];
}

export const scanBrandProfile = async (domain: string): Promise<BrandScanResponse> => {
  return postJson<BrandScanResponse>('/api/seo/brand-profile', { domain });
};

export const generateKeywordStrategy = async (
  topic: string,
  options?: { language?: string; domain?: string }
): Promise<KeywordData[]> => {
  return postJson<KeywordData[]>('/api/seo/keywords', {
    topic,
    language: options?.language || 'English',
    domain: options?.domain || '',
  });
};

export interface ArticleStreamOptions {
  topic: string;
  tone: string;
  language?: string;
  format?: string;
  brandProfile?: BrandProfile;
}

export const streamArticleDraft = async (
  options: ArticleStreamOptions,
  onChunk: (chunkText: string) => void
): Promise<void> => {
  const response = await fetch('/api/seo/article-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: options.topic,
      tone: options.tone,
      language: options.language || options.brandProfile?.language || 'English',
      format: options.format || 'Comprehensive Guide',
      brandVoice: options.brandProfile?.toneRules || '',
      brandName: options.brandProfile?.brandName || '',
      internalLinks: options.brandProfile?.contentPillars || [],
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error || `Generation failed with status ${response.status}`);
  }

  if (!response.body) {
    throw new Error('Streaming response body unavailable.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const evt of events) {
      const line = evt.trim();
      if (!line.startsWith('data:')) continue;
      const jsonStr = line.slice(5).trim();
      if (!jsonStr) continue;
      const parsed = JSON.parse(jsonStr) as { text?: string; error?: string; done?: boolean };
      if (parsed.error) {
        throw new Error(parsed.error);
      }
      if (parsed.text) {
        onChunk(parsed.text);
      }
    }
  }
};

export const analyzeContent = async (
  content: string,
  keyword: string
): Promise<ContentAnalysis> => {
  return postJson<ContentAnalysis>('/api/seo/analyze-content', { content, keyword });
};

export const analyzeCompetitor = async (url: string): Promise<CompetitorInsight> => {
  return postJson<CompetitorInsight>('/api/seo/competitor', { url });
};

export const performSeoAudit = async (url: string): Promise<AuditResult> => {
  return postJson<AuditResult>('/api/seo/audit', { url });
};

export interface CmsPublishResponse {
  dispatched: boolean;
  upstreamStatus?: number;
  message: string;
  payload: Record<string, unknown>;
}

export const publishToCms = async (params: {
  cms: string;
  webhookUrl?: string;
  title: string;
  htmlContent: string;
  metaDescription?: string;
  keyword?: string;
}): Promise<CmsPublishResponse> => {
  return postJson<CmsPublishResponse>('/api/cms/publish', params);
};