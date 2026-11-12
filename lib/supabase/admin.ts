import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { getEnv } from '@/lib/env';

export function createAdminClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getEnv();
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'placeholder-service-key-for-build';

  return createClient<Database>(NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
