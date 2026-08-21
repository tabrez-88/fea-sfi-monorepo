import type { Metadata } from 'next';

import { PendingReviewsView } from '@/components/dashboard/PendingReviewsView';

export const metadata: Metadata = {
  title: 'Pending Reviews',
};

/** MS-4 Screen 4.2: Pending Reviews (Action Queue). */
export default function PendingReviewsPage() {
  return <PendingReviewsView />;
}
