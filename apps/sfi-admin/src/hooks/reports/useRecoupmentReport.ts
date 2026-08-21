import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { reportsService } from '@/services/reports.service';

export function useRecoupmentReport(dealId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.REPORTS.RECOUPMENT(dealId),
    queryFn: () => reportsService.recoupment(dealId),
    enabled: Boolean(dealId),
  });
}
