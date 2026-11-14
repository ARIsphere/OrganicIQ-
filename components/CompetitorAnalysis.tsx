import React, { useState } from 'react';
import {
  Globe,
  ShieldAlert,
  ShieldCheck,
  Target,
  Plus,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { analyzeCompetitor } from '../services/geminiService';
import { CompetitorInsight, KeywordData, WorkspaceState } from '../types';

interface CompetitorAnalysisProps {
  workspace: WorkspaceState;
  onAddCompetitor: (comp: CompetitorInsight) => void;
  onDeleteCompetitor: (index: number) => void;
  onTrackKeywordFromGap: (kw: KeywordData) => void;
}

const CompetitorAnalysis: React.FC<CompetitorAnalysisProps> = ({
  workspace,
  onAddCompetitor,
  onDeleteCompetitor,
  onTrackKeywordFromGap,
}) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [sizeFilter, setSizeFilter] = useState('All');

  const competitors = workspace.competitors;
  const trackedSet = new Set(workspace.trackedKeywords.map((k) => k.keyword.toLowerCase()));

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await analyzeCompetitor(url.trim());
      onAddCompetitor(result);
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to analyze competitor URL.');
    } finally {
      setLoading(false);
    }
  };

  const industries = ['All', ...new Set(competitors.map((c) => c.industry))];
  const sizes = ['All', ...new Set(competitors.map((c) => c.companySize))];

  const filteredCompetitors = competitors.filter((c) => {
    const matchesIndustry = industryFilter === 'All' || c.industry === industryFilter;
    const matchesSize = sizeFilter === 'All' || c.companySize === sizeFilter;
    return matchesIndustry && matchesSize;
  });

  const handleTrackTerm = (term: string) => {
    onTrackKeywordFromGap({
      keyword: term,
      searchVolume: 1400,
      difficulty: 'Low',
      intent: 'Commercial',
      cpcEstimate: '$3.50',
      articleTitleIdea: `How to Outrank Competitors on ${term}`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Competitor Spy</h1>
        <p className="text-sm text-slate-500 mt-1">
          Analyze rival domains via live search grounding and capture their ranking keywords into your strategy.
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
        <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Enter competitor domain or URL (e.g., ahrefs.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {loading ? 'Analyzing...' : 'Analyze Competitor'}
          </button>
        </form>

        {error && (
          <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
            <AlertCircle size={14} /> {error}
          </p>
        )}
      </div>

      {/* Filters */}
      {competitors.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 outline-none focus:border-emerald-600"
            >
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  Industry: {ind}
                </option>
              ))}
            </select>

            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 outline-none focus:border-emerald-600"
            >
              {sizes.map((size) => (
                <option key={size} value={size}>
                  Size: {size}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs font-mono text-slate-500 tabular-nums">
            Showing {filteredCompetitors.length} of {competitors.length}
          </span>
        </div>
      )}

      {/* Empty State */}
      {competitors.length === 0 && !loading && (
        <div className="py-14 text-center bg-white rounded-xl border border-slate-200 space-y-2">
          <Target size={32} className="mx-auto text-slate-300" />
          <p className="text-sm font-semibold text-slate-800">No competitors profiled yet</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Add a competitor domain above to uncover their strengths, technical weaknesses, and target keywords.
          </p>
        </div>
      )}

      {/* Competitor Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCompetitors.map((data, index) => (
          <div
            key={`${data.competitorName}-${index}`}
            className="bg-white p-6 rounded-xl border border-slate-200 space-y-5 relative"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900 truncate">{data.competitorName}</h3>
                <p className="text-xs text-slate-500">
                  {data.industry} · {data.companySize} · {data.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDeleteCompetitor(index)}
                aria-label={`Remove ${data.competitorName}`}
                className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg cursor-pointer shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>

            {data.contentGapOpportunity && (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-xs font-semibold text-emerald-700">Content Gap Opportunity</p>
                <p className="text-xs text-slate-700 leading-relaxed">{data.contentGapOpportunity}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" /> Strengths
                </h4>
                <ul className="space-y-1.5">
                  {data.strengths.slice(0, 3).map((s, i) => (
                    <li key={i} className="text-xs text-slate-700 leading-relaxed">
                      • {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-amber-600" /> Weaknesses
                </h4>
                <ul className="space-y-1.5">
                  {data.weaknesses.slice(0, 3).map((w, i) => (
                    <li key={i} className="text-xs text-slate-700 leading-relaxed">
                      • {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <p className="text-xs font-semibold text-slate-500">Top Keywords (click to track)</p>
              <div className="flex flex-wrap gap-2">
                {data.topKeywords.map((k, i) => {
                  const isTracked = trackedSet.has(k.toLowerCase());
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleTrackTerm(k)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors inline-flex items-center gap-1 cursor-pointer ${
                        isTracked
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isTracked ? <Check size={11} /> : <Plus size={11} />}
                      {k}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompetitorAnalysis;