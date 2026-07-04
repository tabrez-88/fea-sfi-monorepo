import type { RevenueBatchStatus } from '@/types/dashboard.types';
import type { Currency } from '@/types/deal.types';

/** Row shape returned by `GET /deals/:id/revenue-batches`. */
export interface RevenueBatch {
  id: string;
  dealId: string;
  batchNumber: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  currency: Currency;
  status: RevenueBatchStatus;
  source: string | null;
  territory: string | null;
  revenueType: string | null;
  reportingEntity: string | null;
  metadata: Record<string, unknown> | null;
  isSettled: boolean;
  settlementRunCount?: number;
  lineItems?: RevenueLineItem[];
  createdAt: string;
  updatedAt: string;
}

/** MS-3 Wave 3 — first-class line items with per-row categorization. */
export interface RevenueLineItem {
  id: string;
  batchId: string;
  platformSource: string;
  amount: number;
  currency: Currency;
  territory: string | null;
  revenueType: string | null;
  reportingEntity: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Shape of `GET /deals/:id/revenue-batches/summary` — feeds the 4 stat
 * cards on Screen 3.1 in a single call.
 */
export interface RevenueBatchSummary {
  totalCount: number;
  totalAmount: number;
  currency: Currency | null;
  byStatus: Record<RevenueBatchStatus, { count: number; amount: number }>;
}

export type RevenueBatchListParams = Readonly<{
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: RevenueBatchStatus;
  search?: string;
  periodFrom?: string;
  periodTo?: string;
  territory?: string;
  revenueType?: string;
  reportingEntity?: string;
}>;

/** Payload for `POST /deals/:id/revenue-batches` — matches BE `CreateRevenueBatchDto`. */
export type CreateRevenueBatchInput = Readonly<{
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  currency: Currency;
  source?: string;
  territory?: string;
  revenueType?: string;
  reportingEntity?: string;
  lineItems?: ReadonlyArray<CreateRevenueLineItemInput>;
}>;

export type CreateRevenueLineItemInput = Readonly<{
  platformSource: string;
  amount: number;
  currency?: Currency;
  territory?: string;
  revenueType?: string;
  reportingEntity?: string;
  notes?: string;
}>;
