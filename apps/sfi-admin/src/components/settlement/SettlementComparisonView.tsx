'use client';

import { ArrowRight } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';

import { BackLink } from '@/components/common/BackLink';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import {
  SETTLEMENT_RUN_STATUS_LABEL,
  SETTLEMENT_RUN_STATUS_TONE,
  SETTLEMENT_RUN_TYPE_LABEL,
} from '@/constants/ui';
import { useSettlementRun } from '@/hooks/settlement/useSettlementRun';
import { cn } from '@/lib/utils';
import {
  SettlementPhase,
  type SettlementAllocation,
  type SettlementRunDetail,
} from '@/types/settlement.types';
import { formatDate } from '@/utils/date';
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedCurrencyCompact,
  formatSignedPercent,
} from '@/utils/format';
import { settlementRunTitle } from '@/utils/settlement';

type SettlementComparisonViewProps = Readonly<{
  /** The CORRECTION run id; the original is resolved from its reference. */
  runId: string;
}>;

/**
 * MS-4 Screen 4.8: Settlement Comparison (correction vs original).
 *
 * Liang's review drove three choices here (07/13):
 *   - Every correction amount is explicitly signed (+/-) and colored, so
 *     an over-reported correction (-$2M) reads as clearly as an
 *     under-reported one (+$5M).
 *   - "Combined" is spelled out as Original + Correction, the effective
 *     total after the correction is applied.
 *   - "Delta" is the percentage change of the combined total vs the
 *     original, answering "what should the number mean".
 */
export function SettlementComparisonView({ runId }: SettlementComparisonViewProps) {
  const {
    data: correction,
    isLoading: correctionLoading,
    isError,
    refetch,
  } = useSettlementRun(runId);
  const { data: original, isLoading: originalLoading } = useSettlementRun(
    correction?.originalSettlementRunId,
  );

  const isLoading = correctionLoading || originalLoading;

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[8px] border border-border bg-white py-16 text-center">
        <p className="text-[14px] text-danger">Failed to load comparison.</p>
        <Button type="button" variant="outline" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  // Checked BEFORE the loading guard: a NORMAL run has no
  // originalSettlementRunId, so its original query never runs and
  // `original` would stay undefined forever. Guarding on it first would
  // trap the page in skeletons instead of showing this message.
  const notAComparison =
    !correctionLoading &&
    correction !== undefined &&
    correction.runType !== 'CORRECTION';

  return (
    <div className="flex flex-col gap-6">
      <BackLink
        href={ROUTES.SETTLEMENT.RUN_DETAIL(runId)}
        label={settlementRunTitle(correction)}
      />

      <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
        Settlement Comparison
      </h1>

      <section className="flex flex-col gap-6 rounded-[8px] border border-border bg-white p-4 sm:p-6">
        {renderComparisonBody()}
      </section>
    </div>
  );

  function renderComparisonBody(): ReactNode {
    // Order matters: the not-a-correction case must win over the loading
    // guard, because for such runs `original` never loads (see above).
    if (notAComparison) {
      return (
        <p className="py-4 text-[14px] text-neutral">
          This run is not a correction, so there is nothing to compare it
          against.
        </p>
      );
    }

    if (isLoading || !correction || !original) {
      return (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      );
    }

    const hasAllocations =
      correction.allocations !== undefined && correction.allocations.length > 0;

    return (
      <>
        <div className="flex flex-col gap-1">
          <h2 className="text-[18px] font-bold leading-[24px] text-foreground">
            Settlement Comparison
          </h2>
          <p className="text-[13px] leading-[18px] text-neutral">
            Original: {original.runLabel}
            {'  vs  '}
            Correction: {correction.runLabel}
          </p>
        </div>

        <SummaryTable original={original} correction={correction} />

        {hasAllocations ? (
          <>
            <ParticipantComparison original={original} correction={correction} />
            <PhaseDelta original={original} correction={correction} />
          </>
        ) : (
          <p className="rounded-[8px] border border-dashed border-border px-4 py-6 text-center text-[14px] text-neutral">
            Allocation-level comparison appears once the correction run has
            been previewed or finalized.
          </p>
        )}

        <CorrectionChain original={original} correction={correction} />
      </>
    );
  }
}

/* ─── Summary ───────────────────────────────────────────────────────────── */

