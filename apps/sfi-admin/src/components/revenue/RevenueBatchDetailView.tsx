'use client';

import { FileText, Plus } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/BackLink';
import { UploadDocumentDrawer } from '@/components/documents/UploadDocumentDrawer';
import { RejectBatchDialog } from '@/components/revenue/RejectBatchDialog';
import { ValidateBatchDialog } from '@/components/revenue/ValidateBatchDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import {
  DOCUMENT_TYPE_LABEL,
  REVENUE_BATCH_STATUS_LABEL,
  REVENUE_BATCH_STATUS_TONE,
} from '@/constants/ui';
import { useBatchDocuments } from '@/hooks/documents/useBatchDocuments';
import { useRejectBatch } from '@/hooks/revenue/useRejectBatch';
import { useRevenueBatch } from '@/hooks/revenue/useRevenueBatch';
import { useValidateBatch } from '@/hooks/revenue/useValidateBatch';
import { getApiErrorMessage } from '@/lib/axios';
import { cn } from '@/lib/utils';
import { RevenueBatchStatus } from '@/types/dashboard.types';
import type { Document, DocumentType } from '@/types/document.types';
import type { RevenueBatch, RevenueLineItem } from '@/types/revenue.types';
import { formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/format';

type RevenueBatchDetailViewProps = Readonly<{
  dealId: string;
  batchId: string;
}>;

/**
 * MS-3 Screen 3.2 — Revenue Batch Detail.
 *
 * Header card holds Batch # + status pill and the four transactional
 * fields (Amount / Currency / Period / Source). Line-items card renders
 * per-source breakdown returned by Wave 3 (`lineItems[]`), with a
 * fallback to `metadata.lineItems` for pre-Wave-3 batches. Documents
 * table lists batch-linked docs from `GET /revenue-batches/:id/documents`
 * with an inline Upload button that opens the shared UploadDocumentDrawer
 * pre-scoped to this batch.
 *
 * Validate + Reject actions gate on status: only PENDING batches show
 * both; VALIDATED batches show Reject-only until Liang locks the
 * semantics; PROCESSED (locked in settlement) and REJECTED are read-only.
 */
export function RevenueBatchDetailView({
  dealId,
  batchId,
}: RevenueBatchDetailViewProps) {
  const [validateOpen, setValidateOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: batch, isLoading, isError, refetch } = useRevenueBatch(batchId);
  const { data: docsData, isLoading: docsLoading } = useBatchDocuments(batchId);
  const validateMutation = useValidateBatch();
  const rejectMutation = useRejectBatch();

  const documents = useMemo<ReadonlyArray<Document>>(
    () => docsData?.data ?? [],
    [docsData],
  );

  async function handleValidate(validationNotes: string) {
    try {
      await validateMutation.mutateAsync({
        id: batchId,
        ...(validationNotes ? { validationNotes } : {}),
      });
      toast.success('Batch validated');
      setValidateOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to validate batch.'));
    }
  }

  async function handleReject(rejectionReason: string) {
    try {
      await rejectMutation.mutateAsync({ id: batchId, rejectionReason });
      toast.success('Batch rejected');
      setRejectOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to reject batch.'));
    }
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink href={ROUTES.DEALS.REVENUE(dealId)} label="Revenue Batches" />
        <div className="flex flex-col items-center gap-3 rounded-[8px] border border-border bg-white py-16 text-center">
          <p className="text-[14px] text-danger">Failed to load batch.</p>
          <Button type="button" variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={ROUTES.DEALS.REVENUE(dealId)} label="Revenue Batches" />

      <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
        Revenue Batch
      </h1>

      <section
        aria-labelledby="batch-detail-heading"
        className="flex flex-col gap-6 rounded-[8px] border border-border bg-white p-4 sm:p-6"
      >
        <BatchHeader isLoading={isLoading} batch={batch ?? null} />

        <BatchDetailsCard isLoading={isLoading} batch={batch ?? null} />

        <LineItemsCard isLoading={isLoading} batch={batch ?? null} />

        <LinkedDocumentsCard
          isLoading={docsLoading}
          documents={documents}
          onUploadClick={() => setUploadOpen(true)}
          canUpload={Boolean(batch) && !batch?.isSettled}
        />

        <BatchActions
          batch={batch ?? null}
          onValidate={() => setValidateOpen(true)}
          onReject={() => setRejectOpen(true)}
        />
      </section>

      <ValidateBatchDialog
        open={validateOpen}
        onOpenChange={setValidateOpen}
        batch={batch ?? null}
        isPending={validateMutation.isPending}
        onConfirm={(notes) => void handleValidate(notes)}
      />

      <RejectBatchDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        batch={batch ?? null}
        isPending={rejectMutation.isPending}
        onConfirm={(reason) => void handleReject(reason)}
      />

      <UploadDocumentDrawer
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        dealId={dealId}
        defaultBatchId={batchId}
      />
    </div>
  );
}

/* ─── Header (Batch # + created date + status pill) ─────────────────────── */

function BatchHeader({
  isLoading,
  batch,
}: Readonly<{ isLoading: boolean; batch: RevenueBatch | null }>) {
  if (isLoading || !batch) {
    return (
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    );
  }
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h2
          id="batch-detail-heading"
          className="text-[22px] font-bold leading-[28px] tracking-[0.044px] text-foreground"
        >
          {batch.batchNumber}
        </h2>
        <p className="text-[13px] leading-[18px] text-neutral">
          {formatDate(batch.createdAt)}
        </p>
      </div>
      <Badge
        size="sm"
        variant={REVENUE_BATCH_STATUS_TONE[batch.status]}
        className="whitespace-nowrap"
      >
        {REVENUE_BATCH_STATUS_LABEL[batch.status]}
      </Badge>
    </div>
  );
}

