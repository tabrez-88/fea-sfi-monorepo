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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatNumber } from '@/utils/format';

const CONFIRM_WORD = 'FINALIZE';

type FinalizeSettlementDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-formatted total (currency-aware), e.g. "$200,000,000". */
  totalAllocated: string;
  participantCount: number;
  isPending: boolean;
  onConfirm: () => void;
}>;

/**
 * Finalize Settlement confirmation (Screen 4.4 modal). Finalize is the
 * one irreversible action in the whole app (it locks allocations,
 * writes ledger entries, and flips revenue batches to PROCESSED), so it
 * uses a type-to-confirm gate instead of a plain confirm button.
 */
export function FinalizeSettlementDialog({
  open,
  onOpenChange,
  totalAllocated,
  participantCount,
  isPending,
  onConfirm,
}: FinalizeSettlementDialogProps) {
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!open) setConfirmText('');
  }, [open]);

  const confirmed = confirmText.trim().toUpperCase() === CONFIRM_WORD;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Finalize Settlement</DialogTitle>
          <DialogDescription className="text-[14px] leading-[20px] text-neutral">
            Are you absolutely sure? This action is{' '}
            <span className="font-bold text-danger">IRREVERSIBLE</span>. Once
            finalized, you cannot undo or edit this computation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 rounded-[8px] border border-border p-4">
          <div className="grid grid-cols-[140px_10px_1fr] gap-2">
            <span className="text-[13px] font-medium text-foreground">
              Total Allocated
            </span>
            <span className="text-[13px] text-neutral">:</span>
            <span className="text-[13px] font-semibold text-foreground">
              {totalAllocated}
            </span>
          </div>
          <div className="grid grid-cols-[140px_10px_1fr] gap-2">
            <span className="text-[13px] font-medium text-foreground">
              Total Participants
            </span>
            <span className="text-[13px] text-neutral">:</span>
            <span className="text-[13px] font-semibold text-foreground">
              {formatNumber(participantCount)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="finalize-confirm">
            Type {CONFIRM_WORD} to confirm<span className="text-danger"> *</span>
          </Label>
          <Input
            id="finalize-confirm"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_WORD}
            disabled={isPending}
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col gap-1 rounded-[8px] bg-warning/5 px-4 py-3">
          <p className="text-[13px] font-semibold leading-[18px] text-warning">
            What happens next:
          </p>
          <ul className="list-disc space-y-0.5 pl-5 text-[13px] leading-[18px] text-warning">
            <li>Allocations will be permanently locked</li>
            <li>Ledger entries will be created</li>
            <li>Revenue batches will be marked as PROCESSED</li>
            <li>Proof record will be generated</li>
          </ul>
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
            onClick={onConfirm}
            disabled={!confirmed || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Finalizing...
              </>
            ) : (
              'Finalize'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
