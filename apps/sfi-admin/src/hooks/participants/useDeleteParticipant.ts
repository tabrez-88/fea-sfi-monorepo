import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { participantsService } from '@/services/participants.service';

export function useDeleteParticipant(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (participantId: string) => participantsService.remove(participantId),
    onSuccess: (_data, participantId) => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PARTICIPANTS.ALL,
      });
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.PARTICIPANTS.DETAIL(participantId),
      });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.DEALS.DETAIL(dealId),
      });
    },
  });
}
