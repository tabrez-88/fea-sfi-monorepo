'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SidebarIconRail } from '@/components/layout/Sidebar';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

type DealNavItem = Readonly<{
  label: string;
  href: (dealId: string) => string;
  matchExact?: boolean;
}>;

const DEAL_NAV_ITEMS: ReadonlyArray<DealNavItem> = [
  { label: 'Overview', href: ROUTES.DEALS.DETAIL, matchExact: true },
  { label: 'Participants', href: ROUTES.DEALS.PARTICIPANTS },
  { label: 'Rules', href: ROUTES.DEALS.RULES },
  { label: 'Revenue', href: ROUTES.DEALS.REVENUE },
  { label: 'Settlement', href: ROUTES.DEALS.SETTLEMENT },
  { label: 'Documents', href: ROUTES.DEALS.DOCUMENTS },
  { label: 'Reports', href: ROUTES.DEALS.REPORTS },
  { label: 'Proof', href: ROUTES.DEALS.PROOF },
];

type DealSidebarProps = Readonly<{
  dealId: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}>;

/**
 * Deal Context Mode sidebar — text-only label list (Overview → Proof) that
 * renders alongside the icon-rail variant of the main Sidebar when the route
 * is inside `/deals/:id/*`. Matches the Figma Deal Overview frame
 * (`385:10602`): narrow white column, active item black-filled, no icons on
 * the nav items, no internal back link (the back link lives above the page
 * title in `DealOverviewView`).
 *
 * Non-collapsible on desktop per the Figma spec — the toggle button in the
 * Navbar is a no-op when in deal context.
 */
export function DealSidebar({
  dealId,
  mobileOpen,
  onCloseMobile,
}: DealSidebarProps) {
  const pathname = usePathname();

  function itemIsActive(item: DealNavItem): boolean {
    const href = item.href(dealId);
    if (item.matchExact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const navList = (
    <ul className="flex w-full flex-col gap-1">
      {DEAL_NAV_ITEMS.map((item) => {
        const active = itemIsActive(item);
        return (
          <li key={item.label}>
            <Link
              href={item.href(dealId)}
              onClick={onCloseMobile}
              className={cn(
                'flex items-center rounded-[8px] px-4 py-[10px] transition-colors',
                'text-[15px] font-semibold leading-[20px] tracking-[-0.3px]',
                active
                  ? 'bg-foreground text-background'
                  : 'text-foreground hover:bg-grey-50',
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* ─── Desktop column (≥lg) — always visible, not collapsible ──────── */}
      <aside
        className="hidden w-[240px] shrink-0 border-r border-border bg-white px-4 py-4 lg:block"
        aria-label="Deal navigation"
      >
        {navList}
      </aside>

      {/* ─── Mobile overlay drawer (<lg) — icon rail + deal nav side-by-side
           per Figma "Mobile Sidebar [Active]" deal-context frame.
           Always mounted; slides in/out for a smooth open/close animation. ─ */}
      <div
        aria-hidden
        onClick={onCloseMobile}
        className={cn(
          'fixed inset-x-0 bottom-0 top-[96px] z-40 bg-black/40 transition-opacity duration-300 ease-in-out lg:hidden',
          mobileOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        aria-label="Deal navigation"
        aria-hidden={!mobileOpen}
        className={cn(
          'fixed left-0 top-[96px] z-50 flex h-[calc(100%-96px)] w-[340px] bg-white shadow-xl lg:hidden',
          'transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Left column: main nav as icon rail */}
        <div className="flex w-[72px] shrink-0 flex-col items-center border-r border-border px-3 py-4">
          <SidebarIconRail pathname={pathname} onItemClick={onCloseMobile} />
        </div>

        {/* Right column: deal-scoped nav */}
        <div className="flex min-w-0 flex-1 flex-col px-4 py-4">
          {navList}
        </div>
      </aside>
    </>
  );
}
