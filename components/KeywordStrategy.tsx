import React, { useState } from 'react';
import {
  Search,
  Loader2,
  TrendingUp,
  Check,
  PenTool,
  CalendarPlus,
  AlertCircle,
} from 'lucide-react';
import { generateKeywordStrategy } from '../services/geminiService';
import { KeywordData, WorkspaceState } from '../types';
import { SUPPORTED_LANGUAGES } from '../services/workspaceStore';

interface KeywordStrategyProps {
  workspace: WorkspaceState;
  onToggleTrackKeyword: (kw: KeywordData) => void;
  onQueueKeyword: (kw: KeywordData) => void;
  onWriteFromKeyword: (kw: KeywordData) => void;
}

const KeywordStrategy: React.FC<KeywordStrategyProps> = ({
  workspace,
  onToggleTrackKeyword,
  onQueueKeyword,
  onWriteFromKeyword,
}) => {
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState(workspace.brandProfile.language || 'English');
  const [keywords, setKeywords] = useState<KeywordData[]>(workspace.trackedKeywords);
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [queuedNotice, setQueuedNotice] = useState<string | null>(null);

  const trackedSet = new Set(workspace.trackedKeywords.map((k) => k.keyword.toLowerCase()));

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError('');
    try {
      const results = await generateKeywordStrategy(topic.trim(), {
        language,
        domain: workspace.brandProfile.domain,
      });
      setKeywords(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch keyword strategy.');
    } finally {
      setLoading(false);
    }
  };

  const filteredKeywords = keywords.filter((k) => {
    if (difficultyFilter === 'All') return true;
    return k.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
  });

  const handleQueue = (kw: KeywordData) => {
    onQueueKeyword(kw);
    setQueuedNotice(kw.keyword);
    setTimeout(() => setQueuedNotice(null), 2200);
  };

  const getDifficultyTextColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'low':
        return 'text-emerald-700';
      case 'medium':
        return 'text-amber-700';
      case 'high':
        return 'text-red-700';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Keyword &amp; AI-Search Strategy</h1>
          <p className="text-sm text-slate-500 mt-1">
            Uncover low-competition Google keywords and conversational ChatGPT / Perplexity buyer queries.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500 tabular-nums">
          {workspace.trackedKeywords.length} tracked in workspace
        </span>
      </div>

      {/* Discovery Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Enter topic or product category (e.g., 'B2B invoice automation', 'specialty coffee')"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 outline-none transition-colors"
            />
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Target language"
            className="px-3.5 py-3 text-sm rounded-lg border border-slate-200 bg-white focus:border-emerald-600 outline-none"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin" size={17} /> : <TrendingUp size={17} />}
            {loading ? 'Researching...' : 'Discover Keywords'}
          </button>
        </form>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
            <AlertCircle size={14} /> {error}
          </div>
        )}
      </div>

      {/* Filter Bar & Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
            {(['All', 'Low', 'Medium', 'High'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficultyFilter(level)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  difficultyFilter === level
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {level === 'All' ? 'All Difficulties' : `${level} KD`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            {queuedNotice && (
              <span className="text-emerald-700 font-semibold">
                Added &ldquo;{queuedNotice}&rdquo; to Autopilot Queue
              </span>
            )}
            <button
              type="button"
              onClick={() => setKeywords(workspace.trackedKeywords)}
              className="font-medium text-slate-700 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
            >
              Show Saved Tracked ({workspace.trackedKeywords.length})
            </button>
          </div>
        </div>

        {filteredKeywords.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No keywords match the current filter. Enter a niche above or switch filter tabs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-3.5 px-6">Keyword &amp; Suggested Title</th>
                  <th className="py-3.5 px-4 text-right">Monthly Vol</th>
                  <th className="py-3.5 px-4">Difficulty</th>
                  <th className="py-3.5 px-4">Intent</th>
                  <th className="py-3.5 px-4 text-right">Est. CPC</th>
                  <th className="py-3.5 px-6 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredKeywords.map((k, i) => {
                  const isTracked = trackedSet.has(k.keyword.toLowerCase());
                  return (
                    <tr key={`${k.keyword}-${i}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6 max-w-sm">
                        <p className="font-semibold text-slate-900">{k.keyword}</p>
                        {k.articleTitleIdea && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">{k.articleTitleIdea}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700 tabular-nums">
                        {k.searchVolume.toLocaleString()}
                      </td>
                      <td className={`py-3.5 px-4 text-xs font-semibold ${getDifficultyTextColor(k.difficulty)}`}>
                        {k.difficulty}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">{k.intent}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-600 tabular-nums">
                        {k.cpcEstimate || '—'}
                      </td>
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onToggleTrackKeyword(k)}
                            className={`px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors inline-flex items-center gap-1 cursor-pointer ${
                              isTracked
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {isTracked && <Check size={12} />}
                            {isTracked ? 'Tracked' : 'Track'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQueue(k)}
                            title="Add to Autopilot Queue"
                            className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CalendarPlus size={12} /> Queue
                          </button>
                          <button
                            type="button"
                            onClick={() => onWriteFromKeyword(k)}
                            className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white inline-flex items-center gap-1 cursor-pointer"
                          >
                            <PenTool size={12} /> Write
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default KeywordStrategy;