function SummaryTable({
  original,
  correction,
}: Readonly<{ original: SettlementRunDetail; correction: SettlementRunDetail }>) {
  // totalRevenue is absent until the correction has been previewed; an
  // unknown must render "-", not an asserted "$0 change".
  const revenueDelta = correction.totalRevenue;
  return (
    <Card title="Summary">
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-[minmax(90px,0.8fr)_repeat(3,minmax(130px,1fr))] border-b border-grey-200 bg-grey-50">
            <MatrixHeader> </MatrixHeader>
            <MatrixHeader>Original</MatrixHeader>
            <MatrixHeader>Correction</MatrixHeader>
            <MatrixHeader>Delta</MatrixHeader>
          </div>
          <CompareRow label="Revenue">
            <MatrixCell>
              {formatCurrency(original.totalRevenue, original.currency)}
            </MatrixCell>
            <MatrixCell>
              {revenueDelta === undefined ? (
                <span className="text-neutral">-</span>
              ) : (
                <SignedAmount value={revenueDelta} currency={correction.currency} />
              )}
            </MatrixCell>
            <MatrixCell>
              {revenueDelta === undefined ? (
                <span className="text-neutral">-</span>
              ) : (
                <SignedAmount value={revenueDelta} currency={correction.currency} />
              )}
            </MatrixCell>
          </CompareRow>
          <CompareRow label="Status">
            <MatrixCell>
              <Badge size="sm" variant={SETTLEMENT_RUN_STATUS_TONE[original.status]}>
                {SETTLEMENT_RUN_STATUS_LABEL[original.status]}
              </Badge>
            </MatrixCell>
            <MatrixCell>
              <Badge size="sm" variant={SETTLEMENT_RUN_STATUS_TONE[correction.status]}>
                {SETTLEMENT_RUN_STATUS_LABEL[correction.status]}
              </Badge>
            </MatrixCell>
            <MatrixCell>
              <span className="text-neutral">-</span>
            </MatrixCell>
          </CompareRow>
          <CompareRow label="Rule">
            <MatrixCell>
              {original.ruleSnapshotVersion !== undefined
                ? `v${original.ruleSnapshotVersion}`
                : '-'}
            </MatrixCell>
            <MatrixCell>
              {correction.ruleSnapshotVersion !== undefined
                ? `v${correction.ruleSnapshotVersion}`
                : '-'}
            </MatrixCell>
            <MatrixCell>
              <span className="text-neutral">-</span>
            </MatrixCell>
          </CompareRow>
          <CompareRow label="Date" isLast>
            <MatrixCell>{formatDate(original.createdAt)}</MatrixCell>
            <MatrixCell>{formatDate(correction.createdAt)}</MatrixCell>
            <MatrixCell>
              <span className="text-neutral">-</span>
            </MatrixCell>
          </CompareRow>
        </div>
      </div>
      <p className="text-[12px] leading-[16px] text-neutral">
        Delta is the correction&apos;s impact on top of the original: positive
        for under-reported revenue being added, negative for over-reported
        revenue being reversed.
      </p>
    </Card>
  );
}

/* ─── Per-participant ───────────────────────────────────────────────────── */

type ParticipantTotals = {
  id: string;
  name: string;
  original: number;
  correction: number;
};

function totalsByParticipant(
  allocations: ReadonlyArray<SettlementAllocation> | undefined,
): Map<string, { name: string; total: number }> {
  const map = new Map<string, { name: string; total: number }>();
  for (const a of allocations ?? []) {
    const row = map.get(a.participantId) ?? { name: a.participantName, total: 0 };
    row.total += a.amount;
    map.set(a.participantId, row);
  }
  return map;
}

