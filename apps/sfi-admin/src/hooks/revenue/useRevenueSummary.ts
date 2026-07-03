import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { revenueService } from '@/services/revenue.service';

export function useRevenueSummary(dealId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.REVENUE.SUMMARY(dealId),
    queryFn: () => revenueService.summary(dealId),
    enabled: Boolean(dealId),
  });
}
