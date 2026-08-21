import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { ledgerService } from '@/services/ledger.service';
import type { ListParams } from '@/types/api.types';

export function useDealLedger(dealId: string, params?: ListParams) {
  return useQuery({
    queryKey: QUERY_KEYS.LEDGER.DEAL(
      dealId,
      params as Record<string, unknown> | undefined,
    ),
    queryFn: () => ledgerService.byDeal(dealId, params),
    enabled: Boolean(dealId),
  });
}
