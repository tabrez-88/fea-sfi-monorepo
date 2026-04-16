import { Badge } from '@/components/ui/badge';
import {
  REVENUE_BATCH_STATUS_TONE,
  SETTLEMENT_RUN_STATUS_TONE,
} from '@/constants/ui';
import type {
  RevenueBatchStatus,
  SettlementRunStatus,
} from '@/types/dashboard.types';

function format(status: string): string {
  const lower = status.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function RevenueBatchStatusChip({
  status,
}: Readonly<{ status: RevenueBatchStatus }>) {
  return (
    <Badge variant={REVENUE_BATCH_STATUS_TONE[status]}>{format(status)}</Badge>
  );
}

export function SettlementRunStatusChip({
  status,
}: Readonly<{ status: SettlementRunStatus }>) {
  return (
    <Badge variant={SETTLEMENT_RUN_STATUS_TONE[status]}>{format(status)}</Badge>
  );
}
