'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { createClient } from '@/lib/supabase/client';
import { getPublicDivisions } from '@/actions/auth';
import { 
  Layers, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  ArrowLeft
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  // Form states
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [whatsapp, setWhatsapp] = React.useState('');
  const [selectedDivisionId, setSelectedDivisionId] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  // Status states
  const [divisions, setDivisions] = React.useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetchingDivisions, setIsFetchingDivisions] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // 1. Fetch Data Divisi Resmi dari Supabase (UUID Valid)
  React.useEffect(() => {
    async function loadDivisions() {
      try {
        setIsFetchingDivisions(true);
        const data = await getPublicDivisions();
        if (data && data.length > 0) {
          setDivisions(data);
          setSelectedDivisionId(data[0].id); // division.id (UUID)
        }
      } catch (err: any) {
        console.error('Failed to load divisions:', err);
      } finally {
        setIsFetchingDivisions(false);
      }
    }
    loadDivisions();
  }, []);

  // 2. Submit Handler dengan Payload Metadata UUID Valid
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!selectedDivisionId) {
      setErrorMessage('Silakan pilih divisi kerja yang valid.');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Panggilan SignUp ke Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            whatsapp_number: whatsapp.trim(),
            division_id: selectedDivisionId.trim(), // INI WAJIB UUID DARI DATABASE
          },
        },
      });

      if (authError || !authData.user) {
        setErrorMessage(authError?.message || 'Pendaftaran gagal. Periksa kembali informasi Anda.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan (ACC) dari Owner.');
      setIsLoading(false);

      // Arahkan ke halaman login setelah 2.5 detik
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat memproses registrasi.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/70 p-4 font-sans">
      <div className="w-full max-w-md space-y-4">
        {/* BRAND LOGO */}
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm">
            <Layers className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Internal Workspace
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pendaftaran Anggota Tim Baru
            </p>
          </div>
        </div>

        {/* REGISTRATION CARD */}
        <Card className="border border-slate-200/70 bg-white shadow-xs rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Formulir Pendaftaran
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Lengkapi data diri Anda. Akun akan melalui proses verifikasi dan ACC oleh Owner.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-3.5 pt-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{successMessage}</span>
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
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  required
                  disabled={isLoading}
                  className="text-xs rounded-xl"
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@perusahaan.com"
                  required
                  disabled={isLoading}
                  className="text-xs rounded-xl"
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
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="081234567890"
                  required
                  disabled={isLoading}
                  className="text-xs rounded-xl"
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
                  value={selectedDivisionId}
                  onChange={(e) => setSelectedDivisionId(e.target.value)}
                  required
                  disabled={isLoading || isFetchingDivisions}
                  className="flex h-9 w-full rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                >
                  {isFetchingDivisions ? (
                    <option value="" disabled>Memuat daftar divisi...</option>
                  ) : (
                    divisions.map((div) => (
                      <option key={div.id} value={div.id}>
                        {div.name}
                      </option>
                    ))
                  )}
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
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    disabled={isLoading}
                    className="text-xs pr-10 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-3">
              <Button
                type="submit"
                disabled={isLoading || isFetchingDivisions}
                className="w-full h-10 text-xs font-semibold gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-all hover:shadow-md cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Mendaftarkan Akun...
                  </>
                ) : (
                  'Daftar Sekarang'
                )}
              </Button>

              <div className="text-center pt-1">
                <Link
                  href="/login"
                  className="text-xs text-slate-500 hover:text-slate-900 font-medium inline-flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Sudah punya akun? Masuk di sini
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
