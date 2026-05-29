'use client';

import { usePathname } from 'next/navigation';
import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

import { DealSidebar } from '@/components/layout/DealSidebar';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';

type DashboardShellProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Detect deal context from the pathname. Matches `/deals/<id>` and nested
 * deal-scoped pages (`/deals/<id>/participants`), but excludes the static
 * sub-routes `/deals/create` and the list root. Returns the deal id when in
 * context, `null` otherwise.
 */
const DEAL_CONTEXT_PATTERN = /^\/deals\/([^/]+)(?:\/|$)/;

function extractDealId(pathname: string): string | null {
  const match = DEAL_CONTEXT_PATTERN.exec(pathname);
  if (!match) return null;
  const id = match[1];
  if (!id || id === 'create') return null;
  return id;
}

/**
 * App-layout shell: 96px navbar on top, then a row of sidebars + main content.
 *
 * Sidebar layout per route:
 *   /deals/<id>/…   → main Sidebar in icon-rail mode (72px, non-collapsible)
 *                     + DealSidebar next to it (always visible, non-collapsible)
 *   anywhere else   → main Sidebar in full mode (312px, collapsible)
 *
 * Mobile: always a single drawer; in deal context the drawer is the
 * DealSidebar, elsewhere it's the main Sidebar. Icon-rail column hides on <lg.
 */
export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const dealId = useMemo(() => extractDealId(pathname), [pathname]);
  const inDealContext = dealId !== null;

  // Default: full labels in non-deal context, icon-rail in deal context
  // (matches Figma; the DealSidebar takes over as the primary nav there).
  const [desktopOpen, setDesktopOpen] = useState(() => !inDealContext);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Always toggleable. Per Figma "Desktop Sidebar [Inactive]", the collapsed
  // state is an icon-rail (not hidden), so the toggle is meaningful in both
  // contexts.
  const toggleSidebar = useCallback(() => {
    if (globalThis.matchMedia('(min-width: 1024px)').matches) {
      setDesktopOpen((prev) => !prev);
    } else {
      setMobileOpen((prev) => !prev);
    }
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Auto-adjust the desktop default when the user crosses the deal-context
  // boundary so they land on the right default for the new context. Within
  // a single context the user's manual toggle is preserved.
  const prevDealIdRef = useRef(dealId);
  useEffect(() => {
    const prev = prevDealIdRef.current;
    if (prev === null && dealId !== null) {
      setDesktopOpen(false); // entered a deal → collapse to icon-rail
    } else if (prev !== null && dealId === null) {
      setDesktopOpen(true); // left deal context → restore full nav
    }
    prevDealIdRef.current = dealId;
  }, [dealId]);

  // Close mobile drawer on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMobile();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closeMobile]);

  // When viewport grows back to desktop, reset mobile drawer + re-expand desktop
  useEffect(() => {
    const mq = globalThis.matchMedia('(min-width: 1024px)');
    function onMediaChange(e: MediaQueryListEvent) {
      if (e.matches) {
        setMobileOpen(false);
        setDesktopOpen(true);
      }
    }
    mq.addEventListener('change', onMediaChange);
    return () => mq.removeEventListener('change', onMediaChange);
  }, []);

  // Close mobile drawer on route change so the drawer never lingers after nav
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar onToggleSidebar={toggleSidebar} />

      <div className="flex flex-1 items-start pt-[96px]">
        <Sidebar
          desktopOpen={desktopOpen}
          mobileOpen={mobileOpen && !inDealContext}
          onCloseMobile={closeMobile}
        />
        {inDealContext && dealId && (
          <DealSidebar
            dealId={dealId}
            mobileOpen={mobileOpen}
            onCloseMobile={closeMobile}
          />
        )}

        <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
