import axios, { AxiosError } from 'axios';

import { env } from '@/lib/env';
import { authStorage } from '@/lib/auth-storage';

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

// ─── Request interceptor — attach auth token ──────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — redirect on 401 ───────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      authStorage.clear();
      // Preserve the route the user was trying to reach so they land back after login
      const next = encodeURIComponent(
        window.location.pathname + window.location.search,
      );
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?next=${next}`;
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Extract a user-facing error message from an unknown error. Prefers the
 * backend's `message` field, falls back to the provided default. Keeps
 * consumers from having to import `AxiosError` directly.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message.join(', ');
    if (typeof data?.message === 'string') return data.message;
  }
  return fallback;
}
