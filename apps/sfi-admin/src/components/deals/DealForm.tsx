'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { DatePickerField } from '@/components/common/DatePickerField';
import { DealFormField } from '@/components/deals/DealFormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DealStatus } from '@/types/deal.types';
import type { CreateDealInput, Deal, UpdateDealInput } from '@/types/deal.types';

type DealFormProps = Readonly<{
  initialDeal?: Deal;
  cancelHref: string;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: CreateDealInput & UpdateDealInput) => Promise<void> | void;
}>;

const DESCRIPTION_MAX = 2000;
const NAME_MAX = 255;

type FieldErrors = Partial<
  Record<'name' | 'effectiveDate' | 'terminationDate' | 'description', string>
>;

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function isoFromDateValue(dateStr: string): string {
  // Interpret the calendar selection in local time, then serialize ISO.
  return new Date(`${dateStr}T00:00:00`).toISOString();
}

/**
 * Shared Create / Edit Deal form body. Matches the Figma "Deal Create" frame:
 * a white outer card containing Deal Name + Description, then a **nested**
 * "Deal Details" card with Status / Effective Date / Termination Date in a
 * responsive row. Submit row is right-aligned at the bottom.
 */
export function DealForm({
  initialDeal,
  cancelHref,
  submitLabel,
  isSubmitting,
  onSubmit,
}: DealFormProps) {
  const [name, setName] = useState(initialDeal?.name ?? '');
  const [description, setDescription] = useState(initialDeal?.description ?? '');
  const [status, setStatus] = useState<DealStatus>(initialDeal?.status ?? DealStatus.DRAFT);
  const [effectiveDate, setEffectiveDate] = useState(toDateInputValue(initialDeal?.effectiveDate));
  const [terminationDate, setTerminationDate] = useState(
    toDateInputValue(initialDeal?.terminationDate),
  );
  const [errors, setErrors] = useState<FieldErrors>({});

  function validate(): FieldErrors | null {
    const next: FieldErrors = {};
    const trimmedName = name.trim();

    if (!trimmedName) next.name = 'Deal name is required.';
    else if (trimmedName.length > NAME_MAX)
      next.name = `Deal name must be ${NAME_MAX} characters or fewer.`;

    if (!effectiveDate) next.effectiveDate = 'Effective date is required.';

    if (effectiveDate && terminationDate && new Date(terminationDate) <= new Date(effectiveDate)) {
      next.terminationDate = 'Termination date must be after effective date.';
    }

    if (description.length > DESCRIPTION_MAX) {
      next.description = `Description must be ${DESCRIPTION_MAX} characters or fewer.`;
    }

    return Object.keys(next).length > 0 ? next : null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validate();
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    const values: CreateDealInput & UpdateDealInput = {
      name: name.trim(),
      status,
      effectiveDate: isoFromDateValue(effectiveDate),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(terminationDate ? { terminationDate: isoFromDateValue(terminationDate) } : {}),
    };

    await onSubmit(values);
  }

  const statusOptions = ['DRAFT', 'ACTIVE'] as const;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {/* Outer card: Deal Name + Description + nested Deal Details card */}
      <div className="flex flex-col gap-6 rounded-[8px] border border-border bg-white p-4 sm:p-6">
        <DealFormField
          id="deal-name"
          label="Deal Name"
          required
          {...(errors.name ? { error: errors.name } : {})}
        >
          <Input
            id="deal-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={NAME_MAX}
            aria-invalid={Boolean(errors.name)}
            placeholder='e.g. "The Last Horizon: Distribution Deal"'
            required
          />
        </DealFormField>

        <DealFormField
          id="deal-description"
          label="Description"
          helpText={`${description.length}/${DESCRIPTION_MAX} Characters`}
          {...(errors.description ? { error: errors.description } : {})}
        >
          <Textarea
            id="deal-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={DESCRIPTION_MAX}
            aria-invalid={Boolean(errors.description)}
            placeholder="Add a short summary of the deal, parties, and scope."
            rows={4}
          />
        </DealFormField>

        {/* Nested "Deal Details" card. Figma shows a heavier inner card */}
        <section className="flex flex-col gap-4 rounded-[8px] border border-border bg-white p-4 sm:p-5">
          <h2 className="text-[18px] font-semibold leading-[24px] tracking-[-0.36px] text-foreground">
            Deal Details
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <DealFormField id="deal-status" label="Status">
              <Select value={status} onValueChange={(value) => setStatus(value as DealStatus)}>
                <SelectTrigger id="deal-status" aria-label="Deal status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.charAt(0) + option.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </DealFormField>

            <DealFormField
              id="deal-effective-date"
              label="Effective Date"
              required
              {...(errors.effectiveDate ? { error: errors.effectiveDate } : {})}
            >
              <DatePickerField
                value={effectiveDate}
                onChange={setEffectiveDate}
                placeholder="Pick a start date"
                ariaLabel="Effective date"
                ariaInvalid={Boolean(errors.effectiveDate)}
              />
            </DealFormField>

            <DealFormField
              id="deal-termination-date"
              label="Termination Date"
              helpText="Optional - leave empty for ongoing deals"
              {...(errors.terminationDate ? { error: errors.terminationDate } : {})}
            >
              <DatePickerField
                value={terminationDate}
                onChange={setTerminationDate}
                placeholder="Pick an end date"
                ariaLabel="Termination date"
                ariaInvalid={Boolean(errors.terminationDate)}
              />
            </DealFormField>
          </div>
        </section>
      </div>

      <div className="flex flex-col-reverse items-stretch justify-end gap-2 sm:flex-row sm:items-center">
        <Button type="button" variant="outline" asChild disabled={isSubmitting}>
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
