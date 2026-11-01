import { Suspense } from 'react';
import { PerformanceEvaluation } from '@/components/dashboard/performance-evaluation';
import DashboardLoading from '@/app/(dashboard)/loading';

export const dynamic = 'force-dynamic';

export default function PerformanceEvaluationPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto font-sans">
        <PerformanceEvaluation />
      </div>
    </Suspense>
  );
}

