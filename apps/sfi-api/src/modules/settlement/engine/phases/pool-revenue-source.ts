/**
 * Phase: Pool Revenue Source (FB-003 Run 3)
 *
 * Splits the upstream amount (gross OR net) into a "pool-bound" slice and
 * a "retained-by-creator" remainder per the snapshot's
 * `PoolRevenueSourceRule`. The pool-bound slice feeds the subsequent
 * waterfall-tier phases.
 *
 * Round 1 Comment 3 + Round 3 Comment 11 spec:
 *   - `basis: 'GROSS'` → percentage of gross receipts (pre-deductions)
 *   - `basis: 'NET'`   → percentage of net (post-deductions)
 *   - Multiple `PoolRevenueSourceRule` rows are NOT supported in v1 (the
 *     validator enforces ≤1 pool target per snapshot). When more than one
 *     row is present (defensive), the first is used and a detail warning
 *     is emitted.
 *   - When no rule is present, the entire upstream amount flows to the
 *     pool (default 100% per Round 3 spec).
 *
 * This phase emits NO `AllocationEntry` rows — those land at the
 * waterfall-tier phases that consume the pool-bound slice. The phase
 * result records `details.poolBound` / `details.retained` so the FE can
 * surface the split.
 */

import {
  AllocationEntry,
  Phase,
  PhaseResult,
  PoolRevenueSourceRule,
} from '../types';
import { mulPercent, subtract } from '../utils/decimal';

export interface PoolRevenueSourceResult extends PhaseResult {
  /** Slice that funds the pool; consumed by subsequent waterfall-tier phases */
  poolBound: number;
  /** Slice retained by non-pool participants (creators, etc.) */
  retained: number;
}

export function processPoolRevenueSource(
  grossAmount: number,
  netAmount: number,
  rules: PoolRevenueSourceRule[] | undefined,
): PoolRevenueSourceResult {
  const warnings: string[] = [];
  const allocations: AllocationEntry[] = []; // intentionally empty — see header

  // Default: 100% of net feeds the pool when no rule is provided
  // (back-compat with the implicit v1 behavior).
  let percentage = 100;
  let basis: 'GROSS' | 'NET' = 'NET';
  let sourceAmount = netAmount;

  if (rules && rules.length > 0) {
    if (rules.length > 1) {
      warnings.push(
        `Multiple pool revenue source rules supplied (${rules.length}); using the first. v1 supports ≤1 pool per snapshot.`,
      );
    }
    const rule = rules[0];
    percentage = rule.percentage;
    basis = rule.basis;
    sourceAmount = basis === 'GROSS' ? grossAmount : netAmount;
  }

  const poolBound = mulPercent(sourceAmount, percentage);
  const retained = subtract(sourceAmount, poolBound);

  return {
    phase: Phase.POOL_REVENUE_SOURCE,
    inputAmount: sourceAmount,
    totalAllocated: 0, // nothing allocated yet — pool slice flows downstream
    remainingAmount: poolBound, // engine consumes this as the input to tiers
    allocations,
    poolBound,
    retained,
    details: {
      basis,
      percentage,
      grossAmount,
      netAmount,
      sourceAmount,
      poolBound,
      retained,
      warnings,
    },
  };
}
