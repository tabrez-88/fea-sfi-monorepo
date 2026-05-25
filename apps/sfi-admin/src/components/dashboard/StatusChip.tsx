import { Badge } from '@/components/ui/badge';
import {
  REVENUE_BATCH_STATUS_TONE,
  SETTLEMENT_RUN_STATUS_TONE,
} from '@/constants/ui';
import type {
  RevenueBatchStatus,
  SettlementRunStatus,
} from '@/types/dashboard.types';

// Display-only label overrides — back-end enum names stay as the source
// of truth. FB-003 Round 4 Comment 23 — `PROCESSED` reads as "Locked in
// Settlement" so operators understand the row is no longer editable.
const REVENUE_BATCH_STATUS_LABEL: Partial<Record<RevenueBatchStatus, string>> = {
  PROCESSED: 'Locked in Settlement',
};

function format(status: string): string {
  const lower = status.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function RevenueBatchStatusChip({
  status,
}: Readonly<{ status: RevenueBatchStatus }>) {
  const label = REVENUE_BATCH_STATUS_LABEL[status] ?? format(status);
  return <Badge variant={REVENUE_BATCH_STATUS_TONE[status]}>{label}</Badge>;
}

export function SettlementRunStatusChip({
  status,
}: Readonly<{ status: SettlementRunStatus }>) {
  return (
    <Badge variant={SETTLEMENT_RUN_STATUS_TONE[status]}>{format(status)}</Badge>
  );
}
