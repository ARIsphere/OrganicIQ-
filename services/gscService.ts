import { GscSummaryData } from '../types';

async function gscFetch<T>(
  endpoint: string,
  token: string,
  options?: { method?: string; body?: Record<string, unknown> }
): Promise<T> {
  const response = await fetch(endpoint, {
    method: options?.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }
  return data as T;
}

export const fetchGscMonthlySummary = async (token: string): Promise<GscSummaryData> => {
  return gscFetch<GscSummaryData>('/api/gsc/monthly-summary', token);
};

export const connectGscPropertyApi = async (
  token: string,
  propertyUrl: string
): Promise<GscSummaryData> => {
  return gscFetch<GscSummaryData>('/api/gsc/connect', token, {
    method: 'POST',
    body: { propertyUrl },
  });
};

export const disconnectGscPropertyApi = async (token: string): Promise<GscSummaryData> => {
  return gscFetch<GscSummaryData>('/api/gsc/disconnect', token, {
    method: 'POST',
  });
};

export const refreshGscMonthlyApi = async (token: string): Promise<GscSummaryData> => {
  return gscFetch<GscSummaryData>('/api/gsc/refresh', token, {
    method: 'POST',
  });
};

export const saveMonthlySnapshotApi = async (
  token: string,
  payload: {
    monthKey: string;
    clicks: number;
    impressions: number;
    avgPosition: number;
    indexedPages: number;
    topQuery: string;
  }
): Promise<GscSummaryData> => {
  return gscFetch<GscSummaryData>('/api/gsc/snapshot', token, {
    method: 'POST',
    body: payload,
  });
};
