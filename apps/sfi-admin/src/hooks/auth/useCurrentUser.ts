'use client';

import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { authStorage } from '@/lib/auth-storage';
import { authService } from '@/services/auth.service';

export function useCurrentUser() {
  return useQuery({
    queryKey: QUERY_KEYS.AUTH.ME,
    queryFn: () => authService.me(),
    enabled: Boolean(authStorage.getAccessToken()),
    staleTime: 1000 * 60 * 10,
  });
}
