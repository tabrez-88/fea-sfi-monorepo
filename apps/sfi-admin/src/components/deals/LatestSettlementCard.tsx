'use client';

import Link from 'next/link';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { SETTLEMENT_RUN_STATUS_TONE } from '@/constants/ui';
import { cn } from '@/lib/utils';
import type { SettlementRunStatus } from '@/types/dashboard.types';
import { formatCurrency } from '@/utils/format';

type LatestSettlement = Readonly<{
  id: string;
  status: SettlementRunStatus;
  totalRevenue: number;
  totalAllocated: number;
  ruleSnapshotVersion: string | number;
  revenueBatchesCount: number;
  proof: string | null;
}>;

type LatestSettlementCardProps = Readonly<{
  dealId: string;
  settlement: LatestSettlement | null;
}>;

/**
 * "Latest Settlement" panel on the Deal Overview. Shows a key/value summary
 * of the most recent settlement run plus the proof hash with a copy button,
 * and a "View Details" link routing to the run detail page. Renders nothing
 * when the deal has no settlement runs yet — the Deal Overview falls back to
 * `QuickActionsCard` in that case.
 */
export function LatestSettlementCard({ dealId, settlement }: LatestSettlementCardProps) {
  if (!settlement) return null;

  const truncatedProof = settlement.proof
    ? `sha256:${settlement.proof.slice(0, 10)}…`
    : '—';

  async function handleCopyProof() {
    if (!settlement?.proof) return;
    try {
      await navigator.clipboard.writeText(settlement.proof);
      toast.success('Proof hash copied');
    } catch {
      toast.error('Could not copy proof hash');
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-[8px] border border-border bg-white p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[18px] font-semibold leading-[24px] tracking-[-0.36px] text-foreground">
          Latest Settlement
        </h2>
        <Badge variant={SETTLEMENT_RUN_STATUS_TONE[settlement.status]}>
          {settlement.status.charAt(0) + settlement.status.slice(1).toLowerCase()}
        </Badge>
      </div>

      <dl className="flex flex-col divide-y divide-border">
        <Row label="Total Revenue" value={formatCurrency(settlement.totalRevenue)} />
        <Row label="Total Allocated" value={formatCurrency(settlement.totalAllocated)} />
        <Row label="Rule Snapshot" value={`v${settlement.ruleSnapshotVersion}`} />
        <Row label="Revenue Batches" value={String(settlement.revenueBatchesCount)} />
        <Row
          label="Proof"
          value={
            <span className="inline-flex items-center gap-1.5 font-mono text-[13px]">
              {truncatedProof}
              {settlement.proof && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Copy proof hash"
                  className="size-6"
                  onClick={() => {
                    void handleCopyProof();
                  }}
                >
                  <Copy className="size-3.5" strokeWidth={2} />
                </Button>
              )}
            </span>
          }
        />
      </dl>

      <Link
        href={ROUTES.SETTLEMENT.RUN_DETAIL(settlement.id)}
        className={cn(
          'self-start text-[14px] font-semibold text-foreground underline-offset-4 hover:underline',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 rounded-[4px]',
        )}
        data-deal-id={dealId}
      >
        View Details
      </Link>
    </section>
  );
}

type RowProps = Readonly<{
  label: string;
  value: React.ReactNode;
}>;

function Row({ label, value }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
      <dt className="text-[13px] text-neutral">{label}</dt>
      <dd className="text-[14px] font-semibold text-foreground">{value}</dd>
    </div>
  );
}
