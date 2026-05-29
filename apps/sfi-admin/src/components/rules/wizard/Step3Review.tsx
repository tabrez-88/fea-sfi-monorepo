'use client';

import { AlertTriangle, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Banner } from '@/components/common/Banner';
import { Button } from '@/components/ui/button';
import { useParticipants } from '@/hooks/participants/useParticipants';
import { cn } from '@/lib/utils';
import { ParticipantBehavior, type Participant } from '@/types/participant.types';
import { formatDate } from '@/utils/date';
import { formatCurrency, formatNumber } from '@/utils/format';

import {
  POOL_TARGET_ID,
  type WizardStep1Data,
  type WizardStep2Data,
} from './wizard-state.types';

/* ─── Component contract ──────────────────────────────────────────────── */

type Step3ReviewProps = Readonly<{
  dealId: string;
  step1: WizardStep1Data;
  step2: WizardStep2Data;
  /** Next snapshot version number (derived by the container from the list). */
  nextVersion: number;
  /** Disables submit while the create mutation is in flight. */
  submitting: boolean;
  /** BE/validator errors surfaced from the container. */
  errors?: ReadonlyArray<string>;
  onPrev: () => void;
  onCreate: () => void;
}>;

/**
 * Step 3 of the Create Rule Snapshot wizard: Review + submit.
 *
 * Mirrors the Figma frame `1299:11139`. Renders read-only previews
 * derived from Step 1 + Step 2 wizard state plus the deal's participant
 * roster (fetched here for display labels / behavior badges / units /
 * investment amounts — the payload itself is assembled in
 * `buildRuleSnapshotPayload.ts`).
 *
 * The actual POST happens in the parent container so it can manage the
 * mutation lifecycle (toast, navigation, query invalidation). This
 * component only emits `onCreate()` and shows the loading state.
 */
