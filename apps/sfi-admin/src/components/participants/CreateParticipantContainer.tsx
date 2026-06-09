'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/BackLink';
import { AddParticipantForm } from '@/components/participants/AddParticipantForm';
import { ROUTES } from '@/constants/routes';
import { useDeal } from '@/hooks/deals/useDeal';
import { useCreateParticipant } from '@/hooks/participants/useCreateParticipant';
import { getApiErrorMessage } from '@/lib/axios';
import { Currency } from '@/types/deal.types';
import {
  ParticipantBehavior,
  type CreateParticipantInput,
} from '@/types/participant.types';

type CreateParticipantContainerProps = Readonly<{
  dealId: string;
}>;

const VALID_BEHAVIORS: ReadonlySet<ParticipantBehavior> = new Set([
  ParticipantBehavior.FEE_DEDUCTION,
  ParticipantBehavior.RECOUPMENT,
  ParticipantBehavior.NET_PROFIT_SHARE,
  ParticipantBehavior.FLAT_FEE,
  ParticipantBehavior.PASS_THROUGH,
]);

/**
 * Client container wiring the Add Participant form to its create mutation.
 * On success: redirects back to the deal's participants list and shows a
 * toast. The BE upserts on `(dealId, email)` or `(dealId, externalId)` so
 * submitting an existing identity updates that row in place rather than
 * creating a duplicate.
 */
export function CreateParticipantContainer({
  dealId,
}: CreateParticipantContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutateAsync, isPending } = useCreateParticipant(dealId);
  // Round 4 (Liang) #17: Investment Amount / Price Per Unit fields used
  // to hardcode "$". Read the deal's currency so the form's symbol +
  // locale formatting follows the actual deal currency (USD / EUR /
  // GBP / etc.). Falls back to USD until the deal loads.
  const dealQuery = useDeal(dealId);
  const currency: Currency = dealQuery.data?.currency ?? Currency.USD;
  const listHref = ROUTES.DEALS.PARTICIPANTS(dealId);

  // Honor optional deep-link query params so the Rule Snapshot wizard's
  // "Add Investor Manually" CTA can land the admin on this page with
  // Recoupment + Pool pre-selected (no manual radio toggling).
  // Round 4 / Liang item #12.
  const initialValues = useMemo(() => {
    const behaviorParam = searchParams.get('behavior') as
      | ParticipantBehavior
      | null;
    const poolParam = searchParams.get('poolMember');
    const values: Partial<CreateParticipantInput> = {};
    if (behaviorParam && VALID_BEHAVIORS.has(behaviorParam)) {
      values.behaviorType = behaviorParam;
    }
    if (poolParam === '1' || poolParam === 'true') {
      values.poolMember = true;
    } else if (poolParam === '0' || poolParam === 'false') {
      values.poolMember = false;
    }
    return Object.keys(values).length > 0 ? values : undefined;
  }, [searchParams]);

  async function handleSubmit(values: CreateParticipantInput) {
    try {
      await mutateAsync(values);
      toast.success('Participant added');
      router.push(listHref);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Failed to add participant. Please try again.'),
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={listHref} label="Participant List" />

      <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
        Add Participant
      </h1>

      <AddParticipantForm
        dealId={dealId}
        currency={currency}
        cancelHref={listHref}
        isSubmitting={isPending}
        {...(initialValues ? { initialValues } : {})}
        onSubmit={(input) => {
          void handleSubmit(input);
        }}
      />
    </div>
  );
}
