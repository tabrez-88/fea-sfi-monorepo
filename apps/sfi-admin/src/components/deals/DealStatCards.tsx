'use client';

import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';
import type { Deal } from '@/types/deal.types';
import { formatCurrencyCompact, formatNumber } from '@/utils/format';

type DealStatCardsProps = Readonly<{
  deal: Deal;
}>;

type StatCardSpec = Readonly<{
  label: string;
  value: string;
  href: string;
  icon: LucideIcon;
}>;

/**
 * 4-card stat row shown below the deal header. Matches Figma `385:10602`:
 *   Participants · Rule Snapshots · Total Revenue · Settlement Runs. Each
 *   card links to the relevant deal-scoped page and carries an up-right
 *   arrow top-right.
 *
 * All cards default to the white "outlined" treatment and invert to the
 * solid-black fill only on hover/focus (per client request, black is the
 * hover affordance, not a featured-card marker).
 *
 * Reflow: 2×2 grid on mobile, 4 columns from ≥lg.
 */
export function DealStatCards({ deal }: DealStatCardsProps) {
  const participants = deal._count?.participants ?? deal.participantsCount ?? 0;
  const ruleSnapshots = deal._count?.ruleSnapshots ?? 0;
  const revenueBatches = deal._count?.revenueBatches ?? 0;
  const settlementRuns = deal._count?.settlementRuns ?? 0;
  const totalRevenue =
    typeof deal.totalRevenue === 'number' ? deal.totalRevenue : null;

  const cards: ReadonlyArray<StatCardSpec> = [
    {
      label: 'Participants',
      value: formatNumber(participants),
      href: ROUTES.DEALS.PARTICIPANTS(deal.id),
      icon: ArrowUpRight,
    },
    {
      label: 'Rule Snapshots',
      value: formatNumber(ruleSnapshots),
      href: ROUTES.DEALS.RULES(deal.id),
      icon: ArrowUpRight,
    },
    {
      label: 'Total Revenue',
      value:
        totalRevenue === null
          ? `${formatNumber(revenueBatches)} batches`
          : formatCurrencyCompact(totalRevenue),
      href: ROUTES.DEALS.REVENUE(deal.id),
      icon: ArrowUpRight,
    },
    {
      label: 'Settlement Runs',
      value: formatNumber(settlementRuns),
      href: ROUTES.DEALS.SETTLEMENT(deal.id),
      icon: ArrowUpRight,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.label}
            href={card.href}
            className={cn(
              'group flex min-h-[128px] flex-col justify-between gap-3 rounded-[8px] border border-border bg-white p-5 text-foreground transition-colors sm:min-h-[140px] sm:p-6',
              'hover:border-foreground hover:bg-foreground hover:text-background focus-visible:border-foreground focus-visible:bg-foreground focus-visible:text-background focus-visible:outline-none',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[14px] font-medium text-neutral transition-colors group-hover:text-background/80 group-focus-visible:text-background/80">
                {card.label}
              </span>
              <Icon
                aria-hidden
                className="size-4 shrink-0 text-neutral transition-[color,transform] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-background group-focus-visible:-translate-y-0.5 group-focus-visible:translate-x-0.5 group-focus-visible:text-background"
                strokeWidth={2}
              />
            </div>
            <span className="text-[32px] font-semibold leading-[36px] tracking-[-0.64px] sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
              {card.value}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
