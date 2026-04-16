'use client';

import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { dashboardService } from '@/services/dashboard.service';

export function usePendingReviews() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.PENDING_REVIEWS,
    queryFn: () => dashboardService.pendingReviews(),
    staleTime: 1000 * 30,
  });
}
