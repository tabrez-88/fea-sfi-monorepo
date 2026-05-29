import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { participantsService } from '@/services/participants.service';
import type { UpdateParticipantInput } from '@/types/participant.types';

type Variables = Readonly<{
  participantId: string;
  input: UpdateParticipantInput;
}>;

export function useUpdateParticipant(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ participantId, input }: Variables) =>
      participantsService.update(participantId, input),
    onSuccess: (_data, { participantId }) => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PARTICIPANTS.ALL,
      });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PARTICIPANTS.DETAIL(participantId),
      });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.DEALS.DETAIL(dealId),
      });
    },
  });
}
