'use client';

import { AlertTriangle, CheckCircle2, Download, Loader2, RotateCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Banner } from '@/components/common/Banner';
import { Pagination } from '@/components/common/Pagination';
import { CsvDropzone } from '@/components/participants/import/CsvDropzone';
import { ParticipantBehaviorBadge } from '@/components/participants/ParticipantBehaviorBadge';
import { RoleNameChip } from '@/components/participants/RoleNameChip';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useImportParticipants } from '@/hooks/participants/useImportParticipants';
import { getApiErrorMessage } from '@/lib/axios';
import { cn } from '@/lib/utils';
import { downloadCsvTemplate, downloadImportErrors } from '@/services/participants.service';
import {
  ParticipantBehavior,
  type BulkImportResult,
  type ImportParticipantRow,
  type Participant,
} from '@/types/participant.types';
import { formatCurrency, formatNumber } from '@/utils/format';

// Preview / Complete tables paginate locally to keep large CSVs scannable.
const PREVIEW_PAGE_SIZE = 10;

type FlowState =
  | { kind: 'idle' }
  | {
      kind: 'previewing';
      file: File;
      preview: BulkImportResult;
      skipErrors: boolean;
    }
  | { kind: 'complete'; result: BulkImportResult; sourceFile: File }
  | { kind: 'reupload' };

type ImportFlowDialogProps = Readonly<{
  dealId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the user clicks "View Participants" from the Complete step. */
  onViewParticipants?: () => void;
}>;

/**
 * Multi-step CSV import flow for participants. Matches the Figma "fix"
 * set (`1339:54329` → `1299:3504` → `1339:52847` → `1339:52893`).
 *
 * State machine:
 *   idle → user picks file → POST ?dryRun=true → previewing
 *   previewing → confirm → POST without dryRun → complete
 *   complete → re-upload → reupload → loops back to previewing
 *   complete → view participants → close + callback
 *
 * One `<Dialog>` instance whose internal content swaps per step so the
 * modal stays mounted during transitions (no remount flicker, scroll
 * position preserved on async transitions).
 */
export function ImportFlowDialog({
  dealId,
  open,
  onOpenChange,
  onViewParticipants,
}: ImportFlowDialogProps) {
  const [state, setState] = useState<FlowState>({ kind: 'idle' });
  const importMutation = useImportParticipants(dealId);

  // Reset internal state every time the dialog is opened so a previous
  // session's result/preview doesn't bleed into a new one.
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setState({ kind: 'idle' });
      importMutation.reset();
    }
    onOpenChange(nextOpen);
  }

  async function runDryRun(file: File) {
    try {
      const preview = await importMutation.mutateAsync({
        file,
        options: { dryRun: true, skipErrors: true },
      });
      setState({ kind: 'previewing', file, preview, skipErrors: false });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to read CSV. Please try again.'));
    }
  }

  async function runRealImport() {
    if (state.kind !== 'previewing') return;
    try {
      const result = await importMutation.mutateAsync({
        file: state.file,
        options: { dryRun: false, skipErrors: state.skipErrors },
      });
      setState({ kind: 'complete', result, sourceFile: state.file });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to import CSV. Please try again.'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {state.kind === 'idle' && (
        <ImportCsvStep
          isUploading={importMutation.isPending}
          onFileChosen={(file) => void runDryRun(file)}
          onCancel={() => handleOpenChange(false)}
        />
      )}
      {state.kind === 'previewing' && (
        <PreviewImportStep
          preview={state.preview}
          skipErrors={state.skipErrors}
          onSkipErrorsChange={(next) => setState({ ...state, skipErrors: next })}
          isImporting={importMutation.isPending}
          onCancel={() => handleOpenChange(false)}
          onConfirm={() => void runRealImport()}
        />
      )}
      {state.kind === 'complete' && (
        <ImportCompleteStep
          result={state.result}
          onClose={() => handleOpenChange(false)}
          onReupload={() => setState({ kind: 'reupload' })}
          onViewParticipants={() => {
            handleOpenChange(false);
            onViewParticipants?.();
          }}
        />
      )}
      {state.kind === 'reupload' && (
        <ReuploadCsvStep
          isUploading={importMutation.isPending}
          onFileChosen={(file) => void runDryRun(file)}
          onCancel={() => handleOpenChange(false)}
        />
      )}
    </Dialog>
  );
}

/* ─── Step 1: Import CSV (1339:54329) ────────────────────────────────────── */

type ImportCsvStepProps = Readonly<{
  isUploading: boolean;
  onFileChosen: (file: File) => void;
  onCancel: () => void;
}>;

