import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { authStorage } from '@/lib/auth-storage';
import { env } from '@/lib/env';

export const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

// ─── Request interceptor: set baseURL lazily + attach auth token ──────────────
// `env.NEXT_PUBLIC_API_URL` is resolved here (not in `axios.create`) so the Zod
// env schema is never evaluated at module-load time during `next build` prerender.
apiClient.interceptors.request.use((config) => {
  if (!config.baseURL) {
    config.baseURL = env.NEXT_PUBLIC_API_URL;
  }
  const token = authStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: refresh-token retry, then redirect ─────────────────
//
// On 401:
//   1. If the failing request is itself an auth call (/auth/refresh, /auth/login,
//      /auth/register), don't try to refresh — let the caller handle it.
//   2. If we've already retried this request once, give up and log out (prevents
//      infinite refresh loops when the refresh token is also invalid).
//   3. Otherwise call POST /auth/refresh with the stored refresh token. While
//      that request is in flight, queue any other 401s onto the SAME promise so
//      we don't fire N concurrent refresh calls when the app makes parallel
//      requests (typical on a fresh page load).
//   4. On success: persist the new tokens, retry the original request with the
//      fresh access token in the Authorization header.
//   5. On failure (refresh expired / revoked / network): clear tokens, redirect
//      to /login preserving the route the user was on.
//
// Without this, the admin loses their session after the access token's 15m TTL
// even though the refresh token is valid for 7d — and any in-flight wizard
// state goes with it.

type RetriableRequest = InternalAxiosRequestConfig & { _retried?: boolean };

interface RefreshResponse {
  user: unknown;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

// Singleton in-flight promise so concurrent 401s share one refresh call.
// `null` when no refresh is currently happening.
let pendingRefresh: Promise<string> | null = null;

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url.includes('/auth/refresh') ||
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password')
  );
}

async function refreshAccessToken(): Promise<string> {
  if (pendingRefresh) return pendingRefresh;

  pendingRefresh = (async () => {
    try {
      const refreshToken = authStorage.getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token in storage');

      // Bare `axios.post` (not `apiClient`) so this call bypasses the
      // response interceptor — otherwise a 401 from /auth/refresh itself
      // would re-trigger this function and loop.
      const { data } = await axios.post<RefreshResponse>(
        `${env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' }, timeout: 15_000 },
      );
      authStorage.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      return data.tokens.accessToken;
    } finally {
      pendingRefresh = null;
    }
  })();

  return pendingRefresh;
}

function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  authStorage.clear();
  if (window.location.pathname.startsWith('/login')) return;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/login?next=${next}`;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequest | undefined;

    if (error.response?.status !== 401 || !original) {
      return Promise.reject(error);
    }

    // Auth endpoints handle their own 401s — don't try to refresh
    // (e.g. failed login should bubble straight to the form, not nuke the session).
    if (isAuthEndpoint(original.url)) {
      return Promise.reject(error);
    }

    // Already retried once — refresh must have failed downstream. Give up.
    if (original._retried) {
      redirectToLogin();
      return Promise.reject(error);
    }

    try {
      const newAccessToken = await refreshAccessToken();
      original._retried = true;
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(original);
    } catch {
      redirectToLogin();
      return Promise.reject(error);
    }
  },
);

/**
 * Extract a user-facing error message from an unknown error. Prefers the
 * backend's `message` field, falls back to the provided default. Keeps
 * consumers from having to import `AxiosError` directly.
 *
 * Some endpoints return a generic `message` plus a detailed `errors` array
 * (the rule-snapshot v2 validator is the notable one). Dropping that array
 * left Liang staring at "Rule snapshot v2 validation failed" with no way
 * to tell which tier or split was wrong, so the details are appended here.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { message?: string | string[]; errors?: unknown }
      | undefined;

    const base = Array.isArray(data?.message)
      ? data.message.join(', ')
      : typeof data?.message === 'string'
        ? data.message
        : null;

    const details = Array.isArray(data?.errors)
      ? data.errors.filter((e): e is string => typeof e === 'string')
      : [];

    if (base && details.length > 0) return `${base}: ${details.join('; ')}`;
    if (details.length > 0) return details.join('; ');
    if (base) return base;
  }
  return fallback;
}
