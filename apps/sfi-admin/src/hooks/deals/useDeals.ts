import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { dealsService, type DealListParams } from '@/services/deals.service';

export function useDeals(params?: DealListParams) {
  return useQuery({
    queryKey: QUERY_KEYS.DEALS.LIST(params as Record<string, unknown> | undefined),
    queryFn: () => dealsService.list(params),
  });
}
