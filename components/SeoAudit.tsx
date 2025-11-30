import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, ChevronRight, LayoutDashboard, Globe, Link2, BarChart, AlertTriangle, FileWarning, Timer, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { performSeoAudit } from '../services/geminiService';
import { AuditResult } from '../types';

const SeoAudit: React.FC = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Simulate crawl progress
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (loading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90; // Hold at 90 until done
          return prev + Math.floor(Math.random() * 10);
        });
      }, 800);
    } else {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setResult(null);

    // Normalize URL
    let urlToAnalyze = url.trim();
    if (!urlToAnalyze.match(/^https?:\/\//i)) {
      urlToAnalyze = `https://${urlToAnalyze}`;
    }

    try {
      const auditData = await performSeoAudit(urlToAnalyze);
      setResult(auditData);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 stroke-emerald-500';
    if (score >= 50) return 'text-amber-500 stroke-amber-500';
    return 'text-red-500 stroke-red-500';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6">
       <div className="text-center space-y-4 mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Instant Site SEO Audit</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Enter your URL or domain to get a comprehensive organic search health score and a prioritized weekly action plan.
          </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xl hover:shadow-2xl transition-shadow duration-300 max-w-4xl mx-auto">
        <form onSubmit={handleAudit} className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <LayoutDashboard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Enter your website URL or domain (e.g., example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-sm md:text-lg rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url}
            className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 flex items-center justify-center whitespace-nowrap"
          >
            {loading ? 'Crawling...' : 'Start Audit'}
          </button>
        </form>
        
        {loading && (
          <div className="mt-6">
            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                <span>Crawling pages...</span>
                <span>{progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-blue-600 transition-all duration-300 ease-out rounded-full relative overflow-hidden"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                </div>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-8 animate-fade-in">
            
           {/* Top Metrics: Search Visibility */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <MetricCard 
                 label="Organic Monthly Traffic" 
                 value={result.metrics.organicMonthlyTraffic.toLocaleString()} 
                 icon={<Activity size={18} className="text-blue-500"/>}
               />
               <MetricCard 
                 label="Organic Keywords" 
                 value={result.metrics.organicKeywords.toLocaleString()} 
                 icon={<Globe size={18} className="text-emerald-500"/>}
               />
               <MetricCard 
                 label="Backlinks" 
                 value={result.metrics.backlinks.toLocaleString()} 
                 icon={<Link2 size={18} className="text-purple-500"/>}
               />
               <MetricCard 
                 label="Domain Authority" 
                 value={result.metrics.domainAuthority.toString()} 
                 icon={<ShieldCheck size={18} className="text-amber-500"/>}
                 subLabel="/ 100"
               />
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Col: Health Score & Breakdown */}
              <div className="lg:col-span-1 space-y-6">
                  {/* Main Score */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
                      <h3 className="text-lg font-bold text-slate-800 mb-6 absolute top-6 left-6">On-Page SEO Score</h3>
                      
                      <div className="relative w-48 h-48 mt-8">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                            <circle 
                                cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                                strokeDasharray={552} 
                                strokeDashoffset={552 - (552 * result.score) / 100}
                                className={`transition-all duration-1000 ease-out ${getScoreColor(result.score)}`}
                            />
                        </svg>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                            <span className={`text-5xl font-extrabold ${getScoreColor(result.score).split(' ')[0]}`}>{result.score}</span>
                            <span className="block text-xs text-slate-400 font-medium uppercase mt-1">{result.score >= 80 ? 'Great' : result.score >= 50 ? 'Average' : 'Poor'}</span>
                        </div>
                      </div>
                      <p className="mt-6 text-sm text-slate-500 leading-relaxed px-2">{result.summary}</p>
                  </div>

                  {/* Health Breakdown */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <h4 className="font-bold text-slate-800 mb-4">Health Breakdown</h4>
                      <div className="space-y-4">
                          <HealthRow 
                             label="Critical Errors" 
                             count={result.healthBreakdown.critical} 
                             color="bg-red-500" 
                             icon={<AlertCircle size={16} className="text-red-500"/>}
                          />
                          <HealthRow 
                             label="Warnings" 
                             count={result.healthBreakdown.warnings} 
                             color="bg-amber-500" 
                             icon={<AlertTriangle size={16} className="text-amber-500"/>}
                          />
                          <HealthRow 
                             label="Recommendations" 
                             count={result.healthBreakdown.recommendations} 
                             color="bg-blue-500" 
                             icon={<CheckCircle size={16} className="text-blue-500"/>}
                          />
                      </div>
                  </div>
              </div>

              {/* Right Col: Issues & Pages */}
              <div className="lg:col-span-2 space-y-8">
                  
                  {/* Top SEO Issues */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                          <h3 className="font-bold text-slate-800 flex items-center">
                              <FileWarning className="mr-2 text-slate-500" size={20} /> Top SEO Issues
                          </h3>
                      </div>
                      <div className="divide-y divide-slate-100">
                          {result.topIssues.map((issue, i) => (
                              <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex items-start justify-between group">
                                  <div className="flex items-start gap-3">
                                      <div className={`mt-1 p-1 rounded-full ${
                                          issue.type === 'Critical' ? 'bg-red-100 text-red-600' :
                                          issue.type === 'Warning' ? 'bg-amber-100 text-amber-600' :
                                          'bg-blue-100 text-blue-600'
                                      }`}>
                                          {issue.type === 'Critical' ? <AlertCircle size={16} /> :
                                           issue.type === 'Warning' ? <AlertTriangle size={16} /> :
                                           <CheckCircle size={16} />}
                                      </div>
                                      <div>
                                          <p className="text-slate-800 font-medium group-hover:text-blue-600 transition-colors">{issue.issue}</p>
                                          <div className="flex gap-2 mt-1">
                                              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{issue.type}</span>
                                              <span className="text-xs text-slate-300">•</span>
                                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                                  issue.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                                  issue.difficulty === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                                                  'bg-red-100 text-red-700'
                                              }`}>{issue.difficulty} Fix</span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="text-center min-w-[60px]">
                                      <span className="block text-xl font-bold text-slate-700">{issue.count}</span>
                                      <span className="text-[10px] text-slate-400 uppercase">Pages</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Pages Crawled */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                          <h3 className="font-bold text-slate-800 flex items-center">
                              <Globe className="mr-2 text-slate-500" size={20} /> Pages Discovered
                          </h3>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                              <thead>
                                  <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/30">
                                      <th className="p-4">URL</th>
                                      <th className="p-4">Status</th>
                                      <th className="p-4">Load Time</th>
                                      <th className="p-4">Issues Found</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {result.pagesCrawled.map((page, i) => (
                                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                                          <td className="p-4 font-medium text-blue-600 truncate max-w-[200px] underline decoration-blue-200 underline-offset-4 cursor-pointer" title={page.url}>
                                              {page.url.replace(/https?:\/\/[^/]+/, '') || '/'}
                                          </td>
                                          <td className="p-4">
                                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                  page.status === 200 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                              }`}>
                                                  {page.status}
                                              </span>
                                          </td>
                                          <td className="p-4 text-slate-600 flex items-center">
                                              <Timer size={14} className="mr-1 text-slate-400"/> {page.loadTime}
                                          </td>
                                          <td className="p-4">
                                              {page.issues.length > 0 ? (
                                                  <div className="flex flex-wrap gap-1">
                                                      {page.issues.slice(0, 2).map((issue, idx) => (
                                                          <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                                              {issue}
                                                          </span>
                                                      ))}
                                                      {page.issues.length > 2 && (
                                                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">+{page.issues.length - 2}</span>
                                                      )}
                                                  </div>
                                              ) : (
                                                  <span className="text-emerald-500 text-xs flex items-center"><CheckCircle size={12} className="mr-1"/> Clean</span>
                                              )}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>

              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string; icon: React.ReactNode; subLabel?: string }> = ({ label, value, icon, subLabel }) => (
    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
            <div className="bg-slate-50 p-2 rounded-lg">{icon}</div>
        </div>
        <div className="flex items-baseline">
            <span className="text-2xl font-bold text-slate-800">{value}</span>
            {subLabel && <span className="ml-1 text-sm text-slate-400">{subLabel}</span>}
        </div>
    </div>
);

const HealthRow: React.FC<{ label: string; count: number; color: string; icon: React.ReactNode }> = ({ label, count, color, icon }) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
        <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-md border border-slate-200 shadow-sm">
                {icon}
            </div>
            <span className="font-medium text-slate-700 text-sm">{label}</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${color}`}>
            {count}
        </span>
    </div>
);

export default SeoAudit;