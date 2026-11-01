import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import DashboardLoading from '@/app/(dashboard)/loading';
import { INITIAL_PTN_TASKS, CORE_TEAM_MEMBERS } from '@/lib/operational-data';

export const dynamic = 'force-dynamic';

export default async function DashboardTasksPage() {
  let tasks: any[] = INITIAL_PTN_TASKS;
  let currentUser = {
    id: CORE_TEAM_MEMBERS[0].id,
    role: 'OWNER' as 'OWNER' | 'MANAGER' | 'STAFF',
    fullName: 'Arya',
  };

  try {
    const supabase: any = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const [{ data: profile }, { data: dbTasks }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, role, division_id')
          .eq('id', user.id)
          .single(),
        supabase
          .from('tasks')
          .select(`
            *,
            assignee:profiles!tasks_assignee_id_fkey(id, full_name, email, whatsapp_number, job_titles),
            assigner:profiles!tasks_assigner_id_fkey(id, full_name, email, whatsapp_number),
            division:divisions(name),
            attachments:task_attachments(*),
            activities:task_activities(
              id,
              user_id,
              action_type,
              old_value,
              new_value,
              comment_text,
              created_at,
              profiles(full_name)
            )
          `)
          .order('created_at', { ascending: false }),
      ]);

      if (profile) {
        currentUser = {
          id: user.id,
          role: profile.role || 'OWNER',
          fullName: profile.full_name || 'Arya',
        };
      }
      if (dbTasks && dbTasks.length > 0) {
        tasks = dbTasks;
      }
    }
  } catch {
    // Fallback ke mock data EdTech PTN jika Supabase belum terhubung
  }

  return (
    <Suspense fallback={<DashboardLoading />}>
      <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto font-sans">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                9 Divisi Operasional
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">B2B, Affiliate, Media Partnership, SEO, TikTok Live</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Manajemen Tugas (Kanban & List)
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Filter tugas berdasarkan 9 divisi, kategori akuisisi marketing, dan tingkat prioritas ("Tinggi", "Sedang", "Rendah").
            </p>
          </div>
        </div>

        {/* KANBAN & LIST BOARD */}
        <KanbanBoard initialTasks={tasks} currentUser={currentUser} />
      </div>
    </Suspense>
  );
}
