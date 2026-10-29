'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { loginUser, registerUser } from '@/actions/auth';
import { createClient } from '@/lib/supabase/client';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowRight,
  UserPlus
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState('login');

  // Login Form States
  const [loginEmail, setLoginEmail] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  const [showLoginPassword, setShowLoginPassword] = React.useState(false);
  const [isLoginLoading, setIsLoginLoading] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null);

  // Register Form States
  const [regFullName, setRegFullName] = React.useState('');
  const [regEmail, setRegEmail] = React.useState('');
  const [regPassword, setRegPassword] = React.useState('');
  const [showRegPassword, setShowRegPassword] = React.useState(false);
  const [regWhatsapp, setRegWhatsapp] = React.useState('');
  const [regDivisionId, setRegDivisionId] = React.useState('');
  const [isRegLoading, setIsRegLoading] = React.useState(false);
  const [regError, setRegError] = React.useState<string | null>(null);
  const [regSuccess, setRegSuccess] = React.useState<string | null>(null);

  // Divisions list fetched for registration dropdown
  const [divisions, setDivisions] = React.useState<Array<{ id: string; name: string }>>([]);

  React.useEffect(() => {
    async function loadDivisions() {
      try {
        const supabase: any = createClient();
        const { data } = await supabase.from('divisions').select('id, name').order('name');
        if (data && data.length > 0) {
          setDivisions(data);
          setRegDivisionId(data[0].id);
        } else {
          // Fallback divisions
          const fallback = [
            { id: '11111111-1111-1111-1111-111111111111', name: 'Engineering & Technology' },
            { id: '22222222-2222-2222-2222-222222222222', name: 'Operations & Delivery' },
            { id: '33333333-3333-3333-3333-333333333333', name: 'Finance & Administration' },
          ];
          setDivisions(fallback);
          setRegDivisionId(fallback[0].id);
        }
      } catch (err) {
        console.warn('Failed to fetch divisions:', err);
      }
    }
    loadDivisions();
  }, []);

  // 1. Submit Login Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoginLoading(true);

    try {
      const result = await loginUser({ email: loginEmail, password: loginPassword });

      if (!result.success) {
        setLoginError(result.error || 'Autentikasi gagal. Silakan coba lagi.');
        setIsLoginLoading(false);
        return;
      }

      if (result.pendingApproval) {
        router.push('/pending-approval');
        return;
      }

      router.push(result.redirectUrl || '/dashboard/tasks');
      router.refresh();
    } catch (err: any) {
      setLoginError(err.message || 'Terjadi kesalahan sistem saat mencoba masuk.');
      setIsLoginLoading(false);
    }
  };

  // 2. Submit Register Handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);
    setIsRegLoading(true);

    try {
      const result = await registerUser({
        fullName: regFullName,
        email: regEmail,
        password: regPassword,
        whatsappNumber: regWhatsapp,
        divisionId: regDivisionId,
      });

      if (!result.success) {
        setRegError(result.error || 'Pendaftaran gagal. Periksa kembali data Anda.');
        setIsRegLoading(false);
        return;
      }

      setRegSuccess(result.message || 'Pendaftaran berhasil!');
      setIsRegLoading(false);

      // Auto-switch to login tab with prefilled email after 2 seconds
      setTimeout(() => {
        setLoginEmail(regEmail);
        setActiveTab('login');
      }, 2500);
    } catch (err: any) {
      setRegError(err.message || 'Terjadi kesalahan sistem saat memproses pendaftaran.');
      setIsRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/80 p-4 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* LOGO & BRAND HEADER */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white shadow-sm mb-1">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            Enterprise Portal Tim Internal
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Sistem Manajemen Tugas, Audit Trail Mutlak & Evaluasi Skor KPI
          </p>
        </div>

        {/* AUTH CARD WITH TABS */}
        <Card className="border-slate-200 shadow-md bg-white">
          <CardHeader className="space-y-3 pb-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="login" className="text-xs font-semibold">
                  Masuk Portal
                </TabsTrigger>
                <TabsTrigger value="register" className="text-xs font-semibold gap-1">
                  <UserPlus className="w-3.5 h-3.5" />
                  Daftar Tim Baru
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit}>
              <CardContent className="space-y-4 pt-1">
                <CardDescription className="text-xs text-slate-500">
                  Masukkan email terdaftar dan kata sandi Anda untuk mengakses portal kerja.
                </CardDescription>

                {loginError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{loginError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    Email Perusahaan
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nama@perusahaan.com"
                    required
                    autoComplete="email"
                    disabled={isLoginLoading}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    Kata Sandi
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      autoComplete="current-password"
                      disabled={isLoginLoading}
                      className="text-xs pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      tabIndex={-1}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 flex flex-col space-y-3">
                <Button
                  type="submit"
                  disabled={isLoginLoading}
                  className="w-full text-xs font-semibold gap-2 bg-slate-900 hover:bg-slate-800 text-white h-10 shadow-sm"
                >
                  {isLoginLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Memverifikasi Sesi...
                    </>
                  ) : (
                    <>
                      Masuk ke Sistem
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
                <p className="text-[11px] text-slate-400 text-center">
                  Belum memiliki akun? Klik tab <strong>Daftar Tim Baru</strong> di atas.
                </p>
              </CardFooter>
            </form>
          )}

          {/* TAB 2: REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit}>
              <CardContent className="space-y-3.5 pt-1">
                <CardDescription className="text-xs text-slate-500">
                  Formulir pendaftaran staf/anggota tim baru. Akun akan melalui proses verifikasi dan ACC oleh Owner.
                </CardDescription>

                {regError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{regError}</span>
                  </div>
                )}

                {regSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{regSuccess}</span>
                  </div>
                )}

                {/* NAMA LENGKAP */}
                <div className="space-y-1">
                  <Label htmlFor="reg-name" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    Nama Lengkap
                  </Label>
                  <Input
                    id="reg-name"
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    required
                    disabled={isRegLoading}
                    className="text-xs"
                  />
                </div>

                {/* EMAIL */}
                <div className="space-y-1">
                  <Label htmlFor="reg-email" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    Email Perusahaan
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nama@perusahaan.com"
                    required
                    disabled={isRegLoading}
                    className="text-xs"
                  />
                </div>

                {/* WHATSAPP */}
                <div className="space-y-1">
                  <Label htmlFor="reg-whatsapp" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    Nomor WhatsApp Aktif
                  </Label>
                  <Input
                    id="reg-whatsapp"
                    type="tel"
                    value={regWhatsapp}
                    onChange={(e) => setRegWhatsapp(e.target.value)}
                    placeholder="081234567890"
                    required
                    disabled={isRegLoading}
                    className="text-xs"
                  />
                </div>

                {/* DIVISI */}
                <div className="space-y-1">
                  <Label htmlFor="reg-division" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    Pilihan Divisi Kerja
                  </Label>
                  <select
                    id="reg-division"
                    value={regDivisionId}
                    onChange={(e) => setRegDivisionId(e.target.value)}
                    required
                    disabled={isRegLoading}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                  >
                    {divisions.map((div) => (
                      <option key={div.id} value={div.id}>
                        {div.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* PASSWORD */}
                <div className="space-y-1">
                  <Label htmlFor="reg-password" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    Kata Sandi (Minimal 6 Karakter)
                  </Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      disabled={isRegLoading}
                      className="text-xs pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      tabIndex={-1}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 flex flex-col space-y-3">
                <Button
                  type="submit"
                  disabled={isRegLoading}
                  className="w-full text-xs font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-10 shadow-sm"
                >
                  {isRegLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Mendaftarkan Anggota Tim...
                    </>
                  ) : (
                    <>
                      Daftar dan Minta ACC
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
                <p className="text-[11px] text-slate-400 text-center">
                  Setelah mendaftar, status akun Anda adalah <strong>PENDING</strong> sampai di-ACC oleh Owner.
                </p>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
