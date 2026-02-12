/**
 * Phase 2: Distribution Fees
 *
 * Deducts distributor fees from gross receipts.
 * Each distributor takes a percentage of the gross amount.
 * The remaining amount flows to the next phase.
 */

import {
  Phase,
  PhaseResult,
  AllocationEntry,
  DistributionFeeRule,
  ParticipantInput,
} from '../types';
import { mulPercent, subtract, sum } from '../utils/decimal';

export function processDistributionFees(
  inputAmount: number,
  feeRules: DistributionFeeRule[],
  participants: ParticipantInput[],
): PhaseResult {
  const allocations: AllocationEntry[] = [];

  const participantMap = new Map(participants.map((p) => [p.id, p]));

  for (const rule of feeRules) {
    const participant = participantMap.get(rule.participantId);
    const feeAmount = mulPercent(inputAmount, rule.feePercentage);

    allocations.push({
      participantId: rule.participantId,
      participantName: participant?.name ?? 'Unknown',
      phase: Phase.DISTRIBUTION_FEES,
      amount: feeAmount,
      metadata: {
        feePercentage: rule.feePercentage,
        grossAmount: inputAmount,
        calculation: `${inputAmount} × ${rule.feePercentage}% = ${feeAmount}`,
      },
    });
  }

  const totalFees = sum(allocations.map((a) => a.amount));
  const remainingAmount = subtract(inputAmount, totalFees);

  return {
    phase: Phase.DISTRIBUTION_FEES,
    inputAmount,
    totalAllocated: totalFees,
    remainingAmount,
    allocations,
    details: {
      totalFees,
      feeCount: feeRules.length,
    },
  };
}
