import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/sidebar';
import { CORE_TEAM_MEMBERS } from '@/lib/operational-data';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let currentUser = {
    id: CORE_TEAM_MEMBERS[0].id,
    fullName: CORE_TEAM_MEMBERS[0].fullName,
    email: CORE_TEAM_MEMBERS[0].email,
    role: 'OWNER' as 'OWNER' | 'MANAGER' | 'STAFF',
    jobTitles: CORE_TEAM_MEMBERS[0].jobTitles,
  };

  try {
    const supabase: any = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, account_status, job_titles')
        .eq('id', user.id)
        .single();

      if (profile?.account_status === 'PENDING') {
        redirect('/pending-approval');
      }

      const matchedCore = CORE_TEAM_MEMBERS.find(
        (m) => m.name.toLowerCase() === (profile?.full_name || '').toLowerCase()
      );

      currentUser = {
        id: user.id,
        fullName: profile?.full_name || user.email?.split('@')[0] || 'Arya',
        email: profile?.email || user.email || 'arya@internalptn.id',
        role: (profile?.role as 'OWNER' | 'MANAGER' | 'STAFF') || 'OWNER',
        jobTitles:
          profile?.job_titles && profile.job_titles.length > 0
            ? profile.job_titles
            : matchedCore?.jobTitles || ['Project Manager', 'PJ Marketing', 'PJ Try Out'],
      };
    }
  } catch {
    // Fallback to Core Team Lead (Arya) if Supabase is not yet connected
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50/60 text-slate-900">
      <Sidebar currentUser={currentUser} />
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
