'use client';

import { FileText } from 'lucide-react';
import Link from 'next/link';

import { BackLink } from '@/components/common/BackLink';
import { EmptyState } from '@/components/common/EmptyState';
import { DealHeader } from '@/components/deals/DealHeader';
import { DealStatCards } from '@/components/deals/DealStatCards';
import { LatestSettlementCard } from '@/components/deals/LatestSettlementCard';
import { NoSettlementsWorkflow } from '@/components/deals/NoSettlementsWorkflow';
import { QuickActionsCard } from '@/components/deals/QuickActionsCard';
import {
  RecentActivityCard,
  type RecentActivityEntry,
} from '@/components/deals/RecentActivityCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useDeal } from '@/hooks/deals/useDeal';

type DealOverviewViewProps = Readonly<{
  dealId: string;
}>;

/**
 * FEA-7: Deal Overview. Owns the page-level structure:
 *   [← Deals List]
 *   [Deal Overview title]              [Edit Deal]
 *   ┌─ big outer card ─────────────────────────────────────┐
 *   │  Deal name · subtitle           [status pill]        │
 *   │  [Suspended banner, conditional]                     │
 *   │  [4 stat cards]                                      │
 *   └──────────────────────────────────────────────────────┘
 *   [Latest Settlement card: real or empty-workflow]
 *   [Quick Actions card]
 *   [Recent Activity card]
 *
 * Matches Figma frames `385:10602` (Closed), `385:10677` (Suspended), and
 * the "Deal Detail [Empty]" / "Deal Detail Mobile" variants.
 */
export function DealOverviewView({ dealId }: DealOverviewViewProps) {
  const { data: deal, isLoading, isError } = useDeal(dealId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink href={ROUTES.DEALS.LIST} label="Deals List" />
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-[280px] rounded-[8px]" />
        <Skeleton className="h-[200px] rounded-[8px]" />
      </div>
    );
  }

  if (isError || !deal) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink href={ROUTES.DEALS.LIST} label="Deals List" />
        <EmptyState
          icon={FileText}
          title="We couldn't load this deal"
          description="The deal may have been deleted or you don't have access."
          action={{ label: 'Back to Deals', href: ROUTES.DEALS.LIST }}
        />
      </div>
    );
  }

  // Real latest-settlement + activity feed wire-up lands in Sprint 2.
  const entries: ReadonlyArray<RecentActivityEntry> = [];
  const latestSettlement = null;
  const isSuspended = deal.status === 'SUSPENDED';

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={ROUTES.DEALS.LIST} label="Deals List" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
          Deal Overview
        </h1>
        <Button asChild className="w-full sm:w-auto">
          <Link href={ROUTES.DEALS.EDIT(dealId)}>Edit Deal</Link>
        </Button>
      </div>

      {/* Big outer card: deal name + suspended banner + stat cards */}
      <section className="flex flex-col gap-5 rounded-[8px] border border-border bg-white p-4 sm:p-6">
        <DealHeader deal={deal} />

        {isSuspended && (
          <div
            role="alert"
            className="rounded-[8px] border border-dashed border-warning bg-warning/10 px-4 py-3 text-[14px] leading-[20px] text-warning"
          >
            {deal.notes ? (
              <>
                <span className="font-semibold">Suspended: </span>
                <span className="text-foreground">{deal.notes}</span>
              </>
            ) : (
              'Client is currently unresponsive.'
            )}
          </div>
        )}

        <DealStatCards deal={deal} />
      </section>

      {/* Latest Settlement: real panel or dashed empty-state workflow */}
      {latestSettlement ? (
        <LatestSettlementCard dealId={dealId} settlement={latestSettlement} />
      ) : (
        <section className="flex flex-col gap-4 rounded-[8px] border border-border bg-white p-4 sm:p-6">
          <h2 className="text-[18px] font-semibold leading-[24px] tracking-[-0.36px] text-foreground">
            Latest Settlement
          </h2>
          <NoSettlementsWorkflow dealId={dealId} />
        </section>
      )}

      <QuickActionsCard dealId={dealId} />
      <RecentActivityCard entries={entries} />
    </div>
  );
}
