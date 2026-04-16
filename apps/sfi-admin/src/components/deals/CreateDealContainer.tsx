'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { DealForm } from '@/components/deals/DealForm';
import { ROUTES } from '@/constants/routes';
import { useCreateDeal } from '@/hooks/deals/useCreateDeal';
import { getApiErrorMessage } from '@/lib/axios';
import type { CreateDealInput, UpdateDealInput } from '@/types/deal.types';

/** FEA-6 — client container wiring the Create Deal form to the mutation. */
export function CreateDealContainer() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateDeal();

  async function handleSubmit(values: CreateDealInput & UpdateDealInput) {
    try {
      const deal = await mutateAsync(values as CreateDealInput);
      toast.success('Deal created');
      router.push(ROUTES.DEALS.DETAIL(deal.id));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create deal. Please try again.'));
    }
  }

  return (
    <DealForm
      cancelHref={ROUTES.DEALS.LIST}
      submitLabel="Create Deal"
      isSubmitting={isPending}
      onSubmit={(values) => {
        void handleSubmit(values);
      }}
    />
  );
}
