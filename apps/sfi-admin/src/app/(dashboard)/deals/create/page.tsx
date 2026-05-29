import type { Metadata } from 'next';

import { BackLink } from '@/components/common/BackLink';
import { CreateDealContainer } from '@/components/deals/CreateDealContainer';
import { ROUTES } from '@/constants/routes';

export const metadata: Metadata = {
  title: 'Create Deal',
};

/** FEA-6: Create Deal. Matches Figma node 384:1709 > "Deal Create". */
export default function CreateDealPage() {
  return (
    <div className="flex flex-col gap-4">
      <BackLink href={ROUTES.DEALS.LIST} label="Deals List" />
      <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
        Create Deals
      </h1>
      <div className="mt-2">
        <CreateDealContainer />
      </div>
    </div>
  );
}
