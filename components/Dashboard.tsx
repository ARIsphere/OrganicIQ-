import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, Users, Eye, MousePointer2, ArrowUpRight } from 'lucide-react';

// Simulated Data for GSC
const performanceData = [
  { name: 'Mon', clicks: 120, impressions: 2400 },
  { name: 'Tue', clicks: 132, impressions: 2600 },
  { name: 'Wed', clicks: 101, impressions: 2100 },
  { name: 'Thu', clicks: 134, impressions: 2800 },
  { name: 'Fri', clicks: 190, impressions: 3200 },
  { name: 'Sat', clicks: 230, impressions: 3800 },
  { name: 'Sun', clicks: 210, impressions: 3600 },
];

const rankingDistribution = [
  { range: 'Top 3', count: 12 },
  { range: '4-10', count: 28 },
  { range: '11-20', count: 45 },
  { range: '20+', count: 80 },
];

const StatCard: React.FC<{ title: string; value: string; change: string; icon: React.ReactNode; color: string }> = ({ title, value, change, icon, color }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      <span className="text-emerald-600 text-xs font-semibold flex items-center mt-2">
        <ArrowUpRight size={12} className="mr-1" /> {change} this week
      </span>
    </div>
    <div className={`p-3 rounded-lg ${color} text-white`}>
      {icon}
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center">
          <TrendingUp size={16} className="mr-2" />
          Connect Search Console
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Clicks" 
          value="1,204" 
          change="+12.5%" 
          icon={<MousePointer2 size={20} />} 
          color="bg-blue-500"
        />
        <StatCard 
          title="Total Impressions" 
          value="45.2k" 
          change="+8.1%" 
          icon={<Eye size={20} />} 
          color="bg-purple-500"
        />
        <StatCard 
          title="Avg. Position" 
          value="14.2" 
          change="+2.4" 
          icon={<TrendingUp size={20} />} 
          color="bg-orange-500"
        />
        <StatCard 
          title="Indexed Pages" 
          value="128" 
          change="+4" 
          icon={<Users size={20} />} 
          color="bg-emerald-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Performance (Last 7 Days)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" />
                <Area type="monotone" dataKey="impressions" stroke="#a855f7" strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
           <h3 className="text-lg font-semibold text-slate-800 mb-4">Keyword Rankings</h3>
           <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankingDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="range" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} width={50}/>
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px'}} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
