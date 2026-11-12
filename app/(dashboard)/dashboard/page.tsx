import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import type { Profile } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const currentUser = {
    id: user.id,
    fullName: profile?.full_name || (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'User',
    email: profile?.email || user.email || '',
    role: (profile?.role as 'OWNER' | 'TEAM') || 'OWNER',
    title: profile?.title || (user.user_metadata?.title as string) || undefined,
  };

  return <DashboardShell currentUser={currentUser} />;
}