function ImportCsvStep({ isUploading, onFileChosen, onCancel }: ImportCsvStepProps) {
  const [file, setFile] = useState<File | null>(null);

  return (
    <DialogContent className="sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>Import Participants via CSV</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        {/* Dashed-border info card — plain white background, centered prose.
            Matches the Figma "Import Participants via CSV" frame `1339:54329`. */}
        {/* Column names here must match the parser exactly. They used to
            read "paymentBehavior", which does not exist, and Liang's files
            were rejected for a column name the UI told her to use. */}
        <div className="flex flex-col gap-1 rounded-[8px] border border-dashed border-border bg-white px-4 py-4 text-center text-[14px] leading-[20px] text-foreground">
          <p>Upload a CSV file to bulk-add participants.</p>
          <p>Required columns: name, roleName, behaviorType</p>
          <p>Optional columns: email, investmentAmount, units, pricePerUnit, poolMember</p>
          <p className="text-[13px] leading-[18px] text-neutral">
            behaviorType must be one of: FEE_DEDUCTION, RECOUPMENT,
            NET_PROFIT_SHARE, FLAT_FEE, PASS_THROUGH. The template below has a
            sample row for each.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => downloadCsvTemplate()}
          className="w-full"
          disabled={isUploading}
        >
          Download CSV Template
        </Button>

        <CsvDropzone file={file} onFileChange={setFile} disabled={isUploading} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => file && onFileChosen(file)}
          disabled={!file || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Reading...
            </>
          ) : (
            'Upload & Preview'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

/* ─── Step 2: Preview Import (1299:3504) ─────────────────────────────────── */

type PreviewImportStepProps = Readonly<{
  preview: BulkImportResult;
  skipErrors: boolean;
  onSkipErrorsChange: (next: boolean) => void;
  isImporting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}>;

function PreviewImportStep({
  preview,
  skipErrors,
  onSkipErrorsChange,
  isImporting,
  onCancel,
  onConfirm,
}: PreviewImportStepProps) {
  const [page, setPage] = useState(1);
  const validCount = preview.rows.filter((r) => r.success).length;
  const errorCount = preview.rows.filter((r) => !r.success).length;
  const totalCount = preview.rows.length;
  const totalPages = Math.max(1, Math.ceil(preview.rows.length / PREVIEW_PAGE_SIZE));
  const pageStart = (page - 1) * PREVIEW_PAGE_SIZE;
  const visibleRows = preview.rows.slice(pageStart, pageStart + PREVIEW_PAGE_SIZE);
  const rangeStart = totalCount === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + PREVIEW_PAGE_SIZE, totalCount);

  const blockedByErrors = errorCount > 0 && !skipErrors;

  return (
    <DialogContent className="sm:max-w-[920px]">
      <DialogHeader>
        <DialogTitle>Preview Import ({formatNumber(totalCount)} rows found)</DialogTitle>
      </DialogHeader>

      <div className="flex items-center gap-6 border-b border-border pb-3">
        <span className="inline-flex items-center gap-2 text-[14px]">
          <CheckCircle2 aria-hidden className="size-4 text-success" strokeWidth={2} />
          <span className="text-success">{formatNumber(validCount)} rows valid</span>
        </span>
        {errorCount > 0 && (
          <span className="inline-flex items-center gap-2 text-[14px]">
            <AlertTriangle
              aria-hidden
              className="size-4 text-[#A16207]"
              strokeWidth={2}
            />
            <span className="text-[#A16207]">{formatNumber(errorCount)} rows have errors</span>
          </span>
        )}
      </div>

      <div className="-mx-6 overflow-x-auto">
        <div className="min-w-[800px] px-6">
          <PreviewTable rows={visibleRows} />
        </div>
      </div>

      {totalCount > 0 && (
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between sm:gap-4">
          {totalPages > 1 ? (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          ) : (
            <span aria-hidden />
          )}
          <p className="text-[13px] text-neutral" aria-live="polite">
            Showing <span className="font-semibold text-foreground">{formatNumber(rangeStart)}</span>{' '}
            to <span className="font-semibold text-foreground">{formatNumber(rangeEnd)}</span> of{' '}
            {formatNumber(totalCount)}
          </p>
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-2 text-[14px] text-foreground">
        <input
          type="checkbox"
          checked={skipErrors}
          onChange={(e) => onSkipErrorsChange(e.target.checked)}
          className="size-4 accent-foreground"
        />
        Skip rows with errors and import valid rows only
      </label>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isImporting}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={blockedByErrors || isImporting || validCount === 0}
          title={
            blockedByErrors
              ? 'Tick "Skip rows with errors" to import only the valid rows.'
              : undefined
          }
        >
          {isImporting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Importing...
            </>
          ) : (
            `Confirm Import (${formatNumber(skipErrors ? validCount : totalCount)} rows)`
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function PreviewTable({ rows }: Readonly<{ rows: ReadonlyArray<ImportParticipantRow> }>) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-[14px] text-neutral">No rows to preview.</p>;
  }
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-grey-200 bg-grey-50">
          <Th>Name</Th>
          <Th>Default Behavior</Th>
          <Th>Role Name</Th>
          <Th>Email</Th>
          <Th>Investment</Th>
          <Th>Units</Th>
          <Th>Price/Unit</Th>
          <Th align="right">Status</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <PreviewRow key={row.row} row={row} />
        ))}
      </tbody>
    </table>
  );
}

