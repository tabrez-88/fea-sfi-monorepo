/**
 * Settlement Engine
 *
 * Pure computation class for settlement calculations.
 * NO NestJS, NO Prisma, NO I/O, NO side effects.
 *
 * Given a JSON input (rules + revenue batches + participants),
 * produces a deterministic JSON output (allocations + proof).
 *
 * Waterfall phases:
 * 1. GROSS_RECEIPTS - Sum all revenue batches
 * 2. DISTRIBUTION_FEES - Deduct distributor fees
 * 3. RECOUPMENT - Investors recoup their investment (with caps)
 * 4. NET_PROFITS - Split remaining among participants
 */

import { processDistributionFees } from './phases/distribution-fees';
import { processGrossReceipts } from './phases/gross-receipts';
import { processNetProfits } from './phases/net-profits';
import { processRecoupment, RecoupmentResult } from './phases/recoupment';
import {
  SettlementInput,
  SettlementOutput,
  AllocationEntry,
  RecoupmentBalance,
  PhaseResult,
} from './types';
import { sum } from './utils/decimal';
import { generateProofRecord } from './utils/proof-hash';

export class SettlementEngine {
  /**
   * Calculate settlement allocations.
   *
   * This is a pure function: same input always produces same output.
   * No side effects, no I/O, no randomness.
   *
   * @param input - Complete settlement input (rules, batches, participants)
   * @param timestamp - ISO timestamp for proof record (passed in for determinism)
   * @returns Complete settlement output with allocations and proof
   */
  calculate(input: SettlementInput, timestamp?: string): SettlementOutput {
    this.validateInput(input);

    const proofTimestamp = timestamp ?? new Date().toISOString();

    // Phase 1: Gross Receipts
    const grossResult = processGrossReceipts(input.revenueBatches);

    // Phase 2: Distribution Fees
    const feeResult = processDistributionFees(
      grossResult.remainingAmount,
      input.rules.distributionFees,
      input.participants,
    );

    // Phase 3: Recoupment
    const recoupResult: RecoupmentResult = processRecoupment(
      feeResult.remainingAmount,
      input.rules.recoupment,
      input.participants,
    );

    // Phase 4: Net Profits
    const profitResult = processNetProfits(
      recoupResult.remainingAmount,
      input.rules.netProfitSplit,
      input.participants,
    );

    // Collect all allocations across phases
    const allAllocations: AllocationEntry[] = [
      ...feeResult.allocations,
      ...recoupResult.allocations,
      ...profitResult.allocations,
    ];

    // Collect phase results
    const phaseResults: PhaseResult[] = [
      grossResult,
      feeResult,
      { ...recoupResult, balances: undefined } as PhaseResult,
      profitResult,
    ];

    // Recoupment balances
    const recoupmentBalances: RecoupmentBalance[] = recoupResult.balances;

    const totalAllocated = sum(allAllocations.map((a) => a.amount));

    // Generate proof hash
    const proof = generateProofRecord(input, allAllocations, proofTimestamp);

    return {
      settlementRunId: input.settlementRunId,
      totalRevenue: grossResult.inputAmount,
      totalAllocated,
      currency: input.currency,
      phaseResults,
      allocations: allAllocations,
      recoupmentBalances,
      proof,
    };
  }

  /**
   * Validate engine input before processing.
   * Throws descriptive errors for invalid input.
   */
  private validateInput(input: SettlementInput): void {
    if (!input.revenueBatches || input.revenueBatches.length === 0) {
      throw new Error('At least one revenue batch is required');
    }

    if (!input.participants || input.participants.length === 0) {
      throw new Error('At least one participant is required');
    }

    if (!input.rules) {
      throw new Error('Settlement rules are required');
    }

    // Validate net profit percentages sum to 100
    if (input.rules.netProfitSplit.length > 0) {
      const totalPercentage = input.rules.netProfitSplit.reduce(
        (s, r) => s + r.percentage,
        0,
      );
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new Error(
          `Net profit percentages must sum to 100%, got ${totalPercentage}%`,
        );
      }
    }

    // Validate no negative amounts in revenue batches
    for (const batch of input.revenueBatches) {
      if (batch.amount < 0) {
        throw new Error(
          `Revenue batch ${batch.id} has negative amount: ${batch.amount}`,
        );
      }
    }

    // Validate referenced participants exist
    const participantIds = new Set(input.participants.map((p) => p.id));

    for (const rule of input.rules.distributionFees) {
      if (!participantIds.has(rule.participantId)) {
        throw new Error(
          `Distribution fee references unknown participant: ${rule.participantId}`,
        );
      }
    }

    for (const rule of input.rules.recoupment) {
      if (!participantIds.has(rule.participantId)) {
        throw new Error(
          `Recoupment rule references unknown participant: ${rule.participantId}`,
        );
      }
    }

    for (const rule of input.rules.netProfitSplit) {
      if (!participantIds.has(rule.participantId)) {
        throw new Error(
          `Net profit rule references unknown participant: ${rule.participantId}`,
        );
      }
    }
  }
}
