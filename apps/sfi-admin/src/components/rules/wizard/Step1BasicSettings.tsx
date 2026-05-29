'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { DatePickerField } from '@/components/common/DatePickerField';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import type { WizardStep1Data } from './wizard-state.types';

const NOTES_MAX = 2000;

type FieldErrors = Partial<Record<'effectiveFrom' | 'notes', string>>;

type Step1Props = Readonly<{
  initialValues: WizardStep1Data;
  cancelHref: string;
  /** Called when the user clicks Next and Step 1 validates clean. */
  onNext: (values: WizardStep1Data) => void;
}>;

/**
 * Step 1 of the Create Rule Snapshot wizard: Basic Settings.
 * Matches the Figma frame `1299:9667` (Effective From date picker + Notes
 * textarea, Cancel + Next footer).
 *
 * Validation:
 *   - Effective From is required.
 *   - Notes is optional (capped at 2000 chars to match the existing Deal
 *     description constraint).
 */
export function Step1BasicSettings({ initialValues, cancelHref, onNext }: Step1Props) {
  const [effectiveFrom, setEffectiveFrom] = useState(initialValues.effectiveFrom);
  const [notes, setNotes] = useState(initialValues.notes);
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: FieldErrors = {};
    if (!effectiveFrom) next.effectiveFrom = 'Effective date is required.';
    if (notes.length > NOTES_MAX) {
      next.notes = `Notes must be ${NOTES_MAX} characters or fewer.`;
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    onNext({ effectiveFrom, notes });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-6 rounded-[8px] border border-border bg-white p-4 sm:p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-bold leading-[28px] tracking-[-0.4px] text-foreground">
          Basic Settings
        </h2>
        <span className="text-[14px] font-medium text-neutral">Step 1 of 3</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="rule-effective-from"
          className="text-[14px] font-medium leading-[20px] text-foreground"
        >
          Effective From
          <span className="ml-1 text-danger">*</span>
        </Label>
        <DatePickerField
          value={effectiveFrom}
          onChange={(next) => {
            setEffectiveFrom(next);
            if (errors.effectiveFrom) {
              setErrors((prev) => {
                const copy = { ...prev };
                delete copy.effectiveFrom;
                return copy;
              });
            }
          }}
          placeholder="Today"
          ariaLabel="Effective from date"
        />
        {errors.effectiveFrom ? (
          <p role="alert" className="text-[12px] leading-[16px] text-danger">
            {errors.effectiveFrom}
          </p>
        ) : (
          <p className="text-[12px] leading-[16px] text-neutral">
            This snapshot takes effect from this date. The previous snapshot
            (if any) will be closed automatically.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="rule-notes"
          className="text-[14px] font-medium leading-[20px] text-foreground"
        >
          Notes
        </Label>
        <Textarea
          id="rule-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write a notes..."
          rows={4}
          aria-invalid={Boolean(errors.notes)}
          className={cn(errors.notes && 'border-danger')}
        />
        {errors.notes ? (
          <p role="alert" className="text-[12px] leading-[16px] text-danger">
            {errors.notes}
          </p>
        ) : (
          <p className="text-[12px] leading-[16px] text-neutral">
            Optional. Describe what changed in this version.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button asChild type="button" variant="outline">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  );
}
