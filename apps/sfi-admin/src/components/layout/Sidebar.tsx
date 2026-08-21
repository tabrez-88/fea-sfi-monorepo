'use client';

import { LayoutDashboard, FileText, Layers, ClipboardList, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import { usePendingReviews } from '@/hooks/dashboard/usePendingReviews';
import { cn } from '@/lib/utils';

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  matchPrefix?: boolean;
  /** Renders the live pending-review count as a notification badge. */
  showPendingCount?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  {
    label: 'Deals',
    href: ROUTES.DEALS.LIST,
    icon: FileText,
    matchPrefix: true,
  },
  {
    label: 'All Settlements',
    href: ROUTES.SETTLEMENT.LIST,
    icon: Layers,
    matchPrefix: true,
  },
  {
    label: 'Pending Reviews',
    href: ROUTES.PENDING_REVIEWS,
    icon: ClipboardList,
    showPendingCount: true,
  },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.matchPrefix) return pathname.startsWith(item.href);
  return pathname === item.href;
}

type SidebarProps = Readonly<{
  /**
   * `true`: expanded (312px) with labels visible.
   * `false`: collapsed to a 72px icon rail; labels animate out instead of
   *           the component being swapped, so the expand/collapse motion is
   *           smooth. Toggled by the Navbar chevron.
   */
  desktopOpen: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}>;

/**
 * Left sidebar: Dashboard / Deals / All Settlements / Pending Reviews.
 * Desktop: a single `<aside>` whose width + padding animate between the
 * expanded and collapsed states while a single unified `<ul>` of nav items
 * morphs in place (labels fade + width-collapse). No conditional swap, so
 * no layout jump mid-transition.
 */
export function Sidebar({ desktopOpen, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* ─── Desktop (≥lg): single animated aside ────────────────────────── */}
      <aside
        className={cn(
          'hidden shrink-0 overflow-x-hidden overflow-y-auto border-border bg-white py-4 lg:block',
          'sticky top-[96px] self-start h-[calc(100vh-96px)]',
          'transition-[width,padding] duration-300 ease-in-out',
          desktopOpen ? 'w-[312px] px-4' : 'w-[72px] px-3',
        )}
        aria-label={desktopOpen ? 'Main navigation' : 'Main navigation (collapsed)'}
      >
        <SidebarNavList pathname={pathname} collapsed={!desktopOpen} onItemClick={onCloseMobile} />
      </aside>

      {/* ─── Mobile overlay drawer (<lg): always mounted, slides in/out ─── */}
      {/* Backdrop: starts below the 96px navbar so the topbar stays visible */}
      <div
        aria-hidden
        onClick={onCloseMobile}
        className={cn(
          'fixed inset-x-0 bottom-0 top-[96px] z-40 bg-black/40 transition-opacity duration-300 ease-in-out lg:hidden',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      {/* Drawer: anchored below the navbar. Close via backdrop or navbar toggle */}
      <aside
        aria-label="Navigation menu"
        aria-hidden={!mobileOpen}
        className={cn(
          'fixed left-0 top-[96px] z-50 flex h-[calc(100%-96px)] w-[280px] flex-col bg-white px-4 py-4 shadow-xl lg:hidden',
          'transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarNavList pathname={pathname} collapsed={false} onItemClick={onCloseMobile} />
      </aside>
    </>
  );
}

type NavListProps = Readonly<{
  pathname: string;
  collapsed: boolean;
  onItemClick?: (() => void) | undefined;
}>;

/**
 * Unified nav list. When `collapsed` is true, labels animate to `w-0 opacity-0`
 * (icon-only rail). When false, they animate to full width + opacity. Both
 * states share the same item structure, so the morph is smooth.
 *
 * Exported so the DealSidebar's mobile drawer can reuse the collapsed rail
 * (matches Figma "Mobile Sidebar [Active]" deal-context frame).
 */
export function SidebarNavList({ pathname, collapsed, onItemClick }: NavListProps) {
  // Live count for the Pending Reviews badge. Cached by React Query with a
  // 30s stale time, so mounting this in the persistent sidebar costs one
  // request per window rather than one per navigation.
  const { data: pending } = usePendingReviews();
  const pendingCount = pending?.totalCount ?? 0;

  return (
    <ul className="flex w-full flex-col gap-2">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item);
        const badgeCount = item.showPendingCount ? pendingCount : 0;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              {...(onItemClick ? { onClick: onItemClick } : {})}
              {...(collapsed
                ? {
                    title: badgeCount > 0 ? `${item.label} (${badgeCount})` : item.label,
                    'aria-label':
                      badgeCount > 0 ? `${item.label}, ${badgeCount} pending` : item.label,
                  }
                : {})}
              className={cn(
                'flex h-[48px] items-center overflow-hidden rounded-[8px] transition-colors',
                active ? 'bg-foreground text-background' : 'text-foreground hover:bg-grey-50',
                collapsed ? 'justify-center px-0' : 'gap-2 px-[14px]',
              )}
            >
              <span className="relative flex shrink-0 items-center">
                <Icon className="size-5 shrink-0" strokeWidth={2} />
                {badgeCount > 0 && (
                  <span
                    className="absolute -right-1.5 -top-1.5 flex min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-[16px] text-white"
                    aria-hidden
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-[16px] font-bold leading-[20px] tracking-[-0.32px]',
                  'transition-[max-width,opacity,margin] duration-300 ease-in-out',
                  collapsed ? 'ml-0 max-w-0 opacity-0' : 'ml-0 max-w-[220px] opacity-100',
                )}
              >
                {item.label}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Backwards-compatible alias for callers that previously rendered an icon-only
 * rail just set `collapsed` on `SidebarNavList`. Kept for the DealSidebar
 * mobile drawer which composes the rail alongside the deal-scoped nav.
 */
export function SidebarIconRail({
  pathname,
  onItemClick,
}: Readonly<{
  pathname: string;
  onItemClick?: (() => void) | undefined;
}>) {
  return <SidebarNavList pathname={pathname} collapsed {...(onItemClick ? { onItemClick } : {})} />;
}
