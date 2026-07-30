import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { participantsService } from '@/services/participants.service';
import type { ParticipantBehavior } from '@/types/participant.types';

type Variables = Readonly<{
  participantIds: ReadonlyArray<string>;
  behaviorType: ParticipantBehavior;
}>;

export function useBulkSetBehavior(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ participantIds, behaviorType }: Variables) =>
      participantsService.bulkSetBehavior(dealId, participantIds, behaviorType),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PARTICIPANTS.ALL });
    },
  });
}
