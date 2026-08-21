'use client';

import {
  ArrowRight,
  BookOpenCheck,
  FileText,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

import { BackLink } from '@/components/common/BackLink';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useDealLedger } from '@/hooks/ledger/useDealLedger';
import { useParticipants } from '@/hooks/participants/useParticipants';
import { useRecoupmentReport } from '@/hooks/reports/useRecoupmentReport';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/utils/format';

type ReportsHubViewProps = Readonly<{
  dealId: string;
}>;

/**
 * MS-5 Reports hub.
 *
 * The deal sidebar has a single Reports tab but the milestone carries three
 * reports, so this page is the fork: one card per report, each showing a
 * live headline figure so the admin can tell at a glance whether it is
 * worth opening.
 */
export function ReportsHubView({ dealId }: ReportsHubViewProps) {
  const { data: ledger, isLoading: ledgerLoading } = useDealLedger(dealId, {
    limit: 1,
  });
  const { data: recoupment, isLoading: recoupmentLoading } =
    useRecoupmentReport(dealId);
  const { data: participants, isLoading: participantsLoading } = useParticipants(
    dealId,
    { limit: 1 },
  );

  const journalCount = ledger?.meta.total ?? 0;
  const balanced =
    ledger !== undefined &&
    Math.abs(ledger.summary.totalDebits - ledger.summary.totalCredits) < 0.01;

  const investorCount = recoupment?.investors.length ?? 0;
  const recoupedCount = recoupment?.summary.fullyRecoupedCount ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={ROUTES.DEALS.DETAIL(dealId)} label="Overview" />

      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
          Reports
        </h1>
        <p className="text-[14px] leading-[20px] text-neutral">
          Accounting and payout views derived from finalized settlements.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ReportCard
          icon={BookOpenCheck}
          title="Ledger Overview"
          description="Every double-entry journal created by a finalized settlement, with its debits, credits, and balance check."
          href={ROUTES.DEALS.REPORTS_LEDGER(dealId)}
          isLoading={ledgerLoading}
          stat={
            journalCount === 0
              ? 'No journals yet'
              : `${formatNumber(journalCount)} ${journalCount === 1 ? 'journal' : 'journals'}`
          }
          statTone={journalCount === 0 ? 'neutral' : balanced ? 'success' : 'danger'}
          {...(journalCount > 0
            ? { statNote: balanced ? 'Balanced' : 'Out of balance' }
            : {})}
        />

        <ReportCard
          icon={TrendingUp}
          title="Recoupment Report"
          description="How much of each investor's capital has been recovered, with per-settlement history and carry-forward."
          href={ROUTES.DEALS.REPORTS_RECOUPMENT(dealId)}
          isLoading={recoupmentLoading}
          stat={
            investorCount === 0
              ? 'No investors'
              : `${formatNumber(recoupedCount)} of ${formatNumber(investorCount)} recouped`
          }
          statTone={
            investorCount === 0
              ? 'neutral'
              : recoupedCount === investorCount
                ? 'success'
                : 'warning'
          }
        />

        <ReportCard
          icon={FileText}
          title="Participant Statements"
          description="A printable statement per participant: what they were paid, by settlement and by phase, with proof hashes."
          href={ROUTES.DEALS.REPORTS_STATEMENTS(dealId)}
          isLoading={participantsLoading}
          stat={
            (participants?.meta.total ?? 0) === 0
              ? 'No participants'
              : `${formatNumber(participants?.meta.total ?? 0)} participants`
          }
          statTone="neutral"
        />
      </div>
    </div>
  );
}

type StatTone = 'neutral' | 'success' | 'warning' | 'danger';

const TONE_CLASS: Record<StatTone, string> = {
  neutral: 'text-neutral',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

function ReportCard({
  icon: Icon,
  title,
  description,
  href,
  isLoading,
  stat,
  statNote,
  statTone,
}: Readonly<{
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  isLoading: boolean;
  stat: string;
  statNote?: string;
  statTone: StatTone;
}>) {
  return (
    <Link
      href={href}
      className="group flex min-h-[190px] flex-col justify-between gap-4 rounded-[8px] border border-border bg-white p-5 transition-colors hover:border-foreground/60"
    >
      <div className="flex flex-col gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-grey-50 text-neutral">
          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-[16px] font-semibold leading-[22px] text-foreground">
            {title}
          </h2>
          <p className="text-[13px] leading-[18px] text-neutral">{description}</p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-3">
        {isLoading ? (
          <Skeleton className="h-5 w-28" />
        ) : (
          <span className="flex flex-col">
            <span
              className={cn('text-[14px] font-medium', TONE_CLASS[statTone])}
            >
              {stat}
            </span>
            {statNote && (
              <span className={cn('text-[12px]', TONE_CLASS[statTone])}>
                {statNote}
              </span>
            )}
          </span>
        )}
        <ArrowRight
          className="size-4 shrink-0 text-neutral transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
          aria-hidden
        />
      </div>
    </Link>
  );
}
