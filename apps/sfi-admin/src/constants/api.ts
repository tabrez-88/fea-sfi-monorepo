import { env } from '@/lib/env';

const BASE = env.NEXT_PUBLIC_API_URL;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${BASE}/auth/login`,
    REGISTER: `${BASE}/auth/register`,
    REFRESH: `${BASE}/auth/refresh`,
    LOGOUT: `${BASE}/auth/logout`,
    FORGOT_PASSWORD: `${BASE}/auth/forgot-password`,
    RESET_PASSWORD: `${BASE}/auth/reset-password`,
    ME: `${BASE}/auth/me`,
  },
  DEALS: {
    LIST: `${BASE}/deals`,
    COUNTS: `${BASE}/deals/counts`,
    CREATE: `${BASE}/deals`,
    DETAIL: (id: string) => `${BASE}/deals/${id}`,
    UPDATE: (id: string) => `${BASE}/deals/${id}`,
    DELETE: (id: string) => `${BASE}/deals/${id}`,
  },
  PARTICIPANTS: {
    LIST: (dealId: string) => `${BASE}/deals/${dealId}/participants`,
    CREATE: (dealId: string) => `${BASE}/deals/${dealId}/participants`,
    ROLES: (dealId: string) => `${BASE}/deals/${dealId}/participants/roles`,
    IMPORT: (dealId: string) => `${BASE}/deals/${dealId}/participants/import`,
    DETAIL: (id: string) => `${BASE}/participants/${id}`,
  },
  RULES: {
    LIST: (dealId: string) => `${BASE}/deals/${dealId}/rule-snapshots`,
    DETAIL: (id: string) => `${BASE}/rule-snapshots/${id}`,
  },
  REVENUE: {
    LIST: (dealId: string) => `${BASE}/deals/${dealId}/revenue-batches`,
    DETAIL: (id: string) => `${BASE}/revenue-batches/${id}`,
    VALIDATE: (id: string) => `${BASE}/revenue-batches/${id}/validate`,
    REJECT: (id: string) => `${BASE}/revenue-batches/${id}/reject`,
  },
  SETTLEMENT: {
    RUNS: (dealId: string) => `${BASE}/deals/${dealId}/settlement-runs`,
    RUN_DETAIL: (id: string) => `${BASE}/settlement-runs/${id}`,
    PREVIEW: (id: string) => `${BASE}/settlement-runs/${id}/preview`,
    FINALIZE: (id: string) => `${BASE}/settlement-runs/${id}/finalize`,
  },
  DASHBOARD: {
    SUMMARY: `${BASE}/dashboard/summary`,
    PENDING_REVIEWS: `${BASE}/dashboard/pending-reviews`,
  },
  AUDIT_LOG: {
    LIST: `${BASE}/audit-logs`,
  },
} as const;
