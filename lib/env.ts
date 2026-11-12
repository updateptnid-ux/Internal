import { z } from 'zod';

/**
 * Enterprise Environment Variable Schema (Zod)
 * Validasi runtime Supabase environment variables dengan graceful fallback untuk build phase (Vercel).
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type EnvSchema = z.infer<typeof envSchema>;

let hasWarnedMissingEnv = false;

/**
 * Mengambil variabel environment dengan fallback yang aman saat build Vercel.
 * Tidak melempar fatal error agar proses `next build` tetap lulus walaupun env belum di-set di platform.
 */
export function getEnv(): EnvSchema {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const result = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: rawUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: rawAnonKey,
  });

  if (!result.success) {
    if (!hasWarnedMissingEnv && process.env.NODE_ENV !== 'test') {
      hasWarnedMissingEnv = true;
      console.warn(
        '[WARN] NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY belum dikonfigurasi secara lengkap.\n' +
        'Menggunakan fallback aman untuk build time. Pastikan menambahkan variabel ini di Project Settings Vercel saat production.'
      );
    }

    return {
      NEXT_PUBLIC_SUPABASE_URL: rawUrl && rawUrl.startsWith('http') ? rawUrl : 'https://placeholder-project.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: rawAnonKey || 'placeholder-anon-key-for-build',
    };
  }

  return result.data;
}

export const env = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    return getEnv().NEXT_PUBLIC_SUPABASE_URL;
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return getEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY;
  },
};
