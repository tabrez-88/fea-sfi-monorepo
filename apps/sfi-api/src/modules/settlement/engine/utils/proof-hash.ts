/**
 * Proof Hash Utility
 *
 * Generates a deterministic SHA-256 hash of settlement inputs and outputs.
 * Used for audit trail - same inputs always produce the same hash.
 *
 * Key: The hash is generated from a canonical JSON string
 * (sorted keys) to ensure determinism regardless of property order.
 */

import { createHash } from 'crypto';

import { SettlementInput, SettlementOutput, ProofRecord } from '../types';

/**
 * Create a canonical JSON string from any object.
 * Keys are sorted at every level to ensure deterministic serialization.
 */
function canonicalize(obj: unknown): string {
  return JSON.stringify(obj, (_key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value)
        .sort()
        .reduce(
          (sorted, key) => {
            sorted[key] = (value as Record<string, unknown>)[key];
            return sorted;
          },
          {} as Record<string, unknown>,
        );
    }
    return value;
  });
}

/**
 * Generate SHA-256 hash of the given data.
 */
function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Generate a proof record for a settlement calculation.
 * The proof hash is deterministic: same input + output = same hash.
 *
 * @param input  - The settlement engine input
 * @param output - The settlement engine output (without proof field)
 * @param timestamp - ISO timestamp for the proof record
 */
export function generateProofRecord(
  input: SettlementInput,
  allocations: SettlementOutput['allocations'],
  timestamp: string,
): ProofRecord {
  // Build the data to hash - only include deterministic fields
  const hashData = {
    settlementRunId: input.settlementRunId,
    ruleSnapshotVersion: input.ruleSnapshotVersion,
    currency: input.currency,
    revenueBatches: input.revenueBatches.map((b) => ({
      id: b.id,
      amount: b.amount,
    })),
    rules: input.rules,
    allocations: allocations.map((a) => ({
      participantId: a.participantId,
      phase: a.phase,
      amount: a.amount,
    })),
  };

  const canonical = canonicalize(hashData);
  const hash = sha256(canonical);

  return {
    proofHash: `sha256:${hash}`,
    algorithm: 'SHA-256',
    timestamp,
    inputSummary: {
      ruleSnapshotVersion: input.ruleSnapshotVersion,
      revenueBatchCount: input.revenueBatches.length,
      totalRevenue: input.revenueBatches.reduce((s, b) => s + b.amount, 0),
      participantCount: input.participants.length,
      currency: input.currency,
    },
  };
}
