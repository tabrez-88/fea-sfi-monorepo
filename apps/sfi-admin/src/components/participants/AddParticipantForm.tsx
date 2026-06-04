'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, type FormEvent } from 'react';

import { Banner } from '@/components/common/Banner';
import { RoleNameInput } from '@/components/participants/RoleNameInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  ParticipantBehavior,
  type CreateParticipantInput,
} from '@/types/participant.types';
import { formatCurrency } from '@/utils/format';

type AddParticipantFormProps = Readonly<{
  dealId: string;
  /** Used by the bottom Cancel button when `onCancel` is not provided. */
  cancelHref?: string;
  /**
   * When provided, the bottom Cancel button runs this callback instead of
   * navigating to `cancelHref`. Used by the detail/edit page so Cancel means
   * "exit edit mode" (revert + disable fields) rather than "leave page".
   */
  onCancel?: () => void;
  isSubmitting: boolean;
  onSubmit: (input: CreateParticipantInput) => Promise<void> | void;
  /** Pre-filled values for edit mode. Omit for create mode (everything blank). */
  initialValues?: Partial<CreateParticipantInput>;
  /** Submit button label. Defaults to "Add Participant". */
  submitLabel?: string;
  /** Submit-button-pending label. Defaults to "Adding...". */
  submittingLabel?: string;
  /**
   * Read-only mode: wraps the field rows in `<fieldset disabled>` so every
   * input/radio/checkbox/button inside ignores interaction, and the entire
   * footer (Cancel + Save) is hidden. The page-level toggle in the detail
   * container flips this between the view and edit states.
   */
  disabled?: boolean;
}>;

type FieldErrors = Partial<
  Record<
    'name' | 'roleName' | 'email' | 'investmentAmount' | 'units' | 'pricePerUnit',
    string
  >
>;

const NAME_MAX = 255;
const ROLE_MAX = 100;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type BehaviorOption = Readonly<{
  value: ParticipantBehavior;
  label: string;
  description: string;
}>;

const BEHAVIOR_OPTIONS: ReadonlyArray<BehaviorOption> = [
  {
    value: ParticipantBehavior.FEE_DEDUCTION,
    label: 'Fee Deduction',
    description: 'Takes a fee before revenue distribution',
  },
  {
    value: ParticipantBehavior.RECOUPMENT,
    label: 'Recoupment',
    description: 'Recovers invested capital before revenue sharing',
  },
  {
    value: ParticipantBehavior.NET_PROFIT_SHARE,
    label: 'Revenue Share',
    description: 'Receives a percentage of Gross Revenue or Net Revenue',
  },
  {
    value: ParticipantBehavior.FLAT_FEE,
    label: 'Fixed Payment',
    description: 'Receives a Fixed payment, no percentage of revenue',
  },
];

function parseOptionalNumber(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Create / Add Participant form. Matches the Figma frames `1299:7231`
 * (Fee Deduction default) and `1299:7260` (Recoupment with Investment
 * Details section revealed). Inline behavior radio group, warning Banner
 * note, conditional Investment Details card when behavior is Recoupment,
 * Email + External ID fields, footer with Cancel + Add Participant.
 *
 * Investment-section behavior:
 * - The "Part of Investor Pool" checkbox toggles `poolMember`. Default ON
 *   when the section first becomes visible, matching the design.
 * - `pricePerUnit` auto-computes from `investmentAmount / units` while the
 *   user has not manually edited that field. Typing into the field flips
 *   it into "manually set" mode; the Reset button reverts to auto-compute.
 * - All three investment fields are sent only when populated. The BE
 *   derives `pricePerUnit` server-side when omitted but both other fields
 *   are present, so we mirror that behavior on submit.
 */
export function AddParticipantForm({
  dealId,
  cancelHref,
  onCancel,
  isSubmitting,
  onSubmit,
  initialValues,
  submitLabel = 'Add Participant',
  submittingLabel = 'Adding...',
  disabled = false,
}: AddParticipantFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [roleName, setRoleName] = useState(initialValues?.roleName ?? '');
  const [behaviorType, setBehaviorType] = useState<ParticipantBehavior>(
    initialValues?.behaviorType ?? ParticipantBehavior.FEE_DEDUCTION,
  );
  // Default pool checkbox: ON when first-time creating (matches the Figma).
  // For edit mode, honor the stored value (false if explicitly unchecked).
  const [poolMember, setPoolMember] = useState(initialValues?.poolMember ?? true);
  const [investmentAmount, setInvestmentAmount] = useState(
    initialValues?.investmentAmount == null ? '' : String(initialValues.investmentAmount),
  );
  const [units, setUnits] = useState(
    initialValues?.units == null ? '' : String(initialValues.units),
  );
  const [pricePerUnit, setPricePerUnit] = useState(
    initialValues?.pricePerUnit == null ? '' : String(initialValues.pricePerUnit),
  );
  // If we landed here in edit mode AND the persisted price differs from the
  // auto-computed (investment / units), the user must have manually overridden
  // at some point — start in "manually set" mode so the Reset button shows up.
  const [priceManuallySet, setPriceManuallySet] = useState(() => {
    const inv = initialValues?.investmentAmount;
    const u = initialValues?.units;
    const p = initialValues?.pricePerUnit;
    if (p == null || inv == null || u == null || u === 0) return false;
    return Math.abs(p - inv / u) > 1e-6;
  });
  const [email, setEmail] = useState(initialValues?.email ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});

  // Round 4 (Liang) #9: Revenue Share also supports an investor pool
  // (the "Revenue Share Pool" pattern — investors buy units, pool gets
  // a % of gross/net for a defined term, no recoupment cap). Same
  // Investment / Units / Price Per Unit fields apply; the recoupment
  // semantics just don't fire downstream in the engine when the
  // snapshot mode is revenue_share. Both behaviors expose the same
  // form card to keep the data model uniform.
  const showInvestmentCard =
    behaviorType === ParticipantBehavior.RECOUPMENT ||
    behaviorType === ParticipantBehavior.NET_PROFIT_SHARE;

  const computedPrice = useMemo(() => {
    const inv = Number(investmentAmount);
    const u = Number(units);
    if (!Number.isFinite(inv) || !Number.isFinite(u)) return null;
    if (inv <= 0 || u <= 0) return null;
    return inv / u;
  }, [investmentAmount, units]);

  const displayedPrice = priceManuallySet
    ? pricePerUnit
    : computedPrice !== null
      ? computedPrice.toString()
      : pricePerUnit;

  function handlePriceChange(value: string) {
    setPricePerUnit(value);
    setPriceManuallySet(true);
  }

  function handleResetPrice() {
    setPriceManuallySet(false);
    setPricePerUnit('');
  }

  function validate(): FieldErrors | null {
    const next: FieldErrors = {};
    const trimmedName = name.trim();
    const trimmedRole = roleName.trim();

    if (!trimmedName) next.name = 'Name is required.';
    else if (trimmedName.length > NAME_MAX)
      next.name = `Name must be ${NAME_MAX} characters or fewer.`;

    if (!trimmedRole) next.roleName = 'Role name is required.';
    else if (trimmedRole.length > ROLE_MAX)
      next.roleName = `Role name must be ${ROLE_MAX} characters or fewer.`;

    if (email && !EMAIL_RE.test(email.trim())) {
      next.email =
        "Email format looks off (e.g. name@example.com). Leave blank if you don't have one.";
    }

    if (investmentAmount && Number(investmentAmount) < 0) {
      next.investmentAmount = 'Investment amount cannot be negative.';
    }
    if (units && Number(units) < 0) {
      next.units = 'Units cannot be negative.';
    }
    if (
      priceManuallySet &&
      pricePerUnit &&
      Number(pricePerUnit) < 0
    ) {
      next.pricePerUnit = 'Price per unit cannot be negative.';
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

    const input: CreateParticipantInput = {
      name: name.trim(),
      roleName: roleName.trim(),
      behaviorType,
    };

    if (email.trim()) input.email = email.trim();

    if (showInvestmentCard) {
      input.poolMember = poolMember;
      const inv = parseOptionalNumber(investmentAmount);
      const u = parseOptionalNumber(units);
      if (inv !== undefined) input.investmentAmount = inv;
      if (u !== undefined) input.units = u;
      // Only forward pricePerUnit when the user manually set it; otherwise let
      // the BE derive it from investmentAmount / units.
      if (priceManuallySet) {
        const p = parseOptionalNumber(pricePerUnit);
        if (p !== undefined) input.pricePerUnit = p;
      }
    }

    await onSubmit(input);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-6 rounded-[8px] border border-border bg-white p-4 sm:p-6"
    >
      {/*
        Outer fieldset gates every form control (inputs, radios, the pool
        checkbox, the Reset button) on the `disabled` prop. `display:contents`
        keeps the existing flex layout intact — fieldset itself doesn't render
        a box, just propagates the disabled state down.
      */}
      <fieldset disabled={disabled} className="contents">
        <Field id="participant-name" label="Name" required error={errors.name}>
          <Input
            id="participant-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Input your participant name..."
            autoComplete="off"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'participant-name-error' : undefined}
          />
        </Field>

        <Field id="participant-role" label="Role Name" required error={errors.roleName}>
          <RoleNameInput
            id="participant-role"
            dealId={dealId}
            value={roleName}
            onChange={setRoleName}
            placeholder="Type or select a role..."
            aria-invalid={Boolean(errors.roleName)}
            aria-describedby={errors.roleName ? 'participant-role-error' : undefined}
          />
        </Field>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-[14px] font-medium leading-[20px] text-foreground">
            Default Payment Behavior
          </legend>
          <div className="flex flex-col gap-3">
            {BEHAVIOR_OPTIONS.map((option) => (
              <BehaviorRadio
                key={option.value}
                option={option}
                checked={behaviorType === option.value}
                onChange={() => setBehaviorType(option.value)}
              />
            ))}
          </div>
        </fieldset>

        <Banner tone="warning">
          You can leave this at the default and set the actual behavior per deal
          when you build a Rule Snapshot.
        </Banner>

        {showInvestmentCard && (
          <InvestmentDetailsCard
            poolMember={poolMember}
            onPoolMemberChange={setPoolMember}
            investmentAmount={investmentAmount}
            onInvestmentChange={setInvestmentAmount}
            units={units}
            onUnitsChange={setUnits}
            displayedPrice={displayedPrice}
            priceManuallySet={priceManuallySet}
            onPriceChange={handlePriceChange}
            onPriceReset={handleResetPrice}
            computedPrice={computedPrice}
            errors={errors}
          />
        )}

        <Field
          id="participant-email"
          label="Email"
          error={errors.email}
          helpText="Optional. Leave blank if you don't have one."
        >
          <Input
            id="participant-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. name@example.com"
            autoComplete="off"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'participant-email-error' : undefined}
          />
        </Field>
      </fieldset>

      {!disabled && (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          ) : cancelHref ? (
            <Button asChild type="button" variant="outline">
              <Link href={cancelHref}>Cancel</Link>
            </Button>
          ) : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? submittingLabel : submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}

/* ─── Sub-components ────────────────────────────────────────────────────── */

type FieldProps = Readonly<{
  id: string;
  label: string;
  required?: boolean;
  error?: string | undefined;
  helpText?: string | undefined;
  children: React.ReactNode;
}>;

function Field({ id, label, required, error, helpText, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-[14px] font-medium leading-[20px] text-foreground">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[12px] leading-[16px] text-danger">
          {error}
        </p>
      ) : (
        helpText && (
          <p className="text-[12px] leading-[16px] text-neutral">{helpText}</p>
        )
      )}
    </div>
  );
}

type BehaviorRadioProps = Readonly<{
  option: BehaviorOption;
  checked: boolean;
  onChange: () => void;
}>;

function BehaviorRadio({ option, checked, onChange }: BehaviorRadioProps) {
  const inputId = `behavior-${option.value}`;
  return (
    <label
      htmlFor={inputId}
      className="flex cursor-pointer items-start gap-3"
    >
      {/* Fixed-size white circle with a bold black border. Selected state
          places a smaller black dot inside; the outer circle and white
          surface never change size or color, matching the Figma radio. */}
      <span
        className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full border-2 border-foreground bg-white"
        aria-hidden
      >
        <span
          className={cn(
            'size-[10px] rounded-full bg-foreground transition-opacity',
            checked ? 'opacity-100' : 'opacity-0',
          )}
        />
      </span>
      <input
        id={inputId}
        type="radio"
        name="behaviorType"
        value={option.value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className="flex flex-col">
        <span className="text-[14px] font-semibold leading-[20px] text-foreground">
          {option.label}
        </span>
        <span className="text-[12px] leading-[16px] text-neutral">
          {option.description}
        </span>
      </span>
    </label>
  );
}

type InvestmentDetailsCardProps = Readonly<{
  poolMember: boolean;
  onPoolMemberChange: (next: boolean) => void;
  investmentAmount: string;
  onInvestmentChange: (next: string) => void;
  units: string;
  onUnitsChange: (next: string) => void;
  displayedPrice: string;
  priceManuallySet: boolean;
  onPriceChange: (next: string) => void;
  onPriceReset: () => void;
  computedPrice: number | null;
  errors: FieldErrors;
}>;

function InvestmentDetailsCard({
  poolMember,
  onPoolMemberChange,
  investmentAmount,
  onInvestmentChange,
  units,
  onUnitsChange,
  displayedPrice,
  priceManuallySet,
  onPriceChange,
  onPriceReset,
  computedPrice,
  errors,
}: InvestmentDetailsCardProps) {
  const investmentNum = Number(investmentAmount);
  const unitsNum = Number(units);
  const showComputed =
    computedPrice !== null && Number.isFinite(investmentNum) && Number.isFinite(unitsNum);

  return (
    <div className="flex flex-col gap-4 rounded-[8px] border border-border bg-white">
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:px-5">
        <PoolMemberToggle
          checked={poolMember}
          onChange={onPoolMemberChange}
        />
        <p className="pl-[28px] text-[12px] leading-[16px] text-neutral">
          Pool members split pool payouts proportionally by units held.
        </p>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-4 sm:px-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            id="investment-amount"
            label="Investment Amount"
            error={errors.investmentAmount}
          >
            <Input
              id="investment-amount"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={investmentAmount}
              onChange={(e) => onInvestmentChange(e.target.value)}
              placeholder="$50,000"
            />
          </Field>
          <Field id="units-held" label="Units Held" error={errors.units}>
            <Input
              id="units-held"
              type="number"
              inputMode="numeric"
              min={0}
              step="1"
              value={units}
              onChange={(e) => onUnitsChange(e.target.value)}
              placeholder="500"
            />
          </Field>
        </div>

        <Field id="price-per-unit" label="Price per Unit" error={errors.pricePerUnit}>
          <Input
            id="price-per-unit"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={displayedPrice}
            onChange={(e) => onPriceChange(e.target.value)}
            placeholder="$100"
          />
        </Field>

        {showComputed && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] leading-[18px] text-neutral">
              <span className="font-semibold text-foreground">Computed: </span>
              {formatCurrency(investmentNum)} ÷ {unitsNum.toLocaleString()} ={' '}
              {formatCurrency(computedPrice)}
            </p>
            {priceManuallySet && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onPriceReset}
              >
                Reset
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type PoolMemberToggleProps = Readonly<{
  checked: boolean;
  onChange: (next: boolean) => void;
}>;

/**
 * Investor Pool checkbox. Real native `<input type="checkbox">` (visually
 * hidden via `sr-only`) wrapped in a `<label>` so browsers forward clicks
 * anywhere on the label, including the "Part of Investor Pool" text, to
 * the input. The visible 18x18 box mirrors the input's checked state.
 *
 * Previously rendered as an ARIA-role span — that only toggled when the
 * user clicked the tiny 18px box itself, so users who clicked the label
 * text saw nothing happen and silently submitted with the default value.
 */
function PoolMemberToggle({ checked, onChange }: PoolMemberToggleProps) {
  return (
    <label className="group flex w-fit cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          'grid size-[18px] shrink-0 place-items-center rounded-[4px] border-2 transition-colors',
          'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-foreground/20',
          checked
            ? 'border-foreground bg-foreground text-background'
            : 'border-neutral bg-white text-transparent',
        )}
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
      <span className="text-[14px] font-semibold leading-[20px] text-foreground">
        Part of Investor Pool
      </span>
    </label>
  );
}
