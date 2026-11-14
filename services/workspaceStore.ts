import { WorkspaceState, BrandProfile, KeywordData, AutopilotArticle } from '../types';

const STORAGE_KEY = 'organiciq_workspace_v1';

export const SUPPORTED_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Italian',
  'Dutch',
  'Polish',
  'Swedish',
  'Japanese',
  'Korean',
  'Arabic',
  'Hindi',
  'Turkish',
  'Indonesian',
];

export const CMS_TARGETS: Array<BrandProfile['connectedCms']> = [
  'WordPress',
  'Shopify',
  'Webflow',
  'Ghost',
  'Webhook',
  'None',
];

export const DEFAULT_WORKSPACE: WorkspaceState = {
  brandProfile: {
    domain: 'acme-cloud.io',
    brandName: 'Acme Cloud',
    industry: 'B2B SaaS & Developer Infrastructure',
    audience: 'Engineering leaders, DevOps managers, and technical founders evaluating workflow automation.',
    toneRules: 'Direct, evidence-led, practical. Avoid buzzwords. Lead with concrete benchmarks and implementation steps.',
    contentPillars: [
      'CI/CD Deployment Pipelines',
      'Cloud Cost Governance',
      'API Observability',
      'Infrastructure Security',
    ],
    language: 'English',
    cadence: 'daily',
    connectedCms: 'WordPress',
    webhookUrl: '',
    gscConnected: false,
    gscProperty: 'sc-domain:acme-cloud.io',
  },
  trackedKeywords: [
    {
      keyword: 'automated ci cd rollback best practices',
      searchVolume: 1900,
      difficulty: 'Low',
      intent: 'Informational',
      cpcEstimate: '$4.20',
      articleTitleIdea: 'Automated CI/CD Rollbacks: Zero-Downtime Patterns for Production Teams',
      tracked: true,
    },
    {
      keyword: 'kubernetes cloud cost optimization checklist',
      searchVolume: 3400,
      difficulty: 'Medium',
      intent: 'Commercial',
      cpcEstimate: '$6.80',
      articleTitleIdea: 'Kubernetes Cloud Cost Checklist: 11 Concrete Levers to Cut Monthly Spend',
      tracked: true,
    },
    {
      keyword: 'best api observability tools for microservices',
      searchVolume: 2600,
      difficulty: 'Low',
      intent: 'AI Search',
      cpcEstimate: '$8.10',
      articleTitleIdea: 'Comparing API Observability Platforms for Distributed Microservices',
      tracked: true,
    },
  ],
  autopilotQueue: [
    {
      id: 'art-1',
      title: 'Automated CI/CD Rollbacks: Zero-Downtime Patterns for Production Teams',
      keyword: 'automated ci cd rollback best practices',
      scheduledDate: getOffsetDate(0),
      status: 'Draft Ready',
      targetCms: 'WordPress',
      language: 'English',
      format: 'Technical How-To',
      wordCount: 1420,
    },
    {
      id: 'art-2',
      title: 'Kubernetes Cloud Cost Checklist: 11 Concrete Levers to Cut Monthly Spend',
      keyword: 'kubernetes cloud cost optimization checklist',
      scheduledDate: getOffsetDate(1),
      status: 'Scheduled',
      targetCms: 'WordPress',
      language: 'English',
      format: 'Comprehensive Guide',
    },
    {
      id: 'art-3',
      title: 'Comparing API Observability Platforms for Distributed Microservices',
      keyword: 'best api observability tools for microservices',
      scheduledDate: getOffsetDate(2),
      status: 'Scheduled',
      targetCms: 'WordPress',
      language: 'English',
      format: 'Comparison',
    },
  ],
  competitors: [],
  latestAudit: null,
  planTier: 'Growth Autopilot',
  billingCadence: 'quarterly',
};

export function getOffsetDate(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().split('T')[0];
}

export function loadWorkspace(): WorkspaceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WORKSPACE;
    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;
    return {
      ...DEFAULT_WORKSPACE,
      ...parsed,
      brandProfile: {
        ...DEFAULT_WORKSPACE.brandProfile,
        ...(parsed.brandProfile || {}),
      },
    };
  } catch {
    return DEFAULT_WORKSPACE;
  }
}

export function saveWorkspace(state: WorkspaceState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function createQueueItemFromKeyword(
  kw: KeywordData,
  profile: BrandProfile,
  offsetDays: number
): AutopilotArticle {
  return {
    id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: kw.articleTitleIdea || `Complete Guide to ${kw.keyword}`,
    keyword: kw.keyword,
    scheduledDate: getOffsetDate(offsetDays),
    status: 'Scheduled',
    targetCms: profile.connectedCms === 'None' ? 'WordPress' : profile.connectedCms,
    language: profile.language,
    format: kw.intent === 'Commercial' ? 'Comparison' : 'Comprehensive Guide',
  };
}
