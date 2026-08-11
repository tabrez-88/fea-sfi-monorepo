import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { settlementService } from '@/services/settlement.service';

export function useSettlementRun(id: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.SETTLEMENT.RUN_DETAIL(id ?? ''),
    queryFn: () => settlementService.getById(id as string),
    enabled: Boolean(id),
  });
}
