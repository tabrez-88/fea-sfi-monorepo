import type { SettlementRun } from '@/types/settlement.types';

/**
 * Page/breadcrumb title for a settlement run: "Run #2" (the BE's
 * pre-formatted runLabel) becomes "Settlement Run #2". Kept in one place
 * so a BE label format change or a copy request from Liang lands once
 * instead of at every call site.
 */
export function settlementRunTitle(
  run: Pick<SettlementRun, 'runNumber'> | null | undefined,
): string {
  if (!run) return 'Settlement Run';
  return `Settlement Run #${run.runNumber}`;
}
