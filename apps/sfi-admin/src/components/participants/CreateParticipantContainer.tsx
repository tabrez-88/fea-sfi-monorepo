'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/BackLink';
import { AddParticipantForm } from '@/components/participants/AddParticipantForm';
import { ROUTES } from '@/constants/routes';
import { useCreateParticipant } from '@/hooks/participants/useCreateParticipant';
import { getApiErrorMessage } from '@/lib/axios';
import type { CreateParticipantInput } from '@/types/participant.types';

type CreateParticipantContainerProps = Readonly<{
  dealId: string;
}>;

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
  const { mutateAsync, isPending } = useCreateParticipant(dealId);
  const listHref = ROUTES.DEALS.PARTICIPANTS(dealId);

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
        cancelHref={listHref}
        isSubmitting={isPending}
        onSubmit={(input) => {
          void handleSubmit(input);
        }}
      />
    </div>
  );
}
