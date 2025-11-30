import React, { useState } from 'react';
import { Globe, Search, ShieldAlert, ShieldCheck, Target, Filter, Plus, Trash2, Building2, Users, MapPin } from 'lucide-react';
import { analyzeCompetitor } from '../services/geminiService';
import { CompetitorInsight } from '../types';

const CompetitorAnalysis: React.FC = () => {
  const [url, setUrl] = useState('');
  const [competitors, setCompetitors] = useState<CompetitorInsight[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filter States
  const [industryFilter, setIndustryFilter] = useState('All');
  const [sizeFilter, setSizeFilter] = useState('All');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    try {
      const result = await analyzeCompetitor(url);
      setCompetitors(prev => [result, ...prev]);
      setUrl('');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (index: number) => {
    setCompetitors(prev => prev.filter((_, i) => i !== index));
  };

  // Get unique values for filters
  const industries = ['All', ...new Set(competitors.map(c => c.industry))];
  const sizes = ['All', ...new Set(competitors.map(c => c.companySize))];

  // Apply filters
  const filteredCompetitors = competitors.filter(c => {
    const matchesIndustry = industryFilter === 'All' || c.industry === industryFilter;
    const matchesSize = sizeFilter === 'All' || c.companySize === sizeFilter;
    return matchesIndustry && matchesSize;
  });

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Competitor Analysis</h2>
          <p className="text-slate-500 mt-1">Spy on competitor strategies and track them by industry.</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <form onSubmit={handleAnalyze} className="flex gap-4">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="url"
              placeholder="Enter competitor URL to track (e.g., https://competitor.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center whitespace-nowrap"
          >
            {loading ? 'Analyzing...' : <><Plus size={18} className="mr-2" /> Add Competitor</>}
          </button>
        </form>
      </div>

      {/* Filters & List */}
      <div className="flex-1 space-y-6">
        {competitors.length > 0 && (
          <div className="flex flex-wrap gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center text-slate-500 text-sm font-medium mr-2">
              <Filter size={16} className="mr-2" /> Filters:
            </div>
            
            <select 
              value={industryFilter} 
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-indigo-500"
            >
              {industries.map(ind => <option key={ind} value={ind}>Industry: {ind}</option>)}
            </select>

            <select 
              value={sizeFilter} 
              onChange={(e) => setSizeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-indigo-500"
            >
              {sizes.map(size => <option key={size} value={size}>Size: {size}</option>)}
            </select>
            
            <div className="ml-auto text-sm text-slate-400">
              Showing {filteredCompetitors.length} of {competitors.length}
            </div>
          </div>
        )}

        {filteredCompetitors.length === 0 && competitors.length > 0 && (
            <div className="text-center py-12 text-slate-400">
                No competitors match the selected filters.
            </div>
        )}

        {competitors.length === 0 && !loading && (
             <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
                <Target size={48} className="mx-auto mb-3 opacity-20" />
                <p>No competitors tracked yet. Add a URL above.</p>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {filteredCompetitors.map((data, index) => (
             <div key={index} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative group">
                <button 
                    onClick={() => handleDelete(index)}
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                >
                    <Trash2 size={16} />
                </button>

                <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl flex-shrink-0">
                        {data.competitorName.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">{data.competitorName}</h3>
                        <div className="flex gap-2 mt-1 flex-wrap">
                             <span className="flex items-center text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                <Building2 size={10} className="mr-1"/> {data.industry}
                             </span>
                             <span className="flex items-center text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                <Users size={10} className="mr-1"/> {data.companySize}
                             </span>
                             <span className="flex items-center text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                <MapPin size={10} className="mr-1"/> {data.location}
                             </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                            <ShieldCheck size={14} className="mr-1 text-emerald-500" /> Strengths
                        </h4>
                        <ul className="space-y-1">
                            {data.strengths.slice(0, 2).map((s, i) => (
                                <li key={i} className="text-sm text-slate-600 truncate">• {s}</li>
                            ))}
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                             <ShieldAlert size={14} className="mr-1 text-amber-500" /> Weaknesses
                        </h4>
                         <ul className="space-y-1">
                            {data.weaknesses.slice(0, 2).map((s, i) => (
                                <li key={i} className="text-sm text-slate-600 truncate">• {s}</li>
                            ))}
                        </ul>
                    </div>

                     <div>
                         <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                             Top Keywords
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {data.topKeywords.slice(0, 3).map((k, i) => (
                                <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium border border-blue-100">
                                    {k}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompetitorAnalysis;