'use client';

import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/BackLink';
import { DatePickerField } from '@/components/common/DatePickerField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROUTES } from '@/constants/routes';
import { useCreateBatch } from '@/hooks/revenue/useCreateBatch';
import { getApiErrorMessage } from '@/lib/axios';
import { cn } from '@/lib/utils';
import { Currency } from '@/types/deal.types';
import type {
  CreateRevenueBatchInput,
  CreateRevenueLineItemInput,
} from '@/types/revenue.types';
import { formatCurrency } from '@/utils/format';

const CURRENCY_OPTIONS: ReadonlyArray<Currency> = [
  Currency.USD,
  Currency.EUR,
  Currency.GBP,
  Currency.JPY,
  Currency.CHF,
  Currency.CAD,
  Currency.AUD,
];

const TERRITORY_PRESETS: ReadonlyArray<string> = [
  'Global',
  'US',
  'EU',
  'APAC',
  'Indonesia',
  'Latin America',
];

type LineItemRow = Readonly<{
  key: string;
  platformSource: string;
  amount: string;
}>;

type FieldErrors = Partial<
  Record<'totalAmount' | 'periodStart' | 'periodEnd' | 'period', string>
>;

let lineItemKeyCounter = 0;
function makeRowKey(): string {
  lineItemKeyCounter += 1;
  return `li-${lineItemKeyCounter}`;
}

type CreateRevenueBatchViewProps = Readonly<{
  dealId: string;
}>;

/**
 * MS-3 Screen 3.3 — Create Revenue Batch.
 *
 * Layout mirrors the Figma spec:
 *   - Total Amount + Currency row (required, both live-fields)
 *   - Reporting Period (Period Start + Period End, both required)
 *   - Source (optional, single line)
 *   - Categorization collapsible (Territory / Revenue Type / Reporting Entity)
 *   - Line Items collapsible (repeatable Platform/Source + Amount rows)
 *   - Bottom summary: line items total vs Total Amount (soft warning per
 *     Liang — not a hard error)
 *
 * BE contract: `POST /deals/:id/revenue-batches`. The DTO accepts an
 * optional `lineItems[]` (Wave 3 atomic create-with-lines) — we submit
 * only the rows that have BOTH a source label AND a positive amount so
 * the BE isn't asked to persist half-empty scaffolding rows.
 */
