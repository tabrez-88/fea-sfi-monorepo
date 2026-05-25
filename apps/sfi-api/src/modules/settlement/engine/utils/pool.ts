/**
 * Pool Resolver (FB-003 Run 3 / BE-FB002B)
 *
 * Pure function that splits a pool's allocated bucket across its members
 * using a fallback chain (Round 1 + 2 spec):
 *
 *   1. **unit-weighted** — every member has `units > 0` → weight by units.
 *   2. **investment-weighted** — no units but every member has
 *      `investmentAmount > 0` → weight by investment.
 *   3. **mixed** — some have units, some have investment → derive units
 *      from `investmentAmount / pricePerUnit` (when both are set) and
 *      fall through to unit-weighted, OR derive investment from
 *      `units × pricePerUnit` and fall through to investment-weighted.
 *      Whichever the majority of members already have.
 *   4. **equal-split** — neither inputs available → split evenly.
 *
 * The chosen strategy is surfaced on the phase result so the FE can show a
 * warning chip when equal-split or mixed fallback fired (admins probably
 * want to fix participant data rather than rely on the fallback).
 *
 * Rounding: the resolver rounds each member's share to 2dp; any remainder
 * (positive OR negative cents) is assigned to the first member by ID order
 * so the sum is always exactly `poolAmount`. Pure deterministic — same
 * input always produces the same output.
 *
 * NO NestJS, NO Prisma, NO I/O.
 */

import { ParticipantInput } from '../types';

import { mulPercent, roundMoney, subtract, sum } from './decimal';

export type ShareBasis = 'units' | 'investment' | 'mixed' | 'equal';

export interface PoolMemberShare {
  participantId: string;
  participantName: string;
  /** Resolved share in the same units as `poolAmount` (currency) */
  amount: number;
  /** What this member's percentage of the pool worked out to */
  poolPercentage: number;
  /** Which basis the resolver used for this member */
  basis: 'units' | 'investment' | 'equal';
}

export interface PoolResolutionResult {
  /** Top-level strategy used for the pool (mirrored across members, except for `mixed`) */
  strategy: ShareBasis;
  /** Per-member breakdown */
  members: PoolMemberShare[];
  /** Pool-level total — should equal `poolAmount` exactly after rounding fix-up */
  total: number;
  /** Human-readable warnings for the FE (equal-split, mixed fallback, etc.) */
  warnings: string[];
}

/**
 * Resolve a pool bucket across its members.
 *
 * @param poolAmount  Total currency amount to split across the pool
 * @param members     Pool members (typically filtered already by the caller
 *                    to participants where `poolMember === true`)
 */
