import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { GodEyeAnalytics, StaffKpiSummary, PendingUser } from '@/components/dashboard/god-eye-analytics';

export const dynamic = 'force-dynamic';

export default async function OwnerDashboardPage() {
  const supabase: any = await createClient();

  // 1. Verify User Authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // 2. Strict Role Gate: OWNER ONLY
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  const userRole = profile?.role;

  if (!profile || userRole !== 'OWNER') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200/80 p-8 rounded-2xl max-w-sm w-full text-center shadow-xs">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-3 text-xs font-semibold">
            403
          </div>
          <h2 className="text-sm font-semibold text-slate-900">Akses Khusus Pemilik</h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Halaman ringkasan eksekutif hanya dapat diakses oleh peran Pemilik (Owner).
          </p>
        </div>
      </div>
    );
  }

  // 3. Fetch Divisions
  const { data: divisions = [] } = await supabase
    .from('divisions')
    .select('id, name')
    .order('name');

  // 4. Fetch All Tasks across Enterprise
  const { data: tasks = [] } = await supabase
    .from('tasks')
    .select('id, status, priority, progress_percentage, kpi_weight, due_date, division_id, assignee_id');

  // 5. Fetch Pending Users for Approval
  const { data: pendingUsers = [] } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      whatsapp_number,
      created_at,
      division_id,
      division:divisions(name)
    `)
    .eq('account_status', 'PENDING')
    .order('created_at', { ascending: false });

  // 6. Fetch Active Staff for Cross-Division Assignment Modal & KPI Table
  const { data: staffProfiles = [] } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      role,
      division_id,
      division:divisions(name)
    `)
    .neq('role', 'OWNER')
    .eq('account_status', 'ACTIVE')
    .order('full_name');

  // 7. Fetch Monthly KPI Records for Staff
  const now = new Date();
  const currentMonthYear = `${String(now.getUTCMonth() + 1).padStart(2, '0')}-${now.getUTCFullYear()}`;

  const { data: kpiRecords = [] } = await supabase
    .from('user_kpi_records')
    .select('user_id, total_tasks_completed, total_tasks_overdue, total_kpi_score')
    .eq('month_year', currentMonthYear);

  const kpiMap = new Map<string, any>();
  kpiRecords.forEach((rec: any) => {
    kpiMap.set(rec.user_id, rec);
  });

  // Build Staff KPI List
  const staffKpiList: StaffKpiSummary[] = staffProfiles.map((st: any) => {
    const kpi = kpiMap.get(st.id);

    // Live calculation fallback
    const staffTasks = tasks.filter((t: any) => t.assignee_id === st.id);
    const completedLive = staffTasks.filter((t: any) => t.status === 'DONE');
    const overdueLive = staffTasks.filter(
      (t: any) => t.due_date && new Date(t.due_date) < now && t.status !== 'DONE'
    );
    const scoreLive = completedLive.reduce((acc: number, curr: any) => acc + (curr.kpi_weight || 1), 0);

    return {
      userId: st.id,
      fullName: st.full_name,
      divisionName: st.division?.name || 'Umum',
      totalTasksCompleted: kpi?.total_tasks_completed ?? completedLive.length,
      totalTasksOverdue: kpi?.total_tasks_overdue ?? overdueLive.length,
      totalKpiScore: kpi?.total_kpi_score ?? scoreLive,
    };
  });

  staffKpiList.sort((a, b) => b.totalKpiScore - a.totalKpiScore);

  // 8. Compute Analytics Metrics
  const nowIso = now.toISOString();
  const activeTasks = tasks.filter((t: any) => t.status !== 'DONE');
  const overdueTasks = tasks.filter(
    (t: any) => t.due_date && t.due_date < nowIso && t.status !== 'DONE'
  );
  const inReviewTasks = tasks.filter((t: any) => t.status === 'IN_REVIEW');

  // 9. Aggregate Division Performance Data for Recharts Bar Chart
  const divisionPerformanceData = (divisions || []).map((div: any) => {
    const divTasks = tasks.filter((t: any) => t.division_id === div.id);
    const selesai = divTasks.filter((t: any) => t.status === 'DONE').length;
    const aktif = divTasks.filter((t: any) => t.status !== 'DONE').length;
    const terlambat = divTasks.filter(
      (t: any) => t.due_date && t.due_date < nowIso && t.status !== 'DONE'
    ).length;

    return {
      name: div.name,
      selesai,
      aktif,
      terlambat,
    };
  });

  // 10. Aggregate KPI Performance Data for Recharts Area Chart
  const kpiPerformanceData = staffKpiList.slice(0, 6).map((st) => ({
    name: st.fullName.split(' ')[0] || st.fullName,
    fullName: st.fullName,
    skor: st.totalKpiScore,
    selesai: st.totalTasksCompleted,
  }));

  return (
    <div className="p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <GodEyeAnalytics
          totalActiveTasks={activeTasks.length}
          totalOverdueTasks={overdueTasks.length}
          totalInReviewTasks={inReviewTasks.length}
          staffKpiList={staffKpiList}
          divisions={divisions || []}
          staffMembers={staffProfiles || []}
          pendingUsers={pendingUsers as PendingUser[]}
          divisionPerformanceData={divisionPerformanceData}
          kpiPerformanceData={kpiPerformanceData}
        />
      </div>
    </div>
  );
}