function Th({
  children,
  align = 'left',
}: Readonly<{ children: React.ReactNode; align?: 'left' | 'right' }>) {
  return (
    <th
      className={cn(
        'px-[10px] py-[12px] text-[13px] font-bold leading-[20px] text-foreground',
        align === 'right' && 'text-right',
      )}
    >
      {children}
    </th>
  );
}

function PreviewRow({ row }: Readonly<{ row: ImportParticipantRow }>) {
  const p: Partial<Participant> = row.participant ?? {};
  // `||` (not `??`) so empty strings ("" from missing required cols on a
  // failed row) fall back to the friendly placeholder, instead of rendering
  // a blank cell.
  const nameDisplay = p.name?.trim() || 'Unknown';
  const roleDisplay = p.roleName?.trim() || '';
  const emailDisplay = p.email?.trim() || 'N/A';
  return (
    <tr className="border-b border-grey-100">
      <Td>{nameDisplay}</Td>
      <Td>
        {p.behaviorType ? (
          <ParticipantBehaviorBadge
            behavior={p.behaviorType as ParticipantBehavior}
            size="sm"
          />
        ) : (
          'N/A'
        )}
      </Td>
      <Td>{roleDisplay ? <RoleNameChip roleName={roleDisplay} /> : 'Unknown'}</Td>
      <Td className="text-neutral">{emailDisplay}</Td>
      <Td>{formatCurrency(p.investmentAmount ?? null)}</Td>
      <Td>{p.units == null ? 'N/A' : formatNumber(p.units)}</Td>
      <Td>{formatCurrency(p.pricePerUnit ?? null)}</Td>
      <Td align="right">
        {row.success ? (
          <span className="text-[13px] font-semibold text-success">OK</span>
        ) : (
          <span className="text-[13px] font-semibold text-danger" title={row.error ?? undefined}>
            Error
          </span>
        )}
      </Td>
    </tr>
  );
}

function Td({
  children,
  align = 'left',
  className,
}: Readonly<{
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}>) {
  return (
    <td
      className={cn(
        'px-[10px] py-[10px] text-[13px] text-foreground',
        align === 'right' && 'text-right',
        className,
      )}
    >
      {children}
    </td>
  );
}

/* ─── Step 3: Import Complete (1339:52847) ───────────────────────────────── */

type ImportCompleteStepProps = Readonly<{
  result: BulkImportResult;
  onClose: () => void;
  onReupload: () => void;
  onViewParticipants: () => void;
}>;

