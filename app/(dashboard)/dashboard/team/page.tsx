import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DirectWAButton } from '@/components/ui/direct-wa-button';
import { Users, Building2, Mail, Phone, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const supabase: any = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch all team profiles with division details
  const { data: profiles = [] } = await supabase
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
    .eq('account_status', 'ACTIVE')
    .order('role', { ascending: true })
    .order('full_name', { ascending: true });

  // Fetch divisions count
  const { data: divisions = [] } = await supabase
    .from('divisions')
    .select('id, name');

  const totalMembers = profiles.length;
  const totalDivisions = divisions.length;
  const managersCount = profiles.filter((p: any) => p.role === 'MANAGER' || p.role === 'OWNER').length;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto font-sans">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tim
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Daftar anggota tim dan divisi dalam workspace Anda.
          </p>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border border-slate-200/60 bg-white shadow-xs rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-slate-500">Total Anggota</span>
            <Users className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-3xl font-bold tracking-tight text-slate-900">
              {totalMembers}
            </div>
            <p className="text-xs text-slate-500 mt-1">Anggota aktif terverifikasi</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/60 bg-white shadow-xs rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-slate-500">Divisi</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-3xl font-bold tracking-tight text-slate-900">
              {totalDivisions}
            </div>
            <p className="text-xs text-slate-500 mt-1">Divisi operasional</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/60 bg-white shadow-xs rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-slate-500">Kepemimpinan</span>
            <Shield className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-3xl font-bold tracking-tight text-slate-900">
              {managersCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">Pemilik & Kepala Divisi</p>
          </CardContent>
        </Card>
      </div>

      {/* TEAM DIRECTORY */}
      <Card className="border border-slate-200/60 bg-white shadow-xs rounded-xl">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Daftar Anggota
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Informasi kontak dan peran seluruh personel
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-medium text-[11px]">
                <tr>
                  <th className="py-3 px-5">Nama</th>
                  <th className="py-3 px-5">Divisi</th>
                  <th className="py-3 px-5">Peran</th>
                  <th className="py-3 px-5">Kontak</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles.map((profile: any) => {
                  const roleLabel = 
                    profile.role === 'OWNER' 
                      ? 'Pemilik' 
                      : profile.role === 'MANAGER' 
                      ? 'Manajer' 
                      : 'Staf';

                  return (
                    <tr key={profile.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-semibold text-xs shrink-0">
                            {profile.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{profile.full_name}</div>
                            <div className="text-[11px] text-slate-400">{profile.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-slate-600">
                        {profile.division?.name || 'Umum'}
                      </td>
                      <td className="py-3 px-5">
                        <Badge 
                          variant={profile.role === 'OWNER' ? 'default' : profile.role === 'MANAGER' ? 'high' : 'secondary'}
                          className="text-[10px] font-normal"
                        >
                          {roleLabel}
                        </Badge>
                      </td>
                      <td className="py-3 px-5 text-slate-500">
                        {profile.whatsapp_number ? (
                          <span className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {profile.whatsapp_number}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-right">
                        {profile.whatsapp_number && (
                          <div className="inline-block">
                            <DirectWAButton
                              whatsappNumber={profile.whatsapp_number}
                              taskTitle="Koordinasi Tim"
                              assigneeName={profile.full_name}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
