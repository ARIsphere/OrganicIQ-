import React, { useState } from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Loader2,
  Plus,
  RefreshCw,
  TrendingUp,
  X,
  AlertCircle,
} from 'lucide-react';
import { GscMonthlyMetric, GscSummaryData } from '../types';

interface GscMonthlyReportProps {
  isSignedIn: boolean;
  onSignIn: () => Promise<void>;
  signingIn: boolean;
  gscSummary: GscSummaryData | null;
  loading: boolean;
  error: string;
  onOpenConnectModal: () => void;
  onRefreshData: () => Promise<void>;
  onRecordSnapshot: (payload: {
    monthKey: string;
    clicks: number;
    impressions: number;
    avgPosition: number;
    indexedPages: number;
    topQuery: string;
  }) => Promise<void>;
}

const GscMonthlyReport: React.FC<GscMonthlyReportProps> = ({
  isSignedIn,
  onSignIn,
  signingIn,
  gscSummary,
  loading,
  error,
  onOpenConnectModal,
  onRefreshData,
  onRecordSnapshot,
}) => {
  const [range, setRange] = useState<'6m' | '12m'>('12m');
  const [chartMode, setChartMode] = useState<'traffic' | 'visibility'>('traffic');
  const [refreshing, setRefreshing] = useState(false);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [snapshotError, setSnapshotError] = useState('');

  const defaultMonth = new Date().toISOString().slice(0, 7);
  const [monthKey, setMonthKey] = useState(defaultMonth);
  const [clicksInput, setClicksInput] = useState('3200');
  const [impressionsInput, setImpressionsInput] = useState('78500');
  const [positionInput, setPositionInput] = useState('9.8');
  const [indexedInput, setIndexedInput] = useState('148');
  const [topQueryInput, setTopQueryInput] = useState('automated seo content workflow');

  const allMonths: GscMonthlyMetric[] = gscSummary?.months || [];
  const visibleMonths = range === '6m' ? allMonths.slice(-6) : allMonths;

  const totalClicks = visibleMonths.reduce((acc, m) => acc + m.clicks, 0);
  const totalImpressions = visibleMonths.reduce((acc, m) => acc + m.impressions, 0);
  const avgCtr =
    totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  const avgPos =
    visibleMonths.length > 0
      ? (
          visibleMonths.reduce((acc, m) => acc + m.avgPosition, 0) / visibleMonths.length
        ).toFixed(1)
      : '0.0';

  const latestMonth = visibleMonths[visibleMonths.length - 1];
  const prevMonth = visibleMonths.length > 1 ? visibleMonths[visibleMonths.length - 2] : null;

  const clicksMomDelta =
    latestMonth && prevMonth && prevMonth.clicks > 0
      ? (((latestMonth.clicks - prevMonth.clicks) / prevMonth.clicks) * 100).toFixed(1)
      : null;

  const impressionsMomDelta =
    latestMonth && prevMonth && prevMonth.impressions > 0
      ? (((latestMonth.impressions - prevMonth.impressions) / prevMonth.impressions) * 100).toFixed(1)
      : null;

  const posDelta =
    latestMonth && prevMonth
      ? (prevMonth.avgPosition - latestMonth.avgPosition).toFixed(1)
      : null;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefreshData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportCsv = () => {
    if (visibleMonths.length === 0) return;
    const header = 'Month,Property,Clicks,Impressions,CTR (%),Avg Position,Indexed Pages,Top Query';
    const rows = visibleMonths.map(
      (m) =>
        `"${m.monthLabel}","${gscSummary?.propertyUrl || ''}",${m.clicks},${m.impressions},${m.ctr.toFixed(
          2
        )},${m.avgPosition.toFixed(1)},${m.indexedPages},"${m.topQuery.replace(/"/g, '""')}"`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gsc-monthly-summary-${range}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSnapshot(true);
    setSnapshotError('');
    try {
      await onRecordSnapshot({
        monthKey,
        clicks: Number(clicksInput),
        impressions: Number(impressionsInput),
        avgPosition: Number(positionInput),
        indexedPages: Number(indexedInput),
        topQuery: topQueryInput,
      });
      setSnapshotOpen(false);
    } catch (err) {
      setSnapshotError(err instanceof Error ? err.message : 'Unable to save snapshot.');
    } finally {
      setSavingSnapshot(false);
    }
  };

  // Unauthenticated state
  if (!isSignedIn) {
    return (
      <section className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <p className="text-xs font-semibold text-emerald-700">Google Search Console Report</p>
          <h2 className="text-lg font-bold text-slate-900">
            Monthly SEO Performance Summary
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Sign in with Google to verify your workspace identity, connect your Search Console property, and track 12-month click, impression, CTR, and average position trends.
          </p>
        </div>
        <button
          type="button"
          onClick={onSignIn}
          disabled={signingIn}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          {signingIn ? <Loader2 size={15} className="animate-spin" /> : <TrendingUp size={15} />}
          {signingIn ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </section>
    );
  }

  // Loading skeleton state
  if (loading && !gscSummary) {
    return (
      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-60 bg-slate-100 rounded animate-pulse" />
            <div className="h-3.5 w-80 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="h-9 w-36 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="h-24 bg-slate-50 border border-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-72 bg-slate-50 border border-slate-100 rounded-lg animate-pulse" />
      </section>
    );
  }

  // Disconnected state
  if (!gscSummary?.connected) {
    return (
      <section className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <p className="text-xs font-semibold text-emerald-700">Monthly Search Console Summary</p>
          <h2 className="text-lg font-bold text-slate-900">
            No Search Console Property Connected
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Connect your verified domain property to unlock monthly organic click trends, impression volume charts, CTR progression, and top ranking query summaries.
          </p>
          {error && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1.5 pt-1">
              <AlertCircle size={13} /> {error}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenConnectModal}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <TrendingUp size={15} />
          Connect Search Console
        </button>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Report Header & Interactive Controls */}
      <div className="px-6 py-5 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Monthly SEO Performance Summary</h2>
            <span className="text-xs font-mono text-slate-500">
              · {gscSummary.propertyUrl}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Period rollup across {visibleMonths.length} months
            {gscSummary.lastSyncedAt
              ? ` · Last synced ${new Date(gscSummary.lastSyncedAt).toLocaleString()}`
              : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Filter */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setRange('6m')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                range === '6m' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6 Months
            </button>
            <button
              type="button"
              onClick={() => setRange('12m')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                range === '12m' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              12 Months
            </button>
          </div>

          {/* Chart Metric Switch */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setChartMode('traffic')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                chartMode === 'traffic' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Clicks &amp; Impressions
            </button>
            <button
              type="button"
              onClick={() => setChartMode('visibility')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                chartMode === 'visibility' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Position &amp; CTR
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSnapshotOpen(true)}
            className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Plus size={13} /> Log Month
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Sync
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-100 text-xs text-red-700 font-medium flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* 4 Summary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border-b border-slate-200">
        <div className="p-5 space-y-1.5">
          <p className="text-xs font-medium text-slate-500">Total Organic Clicks</p>
          <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {totalClicks.toLocaleString()}
          </p>
          {clicksMomDelta !== null && (
            <p
              className={`text-xs font-medium inline-flex items-center gap-1 tabular-nums ${
                Number(clicksMomDelta) >= 0 ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {Number(clicksMomDelta) >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {Number(clicksMomDelta) >= 0 ? `+${clicksMomDelta}%` : `${clicksMomDelta}%`} MoM ({latestMonth?.monthLabel})
            </p>
          )}
        </div>

        <div className="p-5 space-y-1.5">
          <p className="text-xs font-medium text-slate-500">Total Search Impressions</p>
          <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {totalImpressions.toLocaleString()}
          </p>
          {impressionsMomDelta !== null && (
            <p
              className={`text-xs font-medium inline-flex items-center gap-1 tabular-nums ${
                Number(impressionsMomDelta) >= 0 ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {Number(impressionsMomDelta) >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {Number(impressionsMomDelta) >= 0 ? `+${impressionsMomDelta}%` : `${impressionsMomDelta}%`} MoM
            </p>
          )}
        </div>

        <div className="p-5 space-y-1.5">
          <p className="text-xs font-medium text-slate-500">Blended Click-Through Rate</p>
          <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">{avgCtr}%</p>
          <p className="text-xs text-slate-500 tabular-nums">
            Latest month: {latestMonth ? `${latestMonth.ctr.toFixed(2)}%` : '—'}
          </p>
        </div>

        <div className="p-5 space-y-1.5">
          <p className="text-xs font-medium text-slate-500">Mean SERP Position</p>
          <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums">{avgPos}</p>
          {posDelta !== null && (
            <p
              className={`text-xs font-medium inline-flex items-center gap-1 tabular-nums ${
                Number(posDelta) >= 0 ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {Number(posDelta) >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {Number(posDelta) >= 0 ? `Improved ${posDelta} spots` : `Dropped ${Math.abs(Number(posDelta))} spots`} MoM
            </p>
          )}
        </div>
      </div>

      {/* Dual Monthly Charts */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 border-b border-slate-200">
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              {chartMode === 'traffic'
                ? 'Monthly Organic Clicks vs. Search Impressions'
                : 'Monthly Average SERP Position vs. CTR (%)'}
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {visibleMonths.length > 0
                ? `${visibleMonths[0]?.monthLabel} – ${latestMonth?.monthLabel}`
                : 'No months'}
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
              {chartMode === 'traffic' ? (
                <ComposedChart data={visibleMonths}>
                  <defs>
                    <linearGradient id="gscMonthlyClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="monthLabel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    dy={8}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="impressions"
                    name="Impressions"
                    fill="#e2e8f0"
                    radius={[3, 3, 0, 0]}
                    barSize={18}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="clicks"
                    name="Clicks"
                    stroke="#059669"
                    strokeWidth={2.25}
                    fill="url(#gscMonthlyClicks)"
                  />
                </ComposedChart>
              ) : (
                <ComposedChart data={visibleMonths}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="monthLabel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    dy={8}
                  />
                  <YAxis
                    yAxisId="pos"
                    reversed
                    domain={['auto', 'auto']}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis
                    yAxisId="ctr"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    yAxisId="pos"
                    type="monotone"
                    dataKey="avgPosition"
                    name="Avg Position (lower is better)"
                    stroke="#0f172a"
                    strokeWidth={2.25}
                    dot={{ r: 3, fill: '#0f172a' }}
                  />
                  <Line
                    yAxisId="ctr"
                    type="monotone"
                    dataKey="ctr"
                    name="CTR (%)"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#059669' }}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Indexed Pages Growth</h3>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {latestMonth ? `${latestMonth.indexedPages} pages` : '—'}
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
              <LineChart data={visibleMonths}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="monthLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  domain={['dataMin - 10', 'dataMax + 10']}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: 'none',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="indexedPages"
                  name="Indexed Pages"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: '#0284c7' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500">
              <th className="py-3 px-6">Month</th>
              <th className="py-3 px-4 text-right">Clicks</th>
              <th className="py-3 px-4 text-right">Impressions</th>
              <th className="py-3 px-4 text-right">CTR</th>
              <th className="py-3 px-4 text-right">Avg Position</th>
              <th className="py-3 px-4 text-right">Indexed Pages</th>
              <th className="py-3 px-6">Top Ranking Query</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[...visibleMonths].reverse().map((row) => (
              <tr key={row.monthKey} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-6 font-semibold text-slate-900 whitespace-nowrap">
                  {row.monthLabel}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-800 tabular-nums">
                  {row.clicks.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-600 tabular-nums">
                  {row.impressions.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold tabular-nums">
                  {row.ctr.toFixed(2)}%
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-800 tabular-nums">
                  {row.avgPosition.toFixed(1)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-600 tabular-nums">
                  {row.indexedPages.toLocaleString()}
                </td>
                <td className="py-3 px-6 text-slate-700 max-w-xs truncate">{row.topQuery}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Monthly GSC Snapshot Modal */}
      {snapshotOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Log Monthly GSC Snapshot</h3>
              <button
                type="button"
                onClick={() => setSnapshotOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSnapshot} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Month (YYYY-MM)</label>
                  <input
                    type="month"
                    required
                    value={monthKey}
                    onChange={(e) => setMonthKey(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Indexed Pages</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={indexedInput}
                    onChange={(e) => setIndexedInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clicks</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={clicksInput}
                    onChange={(e) => setClicksInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Impressions</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={impressionsInput}
                    onChange={(e) => setImpressionsInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Avg Position</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="100"
                    required
                    value={positionInput}
                    onChange={(e) => setPositionInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Top Query</label>
                <input
                  type="text"
                  required
                  value={topQueryInput}
                  onChange={(e) => setTopQueryInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              {snapshotError && <p className="text-xs text-red-600">{snapshotError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSnapshotOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSnapshot}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  {savingSnapshot ? 'Saving...' : 'Save Month'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default GscMonthlyReport;
