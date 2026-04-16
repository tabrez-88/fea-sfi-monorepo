'use client';

import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { dashboardService } from '@/services/dashboard.service';

export function useDashboardSummary() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.SUMMARY,
    queryFn: () => dashboardService.summary(),
    staleTime: 1000 * 30,
  });
}
