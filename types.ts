export interface KeywordData {
  keyword: string;
  searchVolume: number;
  difficulty: 'Low' | 'Medium' | 'High' | string;
  intent: 'Informational' | 'Commercial' | 'Transactional' | 'AI Search' | string;
  cpcEstimate?: string;
  articleTitleIdea?: string;
  tracked?: boolean;
}

export interface BrandProfile {
  domain: string;
  brandName: string;
  industry: string;
  audience: string;
  toneRules: string;
  contentPillars: string[];
  language: string;
  cadence: 'daily' | '3x_week' | 'weekly';
  connectedCms: 'WordPress' | 'Shopify' | 'Webflow' | 'Ghost' | 'Webhook' | 'None';
  webhookUrl: string;
  gscConnected: boolean;
  gscProperty: string;
  lastScannedAt?: string;
}

export interface AutopilotArticle {
  id: string;
  title: string;
  keyword: string;
  scheduledDate: string;
  status: 'Scheduled' | 'Draft Ready' | 'Published';
  targetCms: string;
  language: string;
  format: string;
  wordCount?: number;
  htmlContent?: string;
  metaDescription?: string;
}

export interface BlogPost {
  title: string;
  content: string;
  metaDescription: string;
}

export interface CompetitorInsight {
  url?: string;
  competitorName: string;
  industry: string;
  companySize: string;
  location: string;
  strengths: string[];
  weaknesses: string[];
  topKeywords: string[];
  contentGapOpportunity?: string;
}

export interface AuditIssue {
  type: 'Critical' | 'Warning' | 'Recommendation';
  issue: string;
  count: number;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
}

export interface PageCrawlResult {
  url: string;
  status: number;
  loadTime: string;
  issues: string[];
}

export interface AuditResult {
  domain?: string;
  auditedAt?: string;
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
  aiSearchReadiness?: {
    answerFirstScore: string;
    recommendations: string[];
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

export type BillingCadence = 'monthly' | 'quarterly' | 'annual';
export type PlanTier = 'Starter' | 'Growth Autopilot' | 'Agency Scale';

export interface WorkspaceState {
  brandProfile: BrandProfile;
  trackedKeywords: KeywordData[];
  autopilotQueue: AutopilotArticle[];
  competitors: CompetitorInsight[];
  latestAudit: AuditResult | null;
  planTier: PlanTier;
  billingCadence: BillingCadence;
}

export interface GscMonthlyMetric {
  monthKey: string;
  monthLabel: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
  indexedPages: number;
  topQuery: string;
}

export interface GscSummaryData {
  connected: boolean;
  propertyUrl: string;
  lastSyncedAt: string | null;
  months: GscMonthlyMetric[];
}

export enum AppView {
  OVERVIEW = 'overview',
  DASHBOARD = 'dashboard',
  AUTOPILOT = 'autopilot',
  KEYWORDS = 'keywords',
  CONTENT = 'content',
  COMPETITORS = 'competitors',
  AUDIT = 'audit',
  PRICING = 'pricing',
}