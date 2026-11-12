'use server';

import { createClient } from '@/lib/supabase/server';
import type { KpiJobdesk } from '@/types/database';
import { currentPeriod } from '@/lib/performance';

export type ActionResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; error: string; data?: never };

async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function addJobdesk(input: {
  ownerId: string;
  title: string;
  weight: number;
}): Promise<ActionResult<KpiJobdesk>> {
  const title = input.title.trim();
  if (!title || !input.ownerId) return { success: false, error: 'Judul jobdesk wajib diisi.' };

  const { supabase, user } = await getSession();
  if (!user) return { success: false, error: 'Sesi berakhir. Silakan masuk kembali.' };

  const { data, error } = await supabase
    .from('kpi_jobdesks')
    .insert({
      owner_id: input.ownerId,
      created_by: user.id,
      title,
      weight: Math.min(10, Math.max(1, Math.round(input.weight || 1))),
      period_month: currentPeriod(),
    })
    .select()
    .single();

  if (error || !data) return { success: false, error: error?.message || 'Gagal menambah jobdesk.' };
  return { success: true, data };
}

export async function toggleJobdeskCompletion(
  jobdeskId: string,
  isCompleted: boolean
): Promise<ActionResult<KpiJobdesk>> {
  const { supabase, user } = await getSession();
  if (!user) return { success: false, error: 'Sesi berakhir. Silakan masuk kembali.' };

  const { data, error } = await supabase
    .from('kpi_jobdesks')
    .update({ is_completed: isCompleted })
    .eq('id', jobdeskId)
    .select()
    .single();

  if (error || !data) return { success: false, error: error?.message || 'Gagal memperbarui jobdesk.' };
  return { success: true, data };
}

export async function deleteJobdesk(jobdeskId: string): Promise<ActionResult<{ id: string }>> {
  const { supabase, user } = await getSession();
  if (!user) return { success: false, error: 'Sesi berakhir. Silakan masuk kembali.' };

  const { error } = await supabase.from('kpi_jobdesks').delete().eq('id', jobdeskId);
  if (error) return { success: false, error: error.message };
  return { success: true, data: { id: jobdeskId } };
}
