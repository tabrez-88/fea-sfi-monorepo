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
import { minAmount, mulPercent, subtract, sum } from '../utils/decimal';

export function processDistributionFees(
  inputAmount: number,
  feeRules: DistributionFeeRule[],
  participants: ParticipantInput[],
): PhaseResult {
  const allocations: AllocationEntry[] = [];

  const participantMap = new Map(participants.map((p) => [p.id, p]));

  // Track remaining gross as we walk the fee list so a flat `feeAmount` never
  // overspends the bucket. Order matches the rules array — same as v1
  // (rules already arrive sorted by the caller / DB query).
  let remainingGross = inputAmount;

  for (const rule of feeRules) {
    const participant = participantMap.get(rule.participantId);

    // FB-003 FLATFEE branch (Run 2). When `feeAmount` is set, the rule is
    // treated as a flat dollar fee capped at the remaining gross. The
    // legacy percentage path is untouched when `feeAmount === undefined`,
    // so v1 snapshots produce byte-identical output to before.
    let amount: number;
    let calculation: string;
    if (rule.feeAmount !== undefined) {
      amount = minAmount(rule.feeAmount, remainingGross);
      calculation =
        amount === rule.feeAmount
          ? `flat ${rule.feeAmount} (capped at ${remainingGross} remaining: no clip)`
          : `flat ${rule.feeAmount} clipped to ${amount} (remaining gross: ${remainingGross})`;
    } else {
      amount = mulPercent(inputAmount, rule.feePercentage);
      calculation = `${inputAmount} × ${rule.feePercentage}% = ${amount}`;
    }

    allocations.push({
      participantId: rule.participantId,
      participantName: participant?.name ?? 'Unknown',
      phase: Phase.DISTRIBUTION_FEES,
      amount,
      metadata:
        rule.feeAmount !== undefined
          ? {
              feeAmount: rule.feeAmount,
              feeType: 'flat',
              grossAmount: inputAmount,
              remainingGrossAtRule: remainingGross,
              calculation,
            }
          : {
              feePercentage: rule.feePercentage,
              feeType: 'percentage',
              grossAmount: inputAmount,
              calculation,
            },
    });

    remainingGross = subtract(remainingGross, amount);
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