function ParticipantComparison({
  original,
  correction,
}: Readonly<{ original: SettlementRunDetail; correction: SettlementRunDetail }>) {
  const { rows, totals } = useMemo(() => {
    const orig = totalsByParticipant(original.allocations);
    const corr = totalsByParticipant(correction.allocations);
    const ids = new Set([...orig.keys(), ...corr.keys()]);
    const computedRows: ParticipantTotals[] = [...ids].map((id) => ({
      id,
      name: orig.get(id)?.name ?? corr.get(id)?.name ?? 'Unknown',
      original: orig.get(id)?.total ?? 0,
      correction: corr.get(id)?.total ?? 0,
    }));
    const computedTotals = computedRows.reduce(
      (acc, r) => ({
        original: acc.original + r.original,
        correction: acc.correction + r.correction,
      }),
      { original: 0, correction: 0 },
    );
    return { rows: computedRows, totals: computedTotals };
  }, [original.allocations, correction.allocations]);

  const currency = correction.currency;
  const pct = (orig: number, corr: number) =>
    orig > 0 ? (corr / orig) * 100 : null;

  return (
    <Card title="Per-Participant Comparison">
      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-[minmax(150px,1.3fr)_repeat(4,minmax(110px,1fr))] border-b border-grey-200 bg-grey-50">
            <MatrixHeader>Participant</MatrixHeader>
            <MatrixHeader>Original</MatrixHeader>
            <MatrixHeader>Correction</MatrixHeader>
            <MatrixHeader>Combined</MatrixHeader>
            <MatrixHeader>Delta</MatrixHeader>
          </div>
          {rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[minmax(150px,1.3fr)_repeat(4,minmax(110px,1fr))] border-b border-grey-100"
            >
              <MatrixCell>
                <span className="truncate font-medium">{r.name}</span>
              </MatrixCell>
              <MatrixCell>{formatCurrency(r.original, currency)}</MatrixCell>
              <MatrixCell>
                <SignedAmount value={r.correction} currency={currency} />
              </MatrixCell>
              <MatrixCell>
                {formatCurrency(r.original + r.correction, currency)}
              </MatrixCell>
              <MatrixCell>
                <SignedPercent value={pct(r.original, r.correction)} />
              </MatrixCell>
            </div>
          ))}
          <div className="grid grid-cols-[minmax(150px,1.3fr)_repeat(4,minmax(110px,1fr))]">
            <MatrixCell>
              <span className="font-bold">Total</span>
            </MatrixCell>
            <MatrixCell>
              <span className="font-bold">
                {formatCurrency(totals.original, currency)}
              </span>
            </MatrixCell>
            <MatrixCell>
              <SignedAmount value={totals.correction} currency={currency} bold />
            </MatrixCell>
            <MatrixCell>
              <span className="font-bold">
                {formatCurrency(totals.original + totals.correction, currency)}
              </span>
            </MatrixCell>
            <MatrixCell>
              <SignedPercent
                value={pct(totals.original, totals.correction)}
                bold
              />
            </MatrixCell>
          </div>
        </div>
      </div>
      <p className="text-[12px] leading-[16px] text-neutral">
        Combined = Original + Correction (the effective payout after the
        correction). Delta = the correction as a percentage of the original.
      </p>
    </Card>
  );
}

/* ─── Phase-by-phase ────────────────────────────────────────────────────── */

const PHASE_LABEL: Record<SettlementPhase, string> = {
  GROSS_RECEIPTS: 'Gross Receipts',
  DISTRIBUTION_FEES: 'Distribution Fees',
  RECOUPMENT: 'Recoupment',
  NET_PROFITS: 'Net Profit Split',
};

