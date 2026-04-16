export const DealStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  CLOSED: 'CLOSED',
} as const;

export type DealStatus = (typeof DealStatus)[keyof typeof DealStatus];

export const Currency = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
} as const;

export type Currency = (typeof Currency)[keyof typeof Currency];

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
}

export interface CreateDealInput {
  name: string;
  description?: string;
  status?: DealStatus;
  currency?: Currency;
  effectiveDate: string;
  terminationDate?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateDealInput {
  name?: string;
  description?: string;
  status?: DealStatus;
  currency?: Currency;
  effectiveDate?: string;
  terminationDate?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}
