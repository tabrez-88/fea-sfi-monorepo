'use client';

import {
  AlertTriangle,
  Check,
  ChevronDown,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';

import { Banner } from '@/components/common/Banner';
import { InvestorPoolManagementCard } from '@/components/participants/pool/InvestorPoolManagementCard';
import { RoleNameInput } from '@/components/participants/RoleNameInput';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useParticipants } from '@/hooks/participants/useParticipants';
import { cn } from '@/lib/utils';
import { ParticipantBehavior, type Participant } from '@/types/participant.types';
import type { SettlementMode } from '@/types/rule-snapshot.types';
import { formatCurrency, formatNumber } from '@/utils/format';

import {
  POOL_TARGET_ID,
  type DeductionFeeType,
  type DeductionRow,
  type DistributionRowMap,
  type ExitConditionsData,
  type PoolRevenueBasis,
  type TermUnit,
  type WizardStep2Data,
} from './wizard-state.types';

type Step2Props = Readonly<{
  dealId: string;
  values: WizardStep2Data;
  /**
   * Step 1's effective date (ISO yyyy-MM-dd or empty). Threaded down to
   * the Exit Conditions section so the Deal Term picker can compute and
   * display the End Date relative to the snapshot's start, not "today".
   */
  effectiveFrom: string;
  onChange: (next: WizardStep2Data) => void;
  onPrev: () => void;
  onNext: (values: WizardStep2Data) => void;
}>;

/**
 * Step 2 of the Create Rule Snapshot wizard: Participants Rules. Matches
 * Figma frames `1299:9808` (Waterfall), `1299:9990` (Recoup), and
 * `1299:10726` (Revenue Share).
 *
 * Sections (vertical stack, each in its own outlined card):
 *   Distribution Mode · Deductions Layer · Allocation Targets ·
 *   Pool Revenue Source · Mode-conditional Distribution body
 *   (Waterfall tiers / Recoup table / Revenue Split) ·
 *   Exit Conditions · Investor Pool Configuration · Running Totals.
 *
 * State lives on the parent wizard container so Next / Previous never
 * loses what the admin entered.
 */
