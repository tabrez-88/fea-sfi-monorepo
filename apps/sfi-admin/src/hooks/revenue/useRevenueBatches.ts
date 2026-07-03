import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { revenueService } from '@/services/revenue.service';
import type { RevenueBatchListParams } from '@/types/revenue.types';

export function useRevenueBatches(
  dealId: string,
  params?: RevenueBatchListParams,
) {
  return useQuery({
    queryKey: QUERY_KEYS.REVENUE.LIST(
      dealId,
      params as Record<string, unknown> | undefined,
    ),
    queryFn: () => revenueService.list(dealId, params),
    enabled: Boolean(dealId),
  });
}
