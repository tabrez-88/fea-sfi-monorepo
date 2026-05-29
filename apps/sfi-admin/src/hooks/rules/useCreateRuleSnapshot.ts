import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import {
  rulesService,
  type CreateRuleSnapshotInput,
} from '@/services/rules.service';

export function useCreateRuleSnapshot(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRuleSnapshotInput) =>
      rulesService.create(dealId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RULES.ALL });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.DEALS.DETAIL(dealId),
      });
    },
  });
}
