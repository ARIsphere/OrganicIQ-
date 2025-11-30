import React from 'react';
import { Check, X, Zap, Shield, BarChart3 } from 'lucide-react';

const Pricing: React.FC = () => {
  return (
    <div className="py-8 animate-fade-in space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-slate-800">Simple, Transparent Pricing</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Start with a free health check. Upgrade to automate your growth strategy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        
        {/* Free Plan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Starter</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-bold text-slate-900">$0</span>
              <span className="ml-1 text-slate-500">/mo</span>
            </div>
            <p className="text-sm text-slate-500 mt-2">Perfect for tracking a single project.</p>
          </div>
          <div className="space-y-4 mb-8 flex-1">
            <FeatureItem text="Dashboard Overview" />
            <FeatureItem text="1 Site Audit per Month" />
            <FeatureItem text="Google Search Console Integration" />
            <FeatureItem text="Limited Keyword Research" />
            <FeatureItem text="AI Content Writer" included={false} />
            <FeatureItem text="Competitor Analysis" included={false} />
          </div>
          <button className="w-full py-3 px-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors">
            Current Plan
          </button>
        </div>

        {/* Pro Plan - Highlighted */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl transform md:-translate-y-4 flex flex-col relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
            Most Popular
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Zap size={18} className="mr-2 text-yellow-400" fill="currentColor" /> Pro Growth
            </h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-bold text-white">$29</span>
              <span className="ml-1 text-slate-400">/mo</span>
            </div>
            <p className="text-sm text-slate-400 mt-2">For serious bloggers and small businesses.</p>
          </div>
          <div className="space-y-4 mb-8 flex-1">
            <FeatureItem text="Everything in Starter" dark />
            <FeatureItem text="Unlimited Site Audits" dark />
            <FeatureItem text="20 AI Blog Posts / mo" dark />
            <FeatureItem text="Full Keyword Strategy" dark />
            <FeatureItem text="Competitor Spy (5 sites)" dark />
            <FeatureItem text="SEO Checklists" dark />
          </div>
          <button className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
            Start Free Trial
          </button>
        </div>

        {/* Agency Plan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Agency</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-bold text-slate-900">$99</span>
              <span className="ml-1 text-slate-500">/mo</span>
            </div>
            <p className="text-sm text-slate-500 mt-2">Scale content for multiple clients.</p>
          </div>
          <div className="space-y-4 mb-8 flex-1">
            <FeatureItem text="Everything in Pro" />
            <FeatureItem text="Unlimited AI Content" />
            <FeatureItem text="White-label Reports" />
            <FeatureItem text="Team Collaboration" />
            <FeatureItem text="API Access" />
            <FeatureItem text="Priority Support" />
          </div>
          <button className="w-full py-3 px-4 bg-white border-2 border-slate-900 text-slate-900 font-semibold rounded-xl hover:bg-slate-50 transition-colors">
            Contact Sales
          </button>
        </div>

      </div>

      <div className="max-w-4xl mx-auto mt-16 bg-emerald-50 rounded-2xl p-8 border border-emerald-100 flex items-center justify-between">
        <div className="flex items-center space-x-4">
           <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
              <Shield size={24} />
           </div>
           <div>
             <h4 className="font-bold text-emerald-900">30-Day Money Back Guarantee</h4>
             <p className="text-emerald-700 text-sm">If you don't see traffic growth, we'll refund your subscription.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

const FeatureItem: React.FC<{ text: string; included?: boolean; dark?: boolean }> = ({ text, included = true, dark = false }) => (
  <div className="flex items-start">
    <div className={`mt-0.5 mr-3 flex-shrink-0 ${included ? (dark ? 'text-blue-400' : 'text-emerald-500') : 'text-slate-300'}`}>
      {included ? <Check size={18} strokeWidth={3} /> : <X size={18} />}
    </div>
    <span className={`text-sm ${dark ? 'text-slate-300' : 'text-slate-600'} ${!included && 'text-slate-400 line-through decoration-slate-300'}`}>
      {text}
    </span>
  </div>
);

export default Pricing;