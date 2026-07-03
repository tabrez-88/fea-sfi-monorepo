import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { documentsService } from '@/services/documents.service';

type Variables = Readonly<{ id: string; reason?: string }>;

export function useArchiveDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: Variables) => documentsService.archive(id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOCUMENTS.ALL });
    },
  });
}
