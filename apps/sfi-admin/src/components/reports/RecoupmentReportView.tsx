'use client';

import { TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';

import { BackLink } from '@/components/common/BackLink';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useRecoupmentReport } from '@/hooks/reports/useRecoupmentReport';
import { cn } from '@/lib/utils';
import {
  RecoupmentStatus,
  type InvestorRecoupment,
  type RecoupmentReport,
} from '@/types/reports.types';
import { formatDate } from '@/utils/date';
import { formatCurrency, formatNumber } from '@/utils/format';

type RecoupmentReportViewProps = Readonly<{
  dealId: string;
}>;

const STATUS_LABEL: Record<RecoupmentStatus, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  RECOUPED: 'Fully recouped',
  NO_CAP: 'No cap',
};

const STATUS_TONE: Record<
  RecoupmentStatus,
  'success' | 'warning' | 'neutral'
> = {
  NOT_STARTED: 'neutral',
  IN_PROGRESS: 'warning',
  RECOUPED: 'success',
  NO_CAP: 'neutral',
};

/** Fill color follows the same three-state rule as the status badge. */
const BAR_FILL: Record<RecoupmentStatus, string> = {
  NOT_STARTED: 'bg-grey-200',
  IN_PROGRESS: 'bg-warning',
  RECOUPED: 'bg-success',
  NO_CAP: 'bg-grey-200',
};

const HISTORY_COLS =
  'grid grid-cols-[minmax(90px,0.7fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(110px,0.9fr)]';

/**
 * MS-5 Screen 5.3: Recoupment Report.
 *
 * One card per investor with a progress bar as the centrepiece, plus the
 * per-settlement history behind it. Caps and totals come straight from the
 * reporting endpoint, which mirrors the engine's own cap arithmetic, so
 * these bars agree with what settlements actually paid.
 */
