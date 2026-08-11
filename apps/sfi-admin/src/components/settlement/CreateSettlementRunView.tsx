'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/BackLink';
import { Banner } from '@/components/common/Banner';
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
} from '@/constants/ui';
import { useRevenueBatches } from '@/hooks/revenue/useRevenueBatches';
import { useRuleSnapshots } from '@/hooks/rules/useRuleSnapshots';
import { useCreateSettlementRun } from '@/hooks/settlement/useCreateSettlementRun';
import { getApiErrorMessage } from '@/lib/axios';
import { cn } from '@/lib/utils';
import type { RevenueBatch } from '@/types/revenue.types';
import {
  deriveRuleSnapshotStatus,
  RuleSnapshotStatus,
  type RuleSnapshot,
} from '@/types/rule-snapshot.types';
import { formatDate } from '@/utils/date';
import { formatCurrency, formatNumber } from '@/utils/format';

type CreateSettlementRunViewProps = Readonly<{
  dealId: string;
}>;

/**
 * MS-4 Screen 4.5: Create (New) Settlement Run.
 *
 * Three sections per the Figma frame:
 *   1. Select Rule Snapshot: radio list, newest first. Closed snapshots
 *      stay selectable (settling a historical period needs the version
 *      that was active then); picking one surfaces an info banner that
 *      answers Liang's review question "When Closed, if I choose V1 and
 *      V2 what will shows?".
 *   2. Select Revenue Batches: only VALIDATED batches are checkable.
 *      PROCESSED / already-settled rows render disabled with the reason.
 *   3. Selected Summary + Notes + Create button.
 *
 * Liang's Figma review (07/13): buttons here say "Settlement Run", never
 * "Batch"; the frame briefly reused Screen 3.1's button copy.
 */
