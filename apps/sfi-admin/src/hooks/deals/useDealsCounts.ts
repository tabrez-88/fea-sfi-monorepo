import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { dealsService } from '@/services/deals.service';

export function useDealsCounts() {
  return useQuery({
    queryKey: QUERY_KEYS.DEALS.COUNTS,
    queryFn: () => dealsService.counts(),
  });
}
