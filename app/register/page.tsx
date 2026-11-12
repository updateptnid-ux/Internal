'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Phone,
  Briefcase,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { registerUser } from '@/actions/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const result = await registerUser({
        fullName,
        email,
        password,
        whatsappNumber,
        title: jobTitle,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Pendaftaran gagal. Silakan coba kembali.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Pendaftaran berhasil! Akun langsung aktif (Auto-Confirm). Membuka dashboard...');
      setTimeout(() => {
        router.push(result.redirectUrl || '/dashboard');
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi gangguan sistem.');
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#171717] text-white flex items-center justify-center font-bold text-base mx-auto mb-3 shadow-xs">
            PTN
          </div>
          <h1 className="text-lg font-semibold text-[#171717] tracking-tight">
            Daftar Akun Baru (Frictionless)
          </h1>
          <p className="text-xs text-[#737373] mt-1 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Tanpa perlu menunggu konfirmasi email — langsung aktif
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#171717] mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Arya Pusat / Zidan Nabil"
                className="w-full text-xs px-3 py-2 border border-[#E5E5E5] rounded-md focus:outline-none focus:border-[#171717] transition-colors bg-white text-[#171717]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#171717] mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#737373]" />
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@internalptn.id"
                  className="w-full text-xs px-3 py-2 border border-[#E5E5E5] rounded-md focus:outline-none focus:border-[#171717] transition-colors bg-white text-[#171717]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#171717] mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#737373]" />
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+62 8xx-xxxx-xxxx"
                  className="w-full text-xs px-3 py-2 border border-[#E5E5E5] rounded-md focus:outline-none focus:border-[#171717] transition-colors bg-white text-[#171717]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#171717] mb-1 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-[#737373]" />
                Jabatan / Jobdesk Utama
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Contoh: Project Manager / IT Lead / Marketing"
                className="w-full text-xs px-3 py-2 border border-[#E5E5E5] rounded-md focus:outline-none focus:border-[#171717] transition-colors bg-white text-[#171717]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#171717] mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[#737373]" />
                Password (Minimal 6 karakter)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs px-3 py-2 border border-[#E5E5E5] rounded-md focus:outline-none focus:border-[#171717] transition-colors bg-white font-mono text-[#171717]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-[#171717] hover:bg-[#262626] text-white text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mendaftarkan Akun...
                </>
              ) : (
                <>
                  Daftar & Masuk Langsung
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-5 pt-4 border-t border-[#E5E5E5] text-center">
            <p className="text-xs text-[#737373]">
              Sudah memiliki akun?{' '}
              <Link
                href="/login"
                className="text-[#171717] font-medium hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
