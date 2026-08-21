'use client';

import { Download, FileDown, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, type ReactNode } from 'react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/BackLink';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { SETTLEMENT_RUN_TYPE_LABEL, SETTLEMENT_RUN_TYPE_TONE } from '@/constants/ui';
import { useParticipants } from '@/hooks/participants/useParticipants';
import { useParticipantStatement } from '@/hooks/reports/useParticipantStatement';
import { cn } from '@/lib/utils';
import {
  ReportCategory,
  type ParticipantStatement,
} from '@/types/reports.types';
import { formatDate } from '@/utils/date';
import { formatCurrency, formatNumber } from '@/utils/format';
import { exportStatementCsv, exportStatementPdf } from '@/utils/statement-export';

type ParticipantStatementViewProps = Readonly<{
  dealId: string;
  participantId: string;
}>;

const CATEGORY_ORDER: ReadonlyArray<ReportCategory> = [
  ReportCategory.RECOUPMENT,
  ReportCategory.NET_PROFIT,
  ReportCategory.FEES,
];

const CATEGORY_LABEL: Record<ReportCategory, string> = {
  RECOUPMENT: 'Recoupment',
  NET_PROFIT: 'Net Profit',
  FEES: 'Fees',
};

const GRID_COLS =
  'grid grid-cols-[minmax(90px,0.7fr)_minmax(100px,0.7fr)_repeat(3,minmax(110px,0.9fr))_minmax(120px,1fr)_minmax(110px,0.9fr)]';

/**
 * MS-5 Screen 5.4: Participant Statement.
 *
 * Printable record of everything one participant was paid on a deal:
 * summary, per-settlement breakdown split by phase, and the proof hash
 * behind each payout. Exports to CSV and to a branded PDF, both generated
 * in the browser so statement data never round-trips through a server.
 *
 * The participant selector at the top swaps subject without going back,
 * which is how an admin actually works through a payout run.
 */
