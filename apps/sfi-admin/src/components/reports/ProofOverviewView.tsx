'use client';

import {
  ArrowRight,
  Check,
  Copy,
  FileSearch,
  Loader2,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/BackLink';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { SETTLEMENT_RUN_TYPE_LABEL, SETTLEMENT_RUN_TYPE_TONE } from '@/constants/ui';
import { useSettlementRuns } from '@/hooks/settlement/useSettlementRuns';
import { getApiErrorMessage } from '@/lib/axios';
import { cn } from '@/lib/utils';
import { settlementService } from '@/services/settlement.service';
import { SettlementRunStatus } from '@/types/dashboard.types';
import type {
  ProofVerificationResult,
  SettlementRun,
} from '@/types/settlement.types';
import { formatDate } from '@/utils/date';
import { formatCurrency, formatNumber } from '@/utils/format';

type ProofOverviewViewProps = Readonly<{
  dealId: string;
}>;

/**
 * MS-5 Screen 5.5: Proof Overview.
 *
 * Every finalized run's proof record in one place, each verifiable on the
 * spot. Verification recomputes the settlement from its stored inputs and
 * compares hashes; it is local, not a chain lookup, which the info box
 * says plainly because Liang asked exactly that (07/13).
 *
 * Correction runs render with an arrow back to the run they correct, so
 * the chain of custody reads top to bottom.
 */
export function ProofOverviewView({ dealId }: ProofOverviewViewProps) {
  // Server-side status filter (added for this screen) instead of pulling
  // every run and discarding most of them client-side.
  const { data, isLoading, isError, refetch } = useSettlementRuns(dealId, {
    limit: 100,
    status: SettlementRunStatus.FINALIZED,
    sortBy: 'runNumber',
    sortOrder: 'desc',
  });

  const runs = data?.data ?? [];

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink href={ROUTES.DEALS.DETAIL(dealId)} label="Overview" />
        <div className="flex flex-col items-center gap-3 rounded-[8px] border border-border bg-white py-16 text-center">
          <p className="text-[14px] text-danger">Failed to load proof records.</p>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={ROUTES.DEALS.DETAIL(dealId)} label="Overview" />

      <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
        Proof
      </h1>

      {/* What proof is, and what it is not. */}
      <div className="flex items-start gap-3 rounded-[8px] border border-border bg-grey-50/60 px-4 py-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-neutral" aria-hidden />
        <div className="flex flex-col gap-1">
          <p className="text-[14px] font-semibold leading-[20px] text-foreground">
            How proof works
          </p>
          <p className="text-[13px] leading-[18px] text-neutral">
            When a settlement is finalized, its inputs (rule snapshot, revenue
            batches, participants) are hashed with SHA-256 and stored. Verify
            Integrity recomputes the settlement from those same stored inputs and
            checks the result against the saved hash, which proves nobody altered
            the numbers afterwards. This runs inside the platform: nothing is
            published to a blockchain. Use Export Proof on a run to take the
            record elsewhere.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-[200px] w-full rounded-[8px]" />
          <Skeleton className="h-[200px] w-full rounded-[8px]" />
        </div>
      ) : runs.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No proof records yet"
          description="A proof record is generated the moment a settlement run is finalized. Finalize a run to see its hash here."
          action={{
            label: 'Go to Settlement',
            href: ROUTES.DEALS.SETTLEMENT(dealId),
          }}
          className="border-dashed"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {runs.map((run) => (
            <ProofCard key={run.id} run={run} allRuns={runs} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProofCard({
  run,
  allRuns,
}: Readonly<{ run: SettlementRun; allRuns: ReadonlyArray<SettlementRun> }>) {
  const [result, setResult] = useState<ProofVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const original =
    run.runType === 'CORRECTION' && run.originalSettlementRunId
      ? allRuns.find((r) => r.id === run.originalSettlementRunId)
      : undefined;

  async function handleVerify() {
    setIsVerifying(true);
    setResult(null);
    try {
      setResult(await settlementService.verify(run.id));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Verification failed.'));
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-[8px] border border-border bg-white p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-bold leading-[24px] text-foreground">
              {run.runLabel}
            </h2>
            <Badge size="sm" variant={SETTLEMENT_RUN_TYPE_TONE[run.runType]}>
              {SETTLEMENT_RUN_TYPE_LABEL[run.runType]}
            </Badge>
          </div>
          <p className="text-[13px] leading-[18px] text-neutral">
            Finalized{' '}
            {run.finalizedAt ? formatDate(run.finalizedAt) : formatDate(run.createdAt)}
            {' | '}
            {formatCurrency(run.totalAllocated, run.currency)} allocated
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.SETTLEMENT.RUN_DETAIL(run.id)}>View Run</Link>
        </Button>
      </div>

      {/* Correction chain */}
      {original && (
        <div className="flex flex-wrap items-center gap-2 rounded-[8px] bg-grey-50/60 px-3 py-2 text-[13px] text-neutral">
          <span className="font-medium text-foreground">{original.runLabel}</span>
          <ArrowRight className="size-3.5" aria-hidden />
          <span className="font-medium text-foreground">{run.runLabel}</span>
          <span>(this run corrects it; both stay in the audit trail)</span>
        </div>
      )}

      {/* Proof fields */}
      <dl className="flex flex-col gap-2">
        <ProofRow label="Hash">
          {run.proofHash ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate font-mono text-[13px] text-foreground">
                {run.proofHash}
              </span>
              <CopyButton value={run.proofHash} />
            </span>
          ) : (
            <span className="text-neutral">No proof record</span>
          )}
        </ProofRow>
        <ProofRow label="Algorithm">SHA-256</ProofRow>
        <ProofRow label="Input">
          {[
            run.ruleSnapshotVersion !== undefined
              ? `Rule v${run.ruleSnapshotVersion}`
              : null,
            run.revenueBatchCount !== undefined
              ? `${formatNumber(run.revenueBatchCount)} ${run.revenueBatchCount === 1 ? 'batch' : 'batches'}`
              : null,
          ]
            .filter(Boolean)
            .join(' x ') || '-'}
        </ProofRow>
      </dl>

      {/* Verify result */}
      {result && (
        <div
          className={cn(
            'flex items-start gap-2 rounded-[8px] border px-4 py-3',
            result.verified
              ? 'border-success/40 bg-success/5'
              : 'border-danger/40 bg-danger/5',
          )}
          role="status"
        >
          {result.verified ? (
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
          ) : (
            <ShieldX className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          )}
          <div className="flex flex-col gap-0.5">
            <p className="text-[13px] font-semibold leading-[18px] text-foreground">
              {result.verified ? 'Integrity verified' : 'Hash mismatch detected'}
            </p>
            <p className="text-[12px] leading-[16px] text-neutral">
              {result.message} (checked {formatDate(result.verifiedAt)})
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => void handleVerify()}
          disabled={isVerifying || !run.proofHash}
        >
          {isVerifying ? (
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
      </div>
    </section>
  );
}

function ProofRow({
  label,
  children,
}: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="grid grid-cols-[90px_10px_1fr] items-center gap-2">
      <dt className="text-[13px] font-medium leading-[18px] text-foreground">
        {label}
      </dt>
      <span className="text-[13px] text-neutral">:</span>
      <dd className="min-w-0 text-[13px] leading-[18px] text-foreground">
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
          .catch(() => toast.error('Could not copy to clipboard.'));
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
