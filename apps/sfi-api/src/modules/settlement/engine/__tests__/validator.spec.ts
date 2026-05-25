import { RuleSnapshotRulesV2 } from '../types';
import { validateRuleSnapshotV2 } from '../validator';

/**
 * Minimal v2 rules builder — produces a valid `recoup`-mode snapshot with
 * one individual + one pool tier split. Tests override fields to construct
 * the bad shapes they want to exercise.
 */
function baseRules(): RuleSnapshotRulesV2 {
  return {
    schemaVersion: 2,
    mode: 'recoup',
    tiers: [
      {
        tier: 1,
        splits: [
          { target: { type: 'individual', participantId: 'p-1' }, percentage: 60 },
          { target: { type: 'individual', participantId: 'p-2' }, percentage: 40 },
        ],
      },
    ],
  };
}

describe('validateRuleSnapshotV2', () => {
  describe('schemaVersion / shape', () => {
    it('rejects non-object input', () => {
      const result = validateRuleSnapshotV2(null);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors[0]).toMatch(/non-null object/);
    });

    it('rejects schemaVersion != 2', () => {
      const result = validateRuleSnapshotV2({ schemaVersion: 1 });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors[0]).toMatch(/schemaVersion must be 2/);
    });

    it('rejects unknown mode', () => {
      const result = validateRuleSnapshotV2({ ...baseRules(), mode: 'bogus' });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.some((e) => /mode must be/.test(e))).toBe(true);
    });
  });

  describe('mode-based tier applicability', () => {
    it('revenue_share mode rejects any tiers', () => {
      const rules = baseRules();
      rules.mode = 'revenue_share';
      // Keep the one tier from base — should now be illegal.
      const result = validateRuleSnapshotV2(rules);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => /revenue_share.*must not declare/.test(e))).toBe(true);
      }
    });

    it('recoup mode requires exactly 1 tier', () => {
      const rules = baseRules();
      rules.tiers = [];
      const result = validateRuleSnapshotV2(rules);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => /recoup.*exactly 1 tier/.test(e))).toBe(true);
      }
    });

    it('waterfall mode requires exactly 2 tiers', () => {
      const rules = baseRules();
      rules.mode = 'waterfall';
      // Still has only 1 tier from base — should fail.
      const result = validateRuleSnapshotV2(rules);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => /waterfall.*exactly 2 tiers/.test(e))).toBe(true);
      }
    });

    it('accepts waterfall mode with 2 valid tiers', () => {
      const rules: RuleSnapshotRulesV2 = {
        schemaVersion: 2,
        mode: 'waterfall',
        tiers: [
          {
            tier: 1,
            splits: [{ target: { type: 'individual', participantId: 'p-1' }, percentage: 100 }],
          },
          {
            tier: 2,
            splits: [
              { target: { type: 'individual', participantId: 'p-1' }, percentage: 70 },
              { target: { type: 'individual', participantId: 'p-2' }, percentage: 30 },
            ],
          },
        ],
      };
      const result = validateRuleSnapshotV2(rules);
      expect(result.ok).toBe(true);
    });
  });

  describe('tier split percentages', () => {
    it('rejects tier splits that do not sum to 100', () => {
      const rules = baseRules();
      rules.tiers![0].splits = [
        { target: { type: 'individual', participantId: 'p-1' }, percentage: 60 },
        { target: { type: 'individual', participantId: 'p-2' }, percentage: 30 }, // sums to 90
      ];
      const result = validateRuleSnapshotV2(rules);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => /must sum to 100/.test(e))).toBe(true);
      }
    });

    it('accepts splits that sum to 100 ± tolerance (rounding)', () => {
      const rules = baseRules();
      rules.tiers![0].splits = [
        { target: { type: 'individual', participantId: 'p-1' }, percentage: 33.333 },
        { target: { type: 'individual', participantId: 'p-2' }, percentage: 33.333 },
        { target: { type: 'individual', participantId: 'p-3' }, percentage: 33.334 },
      ];
      const result = validateRuleSnapshotV2(rules);
      expect(result.ok).toBe(true);
    });
  });

  describe('pool-target constraint (v1: at most one)', () => {
    it('rejects snapshots with multiple distinct pool ids', () => {
      const rules: RuleSnapshotRulesV2 = {
        schemaVersion: 2,
        mode: 'waterfall',
        tiers: [
          {
            tier: 1,
            splits: [
              { target: { type: 'pool', poolId: 'pool-A' }, percentage: 100 },
            ],
          },
          {
            tier: 2,
            splits: [
              { target: { type: 'pool', poolId: 'pool-B' }, percentage: 100 },
            ],
          },
        ],
      };
      const result = validateRuleSnapshotV2(rules);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => /at most one pool target/.test(e))).toBe(true);
      }
    });

    it('accepts repeated references to the SAME pool id', () => {
      const rules: RuleSnapshotRulesV2 = {
        schemaVersion: 2,
        mode: 'waterfall',
        tiers: [
          {
            tier: 1,
            splits: [
              { target: { type: 'pool', poolId: 'pool-A' }, percentage: 100 },
            ],
          },
          {
            tier: 2,
            splits: [
              { target: { type: 'pool', poolId: 'pool-A' }, percentage: 70 },
              { target: { type: 'individual', participantId: 'p-1' }, percentage: 30 },
            ],
          },
        ],
        poolRevenueSources: [{ poolId: 'pool-A', percentage: 100, basis: 'NET' }],
      };
      const result = validateRuleSnapshotV2(rules);
      expect(result.ok).toBe(true);
    });
  });

  describe('hardCapMultiplier >= recoupMultiplier ordering', () => {
    it('rejects tiers where hardCapMultiplier < recoupMultiplier', () => {
      const rules = baseRules();
      rules.tiers![0].recoupMultiplier = 1.3;
      rules.tiers![0].hardCapMultiplier = 1.1;
      const result = validateRuleSnapshotV2(rules);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => /hardCapMultiplier.*must be ≥ recoupMultiplier/.test(e))).toBe(true);
      }
    });

    it('accepts when only one of the two multipliers is set', () => {
      const rules = baseRules();
      rules.tiers![0].recoupMultiplier = 1.3;
      const result = validateRuleSnapshotV2(rules);
      expect(result.ok).toBe(true);
    });
  });

  describe('poolRevenueSources sanity', () => {
    it('rejects bad basis values', () => {
      const rules = baseRules();
      rules.poolRevenueSources = [
        { poolId: 'pool-X', percentage: 100, basis: 'WHATEVER' as 'GROSS' },
      ];
      const result = validateRuleSnapshotV2(rules);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => /basis must be 'GROSS' or 'NET'/.test(e))).toBe(true);
      }
    });
  });

  // Audit-pass additions (Run 2 safety re-check)
  describe('deductions[] shape', () => {
    it('rejects empty participantId', () => {
      const rules = baseRules();
      rules.deductions = [{ participantId: '', feePercentage: 10 }];
      const result = validateRuleSnapshotV2(rules);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => /deductions\[0\].participantId/.test(e))).toBe(true);
      }
    });

    it('rejects out-of-range feePercentage', () => {
      const rules = baseRules();
      rules.deductions = [{ participantId: 'd-1', feePercentage: 150 }];
      const result = validateRuleSnapshotV2(rules);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => /feePercentage must be 0–100/.test(e))).toBe(true);
      }
    });

    it('rejects negative feeAmount', () => {
      const rules = baseRules();
      rules.deductions = [{ participantId: 'd-1', feePercentage: 0, feeAmount: -1 }];
      const result = validateRuleSnapshotV2(rules);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => /feeAmount must be a non-negative number/.test(e))).toBe(true);
      }
    });

    it('accepts a valid mixed-shape deduction list (flat + percentage on same snapshot)', () => {
      const rules = baseRules();
      rules.deductions = [
        { participantId: 'd-1', feePercentage: 15 },
        { participantId: 'd-2', feePercentage: 0, feeAmount: 5_000_000 },
      ];
      const result = validateRuleSnapshotV2(rules);
      expect(result.ok).toBe(true);
    });
  });

  describe('revenue_share requires a sink', () => {
    it('rejects a revenue_share snapshot with neither splits nor poolRevenueSources', () => {
      const result = validateRuleSnapshotV2({
        schemaVersion: 2,
        mode: 'revenue_share',
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(
          result.errors.some((e) =>
            /revenue_share mode requires at least one of `splits\[\]` or `poolRevenueSources\[\]`/.test(e),
          ),
        ).toBe(true);
      }
    });

    it('accepts a revenue_share snapshot with only splits', () => {
      const result = validateRuleSnapshotV2({
        schemaVersion: 2,
        mode: 'revenue_share',
        splits: [
          { target: { type: 'individual', participantId: 'p-1' }, percentage: 100 },
        ],
      });
      expect(result.ok).toBe(true);
    });

    it('accepts a revenue_share snapshot with only poolRevenueSources', () => {
      const result = validateRuleSnapshotV2({
        schemaVersion: 2,
        mode: 'revenue_share',
        poolRevenueSources: [{ poolId: 'pool-A', percentage: 100, basis: 'NET' }],
      });
      expect(result.ok).toBe(true);
    });
  });

  describe('duplicate tier numbers', () => {
    it('rejects two tier=1 entries in waterfall mode', () => {
      const result = validateRuleSnapshotV2({
        schemaVersion: 2,
        mode: 'waterfall',
        tiers: [
          {
            tier: 1,
            splits: [{ target: { type: 'individual', participantId: 'p-1' }, percentage: 100 }],
          },
          {
            tier: 1,
            splits: [{ target: { type: 'individual', participantId: 'p-2' }, percentage: 100 }],
          },
        ],
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => /duplicate tier number: 1/.test(e))).toBe(true);
      }
    });
  });
});
