'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authStorage } from '@/lib/auth-storage';
import { authService } from '@/services/auth.service';

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = authStorage.getRefreshToken();
      if (refreshToken) {
        try {
          await authService.logout(refreshToken);
        } catch {
          // Server-side revoke can fail silently; we still clear client state
        }
      }
    },
    onSettled: () => {
      authStorage.clear();
      queryClient.clear();
    },
  });
}
