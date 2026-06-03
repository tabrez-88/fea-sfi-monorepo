'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { BackLink } from '@/components/common/BackLink';
import { Stepper } from '@/components/common/Stepper';
import { ROUTES } from '@/constants/routes';
import { useParticipants } from '@/hooks/participants/useParticipants';
import { useCreateRuleSnapshot } from '@/hooks/rules/useCreateRuleSnapshot';
import { useRuleSnapshots } from '@/hooks/rules/useRuleSnapshots';
import { getApiErrorMessage } from '@/lib/axios';

import { buildRuleSnapshotPayload } from './build-rule-snapshot-payload';
import { Step1BasicSettings } from './Step1BasicSettings';
import { Step2ParticipantsRules } from './Step2ParticipantsRules';
import { Step3Review } from './Step3Review';
import { wizardDraftStorage } from './wizard-draft-storage';
import {
  buildInitialWizardState,
  type WizardStep1Data,
  type WizardStep2Data,
  type WizardState,
  type WizardStepNumber,
} from './wizard-state.types';

const STEPPER_STEPS = [
  { number: 1, label: 'Basic Settings' },
  { number: 2, label: 'Participants Rules' },
  { number: 3, label: 'Review' },
] as const;

type CreateRuleSnapshotContainerProps = Readonly<{
  dealId: string;
}>;

/**
 * Top-level orchestrator for the 3-step Create Rule Snapshot wizard.
 *
 * Holds the cross-step form state so Next / Previous navigation never
 * loses what the admin already entered, then assembles the wizard
 * state into a v2 `CreateRuleSnapshotInput` and submits it to the BE
 * via `useCreateRuleSnapshot`. On success navigates back to the
 * deal-scoped Rule Snapshots list (no per-snapshot detail page yet —
 * the list already shows the newly-created snapshot at the top of the
 * Active group, so that's the natural landing).
 *
 * Matches the Figma frames `1299:9667` (Step 1), `1299:9808/9990/10726`
 * (Step 2 mode variants), `1299:11139` (Step 3).
 */
export function CreateRuleSnapshotContainer({
  dealId,
}: CreateRuleSnapshotContainerProps) {
  const router = useRouter();
  const listHref = ROUTES.DEALS.RULES(dealId);
  // Lazy initial — on mount, try restoring a draft from localStorage so the
  // admin doesn't lose a half-filled wizard to a 401-logout or accidental
  // browser refresh. Falls back to the fresh initial state when no draft
  // exists. Reading from localStorage is safe inside useState's initializer
  // because Next.js mounts `'use client'` components only on the client.
  const [state, setState] = useState<WizardState>(() => {
    const restored = wizardDraftStorage.load(dealId);
    return restored?.state ?? buildInitialWizardState();
  });
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);

  // Persist on every state change so an unexpected unmount (logout redirect,
  // tab close, browser refresh) doesn't lose the form data. Cleared
  // explicitly after a successful Create Snapshot below.
  useEffect(() => {
    wizardDraftStorage.save(dealId, state);
  }, [dealId, state]);

  const createMutation = useCreateRuleSnapshot(dealId);
  // Fetch the existing snapshot roster so Step 3 can show the next
  // version number ("Preview Rule Snapshot Version N"). Cheap — the
  // list query is already in cache after navigating from /rules.
  const snapshotsQuery = useRuleSnapshots(dealId, {
    page: 1,
    limit: 1,
    sortBy: 'version',
    sortOrder: 'desc',
  });
  // Participants are needed twice: in Step 3 for the read-only display
  // tables AND in the payload assembler for behavior-based filtering.
  // One fetch up here keeps the two views consistent; Step 3 also calls
  // useParticipants internally for its own rendering — React Query
  // dedupes the request via the shared query key.
  const participantsQuery = useParticipants(dealId, {
    page: 1,
    limit: 100,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const participants = participantsQuery.data?.data ?? [];

  const nextVersion = useMemo(() => {
    const top = snapshotsQuery.data?.data?.[0];
    return (top?.version ?? 0) + 1;
  }, [snapshotsQuery.data]);

  // Smoothly scroll back to the top whenever the wizard advances to a
  // new step. Each step body is tall enough that landing mid-page after
  // a Next / Previous click would leave the admin staring at content
  // they didn't expect; resetting to the top makes the transition read
  // like a fresh page. Respects `prefers-reduced-motion` automatically
  // via the browser's `scrollTo` smooth behavior.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.currentStep]);

  function goToStep(step: WizardStepNumber) {
    setSubmitErrors([]);
    setState((prev) => ({ ...prev, currentStep: step }));
  }

  function handleStep1Next(values: WizardStep1Data) {
    setState((prev) => ({ ...prev, step1: values, currentStep: 2 }));
  }

  function handleStep2Change(next: WizardStep2Data) {
    setState((prev) => ({ ...prev, step2: next }));
  }

  function handleStep2Next(values: WizardStep2Data) {
    setState((prev) => ({ ...prev, step2: values, currentStep: 3 }));
  }

  function handleCreate() {
    setSubmitErrors([]);
    const built = buildRuleSnapshotPayload(state.step1, state.step2, participants);
    if (!built.ok) {
      setSubmitErrors(built.errors);
      return;
    }
    createMutation.mutate(built.payload, {
      onSuccess: () => {
        // Snapshot is persisted server-side — drop the local draft so
        // returning to the wizard starts fresh.
        wizardDraftStorage.clear(dealId);
        router.push(listHref);
      },
      onError: (err) => {
        setSubmitErrors([
          getApiErrorMessage(err, 'Failed to create rule snapshot. Please try again.'),
        ]);
      },
    });
  }

  return (
    // Cap the wizard width so it doesn't stretch to the full deal-context
    // viewport. Forms read much better at a contained width; tables stay
    // full-bleed elsewhere because they earn their own width.
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6">
      <BackLink href={listHref} label="Rule Snapshot List" />

      <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
        Create Rule Snapshot
      </h1>

      <div className="rounded-[8px] border border-border bg-white px-4 py-5 sm:px-8 sm:py-6">
        <Stepper steps={STEPPER_STEPS} currentStep={state.currentStep} />
      </div>

      {state.currentStep === 1 && (
        <Step1BasicSettings
          initialValues={state.step1}
          cancelHref={listHref}
          onNext={handleStep1Next}
        />
      )}

      {state.currentStep === 2 && (
        <Step2ParticipantsRules
          dealId={dealId}
          values={state.step2}
          onChange={handleStep2Change}
          onPrev={() => goToStep(1)}
          onNext={handleStep2Next}
        />
      )}

      {state.currentStep === 3 && (
        <Step3Review
          dealId={dealId}
          step1={state.step1}
          step2={state.step2}
          nextVersion={nextVersion}
          submitting={createMutation.isPending}
          errors={submitErrors}
          onPrev={() => goToStep(2)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
