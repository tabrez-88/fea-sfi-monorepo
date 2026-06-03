import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { dealsService } from '@/services/deals.service';

/**
 * Clones an existing deal into a new DRAFT. The new deal carries over
 * the static fields (name + " (Copy)", description, category, owner,
 * currency, dates) but NOT participants / rule snapshots / revenue /
 * settlements — those belong to the original. Used by the "Duplicate
 * Deal" CTA that appears on Completed / Terminated / Archived deals so
 * an admin can spawn a follow-up without retyping everything.
 *
 * Per Liang Round 4: closed/completed deals stay immutable; duplicate
 * is the escape hatch.
 */
export function useDuplicateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dealsService.duplicate(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DEALS.ALL });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DEALS.COUNTS });
    },
  });
}