/* ─── Batch Details card ────────────────────────────────────────────────── */

function BatchDetailsCard({
  isLoading,
  batch,
}: Readonly<{ isLoading: boolean; batch: RevenueBatch | null }>) {
  return (
    <Card title="Batch Details">
      {isLoading || !batch ? (
        <RowSkeletonList rows={4} />
      ) : (
        <dl className="flex flex-col gap-3">
          <DetailRow label="Amount" value={formatCurrency(batch.totalAmount, batch.currency)} />
          <DetailRow label="Currency" value={batch.currency} />
          <DetailRow
            label="Period"
            value={`${formatDate(batch.periodStart)} - ${formatDate(batch.periodEnd)}`}
          />
          <DetailRow label="Source" value={batch.source ?? '-'} />
        </dl>
      )}
    </Card>
  );
}

/* ─── Line Items card ───────────────────────────────────────────────────── */

type MetadataLineItem = {
  label?: string;
  source?: string;
  platformSource?: string;
  amount?: number | string;
};

function LineItemsCard({
  isLoading,
  batch,
}: Readonly<{ isLoading: boolean; batch: RevenueBatch | null }>) {
  const items = useMemo(() => {
    if (!batch) return [] as ReadonlyArray<{ label: string; amount: number }>;
    if (batch.lineItems && batch.lineItems.length > 0) {
      return batch.lineItems.map((li: RevenueLineItem) => ({
        label: li.platformSource,
        amount: li.amount,
      }));
    }
    const legacy = batch.metadata?.lineItems;
    if (Array.isArray(legacy)) {
      return legacy
        .map((row) => {
          const r = row as MetadataLineItem;
          const label = r.platformSource ?? r.source ?? r.label ?? '';
          const amt = typeof r.amount === 'string' ? Number(r.amount) : r.amount ?? 0;
          return { label, amount: Number.isFinite(amt) ? (amt as number) : 0 };
        })
        .filter((r) => r.label.length > 0);
    }
    return [];
  }, [batch]);

  if (isLoading || !batch) {
    return (
      <Card title="Line Items">
        <RowSkeletonList rows={3} />
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card title="Line Items">
        <p className="py-2 text-[14px] text-neutral">
          No line items recorded for this batch.
        </p>
      </Card>
    );
  }

  const currency = batch.currency;
  const sum = items.reduce((acc, r) => acc + r.amount, 0);

  return (
    <Card title="Line Items">
      <dl className="flex flex-col gap-3">
        {items.map((row, idx) => (
          <DetailRow
            key={`${row.label}-${idx}`}
            label={row.label}
            value={formatCurrency(row.amount, currency)}
          />
        ))}
      </dl>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="text-[14px] font-semibold text-foreground">Total</span>
        <span className="text-[14px] font-semibold text-foreground">
          {formatCurrency(sum, currency)}
        </span>
      </div>
    </Card>
  );
}

/* ─── Linked Documents card ─────────────────────────────────────────────── */

