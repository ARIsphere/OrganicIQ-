import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  X,
  Link2,
  Calendar,
  FileText,
  Loader2,
} from 'lucide-react';
import { AppView, AutopilotArticle, GscSummaryData, WorkspaceState } from '../types';
import GscMonthlyReport from './GscMonthlyReport';

interface DashboardProps {
  workspace: WorkspaceState;
  isSignedIn: boolean;
  signingIn: boolean;
  onSignIn: () => Promise<void>;
  gscSummary: GscSummaryData | null;
  gscLoading: boolean;
  gscError: string;
  onNavigate: (view: AppView) => void;
  onConnectGsc: (property: string) => Promise<void>;
  onDisconnectGsc: () => Promise<void>;
  onRefreshGsc: () => Promise<void>;
  onRecordGscSnapshot: (payload: {
    monthKey: string;
    clicks: number;
    impressions: number;
    avgPosition: number;
    indexedPages: number;
    topQuery: string;
  }) => Promise<void>;
  onOpenArticleInStudio: (article: AutopilotArticle) => void;
}

const performanceData = [
  { name: 'Mon', clicks: 184, impressions: 3200 },
  { name: 'Tue', clicks: 212, impressions: 3650 },
  { name: 'Wed', clicks: 198, impressions: 3420 },
  { name: 'Thu', clicks: 245, impressions: 4100 },
  { name: 'Fri', clicks: 289, impressions: 4780 },
  { name: 'Sat', clicks: 318, impressions: 5120 },
  { name: 'Sun', clicks: 342, impressions: 5490 },
];

const rankingDistribution = [
  { range: 'Pos 1–3', count: 14 },
  { range: 'Pos 4–10', count: 31 },
  { range: 'Pos 11–20', count: 48 },
  { range: 'Pos 20+', count: 76 },
];

