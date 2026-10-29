'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { sendEmailNotification, triggerWhatsAppAlert } from '@/lib/services/notification.service';
import { TaskStatus, TaskPriority } from '@/types/database';

async function getSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {}
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {}
        },
      },
    }
  );
}

/**
 * Update Task Status and Dispatch Notifications
 */
export async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // Fetch current task with profiles
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, email, whatsapp_number),
      assigner:profiles!tasks_assigner_id_fkey(id, full_name, email, whatsapp_number),
      division:divisions(name)
    `)
    .eq('id', taskId)
    .single();

  if (fetchError || !task) {
    throw new Error('Task not found or access denied');
  }

  // Update status (Audit trail trigger will automatically log STATUS_CHANGE)
  const { error: updateError } = await supabase
    .from('tasks')
    .update({ 
      status: newStatus,
      progress_percentage: newStatus === 'DONE' ? 100 : task.progress_percentage
    })
    .eq('id', taskId);

  if (updateError) {
    throw new Error(`Failed to update task: ${updateError.message}`);
  }

  // Omnichannel Notification Triggers
  if (newStatus === 'DONE') {
    // Notify Assigner & Owners that task is finished
    await sendEmailNotification({
      to: task.assigner.email,
      recipientName: task.assigner.full_name,
      subject: `Tugas Telah Selesai: ${task.title}`,
      taskTitle: task.title,
      taskStatus: 'DONE',
      eventType: 'DONE',
      divisionName: task.division?.name,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.company.com'}/tasks/${task.id}`,
    });
  }

  if (task.priority === 'URGENT') {
    // Trigger WhatsApp notification for urgent tasks
    await triggerWhatsAppAlert({
      phoneNumber: task.assignee.whatsapp_number,
      recipientName: task.assignee.full_name,
      taskTitle: task.title,
      newStatus: newStatus,
      priority: 'URGENT',
    });
  }

  revalidatePath('/dashboard/tasks/board');
  revalidatePath('/dashboard/owner');
  return { success: true };
}

/**
 * Update Task Progress Percentage
 */
export async function updateTaskProgress(taskId: string, progress: number) {
  const supabase = await getSupabaseServerClient();
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  const { data: task } = await supabase
    .from('tasks')
    .select('*, assignee:profiles!tasks_assignee_id_fkey(full_name, whatsapp_number)')
    .eq('id', taskId)
    .single();

  const { error } = await supabase
    .from('tasks')
    .update({ progress_percentage: clampedProgress })
    .eq('id', taskId);

  if (error) throw new Error(error.message);

  // If critical progress milestone on URGENT task, trigger WA
  if (task && task.priority === 'URGENT' && clampedProgress === 100) {
    await triggerWhatsAppAlert({
      phoneNumber: task.assignee.whatsapp_number,
      recipientName: task.assignee.full_name,
      taskTitle: task.title,
      progressPercentage: clampedProgress,
    });
  }

  revalidatePath('/dashboard/tasks/board');
  return { success: true };
}

/**
 * Post Comment / Activity to Audit Trail
 */
export async function postTaskComment(taskId: string, commentText: string) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('task_activities')
    .insert({
      task_id: taskId,
      user_id: user.id,
      action_type: 'COMMENT',
      comment_text: commentText,
    });

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/tasks/${taskId}`);
  return { success: true };
}
