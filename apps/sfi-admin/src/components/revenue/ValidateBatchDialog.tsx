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

type ValidateBatchDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: RevenueBatch | null;
  isPending: boolean;
  onConfirm: (validationNotes: string) => void;
}>;

/**
 * Validate Batch confirmation dialog. BE `PATCH /revenue-batches/:id/validate`
 * accepts an optional `validationNotes` string which lands on the audit-log
 * entry (and `metadata.validationNotes`).
 */
export function ValidateBatchDialog({
  open,
  onOpenChange,
  batch,
  isPending,
  onConfirm,
}: ValidateBatchDialogProps) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) setNotes('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Validate Revenue Batch</DialogTitle>
          <DialogDescription className="text-[14px] leading-[20px] text-neutral">
            {batch ? (
              <>
                Mark{' '}
                <span className="font-semibold text-foreground">
                  {batch.batchNumber}
                </span>{' '}
                as validated. Once validated it becomes eligible for settlement runs.
              </>
            ) : (
              'Mark this batch as validated.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="validate-notes">Validation Notes (optional)</Label>
          <Textarea
            id="validate-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Numbers reconciled against Netflix Q4 statement"
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
            onClick={() => onConfirm(notes.trim())}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Validating...
              </>
            ) : (
              'Validate Batch'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
