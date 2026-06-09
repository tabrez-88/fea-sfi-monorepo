import type { SettlementMode } from '@/types/rule-snapshot.types';

/**
 * State carried across the 3 steps of the Create Rule Snapshot wizard.
 *
 * Held in one object on the container so Next / Previous never lose what
 * the admin entered. Each step subscribes to its slice; the final BE
 * submission in Chunk 3 reads the whole shape and assembles the v2
 * payload from it.
 */
export type WizardStepNumber = 1 | 2 | 3;

export interface WizardStep1Data {
  /** ISO date string (yyyy-MM-dd) or empty when not yet picked. */
  effectiveFrom: string;
  /** Optional free-text note describing what changed in this version. */
  notes: string;
}

/**
 * Fee Type accepted on a Deduction card. Mirrors the FE engine type but
 * narrowed to the three options the Step 2 form actually offers:
 *   - `percent_gross` → maps to `feePercentage` against gross revenue
 *   - `percent_net`   → maps to `feePercentage` against net revenue
 *   - `flat`          → maps to `feeAmount` (flat dollar deduction)
 */
export type DeductionFeeType = 'percent_gross' | 'percent_net' | 'flat';

export interface DeductionRow {
  /** Local-only id used as the React key — never sent to the BE. */
  id: string;
  /**
   * Set when the row was auto-populated from an existing participant
   * with `behaviorType = FEE_DEDUCTION`. Missing for net-new rows added
   * via the "Add Deduction Participant" button — those create a new
   * participant on submit (Chunk 3).
   */
  participantId?: string;
  /**
   * Participant display name. Editable when this is a net-new row;
   * read-only when auto-populated from an existing participant.
   */
  name: string;
  /** Free-text role label (matches `Participant.roleName`). */
  role: string;
  feeType: DeductionFeeType;
  /** String for form-input convenience; parsed to number on submit. */
  amount: string;
  /**
   * Card-level include/exclude checkbox. Unchecked rows are kept in the
   * wizard state (so toggling doesn't lose the user's data) but skipped
   * when assembling the v2 payload on submit.
   */
  included: boolean;
}

/** Pool revenue source basis: % of gross (Type B) or % of net (Type A). */
export type PoolRevenueBasis = 'GROSS' | 'NET';

/** Sentinel participant id representing "the investor pool" allocation target. */
export const POOL_TARGET_ID = '__pool__';

/**
 * A row in any of the mode-conditional distribution tables (Recoup
 * multiplier table, Waterfall Tier 1 / Tier 2, Revenue Split).
 * Keyed by participant id (or `POOL_TARGET_ID`).
 *
 * The map shape mirrors the form fields exactly so a single shared
 * setter can update either by `target → value`.
 */
export type DistributionRowMap = Record<string, string>;

/**
 * Time unit on the Deal Term picker. Per Round 4 (Liang): she wants
 * Days / Months / Years so short-cycle deals (e.g. 90 days) and long
 * catalog deals (e.g. 10 years) both feel natural.
 */
export type TermUnit = 'days' | 'months' | 'years';

/**
 * Deal Term mode. `perpetual` means no expiry deadline (engine sees
 * `deadline: undefined`). `fixed` means the snapshot expires after
 * `termLength × termUnit` from the effective date.
 */
export type TermMode = 'perpetual' | 'fixed';

export interface ExitConditionsData {
  hardCapEnabled: boolean;
  /** String for form-input convenience; parsed on submit. */
  hardCapMultiplier: string;
  /**
   * Replaces the prior `deadlineEnabled` + `deadline` pair. The wizard
   * collects a Length + Unit and the payload assembler computes a
   * concrete `deadline` ISO date from `step1.effectiveFrom + (length × unit)`.
   *
   * `perpetual` mode emits no deadline (engine treats as no-term).
   * `fixed` mode emits the computed deadline.
   */
  termMode: TermMode;
  /** String for form-input convenience; parsed on submit. Ignored when `termMode === 'perpetual'`. */
  termLength: string;
  /** Time unit for `termLength`. Ignored when `termMode === 'perpetual'`. */
  termUnit: TermUnit;
}

export interface WizardStep2Data {
  mode: SettlementMode;
  /** Whether the Deductions Layer toggle is on. */
  deductionsEnabled: boolean;
  deductions: DeductionRow[];
  /**
   * Selected allocation target ids. `POOL_TARGET_ID` represents the
   * investor pool; other ids are participant ids.
   */
  selectedTargets: string[];
  /**
   * Pool revenue source basis ONLY — Round 4 (Liang) #16. The percentage
   * the pool receives is derived from its row in `splitRows` /
   * `tier2Rows` so the admin doesn't enter the same number twice and the
   * splits sum to a clean 100%. The payload assembler reads the pool's
   * split-row value and combines with this basis to build the wire
   * `PoolRevenueSourceRule`.
   */
  poolRevenue: {
    basis: PoolRevenueBasis;
  };
  /** Recoup mode: per-target recoup multiplier %. */
  recoupRows: DistributionRowMap;
  /** Waterfall mode Tier 1: per-target recoup multiplier %. */
  tier1Rows: DistributionRowMap;
  /** Waterfall mode Tier 2: per-target profit split %. */
  tier2Rows: DistributionRowMap;
  /** Revenue Share mode: per-target profit split %. */
  splitRows: DistributionRowMap;
  exitConditions: ExitConditionsData;
}

export interface WizardState {
  currentStep: WizardStepNumber;
  step1: WizardStep1Data;
  step2: WizardStep2Data;
}

export function buildInitialWizardState(): WizardState {
  return {
    currentStep: 1,
    step1: {
      effectiveFrom: '',
      notes: '',
    },
    step2: {
      mode: 'waterfall',
      // Default ON: most deals have at least one Fee Deduction participant
      // (distributor / MCN / platform) and showing them pre-populated as
      // soon as the wizard mounts is the common case. Toggling OFF here
      // is a deliberate opt-out for the rare zero-fee deal.
      deductionsEnabled: true,
      deductions: [],
      selectedTargets: [POOL_TARGET_ID],
      poolRevenue: {
        basis: 'NET',
      },
      recoupRows: {},
      tier1Rows: {},
      tier2Rows: {},
      splitRows: {},
      exitConditions: {
        hardCapEnabled: false,
        hardCapMultiplier: '',
        // Default Perpetual so admins who don't think about expiry
        // get a no-op default (engine sees no deadline). Switching to
        // Fixed seeds the most common shape: 5 Years (catalog default
        // from Liang's test pack).
        termMode: 'perpetual',
        termLength: '5',
        termUnit: 'years',
      },
    },
  };
}
