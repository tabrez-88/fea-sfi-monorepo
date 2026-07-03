import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { documentsService, type UploadDocumentInput } from '@/services/documents.service';

type Variables = Readonly<{ dealId: string; input: UploadDocumentInput }>;

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, input }: Variables) =>
      documentsService.uploadForDeal(dealId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOCUMENTS.ALL });
    },
  });
}
