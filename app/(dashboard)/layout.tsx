import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/sidebar';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase: any = await createClient();

  // 1. Verify User Session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // 2. Fetch User Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, account_status')
    .eq('id', user.id)
    .single();

  // If user account is pending approval, redirect to waiting room
  if (profile?.account_status === 'PENDING') {
    redirect('/pending-approval');
  }

  const currentUser = {
    id: user.id,
    fullName: profile?.full_name || user.email?.split('@')[0] || 'Anggota Tim',
    email: profile?.email || user.email || '',
    role: (profile?.role as 'OWNER' | 'MANAGER' | 'STAFF') || 'STAFF',
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50/50 text-slate-900">
      <Sidebar currentUser={currentUser} />
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