function PhaseDelta({
  original,
  correction,
}: Readonly<{ original: SettlementRunDetail; correction: SettlementRunDetail }>) {
  const rows = useMemo(() => {
    const phaseTotal = (
      allocations: ReadonlyArray<SettlementAllocation> | undefined,
      phase: SettlementPhase,
    ) =>
      (allocations ?? [])
        .filter((a) => a.phase === phase)
        .reduce((acc, a) => acc + a.amount, 0);

    return (
      [
        SettlementPhase.DISTRIBUTION_FEES,
        SettlementPhase.RECOUPMENT,
        SettlementPhase.NET_PROFITS,
      ] as const
    )
      .map((phase) => ({
        phase,
        original: phaseTotal(original.allocations, phase),
        correction: phaseTotal(correction.allocations, phase),
      }))
      .filter((r) => r.original !== 0 || r.correction !== 0);
  }, [original.allocations, correction.allocations]);

  if (rows.length === 0) return null;

  return (
    <Card title="Phase-by-Phase Delta">
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-[minmax(150px,1.3fr)_repeat(3,minmax(120px,1fr))] border-b border-grey-200 bg-grey-50">
            <MatrixHeader>Phase</MatrixHeader>
            <MatrixHeader>Original</MatrixHeader>
            <MatrixHeader>Correction</MatrixHeader>
            <MatrixHeader>Delta</MatrixHeader>
          </div>
          {rows.map((r) => (
            <div
              key={r.phase}
              className="grid grid-cols-[minmax(150px,1.3fr)_repeat(3,minmax(120px,1fr))] border-b border-grey-100 last:border-b-0"
            >
              <MatrixCell>
                <span className="font-medium">{PHASE_LABEL[r.phase]}</span>
              </MatrixCell>
              <MatrixCell>
                {formatCurrency(r.original, original.currency)}
              </MatrixCell>
              <MatrixCell>
                <SignedAmount value={r.correction} currency={correction.currency} />
              </MatrixCell>
              <MatrixCell>
                <span
                  className={cn(
                    'font-medium',
                    r.correction > 0 && 'text-success',
                    r.correction < 0 && 'text-danger',
                  )}
                >
                  {formatSignedCurrencyCompact(r.correction, correction.currency)}
                </span>
              </MatrixCell>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ─── Correction chain ──────────────────────────────────────────────────── */

function CorrectionChain({
  original,
  correction,
}: Readonly<{ original: SettlementRunDetail; correction: SettlementRunDetail }>) {
  return (
    <Card title="Correction Chain">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <ChainCard run={original} signedAmount={false} />
        <ArrowRight className="mx-auto size-5 shrink-0 rotate-90 text-foreground sm:rotate-0" aria-hidden />
        <ChainCard run={correction} signedAmount />
      </div>
    </Card>
  );
}

function ChainCard({
  run,
  signedAmount,
}: Readonly<{ run: SettlementRunDetail; signedAmount: boolean }>) {
  // Correction totals carry an explicit sign: +$5M reads as under-reported
  // revenue being added, -$2M as over-reported revenue being reversed.
  const amount = signedAmount
    ? formatSignedCurrency(run.totalAllocated, run.currency)
    : formatCurrency(run.totalAllocated, run.currency);
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-[8px] border border-border p-4">
      <span className="w-fit rounded-full bg-foreground px-3 py-1 text-[11px] font-semibold text-background">
        {run.runLabel}
      </span>
      <ChainRow label="Type" value={SETTLEMENT_RUN_TYPE_LABEL[run.runType]} />
      <ChainRow label="Total Amount" value={amount} />
      <ChainRow
        label="Finalized"
        value={run.finalizedAt ? formatDate(run.finalizedAt) : '-'}
      />
    </div>
  );
}

function ChainRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="grid grid-cols-[110px_10px_1fr] gap-1 border-b border-grey-100 pb-1.5 last:border-b-0">
      <span className="text-[13px] font-medium text-foreground">{label}</span>
      <span className="text-[13px] text-neutral">:</span>
      <span className="text-[13px] text-foreground">{value}</span>
    </div>
  );
}

/* ─── Shared bits ───────────────────────────────────────────────────────── */

function SignedAmount({
  value,
  currency,
  bold = false,
}: Readonly<{ value: number; currency: string; bold?: boolean }>) {
  return (
    <span
      className={cn(
        bold ? 'font-bold' : 'font-medium',
        value > 0 && 'text-success',
        value < 0 && 'text-danger',
      )}
    >
      {formatSignedCurrency(value, currency)}
    </span>
  );
}

function SignedPercent({
  value,
  bold = false,
}: Readonly<{ value: number | null; bold?: boolean }>) {
  if (value === null) return <span className="text-neutral">-</span>;
  return (
    <span
      className={cn(
        bold ? 'font-bold' : 'font-medium',
        value > 0 && 'text-success',
        value < 0 && 'text-danger',
      )}
    >
      {formatSignedPercent(value)}
    </span>
  );
}

function Card({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <div className="flex flex-col gap-3 rounded-[8px] border border-border bg-white p-4">
      <div className="border-b border-border pb-2">
        <h3 className="text-[15px] font-semibold leading-[22px] text-foreground">
          {title}
        </h3>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function CompareRow({
  label,
  children,
  isLast = false,
}: Readonly<{ label: string; children: ReactNode; isLast?: boolean }>) {
  return (
    <div
      className={cn(
        'grid grid-cols-[minmax(90px,0.8fr)_repeat(3,minmax(130px,1fr))] items-center',
        isLast ? '' : 'border-b border-grey-100',
      )}
    >
      <MatrixCell>
        <span className="font-medium">{label}</span>
      </MatrixCell>
      {children}
    </div>
  );
}

function MatrixHeader({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex items-center px-[10px] py-[12px]">
      <span className="text-[13px] font-bold leading-[18px] text-foreground">
        {children}
      </span>
    </div>
  );
}

function MatrixCell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-[44px] items-center px-[10px] py-[10px] text-[14px] text-foreground">
      {children}
    </div>
  );
}
