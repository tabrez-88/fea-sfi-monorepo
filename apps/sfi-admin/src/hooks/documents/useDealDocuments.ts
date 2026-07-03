import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { documentsService } from '@/services/documents.service';
import type { DocumentListParams } from '@/types/document.types';

export function useDealDocuments(
  dealId: string,
  params?: DocumentListParams,
) {
  return useQuery({
    queryKey: QUERY_KEYS.DOCUMENTS.LIST_BY_DEAL(
      dealId,
      params as Record<string, unknown> | undefined,
    ),
    queryFn: () => documentsService.listByDeal(dealId, params),
    enabled: Boolean(dealId),
  });
}
