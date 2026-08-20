'use client';

import { ChevronDown, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/BackLink';
import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { DealForm } from '@/components/deals/DealForm';
import {
  DealStatusChangeDialog,
  STATUS_TO_VARIANT,
} from '@/components/deals/DealStatusChangeDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { DEAL_STATUS_LABEL } from '@/constants/ui';
import { useDeal } from '@/hooks/deals/useDeal';
import { useDeleteDeal } from '@/hooks/deals/useDeleteDeal';
import { useDuplicateDeal } from '@/hooks/deals/useDuplicateDeal';
import { useUpdateDeal } from '@/hooks/deals/useUpdateDeal';
import { getApiErrorMessage } from '@/lib/axios';
import type {
  CreateDealInput,
  DealStatus,
  UpdateDealInput,
} from '@/types/deal.types';

type EditDealViewProps = Readonly<{
  dealId: string;
}>;

/** Order the Change Status menu follows, matching the deal lifecycle. */
const STATUS_ORDER: ReadonlyArray<DealStatus> = [
  'DRAFT',
  'ACTIVE',
  'SUSPENDED',
  'CLOSED',
  'TERMINATED',
  'ARCHIVED',
];

/**
 * FEA-8: full Edit Deal screen. Owns:
 *  - the back link + title + Change Status menu + Duplicate + Delete header row
 *  - the shared DealForm
 *  - the status confirmation modal and the delete confirmation modal
 *
 * Status used to be limited to two buttons (Complete / Pause) and terminal
 * states offered only Duplicate. Liang 08/18: "I only able to duplicate the
 * deal now, can't even delete itttt" and "I need able to delete, paused,
 * archived etc like the drop down". Every status is now reachable from
 * every other, and deletion is available (the API refuses only when a
 * finalized settlement run exists).
 */
export function EditDealView({ dealId }: EditDealViewProps) {
  const router = useRouter();
  const { data: deal, isLoading, isError } = useDeal(dealId);
  const { mutateAsync: updateDeal, isPending: isSaving } = useUpdateDeal(dealId);
  const { mutateAsync: duplicateDeal, isPending: isDuplicating } = useDuplicateDeal();
  const { mutateAsync: deleteDeal, isPending: isDeleting } = useDeleteDeal();
  /** Target status whose confirmation dialog is open, or null. */
  const [pendingStatus, setPendingStatus] = useState<DealStatus | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleDelete() {
    try {
      const result = await deleteDeal(dealId);
      toast.success(result.message);
      setDeleteOpen(false);
      router.push(ROUTES.DEALS.LIST);
    } catch (error) {
      // The API returns a 409 with a full explanation when the deal has
      // finalized settlement runs; show it verbatim rather than a generic
      // failure so the admin knows to archive instead.
      toast.error(getApiErrorMessage(error, 'Failed to delete deal.'));
    }
  }

  async function handleDuplicate() {
    try {
      const copy = await duplicateDeal(dealId);
      toast.success(`Duplicated as "${copy.name}"`);
      router.push(ROUTES.DEALS.EDIT(copy.id));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to duplicate deal.'));
    }
  }

  async function handleSave(values: CreateDealInput & UpdateDealInput) {
    try {
      await updateDeal(values as UpdateDealInput);
      toast.success('Deal updated');
      router.push(ROUTES.DEALS.DETAIL(dealId));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update deal.'));
    }
  }

  async function handleStatusChange(payload: {
    status: DealStatus;
    notes?: string;
  }) {
    try {
      const updateInput: UpdateDealInput = {
        status: payload.status,
        ...(payload.notes ? { notes: payload.notes } : {}),
      };
      await updateDeal(updateInput);
      toast.success(`Deal set to ${DEAL_STATUS_LABEL[payload.status]}`);
      setPendingStatus(null);
      router.push(ROUTES.DEALS.DETAIL(dealId));
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          `Failed to set the deal to ${DEAL_STATUS_LABEL[payload.status]}.`,
        ),
      );
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink href={ROUTES.DEALS.LIST} label="Deals List" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-2 h-[400px] rounded-[8px]" />
      </div>
    );
  }

  if (isError || !deal) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink href={ROUTES.DEALS.LIST} label="Deals List" />
        <EmptyState
          title="We couldn't load this deal"
          description="The deal may have been deleted or you don't have access."
          action={{ label: 'Back to Deals', href: ROUTES.DEALS.LIST }}
        />
      </div>
    );
  }

  const busy = isSaving || isDuplicating || isDeleting;

  return (
    <>
      <div className="flex flex-col gap-4">
        <BackLink href={ROUTES.DEALS.DETAIL(dealId)} label="Deal Overview" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
            Edit Deal
          </h1>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" disabled={busy} className="gap-2">
                  Change Status
                  <ChevronDown className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[220px]">
                {STATUS_ORDER.filter((s) => s !== deal.status).map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => setPendingStatus(status)}
                  >
                    {DEAL_STATUS_LABEL[status]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                void handleDuplicate();
              }}
            >
              {isDuplicating ? 'Duplicating...' : 'Duplicate Deal'}
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" aria-hidden />
              Delete Deal
            </Button>
          </div>
        </div>

        <div className="mt-2">
          <DealForm
            initialDeal={deal}
            cancelHref={ROUTES.DEALS.DETAIL(dealId)}
            submitLabel="Save Changes"
            isSubmitting={isSaving}
            onSubmit={(values) => {
              void handleSave(values);
            }}
          />
        </div>
      </div>

      {pendingStatus && (
        <DealStatusChangeDialog
          variant={STATUS_TO_VARIANT[pendingStatus]}
          open
          onOpenChange={(open) => {
            if (!open) setPendingStatus(null);
          }}
          dealName={deal.name}
          isSubmitting={isSaving}
          onConfirm={handleStatusChange}
        />
      )}

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this deal?"
        description={
          <>
            This permanently removes{' '}
            <span className="font-semibold text-foreground">{deal.name}</span>{' '}
            along with its participants, rule snapshots, revenue batches, and
            settlement runs. This cannot be undone. Deals with a finalized
            settlement run cannot be deleted; archive those instead.
          </>
        }
        confirmLabel="Delete Deal"
        isPending={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
