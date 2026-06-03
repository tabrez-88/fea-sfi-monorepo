'use client';

import { useEffect, useState, type FormEvent } from 'react';

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
import type { DealStatus } from '@/types/deal.types';

type DealStatusChangeVariant = 'close' | 'suspend' | 'terminate' | 'archive';

type DealStatusChangeDialogProps = Readonly<{
  variant: DealStatusChangeVariant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealName: string;
  isSubmitting: boolean;
  /**
   * Called when the user confirms. `notes` is only populated for the suspend
   * variant; the close variant always passes `notes: undefined`.
   */
  onConfirm: (payload: { status: DealStatus; notes?: string }) => Promise<void> | void;
}>;

const NOTES_MAX = 1000;

const COPY: Record<
  DealStatusChangeVariant,
  Readonly<{
    title: string;
    description: string;
    confirmLabel: string;
    confirmClassName: string;
    status: DealStatus;
  }>
> = {
  close: {
    title: 'Complete Deal Confirmation',
    description:
      'Are you sure? Marking this deal Completed locks it for editing. You can still view it and any settlement history.',
    confirmLabel: 'Yes, Complete Deal',
    confirmClassName: 'bg-danger text-white hover:bg-danger/90',
    status: 'CLOSED',
  },
  suspend: {
    title: 'Pause Deal Confirmation',
    description:
      'Are you sure? The deal will be paused — participants and settlements stay read-only until you reactivate it.',
    confirmLabel: 'Yes, Pause Deal',
    confirmClassName: '',
    status: 'SUSPENDED',
  },
  terminate: {
    title: 'Terminate Deal Confirmation',
    description:
      'Are you sure? Terminated marks the deal as failed/cancelled. This is a final state — you can still view it but not edit.',
    confirmLabel: 'Yes, Terminate Deal',
    confirmClassName: 'bg-danger text-white hover:bg-danger/90',
    status: 'TERMINATED',
  },
  archive: {
    title: 'Archive Deal Confirmation',
    description:
      'Are you sure? Archived deals are hidden from the default list. You can restore by filtering by Archived.',
    confirmLabel: 'Yes, Archive Deal',
    confirmClassName: '',
    status: 'ARCHIVED',
  },
};

/**
 * Confirmation modal for changing a deal's status to CLOSED or SUSPENDED.
 * The suspend variant also collects an optional `notes` string, mapped to the
 * backend `UpdateDealDto.notes` field. Matches Figma modals `385:10528`
 * (Close) and `385:10564` (Suspend).
 */
export function DealStatusChangeDialog({
  variant,
  open,
  onOpenChange,
  dealName,
  isSubmitting,
  onConfirm,
}: DealStatusChangeDialogProps) {
  const copy = COPY[variant];
  const [notes, setNotes] = useState('');

  // Reset notes whenever the dialog reopens so stale text never bleeds across opens
  useEffect(() => {
    if (open) setNotes('');
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (variant === 'suspend') {
      const trimmed = notes.trim();
      await onConfirm({
        status: copy.status,
        ...(trimmed ? { notes: trimmed } : {}),
      });
    } else {
      await onConfirm({ status: copy.status });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{copy.title}</DialogTitle>
            <DialogDescription className="text-[14px] text-neutral">
              {copy.description}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-[8px] border border-border bg-grey-50 px-3 py-2 text-[13px] text-neutral">
            <span className="font-medium text-foreground">{dealName}</span>
          </div>

          {variant === 'suspend' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="suspend-notes">Notes</Label>
              <Textarea
                id="suspend-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={NOTES_MAX}
                placeholder="Write notes about this suspension…"
                rows={4}
              />
              <p className="text-[12px] text-neutral">
                {notes.length}/{NOTES_MAX} characters · optional
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={copy.confirmClassName || undefined}
            >
              {isSubmitting ? 'Saving…' : copy.confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
