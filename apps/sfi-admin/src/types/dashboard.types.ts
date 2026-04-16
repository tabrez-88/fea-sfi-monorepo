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
  createdAt: string;
}

export interface PendingSettlementRun {
  id: string;
  dealId: string;
  dealName: string;
  runNumber: number;
  runLabel: string;
  totalAllocated: number;
  currency: string;
  status: SettlementRunStatus;
  createdAt: string;
}

export interface DashboardPendingReviews {
  revenueBatches: PendingRevenueBatch[];
  settlementRuns: PendingSettlementRun[];
  totalCount: number;
}
