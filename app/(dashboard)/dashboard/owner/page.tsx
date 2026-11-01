import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { GodEyeAnalytics, StaffKpiSummary, PendingUser } from '@/components/dashboard/god-eye-analytics';
import DashboardLoading from '@/app/(dashboard)/loading';
import {
  CORE_TEAM_MEMBERS,
  PTN_DIVISIONS,
  INITIAL_PTN_TASKS,
} from '@/lib/operational-data';

export const dynamic = 'force-dynamic';

export default async function OwnerDashboardPage() {
  let divisions: any[] = PTN_DIVISIONS;
  let tasks: any[] = INITIAL_PTN_TASKS;
  let pendingUsers: any[] = [];
  let staffProfiles: any[] = CORE_TEAM_MEMBERS.map((m) => ({
    id: m.id,
    full_name: m.fullName,
    role: m.role,
    division_id: PTN_DIVISIONS[0].id,
  }));

  try {
    const supabase: any = await createClient();
    const [
      { data: dbDivisions },
      { data: dbTasks },
      { data: dbPending },
      { data: dbProfiles },
    ] = await Promise.all([
      supabase.from('divisions').select('id, name').order('name'),
      supabase.from('tasks').select('*'),
      supabase
        .from('profiles')
        .select('id, full_name, email, whatsapp_number, created_at, division_id, division:divisions(name)')
        .eq('account_status', 'PENDING'),
      supabase
        .from('profiles')
        .select('id, full_name, role, division_id, division:divisions(name)')
        .eq('account_status', 'ACTIVE'),
    ]);

    if (dbDivisions && dbDivisions.length >= 9) divisions = dbDivisions;
    if (dbTasks && dbTasks.length > 0) tasks = dbTasks;
    if (dbPending) pendingUsers = dbPending;
    if (dbProfiles && dbProfiles.length >= 5) staffProfiles = dbProfiles;
  } catch {
    // Gunakan mock data operasional PTN jika database belum terhubung
  }

  const staffKpiList: StaffKpiSummary[] = CORE_TEAM_MEMBERS.map((m) => ({
    userId: m.id,
    fullName: m.fullName,
    divisionName: m.divisions.join(', '),
    jobTitles: m.jobTitles,
    handledDivisions: m.divisions,
    totalTasksCompleted: m.tasksCompleted,
    totalTasksOverdue: m.tasksOverdue,
    totalKpiScore: m.kpiScore,
    targetScore: m.monthlyTargetPoints,
    completionRate: m.monthlyActualPoints,
  }));

  const divisionPerformanceData = PTN_DIVISIONS.map((div) => ({
    name: div.name === 'Project Management' ? 'PM' : div.name,
    target: div.targetKpi,
    aktual: div.actualKpi,
    selesai: div.completedTasksCount,
    aktif: div.activeTasksCount,
    terlambat: 0,
  }));

  const kpiPerformanceData = CORE_TEAM_MEMBERS.map((m) => ({
    name: m.name,
    fullName: m.fullName,
    target: m.monthlyTargetPoints,
    skor: m.monthlyActualPoints,
    selesai: m.tasksCompleted,
  }));

  return (
    <Suspense fallback={<DashboardLoading />}>
      <div className="p-4 sm:p-6 md:p-8 font-sans">
        <div className="max-w-7xl mx-auto">
          <GodEyeAnalytics
            totalActiveTasks={tasks.filter((t) => t.status !== 'DONE').length}
            totalOverdueTasks={1}
            totalInReviewTasks={tasks.filter((t) => t.status === 'IN_REVIEW').length}
            staffKpiList={staffKpiList}
            divisions={divisions}
            staffMembers={staffProfiles}
            pendingUsers={pendingUsers as PendingUser[]}
            divisionPerformanceData={divisionPerformanceData}
            kpiPerformanceData={kpiPerformanceData}
          />
        </div>
      </div>
    </Suspense>
  );
}
