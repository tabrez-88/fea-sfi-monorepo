import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { participantsService } from '@/services/participants.service';

export function useParticipant(participantId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PARTICIPANTS.DETAIL(participantId),
    queryFn: () => participantsService.getById(participantId),
    enabled: Boolean(participantId),
  });
}
