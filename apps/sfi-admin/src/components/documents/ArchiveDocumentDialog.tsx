'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Document } from '@/types/document.types';

type ArchiveDocumentDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: Document | null;
  isPending: boolean;
  onConfirm: (reason: string) => void;
}>;

/**
 * Archive Document confirmation modal (Figma frame 1).
 *
 * The design adds a Reason textarea over the standard destructive
 * confirmation modal — Liang wants an auditable reason string on every
 * archive since the row disappears from the default list. The BE
 * `POST /documents/:id/archive` accepts an optional `reason` field which
 * lands on the audit-log entry.
 */
export function ArchiveDocumentDialog({
  open,
  onOpenChange,
  doc,
  isPending,
  onConfirm,
}: ArchiveDocumentDialogProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Archive Document</DialogTitle>
          <DialogDescription className="text-[14px] leading-[20px] text-neutral">
            {doc ? (
              <>
                Are you sure you want to archive{' '}
                <span className="font-semibold text-foreground">{doc.fileName}</span>?
                The file stays in the audit trail and can be restored later.
              </>
            ) : (
              'Are you sure you want to archive this document?'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="archive-reason">Reason</Label>
          <Textarea
            id="archive-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Replaced with an updated version"
            disabled={isPending}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => onConfirm(reason.trim())}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Archiving...
              </>
            ) : (
              'Confirm Archive'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
