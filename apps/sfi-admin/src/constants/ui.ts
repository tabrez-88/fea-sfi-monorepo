import type { DealStatus } from '@/types/deal.types';
import type {
  RevenueBatchStatus,
  SettlementRunStatus,
} from '@/types/dashboard.types';

/** Badge/pill tone — maps an API status enum to a `Badge` variant. */
export type StatusTone =
  | 'success'
  | 'warning'
  | 'info'
  | 'danger'
  | 'neutral'
  | 'default';

export const DEAL_STATUS_TONE: Record<DealStatus, StatusTone> = {
  DRAFT: 'neutral',
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  CLOSED: 'danger',
};

export const REVENUE_BATCH_STATUS_TONE: Record<RevenueBatchStatus, StatusTone> = {
  PENDING: 'warning',
  VALIDATED: 'success',
  REJECTED: 'danger',
  PROCESSED: 'info',
};

export const SETTLEMENT_RUN_STATUS_TONE: Record<SettlementRunStatus, StatusTone> = {
  DRAFT: 'neutral',
  PREVIEWED: 'neutral',
  FINALIZED: 'success',
  CANCELLED: 'danger',
  VOIDED: 'danger',
};

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

export const SIDEBAR_WIDTH = 280;
