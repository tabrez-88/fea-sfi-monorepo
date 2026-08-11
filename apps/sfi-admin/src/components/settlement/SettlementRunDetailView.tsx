'use client';

import {
  ArrowDown,
  Check,
  Copy,
  Download,
  FileSearch,
  Loader2,
  Play,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/BackLink';
import { FinalizeSettlementDialog } from '@/components/settlement/FinalizeSettlementDialog';
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
import { useSettlementRunActions } from '@/hooks/settlement/useSettlementRunActions';
import { getApiErrorMessage } from '@/lib/axios';
import { cn } from '@/lib/utils';
import {
  SettlementPhase,
  type ProofSummary,
  type ProofVerificationResult,
  type SettlementAllocation,
  type SettlementRunDetail,
} from '@/types/settlement.types';
import { formatDate } from '@/utils/date';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
  formatSignedCurrency,
} from '@/utils/format';
import { settlementRunTitle } from '@/utils/settlement';

type SettlementRunDetailViewProps = Readonly<{
  runId: string;
}>;

/**
 * MS-4 Screen 4.4 (and 4.7 for corrections): Settlement Run Detail.
 *
 * Composition per the Figma frame: header card (run label, type/rule/date,
 * status pill), Summary tiles, Revenue Batches Included, Waterfall
 * Breakdown grouped by engine phase, Total Payout Summary matrix, Proof
 * card with Verify Integrity, and status-gated Actions.
 *
 * All numbers come from the BE run/allocations, so the figure mismatches
 * Liang flagged on the mock sample data (Total Revenue $200M vs $125M of
 * batches) can't occur here: the tiles, batch rows, and payout matrix
 * share one source.
 *
 * Liang's on-chain question (07/13) is answered for now with Export Proof,
 * which downloads the proof record + allocations as JSON so she can anchor
 * or archive it externally. In-admin chain anchoring is a Phase 2 item.
 */
