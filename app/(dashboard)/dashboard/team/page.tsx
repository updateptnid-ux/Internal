import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DirectWAButton } from '@/components/ui/direct-wa-button';
import { Users, Building2, Phone, Shield, Layers } from 'lucide-react';
import DashboardLoading from '@/app/(dashboard)/loading';
import { CORE_TEAM_MEMBERS, PTN_DIVISIONS } from '@/lib/operational-data';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto font-sans">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                Struktur Organisasi Multi-Role
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Tim Inti & 9 Divisi Operasional PTN
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Pemetaan peran ganda (multi-job) 5 personel inti beserta 9 departemen operasional EdTech.
            </p>
          </div>
        </div>

        {/* METRIC CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="border border-slate-200/60 bg-white shadow-xs rounded-2xl p-5">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Personel Tim Inti
              </span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-3xl font-bold tracking-tight text-slate-900">
              5 <span className="text-xs font-normal text-slate-400">Anggota Inti</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Arya, Zidan, Abdur, Zaki, Rendi</p>
          </Card>

          <Card className="border border-slate-200/60 bg-white shadow-xs rounded-2xl p-5">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Divisi Operasional
              </span>
              <Building2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold tracking-tight text-slate-900">
              9 <span className="text-xs font-normal text-slate-400">Departemen</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              PM, Marketing, Try Out, Bimbel, Keuangan, SDM, Cek Skor, Admin, IT
            </p>
          </Card>

          <Card className="border border-slate-200/60 bg-white shadow-xs rounded-2xl p-5">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Jabatan Multi-Role
              </span>
              <Shield className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-3xl font-bold tracking-tight text-slate-900">
              13 <span className="text-xs font-normal text-slate-400">Fungsi PJ</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Terdistribusi penuh tanpa kekosongan PIC</p>
          </Card>
        </div>

        {/* 5 ANGGOTA TIM INTI (PERAN GANDA) */}
        <Card className="border border-slate-200/70 bg-white shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">
              Direktori 5 Anggota Tim Inti (Multi-Job)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Daftar lengkap tanggung jawab lintas divisi dan kanal koordinasi langsung
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-5">Nama & Email</th>
                    <th className="py-3.5 px-5">Peran Ganda (Multi-Job Titles)</th>
                    <th className="py-3.5 px-5">Divisi yang Diampu</th>
                    <th className="py-3.5 px-5">Kontak WhatsApp</th>
                    <th className="py-3.5 px-5 text-right">Koordinasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {CORE_TEAM_MEMBERS.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl ${member.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0`}
                          >
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{member.name}</div>
                            <div className="text-[11px] text-slate-400">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex flex-wrap gap-1.5">
                          {member.jobTitles.map((title) => (
                            <span
                              key={title}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${member.badgeColor}`}
                            >
                              {title}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-5 font-medium text-slate-700">
                        {member.divisions.join(', ')}
                      </td>
                      <td className="py-4 px-5 text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          +{member.whatsapp}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="inline-block">
                          <DirectWAButton
                            whatsappNumber={member.whatsapp}
                            taskTitle={`Koordinasi Divisi (${member.jobTitles.join(', ')})`}
                            assigneeName={member.name}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 9 DIVISI OPERASIONAL GRID */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            9 Divisi Operasional Internal Update PTN
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PTN_DIVISIONS.map((div) => (
              <Card
                key={div.id}
                className="border border-slate-200/70 bg-white shadow-xs rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-white">
                      {div.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{div.name}</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-semibold">
                    PJ: {div.head}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{div.description}</p>
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Realisasi KPI Divisi</span>
                    <span className="font-bold text-emerald-700">
                      {div.actualKpi}% / {div.targetKpi}%
                    </span>
                  </div>
                  <Progress value={div.actualKpi} className="h-1.5" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Suspense>
  );
}
