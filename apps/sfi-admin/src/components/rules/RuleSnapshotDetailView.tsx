'use client';

import { Lock } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';

import { BackLink } from '@/components/common/BackLink';
import { RuleSnapshotStatusBadge } from '@/components/rules/RuleSnapshotStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { PARTICIPANT_BEHAVIOR_LABEL } from '@/constants/ui';
import { useParticipants } from '@/hooks/participants/useParticipants';
import { useRuleSnapshot } from '@/hooks/rules/useRuleSnapshot';
import { cn } from '@/lib/utils';
import type { Participant } from '@/types/participant.types';
import {
  deriveRuleSnapshotStatus,
  getRulesSchemaVersion,
  type AllocationSplit,
  type RuleSnapshot,
  type RuleSnapshotRulesV2,
  type SettlementMode,
} from '@/types/rule-snapshot.types';
import { formatDate } from '@/utils/date';
import { formatCurrency, formatNumber } from '@/utils/format';

type RuleSnapshotDetailViewProps = Readonly<{
  dealId: string;
  snapshotId: string;
}>;

const MODE_LABEL: Record<SettlementMode, string> = {
  revenue_share: 'Revenue Share',
  recoup: 'Recoup',
  waterfall: 'Waterfall',
};

const MODE_DESCRIPTION: Record<SettlementMode, string> = {
  revenue_share:
    'Every revenue period is split between the targets below. No recoupment, no waterfall.',
  recoup:
    'Targets recoup their capital up to the cap below, then payouts stop.',
  waterfall:
    'Tier 1 runs until the recoup cap is reached, then Tier 2 splits the remainder.',
};

/**
 * Read-only Rule Snapshot detail.
 *
 * Liang 08/18: "after Rule Snapshots made, how can I check the Rule
 * Snapshots? I understand no more editing but how can review? if mistakes,
 * where is the mistake". Snapshots are immutable by design, so this screen
 * exists purely to read one back: what mode it uses, what comes off the
 * top, and exactly who receives what.
 *
 * Renders the stored `rules` JSON directly rather than reconstructing
 * wizard state, so what shows here is what the engine will actually run.
 */
export function RuleSnapshotDetailView({
  dealId,
  snapshotId,
}: RuleSnapshotDetailViewProps) {
  const { data: snapshot, isLoading, isError, refetch } = useRuleSnapshot(snapshotId);
  const { data: participantsData } = useParticipants(dealId, { limit: 200 });

  const participants = useMemo<ReadonlyArray<Participant>>(
    () => participantsData?.data ?? [],
    [participantsData],
  );
  const nameById = useMemo(() => {
    const map = new Map<string, Participant>();
    for (const p of participants) map.set(p.id, p);
    return map;
  }, [participants]);

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink href={ROUTES.DEALS.RULES(dealId)} label="Rule Snapshots" />
        <div className="flex flex-col items-center gap-3 rounded-[8px] border border-border bg-white py-16 text-center">
          <p className="text-[14px] text-danger">Failed to load this rule snapshot.</p>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={ROUTES.DEALS.RULES(dealId)} label="Rule Snapshots" />

      <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
        {snapshot ? `Rule Snapshot v${snapshot.version}` : 'Rule Snapshot'}
      </h1>

      <section className="flex flex-col gap-6 rounded-[8px] border border-border bg-white p-4 sm:p-6">
        {isLoading || !snapshot ? (
          <SnapshotSkeleton />
        ) : (
          <SnapshotBody snapshot={snapshot} nameById={nameById} />
        )}
      </section>
    </div>
  );
}

function SnapshotBody({
  snapshot,
  nameById,
}: Readonly<{
  snapshot: RuleSnapshot;
  nameById: Map<string, Participant>;
}>) {
  const status = deriveRuleSnapshotStatus(snapshot);
  const version = getRulesSchemaVersion(snapshot.rules);

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-[22px] font-bold leading-[28px] tracking-[0.044px] text-foreground">
            Version {snapshot.version}
          </h2>
          <p className="text-[13px] leading-[18px] text-neutral">
            Effective {formatDate(snapshot.effectiveFrom)}
            {' to '}
            {snapshot.effectiveTo ? formatDate(snapshot.effectiveTo) : 'Present'}
            {' | '}
            {formatNumber(snapshot.participantCount)} participants
          </p>
        </div>
        <RuleSnapshotStatusBadge status={status} />
      </div>

      <div className="flex items-center gap-2 rounded-[8px] border border-dashed border-border px-4 py-3">
        <Lock className="size-4 shrink-0 text-neutral" aria-hidden />
        <p className="text-[13px] leading-[18px] text-neutral">
          Snapshots are immutable so past settlements always reproduce. To change
          the rules, create a new version; this one stays as the record of what
          ran while it was active.
        </p>
      </div>

      {version === 2 ? (
        <V2Body rules={snapshot.rules as RuleSnapshotRulesV2} nameById={nameById} />
      ) : (
        <Card title="Rules">
          <p className="text-[14px] leading-[20px] text-neutral">
            This snapshot uses the legacy rule format. Open it in the API or
            recreate it as a new version to see the structured breakdown.
          </p>
        </Card>
      )}

      {snapshot.notes && (
        <Card title="Notes">
          <p className="whitespace-pre-wrap text-[14px] leading-[20px] text-foreground">
            {snapshot.notes}
          </p>
        </Card>
      )}
    </>
  );
}

