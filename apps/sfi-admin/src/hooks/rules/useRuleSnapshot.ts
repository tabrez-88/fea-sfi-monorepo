import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { rulesService } from '@/services/rules.service';

export function useRuleSnapshot(id: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.RULES.DETAIL(id ?? ''),
    queryFn: () => rulesService.getById(id as string),
    enabled: Boolean(id),
  });
}