export function ParticipantStatementView({
  dealId,
  participantId,
}: ParticipantStatementViewProps) {
  const router = useRouter();
  const { data: statement, isLoading, isError, refetch } = useParticipantStatement(
    dealId,
    participantId,
  );
  const { data: participantsData } = useParticipants(dealId, { limit: 100 });

  const participants = useMemo(
    () => participantsData?.data ?? [],
    [participantsData],
  );

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink href={ROUTES.DEALS.REPORTS_STATEMENTS(dealId)} label="Statements" />
        <div className="flex flex-col items-center gap-3 rounded-[8px] border border-border bg-white py-16 text-center">
          <p className="text-[14px] text-danger">Failed to load this statement.</p>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  function handleCsv() {
    if (!statement) return;
    try {
      exportStatementCsv(statement);
    } catch {
      toast.error('Could not generate the CSV.');
    }
  }

  function handlePdf() {
    if (!statement) return;
    try {
      exportStatementPdf(statement);
    } catch {
      toast.error('Could not generate the PDF.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar is screen-only: a printed statement should not carry
          navigation or buttons. */}
      <div className="print:hidden">
        <BackLink href={ROUTES.DEALS.REPORTS_STATEMENTS(dealId)} label="Statements" />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
          Participant Statement
        </h1>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {participants.length > 1 && (
            <Select
              value={participantId}
              onValueChange={(next) => {
                router.push(ROUTES.DEALS.REPORTS_STATEMENT(dealId, next));
              }}
            >
              <SelectTrigger
                size="sm"
                className="min-w-[200px]"
                aria-label="Switch participant"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {participants.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleCsv}
            disabled={!statement}
          >
            <Download className="size-4" aria-hidden />
            Export CSV
          </Button>
          <Button type="button" onClick={handlePdf} disabled={!statement}>
            <FileDown className="size-4" aria-hidden />
            Export PDF
          </Button>
        </div>
      </div>

      <section className="flex flex-col gap-6 rounded-[8px] border border-border bg-white p-4 sm:p-6 print:border-0 print:p-0">
        {isLoading || !statement ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-24 w-full rounded-[8px]" />
            <Skeleton className="h-40 w-full rounded-[8px]" />
          </div>
        ) : (
          <StatementBody statement={statement} />
        )}
      </section>
    </div>
  );
}

function StatementBody({
  statement,
}: Readonly<{ statement: ParticipantStatement }>) {
  const { summary, currency } = statement;
  const hasSettlements = statement.settlements.length > 0;

  return (
    <>
      {/* Identity */}
      <div className="flex flex-col gap-1 border-b border-border pb-4">
        <h2 className="text-[22px] font-bold leading-[28px] tracking-[0.044px] text-foreground">
          {statement.participantName}
        </h2>
        <p className="text-[13px] leading-[18px] text-neutral">
          {statement.roleName}
          {' | '}
          {statement.dealName}
          {' | '}
          Generated {formatDate(statement.generatedAt)}
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Received"
          value={formatCurrency(summary.totalReceived, currency)}
        />
        <StatCard
          label="Recoupment"
          value={formatCurrency(summary.totalRecoupment, currency)}
        />
        <StatCard
          label="Net Profit"
          value={formatCurrency(summary.totalNetProfit, currency)}
        />
        <StatCard
          label="Settlements"
          value={formatNumber(summary.settlementCount)}
        />
      </div>

      {/* Breakdown */}
      {!hasSettlements ? (
        <p className="rounded-[8px] border border-dashed border-border px-4 py-8 text-center text-[14px] text-neutral">
          No finalized settlement has paid this participant yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <h3 className="text-[15px] font-semibold leading-[22px] text-foreground">
            Settlement Breakdown
          </h3>
          <div className="overflow-x-auto">
            <div className="min-w-[780px]">
              <div className={cn(GRID_COLS, 'border-b border-grey-200 bg-grey-50')}>
                <HeaderCell>Settlement</HeaderCell>
                <HeaderCell>Type</HeaderCell>
                {CATEGORY_ORDER.map((p) => (
                  <HeaderCell key={p} align="right">
                    {CATEGORY_LABEL[p]}
                  </HeaderCell>
                ))}
                <HeaderCell align="right">Total</HeaderCell>
                <HeaderCell>Finalized</HeaderCell>
              </div>

              {statement.settlements.map((s) => (
                <div
                  key={s.settlementRunId}
                  className="grid grid-cols-[minmax(90px,0.7fr)_minmax(100px,0.7fr)_repeat(3,minmax(110px,0.9fr))_minmax(120px,1fr)_minmax(110px,0.9fr)] border-b border-grey-100"
                >
                  <BodyCell>
                    <Link
                      href={ROUTES.SETTLEMENT.RUN_DETAIL(s.settlementRunId)}
                      className="border-b border-foreground/40 font-medium text-foreground hover:border-foreground"
                    >
                      {s.runLabel}
                    </Link>
                  </BodyCell>
                  <BodyCell>
                    <Badge size="sm" variant={SETTLEMENT_RUN_TYPE_TONE[s.runType]}>
                      {SETTLEMENT_RUN_TYPE_LABEL[s.runType]}
                    </Badge>
                  </BodyCell>
                  {CATEGORY_ORDER.map((p) => (
                    <BodyCell key={p} align="right">
                      {s.byPhase[p]
                        ? formatCurrency(s.byPhase[p], currency)
                        : '-'}
                    </BodyCell>
                  ))}
                  <BodyCell align="right">
                    <span className="font-medium">
                      {formatCurrency(s.total, currency)}
                    </span>
                  </BodyCell>
                  <BodyCell>
                    <span className="text-neutral">{formatDate(s.finalizedAt)}</span>
                  </BodyCell>
                </div>
              ))}

              {/* Totals */}
              <div className={cn(GRID_COLS, 'border-t-2 border-grey-200 bg-grey-50/60')}>
                <BodyCell>
                  <span className="font-bold">Total</span>
                </BodyCell>
                <BodyCell>{null}</BodyCell>
                <BodyCell align="right">
                  <span className="font-bold">
                    {formatCurrency(summary.totalRecoupment, currency)}
                  </span>
                </BodyCell>
                <BodyCell align="right">
                  <span className="font-bold">
                    {formatCurrency(summary.totalNetProfit, currency)}
                  </span>
                </BodyCell>
                <BodyCell align="right">
                  <span className="font-bold">
                    {formatCurrency(summary.totalFees, currency)}
                  </span>
                </BodyCell>
                <BodyCell align="right">
                  <span className="font-bold">
                    {formatCurrency(summary.totalReceived, currency)}
                  </span>
                </BodyCell>
                <BodyCell>{null}</BodyCell>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proof records */}
      {hasSettlements && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[15px] font-semibold leading-[22px] text-foreground">
            Proof Records
          </h3>
          <div className="flex flex-col rounded-[8px] border border-border">
            {statement.settlements.map((s, idx) => (
              <div
                key={s.settlementRunId}
                className={cn(
                  'flex flex-wrap items-center justify-between gap-2 px-4 py-3',
                  idx === statement.settlements.length - 1
                    ? ''
                    : 'border-b border-grey-100',
                )}
              >
                <span className="text-[13px] font-medium text-foreground">
                  {s.runLabel}
                </span>
                <span className="truncate font-mono text-[12px] text-neutral">
                  {s.proofHash ?? 'No proof record'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Statements index (participant picker) ─────────────────────────────── */

export function StatementsIndexView({ dealId }: Readonly<{ dealId: string }>) {
  const { data, isLoading } = useParticipants(dealId, { limit: 100 });
  const participants = data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={ROUTES.DEALS.REPORTS(dealId)} label="Reports" />

      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
          Participant Statements
        </h1>
        <p className="text-[14px] leading-[20px] text-neutral">
          Pick a participant to see everything they were paid on this deal.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-14 w-full rounded-[8px]" />
          <Skeleton className="h-14 w-full rounded-[8px]" />
          <Skeleton className="h-14 w-full rounded-[8px]" />
        </div>
      ) : participants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No participants on this deal"
          description="Add participants first; their statements appear here once settlements have been finalized."
          action={{
            label: 'Go to Participants',
            href: ROUTES.DEALS.PARTICIPANTS(dealId),
          }}
          className="border-dashed"
        />
      ) : (
        <div className="flex flex-col overflow-hidden rounded-[8px] border border-border bg-white">
          {participants.map((p, idx) => (
            <Link
              key={p.id}
              href={ROUTES.DEALS.REPORTS_STATEMENT(dealId, p.id)}
              className={cn(
                'flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-grey-50/60',
                idx === participants.length - 1 ? '' : 'border-b border-grey-100',
              )}
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[15px] font-medium text-foreground">
                  {p.name}
                </span>
                <span className="text-[13px] text-neutral">{p.roleName}</span>
              </span>
              <span className="shrink-0 text-[13px] text-neutral">
                View statement
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
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

function HeaderCell({
  children,
  align = 'left',
}: Readonly<{ children: ReactNode; align?: 'left' | 'right' }>) {
  return (
    <div
      className={cn(
        'flex items-center px-[10px] py-[12px]',
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
        'flex h-[48px] items-center px-[10px] py-[12px] text-[13px] text-foreground',
        align === 'right' && 'justify-end',
      )}
    >
      {children}
    </div>
  );
}