export function RecoupmentReportView({ dealId }: RecoupmentReportViewProps) {
  const { data, isLoading, isError, refetch } = useRecoupmentReport(dealId);

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink href={ROUTES.DEALS.REPORTS(dealId)} label="Reports" />
        <div className="flex flex-col items-center gap-3 rounded-[8px] border border-border bg-white py-16 text-center">
          <p className="text-[14px] text-danger">
            Failed to load the recoupment report.
          </p>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const investors = data?.investors ?? [];
  const noInvestors = !isLoading && investors.length === 0;
  const noSettlements =
    !isLoading &&
    investors.length > 0 &&
    investors.every((i) => i.history.length === 0);

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={ROUTES.DEALS.REPORTS(dealId)} label="Reports" />

      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
          Recoupment Report
        </h1>
        {data?.ruleSnapshotVersion != null && (
          <p className="text-[14px] leading-[20px] text-neutral">
            Caps read from the active rule snapshot v{data.ruleSnapshotVersion}.
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-[110px] w-full rounded-[8px]" />
          <Skeleton className="h-[220px] w-full rounded-[8px]" />
          <Skeleton className="h-[220px] w-full rounded-[8px]" />
        </div>
      ) : noInvestors ? (
        <EmptyState
          icon={TrendingUp}
          title="No investors with recoupment caps in this deal"
          description="Add pool investors under Participants, then set a recoup or hard cap multiplier in the rule snapshot to track recovery here."
          action={{
            label: 'Go to Participants',
            href: ROUTES.DEALS.PARTICIPANTS(dealId),
          }}
          className="border-dashed"
        />
      ) : (
        <>
          {data && <SummaryCards report={data} />}

          {noSettlements && (
            <p className="rounded-[8px] border border-dashed border-border px-4 py-4 text-[14px] leading-[20px] text-neutral">
              Recoupment data will appear after settlements are finalized. The
              caps below are what each investor will recoup against.
            </p>
          )}

          <div className="flex flex-col gap-4">
            {investors.map((inv) => (
              <InvestorCard
                key={inv.participantId}
                investor={inv}
                dealId={dealId}
                currency={data?.currency}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCards({ report }: Readonly<{ report: RecoupmentReport }>) {
  const { summary, currency, investors } = report;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard
        label="Total Invested"
        value={formatCurrency(summary.totalInvested, currency)}
      />
      <StatCard
        label="Total Recouped"
        value={formatCurrency(summary.totalRecouped, currency)}
      />
      <StatCard
        label="Remaining"
        value={formatCurrency(summary.totalRemaining, currency)}
      />
      <StatCard
        label="Fully Recouped"
        value={`${formatNumber(summary.fullyRecoupedCount)} of ${formatNumber(investors.length)}`}
      />
    </div>
  );
}

function InvestorCard({
  investor,
  dealId,
  currency,
}: Readonly<{
  investor: InvestorRecoupment;
  dealId: string;
  currency: string | undefined;
}>) {
  const hasCap = investor.capAmount != null;

  return (
    <section className="flex flex-col gap-4 rounded-[8px] border border-border bg-white p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-[18px] font-bold leading-[24px] text-foreground">
            {investor.participantName}
          </h2>
          <p className="text-[13px] leading-[18px] text-neutral">
            {investor.roleName}
            {investor.capMultiplier != null &&
              ` | Cap ${formatNumber(investor.capMultiplier * 100)}% of capital`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge size="sm" variant={STATUS_TONE[investor.status]}>
            {STATUS_LABEL[investor.status]}
          </Badge>
          <Button asChild variant="outline" size="sm">
            <a href={ROUTES.DEALS.REPORTS_STATEMENT(dealId, investor.participantId)}>
              Statement
            </a>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat
          label="Invested"
          value={formatCurrency(investor.investmentAmount, currency)}
        />
        <MiniStat
          label="Cap"
          value={hasCap ? formatCurrency(investor.capAmount, currency) : 'No cap'}
        />
        <MiniStat
          label="Recouped"
          value={formatCurrency(investor.totalRecouped, currency)}
        />
        <MiniStat
          label="Remaining"
          value={hasCap ? formatCurrency(investor.remaining, currency) : '-'}
        />
      </div>

      {/* Progress bar: the visual centrepiece of this screen. */}
      {hasCap && (
        <div className="flex flex-col gap-1.5">
          <div
            className="h-3 w-full overflow-hidden rounded-full bg-grey-100"
            role="progressbar"
            aria-valuenow={Math.round(investor.progressPercentage)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${investor.participantName} recoupment progress`}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all',
                BAR_FILL[investor.status],
              )}
              style={{ width: `${Math.min(100, investor.progressPercentage)}%` }}
            />
          </div>
          <p className="text-[12px] leading-[16px] text-neutral">
            {formatNumber(investor.progressPercentage)}% recouped
            {investor.remaining > 0 &&
              ` | ${formatCurrency(investor.remaining, currency)} outstanding`}
          </p>
        </div>
      )}

      {/* History */}
      {investor.history.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[14px] font-semibold leading-[20px] text-foreground">
            Recoupment History
          </h3>
          <div className="overflow-x-auto">
            <div className="min-w-[620px]">
              <div className={cn(HISTORY_COLS, 'border-b border-grey-200 bg-grey-50')}>
                <HeaderCell>Run</HeaderCell>
                <HeaderCell align="right">Recouped</HeaderCell>
                <HeaderCell align="right">Cumulative</HeaderCell>
                <HeaderCell align="right">Carry-Forward</HeaderCell>
                <HeaderCell>Finalized</HeaderCell>
              </div>
              {investor.history.map((h, idx) => (
                <div
                  key={h.settlementRunId}
                  className={cn(
                    HISTORY_COLS,
                    idx === investor.history.length - 1
                      ? ''
                      : 'border-b border-grey-100',
                  )}
                >
                  <BodyCell>
                    <a
                      href={ROUTES.SETTLEMENT.RUN_DETAIL(h.settlementRunId)}
                      className="border-b border-foreground/40 font-medium text-foreground hover:border-foreground"
                    >
                      {h.runLabel}
                    </a>
                  </BodyCell>
                  <BodyCell align="right">
                    {formatCurrency(h.amount, currency)}
                  </BodyCell>
                  <BodyCell align="right">
                    {formatCurrency(h.cumulative, currency)}
                  </BodyCell>
                  <BodyCell align="right">
                    <span
                      className={cn(h.carryForward === 0 && 'text-success')}
                      title="Capital still outstanding after this settlement, carried into the next one"
                    >
                      {formatCurrency(h.carryForward, currency)}
                    </span>
                  </BodyCell>
                  <BodyCell>
                    <span className="text-neutral">{formatDate(h.finalizedAt)}</span>
                  </BodyCell>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ─── Primitives ────────────────────────────────────────────────────────── */

function StatCard({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex min-h-[100px] flex-col justify-between gap-2 rounded-[8px] border border-border bg-white p-4">
      <span className="text-[13px] font-medium leading-[18px] text-neutral">
        {label}
      </span>
      <span className="text-[24px] font-semibold leading-[28px] tracking-[-0.48px] text-foreground">
        {value}
      </span>
    </div>
  );
}

function MiniStat({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[12px] leading-[16px] text-neutral">{label}</span>
      <span className="text-[15px] font-semibold leading-[22px] text-foreground">
        {value}
      </span>
    </div>
  );
}

function HeaderCell({
  children,
  align = 'left',
}: Readonly<{ children: ReactNode; align?: 'left' | 'right' }>) {
  return (
    <div
      className={cn(
        'flex items-center px-[10px] py-[10px]',
        align === 'right' && 'justify-end',
      )}
    >
      <span className="text-[13px] font-bold leading-[18px] text-foreground">
        {children}
      </span>
    </div>
  );
}

function BodyCell({
  children,
  align = 'left',
}: Readonly<{ children: ReactNode; align?: 'left' | 'right' }>) {
  return (
    <div
      className={cn(
        'flex h-[44px] items-center px-[10px] py-[10px] text-[13px] text-foreground',
        align === 'right' && 'justify-end',
      )}
    >
      {children}
    </div>
  );
}