export function Step3Review({
  dealId,
  step1,
  step2,
  nextVersion,
  submitting,
  errors,
  onPrev,
  onCreate,
}: Step3ReviewProps) {
  const participantsQuery = useParticipants(dealId, {
    page: 1,
    limit: 100,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const participants = participantsQuery.data?.data ?? [];

  return (
    <section className="flex flex-col gap-4 rounded-[8px] border border-border bg-white p-4 sm:p-6">
      <ReviewHeader />

      <Banner tone="warning" icon={AlertTriangle}>
        Please review the rules carefully. Once created, this snapshot is{' '}
        <strong className="font-bold text-danger">PERMANENTLY IMMUTABLE</strong>{' '}
        (cannot be edited or deleted).
      </Banner>

      <PreviewHeader
        nextVersion={nextVersion}
        effectiveFrom={step1.effectiveFrom}
        mode={step2.mode}
      />

      <RuleSummaryCard step2={step2} participants={participants} />

      <ProfitSplitCard step2={step2} participants={participants} />

      <ParticipantTermsCard step2={step2} participants={participants} />

      <InvestorPoolConfigCard step2={step2} participants={participants} />

      <NotesCard notes={step1.notes} />

      {errors && errors.length > 0 && (
        <Banner tone="danger">
          <p className="font-semibold">
            Fix the following before creating the snapshot:
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Banner>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onPrev} disabled={submitting}>
          Previous
        </Button>
        <Button type="button" onClick={onCreate} disabled={submitting}>
          {submitting ? 'Creating Snapshot…' : 'Create Snapshot'}
        </Button>
      </div>
    </section>
  );
}

/* ─── Header + warning ────────────────────────────────────────────────── */

function ReviewHeader() {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[20px] font-bold leading-[28px] tracking-[-0.4px] text-foreground">
        Review
      </h2>
      <span className="text-[14px] font-medium text-neutral">Step 3 of 3</span>
    </div>
  );
}

type PreviewHeaderProps = Readonly<{
  nextVersion: number;
  effectiveFrom: string;
  mode: WizardStep2Data['mode'];
}>;

function PreviewHeader({ nextVersion, effectiveFrom, mode }: PreviewHeaderProps) {
  // "{effectiveFrom} - Present" reads naturally as a date range with an
  // open right side. When the admin hasn't picked a date (shouldn't
  // happen — Step 1 validates), fall back to "Today" so the row still
  // renders something meaningful.
  const fromLabel = effectiveFrom ? formatDate(effectiveFrom) : 'Today';
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-[20px] font-semibold leading-[28px] text-foreground">
          Preview Rule Snapshot Version {nextVersion}
        </h3>
        <p className="text-[14px] text-neutral">{fromLabel} - Present</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="inline-flex items-center rounded-full border border-border px-3 py-0.5 text-[12px] font-medium text-neutral">
          Draft
        </span>
        <p className="text-[14px] text-foreground">
          <span className="font-semibold">Mode:</span> {MODE_LABELS[mode]}
        </p>
      </div>
    </div>
  );
}

const MODE_LABELS: Record<WizardStep2Data['mode'], string> = {
  revenue_share: 'Revenue Share',
  recoup: 'Recoup',
  waterfall: 'Waterfall',
};

/* ─── Card shell ──────────────────────────────────────────────────────── */

type ReviewSectionCardProps = Readonly<{
  title: string;
  children: React.ReactNode;
}>;

function ReviewSectionCard({ title, children }: ReviewSectionCardProps) {
  return (
    <section className="flex flex-col gap-3 rounded-[8px] border border-border bg-white p-4 sm:p-5">
      <h3 className="text-[18px] font-bold leading-[24px] text-foreground">
        {title}
      </h3>
      <div className="h-px bg-grey-100" />
      {children}
    </section>
  );
}

/* ─── Rule Summary card (3 stat tiles) ────────────────────────────────── */

type RuleSummaryProps = Readonly<{
  step2: WizardStep2Data;
  participants: ReadonlyArray<Participant>;
}>;

function RuleSummaryCard({ step2, participants }: RuleSummaryProps) {
  const totalParticipants = useMemo(() => {
    // "Total Participants" on the summary card = every participant that
    // will appear somewhere in the snapshot payload. Mirrors the union
    // built by `buildParticipantInputs` in the payload assembler so the
    // tile and the wire payload always agree.
    const ids = new Set<string>();
    for (const row of step2.deductions) {
      if (row.included && row.participantId) ids.add(row.participantId);
    }
    for (const id of step2.selectedTargets) {
      if (id !== POOL_TARGET_ID) ids.add(id);
    }
    if (step2.selectedTargets.includes(POOL_TARGET_ID)) {
      for (const p of participants) {
        if (p.poolMember === true) ids.add(p.id);
      }
    }
    return ids.size;
  }, [step2.deductions, step2.selectedTargets, participants]);

  const deductionSummary = useMemo(() => {
    if (!step2.deductionsEnabled) return { value: '-', desc: 'Disabled' };
    let totalPct = 0;
    let totalFlat = 0;
    for (const d of step2.deductions) {
      if (!d.included) continue;
      const n = Number(d.amount);
      if (!Number.isFinite(n)) continue;
      if (d.feeType === 'flat') totalFlat += n;
      else totalPct += n;
    }
    if (totalPct === 0 && totalFlat === 0) return { value: '0%', desc: 'Off the Top' };
    if (totalPct > 0 && totalFlat > 0) {
      return {
        value: `${formatNumber(totalPct)}% + ${formatCurrency(totalFlat)}`,
        desc: 'Off the Top',
      };
    }
    if (totalFlat > 0) return { value: formatCurrency(totalFlat), desc: 'Off the Top' };
    return { value: `${formatNumber(totalPct)}%`, desc: 'Off the Top' };
  }, [step2.deductions, step2.deductionsEnabled]);

  const recoupSummary = useMemo(() => {
    if (step2.mode === 'revenue_share') return null;
    const rows = step2.mode === 'recoup' ? step2.recoupRows : step2.tier1Rows;
    // Surface the pool's multiplier when present (most common single-row
    // case); otherwise show the largest configured multiplier as a
    // representative "Individual Cap". Empty → "-".
    const poolValue = Number(rows[POOL_TARGET_ID]);
    if (Number.isFinite(poolValue) && poolValue > 0) {
      return { value: `${formatNumber(poolValue)}%`, desc: 'Individual Cap' };
    }
    const allValues = Object.values(rows)
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (allValues.length === 0) return { value: '-', desc: 'Individual Cap' };
    return { value: `${formatNumber(Math.max(...allValues))}%`, desc: 'Individual Cap' };
  }, [step2.mode, step2.recoupRows, step2.tier1Rows]);

  return (
    <ReviewSectionCard title="Rule Summary">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile title="Total Participants" value={String(totalParticipants)} />
        <StatTile
          title="Total Deductions"
          value={deductionSummary.value}
          desc={deductionSummary.desc}
        />
        {recoupSummary && (
          <StatTile
            title="Recoupment"
            value={recoupSummary.value}
            desc={recoupSummary.desc}
          />
        )}
      </div>
    </ReviewSectionCard>
  );
}

type StatTileProps = Readonly<{
  title: string;
  value: string;
  desc?: string;
}>;

function StatTile({ title, value, desc }: StatTileProps) {
  return (
    <div className="flex h-[140px] flex-col gap-2 rounded-[8px] border border-neutral bg-white p-5">
      <p className="text-[14px] leading-[20px] text-foreground">{title}</p>
      <p className="text-[28px] font-medium leading-[34px] tracking-[-0.4px] text-foreground">
        {value}
      </p>
      {desc && <p className="text-[13px] text-foreground">{desc}</p>}
    </div>
  );
}

/* ─── Profit Split card (horizontal bars) ─────────────────────────────── */

type ProfitSplitProps = Readonly<{
  step2: WizardStep2Data;
  participants: ReadonlyArray<Participant>;
}>;

function ProfitSplitCard({ step2, participants }: ProfitSplitProps) {
  // Profit split source per mode:
  //   - revenue_share → top-level splits
  //   - recoup        → tier 1 (recoup phase)
  //   - waterfall     → tier 2 (post recoup split — the "profit" tier)
  //
  // In waterfall mode we also apply the Tier 2 visibility filter
  // (Pool + non-RECOUPMENT solo) so the Review preview only surfaces
  // splits the payload assembler will actually emit. Without this
  // filter, a stale tier2Rows value left from before the admin toggled
  // a participant's behavior could leak into the preview and confuse
  // the read of what's going to ship.
  const rows = useMemo(() => {
    const map =
      step2.mode === 'revenue_share'
        ? step2.splitRows
        : step2.mode === 'recoup'
          ? step2.recoupRows
          : step2.tier2Rows;
    const isAllowed = (targetId: string): boolean => {
      if (step2.mode !== 'waterfall') return true;
      if (targetId === POOL_TARGET_ID) return true;
      const p = participants.find((x) => x.id === targetId);
      return p !== undefined && p.behaviorType !== ParticipantBehavior.RECOUPMENT;
    };
    const entries = Object.entries(map)
      .filter(([targetId]) => isAllowed(targetId))
      .map(([targetId, raw]) => ({
        targetId,
        label: labelForTarget(targetId, participants),
        percentage: Number(raw),
      }))
      .filter((r) => Number.isFinite(r.percentage) && r.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage);
    return entries;
  }, [step2.mode, step2.splitRows, step2.recoupRows, step2.tier2Rows, participants]);

  const total = rows.reduce((acc, r) => acc + r.percentage, 0);
  const totalValid = Math.abs(total - 100) < 0.01;

  return (
    <ReviewSectionCard title="Profit Split">
      {rows.length === 0 ? (
        <p className="text-[13px] text-neutral">
          No profit split configured yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r) => (
            <ProfitSplitBar
              key={r.targetId}
              label={r.label}
              percentage={r.percentage}
              widthFraction={r.percentage / 100}
            />
          ))}
        </div>
      )}
      <p className="text-[13px] font-medium text-foreground">
        Total Profit Presentation{' '}
        <span className={cn('font-bold', totalValid ? 'text-foreground' : 'text-danger')}>
          {formatNumber(total)}%
        </span>
      </p>
    </ReviewSectionCard>
  );
}

