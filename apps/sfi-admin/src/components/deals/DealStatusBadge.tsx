import { Badge } from '@/components/ui/badge';
import { DEAL_STATUS_TONE } from '@/constants/ui';
import type { DealStatus } from '@/types/deal.types';

type DealStatusBadgeProps = Readonly<{
  status: DealStatus;
}>;

function formatLabel(status: DealStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function DealStatusBadge({ status }: DealStatusBadgeProps) {
  return <Badge variant={DEAL_STATUS_TONE[status]}>{formatLabel(status)}</Badge>;
}
