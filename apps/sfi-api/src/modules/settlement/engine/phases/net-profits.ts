/**
 * Phase 4: Net Profits
 *
 * Splits the remaining amount (after fees and recoupment)
 * among participants by percentage.
 *
 * Key behaviors:
 * - Percentages should sum to 100% (validated)
 * - Any rounding remainder is assigned to the first participant
 *   to ensure total allocated equals input amount exactly
 */

import {
  Phase,
  PhaseResult,
  AllocationEntry,
  NetProfitRule,
  ParticipantInput,
} from '../types';
import { mulPercent, subtract, sum } from '../utils/decimal';

export function processNetProfits(
  inputAmount: number,
  profitRules: NetProfitRule[],
  participants: ParticipantInput[],
): PhaseResult {
  const allocations: AllocationEntry[] = [];

  const participantMap = new Map(participants.map((p) => [p.id, p]));

  // If no input amount, no allocations
  if (inputAmount <= 0) {
    return {
      phase: Phase.NET_PROFITS,
      inputAmount: 0,
      totalAllocated: 0,
      remainingAmount: 0,
      allocations: [],
      details: { reason: 'No remaining amount for net profit distribution' },
    };
  }

  // Calculate each participant's share
  for (const rule of profitRules) {
    const participant = participantMap.get(rule.participantId);
    const amount = mulPercent(inputAmount, rule.percentage);

    allocations.push({
      participantId: rule.participantId,
      participantName: participant?.name ?? 'Unknown',
      phase: Phase.NET_PROFITS,
      amount,
      metadata: {
        percentage: rule.percentage,
        netProfitPool: inputAmount,
        calculation: `${inputAmount} × ${rule.percentage}% = ${amount}`,
      },
    });
  }

  // Handle rounding remainder: assign to first participant to ensure exact total
  const totalAllocated = sum(allocations.map((a) => a.amount));
  const remainder = subtract(inputAmount, totalAllocated);

  if (remainder !== 0 && allocations.length > 0) {
    allocations[0].amount = subtract(allocations[0].amount, -remainder);
    (allocations[0].metadata as Record<string, unknown>).roundingAdjustment =
      remainder;
  }

  const finalTotal = sum(allocations.map((a) => a.amount));

  return {
    phase: Phase.NET_PROFITS,
    inputAmount,
    totalAllocated: finalTotal,
    remainingAmount: subtract(inputAmount, finalTotal),
    allocations,
    details: {
      participantCount: profitRules.length,
      totalPercentage: sum(profitRules.map((r) => r.percentage)),
      roundingAdjustment: remainder,
    },
  };
}