type ProfitSplitBarProps = Readonly<{
  label: string;
  percentage: number;
  /** 0-1; the bar's width as a fraction of the section's full width. */
  widthFraction: number;
}>;

function ProfitSplitBar({ label, percentage, widthFraction }: ProfitSplitBarProps) {
  // Width tracks the percentage 1:1 across the full row, so 100% spans
  // end-to-end and 20% spans 20% of the row. A small floor keeps very
  // thin splits (< ~5%) from clipping their label below readability,
  // without distorting the proportional read for typical values.
  const pct = Math.max(0.05, widthFraction);
  return (
    <div className="flex w-full items-center gap-3">
      <div className="flex-1">
        <div
          className="flex items-center rounded-[8px] bg-foreground px-4 py-2"
          style={{ width: `${pct * 100}%` }}
        >
          <span className="truncate text-[13px] text-background">{label}</span>
        </div>
      </div>
      <span className="shrink-0 text-[13px] font-medium text-foreground">
        {formatNumber(percentage)}%
      </span>
    </div>
  );
}

/* ─── Participant Terms card (the big table) ──────────────────────────── */

type ParticipantTermsProps = Readonly<{
  step2: WizardStep2Data;
  participants: ReadonlyArray<Participant>;
}>;

function ParticipantTermsCard({ step2, participants }: ParticipantTermsProps) {
  const [poolExpanded, setPoolExpanded] = useState(true);
  const poolMembers = useMemo(
    () => participants.filter((p) => p.poolMember === true),
    [participants],
  );
  const rows = useMemo(
    () => buildParticipantTermRows(step2, participants),
    [step2, participants],
  );
  const poolIsTarget = step2.selectedTargets.includes(POOL_TARGET_ID);
  const tier1PoolValue = numericValue(step2.tier1Rows[POOL_TARGET_ID]);
  const tier2PoolValue = numericValue(step2.tier2Rows[POOL_TARGET_ID]);
  const recoupPoolValue = numericValue(step2.recoupRows[POOL_TARGET_ID]);

  return (
    <ReviewSectionCard title="Participant Terms">
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <ParticipantTermsHeader />
          {rows.map((row) => (
            <ParticipantTermsRow key={row.participantId} row={row} />
          ))}
          {poolIsTarget && (
            <PoolTermsRow
              expanded={poolExpanded}
              onToggle={() => setPoolExpanded((p) => !p)}
              tier1Pct={tier1PoolValue}
              tier2Pct={tier2PoolValue}
              recoupPct={recoupPoolValue}
              mode={step2.mode}
              members={poolMembers}
            />
          )}
        </div>
      </div>
    </ReviewSectionCard>
  );
}

