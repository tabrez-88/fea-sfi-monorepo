export const DealStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  CLOSED: 'CLOSED',
  TERMINATED: 'TERMINATED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type DealStatus = (typeof DealStatus)[keyof typeof DealStatus];

export const Currency = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  JPY: 'JPY',
  CHF: 'CHF',
  CAD: 'CAD',
  AUD: 'AUD',
} as const;

export type Currency = (typeof Currency)[keyof typeof Currency];

/**
 * Project category — drives the "Film deal" / "Music deal" subtitle on
 * Deal Overview, filtering, and downstream reporting. Per Liang Round 4.
 * Enum values match the BE Prisma `DealCategory` enum exactly.
 */
export const DealCategory = {
  MUSIC: 'MUSIC',
  FILM_AND_TV: 'FILM_AND_TV',
  LIVE_EVENTS_AND_SPORTS: 'LIVE_EVENTS_AND_SPORTS',
  GAMES_AND_INTERACTIVE_MEDIA: 'GAMES_AND_INTERACTIVE_MEDIA',
  CREATOR_AND_CONSUMER_IP: 'CREATOR_AND_CONSUMER_IP',
  AI_AND_FUTURE_MEDIA: 'AI_AND_FUTURE_MEDIA',
} as const;

export type DealCategory = (typeof DealCategory)[keyof typeof DealCategory];

export interface DealCounts {
  participants: number;
  ruleSnapshots: number;
  revenueBatches: number;
  settlementRuns: number;
}

export interface Deal {
  id: string;
  name: string;
  description: string | null;
  status: DealStatus;
  category: DealCategory | null;
  dealOwner: string | null;
  currency: Currency;
  effectiveDate: string;
  terminationDate: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  participantsCount?: number;
  totalRevenue?: number | null;
  _count?: DealCounts;
  createdAt: string;
  updatedAt: string;
}

export interface DealsCountsResponse {
  all: number;
  draft: number;
  active: number;
  suspended: number;
  closed: number;
  terminated: number;
  archived: number;
}

export interface CreateDealInput {
  name: string;
  description?: string;
  status?: DealStatus;
  category?: DealCategory;
  dealOwner?: string;
  currency?: Currency;
  effectiveDate: string;
  terminationDate?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateDealInput {
  name?: string;
  description?: string;
  status?: DealStatus;
  category?: DealCategory;
  dealOwner?: string;
  currency?: Currency;
  effectiveDate?: string;
  terminationDate?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}
