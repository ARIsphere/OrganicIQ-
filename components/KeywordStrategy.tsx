import React, { useState } from 'react';
import { Search, Loader2, TrendingUp, BarChart2, CheckCircle2 } from 'lucide-react';
import { generateKeywordStrategy } from '../services/geminiService';
import { KeywordData } from '../types';

const KeywordStrategy: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const results = await generateKeywordStrategy(topic);
      setKeywords(results);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'high': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Keyword Strategy</h2>
          <p className="text-slate-500 mt-1">Uncover high-potential keywords for your niche using AI.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Enter a topic or niche (e.g., 'Sustainable Coffee', 'SaaS Marketing')"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !topic}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : <TrendingUp className="mr-2" size={20} />}
            Generate Strategy
          </button>
        </form>
      </div>

      {keywords.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-semibold text-slate-600 text-sm">Keyword</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Search Volume</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Difficulty</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Intent</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {keywords.map((k, i) => (
                  <tr key={i} className="hover:bg-slate-50 group transition-colors">
                    <td className="p-4 font-medium text-slate-800">{k.keyword}</td>
                    <td className="p-4 text-slate-600 flex items-center">
                       <BarChart2 size={14} className="mr-2 text-slate-400"/> {k.searchVolume.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(k.difficulty)}`}>
                        {k.difficulty}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 capitalize">{k.intent}</td>
                    <td className="p-4">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <CheckCircle2 size={14} className="mr-1"/> Track
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeywordStrategy;