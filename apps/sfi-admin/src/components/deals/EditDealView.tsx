'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/BackLink';
import { EmptyState } from '@/components/common/EmptyState';
import { DealForm } from '@/components/deals/DealForm';
import { DealStatusChangeDialog } from '@/components/deals/DealStatusChangeDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useDeal } from '@/hooks/deals/useDeal';
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

type ModalKind = 'close' | 'suspend' | null;

/**
 * FEA-8 — full Edit Deal screen. Owns:
 *  - the back link + title + [Closed Deal] + [Suspend Deal] header row
 *    (Figma: two top-right action buttons, stacked on mobile)
 *  - the shared DealForm
 *  - both confirmation modals (Close + Suspend with Notes textarea)
 *
 * No delete flow — the Figma design only supports transitioning to CLOSED /
 * SUSPENDED via confirmations. Actual record deletion is admin-only and
 * lives outside the Edit screen.
 */
export function EditDealView({ dealId }: EditDealViewProps) {
  const router = useRouter();
  const { data: deal, isLoading, isError } = useDeal(dealId);
  const { mutateAsync: updateDeal, isPending: isSaving } = useUpdateDeal(dealId);
  const [modal, setModal] = useState<ModalKind>(null);

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
      toast.success(
        payload.status === 'CLOSED' ? 'Deal closed' : 'Deal suspended',
      );
      setModal(null);
      router.push(ROUTES.DEALS.DETAIL(dealId));
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          payload.status === 'CLOSED'
            ? 'Failed to close deal.'
            : 'Failed to suspend deal.',
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

  // Disable the destructive buttons when the deal is already in that state
  const alreadyClosed = deal.status === 'CLOSED';
  const alreadySuspended = deal.status === 'SUSPENDED';

  return (
    <>
      <div className="flex flex-col gap-4">
        <BackLink href={ROUTES.DEALS.DETAIL(dealId)} label="Deal Overview" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
            Edit Deal
          </h1>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
            <Button
              type="button"
              className="bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger/30"
              disabled={alreadyClosed || isSaving}
              onClick={() => setModal('close')}
            >
              {alreadyClosed ? 'Closed' : 'Closed Deal'}
            </Button>
            <Button
              type="button"
              disabled={alreadySuspended || isSaving}
              onClick={() => setModal('suspend')}
            >
              {alreadySuspended ? 'Suspended' : 'Suspend Deal'}
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

      <DealStatusChangeDialog
        variant="close"
        open={modal === 'close'}
        onOpenChange={(open) => setModal(open ? 'close' : null)}
        dealName={deal.name}
        isSubmitting={isSaving}
        onConfirm={handleStatusChange}
      />
      <DealStatusChangeDialog
        variant="suspend"
        open={modal === 'suspend'}
        onOpenChange={(open) => setModal(open ? 'suspend' : null)}
        dealName={deal.name}
        isSubmitting={isSaving}
        onConfirm={handleStatusChange}
      />
    </>
  );
}