function ParticipantTermsHeader() {
  return (
    <div className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.8fr_0.8fr] items-center gap-x-3 border-b border-grey-200 bg-grey-50 px-3 py-3 text-[13px] font-bold text-foreground">
      <span>Name</span>
      <span>Behavior</span>
      <span>Fee %</span>
      <span>Tier 1 Cap</span>
      <span>Tier 2 Cap</span>
      <span>Profit %</span>
    </div>
  );
}

type ParticipantTermRow = {
  participantId: string;
  name: string;
  behavior: ParticipantBehavior;
  feeText: string;
  tier1Cap: string;
  tier2Cap: string;
  profitPct: string;
};

function buildParticipantTermRows(
  step2: WizardStep2Data,
  participants: ReadonlyArray<Participant>,
): ParticipantTermRow[] {
  const byId = new Map(participants.map((p) => [p.id, p]));
  const deductionByPid = new Map<string, { feeType: string; amount: string }>();
  if (step2.deductionsEnabled) {
    for (const d of step2.deductions) {
      if (d.included && d.participantId) {
        deductionByPid.set(d.participantId, { feeType: d.feeType, amount: d.amount });
      }
    }
  }
  const profitMap =
    step2.mode === 'revenue_share'
      ? step2.splitRows
      : step2.mode === 'waterfall'
        ? step2.tier2Rows
        : {};
  const recoupMap = step2.mode === 'waterfall' ? step2.tier1Rows : step2.recoupRows;
  const ids = new Set<string>();
  for (const d of step2.deductions) {
    if (d.included && d.participantId) ids.add(d.participantId);
  }
  for (const id of step2.selectedTargets) {
    if (id !== POOL_TARGET_ID) ids.add(id);
  }
  const rows: ParticipantTermRow[] = [];
  for (const id of ids) {
    const p = byId.get(id);
    if (!p) continue;
    rows.push({
      participantId: p.id,
      name: p.name,
      behavior: p.behaviorType,
      feeText: formatDeductionCell(deductionByPid.get(p.id)),
      tier1Cap: formatPercent(recoupMap[id]),
      tier2Cap:
        step2.mode === 'waterfall' ? formatPercent(step2.tier2Rows[id]) : '-',
      profitPct: formatPercent(profitMap[id]),
    });
  }
  return rows;
}

