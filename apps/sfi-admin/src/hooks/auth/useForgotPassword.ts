'use client';

import { useMutation } from '@tanstack/react-query';

import { authService } from '@/services/auth.service';
import type { ForgotPasswordInput } from '@/types/auth.types';

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) =>
      authService.forgotPassword(input),
  });
}