function ImportCompleteStep({
  result,
  onClose,
  onReupload,
  onViewParticipants,
}: ImportCompleteStepProps) {
  const [page, setPage] = useState(1);
  const importedCount = result.imported;
  const skippedRows = result.rows.filter((r) => !r.success);
  const skippedCount = skippedRows.length;
  const totalPages = Math.max(1, Math.ceil(skippedRows.length / PREVIEW_PAGE_SIZE));
  const pageStart = (page - 1) * PREVIEW_PAGE_SIZE;
  const visibleSkipped = skippedRows.slice(pageStart, pageStart + PREVIEW_PAGE_SIZE);
  const rangeStart = skippedCount === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + PREVIEW_PAGE_SIZE, skippedCount);

  const hasErrors = skippedCount > 0;
  const allFailed = importedCount === 0 && skippedCount > 0;

  return (
    <DialogContent className={hasErrors ? 'sm:max-w-[820px]' : 'sm:max-w-[520px]'}>
      <DialogHeader>
        <DialogTitle>Import Complete</DialogTitle>
        <DialogDescription className="sr-only">
          Bulk import results: {importedCount} imported, {skippedCount} skipped.
        </DialogDescription>
      </DialogHeader>

      {!hasErrors ? (
        <SuccessHero importedCount={importedCount} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-6 border-b border-border pb-3">
            {importedCount > 0 && (
              <span className="inline-flex items-center gap-2 text-[14px]">
                <CheckCircle2 aria-hidden className="size-4 text-success" strokeWidth={2} />
                <span className="text-success">
                  {formatNumber(importedCount)} participants imported successfully
                </span>
              </span>
            )}
            <span className="inline-flex items-center gap-2 text-[14px]">
              <AlertTriangle
                aria-hidden
                className="size-4 text-[#A16207]"
                strokeWidth={2}
              />
              <span className="text-[#A16207]">{formatNumber(skippedCount)} rows skipped</span>
            </span>
          </div>

          <div className="-mx-6 overflow-x-auto">
            <div className="min-w-[560px] px-6">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-grey-200 bg-grey-50">
                    <Th>Row</Th>
                    <Th>Name</Th>
                    <Th>Issue</Th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSkipped.map((row) => (
                    <tr key={row.row} className="border-b border-grey-100">
                      <Td>{row.row}</Td>
                      <Td>{row.participant?.name?.trim() || 'Unknown'}</Td>
                      <Td className="text-neutral">{row.error ?? 'Unknown error'}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between sm:gap-4">
            {totalPages > 1 ? (
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            ) : (
              <span aria-hidden />
            )}
            <p className="text-[13px] text-neutral" aria-live="polite">
              Showing <span className="font-semibold text-foreground">{formatNumber(rangeStart)}</span>{' '}
              to <span className="font-semibold text-foreground">{formatNumber(rangeEnd)}</span> of{' '}
              {formatNumber(skippedCount)}
            </p>
          </div>

          <Banner tone="warning" icon={null}>
            <p className="font-semibold">What now?</p>
            <ul className="ml-4 list-disc space-y-1">
              {importedCount > 0 && (
                <li>
                  {formatNumber(importedCount)} rows imported, visible in your Participants list.
                </li>
              )}
              <li>
                {formatNumber(skippedCount)} rows skipped. Easiest fix: download the error report,
                correct the rows, then re-upload.
              </li>
              <li>
                Re-upload won&apos;t duplicate existing rows (matched by email, then externalId).
              </li>
            </ul>
          </Banner>
        </>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onReupload}>
          <RotateCw className="size-4" aria-hidden />
          Re-upload
        </Button>
        {hasErrors && (
          <Button type="button" variant="outline" onClick={() => downloadImportErrors(result)}>
            <Download className="size-4" aria-hidden />
            Download errors
          </Button>
        )}
        {!allFailed && (
          <Button
            type="button"
            onClick={() => {
              onViewParticipants();
              onClose();
            }}
          >
            View Participants
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}

function SuccessHero({ importedCount }: Readonly<{ importedCount: number }>) {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-success/10">
        <CheckCircle2
          aria-hidden
          className="size-9 text-success"
          strokeWidth={1.75}
        />
      </div>
      <h3 className="text-[20px] font-semibold leading-[28px] tracking-[-0.4px] text-foreground">
        {importedCount === 1
          ? '1 participant imported'
          : `${formatNumber(importedCount)} participants imported`}
      </h3>
      <p className="max-w-[360px] text-[14px] leading-[20px] text-neutral">
        Everything went through cleanly. The new rows are now visible in your
        Participants list.
      </p>
    </div>
  );
}

/* ─── Step 4: Re-upload corrected CSV (1339:52893) ───────────────────────── */

type ReuploadCsvStepProps = Readonly<{
  isUploading: boolean;
  onFileChosen: (file: File) => void;
  onCancel: () => void;
}>;

function ReuploadCsvStep({ isUploading, onFileChosen, onCancel }: ReuploadCsvStepProps) {
  const [file, setFile] = useState<File | null>(null);

  // Re-upload skips the explicit "Upload & Preview" confirm step. The user
  // has already been through the first-time flow, so dropping a corrected
  // file auto-triggers the dry-run and transitions straight into Preview.
  function handleFileChange(next: File | null) {
    setFile(next);
    if (next) onFileChosen(next);
  }

  return (
    <DialogContent className="sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>Re-upload corrected CSV</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        {/* Dashed-border centered warning, matches the Figma re-upload frame.
            Uses the same golden palette as the Banner warning tone so the
            visual language stays consistent across the portal. */}
        <div className="rounded-[8px] border border-dashed border-[#A16207]/40 bg-[#FEFCE8] px-4 py-4 text-center text-[14px] leading-[20px] text-[#A16207]">
          Existing participants won&apos;t be duplicated. Rows are matched by
          email (primary), then externalId.
        </div>

        <CsvDropzone
          file={file}
          onFileChange={handleFileChange}
          disabled={isUploading}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>
          Cancel
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