const DOC_GRID_COLS =
  'grid grid-cols-[minmax(200px,2fr)_minmax(140px,1fr)_minmax(80px,0.6fr)]';

function LinkedDocumentsCard({
  isLoading,
  documents,
  onUploadClick,
  canUpload,
}: Readonly<{
  isLoading: boolean;
  documents: ReadonlyArray<Document>;
  onUploadClick: () => void;
  canUpload: boolean;
}>) {
  return (
    <Card title="Linked Documents">
      <div className="overflow-x-auto">
        <div className="min-w-[520px]">
          <div className={cn(DOC_GRID_COLS, 'border-b border-grey-200 bg-grey-50')}>
            <HeaderCell>File Name</HeaderCell>
            <HeaderCell>Type</HeaderCell>
            <HeaderCell>Size</HeaderCell>
          </div>

          {isLoading ? (
            <>
              {['s1', 's2'].map((k) => (
                <div key={k} className={cn(DOC_GRID_COLS, 'border-b border-grey-100')}>
                  <BodyCell><Skeleton className="h-4 w-40" /></BodyCell>
                  <BodyCell><Skeleton className="h-4 w-28" /></BodyCell>
                  <BodyCell><Skeleton className="h-4 w-16" /></BodyCell>
                </div>
              ))}
            </>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <FileText className="size-6 text-neutral" aria-hidden />
              <p className="text-[14px] text-neutral">
                No documents linked to this batch yet.
              </p>
            </div>
          ) : (
            documents.map((doc, idx) => (
              <div
                key={doc.id}
                className={cn(
                  DOC_GRID_COLS,
                  idx === documents.length - 1 ? '' : 'border-b border-grey-100',
                )}
              >
                <BodyCell>
                  <a
                    href={doc.storageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-[14px] font-medium leading-[20px] text-foreground underline underline-offset-2 hover:text-foreground/80"
                    title={doc.fileName}
                  >
                    {doc.fileName}
                  </a>
                </BodyCell>
                <BodyCell>
                  <span className="text-[13px] font-medium text-neutral">
                    {DOCUMENT_TYPE_LABEL[doc.docType as DocumentType]}
                  </span>
                </BodyCell>
                <BodyCell>
                  <span className="text-[14px] text-foreground">
                    {formatFileSize(doc.fileSize)}
                  </span>
                </BodyCell>
              </div>
            ))
          )}
        </div>
      </div>

      {canUpload && (
        <Button
          type="button"
          onClick={onUploadClick}
          className="mt-4 w-full"
        >
          <Plus className="size-4" aria-hidden />
          Upload New Document
        </Button>
      )}
    </Card>
  );
}

/* ─── Bottom actions (Reject + Validate) ────────────────────────────────── */

function BatchActions({
  batch,
  onValidate,
  onReject,
}: Readonly<{
  batch: RevenueBatch | null;
  onValidate: () => void;
  onReject: () => void;
}>) {
  if (!batch) return null;

  const canValidate = batch.status === RevenueBatchStatus.PENDING;
  const canReject =
    batch.status === RevenueBatchStatus.PENDING ||
    batch.status === RevenueBatchStatus.VALIDATED;

  if (!canValidate && !canReject) return null;

  return (
    <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
      {canReject && (
        <Button type="button" variant="destructive" onClick={onReject}>
          Reject Batch
        </Button>
      )}
      {canValidate && (
        <Button type="button" onClick={onValidate}>
          Validate Batch
        </Button>
      )}
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
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h3 className="text-[15px] font-semibold leading-[22px] text-foreground">
          {title}
        </h3>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <div className="grid grid-cols-[140px_10px_1fr] gap-2">
      <dt className="text-[14px] leading-[20px] text-foreground">{label}</dt>
      <span className="text-[14px] text-neutral">:</span>
      <dd className="text-[14px] leading-[20px] text-foreground">{value}</dd>
    </div>
  );
}

function RowSkeletonList({ rows }: Readonly<{ rows: number }>) {
  return (
    <>
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="grid grid-cols-[140px_10px_1fr] gap-2">
          <Skeleton className="h-4 w-24" />
          <span className="text-neutral">:</span>
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </>
  );
}

function HeaderCell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex items-center px-[10px] py-[12px]">
      <span className="text-[13px] font-semibold leading-[18px] text-foreground">
        {children}
      </span>
    </div>
  );
}

function BodyCell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex h-[48px] items-center px-[10px] py-[12px]">
      {children}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes < 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}
