import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import ProductOverview from './components/ProductOverview';
import Dashboard from './components/Dashboard';
import AutopilotSetup from './components/AutopilotSetup';
import KeywordStrategy from './components/KeywordStrategy';
import ContentGenerator from './components/ContentGenerator';
import CompetitorAnalysis from './components/CompetitorAnalysis';
import SeoAudit from './components/SeoAudit';
import Pricing from './components/Pricing';
import {
  AppView,
  AuditResult,
  AutopilotArticle,
  BillingCadence,
  BrandProfile,
  CompetitorInsight,
  GscSummaryData,
  KeywordData,
  PlanTier,
  WorkspaceState,
} from './types';
import {
  loadWorkspace,
  saveWorkspace,
  createQueueItemFromKeyword,
} from './services/workspaceStore';
import { scanBrandProfile } from './services/geminiService';
import { useAuth } from './src/context/AuthContext';
import {
  loadFirestoreWorkspace,
  saveFirestoreWorkspace,
  saveAuditSnapshotToFirestore,
} from './services/firestoreWorkspace';
import {
  fetchGscMonthlySummary,
  connectGscPropertyApi,
  disconnectGscPropertyApi,
  refreshGscMonthlyApi,
  saveMonthlySnapshotApi,
} from './services/gscService';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.OVERVIEW);
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => loadWorkspace());
  const [draftContext, setDraftContext] = useState<{
    topic: string;
    queueId?: string;
    language?: string;
    format?: string;
  } | null>(null);

  const { user, authReady, signingIn, signInWithGoogle, getToken } = useAuth();
  const [gscSummary, setGscSummary] = useState<GscSummaryData | null>(null);
  const [gscLoading, setGscLoading] = useState(false);
  const [gscError, setGscError] = useState('');
  const hydratedUidRef = useRef<string | null>(null);

  // Persist locally
  useEffect(() => {
    saveWorkspace(workspace);
  }, [workspace]);

  // Hydrate Firestore workspace + GSC monthly report when authenticated
  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      hydratedUidRef.current = null;
      setGscSummary(null);
      setGscError('');
      return;
    }

    let cancelled = false;

    const hydrate = async () => {
      try {
        if (user.emailVerified) {
          const remoteWorkspace = await loadFirestoreWorkspace(user.uid, loadWorkspace());
          if (!cancelled) {
            hydratedUidRef.current = user.uid;
            setWorkspace(remoteWorkspace);
          }
        }
      } catch (err) {
        console.error('Workspace sync skipped:', err);
      }

      setGscLoading(true);
      setGscError('');
      try {
        const token = await getToken();
        if (token && !cancelled) {
          const summary = await fetchGscMonthlySummary(token);
          if (!cancelled) {
            setGscSummary(summary);
            setWorkspace((prev) => ({
              ...prev,
              brandProfile: {
                ...prev.brandProfile,
                gscConnected: summary.connected,
                gscProperty: summary.propertyUrl || prev.brandProfile.gscProperty,
              },
            }));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setGscError(err instanceof Error ? err.message : 'Unable to load Search Console report.');
        }
      } finally {
        if (!cancelled) setGscLoading(false);
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [authReady, user, getToken]);

  // Debounced Firestore sync on workspace updates for authenticated users
  useEffect(() => {
    if (!user || !user.emailVerified || hydratedUidRef.current !== user.uid) return;
    const timer = setTimeout(() => {
      saveFirestoreWorkspace(user.uid, workspace).catch((err) => {
        console.error('Firestore workspace update error:', err);
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [user, workspace]);

  const handleDomainScan = async (domain: string) => {
    const scanned = await scanBrandProfile(domain);
    setWorkspace((prev) => {
      const existingKeywords = new Set(prev.trackedKeywords.map((k) => k.keyword.toLowerCase()));
      const mergedKeywords = [
        ...scanned.seedKeywords.filter((k) => !existingKeywords.has(k.keyword.toLowerCase())),
        ...prev.trackedKeywords,
      ];

      return {
        ...prev,
        brandProfile: {
          ...prev.brandProfile,
          domain: scanned.domain,
          brandName: scanned.brandName,
          industry: scanned.industry,
          audience: scanned.audience,
          toneRules: scanned.toneRules,
          contentPillars: scanned.contentPillars,
          gscProperty: `sc-domain:${scanned.domain.replace(/^https?:\/\//, '').split('/')[0]}`,
          lastScannedAt: new Date().toISOString(),
        },
        trackedKeywords: mergedKeywords,
      };
    });
  };

  const handleUpdateBrandProfile = (updated: BrandProfile) => {
    setWorkspace((prev) => ({ ...prev, brandProfile: updated }));
  };

  const handleConnectGsc = async (property: string) => {
    const token = await getToken();
    if (!token) {
      throw new Error('Please sign in with Google first.');
    }
    const summary = await connectGscPropertyApi(token, property);
    setGscSummary(summary);
    setGscError('');
    setWorkspace((prev) => ({
      ...prev,
      brandProfile: {
        ...prev.brandProfile,
        gscConnected: true,
        gscProperty: summary.propertyUrl,
      },
    }));
  };

  const handleDisconnectGsc = async () => {
    const token = await getToken();
    if (!token) return;
    const summary = await disconnectGscPropertyApi(token);
    setGscSummary(summary);
    setWorkspace((prev) => ({
      ...prev,
      brandProfile: {
        ...prev.brandProfile,
        gscConnected: false,
      },
    }));
  };

  const handleRefreshGsc = async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const summary = await refreshGscMonthlyApi(token);
      setGscSummary(summary);
      setGscError('');
    } catch (err) {
      setGscError(err instanceof Error ? err.message : 'Unable to refresh Search Console trends.');
    }
  };

  const handleRecordGscSnapshot = async (payload: {
    monthKey: string;
    clicks: number;
    impressions: number;
    avgPosition: number;
    indexedPages: number;
    topQuery: string;
  }) => {
    const token = await getToken();
    if (!token) {
      throw new Error('Please sign in with Google first.');
    }
    const summary = await saveMonthlySnapshotApi(token, payload);
    setGscSummary(summary);
    setGscError('');
  };

  const handleToggleTrackKeyword = (kw: KeywordData) => {
    setWorkspace((prev) => {
      const exists = prev.trackedKeywords.some(
        (item) => item.keyword.toLowerCase() === kw.keyword.toLowerCase()
      );
      const nextKeywords = exists
        ? prev.trackedKeywords.filter(
            (item) => item.keyword.toLowerCase() !== kw.keyword.toLowerCase()
          )
        : [{ ...kw, tracked: true }, ...prev.trackedKeywords];
      return { ...prev, trackedKeywords: nextKeywords };
    });
  };

  const handleTrackKeywordFromGap = (kw: KeywordData) => {
    setWorkspace((prev) => {
      const exists = prev.trackedKeywords.some(
        (item) => item.keyword.toLowerCase() === kw.keyword.toLowerCase()
      );
      if (exists) return prev;
      return {
        ...prev,
        trackedKeywords: [{ ...kw, tracked: true }, ...prev.trackedKeywords],
      };
    });
  };

  const handleQueueKeyword = (kw: KeywordData) => {
    setWorkspace((prev) => {
      const newItem = createQueueItemFromKeyword(
        kw,
        prev.brandProfile,
        prev.autopilotQueue.length + 1
      );
      return {
        ...prev,
        autopilotQueue: [newItem, ...prev.autopilotQueue],
      };
    });
  };

  const handleGenerateQueueFromKeywords = (items: AutopilotArticle[]) => {
    setWorkspace((prev) => ({
      ...prev,
      autopilotQueue: [...prev.autopilotQueue, ...items],
    }));
  };

  const handleRemoveQueueItem = (id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      autopilotQueue: prev.autopilotQueue.filter((a) => a.id !== id),
    }));
  };

  const handleOpenArticleInStudio = (article: AutopilotArticle) => {
    setDraftContext({
      topic: article.keyword || article.title,
      queueId: article.id,
      language: article.language,
      format: article.format,
    });
    setCurrentView(AppView.CONTENT);
  };

  const handleWriteFromKeyword = (kw: KeywordData) => {
    setDraftContext({
      topic: kw.keyword,
      language: workspace.brandProfile.language,
      format: kw.intent === 'Commercial' ? 'Comparison' : 'Comprehensive Guide',
    });
    setCurrentView(AppView.CONTENT);
  };

  const handleDraftFromIssue = (issueTopic: string) => {
    setDraftContext({
      topic: issueTopic,
      language: workspace.brandProfile.language,
      format: 'Technical How-To',
    });
    setCurrentView(AppView.CONTENT);
  };

  const handleMarkArticlePublished = (
    queueId: string | undefined,
    article: Partial<AutopilotArticle>
  ) => {
    setWorkspace((prev) => {
      if (queueId) {
        return {
          ...prev,
          autopilotQueue: prev.autopilotQueue.map((item) =>
            item.id === queueId ? { ...item, ...article, status: 'Published' } : item
          ),
        };
      }
      const created: AutopilotArticle = {
        id: `art-${Date.now()}`,
        title: article.title || 'Published Article',
        keyword: article.keyword || '',
        scheduledDate: new Date().toISOString().split('T')[0],
        status: 'Published',
        targetCms: article.targetCms || prev.brandProfile.connectedCms,
        language: article.language || prev.brandProfile.language,
        format: article.format || 'Comprehensive Guide',
        wordCount: article.wordCount,
        htmlContent: article.htmlContent,
        metaDescription: article.metaDescription,
      };
      return {
        ...prev,
        autopilotQueue: [created, ...prev.autopilotQueue],
      };
    });
  };

  const handleAddCompetitor = (comp: CompetitorInsight) => {
    setWorkspace((prev) => ({
      ...prev,
      competitors: [comp, ...prev.competitors],
    }));
  };

  const handleDeleteCompetitor = (index: number) => {
    setWorkspace((prev) => ({
      ...prev,
      competitors: prev.competitors.filter((_, i) => i !== index),
    }));
  };

  const handleSaveAudit = (audit: AuditResult) => {
    setWorkspace((prev) => ({
      ...prev,
      latestAudit: audit,
    }));
    if (user && user.emailVerified) {
      saveAuditSnapshotToFirestore(user.uid, audit).catch((err) => {
        console.error('Audit snapshot save error:', err);
      });
    }
  };

  const handleSelectPlan = (tier: PlanTier, cadence: BillingCadence) => {
    setWorkspace((prev) => ({
      ...prev,
      planTier: tier,
      billingCadence: cadence,
    }));
  };

  if (currentView === AppView.OVERVIEW) {
    return (
      <ProductOverview
        workspace={workspace}
        onEnterWorkspace={(view) => setCurrentView(view || AppView.DASHBOARD)}
        onQuickDomainScan={handleDomainScan}
        onSelectPlan={handleSelectPlan}
      />
    );
  }

  const renderWorkspaceView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return (
          <Dashboard
            workspace={workspace}
            isSignedIn={Boolean(user)}
            signingIn={signingIn}
            onSignIn={signInWithGoogle}
            gscSummary={gscSummary}
            gscLoading={gscLoading}
            gscError={gscError}
            onNavigate={setCurrentView}
            onConnectGsc={handleConnectGsc}
            onDisconnectGsc={handleDisconnectGsc}
            onRefreshGsc={handleRefreshGsc}
            onRecordGscSnapshot={handleRecordGscSnapshot}
            onOpenArticleInStudio={handleOpenArticleInStudio}
          />
        );
      case AppView.AUTOPILOT:
        return (
          <AutopilotSetup
            workspace={workspace}
            onScanDomain={handleDomainScan}
            onUpdateBrandProfile={handleUpdateBrandProfile}
            onGenerateQueueFromKeywords={handleGenerateQueueFromKeywords}
            onRemoveQueueItem={handleRemoveQueueItem}
            onOpenArticleInStudio={handleOpenArticleInStudio}
          />
        );
      case AppView.KEYWORDS:
        return (
          <KeywordStrategy
            workspace={workspace}
            onToggleTrackKeyword={handleToggleTrackKeyword}
            onQueueKeyword={handleQueueKeyword}
            onWriteFromKeyword={handleWriteFromKeyword}
          />
        );
      case AppView.CONTENT:
        return (
          <ContentGenerator
            workspace={workspace}
            initialDraftContext={draftContext}
            onClearDraftContext={() => setDraftContext(null)}
            onMarkArticlePublished={handleMarkArticlePublished}
          />
        );
      case AppView.COMPETITORS:
        return (
          <CompetitorAnalysis
            workspace={workspace}
            onAddCompetitor={handleAddCompetitor}
            onDeleteCompetitor={handleDeleteCompetitor}
            onTrackKeywordFromGap={handleTrackKeywordFromGap}
          />
        );
      case AppView.AUDIT:
        return (
          <SeoAudit
            workspace={workspace}
            onSaveAudit={handleSaveAudit}
            onDraftFromIssue={handleDraftFromIssue}
          />
        );
      case AppView.PRICING:
        return <Pricing workspace={workspace} onSelectPlan={handleSelectPlan} />;
      default:
        return (
          <Dashboard
            workspace={workspace}
            isSignedIn={Boolean(user)}
            signingIn={signingIn}
            onSignIn={signInWithGoogle}
            gscSummary={gscSummary}
            gscLoading={gscLoading}
            gscError={gscError}
            onNavigate={setCurrentView}
            onConnectGsc={handleConnectGsc}
            onDisconnectGsc={handleDisconnectGsc}
            onRefreshGsc={handleRefreshGsc}
            onRecordGscSnapshot={handleRecordGscSnapshot}
            onOpenArticleInStudio={handleOpenArticleInStudio}
          />
        );
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView} workspace={workspace}>
      {renderWorkspaceView()}
    </Layout>
  );
}

export default App;