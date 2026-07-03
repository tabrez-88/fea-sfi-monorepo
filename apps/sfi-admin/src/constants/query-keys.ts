export const QUERY_KEYS = {
  AUTH: {
    ME: ['auth', 'me'] as const,
  },
  DEALS: {
    ALL: ['deals'] as const,
    LIST: (params?: Record<string, unknown>) =>
      ['deals', 'list', params ?? {}] as const,
    COUNTS: ['deals', 'counts'] as const,
    DETAIL: (id: string) => ['deals', id] as const,
  },
  PARTICIPANTS: {
    ALL: ['participants'] as const,
    LIST: (dealId: string, params?: Record<string, unknown>) =>
      ['participants', 'list', dealId, params ?? {}] as const,
    ROLES: (dealId: string, q: string) =>
      ['participants', 'roles', dealId, q] as const,
    DETAIL: (id: string) => ['participants', id] as const,
  },
  RULES: {
    ALL: ['rules'] as const,
    LIST: (dealId: string, params?: Record<string, unknown>) =>
      ['rules', 'list', dealId, params ?? {}] as const,
    DETAIL: (id: string) => ['rules', id] as const,
  },
  REVENUE: {
    ALL: ['revenue'] as const,
    LIST: (dealId: string, params?: Record<string, unknown>) =>
      ['revenue', 'list', dealId, params ?? {}] as const,
    SUMMARY: (dealId: string) => ['revenue', 'summary', dealId] as const,
    DETAIL: (id: string) => ['revenue', id] as const,
  },
  DOCUMENTS: {
    ALL: ['documents'] as const,
    LIST_BY_DEAL: (dealId: string, params?: Record<string, unknown>) =>
      ['documents', 'deal', dealId, params ?? {}] as const,
    LIST_BY_BATCH: (batchId: string, params?: Record<string, unknown>) =>
      ['documents', 'batch', batchId, params ?? {}] as const,
    LIST_BY_RUN: (runId: string, params?: Record<string, unknown>) =>
      ['documents', 'run', runId, params ?? {}] as const,
    DETAIL: (id: string) => ['documents', id] as const,
  },
  SETTLEMENT: {
    ALL: ['settlement'] as const,
    RUNS: (dealId: string, params?: Record<string, unknown>) =>
      ['settlement', 'runs', dealId, params ?? {}] as const,
    RUN_DETAIL: (id: string) => ['settlement', 'runs', id] as const,
  },
  DASHBOARD: {
    SUMMARY: ['dashboard', 'summary'] as const,
    PENDING_REVIEWS: ['dashboard', 'pending-reviews'] as const,
  },
  AUDIT_LOG: {
    LIST: (params?: Record<string, unknown>) =>
      ['audit-log', 'list', params ?? {}] as const,
  },
} as const;
