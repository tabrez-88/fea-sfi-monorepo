export const ROUTES = {
  HOME: '/',

  // ─── Auth ──────────────────────────────────────────────────────────────
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // ─── App ───────────────────────────────────────────────────────────────
  DASHBOARD: '/dashboard',

  DEALS: {
    LIST: '/deals',
    CREATE: '/deals/create',
    DETAIL: (id: string) => `/deals/${id}`,
    EDIT: (id: string) => `/deals/${id}/edit`,
    // Deal-scoped context pages (Sprint 2+)
    PARTICIPANTS: (id: string) => `/deals/${id}/participants`,
    PARTICIPANTS_NEW: (id: string) => `/deals/${id}/participants/new`,
    PARTICIPANT_DETAIL: (id: string, participantId: string) =>
      `/deals/${id}/participants/${participantId}`,
    RULES: (id: string) => `/deals/${id}/rules`,
    RULES_NEW: (id: string) => `/deals/${id}/rules/new`,
    REVENUE: (id: string) => `/deals/${id}/revenue`,
    SETTLEMENT: (id: string) => `/deals/${id}/settlement`,
    DOCUMENTS: (id: string) => `/deals/${id}/documents`,
    REPORTS: (id: string) => `/deals/${id}/reports`,
    PROOF: (id: string) => `/deals/${id}/proof`,
  },

  PARTICIPANTS: {
    LIST: '/participants',
    DETAIL: (id: string) => `/participants/${id}`,
  },

  RULES: {
    LIST: '/rules',
    DETAIL: (id: string) => `/rules/${id}`,
  },

  REVENUE: {
    LIST: '/revenue',
    DETAIL: (id: string) => `/revenue/${id}`,
  },

  SETTLEMENT: {
    LIST: '/settlements',
    RUNS: '/settlements/runs',
    RUN_DETAIL: (id: string) => `/settlements/runs/${id}`,
  },

  PENDING_REVIEWS: '/pending-reviews',
  AUDIT_LOG: '/audit-log',
} as const;
