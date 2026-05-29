'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { authStorage } from '@/lib/auth-storage';
import type { UserRole } from '@/types/auth.types';

type RequireAuthProps = Readonly<{
  children: ReactNode;
  /**
   * Optional role gate. If provided, the current user's role must be one of
   * these values. Anyone else is bounced back to the dashboard with a toast.
   * Leave undefined for routes that only require "signed in".
   */
  roles?: readonly UserRole[];
}>;

/**
 * Client-side auth guard for routes under `(dashboard)`.
 *
 * Flow:
 *  1. On mount, read the access token from localStorage. If absent → redirect
 *     to `/login?next=<current path>`. This catches a direct URL hit before
 *     the API call even fires.
 *  2. If present, `useCurrentUser()` hydrates `GET /auth/me`. If the server
 *     rejects the token (401 → interceptor already cleared storage), the axios
 *     interceptor handles the redirect. If the request errors otherwise, we
 *     fall back to showing a skeleton.
 *  3. If `roles` prop is set and the user's role isn't in it, redirect home.
 *
 * This is a deliberately simple guard with no SSR cookie check, no per-action
 * permissions. Upgrade path: when the refresh token moves to an httpOnly
 * cookie, add a Next.js middleware that rejects requests without it at the
 * edge, and keep this component for the role check only.
 */
export function RequireAuth({ children, roles }: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Read token synchronously during initial render (client only).
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  useEffect(() => {
    setHasToken(Boolean(authStorage.getAccessToken()));
  }, []);

  const { data: user, isLoading, isError } = useCurrentUser();

  // No token: kick to login with return path.
  useEffect(() => {
    if (hasToken === false) {
      const next = encodeURIComponent(pathname || ROUTES.DASHBOARD);
      router.replace(`${ROUTES.LOGIN}?next=${next}`);
    }
  }, [hasToken, pathname, router]);

  // Role check: once user is loaded, enforce the role gate.
  useEffect(() => {
    if (!user || !roles || roles.length === 0) return;
    if (!roles.includes(user.role)) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [user, roles, router]);

  // Gate states: show a matching skeleton while redirects settle.
  if (hasToken === null || (hasToken && (isLoading || !user))) {
    return <AuthGateSkeleton />;
  }

  if (hasToken === false) {
    return <AuthGateSkeleton />;
  }

  if (isError) {
    // The axios 401 interceptor handles unauthenticated; this covers other
    // errors (network, 5xx). Render an unobtrusive message.
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-neutral">
          Couldn&apos;t load your session. Please try again.
        </p>
      </div>
    );
  }

  if (roles && roles.length > 0 && user && !roles.includes(user.role)) {
    return <AuthGateSkeleton />;
  }

  return <>{children}</>;
}

function AuthGateSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-[600px] w-full" />
    </div>
  );
}
