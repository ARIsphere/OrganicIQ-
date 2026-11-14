import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Globe,
  AlertTriangle,
  CheckCircle,
  Timer,
  Download,
  PenTool,
  Loader2,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { performSeoAudit } from '../services/geminiService';
import { AuditResult, WorkspaceState } from '../types';

interface SeoAuditProps {
  workspace: WorkspaceState;
  onSaveAudit: (audit: AuditResult) => void;
  onDraftFromIssue: (issueTopic: string) => void;
}

const SeoAudit: React.FC<SeoAuditProps> = ({ workspace, onSaveAudit, onDraftFromIssue }) => {
  const [url, setUrl] = useState(workspace.brandProfile.domain || '');
  const [result, setResult] = useState<AuditResult | null>(workspace.latestAudit);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (loading) {
      setProgress(8);
      interval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? 90 : prev + 9));
      }, 700);
    } else {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const runAuditForUrl = async (target: string) => {
    if (!target.trim()) return;
    setLoading(true);
    setError('');

    let normalized = target.trim();
    if (!normalized.match(/^https?:\/\//i)) {
      normalized = `https://${normalized}`;
    }

    try {
      const auditData = await performSeoAudit(normalized);
      setResult(auditData);
      onSaveAudit(auditData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete site audit.');
    } finally {
      setLoading(false);
    }
  };

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runAuditForUrl(url);
  };

  const handleExportAuditPdf = () => {
    if (!result) return;
    const doc = new jsPDF();
    const margin = 20;
    const width = doc.internal.pageSize.getWidth() - margin * 2;
    let y = 20;

    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text('OrganicIQ Technical Site Audit', margin, y);
    y += 8;

    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Domain: ${result.domain || url} | Health Score: ${result.score}/100`, margin, y);
    y += 12;

    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    const summaryLines = doc.splitTextToSize(result.summary, width);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 5 + 10;

    doc.setFontSize(13);
    doc.setTextColor(5, 150, 105);
    doc.text('Prioritized Issues', margin, y);
    y += 7;

    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    result.topIssues.forEach((item) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const lines = doc.splitTextToSize(
        `[${item.type}] ${item.issue} (${item.count} pages, ${item.difficulty} fix)`,
        width
      );
      doc.text(lines, margin, y);
      y += lines.length * 5 + 2;
    });

    doc.save(`OrganicIQ-Site-Audit-${Date.now()}.pdf`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 stroke-emerald-600';
    if (score >= 50) return 'text-amber-600 stroke-amber-600';
    return 'text-red-600 stroke-red-600';
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Technical Site Audit</h1>
          <p className="text-sm text-slate-500 mt-1">
            Inspect domain visibility, crawl bottlenecks, and prioritized fixes in seconds.
          </p>
        </div>
        {result && (
          <button
            type="button"
            onClick={handleExportAuditPdf}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Download size={14} /> Export PDF Report
          </button>
        )}
      </div>

      {/* Audit Input */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <form onSubmit={handleAudit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Enter website domain (e.g., stripe.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Auditing...' : 'Run Site Audit'}
          </button>
        </form>

        {loading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-slate-500 tabular-nums">
              <span>Verifying domain visibility &amp; crawl diagnostics</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
            <AlertCircle size={14} /> {error}
          </p>
        )}
      </div>

      {!result && !loading && (
        <div className="bg-white p-10 rounded-xl border border-slate-200 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-900">Ready to audit your website</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Run a live diagnostic on your active workspace domain or test a benchmark domain.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {['shopify.com', 'linear.app', 'webflow.com'].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setUrl(sample);
                  runAuditForUrl(sample);
                }}
                className="px-3 py-1.5 text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-md cursor-pointer"
              >
                Audit {sample}
              </button>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Visibility KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1">
              <p className="text-xs font-medium text-slate-500">Organic Traffic / mo</p>
              <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {result.metrics.organicMonthlyTraffic.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1">
              <p className="text-xs font-medium text-slate-500">Ranking Keywords</p>
              <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {result.metrics.organicKeywords.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1">
              <p className="text-xs font-medium text-slate-500">Estimated Backlinks</p>
              <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {result.metrics.backlinks.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-1">
              <p className="text-xs font-medium text-slate-500">Domain Authority</p>
              <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {result.metrics.domainAuthority} <span className="text-sm font-normal text-slate-400">/ 100</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Score & Breakdown */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col items-center text-center space-y-4">
                <h2 className="text-sm font-semibold text-slate-900 self-start">On-Page Health Score</h2>
                <div className="relative w-44 h-44">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="88" cy="88" r="78" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                    <circle
                      cx="88"
                      cy="88"
                      r="78"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={490}
                      strokeDashoffset={490 - (490 * result.score) / 100}
                      className={`transition-all duration-700 ${getScoreColor(result.score)}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`font-mono text-4xl font-bold tabular-nums ${getScoreColor(result.score).split(' ')[0]}`}>
                      {result.score}
                    </span>
                    <span className="text-xs font-medium text-slate-500 mt-1">
                      {result.score >= 80 ? 'Healthy' : result.score >= 50 ? 'Needs Work' : 'Critical'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{result.summary}</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">Issue Distribution</h3>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-700">
                      <AlertCircle size={14} className="text-red-600" /> Critical Errors
                    </span>
                    <span className="font-mono font-bold text-red-700 tabular-nums">
                      {result.healthBreakdown.critical}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-700">
                      <AlertTriangle size={14} className="text-amber-600" /> Warnings
                    </span>
                    <span className="font-mono font-bold text-amber-700 tabular-nums">
                      {result.healthBreakdown.warnings}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-700">
                      <CheckCircle size={14} className="text-emerald-600" /> Recommendations
                    </span>
                    <span className="font-mono font-bold text-emerald-700 tabular-nums">
                      {result.healthBreakdown.recommendations}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Issues & Crawled Pages */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900">Prioritized Action Plan</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {result.topIssues.map((issue, i) => (
                    <div key={i} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900">{issue.issue}</p>
                        <p className="text-xs text-slate-500">
                          <span
                            className={`font-semibold ${
                              issue.type === 'Critical'
                                ? 'text-red-700'
                                : issue.type === 'Warning'
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {issue.type}
                          </span>
                          {' · '}
                          <span>{issue.difficulty} Fix</span>
                          {' · '}
                          <span className="font-mono tabular-nums">{issue.count} pages</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDraftFromIssue(`How to fix ${issue.issue} for ${result.domain || url}`)}
                        className="px-3 py-1.5 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md inline-flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto cursor-pointer"
                      >
                        <PenTool size={12} /> Draft Fix Brief
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900">Pages Crawled</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500">
                        <th className="py-3 px-6">Path</th>
                        <th className="py-3 px-4">HTTP</th>
                        <th className="py-3 px-4">Load Time</th>
                        <th className="py-3 px-6">Findings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.pagesCrawled.map((page, i) => (
                        <tr key={i} className="hover:bg-slate-50/70">
                          <td className="py-3 px-6 font-mono text-slate-800 max-w-[220px] truncate" title={page.url}>
                            {page.url.replace(/https?:\/\/[^/]+/, '') || '/'}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold tabular-nums">
                            <span className={page.status === 200 ? 'text-emerald-700' : 'text-red-700'}>
                              {page.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              <Timer size={12} className="text-slate-400" /> {page.loadTime}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-slate-600">
                            {page.issues.length > 0 ? page.issues.join(' · ') : 'No issues'}
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

export default SeoAudit;