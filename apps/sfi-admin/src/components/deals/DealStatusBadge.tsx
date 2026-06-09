import { Badge } from '@/components/ui/badge';
import {
  DEAL_STATUS_DEFINITION,
  DEAL_STATUS_LABEL,
  DEAL_STATUS_TONE,
} from '@/constants/ui';
import type { DealStatus } from '@/types/deal.types';

type DealStatusBadgeProps = Readonly<{
  status: DealStatus;
}>;

export function DealStatusBadge({ status }: DealStatusBadgeProps) {
  // Native `title` tooltip surfaces Liang's verbatim status definition
  // on hover. Cheap, accessible, works everywhere — no Tooltip dep.
  return (
    <Badge variant={DEAL_STATUS_TONE[status]} title={DEAL_STATUS_DEFINITION[status]}>
      {DEAL_STATUS_LABEL[status]}
    </Badge>
  );
}
