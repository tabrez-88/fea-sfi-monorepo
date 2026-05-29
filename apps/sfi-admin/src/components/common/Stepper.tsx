import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

type StepperStep = Readonly<{
  /** 1-indexed step number. */
  number: number;
  /** Label shown under the circle. */
  label: string;
}>;

type StepperProps = Readonly<{
  /** Steps in display order. Numbers should be 1..N matching `currentStep`. */
  steps: ReadonlyArray<StepperStep>;
  /** Currently active step (1-indexed). Steps below this render as completed. */
  currentStep: number;
  className?: string;
}>;

/**
 * Horizontal step indicator used at the top of multi-step wizards.
 *
 * Layout: each step is an equal-width cell containing two half-connectors
 * flanking the centred circle. The left half-connector on the first cell
 * and the right half-connector on the last cell are hidden via `invisible`
 * so they preserve spacing but render nothing — keeping every circle
 * perfectly centred over its own label without bespoke positioning.
 *
 * Visual states:
 *   - Past steps: black filled circle + check mark; preceding line is foreground-colored
 *   - Current step: black filled circle with the step number
 *   - Future steps: grey filled circle with the step number; preceding line is grey
 *
 * Max width is capped at 720px and centred. On narrow viewports labels
 * shrink (12/16 text) and clip to a 96px box so 3 steps fit cleanly even
 * on phone widths.
 *
 * Matches the Figma "Create Rule Snapshot" stepper (frames `1299:9667`,
 * `1299:9808`, `1299:11139`).
 */
export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <ol
      aria-label="Progress"
      className={cn('mx-auto flex w-full max-w-[720px] items-start', className)}
    >
      {steps.map((step, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === steps.length - 1;
        const isCompleted = step.number < currentStep;
        const isCurrent = step.number === currentStep;
        // Connector colouring:
        //   - Line ENTERING this circle came from step N-1. It's "done" when
        //     step N-1 is completed, i.e. (N - 1) < currentStep ⇔ N <= currentStep.
        //     This means the current step's incoming line is also coloured.
        //   - Line LEAVING this circle goes to step N+1. Only "done" when this
        //     step itself is completed, i.e. N < currentStep ⇔ N <= currentStep - 1.
        const incomingDone = step.number <= currentStep;
        const outgoingDone = step.number <= currentStep - 1;

        return (
          <li
            key={step.number}
            className="flex flex-1 flex-col items-center text-center"
            aria-current={isCurrent ? 'step' : undefined}
          >
            <div className="flex w-full items-center">
              <div
                aria-hidden
                className={cn(
                  'h-[2px] flex-1 transition-colors',
                  isFirst ? 'invisible' : incomingDone ? 'bg-foreground' : 'bg-grey-200',
                )}
              />
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold transition-colors',
                  isCompleted || isCurrent
                    ? 'bg-foreground text-background'
                    : 'bg-grey-200 text-neutral',
                )}
              >
                {isCompleted ? (
                  <Check aria-hidden className="size-3.5" strokeWidth={3} />
                ) : (
                  step.number
                )}
              </span>
              <div
                aria-hidden
                className={cn(
                  'h-[2px] flex-1 transition-colors',
                  isLast ? 'invisible' : outgoingDone ? 'bg-foreground' : 'bg-grey-200',
                )}
              />
            </div>
            <span
              className={cn(
                'mt-2 max-w-[96px] truncate text-[12px] font-semibold leading-[16px] sm:max-w-[160px] sm:text-[14px] sm:leading-[20px]',
                isCurrent ? 'text-foreground' : 'text-neutral',
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
