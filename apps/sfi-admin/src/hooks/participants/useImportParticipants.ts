import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import {
  participantsService,
  type ImportCsvOptions,
} from '@/services/participants.service';

type Variables = Readonly<{
  file: File;
  options?: ImportCsvOptions;
}>;

/**
 * Bulk-import participants from a CSV. Single hook serves both the
 * Preview (`dryRun: true`) and the real import (`dryRun: false`).
 *
 * Cache invalidation only fires for a real import; dry-runs don't touch
 * the DB so the cached participants list stays accurate.
 */
export function useImportParticipants(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, options }: Variables) =>
      participantsService.importCsv(dealId, file, options),
    onSuccess: (_data, variables) => {
      if (variables.options?.dryRun) return;
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PARTICIPANTS.ALL,
      });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.DEALS.DETAIL(dealId),
      });
    },
  });
}
