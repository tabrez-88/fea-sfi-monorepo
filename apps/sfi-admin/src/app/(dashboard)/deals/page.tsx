import type { Metadata } from 'next';

import { DealsListView } from '@/components/deals/DealsListView';

export const metadata: Metadata = {
  title: 'Deals',
};

/** FEA-5 — Deals List. Matches Figma node 384:1709 > "Deal List". */
export default function DealsPage() {
  return <DealsListView />;
}
