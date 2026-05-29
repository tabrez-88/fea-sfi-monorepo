'use client';

import { Pencil, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/BackLink';
import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog';
import { AddParticipantForm } from '@/components/participants/AddParticipantForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useDeleteParticipant } from '@/hooks/participants/useDeleteParticipant';
import { useParticipant } from '@/hooks/participants/useParticipant';
import { useUpdateParticipant } from '@/hooks/participants/useUpdateParticipant';
import { getApiErrorMessage } from '@/lib/axios';
import type {
  CreateParticipantInput,
  Participant,
} from '@/types/participant.types';

type EditParticipantContainerProps = Readonly<{
  dealId: string;
  participantId: string;
}>;

/**
 * Participant detail / edit page. Reuses the Add Participant form pre-filled
 * with the participant's current values, adds a destructive Delete button at
 * the top right, and renames the form's submit button to "Save Changes".
 *
 * Layout:
 *   ← Participant List
 *   <Participant name>        [Delete]
 *   <AddParticipantForm initialValues=… submitLabel="Save Changes">
 *
 * Deletion goes through a confirmation modal, then navigates back to the
 * participants list. Save goes through the PATCH endpoint and stays on the
 * page (with a toast) so the user can keep editing if needed.
 */
export function EditParticipantContainer({
  dealId,
  participantId,
}: EditParticipantContainerProps) {
  const router = useRouter();
  const listHref = ROUTES.DEALS.PARTICIPANTS(dealId);

  const { data: participant, isLoading, isError, refetch } =
    useParticipant(participantId);
  const updateMutation = useUpdateParticipant(dealId);
  const deleteMutation = useDeleteParticipant(dealId);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // Bumped whenever we exit edit mode so the AddParticipantForm remounts,
  // discarding any in-progress edits and re-seeding from initialValues.
  const [formKey, setFormKey] = useState(0);

  function exitEdit() {
    setIsEditing(false);
    setFormKey((k) => k + 1);
  }

  async function handleSave(input: CreateParticipantInput) {
    try {
      await updateMutation.mutateAsync({ participantId, input });
      toast.success('Participant updated');
      router.push(listHref);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Failed to update participant. Please try again.'),
      );
    }
  }

  async function handleConfirmDelete() {
    try {
      await deleteMutation.mutateAsync(participantId);
      toast.success('Participant deleted');
      setDeleteOpen(false);
      router.push(listHref);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Failed to delete participant. Please try again.'),
      );
    }
  }

  if (isLoading) return <PageSkeleton listHref={listHref} />;

  if (isError || !participant) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink href={listHref} label="Participant List" />
        <div className="flex flex-col items-start gap-3 rounded-[8px] border border-border bg-white p-6">
          <p className="text-[14px] text-danger">Failed to load participant.</p>
          <Button type="button" variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={listHref} label="Participant List" />

      {/*
        Title row: name on the left, action buttons (Edit/Cancel Edit + Delete)
        on the right. The Edit button flips to "Cancel Edit" while editing,
        so the user always has one button to enter and the same slot to back
        out without changes.
      */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="flex flex-col">
          <p className="px-1 text-[14px] font-medium leading-[20px] text-neutral">
            Participant
          </p>
          <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
            {participant.name}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isEditing ? (
            <Button
              type="button"
              variant="outline"
              onClick={exitEdit}
              disabled={updateMutation.isPending}
            >
              <X className="size-4" aria-hidden />
              Cancel Edit
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="size-4" aria-hidden />
              Edit
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteOpen(true)}
            className="border-danger text-danger hover:bg-danger/5 hover:text-danger"
          >
            <Trash2 className="size-4" aria-hidden />
            Delete
          </Button>
        </div>
      </div>

      <AddParticipantForm
        key={formKey}
        dealId={dealId}
        disabled={!isEditing}
        onCancel={exitEdit}
        isSubmitting={updateMutation.isPending}
        onSubmit={(input) => {
          void handleSave(input);
        }}
        initialValues={toFormInput(participant)}
        submitLabel="Save Changes"
        submittingLabel="Saving..."
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete participant?"
        description={
          <>
            This will permanently remove{' '}
            <span className="font-semibold text-foreground">{participant.name}</span>{' '}
            from this deal. The action is recorded in the audit log but cannot
            be undone.
          </>
        }
        isPending={deleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}

/**
 * Map a fetched `Participant` into the slimmer `CreateParticipantInput`
 * shape the form consumes. Strips DB-only fields (id, dealId, timestamps)
 * and omits null fields entirely so they don't conflict with TypeScript's
 * `exactOptionalPropertyTypes: true` setting.
 */
function toFormInput(p: Participant): Partial<CreateParticipantInput> {
  const input: Partial<CreateParticipantInput> = {
    name: p.name,
    roleName: p.roleName,
    behaviorType: p.behaviorType,
  };
  if (p.email != null) input.email = p.email;
  if (p.externalId != null) input.externalId = p.externalId;
  if (p.investmentAmount != null) input.investmentAmount = p.investmentAmount;
  if (p.units != null) input.units = p.units;
  if (p.pricePerUnit != null) input.pricePerUnit = p.pricePerUnit;
  if (p.poolMember != null) input.poolMember = p.poolMember;
  return input;
}

function PageSkeleton({ listHref }: Readonly<{ listHref: string }>) {
  return (
    <div className="flex flex-col gap-6">
      <BackLink href={listHref} label="Participant List" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-64" />
      </div>
      <Skeleton className="h-[480px] w-full rounded-[8px]" />
    </div>
  );
}
