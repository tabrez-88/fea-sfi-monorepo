import Link from 'next/link';
import { Fragment } from 'react';

import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

type Step = Readonly<{
  number: number;
  label: string;
  href: (dealId: string) => string;
}>;

const STEPS: ReadonlyArray<Step> = [
  { number: 1, label: 'Add Participants', href: ROUTES.DEALS.PARTICIPANTS },
  { number: 2, label: 'Create Rules', href: ROUTES.DEALS.RULES },
  { number: 3, label: 'Submit Revenue', href: ROUTES.DEALS.REVENUE },
  { number: 4, label: 'Run Settlement', href: ROUTES.DEALS.SETTLEMENT },
];

type NoSettlementsWorkflowProps = Readonly<{
  dealId: string;
}>;

/**
 * Empty-state for "Latest Settlement" when the deal has no runs yet. Matches
 * Figma "Deal Detail [Empty]": dashed-border container with a headline
 * message and a 4-step numbered workflow that doubles as the guided setup
 * path: Add Participants → Create Rules → Submit Revenue → Run Settlement.
 *
 * Responsive: horizontal with connecting lines at ≥sm, vertical stacked list
 * (circle-label pairs) on mobile (Figma `Deal Detail Mobile - Suspended`).
 */
export function NoSettlementsWorkflow({ dealId }: NoSettlementsWorkflowProps) {
  return (
    <div className="rounded-[8px] border border-dashed border-border px-4 py-6 sm:px-6">
      <p className="text-center text-[14px] leading-[20px] text-foreground">
        <span className="font-semibold">No settlements yet.</span>{' '}
        <span className="text-neutral">
          Start by adding participants and creating rules.
        </span>
      </p>

      {/* Desktop: horizontal row with connecting lines */}
      <div className="mt-6 hidden items-start justify-between gap-2 sm:flex">
        {STEPS.map((step, idx) => (
          <Fragment key={step.number}>
            <Link
              href={step.href(dealId)}
              className="group flex shrink-0 flex-col items-center gap-2"
            >
              <StepCircle number={step.number} />
              <span className="whitespace-nowrap text-[13px] font-semibold text-foreground group-hover:underline">
                {step.label}
              </span>
            </Link>
            {idx < STEPS.length - 1 && (
              <div
                aria-hidden
                className="mt-[14px] h-px flex-1 bg-border"
              />
            )}
          </Fragment>
        ))}
      </div>

      {/* Mobile: vertical stacked rows */}
      <ul className="mt-6 flex flex-col gap-3 sm:hidden">
        {STEPS.map((step) => (
          <li key={step.number}>
            <Link
              href={step.href(dealId)}
              className="group flex items-center gap-3"
            >
              <StepCircle number={step.number} small />
              <span className="text-[14px] font-semibold text-foreground group-hover:underline">
                {step.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepCircle({
  number,
  small,
}: Readonly<{ number: number; small?: boolean }>) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-foreground font-semibold text-background',
        small ? 'size-6 text-[12px]' : 'size-7 text-[13px]',
      )}
    >
      {number}
    </span>
  );
}
