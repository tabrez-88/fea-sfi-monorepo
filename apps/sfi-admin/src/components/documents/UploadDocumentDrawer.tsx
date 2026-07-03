'use client';

import { ChevronDown, ChevronUp, FileText, Loader2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { DOCUMENT_TYPE_LABEL } from '@/constants/ui';
import { useUploadDocument } from '@/hooks/documents/useUploadDocument';
import { useRevenueBatches } from '@/hooks/revenue/useRevenueBatches';
import { getApiErrorMessage } from '@/lib/axios';
import { cn } from '@/lib/utils';
import { DocumentType } from '@/types/document.types';

/**
 * Upload Document drawer — right-side Sheet.
 *
 * Two states in the Figma design:
 *   - Empty:  drag & drop zone + "Browse File" button + Max 50MB hint.
 *   - Filled: File Selected panel (name / size / collapse toggle) +
 *             Document Type <select> + Link To <select> +
 *             Cancel / Upload footer.
 *
 * BE upload endpoint (`POST /deals/:dealId/documents`) is capped at 50 MB
 * (Wave 2 hardening). The allowed MIME/extension set here matches the
 * Nest FileTypeValidator on the server so we surface bad picks before
 * spending an upload round-trip.
 */

const MAX_FILE_BYTES = 50 * 1024 * 1024;

const ALLOWED_EXTS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.csv',
  '.png',
  '.jpg',
  '.jpeg',
] as const;

const ACCEPT_ATTR = ALLOWED_EXTS.join(',');

const DOC_TYPE_OPTIONS: ReadonlyArray<DocumentType> = [
  DocumentType.CONTRACT,
  DocumentType.AMENDMENT,
  DocumentType.OFFERING_DOCUMENT,
  DocumentType.INVESTOR_AGREEMENT,
  DocumentType.REVENUE_SHARE_TERMS,
  DocumentType.REVENUE_REPORT,
  DocumentType.SETTLEMENT_REPORT,
  DocumentType.AUDIT_REPORT,
  DocumentType.PROOF_RECORD,
  DocumentType.DISCLOSURE,
  DocumentType.OTHER,
];

const DEAL_SCOPE = 'deal' as const;

type LinkToValue = typeof DEAL_SCOPE | `batch:${string}`;

type UploadDocumentDrawerProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  /** Optional pre-selected batch to link the upload to. */
  defaultBatchId?: string;
}>;

