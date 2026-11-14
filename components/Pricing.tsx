import React, { useState } from 'react';
import { Check, ShieldCheck, X } from 'lucide-react';
import { BillingCadence, PlanTier, WorkspaceState } from '../types';

interface PricingProps {
  workspace: WorkspaceState;
  onSelectPlan: (tier: PlanTier, cadence: BillingCadence) => void;
}

const COMPARISON_ROWS = [
  { feature: 'Autopilot Articles / mo', starter: '2 manual drafts', growth: '30 scheduled / mo', agency: '150 scheduled / mo' },
  { feature: 'Brand Voice Scanning', starter: '1 domain', growth: '1 domain', agency: 'Unlimited domains' },
  { feature: 'Site Audits / mo', starter: '2 audits / mo', growth: 'Unlimited', agency: 'Unlimited (White-label PDF)' },
  { feature: 'Output Languages', starter: 'English only', growth: '15+ languages', agency: '15+ languages' },
  { feature: 'CMS Direct Publishing', starter: 'HTML / PDF export', growth: 'WordPress, Shopify, Webflow, Ghost', agency: 'All CMS + Custom Webhooks' },
  { feature: 'Competitor Spy', starter: '1 competitor', growth: '10 competitors', agency: 'Unlimited' },
  { feature: 'Team Seats', starter: '1 seat', growth: '2 seats', agency: '10 seats' },
];

const Pricing: React.FC<PricingProps> = ({ workspace, onSelectPlan }) => {
  const [cadence, setCadence] = useState<BillingCadence>(workspace.billingCadence || 'quarterly');
  const [checkoutTier, setCheckoutTier] = useState<PlanTier | null>(null);
  const [billingEmail, setBillingEmail] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const growthPrice = cadence === 'monthly' ? 39 : cadence === 'quarterly' ? 27 : 19;
  const agencyPrice = cadence === 'monthly' ? 99 : cadence === 'quarterly' ? 74 : 59;

  const handleConfirmPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutTier) return;
    onSelectPlan(checkoutTier, cadence);
    setConfirmed(true);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Plans &amp; Billing
          </h1>
          <p className="text-sm text-slate-500">
            Active plan: <span className="font-semibold text-slate-900">{workspace.planTier}</span> ({workspace.billingCadence} billing). Switch cadences or upgrade anytime.
          </p>
        </div>

        {/* Billing Cadence Selector */}
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

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Starter */}
        <div className="bg-white rounded-xl border border-slate-200 p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500">For evaluating a single domain</p>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Starter</h2>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-4xl font-bold text-slate-900 tabular-nums">$0</span>
              <span className="text-sm text-slate-500">/mo</span>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600 pt-2">
              <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-600 shrink-0" /> 2 Site Audits / month</li>
              <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-600 shrink-0" /> 10 Keyword Lookups / month</li>
              <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-600 shrink-0" /> 2 Manual AI Article Drafts</li>
              <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-600 shrink-0" /> Manual HTML &amp; PDF Export</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => onSelectPlan('Starter', cadence)}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
          >
            {workspace.planTier === 'Starter' ? 'Current Plan' : 'Switch to Starter'}
          </button>
        </div>

        {/* Growth Autopilot */}
        <div className="bg-slate-900 text-white rounded-xl border border-slate-900 p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-emerald-400">Most Popular · For growing teams</p>
              <h2 className="text-xl font-bold text-white mt-1">Growth Autopilot</h2>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-4xl font-bold text-white tabular-nums">${growthPrice}</span>
              <span className="text-sm text-slate-400">/mo</span>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-300 pt-2">
              <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-400 shrink-0" /> 30 Autopilot Articles / mo</li>
              <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-400 shrink-0" /> Brand Voice &amp; Audience Training</li>
              <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-400 shrink-0" /> 15+ Languages &amp; GEO Schema</li>
              <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-400 shrink-0" /> WordPress, Shopify &amp; Webflow Sync</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmed(false);
              setCheckoutTier('Growth Autopilot');
            }}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer"
          >
            {workspace.planTier === 'Growth Autopilot' ? 'Active Plan · Manage' : 'Select Growth Autopilot'}
          </button>
        </div>

        {/* Agency Scale */}
        <div className="bg-white rounded-xl border border-slate-200 p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500">For agencies &amp; multi-brand operators</p>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Agency Scale</h2>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-4xl font-bold text-slate-900 tabular-nums">${agencyPrice}</span>
              <span className="text-sm text-slate-500">/mo</span>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600 pt-2">
              <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-600 shrink-0" /> Unlimited Domains &amp; Workspaces</li>
              <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-600 shrink-0" /> 150 Autopilot Articles / mo</li>
              <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-600 shrink-0" /> White-Label PDF Audit Reports</li>
              <li className="flex items-center gap-2.5"><Check size={15} className="text-emerald-600 shrink-0" /> 10 Team Seats &amp; Custom Webhooks</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmed(false);
              setCheckoutTier('Agency Scale');
            }}
            className="w-full py-2.5 px-4 bg-white border border-slate-900 hover:bg-slate-50 text-slate-900 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
          >
            {workspace.planTier === 'Agency Scale' ? 'Active Plan · Manage' : 'Select Agency Scale'}
          </button>
        </div>
      </div>

      {/* Concrete Plan Limits Comparison Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Plan Limits &amp; Capabilities Comparison</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-3.5 px-6">Capability</th>
                <th className="py-3.5 px-4">Starter ($0)</th>
                <th className="py-3.5 px-4">Growth Autopilot (${growthPrice}/mo)</th>
                <th className="py-3.5 px-6">Agency Scale (${agencyPrice}/mo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.feature} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-6 font-semibold text-slate-900">{row.feature}</td>
                  <td className="py-3.5 px-4 text-slate-600">{row.starter}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">{row.growth}</td>
                  <td className="py-3.5 px-6 text-slate-700">{row.agency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guarantee Banner */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white flex items-center gap-4">
        <ShieldCheck size={22} className="text-emerald-600 shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-slate-900">14-Day Money-Back Guarantee</h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Cancel anytime with zero lock-in contracts. Full refund within 14 days if OrganicIQ does not save your team hours each week.
          </p>
        </div>
      </div>

      {/* Plan Confirmation Modal */}
      {checkoutTier && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {confirmed ? 'Plan Updated' : `Activate ${checkoutTier}`}
              </h3>
              <button
                type="button"
                onClick={() => setCheckoutTier(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {confirmed ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Your workspace is now configured on <span className="font-semibold text-slate-900">{checkoutTier}</span> ({cadence} billing).
                </p>
                <button
                  type="button"
                  onClick={() => setCheckoutTier(null)}
                  className="w-full py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmPlan} className="space-y-4">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{checkoutTier} · {cadence}</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    ${checkoutTier === 'Growth Autopilot' ? growthPrice : agencyPrice}/mo
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Billing Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutTier(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Confirm Plan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricing;