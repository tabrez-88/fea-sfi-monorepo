/**
 * Phase 1: Gross Receipts
 *
 * Sums all revenue batches into a single gross total.
 * No allocations are made in this phase - it establishes
 * the starting amount for the waterfall.
 */

import {
  Phase,
  PhaseResult,
  RevenueBatchInput,
} from '../types';
import { sum } from '../utils/decimal';

export function processGrossReceipts(
  revenueBatches: RevenueBatchInput[],
): PhaseResult {
  const totalRevenue = sum(revenueBatches.map((b) => b.amount));

  return {
    phase: Phase.GROSS_RECEIPTS,
    inputAmount: totalRevenue,
    totalAllocated: 0,
    remainingAmount: totalRevenue,
    allocations: [],
    details: {
      batchCount: revenueBatches.length,
      batches: revenueBatches.map((b) => ({
        id: b.id,
        amount: b.amount,
        periodStart: b.periodStart,
        periodEnd: b.periodEnd,
      })),
    },
  };
}
