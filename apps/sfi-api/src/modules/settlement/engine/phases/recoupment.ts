/**
 * Phase 3: Recoupment
 *
 * Processes investor recoupment in priority order (waterfall).
 * Each investor recoups their investment up to their cap,
 * factoring in any previously recouped amounts (carry-forward).
 *
 * Key behaviors:
 * - Priority ordering: lower priority number gets recouped first
 * - Cap enforcement: cannot recoup more than recoupCap
 * - Carry-forward: previouslyRecouped reduces remaining recoup amount
 * - Waterfall: if funds run out, lower-priority investors get nothing
 */

import {
  Phase,
  PhaseResult,
  AllocationEntry,
  RecoupmentRule,
  RecoupmentBalance,
  ParticipantInput,
} from '../types';
import { minAmount, subtract, sum, clampPositive } from '../utils/decimal';

export interface RecoupmentResult extends PhaseResult {
  balances: RecoupmentBalance[];
}

export function processRecoupment(
  inputAmount: number,
  recoupRules: RecoupmentRule[],
  participants: ParticipantInput[],
): RecoupmentResult {
  const allocations: AllocationEntry[] = [];
  const balances: RecoupmentBalance[] = [];

  const participantMap = new Map(participants.map((p) => [p.id, p]));

  // Sort by priority (lower number = higher priority = gets recouped first)
  const sortedRules = [...recoupRules].sort((a, b) => a.priority - b.priority);

  let remaining = inputAmount;

  for (const rule of sortedRules) {
    const participant = participantMap.get(rule.participantId);
    const previouslyRecouped = rule.previouslyRecouped ?? 0;

    // How much is left to recoup (considering cap and prior recoupments)
    const effectiveCap = minAmount(rule.recoupAmount, rule.recoupCap);
    const leftToRecoup = clampPositive(subtract(effectiveCap, previouslyRecouped));

    // Recoup the minimum of: what's left to recoup, or what's available
    const recoupedThisRun = minAmount(leftToRecoup, remaining);

    if (recoupedThisRun > 0) {
      allocations.push({
        participantId: rule.participantId,
        participantName: participant?.name ?? 'Unknown',
        phase: Phase.RECOUPMENT,
        amount: recoupedThisRun,
        metadata: {
          recoupAmount: rule.recoupAmount,
          recoupCap: rule.recoupCap,
          previouslyRecouped,
          recoupedThisRun,
          remainingToRecoup: subtract(leftToRecoup, recoupedThisRun),
          fullyRecouped: recoupedThisRun >= leftToRecoup,
          priority: rule.priority,
          calculation: `min(${leftToRecoup} remaining to recoup, ${remaining} available) = ${recoupedThisRun}`,
        },
      });
    }

    remaining = subtract(remaining, recoupedThisRun);

    balances.push({
      participantId: rule.participantId,
      totalToRecoup: effectiveCap,
      previouslyRecouped,
      recoupedThisRun,
      remainingToRecoup: clampPositive(subtract(leftToRecoup, recoupedThisRun)),
      fullyRecouped: previouslyRecouped + recoupedThisRun >= effectiveCap,
    });
  }

  const totalRecouped = sum(allocations.map((a) => a.amount));

  return {
    phase: Phase.RECOUPMENT,
    inputAmount,
    totalAllocated: totalRecouped,
    remainingAmount: remaining,
    allocations,
    balances,
    details: {
      recoupmentParticipants: sortedRules.length,
      totalRecouped,
      allFullyRecouped: balances.every((b) => b.fullyRecouped),
    },
  };
}