export function UploadDocumentDrawer({
  open,
  onOpenChange,
  dealId,
  defaultBatchId,
}: UploadDocumentDrawerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType | ''>('');
  const [linkTo, setLinkTo] = useState<LinkToValue>(
    defaultBatchId ? (`batch:${defaultBatchId}` as const) : DEAL_SCOPE,
  );
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const uploadMutation = useUploadDocument();
  const { data: batchesData } = useRevenueBatches(dealId, { limit: 100 });
  const batches = batchesData?.data ?? [];

  useEffect(() => {
    if (!open) {
      setFile(null);
      setDocType('');
      setLinkTo(defaultBatchId ? (`batch:${defaultBatchId}` as const) : DEAL_SCOPE);
      setDetailsOpen(true);
      setValidationError(null);
      setDragging(false);
    }
  }, [open, defaultBatchId]);

  const validate = useCallback((candidate: File): string | null => {
    if (candidate.size > MAX_FILE_BYTES) return 'File is larger than 50MB.';
    const lower = candidate.name.toLowerCase();
    if (!ALLOWED_EXTS.some((ext) => lower.endsWith(ext))) {
      return 'Unsupported file type. Use PDF, DOC(X), XLS(X), CSV, PNG, or JPG.';
    }
    return null;
  }, []);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const first = files[0];
    if (!first) return;
    const err = validate(first);
    if (err) {
      setValidationError(err);
      setFile(null);
      return;
    }
    setValidationError(null);
    setFile(first);
  }

  function handleBrowse() {
    inputRef.current?.click();
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!dragging) setDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
  }

  const canSubmit = Boolean(file) && Boolean(docType) && !uploadMutation.isPending;

  async function handleSubmit() {
    if (!file || !docType) return;
    const revenueBatchId = linkTo.startsWith('batch:')
      ? linkTo.slice('batch:'.length)
      : null;

    try {
      await uploadMutation.mutateAsync({
        dealId,
        input: {
          file,
          docType,
          ...(revenueBatchId ? { revenueBatchId } : {}),
        },
      });
      toast.success(`${file.name} uploaded`);
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Upload failed. Please try again.'));
    }
  }

  const dropzoneLabel = useMemo(
    () => (dragging ? 'Release to attach the file' : 'Drag & drop your file here'),
    [dragging],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>Upload Document</SheetTitle>
        </SheetHeader>

        <SheetBody>
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                'flex flex-col items-center justify-center gap-4 rounded-[12px] border-2 border-dashed bg-white px-6 py-16 text-center transition-colors',
                dragging
                  ? 'border-foreground bg-grey-50'
                  : 'border-border hover:border-foreground/60',
              )}
            >
              <div className="flex size-16 items-center justify-center rounded-full bg-grey-100">
                <Upload className="size-7 text-neutral" aria-hidden />
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-[16px] font-medium leading-[22px] text-foreground">
                  {dropzoneLabel}
                </p>
                <p className="text-[13px] leading-[18px] text-neutral">
                  or click below to select from your computer
                </p>
              </div>
              <Button type="button" variant="outline" onClick={handleBrowse}>
                Browse File
              </Button>
              <p className="text-[12px] leading-[16px] text-neutral">
                Max 50MB. PDF, DOC, DOCX, XLS, XLSX, CSV, PNG, JPG.
              </p>
              {validationError && (
                <p role="alert" className="text-[13px] leading-[18px] text-danger">
                  {validationError}
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 rounded-[12px] border border-border bg-white p-4">
                <button
                  type="button"
                  onClick={() => setDetailsOpen((v) => !v)}
                  className="flex items-center justify-between gap-3 text-left"
                  aria-expanded={detailsOpen}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-grey-100">
                      <FileText className="size-5 text-neutral" aria-hidden />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[14px] font-medium leading-[20px] text-foreground">
                        {file.name}
                      </span>
                      <span className="text-[12px] leading-[16px] text-neutral">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="rounded-full p-1 text-neutral hover:bg-grey-50"
                      role="button"
                      tabIndex={0}
                      aria-label="Remove file"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          setFile(null);
                        }
                      }}
                    >
                      <X className="size-4" aria-hidden />
                    </span>
                    {detailsOpen ? (
                      <ChevronUp className="size-4 text-neutral" aria-hidden />
                    ) : (
                      <ChevronDown className="size-4 text-neutral" aria-hidden />
                    )}
                  </div>
                </button>
              </div>

              {detailsOpen && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="upload-doc-type">Document Type</Label>
                    <Select
                      value={docType}
                      onValueChange={(v) => setDocType(v as DocumentType)}
                    >
                      <SelectTrigger id="upload-doc-type" aria-label="Document Type">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOC_TYPE_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {DOCUMENT_TYPE_LABEL[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="upload-link-to">Link To</Label>
                    <Select
                      value={linkTo}
                      onValueChange={(v) => setLinkTo(v as LinkToValue)}
                    >
                      <SelectTrigger id="upload-link-to" aria-label="Link To">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DEAL_SCOPE}>
                          None (deal-level document)
                        </SelectItem>
                        {batches.length > 0 && batches.map((b) => (
                          <SelectItem key={b.id} value={`batch:${b.id}`}>
                            Revenue Batch #{b.batchNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[12px] leading-[16px] text-neutral">
                      Choose a revenue batch to attach this document to, or leave as a
                      deal-level document.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={ACCEPT_ATTR}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </SheetBody>

        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploadMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="size-4" aria-hidden />
                Upload
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
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