export function CreateSettlementRunView({ dealId }: CreateSettlementRunViewProps) {
  const router = useRouter();
  const createMutation = useCreateSettlementRun();

  const { data: snapshotsData, isLoading: snapshotsLoading } = useRuleSnapshots(
    dealId,
    { limit: 100 },
  );
  const { data: batchesData, isLoading: batchesLoading } = useRevenueBatches(
    dealId,
    { limit: 100 },
  );

  const snapshots = useMemo<ReadonlyArray<RuleSnapshot>>(
    () =>
      [...(snapshotsData?.data ?? [])].sort((a, b) => b.version - a.version),
    [snapshotsData],
  );
  const batches = useMemo<ReadonlyArray<RevenueBatch>>(
    () => batchesData?.data ?? [],
    [batchesData],
  );

  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const [selectedBatchIds, setSelectedBatchIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [notes, setNotes] = useState('');

  // Default to the active (newest open) snapshot once loaded.
  const effectiveSnapshotId =
    snapshotId ??
    snapshots.find(
      (s) => deriveRuleSnapshotStatus(s) === RuleSnapshotStatus.ACTIVE,
    )?.id ??
    snapshots[0]?.id ??
    null;

  const selectedSnapshot =
    snapshots.find((s) => s.id === effectiveSnapshotId) ?? null;
  const selectedSnapshotClosed =
    selectedSnapshot !== null &&
    deriveRuleSnapshotStatus(selectedSnapshot) === RuleSnapshotStatus.CLOSED;

  const selectedBatches = batches.filter((b) => selectedBatchIds.has(b.id));
  const totalRevenue = selectedBatches.reduce((acc, b) => acc + b.totalAmount, 0);
  const summaryCurrency = selectedBatches[0]?.currency ?? null;

  const canSubmit =
    Boolean(effectiveSnapshotId) &&
    selectedBatchIds.size > 0 &&
    !createMutation.isPending;

  function toggleBatch(id: string) {
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    if (!effectiveSnapshotId || selectedBatchIds.size === 0) return;
    const trimmedNotes = notes.trim();
    try {
      const run = await createMutation.mutateAsync({
        dealId,
        input: {
          ruleSnapshotId: effectiveSnapshotId,
          revenueBatchIds: [...selectedBatchIds],
          ...(trimmedNotes ? { notes: trimmedNotes } : {}),
        },
      });
      toast.success(`${run.runLabel} created as draft`);
      router.push(ROUTES.DEALS.SETTLEMENT(dealId));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create settlement run.'));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={ROUTES.DEALS.SETTLEMENT(dealId)} label="Settlement Runs" />

      <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
        New Settlement Run
      </h1>

      <div className="flex flex-col gap-6 rounded-[8px] border border-border bg-white p-4 sm:p-6">
        {/* 1: Select Rule Snapshot */}
        <SectionCard title="Select Rule Snapshot">
          {snapshotsLoading ? (
            <SnapshotSkeletons />
          ) : snapshots.length === 0 ? (
            <p className="py-2 text-[14px] text-neutral">
              No rule snapshots on this deal yet. Create one under Rules first:
              a settlement run needs a snapshot to allocate against.
            </p>
          ) : (
            <div className="flex flex-col gap-3" role="radiogroup" aria-label="Rule snapshot">
              {snapshots.map((s) => {
                const status = deriveRuleSnapshotStatus(s);
                const checked = s.id === effectiveSnapshotId;
                return (
                  <label
                    key={s.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-[8px] border p-3 transition-colors',
                      checked
                        ? 'border-foreground'
                        : 'border-border hover:border-foreground/50',
                    )}
                  >
                    <input
                      type="radio"
                      name="rule-snapshot"
                      checked={checked}
                      onChange={() => setSnapshotId(s.id)}
                      className="mt-0.5 size-4 accent-foreground"
                    />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-[14px] font-semibold leading-[20px] text-foreground">
                        v{s.version} ({formatDate(s.effectiveFrom)}
                        {' - '}
                        {s.effectiveTo ? formatDate(s.effectiveTo) : 'Present'})
                        {status === RuleSnapshotStatus.CLOSED && (
                          <span className="ml-2 font-bold text-neutral">CLOSED</span>
                        )}
                      </span>
                      <span className="text-[12px] leading-[16px] text-neutral">
                        {formatNumber(s.participantCount)} participants
                        {s.notes ? ` • ${s.notes}` : ''}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {selectedSnapshotClosed && selectedSnapshot && (
            <Banner tone="info">
              v{selectedSnapshot.version} is closed. It was superseded on{' '}
              {formatDate(selectedSnapshot.effectiveTo as string)}. You can still
              run a settlement with it: the run allocates using this
              version&apos;s rules exactly as they were, which is what you want
              when settling or correcting a period from when it was active. For
              new revenue periods, use the active version instead.
            </Banner>
          )}
        </SectionCard>

        {/* 2: Select Revenue Batches */}
        <SectionCard
          title="Select Revenue Batches"
          subtitle="Only VALIDATED batches can be used"
        >
          {batchesLoading ? (
            <SnapshotSkeletons />
          ) : batches.length === 0 ? (
            <p className="py-2 text-[14px] text-neutral">
              No revenue batches on this deal yet. Add revenue under the Revenue
              tab first.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[560px]">
                <div className="grid grid-cols-[44px_minmax(140px,1.2fr)_minmax(120px,1fr)_minmax(130px,1fr)_minmax(110px,0.9fr)] border-b border-grey-200 bg-grey-50">
                  <div className="px-[10px] py-[12px]" />
                  <BatchHeaderCell>Batch ID</BatchHeaderCell>
                  <BatchHeaderCell>Amount</BatchHeaderCell>
                  <BatchHeaderCell>Period</BatchHeaderCell>
                  <BatchHeaderCell>Status</BatchHeaderCell>
                </div>
                {batches.map((b, idx) => (
                  <BatchRow
                    key={b.id}
                    batch={b}
                    isLast={idx === batches.length - 1}
                    checked={selectedBatchIds.has(b.id)}
                    onToggle={() => toggleBatch(b.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* 3: Selected Summary */}
        <SectionCard title="Selected Summary">
          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryRow
              label="Rule"
              value={
                selectedSnapshot
                  ? `v${selectedSnapshot.version} (${formatNumber(selectedSnapshot.participantCount)} Participants)`
                  : '-'
              }
            />
            <SummaryRow
              label="Revenue Batches"
              value={`${formatNumber(selectedBatchIds.size)} selected`}
            />
            <SummaryRow
              label="Total Revenue"
              value={
                selectedBatchIds.size > 0
                  ? formatCurrency(totalRevenue, summaryCurrency)
                  : '-'
              }
            />
          </div>
        </SectionCard>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="run-notes">Notes</Label>
          <Textarea
            id="run-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Q3 2026 quarterly settlement"
            disabled={createMutation.isPending}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.DEALS.SETTLEMENT(dealId))}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Creating...
              </>
            ) : (
              'Create New Settlement Run'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Batch row ─────────────────────────────────────────────────────────── */

function BatchRow({
  batch,
  isLast,
  checked,
  onToggle,
}: Readonly<{
  batch: RevenueBatch;
  isLast: boolean;
  checked: boolean;
  onToggle: () => void;
}>) {
  const selectable = batch.status === 'VALIDATED' && !batch.isSettled;
  const disabledReason = !selectable
    ? batch.isSettled || batch.status === 'PROCESSED'
      ? 'Already used in a settlement run'
      : batch.status === 'PENDING'
        ? 'Not validated yet'
        : 'Rejected'
    : null;

  return (
    <div
      className={cn(
        'grid grid-cols-[44px_minmax(140px,1.2fr)_minmax(120px,1fr)_minmax(130px,1fr)_minmax(110px,0.9fr)] items-center',
        isLast ? '' : 'border-b border-grey-100',
        !selectable && 'opacity-60',
      )}
    >
      <div className="flex items-center justify-center px-[10px] py-[12px]">
        <Checkbox
          checked={checked}
          onCheckedChange={onToggle}
          disabled={!selectable}
          aria-label={`Select ${batch.batchNumber}`}
        />
      </div>
      <BatchBodyCell>
        <span className="flex flex-col">
          <span className="text-[14px] font-medium text-foreground">
            {batch.batchNumber}
          </span>
          {disabledReason && (
            <span className="text-[12px] leading-[16px] text-neutral">
              ({disabledReason})
            </span>
          )}
        </span>
      </BatchBodyCell>
      <BatchBodyCell>
        <span className="text-[14px] text-foreground">
          {formatCurrency(batch.totalAmount, batch.currency)}
        </span>
      </BatchBodyCell>
      <BatchBodyCell>
        <span className="text-[14px] text-neutral">
          {formatDate(batch.periodStart)} - {formatDate(batch.periodEnd)}
        </span>
      </BatchBodyCell>
      <BatchBodyCell>
        <Badge
          size="sm"
          variant={REVENUE_BATCH_STATUS_TONE[batch.status]}
          className="whitespace-nowrap"
        >
          {REVENUE_BATCH_STATUS_LABEL[batch.status]}
        </Badge>
      </BatchBodyCell>
    </div>
  );
}

/* ─── Section + summary primitives ──────────────────────────────────────── */

function SectionCard({
  title,
  subtitle,
  children,
}: Readonly<{ title: string; subtitle?: string; children: React.ReactNode }>) {
  return (
    <section className="flex flex-col gap-3 rounded-[8px] border border-border bg-white p-4">
      <div className="flex flex-col gap-0.5 border-b border-border pb-2">
        <h2 className="text-[15px] font-semibold leading-[22px] text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[12px] leading-[16px] text-neutral">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function SummaryRow({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className="grid grid-cols-[140px_10px_1fr] gap-2">
      <dt className="text-[14px] font-semibold leading-[20px] text-foreground">
        {label}
      </dt>
      <span className="text-[14px] text-neutral">:</span>
      <dd className="text-[14px] leading-[20px] text-foreground">{value}</dd>
    </div>
  );
}

function BatchHeaderCell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex items-center px-[10px] py-[12px]">
      <span className="text-[13px] font-semibold leading-[18px] text-foreground">
        {children}
      </span>
    </div>
  );
}

function BatchBodyCell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-[52px] items-center px-[10px] py-[12px]">
      {children}
    </div>
  );
}

function SnapshotSkeletons() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-14 w-full rounded-[8px]" />
      <Skeleton className="h-14 w-full rounded-[8px]" />
    </div>
  );
}
