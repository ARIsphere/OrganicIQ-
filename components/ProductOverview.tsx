import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Globe,
  Loader2,
  FileText,
  Search,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { AppView, BillingCadence, PlanTier, WorkspaceState } from '../types';
import heroWorkspaceImg from '../src/assets/images/hero_editorial_workspace_1794595572503.jpg';
import cmsStudioImg from '../src/assets/images/cms_publishing_studio_1794595573573.jpg';

interface ProductOverviewProps {
  workspace: WorkspaceState;
  onEnterWorkspace: (view?: AppView) => void;
  onQuickDomainScan: (domain: string) => Promise<void>;
  onSelectPlan: (tier: PlanTier, cadence: BillingCadence) => void;
}

const CMS_INTEGRATIONS = [
  { name: 'WordPress', method: 'Native REST API & Plugin', sync: 'Auto-publish with featured metadata' },
  { name: 'Shopify', method: 'Storefront Blog API', sync: 'Product & collection internal links' },
  { name: 'Webflow', method: 'CMS Collection Sync', sync: 'Schema-mapped rich text fields' },
  { name: 'Ghost', method: 'Admin API Key', sync: 'Direct scheduled post queue' },
  { name: 'Next.js & Astro', method: 'Markdown / MDX Webhook', sync: 'Pull-request or JSON webhook' },
  { name: 'Wix & Squarespace', method: 'Structured HTML Export', sync: 'Copy-ready metadata & schema' },
];

