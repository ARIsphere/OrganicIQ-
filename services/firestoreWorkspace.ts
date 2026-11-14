import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../src/lib/firebase';
import { AuditResult, WorkspaceState } from '../types';

const ALLOWED_CADENCES = new Set(['daily', '3x_week', 'weekly']);
const ALLOWED_CMS = new Set(['WordPress', 'Shopify', 'Webflow', 'Ghost', 'Webhook', 'None']);
const ALLOWED_TIERS = new Set(['Starter', 'Growth Autopilot', 'Agency Scale']);
const ALLOWED_BILLING = new Set(['monthly', 'quarterly', 'annual']);

function sanitizeWorkspaceForFirestore(uid: string, state: WorkspaceState) {
  const safeLang = (state.brandProfile.language || '').trim().slice(0, 40) || 'English';
  const safeCadence = ALLOWED_CADENCES.has(state.brandProfile.cadence)
    ? state.brandProfile.cadence
    : 'daily';
  const safeCms = ALLOWED_CMS.has(state.brandProfile.connectedCms)
    ? state.brandProfile.connectedCms
    : 'WordPress';
  const safeTier = ALLOWED_TIERS.has(state.planTier) ? state.planTier : 'Growth Autopilot';
  const safeBilling = ALLOWED_BILLING.has(state.billingCadence)
    ? state.billingCadence
    : 'quarterly';

  return {
    ownerUid: uid.slice(0, 128),
    domain: (state.brandProfile.domain || '').slice(0, 253),
    brandName: (state.brandProfile.brandName || 'Workspace').slice(0, 120),
    industry: (state.brandProfile.industry || '').slice(0, 160),
    audience: (state.brandProfile.audience || '').slice(0, 600),
    toneRules: (state.brandProfile.toneRules || '').slice(0, 1000),
    contentPillars: (state.brandProfile.contentPillars || [])
      .slice(0, 12)
      .map((p) => String(p).slice(0, 120)),
    language: safeLang,
    cadence: safeCadence,
    connectedCms: safeCms,
    webhookUrl: (state.brandProfile.webhookUrl || '').slice(0, 500),
    gscConnected: Boolean(state.brandProfile.gscConnected),
    gscProperty: (state.brandProfile.gscProperty || '').slice(0, 255),
    planTier: safeTier,
    billingCadence: safeBilling,
    trackedKeywords: (state.trackedKeywords || []).slice(0, 100).map((k) => ({
      keyword: String(k.keyword || '').slice(0, 140),
      searchVolume: Number(k.searchVolume) || 0,
      difficulty: String(k.difficulty || 'Low').slice(0, 20),
      intent: String(k.intent || 'Informational').slice(0, 40),
      cpcEstimate: String(k.cpcEstimate || '').slice(0, 20),
      articleTitleIdea: String(k.articleTitleIdea || '').slice(0, 200),
      tracked: Boolean(k.tracked),
    })),
    autopilotQueue: (state.autopilotQueue || []).slice(0, 100).map((a) => ({
      id: String(a.id || '').slice(0, 64),
      title: String(a.title || '').slice(0, 200),
      keyword: String(a.keyword || '').slice(0, 140),
      scheduledDate: String(a.scheduledDate || '').slice(0, 20),
      status: String(a.status || 'Scheduled').slice(0, 20),
      targetCms: String(a.targetCms || 'WordPress').slice(0, 30),
      language: String(a.language || 'English').slice(0, 40),
      format: String(a.format || 'Comprehensive Guide').slice(0, 60),
    })),
  };
}

export async function loadFirestoreWorkspace(
  uid: string,
  fallback: WorkspaceState
): Promise<WorkspaceState> {
  const path = `users/${uid}`;
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const payload = {
        ...sanitizeWorkspaceForFirestore(uid, fallback),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(ref, payload);
      return fallback;
    }

    const data = snap.data();
    return {
      ...fallback,
      planTier: data.planTier || fallback.planTier,
      billingCadence: data.billingCadence || fallback.billingCadence,
      trackedKeywords: Array.isArray(data.trackedKeywords)
        ? data.trackedKeywords
        : fallback.trackedKeywords,
      autopilotQueue: Array.isArray(data.autopilotQueue)
        ? data.autopilotQueue
        : fallback.autopilotQueue,
      brandProfile: {
        ...fallback.brandProfile,
        domain: data.domain ?? fallback.brandProfile.domain,
        brandName: data.brandName ?? fallback.brandProfile.brandName,
        industry: data.industry ?? fallback.brandProfile.industry,
        audience: data.audience ?? fallback.brandProfile.audience,
        toneRules: data.toneRules ?? fallback.brandProfile.toneRules,
        contentPillars: Array.isArray(data.contentPillars)
          ? data.contentPillars
          : fallback.brandProfile.contentPillars,
        language: data.language ?? fallback.brandProfile.language,
        cadence: data.cadence ?? fallback.brandProfile.cadence,
        connectedCms: data.connectedCms ?? fallback.brandProfile.connectedCms,
        webhookUrl: data.webhookUrl ?? fallback.brandProfile.webhookUrl,
        gscConnected:
          typeof data.gscConnected === 'boolean'
            ? data.gscConnected
            : fallback.brandProfile.gscConnected,
        gscProperty: data.gscProperty ?? fallback.brandProfile.gscProperty,
      },
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveFirestoreWorkspace(
  uid: string,
  state: WorkspaceState
): Promise<void> {
  const path = `users/${uid}`;
  try {
    const ref = doc(db, 'users', uid);
    const sanitized = sanitizeWorkspaceForFirestore(uid, state);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ...sanitized,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const { ownerUid: _ownerUid, ...updatableFields } = sanitized;
      await updateDoc(ref, {
        ...updatableFields,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveAuditSnapshotToFirestore(
  uid: string,
  audit: AuditResult
): Promise<void> {
  const path = `users/${uid}/audits`;
  try {
    await addDoc(collection(db, 'users', uid, 'audits'), {
      ownerUid: uid.slice(0, 128),
      domain: (audit.domain || 'unknown.com').slice(0, 253),
      score: Math.min(100, Math.max(0, Number(audit.score) || 0)),
      summary: (audit.summary || '').slice(0, 1500),
      organicMonthlyTraffic: Math.max(0, Number(audit.metrics?.organicMonthlyTraffic) || 0),
      organicKeywords: Math.max(0, Number(audit.metrics?.organicKeywords) || 0),
      backlinks: Math.max(0, Number(audit.metrics?.backlinks) || 0),
      domainAuthority: Math.min(100, Math.max(0, Number(audit.metrics?.domainAuthority) || 0)),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
