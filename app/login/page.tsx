'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Mail, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { loginUser } from '@/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await loginUser({ email, password });
      if (!result.success) {
        setErrorMessage(result.error || 'Autentikasi gagal. Silakan periksa kembali email dan password.');
        setIsLoading(false);
        return;
      }

      router.push(result.redirectUrl || '/dashboard');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi gangguan koneksi.');
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#171717] text-white flex items-center justify-center font-bold text-base mx-auto mb-3 shadow-xs">
            PTN
          </div>
          <h1 className="text-lg font-semibold text-[#171717] tracking-tight">
            Internal Update PTN
          </h1>
          <p className="text-xs text-[#737373] mt-1">
            Masuk untuk mengakses dashboard operasional & monitoring
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#171717] mb-1.5 flex items-center gap-1.5">
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
              <label className="block text-xs font-medium text-[#171717] mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#737373]" />
                Password
              </label>
              <input
                type="password"
                required
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
                  Memverifikasi...
                </>
              ) : (
                <>
                  Masuk ke Dashboard
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Frictionless Register Link */}
          <div className="mt-5 pt-4 border-t border-[#E5E5E5] text-center">
            <p className="text-xs text-[#737373]">
              Belum memiliki akun?{' '}
              <Link
                href="/register"
                className="text-[#171717] font-medium hover:underline"
              >
                Daftar Langsung (Auto-Confirm)
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
