/**
 * Shared type definitions for SFI-FEA platform
 */

import type {
  Currency,
  DealStatus,
  DocumentType,
  LedgerAccountType,
  ParticipantRole,
  RevenueBatchStatus,
  RunType,
  SettlementPhase,
} from '../enums';

/**
 * Base entity type with common audit fields
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Deal entity type
 */
export interface Deal extends BaseEntity {
  name: string;
  description?: string;
  status: DealStatus;
  effectiveDate: Date;
  terminationDate?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Participant entity type
 */
export interface Participant extends BaseEntity {
  dealId: string;
  name: string;
  role: ParticipantRole;
  externalId?: string;
  email?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Rule snapshot type
 */
export interface RuleSnapshot extends BaseEntity {
  dealId: string;
  version: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  rules: Record<string, unknown>;
}

/**
 * Revenue batch type
 */
export interface RevenueBatch extends BaseEntity {
  dealId: string;
  batchNumber: string;
  periodStart: Date;
  periodEnd: Date;
  totalAmount: number;
  currency: Currency;
  status: RevenueBatchStatus;
  source?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Settlement run type
 */
export interface SettlementRun extends BaseEntity {
  dealId: string;
  ruleSnapshotId: string;
  runType: RunType;
  originalSettlementRunId?: string;
  executedAt: Date;
  totalAllocated: number;
  currency: Currency;
  metadata?: Record<string, unknown>;
}

/**
 * Settlement allocation type
 */
export interface SettlementAllocation extends BaseEntity {
  settlementRunId: string;
  participantId: string;
  amount: number;
  currency: Currency;
  phase: SettlementPhase;
  metadata?: Record<string, unknown>;
}

/**
 * Ledger journal type
 */
export interface LedgerJournal extends BaseEntity {
  settlementRunId: string;
  dealId: string;
  journalNumber: string;
  description?: string;
  postedAt: Date;
}

/**
 * Ledger posting type
 */
export interface LedgerPosting extends BaseEntity {
  ledgerJournalId: string;
  participantId?: string;
  accountType: LedgerAccountType;
  accountCode: string;
  debitAmount: number;
  creditAmount: number;
  currency: Currency;
  description?: string;
}

/**
 * Document type
 */
export interface Document extends BaseEntity {
  dealId?: string;
  revenueBatchId?: string;
  settlementRunId?: string;
  docType: DocumentType;
  fileName: string;
  storageUrl: string;
  checksum: string;
  uploadedAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Proof record type
 */
export interface ProofRecord extends BaseEntity {
  settlementRunId: string;
  proofHash: string;
  algorithm: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

/**
 * API response wrapper type
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

/**
 * Pagination params type
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
