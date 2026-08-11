import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { settlementService } from '@/services/settlement.service';
import type { CreateCorrectionRunInput } from '@/types/settlement.types';

/**
 * Mutations for the run detail page (Screen 4.4/4.6): preview, finalize,
 * verify integrity, and create correction.
 *
 * Invalidation scope differs on purpose: preview only flips this run's
 * status (no batch state changes), so it touches settlement caches only.
 * Finalize and corrections flip linked revenue batches to PROCESSED /
 * settled, so they also invalidate revenue. Verify is read-only, no
 * invalidation.
 */
export function useSettlementRunActions(runId: string) {
  const queryClient = useQueryClient();

  function invalidateSettlement() {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SETTLEMENT.ALL });
  }

  function invalidateSettlementAndRevenue() {
    invalidateSettlement();
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REVENUE.ALL });
  }

  const preview = useMutation({
    mutationFn: () => settlementService.preview(runId),
    onSuccess: invalidateSettlement,
  });

  const finalize = useMutation({
    mutationFn: () => settlementService.finalize(runId),
    onSuccess: invalidateSettlementAndRevenue,
  });

  const verify = useMutation({
    mutationFn: () => settlementService.verify(runId),
  });

  const createCorrection = useMutation({
    mutationFn: (input: CreateCorrectionRunInput) =>
      settlementService.createCorrection(runId, input),
    onSuccess: invalidateSettlementAndRevenue,
  });

  return { preview, finalize, verify, createCorrection };
}
