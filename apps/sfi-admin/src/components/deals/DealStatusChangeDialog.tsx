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

export type DealStatusChangeVariant =
  | 'activate'
  | 'draft'
  | 'close'
  | 'suspend'
  | 'terminate'
  | 'archive';

/** Target status -> dialog variant, for the Change Status menu. */
export const STATUS_TO_VARIANT: Record<DealStatus, DealStatusChangeVariant> = {
  DRAFT: 'draft',
  ACTIVE: 'activate',
  SUSPENDED: 'suspend',
  CLOSED: 'close',
  TERMINATED: 'terminate',
  ARCHIVED: 'archive',
};

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
  activate: {
    title: 'Activate Deal Confirmation',
    description:
      'Set this deal back to Active. Revenue can be reported, settlement runs can be executed, and participants receive allocations per the active Rule Snapshot.',
    confirmLabel: 'Yes, Activate Deal',
    confirmClassName: '',
    status: 'ACTIVE',
  },
  draft: {
    title: 'Move Deal to Draft',
    description:
      'Set this deal back to Draft so it can be reconfigured. Existing participants, rules, and revenue stay attached; the deal is simply no longer treated as in effect.',
    confirmLabel: 'Yes, Move to Draft',
    confirmClassName: '',
    status: 'DRAFT',
  },
  close: {
    title: 'Complete Deal Confirmation',
    description:
      'Are you sure? Marking this deal Completed means it ended as planned. You can still view it and any settlement history, and you can change the status again later.',
    confirmLabel: 'Yes, Complete Deal',
    confirmClassName: 'bg-danger text-white hover:bg-danger/90',
    status: 'CLOSED',
  },
  suspend: {
    title: 'Pause Deal Confirmation',
    description:
      'Are you sure? The deal will be paused. No new settlement runs should occur while it is paused, and you can reactivate it at any time.',
    confirmLabel: 'Yes, Pause Deal',
    confirmClassName: '',
    status: 'SUSPENDED',
  },
  terminate: {
    title: 'Terminate Deal Confirmation',
    description:
      'Are you sure? Terminated means the deal ended before its planned completion (cancellation, buyout, restructuring, legal termination). You can still view it and change the status again later.',
    confirmLabel: 'Yes, Terminate Deal',
    confirmClassName: 'bg-danger text-white hover:bg-danger/90',
    status: 'TERMINATED',
  },
  archive: {
    title: 'Archive Deal Confirmation',
    description:
      'Are you sure? Archived deals are kept as a historical record and hidden from active workflows, but stay available for audit and reporting. You can restore by filtering by Archived.',
    confirmLabel: 'Yes, Archive Deal',
    confirmClassName: '',
    status: 'ARCHIVED',
  },
};

/**
 * Confirmation modal for any deal status change. The suspend variant also
 * collects an optional `notes` string, mapped to the backend
 * `UpdateDealDto.notes` field. Matches Figma modals `385:10528` (Close) and
 * `385:10564` (Suspend).
 *
 * Every status is reachable from every other one. Terminal states used to be
 * one-way, which left Liang (08/18) with Completed deals she could only
 * duplicate: no way back to Active, no way to Archive, no way to delete.
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
