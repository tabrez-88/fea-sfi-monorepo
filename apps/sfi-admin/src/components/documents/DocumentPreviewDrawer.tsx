'use client';

import { Download, FileText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { DOCUMENT_TYPE_LABEL, DOCUMENT_TYPE_TONE } from '@/constants/ui';
import { cn } from '@/lib/utils';
import type { Document } from '@/types/document.types';
import { formatDate } from '@/utils/date';

type DocumentPreviewDrawerProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: Document | null;
}>;

/**
 * Document Preview drawer — right-side Sheet.
 *
 * Shows metadata (upload date, file info bar, linked-entity chip) plus a
 * PDF/image preview area. PDFs render inline via `<iframe>`; images render
 * via `<img>`. Non-previewable types (DOC, XLS, CSV) fall back to a
 * placeholder + Download button.
 */
export function DocumentPreviewDrawer({
  open,
  onOpenChange,
  doc,
}: DocumentPreviewDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        aria-describedby={undefined}
        className="sm:max-w-[640px]"
      >
        <SheetHeader>
          <SheetTitle>Document Preview</SheetTitle>
          {doc && (
            <p className="text-[13px] leading-[18px] text-neutral">
              Uploaded {formatDate(doc.uploadedAt)}
            </p>
          )}
        </SheetHeader>

        <SheetBody>
          {doc ? (
            <>
              <div className="flex flex-col gap-3 rounded-[12px] border border-border bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-grey-100">
                    <FileText className="size-5 text-neutral" aria-hidden />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span
                      className="truncate text-[14px] font-medium leading-[20px] text-foreground"
                      title={doc.fileName}
                    >
                      {doc.fileName}
                    </span>
                    <span className="text-[12px] leading-[16px] text-neutral">
                      {formatFileSize(doc.fileSize)}
                    </span>
                  </div>
                  <Badge
                    size="sm"
                    variant={DOCUMENT_TYPE_TONE[doc.docType]}
                    className="whitespace-nowrap"
                  >
                    {DOCUMENT_TYPE_LABEL[doc.docType]}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <span className="text-[12px] font-medium leading-[16px] text-neutral">
                    Linked to
                  </span>
                  <Badge size="sm" variant="neutral">
                    {doc.linkedTo.label}
                  </Badge>
                </div>
              </div>

              <PreviewSurface doc={doc} />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-[12px] border border-dashed border-border p-10 text-center">
              <p className="text-[14px] text-neutral">No document selected.</p>
            </div>
          )}
        </SheetBody>

        <SheetFooter>
          {doc && (
            <Button asChild variant="outline">
              <a href={doc.storageUrl} target="_blank" rel="noreferrer">
                <Download className="size-4" aria-hidden />
                Download
              </a>
            </Button>
          )}
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function PreviewSurface({ doc }: Readonly<{ doc: Document }>) {
  const mime = doc.mimeType?.toLowerCase() ?? '';
  const lowerName = doc.fileName.toLowerCase();
  const isPdf = mime.includes('pdf') || lowerName.endsWith('.pdf');
  const isImage =
    mime.startsWith('image/') ||
    lowerName.endsWith('.png') ||
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.jpeg');

  const surface =
    'flex min-h-[320px] flex-1 items-center justify-center rounded-[12px] border-2 border-dashed border-border bg-grey-50 p-2';

  if (isPdf) {
    return (
      <div className={cn(surface, 'p-0 overflow-hidden')}>
        <iframe
          src={doc.storageUrl}
          title={doc.fileName}
          className="h-[520px] w-full bg-white"
        />
      </div>
    );
  }

  if (isImage) {
    return (
      <div className={surface}>
        {/* eslint-disable-next-line @next/next/no-img-element -- signed S3 URL: needs no next/image remotePatterns config */}
        <img
          src={doc.storageUrl}
          alt={doc.fileName}
          className="max-h-[520px] max-w-full rounded-[8px] object-contain"
        />
      </div>
    );
  }

  return (
    <div className={cn(surface, 'flex-col gap-2 text-center')}>
      <FileText className="size-8 text-neutral" aria-hidden />
      <p className="text-[14px] font-medium leading-[20px] text-foreground">
        Preview not available
      </p>
      <p className="text-[13px] leading-[18px] text-neutral">
        This file type can&apos;t be previewed here. Use the Download button to
        open it locally.
      </p>
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
