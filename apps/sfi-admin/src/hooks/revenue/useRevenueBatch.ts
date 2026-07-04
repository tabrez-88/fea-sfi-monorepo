import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { revenueService } from '@/services/revenue.service';

export function useRevenueBatch(id: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.REVENUE.DETAIL(id ?? ''),
    queryFn: () => revenueService.getById(id as string),
    enabled: Boolean(id),
  });
}
