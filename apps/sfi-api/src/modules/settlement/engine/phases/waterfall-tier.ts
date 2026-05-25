/**
 * Phase: Waterfall Tier (FB-003 Run 3 / BE-FB003-TIER2 + HARDCAP)
 *
 * Generic Tier 1 / Tier 2 processor. Routes its bucket through the
 * configured `splits[]` per `WaterfallTierRule`, expanding pool targets
 * via the pool resolver and enforcing per-investor hard caps with
 * cross-run cumulative tracking.
 *
 * Round 3 Comment 12 — exit conditions evaluate as `Hard Cap OR Deadline`,
 * whichever fires first binds. Deadline is evaluated per-tier using the
 * `runDate` threaded from `SettlementRun.createdAt` (preview determinism —
 * the engine never calls `new Date()`).
 *
 * Round 3 Don'ts respected:
 *   - Hard cap only applies to POOL MEMBERS (`poolMember === true`).
 *     Individual (non-pool) targets are paid in full — they have no cap.
 *   - Cumulative tracking is clip-not-skip on cap: a member who would
 *     exceed their cap is paid exactly the remaining headroom; the
 *     surplus stays in the pool and is redistributed pro-rata to members
 *     who still have headroom.
 *
 * Engine still emits one allocation per recipient (pool members are
 * expanded; individual targets are paid directly). `details` carries
 * exit-condition fire info + pool-resolution strategy so the FE can
 * render chips per Round 3 Comment 14 r8.
 */

import {
  AllocationEntry,
  ExitConditionChip,
  ParticipantBalanceOutput,
  ParticipantInput,
  Phase,
  PhaseResult,
  WaterfallTierRule,
} from '../types';
import { clampPositive, minAmount, mulPercent, roundMoney, subtract, sum } from '../utils/decimal';
import { resolvePool, ShareBasis } from '../utils/pool';

export interface WaterfallTierResult extends PhaseResult {
  /** Per-investor balance write-back (pool members only) */
  participantBalances: ParticipantBalanceOutput[];
  /**
   * Whether a tier-wide exit condition fired this run. When set, the
   * remaining-amount flows to the next tier OR back to the creator
   * (engine decides based on mode).
   */
  exitFired?: { type: 'hard_cap' | 'deadline'; firedAt: string };
}

export interface WaterfallTierContext {
  /** Tier number 1 or 2 — drives Phase enum + label */
  tier: 1 | 2;
  /** Bucket allocated to this tier (already net of pool revenue source / Tier 1 outflow) */
  inputAmount: number;
  /** Tier rule from the v2 snapshot */
  rule: WaterfallTierRule;
  /** All participants (engine looks up names / pool members) */
  participants: ParticipantInput[];
  /** ISO date for deadline evaluation — required when `rule.deadline` is set */
  runDate?: string;
  /** Prior-run cumulative payouts keyed by participantId (for cross-run hard cap) */
  priorBalances: Map<string, number>;
}

