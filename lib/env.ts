import { z } from 'zod';

/**
 * Enterprise Environment Variable Schema (Zod)
 * Memastikan konfigurasi runtime Supabase terdefinisi dengan format valid.
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_URL belum dikonfigurasi di file environment.')
    .url('NEXT_PUBLIC_SUPABASE_URL harus berupa URL yang valid (contoh: https://xyz.supabase.co)'),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY belum dikonfigurasi atau tidak valid (minimal 20 karakter).'),
});

export type EnvSchema = z.infer<typeof envSchema>;

/**
 * Validasi ketat variabel environment saat runtime.
 * Mengembalikan objek typed atau melempar error deskriptif berstandar enterprise.
 */
export function getEnv(): EnvSchema {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    const errorMessages = parsed.error.issues
      .map((issue) => `  - [${issue.path.join('.')}] ${issue.message}`)
      .join('\n');

    const formattedError = `
================================================================================
CRITICAL CONFIGURATION ERROR: SUPABASE ENVIRONMENT VARIABLES MISSING
================================================================================
Aplikasi Enterprise Task System membutuhkan kredensial Supabase yang valid untuk berjalan.

Penyebab Kegagalan:
${errorMessages}

Langkah Perbaikan (Quick Fix):
  1. Pastikan Anda telah menyalin file .env.example menjadi .env.local:
     copy .env.example .env.local
  2. Buka file .env.local dan masukkan Project URL serta Anon Key asli Anda dari:
     Supabase Dashboard -> Project Settings -> API
  3. Restart server development (npm run dev).
================================================================================
`;
    console.error(formattedError);
    throw new Error(formattedError);
  }

  return parsed.data;
}

export const env = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    return getEnv().NEXT_PUBLIC_SUPABASE_URL;
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return getEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY;
  },
};
