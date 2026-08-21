import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { ledgerService } from '@/services/ledger.service';

export function useLedgerJournal(id: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.LEDGER.JOURNAL(id ?? ''),
    queryFn: () => ledgerService.journal(id as string),
    enabled: Boolean(id),
  });
}
