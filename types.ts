export interface KeywordData {
  keyword: string;
  searchVolume: number;
  difficulty: string; // "Low", "Medium", "High"
  intent: string; // "Informational", "Commercial", "Transactional"
}

export interface BlogPost {
  title: string;
  content: string; // HTML or Markdown
  metaDescription: string;
}

export interface CompetitorInsight {
  competitorName: string;
  industry: string;
  companySize: string;
  location: string;
  strengths: string[];
  weaknesses: string[];
  topKeywords: string[];
}

export interface AuditIssue {
  type: 'Critical' | 'Warning' | 'Recommendation';
  issue: string;
  count: number;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
}

export interface PageCrawlResult {
  url: string;
  status: number; // e.g., 200, 404, 500
  loadTime: string; // e.g., "1.2s"
  issues: string[];
}

export interface AuditResult {
  score: number;
  summary: string;
  metrics: {
    organicMonthlyTraffic: number;
    organicKeywords: number;
    backlinks: number;
    domainAuthority: number;
  };
  healthBreakdown: {
    critical: number;
    warnings: number;
    recommendations: number;
  };
  topIssues: AuditIssue[];
  pagesCrawled: PageCrawlResult[];
}

export interface ContentAnalysis {
  keywordAnalysis: {
    keyword: string;
    count: number;
    status: 'Low' | 'Optimal' | 'High';
  }[];
  readability: {
    level: string;
    suggestions: string[];
  };
  metaDescriptions: string[];
  checklist: string[];
  internalLinks: {
    anchorText: string;
    targetTopic: string;
    relevance: string;
  }[];
  structuredDataSuggestions: {
    type: string;
    reason: string;
    code: string;
  }[];
}

export enum AppView {
  DASHBOARD = 'dashboard',
  KEYWORDS = 'keywords',
  CONTENT = 'content',
  COMPETITORS = 'competitors',
  AUDIT = 'audit',
  PRICING = 'pricing',
}