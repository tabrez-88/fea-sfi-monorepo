/**
 * Settlement Engine Types
 *
 * Pure type definitions for the settlement computation engine.
 * These types define the JSON-based input/output contract.
 * NO NestJS, NO Prisma, NO framework dependencies.
 */

// ============================================
// Enums (engine-internal, framework-free)
// ============================================

export enum Phase {
  GROSS_RECEIPTS = 'GROSS_RECEIPTS',
  DISTRIBUTION_FEES = 'DISTRIBUTION_FEES',
  RECOUPMENT = 'RECOUPMENT',
  NET_PROFITS = 'NET_PROFITS',
}

export enum ParticipantRole {
  PRODUCER = 'PRODUCER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  INVESTOR = 'INVESTOR',
  TALENT = 'TALENT',
  STUDIO = 'STUDIO',
  LICENSOR = 'LICENSOR',
  LICENSEE = 'LICENSEE',
  COLLECTION_AGENT = 'COLLECTION_AGENT',
}

// ============================================
// Input Types
// ============================================

/**
 * A single revenue batch to settle.
 */
export interface RevenueBatchInput {
  id: string;
  amount: number; // in minor units or as precise number
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
}

/**
 * Distribution fee configuration.
 * Applied to gross receipts before recoupment.
 */
export interface DistributionFeeRule {
  participantId: string;
  feePercentage: number; // e.g. 15 for 15%
}

/**
 * Recoupment configuration for a single participant.
 * Investor recoups their investment before net profit split.
 */
export interface RecoupmentRule {
  participantId: string;
  recoupAmount: number; // total amount to recoup
  recoupCap: number; // maximum they can recoup (often same as recoupAmount)
  priority: number; // lower number = higher priority (recouped first)
  previouslyRecouped?: number; // amount already recouped in prior settlement runs (carry-forward)
}

/**
 * Net profit split rule for a single participant.
 */
export interface NetProfitRule {
  participantId: string;
  percentage: number; // e.g. 70 for 70%
}

/**
 * Complete rule configuration for settlement.
 */
export interface SettlementRules {
  distributionFees: DistributionFeeRule[];
  recoupment: RecoupmentRule[];
  netProfitSplit: NetProfitRule[];
}

/**
 * Participant metadata included in input.
 */
export interface ParticipantInput {
  id: string;
  name: string;
  role: ParticipantRole;
}

/**
 * Complete input to the settlement engine.
 * This is a pure JSON structure - no database references.
 */
export interface SettlementInput {
  /** Unique identifier for this calculation (for proof record) */
  settlementRunId: string;
  /** Rule snapshot version (for audit trail) */
  ruleSnapshotVersion: number;
  /** Currency for all amounts */
  currency: string;
  /** Revenue batches to settle */
  revenueBatches: RevenueBatchInput[];
  /** All participants in this deal */
  participants: ParticipantInput[];
  /** Settlement rules */
  rules: SettlementRules;
}

// ============================================
// Output Types
// ============================================

/**
 * A single allocation to a participant.
 */
export interface AllocationEntry {
  participantId: string;
  participantName: string;
  phase: Phase;
  amount: number;
  metadata: Record<string, unknown>;
}

/**
 * Result of processing a single phase.
 */
export interface PhaseResult {
  phase: Phase;
  inputAmount: number;
  totalAllocated: number;
  remainingAmount: number;
  allocations: AllocationEntry[];
  details: Record<string, unknown>;
}

/**
 * Recoupment balance tracking for carry-forward.
 */
export interface RecoupmentBalance {
  participantId: string;
  totalToRecoup: number;
  previouslyRecouped: number;
  recoupedThisRun: number;
  remainingToRecoup: number;
  fullyRecouped: boolean;
}

/**
 * Proof record for audit trail.
 */
export interface ProofRecord {
  proofHash: string;
  algorithm: string;
  timestamp: string;
  inputSummary: {
    ruleSnapshotVersion: number;
    revenueBatchCount: number;
    totalRevenue: number;
    participantCount: number;
    currency: string;
  };
}

/**
 * Complete output from the settlement engine.
 */
export interface SettlementOutput {
  /** Echo of input settlement run ID */
  settlementRunId: string;
  /** Total gross revenue from all batches */
  totalRevenue: number;
  /** Total allocated to all participants across all phases */
  totalAllocated: number;
  /** Currency */
  currency: string;
  /** Breakdown by phase */
  phaseResults: PhaseResult[];
  /** All individual allocations (flat list) */
  allocations: AllocationEntry[];
  /** Recoupment balance tracking */
  recoupmentBalances: RecoupmentBalance[];
  /** Proof record for determinism verification */
  proof: ProofRecord;
}
