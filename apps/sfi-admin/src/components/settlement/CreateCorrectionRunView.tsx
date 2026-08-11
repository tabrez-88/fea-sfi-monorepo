'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/BackLink';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/constants/routes';
import {
  REVENUE_BATCH_STATUS_LABEL,
  REVENUE_BATCH_STATUS_TONE,
  SETTLEMENT_RUN_STATUS_LABEL,
} from '@/constants/ui';
import { useRevenueBatches } from '@/hooks/revenue/useRevenueBatches';
import { useSettlementRun } from '@/hooks/settlement/useSettlementRun';
import { useSettlementRunActions } from '@/hooks/settlement/useSettlementRunActions';
import { getApiErrorMessage } from '@/lib/axios';
import { cn } from '@/lib/utils';
import type { RevenueBatch } from '@/types/revenue.types';
import { formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/format';
import { settlementRunTitle } from '@/utils/settlement';

type CreateCorrectionRunViewProps = Readonly<{
  runId: string;
}>;

/**
 * MS-4 Screen 4.6: Create Correction Run.
 *
 * Per the Figma frame: "Correcting" header naming the original run, a
 * How-Corrections-Work banner (original run is never modified; both
 * runs stay in the audit trail), an optional VALIDATED-only adjustment
 * batch picker, and a required Reason/Notes field.
 *
 * BE contract: `POST /settlement-runs/:id/corrections`
 * (`CreateCorrectionRunDto`): notes + adjustmentRevenueBatchIds. The
 * reason is optional on the wire but required here: Liang's audit-trail
 * stance (every archive has a reason) applies doubly to corrections.
 */
export function CreateCorrectionRunView({ runId }: CreateCorrectionRunViewProps) {
  const router = useRouter();
  const { data: run, isLoading: runLoading, isError, refetch } = useSettlementRun(runId);
  const actions = useSettlementRunActions(runId);

  const { data: batchesData, isLoading: batchesLoading } = useRevenueBatches(
    run?.dealId ?? '',
    { limit: 100, status: 'VALIDATED' },
  );

  const usedBatchIds = useMemo(
    () => new Set((run?.revenueBatches ?? []).map((b) => b.id)),
    [run?.revenueBatches],
  );
  // The query already filters to VALIDATED server-side; only the local
  // exclusions (already settled, already in the original run) remain.
  const adjustmentCandidates = useMemo<ReadonlyArray<RevenueBatch>>(
    () =>
      (batchesData?.data ?? []).filter(
        (b) => !b.isSettled && !usedBatchIds.has(b.id),
      ),
    [batchesData, usedBatchIds],
  );

  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [reason, setReason] = useState('');
  const [attempted, setAttempted] = useState(false);

  const trimmedReason = reason.trim();

  // The correct button only exists on FINALIZED normal runs, but this page
  // is directly addressable (bookmark, back button), so eligibility is
  // enforced here too instead of only via button visibility.
  const ineligibleReason =
    run === undefined
      ? null
      : run.runType === 'CORRECTION'
        ? 'This run is itself a correction. Corrections of corrections are not supported; correct the original run instead.'
        : run.status !== 'FINALIZED'
          ? `Only finalized runs can be corrected. This run is ${SETTLEMENT_RUN_STATUS_LABEL[run.status]}.`
          : null;

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    setAttempted(true);
    if (!trimmedReason || actions.createCorrection.isPending) return;
    try {
      const created = await actions.createCorrection.mutateAsync({
        notes: trimmedReason,
        ...(selectedIds.size > 0
          ? { adjustmentRevenueBatchIds: [...selectedIds] }
          : {}),
      });
      toast.success(`${created.runLabel} created as a correction draft`);
      router.push(ROUTES.SETTLEMENT.RUN_DETAIL(created.id));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create correction run.'));
    }
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[8px] border border-border bg-white py-16 text-center">
        <p className="text-[14px] text-danger">Failed to load the original run.</p>
        <Button type="button" variant="outline" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (ineligibleReason) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink
          href={ROUTES.SETTLEMENT.RUN_DETAIL(runId)}
          label={settlementRunTitle(run)}
        />
        <div className="flex flex-col items-center gap-3 rounded-[8px] border border-border bg-white py-16 text-center">
          <p className="max-w-[480px] text-[14px] leading-[20px] text-neutral">
            {ineligibleReason}
          </p>
          <Button asChild variant="outline">
            <Link href={ROUTES.SETTLEMENT.RUN_DETAIL(runId)}>Back to run</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BackLink
        href={ROUTES.SETTLEMENT.RUN_DETAIL(runId)}
        label={settlementRunTitle(run)}
      />

      <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
        Create Correction Run
      </h1>

      <div className="flex flex-col gap-6 rounded-[8px] border border-border bg-white p-4 sm:p-6">
        {/* Correcting header */}
        <div className="flex flex-col gap-1">
          <h2 className="text-[18px] font-bold leading-[24px] text-foreground">
            Correcting
          </h2>
          {runLoading || !run ? (
            <Skeleton className="h-4 w-64" />
          ) : (
            <p className="text-[14px] leading-[20px] text-neutral">
              {settlementRunTitle(run)} (
              {SETTLEMENT_RUN_STATUS_LABEL[run.status]},{' '}
              {formatCurrency(run.totalAllocated, run.currency)})
            </p>
          )}
        </div>

        {/* How corrections work */}
        <div className="flex flex-col gap-1 rounded-[8px] border border-dashed border-warning/60 bg-warning/5 px-4 py-3">
          <p className="flex items-center gap-2 text-[13px] font-semibold leading-[18px] text-warning">
            <AlertTriangle className="size-4" aria-hidden />
            How Corrections Work
          </p>
          <p className="text-[13px] leading-[18px] text-warning">
            The original settlement{run ? ` (${run.runLabel})` : ''} will NOT be
            modified. A new correction run will be created that adjusts the
            original amounts. Both runs remain in the audit trail.
          </p>
        </div>

        {/* Adjustment batches (optional) */}
        <section className="flex flex-col gap-3 rounded-[8px] border border-border p-4">
          <div className="flex flex-col gap-0.5 border-b border-border pb-2">
            <h3 className="text-[15px] font-semibold leading-[22px] text-foreground">
              Adjustment Revenue Batches (optional)
            </h3>
            <p className="text-[12px] leading-[16px] text-neutral">
              Select additional VALIDATED revenue batches for the correction
            </p>
          </div>

          {batchesLoading || runLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : adjustmentCandidates.length === 0 ? (
            <p className="py-2 text-[14px] text-neutral">
              No unused validated batches available. A correction without
              adjustment batches recomputes from the original inputs.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[560px]">
                <div className="grid grid-cols-[44px_minmax(140px,1.2fr)_minmax(120px,1fr)_minmax(140px,1.1fr)_minmax(110px,0.9fr)] border-b border-grey-200 bg-grey-50">
                  <div className="px-[10px] py-[12px]" />
                  <HeaderCell>Batch ID</HeaderCell>
                  <HeaderCell>Amount</HeaderCell>
                  <HeaderCell>Period</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                </div>
                {adjustmentCandidates.map((b, idx) => (
                  <div
                    key={b.id}
                    className={cn(
                      'grid grid-cols-[44px_minmax(140px,1.2fr)_minmax(120px,1fr)_minmax(140px,1.1fr)_minmax(110px,0.9fr)] items-center',
                      idx === adjustmentCandidates.length - 1
                        ? ''
                        : 'border-b border-grey-100',
                    )}
                  >
                    <div className="flex items-center justify-center px-[10px] py-[12px]">
                      <Checkbox
                        checked={selectedIds.has(b.id)}
                        onCheckedChange={() => toggle(b.id)}
                        aria-label={`Select ${b.batchNumber}`}
                      />
                    </div>
                    <BodyCell>
                      <span className="text-[14px] font-medium text-foreground">
                        {b.batchNumber}
                      </span>
                    </BodyCell>
                    <BodyCell>
                      <span className="text-[14px] text-foreground">
                        {formatCurrency(b.totalAmount, b.currency)}
                      </span>
                    </BodyCell>
                    <BodyCell>
                      <span className="text-[14px] text-neutral">
                        {b.source ?? `${formatDate(b.periodStart)} - ${formatDate(b.periodEnd)}`}
                      </span>
                    </BodyCell>
                    <BodyCell>
                      <Badge
                        size="sm"
                        variant={REVENUE_BATCH_STATUS_TONE[b.status]}
                        className="whitespace-nowrap"
                      >
                        {REVENUE_BATCH_STATUS_LABEL[b.status]}
                      </Badge>
                    </BodyCell>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Reason */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="correction-reason">
            Reason / Notes<span className="text-danger"> *</span>
          </Label>
          <Textarea
            id="correction-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Revenue from Netflix was under-reported by $5M due to late reporting from international territories."
            disabled={actions.createCorrection.isPending}
            aria-invalid={attempted && trimmedReason.length === 0}
          />
          <p className="text-[12px] leading-[16px] text-neutral">
            Explain what is being corrected and why
          </p>
          {attempted && trimmedReason.length === 0 && (
            <p className="text-[13px] leading-[18px] text-danger">
              A reason is required, it lands in the audit trail with the run.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.SETTLEMENT.RUN_DETAIL(runId))}
            disabled={actions.createCorrection.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={
              actions.createCorrection.isPending ||
              (attempted && trimmedReason.length === 0)
            }
          >
            {actions.createCorrection.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Creating...
              </>
            ) : (
              'Create New Correction Run'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function HeaderCell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex items-center px-[10px] py-[12px]">
      <span className="text-[13px] font-semibold leading-[18px] text-foreground">
        {children}
      </span>
    </div>
  );
}

function BodyCell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-[52px] items-center px-[10px] py-[12px]">
      {children}
    </div>
  );
}
