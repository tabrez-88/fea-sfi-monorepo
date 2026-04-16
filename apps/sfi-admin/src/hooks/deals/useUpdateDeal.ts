import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { dealsService } from '@/services/deals.service';
import type { UpdateDealInput } from '@/types/deal.types';

export function useUpdateDeal(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateDealInput) => dealsService.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DEALS.DETAIL(id) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DEALS.ALL });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DEALS.COUNTS });
    },
  });
}
