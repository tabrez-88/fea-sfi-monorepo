import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import {
  participantsService,
  type ParticipantListParams,
} from '@/services/participants.service';

export function useParticipants(
  dealId: string,
  params?: ParticipantListParams,
) {
  return useQuery({
    queryKey: QUERY_KEYS.PARTICIPANTS.LIST(
      dealId,
      params as Record<string, unknown> | undefined,
    ),
    queryFn: () => participantsService.list(dealId, params),
    enabled: Boolean(dealId),
  });
}