export function resolvePool(
  poolAmount: number,
  members: ParticipantInput[],
): PoolResolutionResult {
  if (members.length === 0) {
    return { strategy: 'equal', members: [], total: 0, warnings: ['Pool has no members'] };
  }

  if (poolAmount <= 0) {
    // Nothing to distribute — still echo back zero-amount rows so the FE
    // can render a row per member (and the engine downstream sees the
    // member set consistently).
    return {
      strategy: 'equal',
      members: members.map((m) => ({
        participantId: m.id,
        participantName: m.name,
        amount: 0,
        poolPercentage: 0,
        basis: 'equal',
      })),
      total: 0,
      warnings: [],
    };
  }

  // Sort members by ID for deterministic ordering (rounding remainder goes
  // to the first member; sort here so callers don't need to).
  const ordered = [...members].sort((a, b) => a.id.localeCompare(b.id));

  const enriched = ordered.map(enrichMember);
  const counts = countAvailableSignals(enriched);
  const strategy = pickStrategy(counts, enriched.length);
  const warnings = buildWarnings(strategy, counts, enriched.length);
  const shares = computeShares(poolAmount, enriched, strategy);

  const fixedShares = applyRoundingRemainder(poolAmount, shares);

  return {
    strategy,
    members: fixedShares,
    total: sum(fixedShares.map((s) => s.amount)),
    warnings,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Internals
// ──────────────────────────────────────────────────────────────────────

interface EnrichedMember extends ParticipantInput {
  /** Units actually usable for weighting (derived if needed) */
  effectiveUnits: number;
  /** Investment actually usable for weighting (derived if needed) */
  effectiveInvestment: number;
  /** Whether `units` was originally present (vs derived) */
  hasUnits: boolean;
  /** Whether `investmentAmount` was originally present (vs derived) */
  hasInvestment: boolean;
}

function enrichMember(m: ParticipantInput): EnrichedMember {
  const units = typeof m.units === 'number' && m.units > 0 ? m.units : 0;
  const investment =
    typeof m.investmentAmount === 'number' && m.investmentAmount > 0
      ? m.investmentAmount
      : 0;
  const pricePerUnit =
    typeof m.pricePerUnit === 'number' && m.pricePerUnit > 0 ? m.pricePerUnit : 0;

  // Derive whichever signal is missing if `pricePerUnit` is available.
  let effectiveUnits = units;
  let effectiveInvestment = investment;
  if (effectiveUnits === 0 && effectiveInvestment > 0 && pricePerUnit > 0) {
    effectiveUnits = effectiveInvestment / pricePerUnit;
  }
  if (effectiveInvestment === 0 && effectiveUnits > 0 && pricePerUnit > 0) {
    effectiveInvestment = effectiveUnits * pricePerUnit;
  }

  return {
    ...m,
    effectiveUnits,
    effectiveInvestment,
    hasUnits: units > 0,
    hasInvestment: investment > 0,
  };
}

interface SignalCounts {
  membersWithUnits: number;
  membersWithInvestment: number;
  membersWithDerivedUnits: number;
  membersWithDerivedInvestment: number;
}

function countAvailableSignals(members: EnrichedMember[]): SignalCounts {
  return {
    membersWithUnits: members.filter((m) => m.hasUnits).length,
    membersWithInvestment: members.filter((m) => m.hasInvestment).length,
    membersWithDerivedUnits: members.filter((m) => m.effectiveUnits > 0).length,
    membersWithDerivedInvestment: members.filter((m) => m.effectiveInvestment > 0).length,
  };
}

function pickStrategy(counts: SignalCounts, total: number): ShareBasis {
  // Pure unit-weighted: every member has effective units (after derivation).
  if (counts.membersWithDerivedUnits === total) {
    return counts.membersWithUnits === total ? 'units' : 'mixed';
  }
  // Pure investment-weighted: every member has effective investment.
  if (counts.membersWithDerivedInvestment === total) {
    return counts.membersWithInvestment === total ? 'investment' : 'mixed';
  }
  // Some but not all have something → mixed (partial fallback to equal).
  if (counts.membersWithDerivedUnits > 0 || counts.membersWithDerivedInvestment > 0) {
    return 'mixed';
  }
  // Nobody has anything — equal split.
  return 'equal';
}

function buildWarnings(
  strategy: ShareBasis,
  counts: SignalCounts,
  total: number,
): string[] {
  const warnings: string[] = [];
  if (strategy === 'equal') {
    warnings.push(
      'Pool fell through to equal-split — no member has `units` or `investmentAmount`. ' +
        'Set those on the Participants page to enable weighted distribution.',
    );
  }
  if (strategy === 'mixed') {
    const missing = total - counts.membersWithDerivedUnits;
    const missingInvestment = total - counts.membersWithDerivedInvestment;
    const fallbackCount = Math.max(missing, missingInvestment);
    warnings.push(
      `Pool used mixed weighting — ${fallbackCount} of ${total} members fell back to equal-split. ` +
        'Provide `units` or `investmentAmount` on those members for fully weighted distribution.',
    );
  }
  return warnings;
}

function computeShares(
  poolAmount: number,
  members: EnrichedMember[],
  strategy: ShareBasis,
): PoolMemberShare[] {
  if (strategy === 'units') {
    return shareByWeight(poolAmount, members, (m) => m.effectiveUnits, 'units');
  }
  if (strategy === 'investment') {
    return shareByWeight(poolAmount, members, (m) => m.effectiveInvestment, 'investment');
  }
  if (strategy === 'mixed') {
    // Mixed: use whichever signal more members have. Members without that
    // signal fall back to equal-split of the equal-split portion (computed
    // per-member basis label).
    const useUnits =
      countAvailableSignals(members).membersWithDerivedUnits >=
      countAvailableSignals(members).membersWithDerivedInvestment;
    const weightFn = useUnits
      ? (m: EnrichedMember) => m.effectiveUnits
      : (m: EnrichedMember) => m.effectiveInvestment;
    return shareByWeightMixed(poolAmount, members, weightFn, useUnits ? 'units' : 'investment');
  }
  // equal
  return shareEqually(poolAmount, members);
}

function shareByWeight(
  poolAmount: number,
  members: EnrichedMember[],
  weightFn: (m: EnrichedMember) => number,
  basis: 'units' | 'investment',
): PoolMemberShare[] {
  const totalWeight = members.reduce((acc, m) => acc + weightFn(m), 0);
  if (totalWeight === 0) {
    // Defensive — caller should have routed to 'equal' but stay safe.
    return shareEqually(poolAmount, members);
  }
  return members.map((m) => {
    const weight = weightFn(m);
    const poolPercentage = roundMoney((weight / totalWeight) * 100);
    const amount = mulPercent(poolAmount, poolPercentage);
    return {
      participantId: m.id,
      participantName: m.name,
      amount,
      poolPercentage,
      basis,
    };
  });
}

function shareByWeightMixed(
  poolAmount: number,
  members: EnrichedMember[],
  weightFn: (m: EnrichedMember) => number,
  basis: 'units' | 'investment',
): PoolMemberShare[] {
  // Members with the chosen signal participate in the weighted half; the
  // rest split a per-capita equal share of the average member share.
  const weighted = members.filter((m) => weightFn(m) > 0);
  const unweighted = members.filter((m) => weightFn(m) === 0);

  const totalWeight = weighted.reduce((acc, m) => acc + weightFn(m), 0);
  if (totalWeight === 0) return shareEqually(poolAmount, members);

  // Reserve an equal-split slice for the unweighted members proportional
  // to the count, so neither group dominates.
  const perCapitaTotal = poolAmount / members.length;
  const unweightedTotal = roundMoney(perCapitaTotal * unweighted.length);
  const weightedTotal = subtract(poolAmount, unweightedTotal);

  const result: PoolMemberShare[] = [];

  for (const m of weighted) {
    const weight = weightFn(m);
    const poolPercentage = roundMoney((weight / totalWeight) * (weightedTotal / poolAmount) * 100);
    const amount = mulPercent(poolAmount, poolPercentage);
    result.push({
      participantId: m.id,
      participantName: m.name,
      amount,
      poolPercentage,
      basis,
    });
  }

  if (unweighted.length > 0) {
    const equalShare = roundMoney(unweightedTotal / unweighted.length);
    const equalPercent = roundMoney((equalShare / poolAmount) * 100);
    for (const m of unweighted) {
      result.push({
        participantId: m.id,
        participantName: m.name,
        amount: equalShare,
        poolPercentage: equalPercent,
        basis: 'equal',
      });
    }
  }

  // Preserve the original sort order (by id).
  return result.sort((a, b) => a.participantId.localeCompare(b.participantId));
}

function shareEqually(poolAmount: number, members: EnrichedMember[]): PoolMemberShare[] {
  const equalShare = roundMoney(poolAmount / members.length);
  const equalPercent = roundMoney(100 / members.length);
  return members.map((m) => ({
    participantId: m.id,
    participantName: m.name,
    amount: equalShare,
    poolPercentage: equalPercent,
    basis: 'equal' as const,
  }));
}

/**
 * Rounding fix-up — push any cent-level remainder to the first member so
 * `sum(shares) === poolAmount` exactly.
 */
function applyRoundingRemainder(
  poolAmount: number,
  shares: PoolMemberShare[],
): PoolMemberShare[] {
  if (shares.length === 0) return shares;
  const allocated = sum(shares.map((s) => s.amount));
  const remainder = roundMoney(poolAmount - allocated);
  if (remainder === 0) return shares;
  return shares.map((s, i) =>
    i === 0 ? { ...s, amount: roundMoney(s.amount + remainder) } : s,
  );
}
