import { Suspense } from 'react';
import { MarketingHub } from '@/components/dashboard/marketing-hub';
import DashboardLoading from '@/app/(dashboard)/loading';

export const dynamic = 'force-dynamic';

export default function MarketingHubPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto font-sans">
        <MarketingHub />
      </div>
    </Suspense>
  );
}

