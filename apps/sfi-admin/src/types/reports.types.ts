import type { Currency } from '@/types/deal.types';
import type { SettlementRunType } from '@/types/settlement.types';

/**
 * Reporting categories, not raw engine phases.
 *
 * The engine writes a different phase per snapshot mode (RECOUPMENT in
 * recoup mode, WATERFALL_TIER_1 in waterfall mode, and the same
 * WATERFALL_TIER_1 for plain revenue share). The reports endpoints
 * normalise all of that into these three buckets, so the FE never has to
 * know which mode produced a payout.
 */
export const ReportCategory = {
  RECOUPMENT: 'RECOUPMENT',
  NET_PROFIT: 'NET_PROFIT',
  FEES: 'FEES',
} as const;

export type ReportCategory =
  (typeof ReportCategory)[keyof typeof ReportCategory];

/** BE `RecoupmentStatusEnum`. */
export const RecoupmentStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  RECOUPED: 'RECOUPED',
  NO_CAP: 'NO_CAP',
} as const;

export type RecoupmentStatus =
  (typeof RecoupmentStatus)[keyof typeof RecoupmentStatus];

/** One finalized run's contribution to an investor's recoupment. */
export interface RecoupmentHistoryEntry {
  settlementRunId: string;
  runLabel: string;
  amount: number;
  cumulative: number;
  /** Capital still outstanding after this run. */
  carryForward: number;
  finalizedAt: string;
}

export interface InvestorRecoupment {
  participantId: string;
  participantName: string;
  roleName: string;
  investmentAmount: number;
  /** Null when the active snapshot sets no cap. */
  capMultiplier?: number | null;
  capAmount?: number | null;
  totalRecouped: number;
  remaining: number;
  progressPercentage: number;
  status: RecoupmentStatus;
  history: RecoupmentHistoryEntry[];
}

/** BE `RecoupmentReportResponseDto` for `GET /deals/:id/reports/recoupment`. */
export interface RecoupmentReport {
  dealId: string;
  dealName: string;
  currency: Currency;
  ruleSnapshotVersion?: number | null;
  investors: InvestorRecoupment[];
  summary: {
    totalInvested: number;
    totalRecouped: number;
    totalRemaining: number;
    fullyRecoupedCount: number;
  };
}

/** One settlement's payout to a participant, split by phase. */
export interface StatementSettlementEntry {
  settlementRunId: string;
  runLabel: string;
  runType: SettlementRunType;
  total: number;
  /** Payout split into reporting categories; absent keys mean zero. */
  byPhase: Partial<Record<ReportCategory, number>>;
  finalizedAt: string;
  proofHash?: string | null;
}

/** BE `ParticipantStatementResponseDto`. */
export interface ParticipantStatement {
  participantId: string;
  participantName: string;
  roleName: string;
  behaviorType: string;
  dealId: string;
  dealName: string;
  currency: Currency;
  generatedAt: string;
  summary: {
    totalReceived: number;
    totalRecoupment: number;
    totalNetProfit: number;
    totalFees: number;
    settlementCount: number;
  };
  settlements: StatementSettlementEntry[];
}
