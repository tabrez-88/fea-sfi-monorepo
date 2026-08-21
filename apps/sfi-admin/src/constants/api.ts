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
    DUPLICATE: (id: string) => `${BASE}/deals/${id}/duplicate`,
  },
  PARTICIPANTS: {
    LIST: (dealId: string) => `${BASE}/deals/${dealId}/participants`,
    CREATE: (dealId: string) => `${BASE}/deals/${dealId}/participants`,
    ROLES: (dealId: string) => `${BASE}/deals/${dealId}/participants/roles`,
    IMPORT: (dealId: string) => `${BASE}/deals/${dealId}/participants/import`,
    BULK_DELETE: (dealId: string) =>
      `${BASE}/deals/${dealId}/participants/bulk-delete`,
    BULK_BEHAVIOR: (dealId: string) =>
      `${BASE}/deals/${dealId}/participants/bulk-behavior`,
    DETAIL: (id: string) => `${BASE}/participants/${id}`,
  },
  RULES: {
    LIST: (dealId: string) => `${BASE}/deals/${dealId}/rule-snapshots`,
    DETAIL: (id: string) => `${BASE}/rule-snapshots/${id}`,
  },
  REVENUE: {
    LIST: (dealId: string) => `${BASE}/deals/${dealId}/revenue-batches`,
    SUMMARY: (dealId: string) => `${BASE}/deals/${dealId}/revenue-batches/summary`,
    CREATE: (dealId: string) => `${BASE}/deals/${dealId}/revenue-batches`,
    DETAIL: (id: string) => `${BASE}/revenue-batches/${id}`,
    VALIDATE: (id: string) => `${BASE}/revenue-batches/${id}/validate`,
    REJECT: (id: string) => `${BASE}/revenue-batches/${id}/reject`,
  },
  DOCUMENTS: {
    LIST_BY_DEAL: (dealId: string) => `${BASE}/deals/${dealId}/documents`,
    UPLOAD_BY_DEAL: (dealId: string) => `${BASE}/deals/${dealId}/documents`,
    LIST_BY_BATCH: (batchId: string) =>
      `${BASE}/revenue-batches/${batchId}/documents`,
    LIST_BY_RUN: (runId: string) =>
      `${BASE}/settlement-runs/${runId}/documents`,
    DETAIL: (id: string) => `${BASE}/documents/${id}`,
    ARCHIVE: (id: string) => `${BASE}/documents/${id}/archive`,
    RESTORE: (id: string) => `${BASE}/documents/${id}/restore`,
    DELETE: (id: string) => `${BASE}/documents/${id}`,
  },
  SETTLEMENT: {
    /** GET lists, POST creates. */
    RUNS: (dealId: string) => `${BASE}/deals/${dealId}/settlement-runs`,
    RUN_DETAIL: (id: string) => `${BASE}/settlement-runs/${id}`,
    PREVIEW: (id: string) => `${BASE}/settlement-runs/${id}/preview`,
    FINALIZE: (id: string) => `${BASE}/settlement-runs/${id}/finalize`,
    CORRECTIONS: (id: string) => `${BASE}/settlement-runs/${id}/corrections`,
    VERIFY: (id: string) => `${BASE}/settlement-runs/${id}/verify`,
  },
  LEDGER: {
    DEAL: (dealId: string) => `${BASE}/deals/${dealId}/ledger`,
    JOURNAL: (id: string) => `${BASE}/ledger-journals/${id}`,
    BY_RUN: (runId: string) => `${BASE}/settlement-runs/${runId}/ledger`,
    BY_PARTICIPANT: (participantId: string) =>
      `${BASE}/participants/${participantId}/ledger`,
  },
  REPORTS: {
    RECOUPMENT: (dealId: string) => `${BASE}/deals/${dealId}/reports/recoupment`,
    STATEMENT: (dealId: string, participantId: string) =>
      `${BASE}/deals/${dealId}/reports/statements/${participantId}`,
  },
  DASHBOARD: {
    SUMMARY: `${BASE}/dashboard/summary`,
    PENDING_REVIEWS: `${BASE}/dashboard/pending-reviews`,
  },
  AUDIT_LOG: {
    LIST: `${BASE}/audit-logs`,
  },
} as const;