const Dashboard: React.FC<DashboardProps> = ({
  workspace,
  isSignedIn,
  signingIn,
  onSignIn,
  gscSummary,
  gscLoading,
  gscError,
  onNavigate,
  onConnectGsc,
  onDisconnectGsc,
  onRefreshGsc,
  onRecordGscSnapshot,
  onOpenArticleInStudio,
}) => {
  const [gscModalOpen, setGscModalOpen] = useState(false);
  const [propertyInput, setPropertyInput] = useState(
    gscSummary?.propertyUrl ||
      workspace.brandProfile.gscProperty ||
      `sc-domain:${workspace.brandProfile.domain || 'example.com'}`
  );
  const [savingGsc, setSavingGsc] = useState(false);
  const [modalError, setModalError] = useState('');

  const { brandProfile, trackedKeywords, autopilotQueue, latestAudit } = workspace;
  const publishedCount = autopilotQueue.filter((a) => a.status === 'Published').length;
  const scheduledCount = autopilotQueue.filter((a) => a.status !== 'Published').length;
  const gscActive = Boolean(gscSummary?.connected || brandProfile.gscConnected);

  const handleOpenGscModal = () => {
    setModalError('');
    setPropertyInput(
      gscSummary?.propertyUrl ||
        brandProfile.gscProperty ||
        `sc-domain:${brandProfile.domain || 'example.com'}`
    );
    setGscModalOpen(true);
  };

  const handleGscSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyInput.trim()) return;
    setSavingGsc(true);
    setModalError('');
    try {
      await onConnectGsc(propertyInput.trim());
      setGscModalOpen(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Unable to connect property.');
    } finally {
      setSavingGsc(false);
    }
  };

  const handleGscDisconnect = async () => {
    setSavingGsc(true);
    setModalError('');
    try {
      await onDisconnectGsc();
      setGscModalOpen(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Unable to disconnect property.');
    } finally {
      setSavingGsc(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Growth Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            {brandProfile.brandName} ·{' '}
            {brandProfile.cadence === 'daily'
              ? 'Daily cadence'
              : brandProfile.cadence === '3x_week'
              ? '3x weekly cadence'
              : 'Weekly cadence'}{' '}
            · Target CMS: {brandProfile.connectedCms}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {gscActive ? (
            <button
              type="button"
              onClick={handleOpenGscModal}
              className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <CheckCircle2 size={16} className="text-emerald-600" />
              Search Console Synced
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenGscModal}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <TrendingUp size={16} />
              Connect Search Console
            </button>
          )}
        </div>
      </div>

      {/* Live Workspace KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
          <p className="text-xs font-medium text-slate-500">Tracked Keywords</p>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold text-slate-900 tabular-nums">
              {trackedKeywords.length}
            </span>
            <button
              type="button"
              onClick={() => onNavigate(AppView.KEYWORDS)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              Discover more
            </button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
          <p className="text-xs font-medium text-slate-500">Autopilot Queue</p>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold text-slate-900 tabular-nums">
              {scheduledCount}
            </span>
            <span className="text-xs text-slate-500 tabular-nums">{publishedCount} published</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
          <p className="text-xs font-medium text-slate-500">Site Health Score</p>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold text-slate-900 tabular-nums">
              {latestAudit ? `${latestAudit.score}/100` : '—'}
            </span>
            <button
              type="button"
              onClick={() => onNavigate(AppView.AUDIT)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              {latestAudit ? 'View audit' : 'Run audit'}
            </button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
          <p className="text-xs font-medium text-slate-500">CMS Publishing Target</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{brandProfile.connectedCms}</span>
            <button
              type="button"
              onClick={() => onNavigate(AppView.AUTOPILOT)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              Configure
            </button>
          </div>
        </div>
      </div>

      {/* NEW: Monthly SEO Performance Summary Report (GSC Connection) */}
      <GscMonthlyReport
        isSignedIn={isSignedIn}
        onSignIn={onSignIn}
        signingIn={signingIn}
        gscSummary={gscSummary}
        loading={gscLoading}
        error={gscError}
        onOpenConnectModal={handleOpenGscModal}
        onRefreshData={onRefreshGsc}
        onRecordSnapshot={onRecordGscSnapshot}
      />

      {/* Weekly Pulse & Ranking Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">7-Day Search Velocity</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {gscActive
                  ? `Property: ${gscSummary?.propertyUrl || brandProfile.gscProperty} · Rolling daily clicks`
                  : 'Connect Search Console above to sync live site telemetry'}
              </p>
            </div>
            <span className="font-mono text-xs text-emerald-700 font-semibold tabular-nums">+18.4% WoW</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="organicClicksFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.14} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: 'none',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="clicks" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#organicClicksFill)" />
                <Area type="monotone" dataKey="impressions" stroke="#0f172a" strokeWidth={1.5} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-slate-900">Ranking Distribution</h2>
            <p className="text-xs text-slate-500 mt-0.5">Tracked terms across SERP positions</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
              <BarChart data={rankingDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="range" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} width={68} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Upcoming Autopilot Queue */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Calendar size={18} className="text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">Upcoming Autopilot Publishing Queue</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(AppView.AUTOPILOT)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 whitespace-nowrap cursor-pointer"
          >
            Manage Autopilot Queue <ArrowRight size={14} />
          </button>
        </div>

        {autopilotQueue.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <FileText size={28} className="mx-auto text-slate-300" />
            <p className="text-sm text-slate-600">Your publishing queue is empty.</p>
            <button
              type="button"
              onClick={() => onNavigate(AppView.AUTOPILOT)}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              Build Schedule from Keywords
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {autopilotQueue.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{item.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono tabular-nums">{item.scheduledDate}</span>
                    <span aria-hidden="true">·</span>
                    <span>Keyword: {item.keyword}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.targetCms}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.language}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span
                    className={`text-xs font-semibold ${
                      item.status === 'Published'
                        ? 'text-emerald-700'
                        : item.status === 'Draft Ready'
                        ? 'text-blue-700'
                        : 'text-slate-600'
                    }`}
                  >
                    {item.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenArticleInStudio(item)}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Open in Studio
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Google Search Console Connection Modal */}
      {gscModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Google Search Console Sync</h3>
              <button
                type="button"
                onClick={() => setGscModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {!isSignedIn ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Sign in with your Google account first to save your verified Search Console property and monthly performance reports.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setGscModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onSignIn}
                    disabled={signingIn}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    {signingIn ? 'Signing in...' : 'Sign in with Google'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGscSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Verified Property Identifier
                  </label>
                  <div className="relative">
                    <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={propertyInput}
                      onChange={(e) => setPropertyInput(e.target.value)}
                      placeholder="sc-domain:yourdomain.com"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Links monthly organic performance trends and prevents duplicate keyword targeting in your autopilot queue.
                  </p>
                </div>

                {modalError && <p className="text-xs text-red-600 font-medium">{modalError}</p>}

                <div className="flex items-center justify-end gap-3 pt-2">
                  {gscActive && (
                    <button
                      type="button"
                      onClick={handleGscDisconnect}
                      disabled={savingGsc}
                      className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      Disconnect
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={savingGsc}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {savingGsc && <Loader2 size={13} className="animate-spin" />}
                    Save &amp; Sync Property
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

export default Dashboard;
