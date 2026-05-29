import { Badge } from '@/components/ui/badge';
import {
  PARTICIPANT_BEHAVIOR_LABEL,
  PARTICIPANT_BEHAVIOR_TONE,
} from '@/constants/ui';
import type { ParticipantBehavior } from '@/types/participant.types';

type ParticipantBehaviorBadgeProps = Readonly<{
  behavior: ParticipantBehavior;
  /** Pass `sm` for compact contexts (e.g. import preview rows). */
  size?: 'default' | 'sm';
}>;

export function ParticipantBehaviorBadge({
  behavior,
  size = 'default',
}: ParticipantBehaviorBadgeProps) {
  return (
    <Badge variant={PARTICIPANT_BEHAVIOR_TONE[behavior]} size={size}>
      {PARTICIPANT_BEHAVIOR_LABEL[behavior]}
    </Badge>
  );
}
