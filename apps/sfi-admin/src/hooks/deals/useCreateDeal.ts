import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { dealsService } from '@/services/deals.service';
import type { CreateDealInput } from '@/types/deal.types';

export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDealInput) => dealsService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DEALS.ALL });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DEALS.COUNTS });
    },
  });
}
