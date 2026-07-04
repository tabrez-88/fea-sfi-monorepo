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
import type { RevenueBatch } from '@/types/revenue.types';

type RejectBatchDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: RevenueBatch | null;
  isPending: boolean;
  onConfirm: (rejectionReason: string) => void;
}>;

/**
 * Reject Batch confirmation dialog. BE `PATCH /revenue-batches/:id/reject`
 * requires a non-empty `rejectionReason` string, so this dialog gates the
 * Confirm button on that field being filled.
 */
export function RejectBatchDialog({
  open,
  onOpenChange,
  batch,
  isPending,
  onConfirm,
}: RejectBatchDialogProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  const trimmed = reason.trim();
  const canConfirm = trimmed.length > 0 && !isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Reject Revenue Batch</DialogTitle>
          <DialogDescription className="text-[14px] leading-[20px] text-neutral">
            {batch ? (
              <>
                Reject{' '}
                <span className="font-semibold text-foreground">
                  {batch.batchNumber}
                </span>
                . The batch stays in the audit trail; the rejection reason is
                stored on the record and shown on the batch header.
              </>
            ) : (
              'Reject this batch. The rejection reason is stored on the record.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reject-reason">
            Rejection Reason<span className="text-danger"> *</span>
          </Label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Numbers do not match the operator statement"
            disabled={isPending}
            aria-invalid={reason.length > 0 && trimmed.length === 0}
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
            onClick={() => onConfirm(trimmed)}
            disabled={!canConfirm}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Rejecting...
              </>
            ) : (
              'Reject Batch'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
