import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { revenueService } from '@/services/revenue.service';

type Variables = Readonly<{ id: string; rejectionReason: string }>;

export function useRejectBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, rejectionReason }: Variables) =>
      revenueService.reject(id, rejectionReason),
    onSuccess: (batch) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REVENUE.ALL });
      queryClient.setQueryData(QUERY_KEYS.REVENUE.DETAIL(batch.id), batch);
    },
  });
}
