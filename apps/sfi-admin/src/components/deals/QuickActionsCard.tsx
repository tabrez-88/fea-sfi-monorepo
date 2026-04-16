import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

type QuickActionsCardProps = Readonly<{
  dealId: string;
}>;

/**
 * Quick Actions panel — 4 solid-black primary buttons in a 2×2 grid on
 * desktop, stacked 1-per-row on mobile (matches Figma `385:10602` and
 * `385:10754`). Each button routes directly to the matching deal-scoped
 * creation flow (populated progressively as Sprint 2 delivers those pages).
 */
export function QuickActionsCard({ dealId }: QuickActionsCardProps) {
  const actions: ReadonlyArray<Readonly<{ label: string; href: string }>> = [
    { label: 'New Revenue Batch', href: ROUTES.DEALS.REVENUE(dealId) },
    { label: 'New Settlement Run', href: ROUTES.DEALS.SETTLEMENT(dealId) },
    { label: 'New Participant', href: ROUTES.DEALS.PARTICIPANTS(dealId) },
    { label: 'New Rule Snapshot', href: ROUTES.DEALS.RULES(dealId) },
  ];

  return (
    <section className="flex flex-col gap-4 rounded-[8px] border border-border bg-white p-4 sm:p-6">
      <h2 className="text-[18px] font-semibold leading-[24px] tracking-[-0.36px] text-foreground">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <Button key={action.label} asChild className="h-[44px] w-full">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ))}
      </div>
    </section>
  );
}