export function CreateRevenueBatchView({ dealId }: CreateRevenueBatchViewProps) {
  const router = useRouter();
  const createMutation = useCreateBatch();

  const [totalAmount, setTotalAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>(Currency.USD);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [source, setSource] = useState('');

  const [categorizationOpen, setCategorizationOpen] = useState(true);
  const [territory, setTerritory] = useState('Global');
  const [revenueType, setRevenueType] = useState('');
  const [reportingEntity, setReportingEntity] = useState('');

  const [lineItemsOpen, setLineItemsOpen] = useState(true);
  const [lineItems, setLineItems] = useState<ReadonlyArray<LineItemRow>>(() => [
    { key: makeRowKey(), platformSource: '', amount: '' },
    { key: makeRowKey(), platformSource: '', amount: '' },
  ]);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [attempted, setAttempted] = useState(false);

  const parsedTotal = Number(totalAmount);
  const totalIsValid =
    totalAmount.trim().length > 0 && Number.isFinite(parsedTotal) && parsedTotal >= 0;

  const lineItemsSum = useMemo(() => {
    return lineItems.reduce((acc, row) => {
      const n = Number(row.amount);
      return Number.isFinite(n) ? acc + n : acc;
    }, 0);
  }, [lineItems]);

  const hasPopulatedLineItems = lineItems.some(
    (r) => r.platformSource.trim().length > 0 || Number(r.amount) > 0,
  );

  const totalMismatch =
    totalIsValid && hasPopulatedLineItems && lineItemsSum !== parsedTotal;

  function updateLineItem(
    key: string,
    patch: Partial<Pick<LineItemRow, 'platformSource' | 'amount'>>,
  ) {
    setLineItems((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      { key: makeRowKey(), platformSource: '', amount: '' },
    ]);
  }

  function removeLineItem(key: string) {
    setLineItems((prev) =>
      prev.length <= 1 ? prev : prev.filter((row) => row.key !== key),
    );
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!totalIsValid) next.totalAmount = 'Enter a valid amount (0 or greater).';
    if (!periodStart) next.periodStart = 'Required.';
    if (!periodEnd) next.periodEnd = 'Required.';
    if (periodStart && periodEnd && periodStart >= periodEnd) {
      next.period = 'Period Start must be before Period End.';
    }
    return next;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAttempted(true);
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const trimmedSource = source.trim();
    const trimmedTerritory = territory.trim();
    const trimmedRevenueType = revenueType.trim();
    const trimmedReportingEntity = reportingEntity.trim();

    const cleanedLineItems: CreateRevenueLineItemInput[] = lineItems
      .map((row) => {
        const label = row.platformSource.trim();
        const amt = Number(row.amount);
        if (!label || !Number.isFinite(amt) || amt <= 0) return null;
        return { platformSource: label, amount: amt };
      })
      .filter((row): row is CreateRevenueLineItemInput => row !== null);

    const input: CreateRevenueBatchInput = {
      periodStart: new Date(`${periodStart}T00:00:00.000Z`).toISOString(),
      periodEnd: new Date(`${periodEnd}T23:59:59.999Z`).toISOString(),
      totalAmount: parsedTotal,
      currency,
      ...(trimmedSource ? { source: trimmedSource } : {}),
      ...(trimmedTerritory && trimmedTerritory !== 'Global'
        ? { territory: trimmedTerritory }
        : {}),
      ...(trimmedRevenueType ? { revenueType: trimmedRevenueType } : {}),
      ...(trimmedReportingEntity ? { reportingEntity: trimmedReportingEntity } : {}),
      ...(cleanedLineItems.length > 0 ? { lineItems: cleanedLineItems } : {}),
    };

    try {
      const created = await createMutation.mutateAsync({ dealId, input });
      toast.success(`Revenue batch ${created.batchNumber} created`);
      router.push(`${ROUTES.DEALS.REVENUE(dealId)}/${created.id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create batch.'));
    }
  }

  const showErr = (key: keyof FieldErrors) => attempted && errors[key];

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={ROUTES.DEALS.REVENUE(dealId)} label="Revenue Batches" />

      <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
        New Revenue Batch
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 rounded-[8px] border border-border bg-white p-4 sm:p-6"
        noValidate
      >
        {/* Total Amount + Currency */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup>
            <Label htmlFor="total-amount">
              Total Amount<span className="text-danger"> *</span>
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[16px] leading-[20px] text-neutral">
                $
              </span>
              <Input
                id="total-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0"
                className="pl-8"
                aria-invalid={Boolean(showErr('totalAmount'))}
              />
            </div>
            <FieldError message={showErr('totalAmount')} />
          </FieldGroup>

          <FieldGroup>
            <Label htmlFor="currency">
              Currency<span className="text-danger"> *</span>
            </Label>
            <Select
              value={currency}
              onValueChange={(v) => setCurrency(v as Currency)}
            >
              <SelectTrigger id="currency" aria-label="Currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
        </div>

        {/* Reporting Period */}
        <Fieldset legend="Reporting Period">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup>
              <Label htmlFor="period-start">
                Period Start<span className="text-danger"> *</span>
              </Label>
              <DatePickerField
                value={periodStart}
                onChange={setPeriodStart}
                placeholder="Start"
                ariaLabel="Period Start"
                ariaInvalid={Boolean(showErr('periodStart') || errors.period)}
              />
              <FieldError message={showErr('periodStart')} />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="period-end">
                Period End<span className="text-danger"> *</span>
              </Label>
              <DatePickerField
                value={periodEnd}
                onChange={setPeriodEnd}
                placeholder="End"
                ariaLabel="Period End"
                ariaInvalid={Boolean(showErr('periodEnd') || errors.period)}
              />
              <FieldError message={showErr('periodEnd')} />
            </FieldGroup>
          </div>
          {attempted && errors.period && (
            <p className="mt-2 text-[13px] leading-[18px] text-danger">
              {errors.period}
            </p>
          )}
        </Fieldset>

        {/* Source */}
        <FieldGroup>
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="source">Source</Label>
            <p className="text-[13px] leading-[18px] text-neutral">
              e.g., &quot;Q4 2026 Netflix Revenue&quot;
            </p>
          </div>
          <Input
            id="source"
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            maxLength={255}
            placeholder="Free-form label"
          />
        </FieldGroup>

        {/* Categorization (Optional) */}
        <CollapsibleSection
          title="Categorization (Optional)"
          open={categorizationOpen}
          onToggle={() => setCategorizationOpen((v) => !v)}
        >
          <FieldGroup>
            <Label htmlFor="territory">Territory</Label>
            <Select value={territory} onValueChange={setTerritory}>
              <SelectTrigger id="territory" aria-label="Territory">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TERRITORY_PRESETS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup>
              <Label htmlFor="revenue-type">Revenue Type</Label>
              <Input
                id="revenue-type"
                type="text"
                value={revenueType}
                onChange={(e) => setRevenueType(e.target.value)}
                maxLength={100}
                placeholder="Select or type"
              />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="reporting-entity">Reporting Entity</Label>
              <Input
                id="reporting-entity"
                type="text"
                value={reportingEntity}
                onChange={(e) => setReportingEntity(e.target.value)}
                maxLength={255}
                placeholder="Select or type"
              />
            </FieldGroup>
          </div>
        </CollapsibleSection>

        {/* Line Items */}
        <CollapsibleSection
          title="Line Items"
          open={lineItemsOpen}
          onToggle={() => setLineItemsOpen((v) => !v)}
        >
          <div className="flex flex-col gap-3">
            {lineItems.map((row) => (
              <div
                key={row.key}
                className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_44px]"
              >
                <FieldGroup>
                  <Label htmlFor={`li-${row.key}-source`}>Platform/Source</Label>
                  <Input
                    id={`li-${row.key}-source`}
                    type="text"
                    value={row.platformSource}
                    onChange={(e) =>
                      updateLineItem(row.key, { platformSource: e.target.value })
                    }
                    maxLength={255}
                    placeholder="Netflix"
                  />
                </FieldGroup>
                <FieldGroup>
                  <Label htmlFor={`li-${row.key}-amount`}>Amount</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[16px] leading-[20px] text-neutral">
                      $
                    </span>
                    <Input
                      id={`li-${row.key}-amount`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0}
                      value={row.amount}
                      onChange={(e) =>
                        updateLineItem(row.key, { amount: e.target.value })
                      }
                      className="pl-8"
                      placeholder="0"
                    />
                  </div>
                </FieldGroup>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeLineItem(row.key)}
                  disabled={lineItems.length <= 1}
                  aria-label="Remove line item"
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              onClick={addLineItem}
              className="w-full"
            >
              <Plus className="size-4" aria-hidden />
              Add Line Item
            </Button>
          </div>
        </CollapsibleSection>

        {/* Summary + warning */}
        <div className="flex flex-col gap-1 border-t border-border pt-4">
          <p className="text-[14px] leading-[20px] text-foreground">
            Line Items Total:{' '}
            <span className="font-semibold">
              {formatCurrency(lineItemsSum, currency)}
            </span>
          </p>
          {totalMismatch && (
            <p className="flex items-center gap-1.5 text-[13px] leading-[18px] text-warning">
              <AlertTriangle className="size-4" aria-hidden />
              Does not match Total Amount ({formatCurrency(parsedTotal, currency)})
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.DEALS.REVENUE(dealId))}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Creating...
              </>
            ) : (
              'Create Batch'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ─── Layout primitives ─────────────────────────────────────────────────── */

function FieldGroup({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="flex flex-col gap-1.5">{children}</div>;
}

function FieldError({ message }: Readonly<{ message: string | false | undefined }>) {
  if (!message) return null;
  return <p className="text-[13px] leading-[18px] text-danger">{message}</p>;
}

function Fieldset({
  legend,
  children,
}: Readonly<{ legend: string; children: React.ReactNode }>) {
  return (
    <fieldset className="flex flex-col gap-3 border-t border-border pt-4">
      <legend className="mb-1 text-[15px] font-semibold leading-[22px] text-foreground">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: Readonly<{
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}>) {
  return (
    <section className="flex flex-col gap-3 rounded-[8px] border border-border bg-white p-4">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex items-center justify-between gap-3 text-left"
      >
        <span className="text-[15px] font-semibold leading-[22px] text-foreground">
          {title}
        </span>
        {open ? (
          <ChevronUp className="size-4 text-neutral" aria-hidden />
        ) : (
          <ChevronDown className="size-4 text-neutral" aria-hidden />
        )}
      </button>
      {open && (
        <div className={cn('flex flex-col gap-4 pt-2')}>{children}</div>
      )}
    </section>
  );
}