function V2Body({
  rules,
  nameById,
}: Readonly<{
  rules: RuleSnapshotRulesV2;
  nameById: Map<string, Participant>;
}>) {
  const deductions = rules.deductions ?? [];
  const poolSources = rules.poolRevenueSources ?? [];
  const tiers = rules.tiers ?? [];

  return (
    <>
      <Card title="Distribution Mode">
        <div className="flex flex-col gap-1">
          <span className="text-[15px] font-semibold text-foreground">
            {MODE_LABEL[rules.mode]}
          </span>
          <span className="text-[13px] leading-[18px] text-neutral">
            {MODE_DESCRIPTION[rules.mode]}
          </span>
        </div>
      </Card>

      <Card title="Deductions Layer">
        {deductions.length === 0 ? (
          <p className="text-[14px] text-neutral">
            No deductions. Allocations are taken from gross revenue.
          </p>
        ) : (
          <dl className="flex flex-col gap-2">
            {deductions.map((d) => (
              <Row
                key={d.participantId}
                label={nameById.get(d.participantId)?.name ?? 'Unknown participant'}
                value={
                  d.feeAmount !== undefined && d.feeAmount > 0
                    ? formatCurrency(d.feeAmount)
                    : `${formatNumber(d.feePercentage)}%`
                }
              />
            ))}
          </dl>
        )}
      </Card>

      {poolSources.length > 0 && (
        <Card title="Pool Revenue Source">
          <dl className="flex flex-col gap-2">
            {poolSources.map((p) => (
              <Row
                key={p.poolId}
                label="Investor Pool"
                value={`${formatNumber(p.percentage)}% of ${
                  p.basis === 'GROSS' ? 'Gross' : 'Net'
                } Revenue`}
              />
            ))}
          </dl>
        </Card>
      )}

      {rules.splits && rules.splits.length > 0 && (
        <Card title="Revenue Split">
          <SplitsTable splits={rules.splits} nameById={nameById} />
        </Card>
      )}

      {tiers.map((tier) => (
        <Card
          key={tier.tier}
          title={
            tier.tier === 1 ? 'Tier 1: Recoupment Phase' : 'Tier 2: Post Recoup Split'
          }
        >
          <SplitsTable splits={tier.splits} nameById={nameById} />
          {(tier.hardCapMultiplier !== undefined ||
            tier.recoupMultiplier !== undefined ||
            tier.deadline) && (
            <dl className="flex flex-col gap-2 border-t border-grey-100 pt-3">
              {tier.hardCapMultiplier !== undefined && (
                <Row
                  label="Hard Cap"
                  value={`${formatNumber(tier.hardCapMultiplier * 100)}% of invested capital`}
                />
              )}
              {tier.recoupMultiplier !== undefined && (
                <Row
                  label="Recoup Multiplier"
                  value={`${formatNumber(tier.recoupMultiplier)}x`}
                />
              )}
              {tier.deadline && (
                <Row label="Deadline" value={formatDate(tier.deadline)} />
              )}
            </dl>
          )}
        </Card>
      ))}
    </>
  );
}

function SplitsTable({
  splits,
  nameById,
}: Readonly<{
  splits: ReadonlyArray<AllocationSplit>;
  nameById: Map<string, Participant>;
}>) {
  const total = splits.reduce((acc, s) => acc + s.percentage, 0);
  const balanced = Math.abs(total - 100) < 0.01;

  return (
    <div className="flex flex-col">
      {splits.map((split, idx) => {
        const { target } = split;
        const isPool = target.type === 'pool';
        const participant =
          target.type === 'individual'
            ? nameById.get(target.participantId)
            : undefined;
        const label =
          target.type === 'pool'
            ? (target.displayName ?? 'Investor Pool')
            : (participant?.name ?? 'Unknown participant');
        return (
          <div
            key={`${label}-${idx}`}
            className="flex items-center justify-between gap-3 border-b border-grey-100 py-2 last:border-b-0"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-[14px] text-foreground">{label}</span>
              {isPool ? (
                <Badge size="sm" variant="info">
                  Pool
                </Badge>
              ) : (
                participant && (
                  <span className="shrink-0 text-[12px] text-neutral">
                    {PARTICIPANT_BEHAVIOR_LABEL[participant.behaviorType]}
                  </span>
                )
              )}
            </span>
            <span className="shrink-0 text-[14px] font-medium text-foreground">
              {formatNumber(split.percentage)}%
            </span>
          </div>
        );
      })}
      <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
        <span className="text-[13px] font-semibold text-foreground">Total</span>
        <span
          className={cn(
            'text-[13px] font-semibold',
            balanced ? 'text-success' : 'text-danger',
          )}
        >
          {formatNumber(total)}%
        </span>
      </div>
    </div>
  );
}

/* ─── Primitives ────────────────────────────────────────────────────────── */

function Card({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <div className="flex flex-col gap-3 rounded-[8px] border border-border bg-white p-4">
      <div className="border-b border-border pb-2">
        <h3 className="text-[15px] font-semibold leading-[22px] text-foreground">
          {title}
        </h3>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="grid grid-cols-[minmax(140px,1fr)_auto] gap-3">
      <dt className="truncate text-[14px] leading-[20px] text-foreground">{label}</dt>
      <dd className="text-[14px] font-medium leading-[20px] text-foreground">
        {value}
      </dd>
    </div>
  );
}

function SnapshotSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-24 w-full rounded-[8px]" />
      <Skeleton className="h-32 w-full rounded-[8px]" />
    </div>
  );
}