const ProductOverview: React.FC<ProductOverviewProps> = ({
  workspace,
  onEnterWorkspace,
  onQuickDomainScan,
  onSelectPlan,
}) => {
  const [heroDomain, setHeroDomain] = useState(workspace.brandProfile.domain || '');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [cadence, setCadence] = useState<BillingCadence>(workspace.billingCadence || 'quarterly');
  const [heroImgError, setHeroImgError] = useState(false);
  const [studioImgError, setStudioImgError] = useState(false);

  const handleHeroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroDomain.trim()) return;
    setScanning(true);
    setScanError('');
    try {
      await onQuickDomainScan(heroDomain.trim());
      onEnterWorkspace(AppView.AUTOPILOT);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Unable to scan domain right now.');
    } finally {
      setScanning(false);
    }
  };

  const growthPrice = cadence === 'monthly' ? 39 : cadence === 'quarterly' ? 27 : 19;
  const agencyPrice = cadence === 'monthly' ? 99 : cadence === 'quarterly' ? 74 : 59;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Bar Contract: 3 clean zones separated by gap-8 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            OrganicIQ
          </button>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#workflow" className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">
              How It Works
            </a>
            <a href="#capabilities" className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">
              Capabilities
            </a>
            <a href="#integrations" className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">
              Integrations
            </a>
            <a href="#pricing-overview" className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0">
              Pricing
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onEnterWorkspace(AppView.DASHBOARD)}
              className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open Workspace
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-14 pb-16 lg:pt-20 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <p className="text-sm font-medium text-emerald-700">
                SEO Autopilot · Brand Voice Engine · Direct CMS Publishing
              </p>
              <h1
                className="font-bold tracking-tight text-slate-900 leading-[1.08]"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', textWrap: 'balance' }}
              >
                Run your organic search &amp; AI content engine on autopilot.
              </h1>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-xl">
                Enter your domain. OrganicIQ learns your brand tone, uncovers low-competition keywords for Google and ChatGPT, writes cited long-form articles in 15+ languages, and publishes straight to your CMS.
              </p>

              {/* Interactive Onboarding Domain Scan */}
              <form onSubmit={handleHeroSubmit} className="pt-2 space-y-3 max-w-xl">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={heroDomain}
                      onChange={(e) => setHeroDomain(e.target.value)}
                      placeholder="Enter your website (e.g., stripe.com)"
                      aria-label="Website domain to scan"
                      className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={scanning || !heroDomain.trim()}
                    className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {scanning ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Scanning Site...
                      </>
                    ) : (
                      <>
                        Scan Brand Voice
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
                {scanError && (
                  <p className="text-xs text-red-600 font-medium">{scanError}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>No credit card required</span>
                  <span aria-hidden="true">·</span>
                  <span>14-day money-back guarantee</span>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => onEnterWorkspace(AppView.AUDIT)}
                    className="text-slate-700 font-medium hover:text-emerald-700 underline underline-offset-2 cursor-pointer"
                  >
                    Or run an instant technical audit
                  </button>
                </div>
              </form>
            </div>

            {/* Proof Metrics Row */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200">
              <div>
                <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">30 / mo</p>
                <p className="text-xs text-slate-500 mt-1">Daily scheduled articles</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">15+ langs</p>
                <p className="text-xs text-slate-500 mt-1">Native localized drafting</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">1-click</p>
                <p className="text-xs text-slate-500 mt-1">WordPress, Shopify &amp; Webflow</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex">
            <div className="w-full rounded-xl overflow-hidden border border-slate-200 bg-white flex flex-col">
              {!heroImgError ? (
                <img
                  src={heroWorkspaceImg}
                  alt="OrganicIQ editorial SEO workspace displaying organic traffic growth and structured article layout"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgError(true)}
                  className="w-full h-full min-h-[340px] lg:h-full object-cover"
                />
              ) : (
                <div className="w-full h-full min-h-[340px] bg-slate-100 flex flex-col items-center justify-center p-8 text-center">
                  <FileText size={32} className="text-slate-400 mb-3" />
                  <p className="text-sm font-semibold text-slate-700">OrganicIQ Editorial Studio</p>
                  <p className="text-xs text-slate-500 mt-1">Automated research, writing, and publishing workspace</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Mechanism */}
      <section id="workflow" className="bg-white border-y border-slate-200 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium text-emerald-700">Autopilot Architecture</p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900" style={{ textWrap: 'balance' }}>
              From domain URL to published organic traffic in four automated stages.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <p className="font-mono text-xs font-semibold text-emerald-700">01. Brand Absorption</p>
              <h3 className="text-lg font-semibold text-slate-900">Learns your site tone &amp; buyers</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Scans your live pages via search grounding to capture vocabulary, product positioning, audience persona, and core content pillars.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-200">
              <p className="font-mono text-xs font-semibold text-emerald-700">02. Keyword Discovery</p>
              <h3 className="text-lg font-semibold text-slate-900">Finds winnable search &amp; AI queries</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Identifies low-difficulty Google terms and conversational ChatGPT / Perplexity buyer questions competitors miss.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-200">
              <p className="font-mono text-xs font-semibold text-emerald-700">03. Article Generation</p>
              <h3 className="text-lg font-semibold text-slate-900">Drafts structured, schema-ready posts</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Streams semantic HTML with answer-first summaries, internal link anchors, meta descriptions, and valid JSON-LD Schema.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-200">
              <p className="font-mono text-xs font-semibold text-emerald-700">04. Direct Publishing</p>
              <h3 className="text-lg font-semibold text-slate-900">Ships straight to your CMS</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Queues articles on a daily or weekly cadence and dispatches clean payloads to WordPress, Shopify, Webflow, Ghost, or custom webhooks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Asymmetric Showcase */}
      <section id="capabilities" className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-5 flex">
            <div className="w-full rounded-xl overflow-hidden border border-slate-200 bg-white">
              {!studioImgError ? (
                <img
                  src={cmsStudioImg}
                  alt="Editorial blog publishing interface ready for direct CMS deployment"
                  referrerPolicy="no-referrer"
                  onError={() => setStudioImgError(true)}
                  className="w-full h-full min-h-[320px] object-cover"
                />
              ) : (
                <div className="w-full h-full min-h-[320px] bg-slate-100 flex flex-col items-center justify-center p-8">
                  <Send size={28} className="text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-700">CMS Publishing Pipeline</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-emerald-700">Full-Stack SEO Suite</p>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900" style={{ textWrap: 'balance' }}>
                Everything a lean marketing team needs without juggling five subscriptions.
              </h2>
              <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                Unlike single-purpose blog writers, OrganicIQ ties technical site diagnostics and competitor intelligence directly into your content production queue.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => onEnterWorkspace(AppView.AUDIT)}
                className="text-left p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-900 text-sm">Instant Site Audit</span>
                  <ArrowRight size={15} className="text-slate-400" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Health score, crawl simulation, page speed flags, and 1-click PDF client reports.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onEnterWorkspace(AppView.COMPETITORS)}
                className="text-left p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-900 text-sm">Competitor Spy</span>
                  <ArrowRight size={15} className="text-slate-400" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Search-grounded competitor profiling with keyword gaps ready to track in one click.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onEnterWorkspace(AppView.KEYWORDS)}
                className="text-left p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-900 text-sm">Keyword &amp; AI Search</span>
                  <ArrowRight size={15} className="text-slate-400" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Uncover search volume, CPC estimates, and buyer intent across Google and LLM engines.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onEnterWorkspace(AppView.CONTENT)}
                className="text-left p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-900 text-sm">Content Studio &amp; GEO</span>
                  <ArrowRight size={15} className="text-slate-400" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Live streaming drafts, SERP snippet preview, JSON-LD schema, and CMS payload export.
                </p>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Grid */}
      <section id="integrations" className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-6 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className="text-sm font-medium text-emerald-700">CMS Integrations</p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                Publish straight to the stack you already run.
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onEnterWorkspace(AppView.AUTOPILOT)}
              className="px-4 py-2 text-sm font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
            >
              Configure CMS Webhook
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CMS_INTEGRATIONS.map((cms) => (
              <div
                key={cms.name}
                className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">{cms.name}</h3>
                    <span className="text-xs font-mono text-slate-500">{cms.method}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">{cms.sync}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Summary Section */}
      <section id="pricing-overview" className="max-w-7xl mx-auto px-6 py-16 lg:py-24 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <p className="text-sm font-medium text-emerald-700">Transparent Pricing</p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900" style={{ textWrap: 'balance' }}>
              Agency-grade SEO automation priced for solo founders and growing teams.
            </h2>
          </div>

          {/* Interactive Billing Cadence Selector */}
          <div className="inline-flex items-center p-1 bg-slate-200/70 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setCadence('monthly')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                cadence === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setCadence('quarterly')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                cadence === 'quarterly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quarterly · Save 30%
            </button>
            <button
              type="button"
              onClick={() => setCadence('annual')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                cadence === 'annual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual · Save 50%
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter */}
          <div className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500">For evaluating a single site</p>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Starter</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-4xl font-bold text-slate-900 tabular-nums">$0</span>
                <span className="text-sm text-slate-500">/month</span>
              </div>
              <ul className="space-y-2.5 text-sm text-slate-600 pt-2">
                <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-600 shrink-0" /> 2 Site Audits per month</li>
                <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-600 shrink-0" /> 10 Keyword Discovery runs</li>
                <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-600 shrink-0" /> 2 Manual AI Article Drafts</li>
                <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-600 shrink-0" /> HTML &amp; PDF Analysis Export</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => {
                onSelectPlan('Starter', cadence);
                onEnterWorkspace(AppView.DASHBOARD);
              }}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
            >
              Continue on Starter
            </button>
          </div>

          {/* Growth Autopilot */}
          <div className="bg-slate-900 text-white border border-slate-900 rounded-xl p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-emerald-400">Most Popular · For growing businesses</p>
                <h3 className="text-xl font-bold text-white mt-1">Growth Autopilot</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-4xl font-bold text-white tabular-nums">${growthPrice}</span>
                <span className="text-sm text-slate-400">/month</span>
              </div>
              <ul className="space-y-2.5 text-sm text-slate-300 pt-2">
                <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-400 shrink-0" /> 30 Autopilot Articles / mo (Daily)</li>
                <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-400 shrink-0" /> Brand Voice &amp; Audience Training</li>
                <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-400 shrink-0" /> Unlimited Audits &amp; Competitor Spy</li>
                <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-400 shrink-0" /> WordPress, Shopify &amp; Webflow Sync</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => {
                onSelectPlan('Growth Autopilot', cadence);
                onEnterWorkspace(AppView.PRICING);
              }}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer"
            >
              Start Growth Autopilot
            </button>
          </div>

          {/* Agency Scale */}
          <div className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500">For agencies &amp; multi-brand teams</p>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Agency Scale</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-4xl font-bold text-slate-900 tabular-nums">${agencyPrice}</span>
                <span className="text-sm text-slate-500">/month</span>
              </div>
              <ul className="space-y-2.5 text-sm text-slate-600 pt-2">
                <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-600 shrink-0" /> Unlimited Domains &amp; Workspaces</li>
                <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-600 shrink-0" /> 150 Autopilot Articles / month</li>
                <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-600 shrink-0" /> White-Label PDF Audit Reports</li>
                <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-600 shrink-0" /> Custom Webhooks &amp; 10 Team Seats</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => {
                onSelectPlan('Agency Scale', cadence);
                onEnterWorkspace(AppView.PRICING);
              }}
              className="w-full py-2.5 px-4 bg-white border border-slate-900 hover:bg-slate-50 text-slate-900 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
            >
              Select Agency Scale
            </button>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">14-Day Money-Back Guarantee.</span> Cancel anytime with zero long-term contracts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onEnterWorkspace(AppView.PRICING)}
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap cursor-pointer"
          >
            Compare all plan limits →
          </button>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-900 text-sm">OrganicIQ</span>
            <span aria-hidden="true">·</span>
            <span>Automated SEO &amp; AI Search Growth Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <button type="button" onClick={() => onEnterWorkspace(AppView.AUDIT)} className="hover:text-slate-900 cursor-pointer">Site Audit</button>
            <button type="button" onClick={() => onEnterWorkspace(AppView.KEYWORDS)} className="hover:text-slate-900 cursor-pointer">Keywords</button>
            <button type="button" onClick={() => onEnterWorkspace(AppView.CONTENT)} className="hover:text-slate-900 cursor-pointer">Content Studio</button>
            <button type="button" onClick={() => onEnterWorkspace(AppView.PRICING)} className="hover:text-slate-900 cursor-pointer">Pricing</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProductOverview;
