import { Badge } from '@/components/ui/badge';
import { DEAL_STATUS_LABEL, DEAL_STATUS_TONE } from '@/constants/ui';
import type { DealStatus } from '@/types/deal.types';

type DealStatusBadgeProps = Readonly<{
  status: DealStatus;
}>;

export function DealStatusBadge({ status }: DealStatusBadgeProps) {
  return (
    <Badge variant={DEAL_STATUS_TONE[status]}>{DEAL_STATUS_LABEL[status]}</Badge>
  );
}
