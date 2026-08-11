import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { settlementService } from '@/services/settlement.service';
import type { SettlementRunListParams } from '@/types/settlement.types';

export function useSettlementRuns(
  dealId: string,
  params?: SettlementRunListParams,
) {
  return useQuery({
    queryKey: QUERY_KEYS.SETTLEMENT.RUNS(
      dealId,
      params as Record<string, unknown> | undefined,
    ),
    queryFn: () => settlementService.list(dealId, params),
    enabled: Boolean(dealId),
  });
}
