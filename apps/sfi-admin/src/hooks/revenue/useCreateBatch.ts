import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { revenueService } from '@/services/revenue.service';
import type { CreateRevenueBatchInput } from '@/types/revenue.types';

type Variables = Readonly<{ dealId: string; input: CreateRevenueBatchInput }>;

export function useCreateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, input }: Variables) =>
      revenueService.create(dealId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REVENUE.ALL });
    },
  });
}
