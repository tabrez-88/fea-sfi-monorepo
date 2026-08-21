import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SettlementRunStatus } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { getRulesSchemaVersion } from '../../settlement/engine/types';
import type {
  RuleSnapshotRulesV2,
  WaterfallTierRule,
} from '../../settlement/engine/types';
import {
  InvestorRecoupmentDto,
  ParticipantStatementResponseDto,
  RecoupmentHistoryEntryDto,
  RecoupmentReportResponseDto,
  RecoupmentStatusEnum,
  StatementSettlementEntryDto,
} from '../dto';

/**
 * The engine writes a different phase enum depending on the snapshot mode,
 * so reports cannot key off a single value:
 *
 *   recoup mode     capital recovery -> RECOUPMENT
 *   waterfall mode  capital recovery -> WATERFALL_TIER_1
 *                   post-recoup      -> WATERFALL_TIER_2
 *   revenue_share   pool payouts     -> WATERFALL_TIER_1 (NOT recoupment:
 *                                       there is no cap in this mode)
 *   any mode        fees             -> DISTRIBUTION_FEES
 *                   retained profit  -> NET_PROFITS
 *
 * Reports normalise those raw phases into three categories the admin
 * actually thinks in. Because WATERFALL_TIER_1 means "recoup" in waterfall
 * mode but "revenue share" in revenue_share mode, categorisation needs the
 * mode of the snapshot each run used, not the phase alone.
 */
export const ReportCategory = {
  RECOUPMENT: 'RECOUPMENT',
  NET_PROFIT: 'NET_PROFIT',
  FEES: 'FEES',
} as const;

export type ReportCategory =
  (typeof ReportCategory)[keyof typeof ReportCategory];

/** Raw phases that can carry a participant payout. */
const PAYOUT_PHASES = [
  'RECOUPMENT',
  'NET_PROFITS',
  'DISTRIBUTION_FEES',
  'WATERFALL_TIER_1',
  'WATERFALL_TIER_2',
] as const;