export function processWaterfallTier(ctx: WaterfallTierContext): WaterfallTierResult {
  const phase = ctx.tier === 1 ? Phase.WATERFALL_TIER_1 : Phase.WATERFALL_TIER_2;
  const allocations: AllocationEntry[] = [];
  const participantBalances: ParticipantBalanceOutput[] = [];
  const details: Record<string, unknown> = { tier: ctx.tier };

  // Deadline check — if the run date is past the tier's deadline, skip
  // this tier entirely. All input flows downstream (next tier or creator).
  const deadlineFired = evaluateDeadline(ctx);
  if (deadlineFired) {
    details.skipped = 'deadline_reached';
    details.deadline = ctx.rule.deadline;
    details.runDate = ctx.runDate;
    return {
      phase,
      inputAmount: ctx.inputAmount,
      totalAllocated: 0,
      remainingAmount: ctx.inputAmount,
      allocations,
      participantBalances,
      exitFired: { type: 'deadline', firedAt: ctx.runDate ?? '' },
      details,
    };
  }

  // Process each split: route the percentage to the target, expanding
  // pool targets via the resolver. Hard cap is enforced AFTER all splits
  // are tentatively assigned, so cap surplus can redistribute pro-rata.
  const tentative = computeTentativeShares(ctx);

  // Hard cap pass — only applies to pool members.
  const capResult = applyHardCap(tentative, ctx);

  details.poolResolutions = capResult.poolResolutions;
  details.capRedistribution = capResult.redistributed;
  details.warnings = capResult.warnings;

  // Build AllocationEntry rows from the final per-recipient amounts.
  for (const recipient of capResult.recipients) {
    if (recipient.amount <= 0) continue;
    allocations.push({
      participantId: recipient.participantId,
      participantName: recipient.participantName,
      phase,
      amount: recipient.amount,
      metadata: {
        tier: ctx.tier,
        splitPercentage: recipient.splitPercentage,
        targetType: recipient.targetType,
        ...(recipient.poolBasis !== undefined && { poolBasis: recipient.poolBasis }),
        ...(recipient.capClipped !== undefined && { capClipped: recipient.capClipped }),
      },
    });
  }

  // Build per-pool-member balance write-back rows.
  for (const recipient of capResult.recipients) {
    if (recipient.targetType !== 'pool') continue;
    const prior = ctx.priorBalances.get(recipient.participantId) ?? 0;
    const cumulative = roundMoney(prior + recipient.amount);
    participantBalances.push({
      participantId: recipient.participantId,
      cumulativePayout: cumulative,
      paidThisRun: recipient.amount,
      exitConditions: recipient.exitConditions ?? [],
    });
  }

  const totalAllocated = sum(allocations.map((a) => a.amount));
  const remainingAmount = subtract(ctx.inputAmount, totalAllocated);

  return {
    phase,
    inputAmount: ctx.inputAmount,
    totalAllocated,
    remainingAmount,
    allocations,
    participantBalances,
    details,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Exit-condition: deadline
// ──────────────────────────────────────────────────────────────────────

function evaluateDeadline(ctx: WaterfallTierContext): boolean {
  if (!ctx.rule.deadline) return false;
  if (!ctx.runDate) return false;
  const deadline = Date.parse(ctx.rule.deadline);
  const runAt = Date.parse(ctx.runDate);
  if (Number.isNaN(deadline) || Number.isNaN(runAt)) return false;
  return runAt > deadline;
}

// ──────────────────────────────────────────────────────────────────────
// Tentative shares: walk splits, expand pool targets
// ──────────────────────────────────────────────────────────────────────

interface RecipientShare {
  participantId: string;
  participantName: string;
  targetType: 'individual' | 'pool';
  /** Tentative amount BEFORE hard-cap clip */
  tentative: number;
  /** Final amount AFTER hard-cap clip (set in applyHardCap) */
  amount: number;
  splitPercentage: number;
  /** For pool members: which basis the resolver used */
  poolBasis?: 'units' | 'investment' | 'equal';
  /** Set when hard cap clipped the tentative amount */
  capClipped?: { tentative: number; cap: number; clippedTo: number };
  /** Per-investor exit-condition chips for FE Detail page */
  exitConditions?: ExitConditionChip[];
}

interface TentativeResult {
  recipients: RecipientShare[];
  /** Pool resolutions encountered during this tier (for `details`) */
  poolResolutions: Array<{ poolId: string; strategy: ShareBasis; warnings: string[] }>;
  warnings: string[];
}

function computeTentativeShares(ctx: WaterfallTierContext): TentativeResult {
  const recipients: RecipientShare[] = [];
  const poolResolutions: Array<{ poolId: string; strategy: ShareBasis; warnings: string[] }> = [];
  const warnings: string[] = [];
  const byId = new Map(ctx.participants.map((p) => [p.id, p]));

  for (const split of ctx.rule.splits) {
    const sliceAmount = mulPercent(ctx.inputAmount, split.percentage);
    if (split.target.type === 'individual') {
      const participant = byId.get(split.target.participantId);
      if (!participant) {
        warnings.push(`Split references unknown participant ${split.target.participantId}`);
        continue;
      }
      recipients.push({
        participantId: participant.id,
        participantName: participant.name,
        targetType: 'individual',
        tentative: sliceAmount,
        amount: sliceAmount, // individuals are not capped — final = tentative
        splitPercentage: split.percentage,
      });
      continue;
    }
    // Pool target — resolve into per-member shares.
    const poolId = split.target.poolId;
    const members = ctx.participants.filter((p) => p.poolMember === true && p.poolId === poolId);
    // Back-compat: if no participant carries `poolId`, fall back to "all
    // pool members regardless of poolId" (single-pool snapshots — v1
    // constraint of ≤1 pool per snapshot).
    const effectiveMembers = members.length > 0
      ? members
      : ctx.participants.filter((p) => p.poolMember === true);

    const resolution = resolvePool(sliceAmount, effectiveMembers);
    poolResolutions.push({
      poolId,
      strategy: resolution.strategy,
      warnings: resolution.warnings,
    });

    for (const memberShare of resolution.members) {
      recipients.push({
        participantId: memberShare.participantId,
        participantName: memberShare.participantName,
        targetType: 'pool',
        tentative: memberShare.amount,
        amount: memberShare.amount,
        splitPercentage: memberShare.poolPercentage,
        poolBasis: memberShare.basis,
      });
    }
  }

  return { recipients, poolResolutions, warnings };
}

// ──────────────────────────────────────────────────────────────────────
// Hard-cap pass: clip pool members against `recoupAmount × hardCapMultiplier`
// using cross-run cumulative payouts. Redistribute surplus pro-rata to
// pool members with remaining headroom. Individual targets are untouched.
// ──────────────────────────────────────────────────────────────────────

interface ApplyCapResult {
  recipients: RecipientShare[];
  poolResolutions: Array<{ poolId: string; strategy: ShareBasis; warnings: string[] }>;
  redistributed: number;
  warnings: string[];
}

function applyHardCap(
  tentative: TentativeResult,
  ctx: WaterfallTierContext,
): ApplyCapResult {
  // Round 3 Comment 12 — both `recoupMultiplier` (typically Tier 1) and
  // `hardCapMultiplier` (typically Tier 2) act as per-investor caps:
  // `cap = investmentAmount × multiplier`. When BOTH are set, the
  // strictest binds (validator enforces hardCapMultiplier ≥ recoupMultiplier
  // so recoupMultiplier is always ≤; just take the lower of the two).
  const effectiveMultiplier = pickEffectiveCapMultiplier(ctx.rule);

  if (effectiveMultiplier === undefined) {
    // No cap on this tier — pool members just get their tentative share.
    // Still attach empty exitConditions[] so the FE renders "None" chips.
    return {
      recipients: tentative.recipients.map((r) =>
        r.targetType === 'pool' ? { ...r, exitConditions: noneExitChips() } : r,
      ),
      poolResolutions: tentative.poolResolutions,
      redistributed: 0,
      warnings: tentative.warnings,
    };
  }
  const hardCapMultiplier = effectiveMultiplier;

  const byId = new Map(ctx.participants.map((p) => [p.id, p]));
  const recipients: RecipientShare[] = [];
  let surplus = 0;
  const eligibleForRedistribution: RecipientShare[] = [];

  for (const r of tentative.recipients) {
    if (r.targetType !== 'pool') {
      recipients.push(r);
      continue;
    }
    const participant = byId.get(r.participantId);
    const investment = participant?.investmentAmount ?? 0;
    const prior = ctx.priorBalances.get(r.participantId) ?? 0;

    if (investment <= 0) {
      // No investment baseline — can't compute cap. Pay tentative.
      recipients.push({ ...r, exitConditions: noneExitChips() });
      continue;
    }

    const cap = roundMoney(investment * hardCapMultiplier);
    const headroom = clampPositive(subtract(cap, prior));
    const clipped = minAmount(r.tentative, headroom);
    // Chip type: prefer `recoup_cap` when the binding multiplier came from
    // `recoupMultiplier` (typically Tier 1); else `hard_cap` (Tier 2).
    const chipType: 'recoup_cap' | 'hard_cap' =
      ctx.rule.recoupMultiplier === hardCapMultiplier ? 'recoup_cap' : 'hard_cap';
    const exitConditions: ExitConditionChip[] = [
      { type: chipType, value: hardCapMultiplier },
    ];
    if (ctx.rule.deadline) {
      exitConditions.push({ type: 'deadline', value: ctx.rule.deadline });
    }

    if (clipped < r.tentative) {
      const clipDelta = roundMoney(r.tentative - clipped);
      surplus = roundMoney(surplus + clipDelta);
      recipients.push({
        ...r,
        amount: clipped,
        capClipped: { tentative: r.tentative, cap, clippedTo: clipped },
        exitConditions: [
          ...exitConditions.map((c) =>
            c.type === 'hard_cap' ? { ...c, firedAt: ctx.runDate } : c,
          ),
        ],
      });
    } else {
      const final: RecipientShare = { ...r, amount: clipped, exitConditions };
      recipients.push(final);
      // Eligible for surplus redistribution if there's headroom left.
      const remainingHeadroom = subtract(headroom, clipped);
      if (remainingHeadroom > 0) eligibleForRedistribution.push(final);
    }
  }

  // Redistribute surplus pro-rata across members with remaining headroom.
  // Iterates because each redistribution can create new clips.
  let redistributed = 0;
  while (surplus > 0 && eligibleForRedistribution.length > 0) {
    const totalEligibleTentative = eligibleForRedistribution.reduce(
      (acc, r) => acc + r.tentative,
      0,
    );
    if (totalEligibleTentative === 0) break;

    let surplusConsumed = 0;
    for (let i = 0; i < eligibleForRedistribution.length; i++) {
      const member = eligibleForRedistribution[i];
      const share = mulPercent(surplus, (member.tentative / totalEligibleTentative) * 100);
      const participant = byId.get(member.participantId);
      const investment = participant?.investmentAmount ?? 0;
      const prior = ctx.priorBalances.get(member.participantId) ?? 0;
      const cap = roundMoney(investment * hardCapMultiplier);
      const headroomLeft = clampPositive(subtract(cap, roundMoney(prior + member.amount)));
      const add = minAmount(share, headroomLeft);
      member.amount = roundMoney(member.amount + add);
      surplusConsumed = roundMoney(surplusConsumed + add);
    }
    if (surplusConsumed === 0) break;
    redistributed = roundMoney(redistributed + surplusConsumed);
    surplus = roundMoney(surplus - surplusConsumed);
    // Drop members who hit their cap from the eligible list.
    for (let i = eligibleForRedistribution.length - 1; i >= 0; i--) {
      const member = eligibleForRedistribution[i];
      const participant = byId.get(member.participantId);
      const investment = participant?.investmentAmount ?? 0;
      const prior = ctx.priorBalances.get(member.participantId) ?? 0;
      const cap = roundMoney(investment * hardCapMultiplier);
      if (roundMoney(prior + member.amount) >= cap) {
        eligibleForRedistribution.splice(i, 1);
      }
    }
  }

  return {
    recipients,
    poolResolutions: tentative.poolResolutions,
    redistributed,
    warnings: tentative.warnings,
  };
}

function noneExitChips(): ExitConditionChip[] {
  return [{ type: 'none' }];
}

/**
 * Pick the binding per-investor cap multiplier from a tier rule.
 * Round 3 Comment 12 — both `recoupMultiplier` and `hardCapMultiplier`
 * are per-investor cap multipliers; when both are set, the strictest
 * (smaller) binds. The validator guarantees `hardCapMultiplier ≥
 * recoupMultiplier`, so when both are present `recoupMultiplier` is the
 * stricter one.
 *
 * Tier 1 typically only sets `recoupMultiplier` ("recoup until X% of
 * investment"); Tier 2 typically only sets `hardCapMultiplier` ("never
 * pay past Y% of investment"). Returns `undefined` when neither is set
 * (the tier has no per-investor cap).
 */
function pickEffectiveCapMultiplier(tier: WaterfallTierRule): number | undefined {
  if (tier.recoupMultiplier !== undefined && tier.hardCapMultiplier !== undefined) {
    return Math.min(tier.recoupMultiplier, tier.hardCapMultiplier);
  }
  return tier.recoupMultiplier ?? tier.hardCapMultiplier;
}
