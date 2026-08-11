import { useMutation, useQueryClient } from '@tanstack/react-query';

import { settlementService } from '@/services/settlement.service';
import type { CreateSettlementRunInput } from '@/types/settlement.types';

type Variables = Readonly<{ dealId: string; input: CreateSettlementRunInput }>;

export function useCreateSettlementRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, input }: Variables) =>
      settlementService.create(dealId, input),
    onSuccess: (_data, variables) => {
      // Prefix-invalidation scoped to the affected deal so other deals'
      // caches stay warm. Raw key prefixes (QUERY_KEYS minus the params
      // segment) because the QUERY_KEYS helpers always append a params
      // object, which would narrow the match to a single query.
      void queryClient.invalidateQueries({
        queryKey: ['settlement', 'runs', variables.dealId],
      });
      // Runs consume revenue batches, so batch `isSettled` flags shift too.
      void queryClient.invalidateQueries({
        queryKey: ['revenue', 'list', variables.dealId],
      });
    },
  });
}