export function SettlementRunDetailView({ runId }: SettlementRunDetailViewProps) {
  const { data: run, isLoading, isError, refetch } = useSettlementRun(runId);
  const isCorrection = run?.runType === 'CORRECTION';
  // Correction runs pull the base run too: the Correction Info card names
  // it and the Proof card shows both hashes side by side (Liang 07/13
  // asked whether we need Base Run Hash + Correction Run Hash; we show
  // both so the chain of custody reads without leaving the page).
  const { data: originalRun } = useSettlementRun(
    isCorrection ? run?.originalSettlementRunId : null,
  );
  const actions = useSettlementRunActions(runId);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [verifyResult, setVerifyResult] = useState<ProofVerificationResult | null>(null);

  // The BE persists allocations + proof only on FINALIZE. Preview computes
  // them and returns them in the POST body without persisting (it only
  // flips status to PREVIEWED), so the refetched run detail stays empty
  // until finalize. The preview mutation's last response is therefore a
  // first-class data source here, not a throwaway.
  const previewData = actions.preview.data ?? null;
  const allocations = useMemo<ReadonlyArray<SettlementAllocation>>(() => {
    if (run?.allocations && run.allocations.length > 0) return run.allocations;
    return previewData?.allocations ?? [];
  }, [run?.allocations, previewData]);
  const proof = run?.proof ?? previewData?.proof ?? null;
  // Persisted totalAllocated stays 0 until finalize; prefer the preview's
  // computed total whenever the persisted run has no allocations yet.
  const totalAllocated =
    run?.allocations && run.allocations.length > 0
      ? run.totalAllocated
      : previewData?.totalAllocated ?? null;

  const participantCount = useMemo(
    () => new Set(allocations.map((a) => a.participantId)).size,
    [allocations],
  );

  async function handlePreview() {
    try {
      await actions.preview.mutateAsync();
      toast.success('Preview computed. Review the allocations, then finalize to lock.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Preview failed.'));
    }
  }

  async function handleFinalize() {
    try {
      await actions.finalize.mutateAsync();
      toast.success('Settlement finalized. Allocations are now locked.');
      setFinalizeOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Finalize failed.'));
    }
  }

  async function handleVerify() {
    setVerifyResult(null);
    try {
      const result = await actions.verify.mutateAsync();
      setVerifyResult(result);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Verification failed.'));
    }
  }

  function handleExportProof() {
    if (!run) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      run: {
        id: run.id,
        dealId: run.dealId,
        runLabel: run.runLabel,
        runType: run.runType,
        status: run.status,
        ruleSnapshotVersion: run.ruleSnapshotVersion ?? null,
        totalRevenue: run.totalRevenue ?? null,
        totalAllocated: totalAllocated ?? run.totalAllocated,
        currency: run.currency,
        finalizedAt: run.finalizedAt ?? null,
      },
      proof,
      revenueBatches: run.revenueBatches,
      allocations,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `settlement-run-${run.runNumber}-proof.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 rounded-[8px] border border-border bg-white py-16 text-center">
          <p className="text-[14px] text-danger">Failed to load settlement run.</p>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BackLink
        href={run ? ROUTES.DEALS.SETTLEMENT(run.dealId) : ROUTES.DEALS.LIST}
        label="Settlement Runs"
      />

      <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
        {settlementRunTitle(run)}
      </h1>

      <section className="flex flex-col gap-6 rounded-[8px] border border-border bg-white p-4 sm:p-6">
        {/* Header */}
        {isLoading || !run ? (
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-[22px] font-bold leading-[28px] tracking-[0.044px] text-foreground">
                {settlementRunTitle(run)}
              </h2>
              <p className="text-[13px] leading-[18px] text-neutral">
                Type: {SETTLEMENT_RUN_TYPE_LABEL[run.runType]}
                {' | '}Rule:{' '}
                {run.ruleSnapshotVersion !== undefined
                  ? `v${run.ruleSnapshotVersion}`
                  : '-'}
                {' | '}Created: {formatDate(run.createdAt)}
              </p>
            </div>
            <Badge
              size="sm"
              variant={SETTLEMENT_RUN_STATUS_TONE[run.status]}
              className="whitespace-nowrap"
            >
              {SETTLEMENT_RUN_STATUS_LABEL[run.status]}
            </Badge>
          </div>
        )}

        {/* Summary tiles */}
        <Card title="Summary">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Total Revenue"
              value={
                run?.totalRevenue !== undefined
                  ? formatCurrencyCompact(run.totalRevenue, run.currency)
                  : '-'
              }
              loading={isLoading}
            />
            <StatTile
              label="Total Allocated"
              value={
                totalAllocated !== null && run
                  ? formatCurrencyCompact(totalAllocated, run.currency)
                  : '-'
              }
              loading={isLoading}
            />
            <StatTile label="Currency" value={run?.currency ?? '-'} loading={isLoading} />
            <StatTile
              label="Revenue Batches"
              value={run ? String(run.revenueBatches.length) : '-'}
              loading={isLoading}
            />
          </div>
        </Card>

        {/* Correction info (Screen 4.7, correction runs only) */}
        {run && isCorrection && (
          <Card title="Correction Info">
            <div className="flex items-center justify-between gap-3 border-b border-grey-100 pb-2">
              <p className="text-[14px] leading-[20px] text-foreground">
                <span className="font-medium">Corrects</span>
                <span className="text-neutral"> : </span>
                {settlementRunTitle(originalRun)}
                <span className="text-neutral">
                  {' '}
                  (this run, {run.runLabel}, adjusts it; the original stays
                  unchanged in the audit trail)
                </span>
              </p>
              {run.originalSettlementRunId && (
                <Link
                  href={ROUTES.SETTLEMENT.RUN_DETAIL(run.originalSettlementRunId)}
                  className="shrink-0 text-[13px] font-medium text-foreground underline underline-offset-2 hover:text-foreground/80"
                >
                  View Original
                </Link>
              )}
            </div>
            <p className="text-[14px] leading-[20px] text-foreground">
              <span className="font-medium">Reason</span>
              <span className="text-neutral"> : </span>
              {run.notes ?? '-'}
            </p>
          </Card>
        )}

        {/* Revenue batches included */}
        <Card title="Revenue Batches Included">
          {isLoading || !run ? (
            <Skeleton className="h-16 w-full" />
          ) : run.revenueBatches.length === 0 ? (
            <p className="py-2 text-[14px] text-neutral">No batches linked.</p>
          ) : (
            <div className="flex flex-col">
              {run.revenueBatches.map((b, idx) => (
                <div
                  key={b.id}
                  className={cn(
                    'grid grid-cols-[minmax(120px,1fr)_minmax(120px,1fr)_minmax(130px,1fr)] items-center gap-3 py-3',
                    idx === run.revenueBatches.length - 1
                      ? ''
                      : 'border-b border-grey-100',
                  )}
                >
                  <span className="text-[14px] font-medium text-foreground">
                    {b.batchNumber}
                  </span>
                  <span className="text-[14px] text-foreground">
                    {formatCurrency(b.totalAmount, b.currency)}
                  </span>
                  <span className="text-[14px] text-neutral">
                    {formatDate(b.periodStart)} - {formatDate(b.periodEnd)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Previewed on a fresh load: allocations are recomputed on demand */}
        {run &&
          run.status === 'PREVIEWED' &&
          allocations.length === 0 &&
          !actions.preview.isPending && (
            <p className="rounded-[8px] border border-dashed border-border px-4 py-4 text-[14px] text-neutral">
              This run has been previewed, but preview results are recomputed
              on demand and are not stored until finalize. Run the preview
              again to see the allocation breakdown before finalizing.
            </p>
          )}

        {/* Waterfall breakdown (only when allocations exist) */}
        {run && allocations.length > 0 && (
          <WaterfallBreakdown run={run} allocations={allocations} />
        )}

        {/* Total payout summary */}
        {run && allocations.length > 0 && (
          <PayoutSummary allocations={allocations} currency={run.currency} />
        )}

        {/* Proof */}
        {run && proof && (
          <Card title="Proof">
            <dl className="flex flex-col gap-3">
              <ProofRow label={isCorrection ? 'Correction Run Hash' : 'Hash'}>
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-mono text-[13px] text-foreground">
                    {proof.proofHash}
                  </span>
                  <CopyButton value={proof.proofHash} />
                </span>
              </ProofRow>
              {isCorrection && originalRun?.proofHash && (
                <ProofRow label="Base Run Hash">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-mono text-[13px] text-neutral">
                      {originalRun.proofHash}
                    </span>
                    <CopyButton value={originalRun.proofHash} />
                    <span className="shrink-0 text-[12px] text-neutral">
                      ({originalRun.runLabel})
                    </span>
                  </span>
                </ProofRow>
              )}
              <ProofRow label="Algorithm">{proof.algorithm}</ProofRow>
              <ProofRow label="Timestamp">
                {new Date(proof.timestamp).toUTCString()}
              </ProofRow>
              <ProofRow label="Input">{formatInputSummary(run, proof)}</ProofRow>
            </dl>

            <p className="text-[12px] leading-[16px] text-neutral">
              Verify Integrity recomputes this settlement from its stored
              inputs and checks the result against the hash above. It runs
              entirely inside the platform: nothing is uploaded or published
              to a blockchain. Use Export Proof to take the record elsewhere.
            </p>

            {verifyResult && (
              <div
                className={cn(
                  'flex items-start gap-2 rounded-[8px] border px-4 py-3',
                  verifyResult.verified
                    ? 'border-success/40 bg-success/5'
                    : 'border-danger/40 bg-danger/5',
                )}
                role="status"
              >
                {verifyResult.verified ? (
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                ) : (
                  <ShieldX className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
                )}
                <div className="flex flex-col gap-0.5">
                  <p className="text-[13px] font-semibold leading-[18px] text-foreground">
                    {verifyResult.verified
                      ? 'Integrity verified'
                      : 'Hash mismatch detected'}
                  </p>
                  <p className="text-[12px] leading-[16px] text-neutral">
                    {verifyResult.message} (checked{' '}
                    {formatDate(verifyResult.verifiedAt)})
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleExportProof}
              >
                <Download className="size-4" aria-hidden />
                Export Proof (JSON)
              </Button>
              {/* Verify replays against the PERSISTED proof record, which
                  only exists after finalize (preview computes without
                  storing), so the button is gated to FINALIZED runs. */}
              {run.status === 'FINALIZED' && (
                <Button
                  type="button"
                  onClick={() => void handleVerify()}
                  disabled={actions.verify.isPending}
                >
                  {actions.verify.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <FileSearch className="size-4" aria-hidden />
                      Verify Integrity
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Actions */}
        {run && (
          <Card title="Actions">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row">
                {run.status === 'DRAFT' && (
                  <Button
                    type="button"
                    onClick={() => void handlePreview()}
                    disabled={actions.preview.isPending}
                  >
                    {actions.preview.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Computing...
                      </>
                    ) : (
                      <>
                        <Play className="size-4" aria-hidden />
                        Run Preview
                      </>
                    )}
                  </Button>
                )}
                {run.status === 'PREVIEWED' && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handlePreview()}
                      disabled={actions.preview.isPending}
                    >
                      {actions.preview.isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          Computing...
                        </>
                      ) : (
                        'Re-run Preview'
                      )}
                    </Button>
                    <Button type="button" onClick={() => setFinalizeOpen(true)}>
                      Finalize Settlement
                    </Button>
                  </>
                )}
                {run.status === 'FINALIZED' && !isCorrection && (
                  <Button asChild variant="outline">
                    <Link href={ROUTES.SETTLEMENT.RUN_CORRECT(run.id)}>
                      Create Correction Run
                    </Link>
                  </Button>
                )}
                {isCorrection && run.originalSettlementRunId && (
                  <Button asChild variant="outline">
                    <Link href={ROUTES.SETTLEMENT.RUN_COMPARE(run.id)}>
                      Compare With Original
                    </Link>
                  </Button>
                )}
              </div>
              {run.status === 'FINALIZED' && run.ledger && (
                <p
                  className="text-[13px] leading-[18px] text-neutral"
                  title="Ledger browsing ships with MS-5 Reports"
                >
                  Ledger: {formatNumber(run.ledger.postingCount)} postings recorded
                </p>
              )}
            </div>
          </Card>
        )}
      </section>

      {run && (
        <FinalizeSettlementDialog
          open={finalizeOpen}
          onOpenChange={setFinalizeOpen}
          totalAllocated={
            totalAllocated !== null
              ? formatCurrency(totalAllocated, run.currency)
              : '-'
          }
          participantCount={participantCount}
          isPending={actions.finalize.isPending}
          onConfirm={() => void handleFinalize()}
        />
      )}
    </div>
  );
}

/* ─── Waterfall breakdown ───────────────────────────────────────────────── */

const PHASE_META: ReadonlyArray<{
  phase: SettlementPhase;
  order: number;
  title: string;
}> = [
  { phase: SettlementPhase.GROSS_RECEIPTS, order: 1, title: 'Gross Receipts' },
  { phase: SettlementPhase.DISTRIBUTION_FEES, order: 2, title: 'Distribution Fees' },
  { phase: SettlementPhase.RECOUPMENT, order: 3, title: 'Recoupment' },
  { phase: SettlementPhase.NET_PROFITS, order: 4, title: 'Net Profit Split' },
];

function WaterfallBreakdown({
  run,
  allocations,
}: Readonly<{
  run: SettlementRunDetail;
  allocations: ReadonlyArray<SettlementAllocation>;
}>) {
  const byPhase = useMemo(() => {
    const map = new Map<SettlementPhase, SettlementAllocation[]>();
    for (const a of allocations) {
      const list = map.get(a.phase) ?? [];
      list.push(a);
      map.set(a.phase, list);
    }
    return map;
  }, [allocations]);

  const totalRevenue = run.totalRevenue ?? 0;
  const feesTotal = sum(byPhase.get(SettlementPhase.DISTRIBUTION_FEES));
  const recoupTotal = sum(byPhase.get(SettlementPhase.RECOUPMENT));
  const netTotal = sum(byPhase.get(SettlementPhase.NET_PROFITS));
  const remainingAfterFees = totalRevenue - feesTotal;
  const remainingAfterRecoup = remainingAfterFees - recoupTotal;
  const remaining = remainingAfterRecoup - netTotal;

  // Phases render in engine order; a phase with no allocations AND no
  // meaningful total is skipped (e.g. no Recoupment in a pure revenue
  // share deal). Gross Receipts always renders as the entry point.
  const visiblePhases = PHASE_META.filter(({ phase }) => {
    if (phase === SettlementPhase.GROSS_RECEIPTS) return true;
    return (byPhase.get(phase) ?? []).length > 0;
  });

  return (
    <Card title="Waterfall Breakdown">
      <div className="flex flex-col gap-2">
        {visiblePhases.map(({ phase, order, title }, idx) => (
          <div key={phase} className="flex flex-col gap-2">
            <div className="flex flex-col gap-3 rounded-[8px] border border-border p-4">
              <div className="flex items-center gap-2 border-b border-grey-100 pb-2">
                <span className="rounded-full bg-foreground px-3 py-1 text-[11px] font-semibold text-background">
                  Phase {order}
                </span>
                <span className="text-[14px] font-semibold text-foreground">
                  {title}
                </span>
              </div>

              {phase === SettlementPhase.GROSS_RECEIPTS ? (
                <BreakdownRow
                  label="Total Gross Revenue"
                  value={formatCurrency(totalRevenue, run.currency)}
                  bold
                />
              ) : (
                <>
                  {(byPhase.get(phase) ?? []).map((a) => (
                    <BreakdownRow
                      key={a.id}
                      label={a.participantName}
                      pct={extractPercentage(a)}
                      value={formatCurrency(a.amount, a.currency)}
                    />
                  ))}
                  {phase === SettlementPhase.DISTRIBUTION_FEES && (
                    <BreakdownRow
                      label="Remaining after fees"
                      value={formatCurrency(remainingAfterFees, run.currency)}
                      bold
                      topBorder
                    />
                  )}
                  {phase === SettlementPhase.RECOUPMENT && (
                    <>
                      <BreakdownRow
                        label="Total Recouped"
                        value={formatCurrency(recoupTotal, run.currency)}
                        bold
                        topBorder
                      />
                      <BreakdownRow
                        label="Remaining after recoupment"
                        value={formatCurrency(remainingAfterRecoup, run.currency)}
                        bold
                      />
                    </>
                  )}
                  {phase === SettlementPhase.NET_PROFITS && (
                    <>
                      <BreakdownRow
                        label="Total Net Profit"
                        value={formatCurrency(netTotal, run.currency)}
                        bold
                        topBorder
                      />
                      <BreakdownRow
                        label="Remaining"
                        value={formatCurrency(remaining, run.currency)}
                        bold
                      />
                    </>
                  )}
                </>
              )}
            </div>
            {idx < visiblePhases.length - 1 && (
              <div className="flex justify-center">
                <ArrowDown className="size-4 text-neutral" aria-hidden />
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function BreakdownRow({
  label,
  pct,
  value,
  bold = false,
  topBorder = false,
}: Readonly<{
  label: string;
  pct?: string | null;
  value: string;
  bold?: boolean;
  topBorder?: boolean;
}>) {
  return (
    <div
      className={cn(
        'grid grid-cols-[minmax(140px,2fr)_minmax(60px,0.6fr)_minmax(120px,1fr)] items-center gap-3 py-1.5',
        topBorder && 'border-t border-grey-100 pt-3',
      )}
    >
      <span
        className={cn(
          'truncate text-[14px] leading-[20px]',
          bold ? 'font-semibold text-foreground' : 'text-foreground',
        )}
        title={label}
      >
        {label}
      </span>
      <span className="text-[13px] text-neutral">{pct ?? ''}</span>
      <span
        className={cn(
          'text-right text-[14px] leading-[20px]',
          bold ? 'font-semibold text-foreground' : 'text-foreground',
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* ─── Total payout summary ──────────────────────────────────────────────── */

function PayoutSummary({
  allocations,
  currency,
}: Readonly<{
  allocations: ReadonlyArray<SettlementAllocation>;
  currency: SettlementRunDetail['currency'];
}>) {
  const { rows, totals, grandTotal } = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; fee: number; recoup: number; profit: number }
    >();
    for (const a of allocations) {
      const row =
        map.get(a.participantId) ??
        { id: a.participantId, name: a.participantName, fee: 0, recoup: 0, profit: 0 };
      if (a.phase === SettlementPhase.DISTRIBUTION_FEES) row.fee += a.amount;
      else if (a.phase === SettlementPhase.RECOUPMENT) row.recoup += a.amount;
      else if (a.phase === SettlementPhase.NET_PROFITS) row.profit += a.amount;
      map.set(a.participantId, row);
    }
    const computedRows = [...map.values()];
    const computedTotals = computedRows.reduce(
      (acc, r) => ({
        fee: acc.fee + r.fee,
        recoup: acc.recoup + r.recoup,
        profit: acc.profit + r.profit,
      }),
      { fee: 0, recoup: 0, profit: 0 },
    );
    return {
      rows: computedRows,
      totals: computedTotals,
      grandTotal:
        computedTotals.fee + computedTotals.recoup + computedTotals.profit,
    };
  }, [allocations]);

  // Zero means "no allocation in this phase" and renders as a dash;
  // negative correction amounts stay visible, signed and red, so the
  // matrix cells always sum to their own totals (Liang MS-4 +/- rule).
  const cell = (n: number) => {
    if (n === 0) return <span className="text-neutral">-</span>;
    if (n < 0) {
      return (
        <span className="font-medium text-danger">
          {formatSignedCurrency(n, currency)}
        </span>
      );
    }
    return <>{formatCurrency(n, currency)}</>;
  };

  return (
    <Card title="Total Payout Summary">
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[minmax(150px,1.4fr)_repeat(4,minmax(110px,1fr))] border-b border-grey-200 bg-grey-50">
            <MatrixHeader>Participants</MatrixHeader>
            <MatrixHeader>Dist Fee</MatrixHeader>
            <MatrixHeader>Recoup</MatrixHeader>
            <MatrixHeader>Profit</MatrixHeader>
            <MatrixHeader>Total</MatrixHeader>
          </div>
          {rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[minmax(150px,1.4fr)_repeat(4,minmax(110px,1fr))] border-b border-grey-100"
            >
              <MatrixCell>
                <span className="truncate font-medium">{r.name}</span>
              </MatrixCell>
              <MatrixCell>{cell(r.fee)}</MatrixCell>
              <MatrixCell>{cell(r.recoup)}</MatrixCell>
              <MatrixCell>{cell(r.profit)}</MatrixCell>
              <MatrixCell>
                <span
                  className={cn(
                    'font-medium',
                    r.fee + r.recoup + r.profit < 0 && 'text-danger',
                  )}
                >
                  {formatCurrency(r.fee + r.recoup + r.profit, currency)}
                </span>
              </MatrixCell>
            </div>
          ))}
          <div className="grid grid-cols-[minmax(150px,1.4fr)_repeat(4,minmax(110px,1fr))]">
            <MatrixCell>
              <span className="font-bold">Total</span>
            </MatrixCell>
            <MatrixCell>
              <span className="font-bold">{formatCurrency(totals.fee, currency)}</span>
            </MatrixCell>
            <MatrixCell>
              <span className="font-bold">{formatCurrency(totals.recoup, currency)}</span>
            </MatrixCell>
            <MatrixCell>
              <span className="font-bold">{formatCurrency(totals.profit, currency)}</span>
            </MatrixCell>
            <MatrixCell>
              <span className="font-bold">{formatCurrency(grandTotal, currency)}</span>
            </MatrixCell>
          </div>
        </div>
      </div>
    </Card>
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

/* ─── Shared primitives ─────────────────────────────────────────────────── */

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

function StatTile({
  label,
  value,
  loading,
}: Readonly<{ label: string; value: string; loading: boolean }>) {
  return (
    <div className="flex min-h-[92px] flex-col justify-between gap-2 rounded-[8px] border border-border p-4">
      <span className="text-[13px] font-medium leading-[18px] text-neutral">
        {label}
      </span>
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <span className="text-[26px] font-semibold leading-[30px] tracking-[-0.52px] text-foreground">
          {value}
        </span>
      )}
    </div>
  );
}

function ProofRow({
  label,
  children,
}: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div className="grid grid-cols-[100px_10px_1fr] items-center gap-2 border-b border-grey-100 pb-2 last:border-b-0">
      <dt className="text-[14px] font-medium leading-[20px] text-foreground">
        {label}
      </dt>
      <span className="text-[14px] text-neutral">:</span>
      <dd className="min-w-0 text-[14px] leading-[20px] text-foreground">
        {children}
      </dd>
    </div>
  );
}

function CopyButton({ value }: Readonly<{ value: string }>) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          .writeText(value)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          })
          .catch(() => {
            toast.error('Could not copy to clipboard.');
          });
      }}
      className="shrink-0 rounded p-1 text-neutral transition-colors hover:bg-grey-50 hover:text-foreground"
      aria-label="Copy hash"
    >
      {copied ? (
        <Check className="size-4 text-success" aria-hidden />
      ) : (
        <Copy className="size-4" aria-hidden />
      )}
    </button>
  );
}

function sum(list: ReadonlyArray<SettlementAllocation> | undefined): number {
  return (list ?? []).reduce((acc, a) => acc + a.amount, 0);
}

function extractPercentage(a: SettlementAllocation): string | null {
  const pct = a.metadata?.percentage;
  if (typeof pct === 'number' && Number.isFinite(pct)) return `${formatNumber(pct)}%`;
  return null;
}

function formatInputSummary(
  run: SettlementRunDetail,
  proof: ProofSummary,
): string {
  const s = proof.inputSummary;
  const version =
    (s?.ruleSnapshotVersion as number | undefined) ?? run.ruleSnapshotVersion;
  const batches =
    (s?.revenueBatchCount as number | undefined) ?? run.revenueBatches.length;
  const participants = s?.participantCount as number | undefined;
  const parts = [
    version !== undefined ? `Rule v${version}` : null,
    batches !== undefined
      ? `${batches} ${batches === 1 ? 'batch' : 'batches'}`
      : null,
    participants !== undefined ? `${participants} participants` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' × ') : '-';
}
