// Type-only import: `settlement.types` imports SettlementRunStatus from this
// module, so a value import would close a runtime cycle. `import type` is
// erased at compile time, leaving only the type-level reference.
import type { SettlementRunType } from '@/types/settlement.types';

export const RevenueBatchStatus = {
  PENDING: 'PENDING',
  VALIDATED: 'VALIDATED',
  REJECTED: 'REJECTED',
  PROCESSED: 'PROCESSED',
} as const;

export type RevenueBatchStatus =
  (typeof RevenueBatchStatus)[keyof typeof RevenueBatchStatus];

export const SettlementRunStatus = {
  DRAFT: 'DRAFT',
  PREVIEWED: 'PREVIEWED',
  FINALIZED: 'FINALIZED',
  CANCELLED: 'CANCELLED',
  VOIDED: 'VOIDED',
} as const;

export type SettlementRunStatus =
  (typeof SettlementRunStatus)[keyof typeof SettlementRunStatus];

export interface DashboardSummary {
  totalDeals: number;
  activeDeals: number;
  pendingReview: number;
  totalSettled: number;
}

export interface PendingRevenueBatch {
  id: string;
  dealId: string;
  dealName: string;
  batchNumber: string;
  totalAmount: number;
  currency: string;
  status: RevenueBatchStatus;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export interface PendingSettlementRun {
  id: string;
  dealId: string;
  dealName: string;
  /** Pre-formatted "Run #N"; the BE does not send a numeric runNumber here. */
  runLabel: string;
  totalAllocated: number;
  currency: string;
  status: SettlementRunStatus;
  runType: SettlementRunType;
  createdAt: string;
}

export interface DashboardPendingReviews {
  revenueBatches: PendingRevenueBatch[];
  settlementRuns: PendingSettlementRun[];
  totalCount: number;
}
