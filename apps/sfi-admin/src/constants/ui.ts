import type {
  RevenueBatchStatus,
  SettlementRunStatus,
} from '@/types/dashboard.types';
import type { DealCategory, DealStatus } from '@/types/deal.types';
import type { DocumentType } from '@/types/document.types';
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
  CLOSED: 'info',
  TERMINATED: 'danger',
  ARCHIVED: 'neutral',
};

/**
 * Display label for each Deal status. The underlying enum is kept stable
 * for BE compatibility (SUSPENDED / CLOSED still travel on the wire) but
 * the FE relabels them per Liang's Round 4 wording — "Paused" reads
 * less alarming than "Suspended" and "Completed" is clearer than
 * "Closed" for the typical lifecycle.
 */
export const DEAL_STATUS_LABEL: Record<DealStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  SUSPENDED: 'Paused',
  CLOSED: 'Completed',
  TERMINATED: 'Terminated',
  ARCHIVED: 'Archived',
};

/**
 * Verbatim status definitions from Liang's Part 2 reply (2026-06-05).
 * Surfaced as hover tooltips on the status badge + as inline help text
 * below the Status select in Create / Edit Deal forms so the admin
 * doesn't have to guess which lifecycle state applies.
 *
 * Key conceptual distinction:
 *   - Completed = Ended as Planned
 *   - Terminated = Ended Early
 */
export const DEAL_STATUS_DEFINITION: Record<DealStatus, string> = {
  DRAFT:
    'The deal is still being configured. Participants, revenue sources, settlement rules, and other details may still be incomplete. The deal is not yet active.',
  ACTIVE:
    'The deal is currently in effect. Revenue may be reported, settlement runs may be executed, and participants may receive allocations according to the Rule Snapshot.',
  SUSPENDED:
    'The deal has been temporarily suspended. No new settlement runs should occur while the deal is paused, but it may be reactivated later.',
  CLOSED:
    'Ended as planned. Examples: reaching the end of a fixed term, satisfying a recoupment requirement, or completing a project lifecycle.',
  TERMINATED:
    'Ended before its originally planned completion. Examples: contract cancellation, acquisition, buyout, restructuring, or legal termination.',
  ARCHIVED:
    'Retained as a historical record. Hidden from active workflows but remain available for audit, reporting, and reference purposes.',
};

/**
 * Display label for each Deal category. Underscored enum values become
 * human-readable strings here — keeps the rest of the UI from re-doing
 * the same string formatting at every call site.
 */
export const DEAL_CATEGORY_LABEL: Record<DealCategory, string> = {
  MUSIC: 'Music',
  FILM_AND_TV: 'Film & TV',
  LIVE_EVENTS_AND_SPORTS: 'Live Events & Sports',
  GAMES_AND_INTERACTIVE_MEDIA: 'Games & Interactive Media',
  CREATOR_AND_CONSUMER_IP: 'Creator & Consumer IP',
  AI_AND_FUTURE_MEDIA: 'AI & Future Media',
};

export const REVENUE_BATCH_STATUS_TONE: Record<RevenueBatchStatus, StatusTone> = {
  PENDING: 'warning',
  VALIDATED: 'success',
  REJECTED: 'danger',
  PROCESSED: 'info',
};

/**
 * Screen 3.1 uses Liang's friendlier label "Locked in Settlement" for the
 * PROCESSED status — the batch is locked because a finalized settlement
 * consumed it. Backend enum stays `PROCESSED` for wire compatibility.
 */
export const REVENUE_BATCH_STATUS_LABEL: Record<RevenueBatchStatus, string> = {
  PENDING: 'Pending',
  VALIDATED: 'Validated',
  PROCESSED: 'Locked in Settlement',
  REJECTED: 'Rejected',
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
 * Human-readable label for each behavior chip. Backend enum names stay
 * stable (`NET_PROFIT_SHARE`, `FLAT_FEE`) but the FE labels track product
 * copy: Round 4 (Liang) renamed Profit Share → Revenue Share and Flat
 * Fee → Fixed Payment to better convey what each role does to a new
 * admin reading the screen for the first time.
 */
export const PARTICIPANT_BEHAVIOR_LABEL: Record<ParticipantBehavior, string> = {
  FEE_DEDUCTION: 'Fee Deduction',
  RECOUPMENT: 'Recoupment',
  NET_PROFIT_SHARE: 'Revenue Share',
  FLAT_FEE: 'Fixed Payment',
  PASS_THROUGH: 'Pass-Through',
};

export const RULE_SNAPSHOT_STATUS_TONE: Record<RuleSnapshotStatus, StatusTone> = {
  ACTIVE: 'success',
  CLOSED: 'neutral',
};

/**
 * Tone + label for each `DocumentType`. Screen 3.4 uses the label as the
 * badge text and groups the tabs by broader category (Contracts /
 * Revenue Reports / Settlement Reports / Other) — see
 * `DOCUMENT_TYPE_GROUPS` below for the tab mapping.
 */
export const DOCUMENT_TYPE_TONE: Record<DocumentType, StatusTone> = {
  CONTRACT: 'info',
  AMENDMENT: 'info',
  REVENUE_REPORT: 'success',
  SETTLEMENT_REPORT: 'warning',
  AUDIT_REPORT: 'neutral',
  PROOF_RECORD: 'neutral',
  OFFERING_DOCUMENT: 'info',
  INVESTOR_AGREEMENT: 'info',
  DISCLOSURE: 'warning',
  REVENUE_SHARE_TERMS: 'info',
  OTHER: 'neutral',
};

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  CONTRACT: 'Contract',
  AMENDMENT: 'Amendment',
  REVENUE_REPORT: 'Revenue Report',
  SETTLEMENT_REPORT: 'Settlement Report',
  AUDIT_REPORT: 'Audit Report',
  PROOF_RECORD: 'Proof Record',
  OFFERING_DOCUMENT: 'Offering',
  INVESTOR_AGREEMENT: 'Investor Agreement',
  DISCLOSURE: 'Disclosure',
  REVENUE_SHARE_TERMS: 'Revenue Share Terms',
  OTHER: 'Other',
};

/**
 * Screen 3.4 filter tabs group multiple raw DocumentType values under
 * one visible tab. Frontend maps the active tab to the underlying doc
 * types when it filters the visible rows.
 */
export const DOCUMENT_TYPE_GROUPS = {
  ALL: 'All',
  CONTRACTS: 'Contracts',
  REVENUE_REPORTS: 'Revenue Reports',
  SETTLEMENT_REPORTS: 'Settlement Reports',
  OTHER: 'Other',
} as const;

export type DocumentTypeGroup =
  (typeof DOCUMENT_TYPE_GROUPS)[keyof typeof DOCUMENT_TYPE_GROUPS];

export const DOCUMENT_TYPE_GROUP_MEMBERS: Record<
  Exclude<DocumentTypeGroup, 'All'>,
  ReadonlyArray<DocumentType>
> = {
  Contracts: ['CONTRACT', 'AMENDMENT', 'OFFERING_DOCUMENT', 'INVESTOR_AGREEMENT', 'REVENUE_SHARE_TERMS'],
  'Revenue Reports': ['REVENUE_REPORT'],
  'Settlement Reports': ['SETTLEMENT_REPORT', 'AUDIT_REPORT', 'PROOF_RECORD'],
  Other: ['DISCLOSURE', 'OTHER'],
};

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

export const SIDEBAR_WIDTH = 280;
