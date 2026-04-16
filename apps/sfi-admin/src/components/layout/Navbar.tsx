'use client';

import { Bell, PanelLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/layout/Logo';
import { UserMenu } from '@/components/layout/UserMenu';
import { cn } from '@/lib/utils';

type NavbarProps = Readonly<{
  onToggleSidebar?: () => void;
  className?: string;
}>;

/**
 * Top navbar — 96px tall, flanked by the sidebar-toggle + logo block on the
 * left and the notifications + user menu on the right. Matches Figma node
 * I385:11465 of the Dashboard screen.
 */
export function Navbar({ onToggleSidebar, className }: NavbarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-[96px] items-center justify-between border-b border-border bg-white px-4 lg:px-6',
        className,
      )}
    >
      {/* Left — collapse button + vertical separator + logo */}
      <div className="flex items-center gap-[11px]">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
          className="size-6 rounded-none hover:bg-transparent"
        >
          <PanelLeft className="size-6 text-foreground" strokeWidth={2} />
        </Button>
        <div className="h-12 w-px bg-border" aria-hidden />
        {/* Mobile: icon only — Figma Mobile frame hides the wordmark.
            Desktop ≥sm: full "FEA-SFI Admin" wordmark. */}
        <Logo size="md" iconOnly className="inline-flex sm:hidden" />
        <Logo size="md" className="hidden sm:inline-flex" />
      </div>

      {/* Right — bell in bordered circle + avatar + dropdown */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          aria-label="Notifications"
          className="size-[48px] rounded-full border border-foreground bg-white p-3"
        >
          <Bell className="size-6 text-foreground" strokeWidth={2} />
        </Button>
        <UserMenu />
      </div>
    </header>
  );
}
