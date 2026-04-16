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
  /** `true` promotes the card to the solid-black "featured" treatment per Figma. */
  featured?: boolean;
}>;

/**
 * 4-card stat row shown below the deal header. Matches Figma `385:10602`:
 *   Participants (featured — black fill, white text) · Rule Snapshots · Total
 *   Revenue · Settlement Runs. Each card links to the relevant deal-scoped
 *   page and carries an up-right arrow top-right.
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
      featured: true,
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
              'group flex min-h-[128px] flex-col justify-between gap-3 rounded-[8px] border p-5 transition-colors sm:min-h-[140px] sm:p-6',
              card.featured
                ? 'border-foreground bg-foreground text-background hover:bg-foreground/90'
                : 'border-border bg-white text-foreground hover:border-foreground/40',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  'text-[14px] font-medium',
                  card.featured ? 'text-background/80' : 'text-neutral',
                )}
              >
                {card.label}
              </span>
              <Icon
                aria-hidden
                className={cn(
                  'size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
                  card.featured ? 'text-background' : 'text-neutral',
                )}
                strokeWidth={2}
              />
            </div>
            <span
              className={cn(
                'text-[32px] font-semibold leading-[36px] tracking-[-0.64px] sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]',
              )}
            >
              {card.value}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
