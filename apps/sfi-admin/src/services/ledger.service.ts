import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/lib/axios';
import type { ListParams } from '@/types/api.types';
import type { DealLedger, LedgerJournalDetail } from '@/types/ledger.types';

/** MS-5 ledger reads (Screens 5.1 and 5.2). */
export const ledgerService = {
  async byDeal(dealId: string, params?: ListParams): Promise<DealLedger> {
    const { data } = await apiClient.get<DealLedger>(
      API_ENDPOINTS.LEDGER.DEAL(dealId),
      { params },
    );
    return data;
  },

  async journal(id: string): Promise<LedgerJournalDetail> {
    const { data } = await apiClient.get<LedgerJournalDetail>(
      API_ENDPOINTS.LEDGER.JOURNAL(id),
    );
    return data;
  },
};
