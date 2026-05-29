import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { rulesService, type RuleSnapshotListParams } from '@/services/rules.service';

export function useRuleSnapshots(
  dealId: string,
  params?: RuleSnapshotListParams,
) {
  return useQuery({
    queryKey: QUERY_KEYS.RULES.LIST(
      dealId,
      params as Record<string, unknown> | undefined,
    ),
    queryFn: () => rulesService.list(dealId, params),
    enabled: Boolean(dealId),
  });
}
