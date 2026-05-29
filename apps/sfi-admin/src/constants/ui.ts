import type {
  RevenueBatchStatus,
  SettlementRunStatus,
} from '@/types/dashboard.types';
import type { DealStatus } from '@/types/deal.types';
import type { ParticipantBehavior } from '@/types/participant.types';
import type { RuleSnapshotStatus } from '@/types/rule-snapshot.types';

/** Badge/pill tone: maps an API status enum to a `Badge` variant. */
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

export const PARTICIPANT_BEHAVIOR_TONE: Record<ParticipantBehavior, StatusTone> = {
  FEE_DEDUCTION: 'danger',
  RECOUPMENT: 'success',
  NET_PROFIT_SHARE: 'info',
  FLAT_FEE: 'warning',
  PASS_THROUGH: 'neutral',
};

/**
 * Human-readable label for each behavior chip. Matches Round 2.1 #5: display
 * "Profit Share" everywhere even though the backend enum stays `NET_PROFIT_SHARE`.
 */
export const PARTICIPANT_BEHAVIOR_LABEL: Record<ParticipantBehavior, string> = {
  FEE_DEDUCTION: 'Fee Deduction',
  RECOUPMENT: 'Recoupment',
  NET_PROFIT_SHARE: 'Profit Share',
  FLAT_FEE: 'Flat Fee',
  PASS_THROUGH: 'Pass-Through',
};

export const RULE_SNAPSHOT_STATUS_TONE: Record<RuleSnapshotStatus, StatusTone> = {
  ACTIVE: 'success',
  CLOSED: 'neutral',
};

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

export const SIDEBAR_WIDTH = 280;
