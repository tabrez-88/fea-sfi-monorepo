import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { documentsService } from '@/services/documents.service';
import type { DocumentListParams } from '@/types/document.types';

export function useBatchDocuments(
  batchId: string | null | undefined,
  params?: DocumentListParams,
) {
  return useQuery({
    queryKey: QUERY_KEYS.DOCUMENTS.LIST_BY_BATCH(
      batchId ?? '',
      params as Record<string, unknown> | undefined,
    ),
    queryFn: () => documentsService.listByBatch(batchId as string, params),
    enabled: Boolean(batchId),
  });
}
