import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { reportsService } from '@/services/reports.service';

export function useParticipantStatement(
  dealId: string,
  participantId: string | null | undefined,
) {
  return useQuery({
    queryKey: QUERY_KEYS.REPORTS.STATEMENT(dealId, participantId ?? ''),
    queryFn: () => reportsService.statement(dealId, participantId as string),
    enabled: Boolean(dealId) && Boolean(participantId),
  });
}
