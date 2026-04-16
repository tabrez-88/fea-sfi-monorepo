'use client';

import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { dealsService, type DealListParams } from '@/services/deals.service';

const RECENT_PARAMS: DealListParams = {
  page: 1,
  limit: 5,
  sortBy: 'updatedAt',
  sortOrder: 'desc',
};

export function useRecentDeals() {
  return useQuery({
    queryKey: QUERY_KEYS.DEALS.LIST({ ...RECENT_PARAMS }),
    queryFn: () => dealsService.list(RECENT_PARAMS),
  });
}
