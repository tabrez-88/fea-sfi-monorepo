import { Badge } from '@/components/ui/badge';
import { RULE_SNAPSHOT_STATUS_TONE } from '@/constants/ui';
import type { RuleSnapshotStatus } from '@/types/rule-snapshot.types';

type RuleSnapshotStatusBadgeProps = Readonly<{
  status: RuleSnapshotStatus;
}>;

function formatLabel(status: RuleSnapshotStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function RuleSnapshotStatusBadge({
  status,
}: RuleSnapshotStatusBadgeProps) {
  return (
    <Badge variant={RULE_SNAPSHOT_STATUS_TONE[status]}>
      {formatLabel(status)}
    </Badge>
  );
}
