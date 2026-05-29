import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { participantsService } from '@/services/participants.service';

/**
 * Fetches distinct role names on a deal, optionally narrowed by a
 * case-insensitive substring query. Powers the Add Participant form's
 * Role Name autocomplete combobox.
 *
 * Caller is expected to pass an already-debounced `q` to avoid hammering
 * the endpoint on every keystroke (see `useDebouncedValue`). Stale data is
 * kept on the screen while the next page fetches so the suggestion list
 * doesn't flash empty between fetches.
 */
export function useParticipantRoles(dealId: string, q: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.PARTICIPANTS.ROLES(dealId, q),
    queryFn: () => participantsService.listRoles(dealId, q),
    enabled: enabled && Boolean(dealId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
