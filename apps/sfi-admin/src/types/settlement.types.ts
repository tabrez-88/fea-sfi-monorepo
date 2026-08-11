import type { SettlementRunStatus } from '@/types/dashboard.types';
import type { Currency } from '@/types/deal.types';

/** BE `RunTypeEnum`; corrections point back via `originalSettlementRunId`. */
export const SettlementRunType = {
  NORMAL: 'NORMAL',
  CORRECTION: 'CORRECTION',
} as const;

export type SettlementRunType =
  (typeof SettlementRunType)[keyof typeof SettlementRunType];

/** Row shape returned by `GET /deals/:id/settlement-runs` (BE `SettlementRunResponseDto`). */
export interface SettlementRun {
  id: string;
  dealId: string;
  ruleSnapshotId: string;
  runNumber: number;
  /** Pre-formatted "Run #2" label from the BE. */
  runLabel: string;
  runType: SettlementRunType;
  status: SettlementRunStatus;
  originalSettlementRunId?: string | null;
  totalAllocated: number;
  currency: Currency;
  notes?: string | null;
  executedAt?: string | null;
  finalizedAt?: string | null;
  ruleSnapshotVersion?: number;
  revenueBatchCount?: number;
  totalRevenue?: number;
  proofHash?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SettlementRunListParams = Readonly<{
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}>;

/** Payload for `POST /deals/:id/settlement-runs`, matches BE `CreateSettlementRunDto`. */
export type CreateSettlementRunInput = Readonly<{
  ruleSnapshotId: string;
  revenueBatchIds: ReadonlyArray<string>;
  notes?: string;
}>;

/** BE `SettlementPhaseEnum`; drives the Waterfall Breakdown grouping on 4.4. */
export const SettlementPhase = {
  GROSS_RECEIPTS: 'GROSS_RECEIPTS',
  DISTRIBUTION_FEES: 'DISTRIBUTION_FEES',
  RECOUPMENT: 'RECOUPMENT',
  NET_PROFITS: 'NET_PROFITS',
} as const;

export type SettlementPhase =
  (typeof SettlementPhase)[keyof typeof SettlementPhase];

/** BE `SettlementAllocationDto`. */
export interface SettlementAllocation {
  id: string;
  participantId: string;
  participantName: string;
  amount: number;
  currency: Currency;
  phase: SettlementPhase;
  metadata?: Record<string, unknown>;
}

/** BE `ProofSummaryDto`. */
export interface ProofSummary {
  proofHash: string;
  algorithm: string;
  timestamp: string;
  inputSummary?: Record<string, unknown>;
}

/** BE `LedgerRefDto`. */
export interface LedgerRef {
  journalIds: string[];
  postingCount: number;
}

/** BE `RevenueBatchSummaryDto`; batches included on the detail response. */
export interface SettlementBatchSummary {
  id: string;
  batchNumber: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  currency: Currency;
}

/** BE `SettlementRunDetailResponseDto` for `GET /settlement-runs/:id`. */
export interface SettlementRunDetail extends SettlementRun {
  revenueBatches: SettlementBatchSummary[];
  allocations?: SettlementAllocation[];
  proof?: ProofSummary;
  ledger?: LedgerRef;
}

/** BE `PreviewSettlementResponseDto`. */
export interface PreviewSettlementResult {
  settlementRunId: string;
  status: SettlementRun['status'];
  totalRevenue: number;
  totalAllocated: number;
  currency: Currency;
  allocations: SettlementAllocation[];
  proof: ProofSummary;
  message: string;
}

/** BE `FinalizeSettlementResponseDto`. */
export interface FinalizeSettlementResult extends PreviewSettlementResult {
  ledger: LedgerRef;
  finalizedAt: string;
}

/** BE `ProofVerificationResponseDto` for `POST /settlement-runs/:id/verify`. */
export interface ProofVerificationResult {
  settlementRunId: string;
  verified: boolean;
  storedHash: string;
  computedHash: string;
  algorithm: string;
  originalTimestamp: string;
  verifiedAt: string;
  message: string;
}

/** Payload for `POST /settlement-runs/:id/corrections`, BE `CreateCorrectionRunDto`. */
export type CreateCorrectionRunInput = Readonly<{
  notes?: string;
  adjustmentRevenueBatchIds?: ReadonlyArray<string>;
  params?: Record<string, unknown>;
}>;
