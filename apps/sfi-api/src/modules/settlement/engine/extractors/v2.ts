/**
 * V2 rule snapshot → engine `SettlementRules` extractor.
 *
 * Pure transformation logic. Lives in the engine module (not the
 * settlement service) so it stays framework-free and is unit-testable
 * without bootstrapping NestJS.
 *
 * Run 2 substrate behavior:
 *   - `deductions[]` → engine `distributionFees` (carries both percentage
 *     and FLATFEE variants — `DeductionRule = DistributionFeeRule`).
 *   - `mode: 'recoup' | 'waterfall'`: tier `splits` with `type:
 *     'individual'` are routed to `recoupment[]` (when behaviorType ===
 *     'RECOUPMENT') or `netProfitSplit[]` (everyone else). Per-tier
 *     `recoupMultiplier` flows through to the engine rule.
 *   - `mode: 'revenue_share'`: top-level `splits[]` flow into
 *     `netProfitSplit[]`.
 *   - Pool targets are skipped — the pool resolver lives in Run 3.
 *
 * Why we still read `participantData` for recoupAmount/recoupCap: the v2
 * shape only carries the multiplier + caps on the tier, not the per-
 * investor recoup amount. That stays on each `RuleSnapshotParticipant`'s
 * `participantData` JSON for now (same as v1). Run 3 either keeps this
 * coupling or moves recoup amounts onto the v2 tier rule.
 */

import { DeductionRule, RuleSnapshotRulesV2, SettlementRules } from '../types';

export interface V2ExtractionParticipant {
  participantId: string;
  participantData: unknown;
  participant: { roleName: string; behaviorType: string };
}

export function extractV2SettlementRules(
  rules: RuleSnapshotRulesV2,
  participants: V2ExtractionParticipant[],
): SettlementRules {
  const distributionFees: SettlementRules['distributionFees'] = [];
  const recoupment: SettlementRules['recoupment'] = [];
  const netProfitSplit: SettlementRules['netProfitSplit'] = [];

  for (const d of rules.deductions ?? []) {
    distributionFees.push(buildDistributionFee(d));
  }

  const byId = new Map(participants.map((p) => [p.participantId, p]));

  const collect = (
    splits: RuleSnapshotRulesV2['splits'] | undefined,
    tierMultiplier?: number,
    tierPriority?: number,
  ) => {
    if (!splits) return;
    for (const split of splits) {
      if (split.target.type === 'pool') continue; // Run 3 territory
      routeIndividualSplit(split.target.participantId, split.percentage, byId, {
        tierMultiplier,
        tierPriority,
        recoupment,
        netProfitSplit,
      });
    }
  };

  if (rules.mode === 'revenue_share') {
    collect(rules.splits);
  } else {
    for (const tier of rules.tiers ?? []) {
      collect(tier.splits, tier.recoupMultiplier, tier.tier);
    }
  }

  return { distributionFees, recoupment, netProfitSplit };
}

function buildDistributionFee(d: DeductionRule): SettlementRules['distributionFees'][number] {
  return {
    participantId: d.participantId,
    feePercentage: d.feePercentage,
    ...(d.feeAmount !== undefined && { feeAmount: d.feeAmount }),
  };
}

function routeIndividualSplit(
  participantId: string,
  percentage: number,
  byId: Map<string, V2ExtractionParticipant>,
  ctx: {
    tierMultiplier?: number;
    tierPriority?: number;
    recoupment: SettlementRules['recoupment'];
    netProfitSplit: SettlementRules['netProfitSplit'];
  },
): void {
  const p = byId.get(participantId);
  const behavior = p?.participant.behaviorType;

  if (behavior !== 'RECOUPMENT') {
    ctx.netProfitSplit.push({ participantId, percentage });
    return;
  }

  const data = (p?.participantData ?? {}) as Record<string, unknown>;
  const recoupAmount = (data.recoupAmount ?? 0) as number;
  ctx.recoupment.push({
    participantId,
    recoupAmount,
    recoupCap: (data.recoupCap ?? recoupAmount) as number,
    priority: ctx.tierPriority ?? ((data.priority ?? 1) as number),
    previouslyRecouped: (data.previouslyRecouped ?? 0) as number,
    ...(ctx.tierMultiplier !== undefined && { recoupMultiplier: ctx.tierMultiplier }),
  });
}
