'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/query-keys';
import { authStorage } from '@/lib/auth-storage';
import { authService } from '@/services/auth.service';
import type { AuthResponse, LoginInput } from '@/types/auth.types';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
    onSuccess: (response: AuthResponse) => {
      authStorage.setTokens(
        response.tokens.accessToken,
        response.tokens.refreshToken,
      );
      queryClient.setQueryData(QUERY_KEYS.AUTH.ME, response.user);
    },
  });
}
