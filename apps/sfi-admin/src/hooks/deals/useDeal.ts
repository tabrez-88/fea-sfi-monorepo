import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { dealsService } from '@/services/deals.service';

export function useDeal(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.DEALS.DETAIL(id),
    queryFn: () => dealsService.getById(id),
    enabled: Boolean(id),
  });
}
