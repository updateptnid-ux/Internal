import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { logoutUser } from '@/actions/auth';
import { User, Shield, Building2, Mail, Phone, LogOut, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase: any = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      whatsapp_number,
      role,
      account_status,
      created_at,
      division:divisions(name)
    `)
    .eq('id', user.id)
    .single();

  const roleLabel = 
    profile?.role === 'OWNER' 
      ? 'Pemilik (Owner)' 
      : profile?.role === 'MANAGER' 
      ? 'Manajer (Manager)' 
      : 'Staf (Staff)';

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto font-sans">
      {/* HEADER */}
      <div className="pb-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Pengaturan
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola profil akun dan preferensi workspace Anda.
        </p>
      </div>

      {/* PROFIL PENGGUNA */}
      <Card className="border border-slate-200/60 bg-white shadow-xs rounded-xl">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-base shrink-0">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                {profile?.full_name || 'Pengguna'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                {profile?.email || user.email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-100 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 block">Peran Jabatan</span>
              <div className="flex items-center gap-2 pt-0.5">
                <Shield className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-semibold text-slate-900">{roleLabel}</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-100 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 block">Divisi Penugasan</span>
              <div className="flex items-center gap-2 pt-0.5">
                <Building2 className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-semibold text-slate-900">{profile?.division?.name || 'Umum'}</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-100 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 block">Nomor WhatsApp</span>
              <div className="flex items-center gap-2 pt-0.5">
                <Phone className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-semibold text-slate-900">{profile?.whatsapp_number || 'Belum diatur'}</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-100 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 block">Status Akun</span>
              <div className="flex items-center gap-2 pt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700">Aktif & Terverifikasi</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SESI & KELUAR */}
      <Card className="border border-slate-200/60 bg-white shadow-xs rounded-xl">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Sesi & Keamanan
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Akhiri sesi aktif Anda di perangkat ini
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-900">Keluar dari Workspace</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Anda perlu masuk kembali untuk mengakses tugas dan telemetry dashboard.
              </p>
            </div>
            <form action={logoutUser}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 rounded-lg gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
