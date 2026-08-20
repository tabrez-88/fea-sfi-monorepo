import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { dealsService } from '@/services/deals.service';

/**
 * Delete a deal. The BE cascades participants, snapshots, revenue batches
 * and settlement runs, and rejects with 409 when the deal has a finalized
 * settlement run, so the caller should surface the API message rather than
 * a generic failure string.
 */
export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dealsService.remove(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.DEALS.DETAIL(id) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DEALS.ALL });
      // The deal is gone, so anything scoped under it is stale too.
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PARTICIPANTS.ALL });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RULES.ALL });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REVENUE.ALL });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SETTLEMENT.ALL });
    },
  });
}