export function Step2ParticipantsRules({
  dealId,
  values,
  effectiveFrom,
  onChange,
  onPrev,
  onNext,
}: Step2Props) {
  // BE caps `limit` at 100. For deals with >100 participants the wizard
  // would need a paginated picker — flag for a future slice; in the meantime
  // 100 covers every realistic deal Phase 1 will see.
  const participantsQuery = useParticipants(dealId, {
    page: 1,
    limit: 100,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const participants = useMemo<ReadonlyArray<Participant>>(
    () => participantsQuery.data?.data ?? [],
    [participantsQuery.data],
  );

  /**
   * Derived participant subsets used by Step 2 sections:
   *   - feeDeductionParticipants: pre-populate Deductions Layer rows on
   *     first enable
   *   - poolMembers: power the "(N)" count next to "Investor Pool" in
   *     Allocation Targets
   *   - allocationCandidates: participants eligible as individual
   *     allocation targets. Excludes Fee Deduction (they go in the
   *     Deductions Layer above) and pool members (they're aggregated
   *     into the Investor Pool target).
   */
  const feeDeductionParticipants = useMemo(
    () => participants.filter((p) => p.behaviorType === ParticipantBehavior.FEE_DEDUCTION),
    [participants],
  );
  const poolMembers = useMemo(
    () => participants.filter((p) => p.poolMember === true),
    [participants],
  );
  const allocationCandidates = useMemo(
    () =>
      participants.filter((p) => {
        // Fee Deduction goes in the Deductions Layer above, not the
        // splits. Pool members of ANY behavior aggregate into the
        // Investor Pool target — listing them individually here would
        // double-count their share (Round 4 #14 — fix expanded from
        // RECOUPMENT-only to all behaviors after Liang's Revenue Share
        // Pool work landed and started leaking pool members into the
        // splits as duplicate rows).
        if (p.behaviorType === ParticipantBehavior.FEE_DEDUCTION) return false;
        if (p.poolMember === true) return false;
        return true;
      }),
    [participants],
  );

  function update<K extends keyof WizardStep2Data>(
    key: K,
    next: WizardStep2Data[K],
  ): void {
    onChange({ ...values, [key]: next });
  }

  /**
   * One-shot auto-populate for Allocation Targets on first mount.
   *
   * Round 4 (Liang) item #15: the Deductions Layer USED to auto-seed
   * the rows with every Fee Deduction participant on the deal. Liang
   * pushed back — that pre-fill bled across deals (her test deal
   * inherited fee rows from a previous one) and she preferred a blank
   * slate. The deductions auto-seed is now an explicit user action
   * (the "Quick add Fee Deduction participants" button below); only
   * Allocation Targets stays auto-seeded because that aggregate set
   * has no cross-deal contamination risk.
   *
   * The `populatedRef` lock prevents re-firing after the admin
   * un-checks targets or before later participant queries hydrate.
   */
  const populatedRef = useRef(false);
  useEffect(() => {
    if (populatedRef.current) return;

    const onlyPoolSelected =
      values.selectedTargets.length === 1 &&
      values.selectedTargets[0] === POOL_TARGET_ID;
    const shouldSeedTargets = onlyPoolSelected && allocationCandidates.length > 0;

    if (!shouldSeedTargets) {
      // Either already populated, hand-edited, or the participants
      // query hasn't hydrated yet. Lock only when there's nothing
      // left to do — otherwise wait for a later render.
      if (!onlyPoolSelected) populatedRef.current = true;
      return;
    }

    populatedRef.current = true;
    onChange({
      ...values,
      selectedTargets: [
        POOL_TARGET_ID,
        ...allocationCandidates.map((p) => p.id),
      ],
    });
  }, [values, allocationCandidates, onChange]);

  const selectedTargets = values.selectedTargets;
  const hasSelectedTargets = selectedTargets.length > 0;

  return (
    <div className="flex flex-col gap-5 rounded-[8px] border border-border bg-white p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-bold leading-[28px] tracking-[-0.4px] text-foreground">
          Participants Rules
        </h2>
        <span className="text-[14px] font-medium text-neutral">Step 2 of 3</span>
      </div>

      <ModeToggleSection
        mode={values.mode}
        step2={values}
        onModeChange={(nextMode) => update('mode', nextMode)}
      />

      <DeductionsLayerSection
        dealId={dealId}
        enabled={values.deductionsEnabled}
        rows={values.deductions}
        feeDeductionParticipants={feeDeductionParticipants}
        onEnabledChange={(enabled) => update('deductionsEnabled', enabled)}
        onRowsChange={(rows) => update('deductions', rows)}
      />

      <AllocationTargetsSection
        candidates={allocationCandidates}
        poolMemberCount={poolMembers.length}
        isLoading={participantsQuery.isLoading}
        selectedTargets={selectedTargets}
        onSelectedChange={(next) => update('selectedTargets', next)}
        dealId={dealId}
      />

      <PoolRevenueSourceSection
        basis={values.poolRevenue.basis}
        deductionsEnabled={values.deductionsEnabled}
        onChange={(next) => update('poolRevenue', next)}
      />

      <DistributionBodySection
        mode={values.mode}
        selectedTargets={selectedTargets}
        participants={participants}
        poolMembers={poolMembers}
        recoupRows={values.recoupRows}
        tier1Rows={values.tier1Rows}
        tier2Rows={values.tier2Rows}
        splitRows={values.splitRows}
        exitConditions={values.exitConditions}
        onExitConditionsChange={(next) => update('exitConditions', next)}
        onRecoupChange={(rows) => update('recoupRows', rows)}
        onTier1Change={(rows) => update('tier1Rows', rows)}
        onTier2Change={(rows) => update('tier2Rows', rows)}
        onSplitChange={(rows) => update('splitRows', rows)}
      />

      <ExitConditionsSection
        mode={values.mode}
        data={values.exitConditions}
        effectiveFrom={effectiveFrom}
        onChange={(next) => update('exitConditions', next)}
      />

      <InvestorPoolManagementCard
        dealId={dealId}
        shell={(body, headerRight) => (
          <SectionCard
            title="Investor Pool Configuration"
            description="Define the internal share breakdown for the Investor Pool."
            headerRight={headerRight}
          >
            {body}
          </SectionCard>
        )}
      />

      <RunningTotalsSection
        mode={values.mode}
        deductions={values.deductions}
        deductionsEnabled={values.deductionsEnabled}
        tier2Rows={values.tier2Rows}
        splitRows={values.splitRows}
      />

      {!hasSelectedTargets && (
        <Banner tone="warning">
          Pick at least one allocation target before continuing.
        </Banner>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onPrev}>
          Previous
        </Button>
        <Button
          type="button"
          onClick={() => onNext(values)}
          disabled={!hasSelectedTargets}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

/* ─── Shared SectionCard ────────────────────────────────────────────────── */

type SectionCardProps = Readonly<{
  title: string;
  description?: string;
  /** Optional content rendered on the right of the title row (e.g. toggle). */
  headerRight?: ReactNode;
  children: ReactNode;
}>;

/**
 * Outlined card wrapping every Step 2 section. Title on the left,
 * optional control on the right of the title row, optional description
 * below, then the section body. Matches the Figma where every section
 * sits in its own bordered box.
 */
function SectionCard({ title, description, headerRight, children }: SectionCardProps) {
  return (
    <section className="flex flex-col gap-3 rounded-[8px] border border-border bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[16px] font-bold leading-[20px] text-foreground">
          {title}
        </h3>
        {headerRight}
      </div>
      {description && (
        <p className="text-[13px] leading-[18px] text-neutral">{description}</p>
      )}
      {children}
    </section>
  );
}

/* ─── Section: Distribution Mode (vertical stack, switch-confirm) ───────── */

type ModeToggleSectionProps = Readonly<{
  mode: SettlementMode;
  step2: WizardStep2Data;
  onModeChange: (next: SettlementMode) => void;
}>;

const MODE_OPTIONS: ReadonlyArray<{
  value: SettlementMode;
  label: string;
  description: string;
}> = [
  {
    value: 'revenue_share',
    label: 'Revenue Share',
    description:
      'Investors and creators split every period of revenue indefinitely (or until the deal term ends). No recoup, no waterfall. Best for trust-based or simple deals.',
  },
  {
    value: 'recoup',
    label: 'Recoup',
    description:
      'Investors recoup their capital × multiplier (e.g. 120%) and then payouts stop. Creators may keep their split indefinitely. Best for debt-style raises.',
  },
  {
    value: 'waterfall',
    label: 'Waterfall',
    description:
      'Tier 1 routes 100% to investors until recoup multiplier, then Tier 2 splits the remainder (e.g. 20/80 investor/creator) until hard cap or deadline. Best for investment deals with shared upside.',
  },
];

function ModeToggleSection({ mode, step2, onModeChange }: ModeToggleSectionProps) {
  const [pendingMode, setPendingMode] = useState<SettlementMode | null>(null);

  function attemptSwitch(next: SettlementMode) {
    if (next === mode) return;
    if (switchWouldDiscardData(mode, next, step2)) {
      setPendingMode(next);
      return;
    }
    onModeChange(next);
  }

  return (
    <SectionCard
      title="Distribution Mode"
      description="Pick how revenue routes to participants. Each mode rewires the rest of this form."
    >
      <div className="flex flex-col gap-3">
        {MODE_OPTIONS.map((opt) => (
          <ModeOptionRow
            key={opt.value}
            option={opt}
            checked={mode === opt.value}
            onSelect={() => attemptSwitch(opt.value)}
          />
        ))}
      </div>

      <Dialog
        open={pendingMode !== null}
        onOpenChange={(open) => {
          if (!open) setPendingMode(null);
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Switch distribution mode?</DialogTitle>
            <DialogDescription className="text-[14px] leading-[20px] text-neutral">
              Switching modes will discard the mode-specific fields you&apos;ve
              filled in (tier splits, recoup multipliers). Shared settings
              (deductions, allocation targets, pool revenue source) are kept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingMode(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (pendingMode) onModeChange(pendingMode);
                setPendingMode(null);
              }}
            >
              Switch mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

function switchWouldDiscardData(
  from: SettlementMode,
  to: SettlementMode,
  step2: WizardStep2Data,
): boolean {
  const hasRecoup = Object.values(step2.recoupRows).some((v) => v.trim() !== '');
  const hasTier1 = Object.values(step2.tier1Rows).some((v) => v.trim() !== '');
  const hasTier2 = Object.values(step2.tier2Rows).some((v) => v.trim() !== '');
  const hasSplit = Object.values(step2.splitRows).some((v) => v.trim() !== '');
  if (from === 'waterfall' && to !== 'waterfall') return hasTier1 || hasTier2;
  if (from === 'recoup' && to !== 'recoup') return hasRecoup;
  if (from === 'revenue_share' && to !== 'revenue_share') return hasSplit;
  return false;
}

type ModeOptionRowProps = Readonly<{
  option: (typeof MODE_OPTIONS)[number];
  checked: boolean;
  onSelect: () => void;
}>;

function ModeOptionRow({ option, checked, onSelect }: ModeOptionRowProps) {
  const inputId = `mode-${option.value}`;
  return (
    <label htmlFor={inputId} className="flex cursor-pointer items-start gap-3">
      <span
        aria-hidden
        className="mt-[1px] grid size-[18px] shrink-0 place-items-center rounded-full border-2 border-foreground bg-white"
      >
        <span
          className={cn(
            'size-[10px] rounded-full bg-foreground transition-opacity',
            checked ? 'opacity-100' : 'opacity-0',
          )}
        />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[14px] font-semibold leading-[20px] text-foreground">
          {option.label}
        </span>
        <span className="text-[12px] leading-[16px] text-neutral">
          {option.description}
        </span>
      </span>
      <input
        id={inputId}
        type="radio"
        name="distribution-mode"
        value={option.value}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
    </label>
  );
}

/* ─── Section: Deductions Layer ─────────────────────────────────────────── */

type DeductionsLayerSectionProps = Readonly<{
  dealId: string;
  enabled: boolean;
  rows: ReadonlyArray<DeductionRow>;
  /**
   * All FEE_DEDUCTION-behavior participants on the deal. Used by the
   * "Quick add" button so the admin can populate the deductions layer
   * from existing participants in one click, instead of typing each
   * one. Empty when the deal has no fee-deduction participants yet.
   */
  feeDeductionParticipants: ReadonlyArray<Participant>;
  onEnabledChange: (next: boolean) => void;
  onRowsChange: (next: DeductionRow[]) => void;
}>;

const FEE_TYPE_LABEL: Record<DeductionFeeType, string> = {
  percent_gross: '% of Gross Revenue',
  percent_net: '% of Net Income',
  flat: '$ Flat Amount',
};

function DeductionsLayerSection({
  dealId,
  enabled,
  rows,
  feeDeductionParticipants,
  onEnabledChange,
  onRowsChange,
}: DeductionsLayerSectionProps) {
  const [confirmAddOpen, setConfirmAddOpen] = useState(false);

  function addRow() {
    onRowsChange([
      ...rows,
      {
        id: cryptoRandomId(),
        name: '',
        role: '',
        feeType: 'percent_gross',
        amount: '',
        included: true,
      },
    ]);
  }
  function updateRow(id: string, patch: Partial<DeductionRow>) {
    onRowsChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removeRow(id: string) {
    onRowsChange(rows.filter((r) => r.id !== id));
  }

  // Quick-add: seed the deductions layer with one row per existing
  // FEE_DEDUCTION participant on the deal. Skips participants that
  // already have a linked row so re-clicking the button doesn't
  // duplicate rows (Round 4 / Liang #15: she pushed back on the old
  // auto-seed because it leaked rows from past deals, so this stays
  // opt-in via the button).
  function quickAddAll() {
    const existingLinkedIds = new Set(
      rows.map((r) => r.participantId).filter((id): id is string => Boolean(id)),
    );
    const newRows: DeductionRow[] = feeDeductionParticipants
      .filter((p) => !existingLinkedIds.has(p.id))
      .map((p) => ({
        id: cryptoRandomId(),
        participantId: p.id,
        name: p.name,
        role: p.roleName,
        feeType: 'percent_gross',
        amount: '',
        included: true,
      }));
    if (newRows.length === 0) return;
    onRowsChange([...rows, ...newRows]);
  }

  const hasUnlinkedFeeParticipants =
    feeDeductionParticipants.some(
      (p) => !rows.some((r) => r.participantId === p.id),
    );

  return (
    <SectionCard
      title="Deductions Layer"
      description="Fees taken by ABCD partners (distributor, MCN, publisher, etc.) off the top. Leave OFF if this deal has no third-party fees."
      headerRight={
        <PillToggle label="Enable" checked={enabled} onChange={onEnabledChange} />
      }
    >
      {enabled && (
        <div className="flex flex-col gap-3">
          {rows.length === 0 ? (
            <div className="rounded-[8px] border border-dashed border-border bg-grey-50/40 px-4 py-6 text-center text-[13px] text-neutral">
              No deduction participants yet. Click below to add one
              {hasUnlinkedFeeParticipants ? ', or quick-add all existing Fee Deduction participants on this deal.' : '.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {rows.map((row) => (
                <DeductionCard
                  key={row.id}
                  dealId={dealId}
                  row={row}
                  onChange={(patch) => updateRow(row.id, patch)}
                  onRemove={() => removeRow(row.id)}
                />
              ))}
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            {/* Quick-add ahead of the manual add when there are existing
                fee-deduction participants to import. Outline style so
                the manual "Add Deduction Participant" stays the primary
                action (matches the original Figma flow). */}
            {hasUnlinkedFeeParticipants && (
              <Button
                type="button"
                variant="outline"
                onClick={quickAddAll}
                className="w-full sm:w-auto"
              >
                <Plus className="size-4" aria-hidden />
                Quick add{' '}
                {
                  feeDeductionParticipants.filter(
                    (p) => !rows.some((r) => r.participantId === p.id),
                  ).length
                }{' '}
                from Participants
              </Button>
            )}
            {/* Black-filled full-width button, matches Figma `1299:9808` */}
            <Button
              type="button"
              onClick={() => setConfirmAddOpen(true)}
              className="w-full sm:flex-1"
            >
              <Plus className="size-4" aria-hidden />
              Add Deduction Participant
            </Button>
          </div>
        </div>
      )}

      <Dialog open={confirmAddOpen} onOpenChange={setConfirmAddOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add a new deduction participant?</DialogTitle>
            <DialogDescription className="text-[14px] leading-[20px] text-neutral">
              This creates a new participant on this deal with default
              behavior <span className="font-semibold text-foreground">Fee Deduction</span>.
              You&apos;ll fill in the name, role, fee type, and amount in the
              card that appears below. The participant is created when you
              submit the snapshot.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                addRow();
                setConfirmAddOpen(false);
              }}
            >
              Add participant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

type DeductionCardProps = Readonly<{
  dealId: string;
  row: DeductionRow;
  onChange: (patch: Partial<DeductionRow>) => void;
  onRemove: () => void;
}>;

function DeductionCard({ dealId, row, onChange, onRemove }: DeductionCardProps) {
  const roleId = useId();
  const feeTypeId = useId();
  const amountId = useId();
  // Linked rows (auto-populated from existing participants) keep their
  // name + role read-only — editing those would diverge from the source
  // participant in confusing ways. Net-new rows are fully editable.
  const isLinked = Boolean(row.participantId);
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-[8px] border border-border bg-white p-4 transition-opacity',
        !row.included && 'opacity-60',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-1 items-center gap-2">
          {/* Functioning include/exclude checkbox: unchecked rows stay in
              the form state but get filtered out of the v2 payload on
              submit. */}
          <label className="flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={row.included}
              onChange={(e) => onChange({ included: e.target.checked })}
              className="peer sr-only"
              aria-label={`Include ${row.name || 'deduction'} in the snapshot`}
            />
            <CheckBoxBox checked={row.included} />
          </label>
          {isLinked ? (
            <span className="truncate px-1 text-[14px] font-semibold text-foreground">
              {row.name || 'Unnamed participant'}
            </span>
          ) : (
            <Input
              value={row.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Example Name"
              aria-label="Deduction participant name"
              className="h-8 border-none px-1 text-[14px] font-semibold shadow-none focus-visible:border focus-visible:border-border"
            />
          )}
          {!isLinked && (
            <Pencil aria-hidden className="size-4 text-neutral" strokeWidth={1.75} />
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Remove deduction"
          className="text-danger hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={roleId} className="text-[12px] font-medium text-foreground">
          Role <span className="text-danger">*</span>
        </Label>
        {isLinked ? (
          <p
            id={roleId}
            className="rounded-[6px] border border-border bg-grey-50/60 px-3 py-2 text-[13px] text-neutral"
          >
            {row.role || 'Unspecified role'}
          </p>
        ) : (
          <RoleNameInput
            id={roleId}
            dealId={dealId}
            value={row.role}
            onChange={(next) => onChange({ role: next })}
            placeholder="Type or select a role..."
          />
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={feeTypeId} className="text-[12px] font-medium text-foreground">
            Fee Type <span className="text-danger">*</span>
          </Label>
          <Select
            value={row.feeType}
            onValueChange={(next) => onChange({ feeType: next as DeductionFeeType })}
          >
            <SelectTrigger id={feeTypeId} className="h-9 text-[13px]">
              <SelectValue placeholder="Fee Type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FEE_TYPE_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={amountId} className="text-[12px] font-medium text-foreground">
            Amount <span className="text-danger">*</span>
          </Label>
          <Input
            id={amountId}
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={row.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
            placeholder={row.feeType === 'flat' ? '$50,000' : '12'}
            className="h-9 text-[13px]"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Section: Allocation Targets ───────────────────────────────────────── */

type AllocationTargetsSectionProps = Readonly<{
  /**
   * Participants eligible as INDIVIDUAL allocation targets. Caller is
   * expected to filter out:
   *   - Fee Deduction participants (they live in the Deductions Layer)
   *   - Pool members (they're aggregated into the Investor Pool target)
   * What's left: Recoupment Solo (Recoupment + poolMember=false),
   * Profit Share, Flat Fee, Pass-Through.
   */
  candidates: ReadonlyArray<Participant>;
  /** Live count of `poolMember=true` participants — shown next to the Investor Pool row. */
  poolMemberCount: number;
  isLoading: boolean;
  selectedTargets: ReadonlyArray<string>;
  onSelectedChange: (next: string[]) => void;
  dealId: string;
}>;

function AllocationTargetsSection({
  candidates,
  poolMemberCount,
  isLoading,
  selectedTargets,
  onSelectedChange,
  dealId,
}: AllocationTargetsSectionProps) {
  function toggle(id: string) {
    if (selectedTargets.includes(id)) {
      onSelectedChange(selectedTargets.filter((x) => x !== id));
    } else {
      onSelectedChange([...selectedTargets, id]);
    }
  }

  return (
    <SectionCard
      title="Allocation Targets"
      description="Where revenue is routed. Add individual participants and/or a pool."
    >
      <div className="flex flex-col gap-2">
        <TargetRow
          checked={selectedTargets.includes(POOL_TARGET_ID)}
          onToggle={() => toggle(POOL_TARGET_ID)}
          label="Investor Pool"
          sublabel={`${formatNumber(poolMemberCount)} ${poolMemberCount === 1 ? 'participant' : 'participants'}`}
          sublabelInParens
        />
        {isLoading ? (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </>
        ) : candidates.length === 0 ? (
          <p className="rounded-[8px] border border-dashed border-border bg-grey-50/40 px-4 py-3 text-[13px] text-neutral">
            No participants on this deal yet.{' '}
            <Link
              href={ROUTES.DEALS.PARTICIPANTS_NEW(dealId)}
              className="font-semibold underline underline-offset-4"
            >
              Add one
            </Link>{' '}
            to use as an allocation target.
          </p>
        ) : (
          candidates.map((p) => (
            <TargetRow
              key={p.id}
              checked={selectedTargets.includes(p.id)}
              onToggle={() => toggle(p.id)}
              label={p.name}
              sublabel={p.roleName}
              sublabelInParens
            />
          ))
        )}
      </div>
    </SectionCard>
  );
}

type TargetRowProps = Readonly<{
  checked: boolean;
  onToggle: () => void;
  label: string;
  sublabel?: string;
  /** When true, sublabel renders as "(text)" inline next to the label. */
  sublabelInParens?: boolean;
}>;

function TargetRow({ checked, onToggle, label, sublabel, sublabelInParens }: TargetRowProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-[8px] border bg-white px-4 py-3 transition-colors',
        checked ? 'border-foreground' : 'border-border hover:border-foreground/40',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="peer sr-only"
      />
      <CheckBoxBox checked={checked} />
      <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
        <span className="truncate text-[14px] font-semibold leading-[20px] text-foreground">
          {label}
        </span>
        {sublabel && (
          <span className="truncate text-[12px] leading-[16px] text-neutral">
            {sublabelInParens ? `(${sublabel})` : sublabel}
          </span>
        )}
      </span>
      <Pencil
        aria-hidden
        className="size-4 shrink-0 text-neutral"
        strokeWidth={1.75}
      />
    </label>
  );
}

/* ─── Section: Pool Revenue Source ──────────────────────────────────────── */

type PoolRevenueSourceSectionProps = Readonly<{
  basis: PoolRevenueBasis;
  deductionsEnabled: boolean;
  onChange: (next: { basis: PoolRevenueBasis }) => void;
}>;

/**
 * Round 4 (Liang) #16: stripped to a basis picker only. The pool's
 * percentage is no longer entered here — it comes from the pool's row
 * in the Revenue Split / Tier 2 table. Asking for it twice produced a
 * 120% double-count and confused Liang on her first test. This section
 * now exists solely to answer "is the pool's % taken from gross or
 * net revenue?" and surfaces the explanation tooltips for #20.
 */
function PoolRevenueSourceSection({
  basis,
  deductionsEnabled,
  onChange,
}: PoolRevenueSourceSectionProps) {
  return (
    <SectionCard
      title="Pool Revenue Source"
      description="Sets whether the pool's share comes from Gross Revenue (before deductions) or Net Revenue (after deductions). The actual percentage is set on the Investor Pool row in the splits table below."
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label className="text-[12px] font-medium text-foreground">
            From <span className="text-danger">*</span>
          </Label>
          <StackedRadio
            checked={basis === 'GROSS'}
            onSelect={() => onChange({ basis: 'GROSS' })}
            label="Gross Revenue"
            sublabel="Pool's share is taken from the top, before any deductions. Use this when there are no deductions, or when the pool should ignore deductions."
          />
          <StackedRadio
            checked={basis === 'NET'}
            onSelect={() => onChange({ basis: 'NET' })}
            label="% of Net Revenue"
            sublabel="Pool's share is taken AFTER deductions are applied. Use this when deductions exist and the pool should pay its share of them first."
            disabled={!deductionsEnabled}
            disabledHint="Enable Deductions to use Net"
          />
        </div>
      </div>
    </SectionCard>
  );
}

type StackedRadioProps = Readonly<{
  checked: boolean;
  onSelect: () => void;
  label: string;
  sublabel?: string;
  disabled?: boolean;
  disabledHint?: string;
}>;

function StackedRadio({
  checked,
  onSelect,
  label,
  sublabel,
  disabled,
  disabledHint,
}: StackedRadioProps) {
  return (
    <label
      title={disabled ? disabledHint : undefined}
      className={cn(
        'flex cursor-pointer items-start gap-3',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span
        aria-hidden
        className="mt-[1px] grid size-[18px] shrink-0 place-items-center rounded-full border-2 border-foreground bg-white"
      >
        <span
          className={cn(
            'size-[10px] rounded-full bg-foreground transition-opacity',
            checked ? 'opacity-100' : 'opacity-0',
          )}
        />
      </span>
      <input
        type="radio"
        checked={checked}
        onChange={onSelect}
        disabled={disabled}
        className="sr-only"
      />
      <span className="flex flex-col">
        <span className="text-[14px] leading-[20px] text-foreground">{label}</span>
        {sublabel && (
          <span className="text-[12px] leading-[16px] text-neutral">{sublabel}</span>
        )}
      </span>
    </label>
  );
}

/* ─── Section: Distribution body (mode-conditional) ─────────────────────── */

type DistributionBodySectionProps = Readonly<{
  mode: SettlementMode;
  selectedTargets: ReadonlyArray<string>;
  participants: ReadonlyArray<Participant>;
  /**
   * Full pool members list. Used by `labelForTarget` so the pool row
   * label shows the live "(N members)" count next to "Investor Pool".
   */
  poolMembers: ReadonlyArray<Participant>;
  recoupRows: DistributionRowMap;
  tier1Rows: DistributionRowMap;
  tier2Rows: DistributionRowMap;
  splitRows: DistributionRowMap;
  /**
   * Exit conditions surfaced inline beside the recoup-phase table so
   * Hard Cap Multiplier sits next to its target (per-pool-investor cap
   * that gates Tier 1 / recoup mode exit). Deal Term still lives in
   * the separate Exit Conditions section below.
   */
  exitConditions: ExitConditionsData;
  onExitConditionsChange: (next: ExitConditionsData) => void;
  onRecoupChange: (next: DistributionRowMap) => void;
  onTier1Change: (next: DistributionRowMap) => void;
  onTier2Change: (next: DistributionRowMap) => void;
  onSplitChange: (next: DistributionRowMap) => void;
}>;

function DistributionBodySection(props: DistributionBodySectionProps) {
  const { mode, selectedTargets } = props;

  if (selectedTargets.length === 0) {
    return (
      <SectionCard title="Distribution">
        <p className="rounded-[8px] border border-dashed border-border bg-grey-50/40 px-4 py-6 text-center text-[13px] text-neutral">
          Pick at least one allocation target above to configure distribution.
        </p>
      </SectionCard>
    );
  }

  const poolLabel = 'the Investor Pool';

  if (mode === 'revenue_share') {
    return (
      <SectionCard
        title="Revenue Split"
        description="Revenue flows according to the profit split percentages below."
      >
        <DistributionTable
          valueColumnLabel="Profit Split"
          valueSuffix="%"
          rows={props.splitRows}
          onChange={props.onSplitChange}
          targets={selectedTargets}
          participants={props.participants}
          poolMembers={props.poolMembers}
          placeholder="50"
        />
      </SectionCard>
    );
  }

  if (mode === 'recoup') {
    return (
      <SectionCard
        title="Recoup + Exit"
        description="Define the percentage of revenue allocated to this target for recoupment. Once the cap is reached, this distribution ends and the flow moves to the next phase."
      >
        <DistributionTable
          valueColumnLabel="Recoup Multiplier"
          valueSuffix="%"
          rows={props.recoupRows}
          onChange={props.onRecoupChange}
          targets={selectedTargets}
          participants={props.participants}
          poolMembers={props.poolMembers}
          placeholder="120"
        />
        <HardCapInlineRow
          enabled={props.exitConditions.hardCapEnabled}
          multiplier={props.exitConditions.hardCapMultiplier}
          onEnabledChange={(b) =>
            props.onExitConditionsChange({ ...props.exitConditions, hardCapEnabled: b })
          }
          onMultiplierChange={(v) =>
            props.onExitConditionsChange({ ...props.exitConditions, hardCapMultiplier: v })
          }
          exitTarget="the next phase"
        />
      </SectionCard>
    );
  }

  // Waterfall mode: two collapsible tier cards + inline running total.
  //
  // Target filtering per tier (per Liang Round 3 + Round 4 clarification):
  //   Tier 1 (Recoupment Phase): only targets that have invested capital
  //     to recoup — the Investor Pool (aggregates pool-member investors)
  //     plus any RECOUPMENT-behavior solo participants the admin checked
  //     in Allocation Targets. Profit Share / Flat Fee / etc. have no
  //     capital concept and aren't shown here.
  //   Tier 2 (Post Recoup Split): the Investor Pool (often keeps a
  //     continued profit share after recoupment) + non-recoupment solo
  //     participants (NET_PROFIT_SHARE / FLAT_FEE / etc.). Solo
  //     RECOUPMENT participants are excluded here because their
  //     structural role is "get capital back in Tier 1, then done" —
  //     they don't have a profit-share entitlement (otherwise their
  //     behavior would be NET_PROFIT_SHARE). Admin can still set Pool
  //     to 0% if it's an "investors recoup and exit" deal.
  const tier1Targets = selectedTargets.filter((id) => {
    if (id === POOL_TARGET_ID) return true;
    const p = props.participants.find((x) => x.id === id);
    return p?.behaviorType === ParticipantBehavior.RECOUPMENT;
  });
  const tier2Targets = selectedTargets.filter((id) => {
    if (id === POOL_TARGET_ID) return true;
    const p = props.participants.find((x) => x.id === id);
    return p !== undefined && p.behaviorType !== ParticipantBehavior.RECOUPMENT;
  });

  return (
    <SectionCard
      title="Waterfall Tiers"
      description="Define the priority order for net revenue distribution."
    >
      <TierCard
        tierLabel="Tier 1"
        title="Recoupment Phase"
        description="Allocation is the share of revenue routed to each target during recoupment (must sum to 100%). Hard Cap Multiplier below caps how much each pool member can recoup (e.g. 1.25 = 125% of invested capital), then flow exits to Tier 2."
        valueColumnLabel="Allocation"
        valueSuffix="%"
        rows={props.tier1Rows}
        onChange={props.onTier1Change}
        targets={tier1Targets}
        participants={props.participants}
        poolMembers={props.poolMembers}
        placeholder="100"
        emptyHint={`No recoupment-eligible targets selected. Add ${poolLabel} or a Recoupment participant in Allocation Targets above to define a Tier 1 recoup.`}
        layout="form"
        footer={
          <HardCapInlineRow
            enabled={props.exitConditions.hardCapEnabled}
            multiplier={props.exitConditions.hardCapMultiplier}
            onEnabledChange={(b) =>
              props.onExitConditionsChange({
                ...props.exitConditions,
                hardCapEnabled: b,
              })
            }
            onMultiplierChange={(v) =>
              props.onExitConditionsChange({
                ...props.exitConditions,
                hardCapMultiplier: v,
              })
            }
            exitTarget="Tier 2"
          />
        }
      />
      <TierCard
        tierLabel="Tier 2"
        title="Post Recoup Split"
        description="How remaining revenue is distributed after Tier 1 is fulfilled. Solo Recoupment participants don't appear here — they recoup their capital in Tier 1 and have no profit-share entitlement."
        valueColumnLabel="Profit Split"
        valueSuffix="%"
        rows={props.tier2Rows}
        onChange={props.onTier2Change}
        targets={tier2Targets}
        participants={props.participants}
        poolMembers={props.poolMembers}
        placeholder="20"
        emptyHint={`No profit-share targets selected. Pick ${poolLabel} or a Profit Share / Flat Fee participant in Allocation Targets above to define a Tier 2 split.`}
        showRunningTotal
        layout="table"
      />
    </SectionCard>
  );
}

/* ─── Tier card (collapsible) ───────────────────────────────────────────── */

type TierLayout = 'form' | 'table';

type TierCardProps = Readonly<{
  tierLabel: string;
  title: string;
  description: string;
  valueColumnLabel: string;
  valueSuffix: string;
  rows: DistributionRowMap;
  onChange: (next: DistributionRowMap) => void;
  targets: ReadonlyArray<string>;
  participants: ReadonlyArray<Participant>;
  /** Pool members on the deal. Drives the live "(N members)" count on the pool row label. */
  poolMembers?: ReadonlyArray<Participant> | undefined;
  placeholder: string;
  /** When true, renders a "Running Total: N%" footer (green when 100, red otherwise). */
  showRunningTotal?: boolean;
  /**
   * Message shown in place of the table body when `targets` is empty.
   * Tier 1 uses this to explain that no Recoupment-eligible targets have
   * been checked in Allocation Targets yet; without it the card would
   * just render an empty grid.
   */
  emptyHint?: string;
  /**
   * Body layout:
   *   - 'form'  → labels rendered above the row (Tier 1 / Recoupment Phase).
   *               Reads as a compact form because the tier usually has 1-3 rows.
   *   - 'table' → grey table header bar followed by N data rows
   *               (Tier 2 / Post Recoup Split), scales to many participants.
   */
  layout: TierLayout;
  /** Optional content rendered below the body (e.g. Hard Cap on Tier 1). */
  footer?: ReactNode;
}>;

function TierCard({
  tierLabel,
  title,
  description,
  valueColumnLabel,
  valueSuffix,
  rows,
  onChange,
  targets,
  participants,
  poolMembers,
  placeholder,
  showRunningTotal = false,
  emptyHint,
  layout,
  footer,
}: TierCardProps) {
  const [collapsed, setCollapsed] = useState(false);

  const runningTotal = useMemo(() => {
    if (!showRunningTotal) return null;
    return targets.reduce((acc, id) => {
      const n = Number(rows[id] ?? '');
      return Number.isFinite(n) ? acc + n : acc;
    }, 0);
  }, [showRunningTotal, targets, rows]);
  const totalValid = runningTotal === null || Math.abs(runningTotal - 100) < 0.01;

  function updateCell(targetId: string, value: string) {
    onChange({ ...rows, [targetId]: value });
  }

  return (
    <div className="flex flex-col rounded-[8px] border border-border bg-white">
      {/* Header: white background, black "TIER N" pill on the left, plain
          title text, separate black square chevron button on the right.
          Per the Figma Waterfall Tiers design. The chevron is the click
          target; the title/pill area is not interactive to keep the
          click region tight (matches design behaviour). */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex shrink-0 items-center rounded-full bg-foreground px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-background">
            {tierLabel}
          </span>
          <span className="truncate text-[14px] font-semibold text-foreground">
            {title}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((p) => !p)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
          className="grid size-7 shrink-0 place-items-center rounded-[6px] bg-foreground text-background transition-colors hover:bg-foreground/90"
        >
          <ChevronDown
            aria-hidden
            strokeWidth={2.5}
            className={cn(
              'size-4 transition-transform duration-200',
              collapsed && '-rotate-180',
            )}
          />
        </button>
      </div>
      {!collapsed && (
        <>
          <div className="h-px bg-grey-100" />
          <div className="flex flex-col gap-3 px-4 py-4">
            <p className="text-[13px] leading-[18px] text-neutral">{description}</p>
            {renderTierBody({
              targets,
              emptyHint,
              layout,
              valueColumnLabel,
              valueSuffix,
              rows,
              participants,
              poolMembers,
              placeholder,
              updateCell,
            })}
            {runningTotal !== null && (
              <p
                className={cn(
                  'inline-flex items-center gap-1.5 text-[13px] font-semibold',
                  totalValid ? 'text-success' : 'text-danger',
                )}
              >
                {totalValid ? (
                  <Check aria-hidden className="size-3.5" strokeWidth={3} />
                ) : (
                  <AlertTriangle aria-hidden className="size-3.5" strokeWidth={2} />
                )}
                Running Total: {formatNumber(runningTotal)}%
              </p>
            )}
            {footer}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Inline Hard Cap row (Tier 1 / Recoup mode) ─────────────────────────── */

type HardCapInlineRowProps = Readonly<{
  enabled: boolean;
  multiplier: string;
  onEnabledChange: (next: boolean) => void;
  onMultiplierChange: (next: string) => void;
  /** Where flow exits when the cap fires. Labels the helper text below the input. */
  exitTarget: string;
}>;

/**
 * Per-pool-investor Hard Cap, rendered inline beside the recoup table
 * (Tier 1 in waterfall, the only tier in Recoup mode). State stays on
 * `exitConditions.hardCapMultiplier` so the payload assembler keeps
 * writing it to the tier without a schema change.
 */
function HardCapInlineRow({
  enabled,
  multiplier,
  onEnabledChange,
  onMultiplierChange,
  exitTarget,
}: HardCapInlineRowProps) {
  return (
    <div className="flex flex-col gap-2 rounded-[6px] border border-dashed border-border bg-grey-50/40 px-3 py-3">
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="peer sr-only"
        />
        <CheckBoxBox checked={enabled} />
        <span className="text-[13px] font-semibold text-foreground">
          Hard Cap Multiplier
        </span>
      </label>
      {enabled && (
        <div className="grid grid-cols-1 gap-1 pl-7 sm:grid-cols-[140px_1fr]">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={multiplier}
            onChange={(e) => onMultiplierChange(e.target.value)}
            placeholder="1.25"
            className="h-9 text-[13px]"
          />
          <p className="text-[12px] text-neutral sm:self-center">
            × of each investor&apos;s invested capital. Exits to {exitTarget} when reached.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Distribution body: shared cells + two layout variants ─────────────── */

type DistributionBodyProps = Readonly<{
  valueColumnLabel: string;
  valueSuffix: string;
  rows: DistributionRowMap;
  targets: ReadonlyArray<string>;
  participants: ReadonlyArray<Participant>;
  /** Pool members for `labelForTarget` so the pool row shows the live "(N members)" count. */
  poolMembers?: ReadonlyArray<Participant> | undefined;
  placeholder: string;
  updateCell: (targetId: string, value: string) => void;
}>;

/**
 * Picks form-style vs table-style body. Lifted out of TierCard so the
 * branching reads as a flat switch instead of a nested ternary
 * (SonarLint typescript:S3358) and the empty-state guard sits beside
 * the layout pick.
 */
type RenderTierBodyArgs = DistributionBodyProps & {
  emptyHint?: string | undefined;
  layout: TierLayout;
};

function renderTierBody({
  targets,
  emptyHint,
  layout,
  ...rest
}: RenderTierBodyArgs): ReactNode {
  if (targets.length === 0 && emptyHint) {
    return (
      <div className="rounded-[6px] border border-dashed border-border bg-grey-50/50 px-4 py-6 text-center text-[12px] leading-[16px] text-neutral">
        {emptyHint}
      </div>
    );
  }
  if (layout === 'form') {
    return <DistributionFormBody targets={targets} {...rest} />;
  }
  return <DistributionTableBody targets={targets} {...rest} />;
}

/**
 * Form-style body (Tier 1 / Recoupment Phase). Labels render once above
 * the first row, each row is a 2-column grid mirroring the table layout
 * so columns line up vertically when the tier has more than one row.
 */
function DistributionFormBody({
  valueColumnLabel,
  valueSuffix,
  rows,
  targets,
  participants,
  poolMembers,
  placeholder,
  updateCell,
}: DistributionBodyProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="hidden grid-cols-[1fr_180px] gap-x-3 text-[12px] font-medium text-neutral sm:grid">
        <span>Target</span>
        <span>{valueColumnLabel}</span>
      </div>
      {targets.map((targetId) => (
        <div
          key={targetId}
          className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_180px] sm:gap-x-3"
        >
          <TargetReadOnlyBox
            label={labelForTarget(targetId, participants, poolMembers)}
          />
          <ValueInputCell
            value={rows[targetId] ?? ''}
            onChange={(v) => updateCell(targetId, v)}
            placeholder={placeholder}
            suffix={valueSuffix}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Table-style body (Tier 2 / Post Recoup Split). Grey header bar + N
 * data rows separated by hairline borders. Used when row count can grow
 * (every Allocation Target appears here).
 */
function DistributionTableBody({
  valueColumnLabel,
  valueSuffix,
  rows,
  targets,
  participants,
  poolMembers,
  placeholder,
  updateCell,
}: DistributionBodyProps) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-border bg-white">
      <div className="grid grid-cols-[1fr_180px] gap-x-3 bg-grey-50 px-4 py-2.5 text-[13px] font-bold text-foreground">
        <span>Target</span>
        <span>{valueColumnLabel}</span>
      </div>
      {targets.map((targetId) => (
        <div
          key={targetId}
          className="grid grid-cols-[1fr_180px] items-center gap-x-3 border-t border-grey-100 px-4 py-2"
        >
          <TargetReadOnlyBox
            label={labelForTarget(targetId, participants, poolMembers)}
          />
          <ValueInputCell
            value={rows[targetId] ?? ''}
            onChange={(v) => updateCell(targetId, v)}
            placeholder={placeholder}
            suffix={valueSuffix}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Backwards-compat wrapper for the Revenue Share and Recoup distribution
 * tables, which always render the table-style body. Adapts the legacy
 * `onChange(map)` prop to the cell-level `updateCell` the new body
 * components use internally.
 */
type DistributionTableProps = Readonly<{
  valueColumnLabel: string;
  valueSuffix: string;
  rows: DistributionRowMap;
  onChange: (next: DistributionRowMap) => void;
  targets: ReadonlyArray<string>;
  participants: ReadonlyArray<Participant>;
  poolMembers?: ReadonlyArray<Participant> | undefined;
  placeholder: string;
}>;

function DistributionTable({
  valueColumnLabel,
  valueSuffix,
  rows,
  onChange,
  targets,
  participants,
  poolMembers,
  placeholder,
}: DistributionTableProps) {
  function updateCell(targetId: string, value: string) {
    onChange({ ...rows, [targetId]: value });
  }
  return (
    <DistributionTableBody
      valueColumnLabel={valueColumnLabel}
      valueSuffix={valueSuffix}
      rows={rows}
      targets={targets}
      participants={participants}
      poolMembers={poolMembers}
      placeholder={placeholder}
      updateCell={updateCell}
    />
  );
}

function TargetReadOnlyBox({ label }: Readonly<{ label: string }>) {
  return (
    <div
      aria-label={`Target: ${label}`}
      className="flex h-9 items-center truncate rounded-[6px] border border-border bg-grey-50/60 px-3 text-[13px] text-neutral"
    >
      {label}
    </div>
  );
}

type ValueInputCellProps = Readonly<{
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  suffix: string;
}>;

function ValueInputCell({ value, onChange, placeholder, suffix }: ValueInputCellProps) {
  return (
    <div className="relative">
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 pr-7 text-[13px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-neutral"
      >
        {suffix}
      </span>
    </div>
  );
}

function labelForTarget(
  targetId: string,
  participants: ReadonlyArray<Participant>,
  poolMembers?: ReadonlyArray<Participant>,
): string {
  if (targetId === POOL_TARGET_ID) {
    // Pool is always rendered as a pool, never collapsed to a member
    // name. Future deals carry multiple named pools (Investor /
    // Songwriter / Actor) and the aggregate label must stay distinct
    // from the individual targets listed beneath it.
    if (poolMembers && poolMembers.length > 0) {
      const noun = poolMembers.length === 1 ? 'member' : 'members';
      return `Investor Pool (${poolMembers.length} ${noun})`;
    }
    return 'Investor Pool';
  }
  const match = participants.find((p) => p.id === targetId);
  return match ? match.name : 'Unknown target';
}

/* ─── Section: Exit Conditions ──────────────────────────────────────────── */

type ExitConditionsSectionProps = Readonly<{
  mode: SettlementMode;
  data: ExitConditionsData;
  /**
   * Snapshot effective date from Step 1. Used as the Start Date for the
   * Deal Term picker so the displayed End Date matches what the engine
   * will see. Empty string when the admin hasn't picked a Step 1 date
   * yet — DealTermPicker falls back to "today" for the display.
   */
  effectiveFrom: string;
  onChange: (next: ExitConditionsData) => void;
}>;

function ExitConditionsSection({
  mode,
  data,
  effectiveFrom,
  onChange,
}: ExitConditionsSectionProps) {
  // Hard Cap moved inline into Tier 1 / Recoup mode tables (lives next
  // to the target it bounds). This section now exposes Deal Term only,
  // which is snapshot-wide regardless of mode.
  const applyHint =
    mode === 'revenue_share'
      ? 'Revenue Share mode only supports a deal-term expiry.'
      : mode === 'recoup'
        ? 'Deal Term stops the recoupment phase at expiry. Hard Cap lives beside the recoup table above.'
        : 'Deal Term applies snapshot-wide: both Tier 1 (recoupment) and Tier 2 (post-recoup splits) stop at expiry. Hard Cap lives beside Tier 1 above.';

  return (
    <SectionCard
      title="Exit Conditions (Optional)"
      description="Distribution stops when the deal term expires."
    >
      <div className="flex flex-col gap-3">
        <ExitConditionBox>
          <p className="text-[14px] font-semibold leading-[20px] text-foreground">
            Deal Term
          </p>
          <DealTermPicker
            data={data}
            effectiveFrom={effectiveFrom}
            onChange={onChange}
          />
        </ExitConditionBox>
      </div>
      <Banner tone="warning">{applyHint}</Banner>
    </SectionCard>
  );
}

/**
 * Round 4 (Liang) replacement for the bare Deadline date picker.
 * Renders the two-mode Term widget she spec'd:
 *
 *   ○ Perpetual
 *   ○ Fixed Term
 *     Length: [N]
 *     Unit: ○ Days ○ Months ○ Years
 *     Start Date: <effectiveFrom or today>
 *     End Date:   <Start + (N × unit)>
 *
 * The End Date is display-only; the payload assembler recomputes it
 * server-bound from the same inputs to keep one source of truth.
 */
type DealTermPickerProps = Readonly<{
  data: ExitConditionsData;
  effectiveFrom: string;
  onChange: (next: ExitConditionsData) => void;
}>;

function DealTermPicker({ data, effectiveFrom, onChange }: DealTermPickerProps) {
  const isFixed = data.termMode === 'fixed';

  const start = effectiveFrom ? new Date(effectiveFrom) : new Date();
  const lengthNum = Number(data.termLength);
  const computedEnd =
    isFixed && Number.isFinite(lengthNum) && lengthNum > 0
      ? addUnit(start, lengthNum, data.termUnit)
      : null;

  const fmt = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <StackedRadio
          checked={data.termMode === 'perpetual'}
          onSelect={() => onChange({ ...data, termMode: 'perpetual' })}
          label="Perpetual"
          sublabel="Distribution continues with no expiry date."
        />
        <StackedRadio
          checked={data.termMode === 'fixed'}
          onSelect={() => onChange({ ...data, termMode: 'fixed' })}
          label="Fixed Term"
          sublabel="Distribution stops on a computed end date."
        />
      </div>

      {isFixed && (
        <div className="flex flex-col gap-3 rounded-[6px] border border-grey-100 bg-grey-50/40 px-4 py-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr]">
            <div className="flex flex-col gap-1">
              <Label className="text-[12px] font-medium text-foreground">
                Length
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                step="1"
                value={data.termLength}
                onChange={(e) => onChange({ ...data, termLength: e.target.value })}
                placeholder="5"
                className="h-9 text-[13px]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[12px] font-medium text-foreground">Unit</Label>
              <div className="flex flex-wrap gap-3">
                {(['days', 'months', 'years'] as const).map((unit) => (
                  <label
                    key={unit}
                    className="flex cursor-pointer items-center gap-2 text-[13px] text-foreground"
                  >
                    <input
                      type="radio"
                      name="term-unit"
                      checked={data.termUnit === unit}
                      onChange={() => onChange({ ...data, termUnit: unit })}
                      className="size-[14px] accent-foreground"
                    />
                    <span className="capitalize">{unit}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[12px] text-neutral">
            <div>
              <div className="font-medium text-foreground">Start Date</div>
              <div>{fmt.format(start)}</div>
            </div>
            <div>
              <div className="font-medium text-foreground">End Date</div>
              <div>{computedEnd ? fmt.format(computedEnd) : '—'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function addUnit(start: Date, length: number, unit: TermUnit): Date {
  const end = new Date(start);
  switch (unit) {
    case 'days':
      end.setUTCDate(end.getUTCDate() + length);
      break;
    case 'months':
      end.setUTCMonth(end.getUTCMonth() + length);
      break;
    case 'years':
      end.setUTCFullYear(end.getUTCFullYear() + length);
      break;
  }
  return end;
}

/**
 * Bordered shell that wraps a single Exit Condition (Hard Cap or
 * Deadline). Matches the Figma where each condition sits in its own
 * outlined box stacked vertically inside the section.
 */
function ExitConditionBox({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex flex-col gap-3 rounded-[8px] border border-border bg-white p-4">
      {children}
    </div>
  );
}

function CheckBoxBox({ checked }: Readonly<{ checked: boolean }>) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-[18px] shrink-0 place-items-center rounded-[4px] border-2 transition-colors',
        checked
          ? 'border-foreground bg-foreground text-background'
          : 'border-neutral bg-white text-transparent',
      )}
    >
      <Check className="size-3" strokeWidth={3} />
    </span>
  );
}


/* ─── Section: Running Totals (inline strip) ────────────────────────────── */

type RunningTotalsSectionProps = Readonly<{
  mode: SettlementMode;
  deductions: ReadonlyArray<DeductionRow>;
  deductionsEnabled: boolean;
  tier2Rows: DistributionRowMap;
  splitRows: DistributionRowMap;
}>;

function RunningTotalsSection({
  mode,
  deductions,
  deductionsEnabled,
  tier2Rows,
  splitRows,
}: RunningTotalsSectionProps) {
  const distSum = useMemo(() => {
    const map =
      mode === 'waterfall' ? tier2Rows : mode === 'revenue_share' ? splitRows : null;
    if (!map) return null;
    return Object.values(map).reduce((acc, v) => {
      const n = Number(v);
      return Number.isFinite(n) ? acc + n : acc;
    }, 0);
  }, [mode, tier2Rows, splitRows]);
  const distSumValid = distSum === null || Math.abs(distSum - 100) < 0.01;

  const deductionSummary = useMemo(() => {
    if (!deductionsEnabled) return null;
    let totalPct = 0;
    let totalFlat = 0;
    for (const d of deductions) {
      const n = Number(d.amount);
      if (!Number.isFinite(n)) continue;
      if (d.feeType === 'flat') totalFlat += n;
      else totalPct += n;
    }
    if (totalPct === 0 && totalFlat === 0) return null;
    if (totalPct > 0 && totalFlat > 0) {
      return `${formatNumber(totalPct)}% + ${formatCurrency(totalFlat)}`;
    }
    if (totalFlat > 0) return formatCurrency(totalFlat);
    return `${formatNumber(totalPct)}%`;
  }, [deductions, deductionsEnabled]);

  const distLabel = mode === 'waterfall' ? 'Tier 2 Allocation' : 'Revenue Split';

  return (
    <SectionCard title="Running Totals">
      <div className="flex flex-wrap items-center gap-x-12 gap-y-3 text-[14px]">
        {distSum !== null && (
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">{distLabel}</span>
            <span className={cn(distSumValid ? 'text-neutral' : 'font-semibold text-danger')}>
              : {formatNumber(distSum)}%
            </span>
          </div>
        )}
        {deductionSummary && (
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">Distribution Fee</span>
            <span className="text-neutral">: {deductionSummary}</span>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

/* ─── Shared helpers ────────────────────────────────────────────────────── */

type PillToggleProps = Readonly<{
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}>;

function PillToggle({ label, checked, onChange }: PillToggleProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <span className="text-[12px] font-medium text-foreground">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          'flex h-[22px] w-[40px] items-center rounded-full border-2 transition-colors',
          checked ? 'border-foreground bg-foreground' : 'border-neutral bg-grey-50',
        )}
      >
        <span
          className={cn(
            'block size-[16px] rounded-full transition-transform',
            checked ? 'translate-x-[18px] bg-background' : 'translate-x-[2px] bg-neutral',
          )}
        />
      </span>
    </label>
  );
}

/** Local-only id for React keys on dynamic rows. */
function cryptoRandomId(): string {
  return Math.random().toString(36).slice(2, 10);
}