function ParticipantTermsRow({ row }: Readonly<{ row: ParticipantTermRow }>) {
  return (
    <div className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.8fr_0.8fr] items-center gap-x-3 border-b border-grey-100 px-3 py-3 text-[13px] text-foreground">
      <span className="truncate">
        <span className="underline decoration-foreground/40 underline-offset-2">
          {row.name}
        </span>
      </span>
      <span>
        <BehaviorBadge behavior={row.behavior} />
      </span>
      <span>{row.feeText}</span>
      <span>{row.tier1Cap}</span>
      <span>{row.tier2Cap}</span>
      <span>{row.profitPct}</span>
    </div>
  );
}

type PoolTermsRowProps = Readonly<{
  expanded: boolean;
  onToggle: () => void;
  tier1Pct: number | null;
  tier2Pct: number | null;
  recoupPct: number | null;
  mode: WizardStep2Data['mode'];
  members: ReadonlyArray<Participant>;
}>;

function PoolTermsRow({
  expanded,
  onToggle,
  tier1Pct,
  tier2Pct,
  recoupPct,
  mode,
  members,
}: PoolTermsRowProps) {
  const tier1Display =
    mode === 'waterfall'
      ? tier1Pct !== null
        ? `${formatNumber(tier1Pct)}%`
        : '-'
      : recoupPct !== null
        ? `${formatNumber(recoupPct)}%`
        : '-';
  const tier2Display = mode === 'waterfall' && tier2Pct !== null
    ? `${formatNumber(tier2Pct)}%`
    : '-';
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="grid w-full grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.8fr_0.8fr] items-center gap-x-3 border-b border-grey-100 px-3 py-3 text-left text-[13px] text-foreground hover:bg-grey-50/40"
      >
        <span className="flex items-center gap-2 truncate">
          <ChevronDown
            aria-hidden
            strokeWidth={2}
            className={cn(
              'size-4 transition-transform duration-200',
              !expanded && '-rotate-90',
            )}
          />
          <span className="underline decoration-foreground/40 underline-offset-2">
            Investor Pool
          </span>
        </span>
        <span>
          <BehaviorBadge behavior={ParticipantBehavior.RECOUPMENT} label="Recoupment" />
        </span>
        <span>-</span>
        <span>{tier1Display}</span>
        <span>{tier2Display}</span>
        <span>-</span>
      </button>
      {expanded && <IndividualInvestorsSubtable members={members} />}
    </>
  );
}

/* ─── Pool members subtable ──────────────────────────────────────────── */

