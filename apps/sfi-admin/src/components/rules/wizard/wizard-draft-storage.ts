import type { WizardState } from './wizard-state.types';

/**
 * localStorage-backed draft persistence for the Create Rule Snapshot wizard.
 *
 * Why this exists: the wizard holds its state in React `useState` only. Any
 * forced navigation (a 401 logout redirect, an accidental browser back/refresh)
 * destroys the in-memory state and the admin loses everything they typed.
 * Persisting per-deal to localStorage means the next mount can offer to
 * resume — defensive backup on top of the axios refresh-retry fix.
 *
 * Keyed per deal so two deals open in two tabs don't clobber each other.
 * Cleared explicitly after a successful Create Snapshot (caller's job).
 *
 * The stored shape is versioned (`SCHEMA_VERSION`) so a future state-shape
 * change doesn't rehydrate stale incompatible data — bumping the version
 * silently discards old drafts.
 */

const STORAGE_PREFIX = 'sfi_rule_wizard_draft';
// v2: Round 4 (Liang) replaced `deadlineEnabled` + `deadline` on
// `ExitConditionsData` with `termMode` + `termLength` + `termUnit`.
// v3: Round 4 (Liang) #16 dropped `poolRevenue.percentage` — the pool's
// percentage now comes from its row in the splits, so the wizard only
// stores the `basis` selector locally.
// Bumping the version silently discards older drafts on first re-open.
const SCHEMA_VERSION = 3;

interface DraftEnvelope {
  version: number;
  savedAt: string;
  state: WizardState;
}

function keyFor(dealId: string): string {
  return `${STORAGE_PREFIX}:${dealId}`;
}

export const wizardDraftStorage = {
  save(dealId: string, state: WizardState): void {
    if (typeof window === 'undefined') return;
    try {
      const envelope: DraftEnvelope = {
        version: SCHEMA_VERSION,
        savedAt: new Date().toISOString(),
        state,
      };
      window.localStorage.setItem(keyFor(dealId), JSON.stringify(envelope));
    } catch {
      // localStorage can throw (quota exceeded, disabled in private mode).
      // Draft persistence is best-effort — never block the wizard on a
      // save failure.
    }
  },

  /**
   * Returns the saved state when present, well-formed, and on the current
   * schema version. Returns null otherwise (no draft, parse error, stale
   * version) so the caller can fall back to a fresh initial state.
   */
  load(dealId: string): { state: WizardState; savedAt: string } | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(keyFor(dealId));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<DraftEnvelope>;
      if (parsed.version !== SCHEMA_VERSION) return null;
      if (!parsed.state || !parsed.savedAt) return null;
      return { state: parsed.state, savedAt: parsed.savedAt };
    } catch {
      return null;
    }
  },

  clear(dealId: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(keyFor(dealId));
    } catch {
      // Best-effort.
    }
  },
};
