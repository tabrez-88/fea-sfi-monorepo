import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { participantsService } from '@/services/participants.service';
import type { CreateParticipantInput } from '@/types/participant.types';

export function useCreateParticipant(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateParticipantInput) =>
      participantsService.create(dealId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PARTICIPANTS.ALL,
      });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.DEALS.DETAIL(dealId),
      });
    },
  });
}
