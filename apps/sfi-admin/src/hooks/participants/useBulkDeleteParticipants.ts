import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { participantsService } from '@/services/participants.service';

export function useBulkDeleteParticipants(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (participantIds: ReadonlyArray<string>) =>
      participantsService.bulkRemove(dealId, participantIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PARTICIPANTS.ALL });
      // Pool totals + snapshot participant counts read off the deal too.
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DEALS.DETAIL(dealId) });
    },
  });
}
