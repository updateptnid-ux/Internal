import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { KanbanBoard } from '@/components/tasks/kanban-board';

export const dynamic = 'force-dynamic';

export default async function DashboardTasksPage() {
  const supabase: any = await createClient();

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // 2. Fetch User Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, division_id')
    .eq('id', user.id)
    .single();

  const currentUser = {
    id: user.id,
    role: profile?.role || 'STAFF',
    fullName: profile?.full_name || 'Anggota Tim',
  };

  // 3. Fetch Tasks with full relational data
  const { data: tasks = [] } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, email, whatsapp_number),
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
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tugas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola alur kerja dan pantau progres tugas tim Anda.
          </p>
        </div>
      </div>

      {/* KANBAN BOARD */}
      <KanbanBoard initialTasks={tasks || []} currentUser={currentUser} />
    </div>
  );
}
