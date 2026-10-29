import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';
import { getEnv } from '@/lib/env';

/**
 * Creates a typed Supabase client for Next.js Client Components (browser-side).
 * Menggunakan variabel environment yang telah divalidasi oleh Zod runtime guard.
 */
export function createClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getEnv();

  return createBrowserClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
