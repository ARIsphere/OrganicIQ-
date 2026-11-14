import React, { useState } from 'react';
import {
  Globe,
  Loader2,
  Check,
  CalendarPlus,
  Trash2,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import {
  AutopilotArticle,
  BrandProfile,
  KeywordData,
  WorkspaceState,
} from '../types';
import {
  CMS_TARGETS,
  SUPPORTED_LANGUAGES,
  createQueueItemFromKeyword,
} from '../services/workspaceStore';

interface AutopilotSetupProps {
  workspace: WorkspaceState;
  onScanDomain: (domain: string) => Promise<void>;
  onUpdateBrandProfile: (updated: BrandProfile) => void;
  onGenerateQueueFromKeywords: (items: AutopilotArticle[]) => void;
  onRemoveQueueItem: (id: string) => void;
  onOpenArticleInStudio: (article: AutopilotArticle) => void;
}

const AutopilotSetup: React.FC<AutopilotSetupProps> = ({
  workspace,
  onScanDomain,
  onUpdateBrandProfile,
  onGenerateQueueFromKeywords,
  onRemoveQueueItem,
  onOpenArticleInStudio,
}) => {
  const [domainInput, setDomainInput] = useState(workspace.brandProfile.domain || '');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  const [profileForm, setProfileForm] = useState<BrandProfile>(workspace.brandProfile);
  const [newPillar, setNewPillar] = useState('');

  React.useEffect(() => {
    setProfileForm(workspace.brandProfile);
    if (workspace.brandProfile.domain) {
      setDomainInput(workspace.brandProfile.domain);
    }
  }, [workspace.brandProfile]);

  const handleDomainScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;
    setScanning(true);
    setScanError('');
    try {
      await onScanDomain(domainInput.trim());
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Domain scan failed.');
    } finally {
      setScanning(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBrandProfile(profileForm);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleAddPillar = () => {
    if (!newPillar.trim()) return;
    const updated = {
      ...profileForm,
      contentPillars: [...profileForm.contentPillars, newPillar.trim()],
    };
    setProfileForm(updated);
    onUpdateBrandProfile(updated);
    setNewPillar('');
  };

  const handleRemovePillar = (index: number) => {
    const updated = {
      ...profileForm,
      contentPillars: profileForm.contentPillars.filter((_, i) => i !== index),
    };
    setProfileForm(updated);
    onUpdateBrandProfile(updated);
  };

  const handleAutoSchedule = () => {
    const sourceKeywords: KeywordData[] =
      workspace.trackedKeywords.length > 0
        ? workspace.trackedKeywords
        : profileForm.contentPillars.map((pillar) => ({
            keyword: pillar.toLowerCase(),
            searchVolume: 1200,
            difficulty: 'Low',
            intent: 'Informational',
            articleTitleIdea: `${profileForm.brandName || 'Complete'} Guide to ${pillar}`,
          }));

    const existingKeywords = new Set(workspace.autopilotQueue.map((q) => q.keyword.toLowerCase()));
    const dayStep = profileForm.cadence === 'daily' ? 1 : profileForm.cadence === '3x_week' ? 2 : 7;

    const created = sourceKeywords
      .filter((k) => !existingKeywords.has(k.keyword.toLowerCase()))
      .slice(0, 7)
      .map((k, idx) => createQueueItemFromKeyword(k, profileForm, (idx + 1) * dayStep));

    if (created.length > 0) {
      onGenerateQueueFromKeywords(created);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Autopilot &amp; Brand Voice</h1>
        <p className="text-sm text-slate-500 mt-1">
          Train OrganicIQ on your website, choose your publishing cadence and language, and connect your CMS target.
        </p>
      </div>

      {/* Domain Absorption Scanner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">01. Website &amp; Brand Voice Scanner</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your live URL to extract brand voice rules, target persona, content pillars, and starter keywords.
            </p>
          </div>
          {profileForm.lastScannedAt && (
            <span className="text-xs font-mono text-slate-500">
              Last scanned: {new Date(profileForm.lastScannedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        <form onSubmit={handleDomainScan} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="https://yourcompany.com"
              className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-emerald-600"
            />
          </div>
          <button
            type="submit"
            disabled={scanning || !domainInput.trim()}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
          >
            {scanning ? <Loader2 size={16} className="animate-spin" /> : null}
            {scanning ? 'Scanning Website...' : 'Scan & Absorb Voice'}
          </button>
        </form>
        {scanError && <p className="text-xs text-red-600 font-medium">{scanError}</p>}
      </div>

      {/* Brand Voice & Publishing Configuration */}
      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 space-y-5">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-slate-500" />
            <h2 className="text-base font-semibold text-slate-900">02. Brand Voice &amp; Editorial Rules</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Brand Name</label>
              <input
                type="text"
                value={profileForm.brandName}
                onChange={(e) => setProfileForm({ ...profileForm, brandName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Industry / Niche</label>
              <input
                type="text"
                value={profileForm.industry}
                onChange={(e) => setProfileForm({ ...profileForm, industry: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Audience Persona</label>
            <textarea
              rows={2}
              value={profileForm.audience}
              onChange={(e) => setProfileForm({ ...profileForm, audience: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Voice, Style &amp; Vocabulary Rules
            </label>
            <textarea
              rows={3}
              value={profileForm.toneRules}
              onChange={(e) => setProfileForm({ ...profileForm, toneRules: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Internal Link Pillars
            </label>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg mb-3">
              {profileForm.contentPillars.map((pillar, i) => (
                <div key={i} className="px-3.5 py-2 flex items-center justify-between text-sm">
                  <span className="text-slate-700">{pillar}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePillar(i)}
                    className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    aria-label={`Remove pillar ${pillar}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPillar}
                onChange={(e) => setNewPillar(e.target.value)}
                placeholder="Add topic pillar (e.g., Enterprise Security)"
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
              />
              <button
                type="button"
                onClick={handleAddPillar}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Add Pillar
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between space-y-5">
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-slate-900">03. Schedule &amp; CMS Delivery</h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Output Language</label>
              <select
                value={profileForm.language}
                onChange={(e) => setProfileForm({ ...profileForm, language: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-600"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Publishing Cadence</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'daily', label: 'Daily', sub: '30/mo' },
                  { id: '3x_week', label: '3x / Week', sub: '12/mo' },
                  { id: 'weekly', label: 'Weekly', sub: '4/mo' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setProfileForm({
                        ...profileForm,
                        cadence: opt.id as BrandProfile['cadence'],
                      })
                    }
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                      profileForm.cadence === opt.id
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-semibold">{opt.label}</p>
                    <p
                      className={`text-[11px] font-mono mt-0.5 ${
                        profileForm.cadence === opt.id ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      {opt.sub}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Connected CMS Platform</label>
              <select
                value={profileForm.connectedCms}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    connectedCms: e.target.value as BrandProfile['connectedCms'],
                  })
                }
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-600"
              >
                {CMS_TARGETS.map((cms) => (
                  <option key={cms} value={cms}>
                    {cms}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                CMS Webhook Endpoint (Optional)
              </label>
              <input
                type="url"
                value={profileForm.webhookUrl}
                onChange={(e) => setProfileForm({ ...profileForm, webhookUrl: e.target.value })}
                placeholder="https://yoursite.com/wp-json/organiciq/v1/publish"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
              />
              <p className="text-xs text-slate-500 mt-1">
                Leave blank to inspect and export formatted CMS JSON/HTML payloads locally.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            {savedNotice ? (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <Check size={14} /> Settings saved
              </span>
            ) : (
              <span className="text-xs text-slate-400">Synced with Content Studio</span>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Save Autopilot Profile
            </button>
          </div>
        </div>
      </form>

      {/* Editorial Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">04. Scheduled Article Queue</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Populate upcoming posts from your tracked keywords and launch any draft in Content Studio.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAutoSchedule}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer self-start sm:self-auto"
          >
            <CalendarPlus size={14} />
            Auto-Fill Queue from Keywords
          </button>
        </div>

        {workspace.autopilotQueue.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No scheduled articles yet. Click &ldquo;Auto-Fill Queue from Keywords&rdquo; above or track keywords in Keyword Strategy.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-6">Publish Date</th>
                  <th className="py-3 px-4">Article Title &amp; Keyword</th>
                  <th className="py-3 px-4">CMS / Lang</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workspace.autopilotQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-6 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {item.scheduledDate}
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="font-medium text-slate-900 truncate">{item.title}</p>
                      <p className="text-xs text-slate-500 truncate">Target: {item.keyword}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {item.targetCms} · {item.language}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap">
                      <span
                        className={
                          item.status === 'Published'
                            ? 'text-emerald-700'
                            : item.status === 'Draft Ready'
                            ? 'text-blue-700'
                            : 'text-slate-600'
                        }
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenArticleInStudio(item)}
                          className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md inline-flex items-center gap-1 cursor-pointer"
                        >
                          Write <ArrowRight size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveQueueItem(item.id)}
                          aria-label={`Delete ${item.title}`}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutopilotSetup;
