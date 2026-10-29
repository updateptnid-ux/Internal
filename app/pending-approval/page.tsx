import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logoutUser } from '@/actions/auth';
import { Clock, ShieldCheck, LogOut, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PendingApprovalPage() {
  const supabase: any = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, account_status, role')
    .eq('id', user.id)
    .single();

  // Jika akun ternyata sudah ACTIVE, langsung arahkan ke dashboard
  if (profile?.account_status === 'ACTIVE') {
    redirect('/dashboard/tasks');
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/80 p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-6">
        {/* ICON & BADGE */}
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <Clock className="w-7 h-7 animate-pulse" />
        </div>

        {/* TITLE & DESCRIPTION */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
            Status: Menunggu Persetujuan
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight pt-1">
            Ruang Tunggu Verifikasi
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            Akun Anda atas nama <strong className="text-slate-900">{profile?.full_name || user.email}</strong> sedang menunggu persetujuan (ACC) dari jajaran Owner perusahaan.
          </p>
        </div>

        {/* DETAILS BOX */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-left text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span>Email Terdaftar:</span>
            <span className="font-semibold text-slate-800">{user.email}</span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>Kebijakan Keamanan:</span>
            <span className="font-semibold text-slate-800">Zero-Trust Access</span>
          </div>
          <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
            Owner akan menetapkan hak akses divisi dan peran jabatan Anda segera.
          </p>
        </div>

        {/* ACTIONS */}
        <div className="space-y-2 pt-2">
          <Link
            href="/dashboard/tasks"
            className="w-full inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Cek Status Akses Sekarang
          </Link>

          <form action={logoutUser}>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar Sesi (Logout)
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