function IndividualInvestorsSubtable({
  members,
}: Readonly<{ members: ReadonlyArray<Participant> }>) {
  return (
    <div className="border-b border-grey-100 px-3 py-3">
      <div className="flex flex-col gap-2 rounded-[8px] border border-border bg-white p-3">
        <p className="text-[14px] font-bold text-foreground">Individual Investors</p>
        <div className="h-px bg-grey-100" />
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[1.2fr_0.6fr_0.8fr_0.8fr_0.8fr_1fr] items-center gap-x-3 border-b border-grey-200 bg-grey-50 px-3 py-2 text-[12px] font-bold text-foreground">
              <span>Name</span>
              <span>Units</span>
              <span>Invested</span>
              <span>Tier 1 Cap</span>
              <span>Tier 2 Cap</span>
              <span>Exit Condition</span>
            </div>
            {members.length === 0 ? (
              <p className="px-3 py-3 text-[12px] text-neutral">
                No pool members yet. Upload a pool CSV in Step 2 to seed
                individual investors.
              </p>
            ) : (
              members.map((m) => (
                <div
                  key={m.id}
                  className="grid grid-cols-[1.2fr_0.6fr_0.8fr_0.8fr_0.8fr_1fr] items-center gap-x-3 border-b border-grey-100 px-3 py-2 text-[12px] text-foreground"
                >
                  <span className="truncate">{m.name}</span>
                  <span>{m.units !== null ? formatNumber(m.units) : '-'}</span>
                  <span>{formatCurrency(m.investmentAmount)}</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Investor Pool Configuration summary card ────────────────────────── */

type InvestorPoolConfigProps = Readonly<{
  step2: WizardStep2Data;
  participants: ReadonlyArray<Participant>;
}>;

function InvestorPoolConfigCard({ step2, participants }: InvestorPoolConfigProps) {
  const poolMembers = useMemo(
    () => participants.filter((p) => p.poolMember === true),
    [participants],
  );
  const totalUnits = useMemo(
    () => poolMembers.reduce((acc, m) => acc + (m.units ?? 0), 0),
    [poolMembers],
  );
  const poolIsTarget = step2.selectedTargets.includes(POOL_TARGET_ID);
  if (!poolIsTarget) return null;
  return (
    <ReviewSectionCard title="Investor Pool Configuration">
      <div className="flex flex-col gap-2">
        <SummaryRow label="Investor Valid" value={String(poolMembers.length)} />
        <SummaryRow
          label="Total Units"
          value={`${formatNumber(totalUnits)} Shares`}
        />
        <SummaryRow
          label="Pool Revenue Source"
          value={`${formatNumber(Number(step2.poolRevenue.percentage) || 0)}% of ${
            step2.poolRevenue.basis === 'GROSS' ? 'Gross' : 'Net'
          }`}
        />
      </div>
    </ReviewSectionCard>
  );
}

function SummaryRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-[14px] font-bold text-foreground">{label}</span>
      <span className="text-[14px] text-foreground">: {value}</span>
    </div>
  );
}

/* ─── Notes card ──────────────────────────────────────────────────────── */

function NotesCard({ notes }: Readonly<{ notes: string }>) {
  const trimmed = notes.trim();
  return (
    <ReviewSectionCard title="Notes">
      <p
        className={cn(
          'text-[14px] leading-[22px]',
          trimmed ? 'whitespace-pre-wrap text-foreground' : 'text-neutral',
        )}
      >
        {trimmed || 'No Notes'}
      </p>
    </ReviewSectionCard>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

type BehaviorBadgeProps = Readonly<{
  behavior: ParticipantBehavior;
  /** Override the default label (Investor Pool reuses RECOUPMENT styling). */
  label?: string;
}>;

const BEHAVIOR_STYLES: Record<ParticipantBehavior, { label: string; cls: string }> = {
  FEE_DEDUCTION: {
    label: 'Fee Deductions',
    cls: 'border-[#9A09FB] text-[#9A09FB]',
  },
  FLAT_FEE: {
    label: 'Flat Fee',
    cls: 'border-[#560590] text-[#560590]',
  },
  NET_PROFIT_SHARE: {
    label: 'Profit Share',
    cls: 'border-[#0972FB] text-[#0972FB]',
  },
  RECOUPMENT: {
    label: 'Recoupment',
    cls: 'border-success text-success',
  },
  PASS_THROUGH: {
    label: 'Pass Through',
    cls: 'border-neutral text-neutral',
  },
};

function BehaviorBadge({ behavior, label }: BehaviorBadgeProps) {
  const style = BEHAVIOR_STYLES[behavior];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border bg-white px-3 py-0.5 text-[12px] font-semibold',
        style.cls,
      )}
    >
      {label ?? style.label}
    </span>
  );
}

function labelForTarget(
  targetId: string,
  participants: ReadonlyArray<Participant>,
): string {
  if (targetId === POOL_TARGET_ID) return 'Investor Pool';
  const match = participants.find((p) => p.id === targetId);
  return match ? match.name : 'Unknown target';
}

function formatPercent(raw: string | undefined): string {
  if (raw === undefined || raw === '') return '-';
  const n = Number(raw);
  if (!Number.isFinite(n) || n === 0) return '-';
  return `${formatNumber(n)}%`;
}

function formatDeductionCell(d: { feeType: string; amount: string } | undefined): string {
  if (!d) return '-';
  const n = Number(d.amount);
  if (!Number.isFinite(n) || n === 0) return '-';
  if (d.feeType === 'flat') return `${formatCurrency(n)} Flat`;
  return `${formatNumber(n)}% ${d.feeType === 'percent_gross' ? 'Gross' : 'Net'}`;
}

function numericValue(raw: string | undefined): number | null {
  if (raw === undefined || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) && n !== 0 ? n : null;
}