function categorisePhase(
  phase: string,
  mode: string | null,
): ReportCategory | null {
  switch (phase) {
    case 'DISTRIBUTION_FEES':
      return ReportCategory.FEES;
    case 'RECOUPMENT':
      return ReportCategory.RECOUPMENT;
    case 'NET_PROFITS':
    case 'WATERFALL_TIER_2':
      return ReportCategory.NET_PROFIT;
    case 'WATERFALL_TIER_1':
      // Tier 1 only means recoupment when the snapshot actually recoups.
      return mode === 'revenue_share'
        ? ReportCategory.NET_PROFIT
        : ReportCategory.RECOUPMENT;
    default:
      // GROSS_RECEIPTS / POOL_REVENUE_SOURCE are routing phases that
      // allocate nothing to participants.
      return null;
  }
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

/**
 * MS-5 reporting reads.
 *
 * Every figure here is derived from what the engine already persisted
 * (settlement allocations, participant balances, the active rule snapshot)
 * rather than recomputed, so a report can never disagree with the
 * settlement it describes.
 */
@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async assertDealOwner(dealId: string, userId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, name: true, currency: true, userId: true },
    });
    if (!deal || deal.userId !== userId) {
      throw new NotFoundException(`Deal with ID ${dealId} not found`);
    }
    return deal;
  }

  /**
   * Screen 5.3: per-investor recoupment progress.
   *
   * The cap mirrors the engine exactly (`waterfall-tier.ts`): for each pool
   * member, `cap = investmentAmount x multiplier`, where the multiplier is
   * the strictest of the active snapshot's `recoupMultiplier` /
   * `hardCapMultiplier`. Progress comes from finalized RECOUPMENT
   * allocations, so it reflects money actually posted, not a projection.
   */
  async getRecoupmentReport(
    userId: string,
    dealId: string,
  ): Promise<RecoupmentReportResponseDto> {
    this.logger.log(`Building recoupment report for deal: ${dealId}`);

    const deal = await this.assertDealOwner(dealId, userId);

    // Every snapshot on the deal: the newest open one supplies the cap, and
    // the full set maps each run's snapshot to its mode so tier phases can
    // be categorised correctly (see `categorisePhase`).
    const snapshots = await this.prisma.ruleSnapshot.findMany({
      where: { dealId },
      orderBy: { version: 'desc' },
      select: { id: true, version: true, rules: true, effectiveTo: true },
    });

    const modeBySnapshot = new Map<string, string | null>(
      snapshots.map((s) => [s.id, this.extractMode(s.rules)]),
    );

    const activeSnapshot = snapshots.find((s) => s.effectiveTo === null) ?? null;
    const capMultiplier = activeSnapshot
      ? this.extractCapMultiplier(activeSnapshot.rules)
      : null;

    const participants = await this.prisma.participant.findMany({
      where: { dealId },
      select: { id: true, name: true, roleName: true, metadata: true },
      orderBy: { name: 'asc' },
    });

    // Only pool members carry invested capital to recoup.
    const investors = participants
      .map((p) => {
        const meta = (p.metadata ?? null) as Record<string, unknown> | null;
        return {
          id: p.id,
          name: p.name,
          roleName: p.roleName,
          investmentAmount: meta ? (readNumber(meta.investmentAmount) ?? 0) : 0,
          poolMember: meta ? readBoolean(meta.poolMember) : null,
        };
      })
      .filter((p) => p.poolMember === true || p.investmentAmount > 0);

    if (investors.length === 0) {
      return {
        dealId,
        dealName: deal.name,
        currency: deal.currency,
        ruleSnapshotVersion: activeSnapshot?.version ?? null,
        investors: [],
        summary: {
          totalInvested: 0,
          totalRecouped: 0,
          totalRemaining: 0,
          fullyRecoupedCount: 0,
        },
      };
    }

    const investorIds = investors.map((i) => i.id);

    // Payout allocations from FINALIZED runs only: a previewed run has not
    // paid anyone yet. Phases are filtered broadly here and narrowed to the
    // recoupment category below, because which phase counts as recoupment
    // depends on the run's snapshot mode.
    const allocations = await this.prisma.settlementAllocation.findMany({
      where: {
        participantId: { in: investorIds },
        phase: { in: [...PAYOUT_PHASES] },
        settlementRun: { dealId, status: SettlementRunStatus.FINALIZED },
      },
      select: {
        participantId: true,
        amount: true,
        phase: true,
        settlementRunId: true,
        settlementRun: {
          select: {
            runNumber: true,
            ruleSnapshotId: true,
            executedAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: { settlementRun: { runNumber: 'asc' } },
    });

    // Keep only what genuinely recoups capital, then fold multiple
    // allocations from the same run into one history entry.
    const recoupmentAllocations = allocations.filter(
      (a) =>
        categorisePhase(
          a.phase,
          modeBySnapshot.get(a.settlementRun.ruleSnapshotId) ?? null,
        ) === ReportCategory.RECOUPMENT,
    );

    type RunEntry = {
      settlementRunId: string;
      runNumber: number;
      amount: number;
      finalizedAt: Date;
    };
    const byParticipant = new Map<string, RunEntry[]>();
    for (const a of recoupmentAllocations) {
      const list = byParticipant.get(a.participantId) ?? [];
      const existing = list.find((e) => e.settlementRunId === a.settlementRunId);
      if (existing) {
        existing.amount = roundMoney(existing.amount + Number(a.amount));
      } else {
        list.push({
          settlementRunId: a.settlementRunId,
          runNumber: a.settlementRun.runNumber,
          amount: Number(a.amount),
          finalizedAt: a.settlementRun.executedAt ?? a.settlementRun.createdAt,
        });
      }
      byParticipant.set(a.participantId, list);
    }

    const rows: InvestorRecoupmentDto[] = investors.map((inv) => {
      const capAmount =
        capMultiplier !== null && inv.investmentAmount > 0
          ? roundMoney(inv.investmentAmount * capMultiplier)
          : null;

      let cumulative = 0;
      const history: RecoupmentHistoryEntryDto[] = (
        byParticipant.get(inv.id) ?? []
      ).map((entry) => {
        cumulative = roundMoney(cumulative + entry.amount);
        return {
          settlementRunId: entry.settlementRunId,
          runLabel: `Run #${entry.runNumber}`,
          amount: entry.amount,
          cumulative,
          carryForward:
            capAmount !== null ? Math.max(0, roundMoney(capAmount - cumulative)) : 0,
          finalizedAt: entry.finalizedAt.toISOString(),
        };
      });

      const totalRecouped = cumulative;
      const remaining =
        capAmount !== null ? Math.max(0, roundMoney(capAmount - totalRecouped)) : 0;
      const progressPercentage =
        capAmount !== null && capAmount > 0
          ? Math.min(100, roundMoney((totalRecouped / capAmount) * 100))
          : 0;

      let status: RecoupmentStatusEnum;
      if (capAmount === null) status = RecoupmentStatusEnum.NO_CAP;
      else if (remaining <= 0) status = RecoupmentStatusEnum.RECOUPED;
      else if (totalRecouped > 0) status = RecoupmentStatusEnum.IN_PROGRESS;
      else status = RecoupmentStatusEnum.NOT_STARTED;

      return {
        participantId: inv.id,
        participantName: inv.name,
        roleName: inv.roleName,
        investmentAmount: inv.investmentAmount,
        capMultiplier,
        capAmount,
        totalRecouped,
        remaining,
        progressPercentage,
        status,
        history,
      };
    });

    // Most outstanding capital first: that is what an admin chases.
    rows.sort((a, b) => b.remaining - a.remaining);

    return {
      dealId,
      dealName: deal.name,
      currency: deal.currency,
      ruleSnapshotVersion: activeSnapshot?.version ?? null,
      investors: rows,
      summary: {
        totalInvested: roundMoney(
          rows.reduce((acc, r) => acc + r.investmentAmount, 0),
        ),
        totalRecouped: roundMoney(rows.reduce((acc, r) => acc + r.totalRecouped, 0)),
        totalRemaining: roundMoney(rows.reduce((acc, r) => acc + r.remaining, 0)),
        fullyRecoupedCount: rows.filter(
          (r) => r.status === RecoupmentStatusEnum.RECOUPED,
        ).length,
      },
    };
  }

  /**
   * Screen 5.4: everything one participant was paid on a deal, grouped by
   * settlement run and broken out by phase (recoupment vs net profit vs
   * fees), with each run's proof hash for the verification section.
   */
  async getParticipantStatement(
    userId: string,
    dealId: string,
    participantId: string,
  ): Promise<ParticipantStatementResponseDto> {
    this.logger.log(
      `Building statement for participant ${participantId} on deal ${dealId}`,
    );

    const deal = await this.assertDealOwner(dealId, userId);

    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
      select: {
        id: true,
        dealId: true,
        name: true,
        roleName: true,
        behaviorType: true,
      },
    });
    if (!participant || participant.dealId !== dealId) {
      throw new NotFoundException(
        `Participant with ID ${participantId} not found on this deal`,
      );
    }

    // Snapshot modes are needed to categorise tier phases (see
    // `categorisePhase`); a deal can span several snapshots with different
    // modes, so map them all rather than assuming the active one.
    const snapshots = await this.prisma.ruleSnapshot.findMany({
      where: { dealId },
      select: { id: true, rules: true },
    });
    const modeBySnapshot = new Map<string, string | null>(
      snapshots.map((s) => [s.id, this.extractMode(s.rules)]),
    );

    const allocations = await this.prisma.settlementAllocation.findMany({
      where: {
        participantId,
        phase: { in: [...PAYOUT_PHASES] },
        settlementRun: { dealId, status: SettlementRunStatus.FINALIZED },
      },
      select: {
        amount: true,
        phase: true,
        settlementRunId: true,
        settlementRun: {
          select: {
            runNumber: true,
            runType: true,
            ruleSnapshotId: true,
            executedAt: true,
            createdAt: true,
            proofRecords: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              select: { proofHash: true },
            },
          },
        },
      },
      orderBy: { settlementRun: { runNumber: 'desc' } },
    });

    const byRun = new Map<string, StatementSettlementEntryDto>();
    for (const a of allocations) {
      const category = categorisePhase(
        a.phase,
        modeBySnapshot.get(a.settlementRun.ruleSnapshotId) ?? null,
      );
      if (!category) continue;

      const amount = Number(a.amount);
      const existing = byRun.get(a.settlementRunId);
      if (existing) {
        existing.total = roundMoney(existing.total + amount);
        existing.byPhase[category] = roundMoney(
          (existing.byPhase[category] ?? 0) + amount,
        );
        continue;
      }
      byRun.set(a.settlementRunId, {
        settlementRunId: a.settlementRunId,
        runLabel: `Run #${a.settlementRun.runNumber}`,
        runType: a.settlementRun.runType,
        total: amount,
        byPhase: { [category]: amount },
        finalizedAt: (
          a.settlementRun.executedAt ?? a.settlementRun.createdAt
        ).toISOString(),
        proofHash: a.settlementRun.proofRecords[0]?.proofHash ?? null,
      });
    }

    const settlements = [...byRun.values()];

    const sumCategory = (category: ReportCategory) =>
      roundMoney(
        settlements.reduce((acc, s) => acc + (s.byPhase[category] ?? 0), 0),
      );

    return {
      participantId: participant.id,
      participantName: participant.name,
      roleName: participant.roleName,
      behaviorType: participant.behaviorType,
      dealId,
      dealName: deal.name,
      currency: deal.currency,
      generatedAt: new Date().toISOString(),
      summary: {
        totalReceived: roundMoney(settlements.reduce((acc, s) => acc + s.total, 0)),
        totalRecoupment: sumCategory(ReportCategory.RECOUPMENT),
        totalNetProfit: sumCategory(ReportCategory.NET_PROFIT),
        totalFees: sumCategory(ReportCategory.FEES),
        settlementCount: settlements.length,
      },
      settlements,
    };
  }

  /**
   * Pull the binding cap multiplier out of a stored snapshot. Mirrors the
   * engine's `pickEffectiveCapMultiplier`: when a tier sets both
   * `recoupMultiplier` and `hardCapMultiplier`, the smaller one binds.
   * Returns null for v1 snapshots or when no tier declares a cap.
   */
  private extractCapMultiplier(rules: unknown): number | null {
    if (getRulesSchemaVersion(rules as Record<string, unknown>) !== 2) return null;

    const v2 = rules as RuleSnapshotRulesV2;
    const tiers: WaterfallTierRule[] = v2.tiers ?? [];

    // Select by tier NUMBER, never by array position: the validator does
    // not enforce that tiers are stored in order, so a snapshot listing
    // tier 2 first would otherwise yield the post-recoup cap here and
    // disagree with what the engine actually applied.
    const tierOne = tiers.find((t) => t.tier === 1) ?? tiers[0];
    if (!tierOne) return null;

    const multiplier = this.pickEffectiveCapMultiplier(tierOne);
    return multiplier !== undefined && multiplier > 0 ? multiplier : null;
  }

  /**
   * Mirrors `pickEffectiveCapMultiplier` in the engine's waterfall-tier
   * phase: when a tier declares both, the stricter (smaller) one binds.
   */
  private pickEffectiveCapMultiplier(
    tier: WaterfallTierRule,
  ): number | undefined {
    if (
      tier.recoupMultiplier !== undefined &&
      tier.hardCapMultiplier !== undefined
    ) {
      return Math.min(tier.recoupMultiplier, tier.hardCapMultiplier);
    }
    return tier.recoupMultiplier ?? tier.hardCapMultiplier;
  }

  /** Snapshot mode ('waterfall' | 'recoup' | 'revenue_share'), null for v1. */
  private extractMode(rules: unknown): string | null {
    if (getRulesSchemaVersion(rules as Record<string, unknown>) !== 2) return null;
    const mode = (rules as RuleSnapshotRulesV2).mode;
    return typeof mode === 'string' ? mode : null;
  }
}
