'use server';

import { createClient } from '@/lib/supabase/server';
import type { CalendarTask, TaskPing, TaskPriority, TaskStatus } from '@/types/database';
import { createWhatsAppUrl } from '@/lib/performance';

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

export async function createCalendarTask(input: {
  title: string;
  description?: string;
  assigneeId: string | null;
  startTime: string; // ISO
  dueDate: string; // ISO
  priority: TaskPriority;
}): Promise<ActionResult<CalendarTask>> {
  const title = input.title.trim();
  if (!title) return { success: false, error: 'Judul tugas wajib diisi.' };
  if (new Date(input.dueDate) < new Date(input.startTime)) {
    return { success: false, error: 'Tenggat tidak boleh lebih awal dari waktu mulai.' };
  }

  const { supabase, user } = await getSession();
  if (!user) return { success: false, error: 'Sesi berakhir. Silakan masuk kembali.' };

  const { data, error } = await supabase
    .from('calendar_tasks')
    .insert({
      title,
      description: input.description?.trim() || null,
      assignee_id: input.assigneeId,
      assigner_id: user.id,
      start_time: input.startTime,
      due_date: input.dueDate,
      priority: input.priority,
    })
    .select()
    .single();

  if (error || !data) return { success: false, error: error?.message || 'Gagal menyimpan tugas.' };
  return { success: true, data };
}

export async function updateCalendarTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<ActionResult<CalendarTask>> {
  const { supabase, user } = await getSession();
  if (!user) return { success: false, error: 'Sesi berakhir. Silakan masuk kembali.' };

  const { data, error } = await supabase
    .from('calendar_tasks')
    .update({ status })
    .eq('id', taskId)
    .select()
    .single();

  if (error || !data) return { success: false, error: error?.message || 'Gagal memperbarui status.' };
  return { success: true, data };
}

export async function deleteCalendarTask(taskId: string): Promise<ActionResult<{ id: string }>> {
  const { supabase, user } = await getSession();
  if (!user) return { success: false, error: 'Sesi berakhir. Silakan masuk kembali.' };

  const { error } = await supabase.from('calendar_tasks').delete().eq('id', taskId);
  if (error) return { success: false, error: error.message };
  return { success: true, data: { id: taskId } };
}

/**
 * Ping / Ingatkan:
 * 1. Insert ke task_pings -> penerima menerima event realtime saat itu juga.
 * 2. Update ping_count di calendar_tasks -> semua layar kalender ikut ter-update.
 * 3. Kembalikan link WhatsApp (opsional) bila penerima punya nomor.
 */
export async function sendTaskPing(
  taskId: string
): Promise<ActionResult<{ ping: TaskPing; task: CalendarTask; whatsappUrl: string | null }>> {
  const { supabase, user } = await getSession();
  if (!user) return { success: false, error: 'Sesi berakhir. Silakan masuk kembali.' };

  const { data: task, error: taskError } = await supabase
    .from('calendar_tasks')
    .select()
    .eq('id', taskId)
    .maybeSingle();

  if (taskError || !task) return { success: false, error: 'Tugas tidak ditemukan.' };
  if (!task.assignee_id) return { success: false, error: 'Tugas ini belum punya penanggung jawab.' };
  if (task.assignee_id === user.id) return { success: false, error: 'Tidak bisa mengingatkan diri sendiri.' };
  if (task.status === 'COMPLETED') return { success: false, error: 'Tugas sudah selesai.' };

  const [{ data: sender }, { data: recipient }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase.from('profiles').select('full_name, whatsapp_number').eq('id', task.assignee_id).maybeSingle(),
  ]);

  const senderName = sender?.full_name ?? 'Rekan tim';
  const recipientName = recipient?.full_name ?? 'Rekan tim';
  const message = `${senderName} mengingatkan tugas "${task.title}".`;

  const { data: ping, error: pingError } = await supabase
    .from('task_pings')
    .insert({
      task_id: task.id,
      sender_id: user.id,
      recipient_id: task.assignee_id,
      message,
    })
    .select()
    .single();

  if (pingError || !ping) return { success: false, error: pingError?.message || 'Gagal mengirim ping.' };

  const { data: updatedTask, error: updateError } = await supabase
    .from('calendar_tasks')
    .update({ ping_count: task.ping_count + 1, last_pinged_at: ping.created_at })
    .eq('id', task.id)
    .select()
    .single();

  if (updateError || !updatedTask) {
    return { success: false, error: updateError?.message || 'Ping terkirim, tapi gagal memperbarui tugas.' };
  }

  const whatsappUrl = createWhatsAppUrl(
    recipient?.whatsapp_number,
    `Halo ${recipientName}, pengingat untuk tugas "${task.title}". Mohon segera ditindaklanjuti. Terima kasih.`
  );

  return { success: true, data: { ping, task: updatedTask, whatsappUrl } };
}

export async function markPingsRead(pingIds: string[]): Promise<ActionResult<{ count: number }>> {
  if (pingIds.length === 0) return { success: true, data: { count: 0 } };
  const { supabase, user } = await getSession();
  if (!user) return { success: false, error: 'Sesi berakhir. Silakan masuk kembali.' };

  const { error } = await supabase
    .from('task_pings')
    .update({ is_read: true })
    .in('id', pingIds)
    .eq('recipient_id', user.id);

  if (error) return { success: false, error: error.message };
  return { success: true, data: { count: pingIds.length } };
}
