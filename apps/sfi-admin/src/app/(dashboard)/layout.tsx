import type { ReactNode } from 'react';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { DashboardShell } from '@/components/layout/DashboardShell';

/**
 * Every page under `/(dashboard)/*` requires a signed-in user. `RequireAuth`
 * handles the redirect-to-login case; the shell renders the navbar/sidebar
 * chrome once the user is confirmed.
 *
 * To gate a page by role, compose `RequireAuth` on the page itself with
 * `<RequireAuth roles={['ADMIN']}>`. Leaving the layout-level guard role-free
 * matches the "simple RBAC" brief — any signed-in user reaches the shell.
 */
export default function DashboardGroupLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <RequireAuth>
      <DashboardShell>{children}</DashboardShell>
    </RequireAuth>
  );
}
