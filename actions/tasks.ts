'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { 
  TaskStatus, 
  TaskPriority, 
  ActivityActionType, 
  AttachmentFileType 
} from '@/types/database';
import { sendTaskNotificationEmail } from '@/lib/notifications';

// ==============================================================================
// TYPE DEFINITIONS FOR ENTERPRISE SERVER ACTIONS
// ==============================================================================

export interface CreateTaskInput {
  title: string;
  description?: string;
  assigneeId: string;
  divisionId: string;
  kpiWeight?: number; // Integer between 1 - 10 (Default: 1)
  priority?: TaskPriority;
  dueDate?: string;
  initialProgress?: number;
}

export interface UploadTaskEvidenceInput {
  taskId: string;
  fileUrl: string;
  fileType: AttachmentFileType;
  notes?: string;
}

export interface EvaluateTaskInput {
  taskId: string;
  decision: 'APPROVE' | 'REJECT';
  feedbackComment?: string;
}

export interface UpdateTaskProgressInput {
  taskId: string;
  status?: TaskStatus;
  progressPercentage?: number;
  auditComment?: string;
}

export interface ReassignTaskInput {
  taskId: string;
  newAssigneeId: string;
  reason?: string;
}

// Helper to revalidate all enterprise dashboard and task routes
function revalidateTaskPaths(taskId?: string) {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/tasks');
  revalidatePath('/dashboard/tasks/board');
  revalidatePath('/tasks/board');
  revalidatePath('/dashboard/owner');
  if (taskId) {
    revalidatePath(`/dashboard/tasks/${taskId}`);
  }
}

// ==============================================================================
// 1. createTask (HAK PREROGATIF OWNER / MANAGER)
// ==============================================================================
/**
 * createTask Server Action
 * - Verifikasi pembuat tugas memiliki role 'OWNER' atau 'MANAGER'.
 * - Jika MANAGER, wajib berada pada divisi yang sama dengan penugasan.
 * - INSERT ke tabel `tasks` dengan menyimpan nilai `kpi_weight` (1-10).
 * - Otomatis merekam log audit awal ke tabel `task_activities` (Action: 'STATUS_CHANGE', null -> 'TODO').
 */
export async function createTask(input: CreateTaskInput) {
  const supabase: any = await createClient();

  // 1. Server-side Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized: Otentikasi diperlukan.');
  }

  // 2. Fetch Creator Profile & RBAC role
  const { data: creatorProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role, division_id')
    .eq('id', user.id)
    .single();

  if (profileError || !creatorProfile) {
    throw new Error('Forbidden: Profil pengguna tidak ditemukan.');
  }

  // 3. Verifikasi Hak Prerogatif (Hanya OWNER atau MANAGER)
  if (creatorProfile.role !== 'OWNER' && creatorProfile.role !== 'MANAGER') {
    throw new Error('Forbidden: Staf biasa tidak diizinkan membuat atau membagikan tugas.');
  }

  // 4. Verifikasi Batas Divisi untuk Manager
  if (creatorProfile.role === 'MANAGER' && creatorProfile.division_id !== input.divisionId) {
    throw new Error('RBAC Violation: Manajer hanya berwenang membuat tugas di dalam divisinya sendiri.');
  }

  // 5. Validasi & Sanitasi Bobot KPI (1 - 10)
  const sanitizedKpiWeight = Math.min(10, Math.max(1, Math.round(input.kpiWeight ?? 1)));

  // 6. Operasi INSERT ke tabel tasks
  const { data: newTask, error: insertError } = await supabase
    .from('tasks')
    .insert({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      assigner_id: creatorProfile.id,
      assignee_id: input.assigneeId,
      division_id: input.divisionId,
      kpi_weight: sanitizedKpiWeight,
      status: 'TODO',
      priority: input.priority || 'MEDIUM',
      progress_percentage: input.initialProgress ?? 0,
      due_date: input.dueDate || null,
    })
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, email, whatsapp_number),
      assigner:profiles!tasks_assigner_id_fkey(id, full_name, email, whatsapp_number),
      division:divisions(name)
    `)
    .single();

  if (insertError || !newTask) {
    throw new Error(`Gagal membuat tugas: ${insertError?.message}`);
  }

  // 7. KOTAK HITAM: Audit Trail Penciptaan Tugas (STATUS_CHANGE dari null -> 'TODO')
  const { error: auditError } = await supabase
    .from('task_activities')
    .insert({
      task_id: newTask.id,
      user_id: creatorProfile.id,
      action_type: 'STATUS_CHANGE',
      old_value: null,
      new_value: 'TODO',
      comment_text: `Tugas baru diterbitkan dengan bobot KPI ${sanitizedKpiWeight} oleh ${creatorProfile.role} ${creatorProfile.full_name} untuk ${newTask.assignee?.full_name || input.assigneeId}.`,
    });

  if (auditError) {
    console.error('[AuditEngine] Gagal mencatat audit penciptaan task:', auditError);
  }

  // 8. Revalidasi UI Real-Time
  revalidateTaskPaths(newTask.id);

  return { 
    success: true, 
    task: newTask,
    message: 'Tugas berhasil dibuat dan diaudit ke dalam sistem.' 
  };
}

// ==============================================================================
// 2. uploadTaskEvidence (PENGUMPULAN BUKTI KERJA / PROOF OF WORK)
// ==============================================================================
/**
 * uploadTaskEvidence Server Action
 * - Menyimpan lampiran bukti kerja staf ke tabel `task_attachments`.
 * - Otomatis merekam log audit ke `task_activities` (Action: 'EVIDENCE_UPLOAD').
 */
export async function uploadTaskEvidence(
  taskId: string,
  fileUrl: string,
  fileType: AttachmentFileType = 'DOCUMENT',
  notes?: string
) {
  const supabase: any = await createClient();

  // 1. Server-side Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized: Sesi otentikasi tidak valid.');
  }

  // 2. Fetch User Profile
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  if (profileError || !userProfile) {
    throw new Error('Forbidden: Profil pengguna tidak ditemukan.');
  }

  // 3. Verifikasi Tugas Terkait
  const { data: currentTask, error: taskError } = await supabase
    .from('tasks')
    .select('id, title, assignee_id, assigner_id, status')
    .eq('id', taskId)
    .single();

  if (taskError || !currentTask) {
    throw new Error('Tugas tidak ditemukan atau akses ditolak oleh RLS.');
  }

  // 4. Verifikasi Akses Upload (Assignee, Assigner, atau OWNER)
  if (
    userProfile.role !== 'OWNER' &&
    currentTask.assignee_id !== user.id &&
    currentTask.assigner_id !== user.id
  ) {
    throw new Error('Forbidden: Anda tidak memiliki wewenang untuk melampirkan bukti pada tugas ini.');
  }

  // 5. INSERT ke tabel task_attachments
  const { data: attachment, error: insertError } = await supabase
    .from('task_attachments')
    .insert({
      task_id: taskId,
      uploaded_by: user.id,
      file_url: fileUrl.trim(),
      file_type: fileType,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (insertError || !attachment) {
    throw new Error(`Gagal mengunggah bukti kerja: ${insertError?.message}`);
  }

  // 6. KOTAK HITAM: Audit Trail Pengunggahan Bukti (EVIDENCE_UPLOAD)
  const { error: auditError } = await supabase
    .from('task_activities')
    .insert({
      task_id: taskId,
      user_id: user.id,
      action_type: 'EVIDENCE_UPLOAD',
      old_value: null,
      new_value: fileType,
      comment_text: notes?.trim() || `Bukti kerja (${fileType}) dilampirkan oleh ${userProfile.full_name}.`,
    });

  if (auditError) {
    console.error('[AuditEngine] Gagal mencatat audit bukti kerja:', auditError);
  }

  // 7. Revalidasi UI Real-Time
  revalidateTaskPaths(taskId);

  return {
    success: true,
    attachment,
    message: 'Bukti kerja berhasil diunggah dan tercatat di audit trail.',
  };
}

// ==============================================================================
// 3. submitForReview (KUNCI GEMBOK PENGECEKAN BUKTI KERJA)
// ==============================================================================
/**
 * submitForReview Server Action
 * - Digunakan oleh STAFF (Assignee) saat merasa tugas telah selesai dikerjakan.
 * - Mengubah progress_percentage ke 100 dan status menjadi 'IN_REVIEW'.
 * - LOGIKA WAJIB: Memeriksa keberadaan lampiran di `task_attachments`.
 *   Jika belum ada bukti sama sekali, TOLAK dengan pesan error tegas.
 * - Otomatis INSERT log perubahan status ke `task_activities`.
 */
export async function submitForReview(taskId: string, submissionNotes?: string) {
  const supabase: any = await createClient();

  // 1. Server-side Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized: Sesi otentikasi tidak valid.');
  }

  // 2. Fetch User Profile
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  if (profileError || !userProfile) {
    throw new Error('Forbidden: Profil pengguna tidak ditemukan.');
  }

  // 3. Fetch Existing Task & Verification
  const { data: currentTask, error: taskError } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      status,
      progress_percentage,
      assignee_id,
      assigner_id,
      assigner:profiles!tasks_assigner_id_fkey(id, full_name, email),
      division:divisions(name)
    `)
    .eq('id', taskId)
    .single();

  if (taskError || !currentTask) {
    throw new Error('Tugas tidak ditemukan atau akses ditolak oleh RLS.');
  }

  // 4. Verifikasi Wewenang: Hanya Assignee (atau Owner) yang dapat mengajukan Review
  if (userProfile.role !== 'OWNER' && currentTask.assignee_id !== user.id) {
    throw new Error('RBAC Violation: Hanya staf penerima tugas (Assignee) yang berhak mengajukan peninjauan (Review).');
  }

  // 5. KUNCI GEMBOK: Pengecekan Lampiran Bukti Kerja (Proof of Work Check)
  const { count: evidenceCount, error: evidenceError } = await supabase
    .from('task_attachments')
    .select('id', { count: 'exact', head: true })
    .eq('task_id', taskId);

  if (evidenceError) {
    throw new Error(`Gagal memverifikasi bukti kerja: ${evidenceError.message}`);
  }

  if (!evidenceCount || evidenceCount === 0) {
    throw new Error('Bukti kerja wajib dilampirkan sebelum meminta ACC.');
  }

  // 6. Mutasi Status menjadi 'IN_REVIEW' dan Progress 100%
  const previousStatus = currentTask.status;
  const { data: updatedTask, error: updateError } = await supabase
    .from('tasks')
    .update({
      status: 'IN_REVIEW',
      progress_percentage: 100,
    })
    .eq('id', taskId)
    .select()
    .single();

  if (updateError || !updatedTask) {
    throw new Error(`Gagal memperbarui status ke IN_REVIEW: ${updateError?.message}`);
  }

  // 7. KOTAK HITAM: Audit Trail Pengajuan Review (STATUS_CHANGE -> 'IN_REVIEW')
  const { error: auditError } = await supabase
    .from('task_activities')
    .insert({
      task_id: taskId,
      user_id: user.id,
      action_type: 'STATUS_CHANGE',
      old_value: previousStatus,
      new_value: 'IN_REVIEW',
      comment_text: submissionNotes?.trim() || `Tugas diajukan untuk ACC oleh ${userProfile.full_name} dengan ${evidenceCount} bukti kerja terlampir.`,
    });

  if (auditError) {
    console.error('[AuditEngine] Gagal mencatat audit pengajuan review:', auditError);
  }

  // 8. Omnichannel Notification (Email ke Assigner)
  if (currentTask.assigner?.email) {
    await sendTaskNotificationEmail({
      to: currentTask.assigner.email,
      recipientName: currentTask.assigner.full_name,
      assigneeName: userProfile.full_name,
      taskTitle: currentTask.title,
      taskId: currentTask.id,
      eventType: 'REVIEW_REQUESTED',
      divisionName: currentTask.division?.name,
    }).catch(err => console.error('[NotificationEngine] Gagal kirim email review:', err));
  }

  // 9. Revalidasi UI Real-Time
  revalidateTaskPaths(taskId);

  return {
    success: true,
    task: updatedTask,
    evidenceCount,
    message: 'Tugas berhasil diajukan untuk review/ACC kepada Pemberi Tugas.',
  };
}

// ==============================================================================
// 4. evaluateTask (GERBANG ACC / EVALUASI OWNER & ASSIGNER)
// ==============================================================================
/**
 * evaluateTask Server Action
 * - HANYA BISA dieksekusi oleh assigner_id (Pemberi Tugas) atau role 'OWNER'.
 * - Jika decision === 'APPROVE':
 *     - Ubah status menjadi 'DONE' dan progress_percentage = 100.
 *     - Akumulasi skor KPI ke user_kpi_records (didukung oleh trigger DB & server assurance).
 *     - Wajib mencatat audit action 'APPROVAL_ACC' beserta feedbackComment.
 * - Jika decision === 'REJECT':
 *     - Ubah status kembali menjadi 'IN_PROGRESS' dan turunkan progress_percentage ke 80%.
 *     - Wajib mencatat audit action 'REVISION_REJECT' beserta catatan revisi feedbackComment.
 */
export async function evaluateTask(
  taskId: string,
  decision: 'APPROVE' | 'REJECT',
  feedbackComment?: string
) {
  const supabase: any = await createClient();

  // 1. Server-side Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized: Otentikasi diperlukan.');
  }

  // 2. Fetch Evaluator Profile & Role
  const { data: evaluatorProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  if (profileError || !evaluatorProfile) {
    throw new Error('Forbidden: Profil evaluator tidak ditemukan.');
  }

  // 3. Fetch Existing Task State
  const { data: currentTask, error: taskError } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      status,
      kpi_weight,
      due_date,
      assignee_id,
      assigner_id,
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, email),
      division:divisions(name)
    `)
    .eq('id', taskId)
    .single();

  if (taskError || !currentTask) {
    throw new Error('Tugas tidak ditemukan atau akses ditolak oleh RLS.');
  }

  // 4. VERIFIKASI KEAMANAN HAK EVALUASI (Gerbang Assigner / Owner)
  const isOwner = evaluatorProfile.role === 'OWNER';
  const isAssigner = currentTask.assigner_id === user.id;

  if (!isOwner && !isAssigner) {
    throw new Error('Forbidden: Hanya Pemberi Tugas (Assigner) atau Owner yang memiliki hak untuk mengevaluasi (ACC / Tolak) tugas ini.');
  }

  const previousStatus = currentTask.status;

  // 5. Eksekusi Keputusan Evaluasi
  if (decision === 'APPROVE') {
    // 5A. KASUS APPROVE (ACC)
    const { data: approvedTask, error: approveError } = await supabase
      .from('tasks')
      .update({
        status: 'DONE',
        progress_percentage: 100,
      })
      .eq('id', taskId)
      .select()
      .single();

    if (approveError || !approvedTask) {
      throw new Error(`Gagal menyetujui tugas: ${approveError?.message}`);
    }

    // Server-side KPI Assurance: Pastikan user_kpi_records ter-update jika trigger DB belum aktif
    const now = new Date();
    const monthYear = `${String(now.getUTCMonth() + 1).padStart(2, '0')}-${now.getUTCFullYear()}`;
    const isOverdue = currentTask.due_date ? new Date(currentTask.due_date) < now : false;

    await supabase.rpc('noop', {}).catch(() => null); // ping
    const { error: kpiUpsertError } = await supabase
      .from('user_kpi_records')
      .upsert(
        {
          user_id: currentTask.assignee_id,
          month_year: monthYear,
          total_tasks_completed: 1,
          total_tasks_overdue: isOverdue ? 1 : 0,
          total_kpi_score: currentTask.kpi_weight,
        },
        { onConflict: 'user_id, month_year', ignoreDuplicates: false }
      )
      .select();

    if (kpiUpsertError) {
      console.warn('[KPIEngine] Database trigger menangani akumulasi KPI:', kpiUpsertError.message);
    }

    // KOTAK HITAM: Audit Trail APPROVAL_ACC
    const { error: auditError } = await supabase
      .from('task_activities')
      .insert({
        task_id: taskId,
        user_id: user.id,
        action_type: 'APPROVAL_ACC',
        old_value: previousStatus,
        new_value: 'DONE',
        comment_text: feedbackComment?.trim() || `Tugas disetujui (ACC) oleh ${evaluatorProfile.full_name}. Bobot KPI +${currentTask.kpi_weight} ditambahkan.`,
      });

    if (auditError) {
      console.error('[AuditEngine] Gagal mencatat audit APPROVAL_ACC:', auditError);
    }

    revalidateTaskPaths(taskId);

    return {
      success: true,
      decision: 'APPROVE',
      task: approvedTask,
      message: `Tugas resmi di-ACC! Skor KPI (+${currentTask.kpi_weight}) telah diakumulasikan ke performa staf.`,
    };
  } else {
    // 5B. KASUS REJECT (REVISI)
    // Turunkan progress ke 80% dan kembalikan status ke 'IN_PROGRESS'
    const { data: rejectedTask, error: rejectError } = await supabase
      .from('tasks')
      .update({
        status: 'IN_PROGRESS',
        progress_percentage: 80,
      })
      .eq('id', taskId)
      .select()
      .single();

    if (rejectError || !rejectedTask) {
      throw new Error(`Gagal menolak tugas: ${rejectError?.message}`);
    }

    // KOTAK HITAM: Audit Trail REVISION_REJECT dengan Catatan Revisi Wajib
    const { error: auditError } = await supabase
      .from('task_activities')
      .insert({
        task_id: taskId,
        user_id: user.id,
        action_type: 'REVISION_REJECT',
        old_value: previousStatus,
        new_value: 'IN_PROGRESS',
        comment_text: feedbackComment?.trim() || `Tugas ditolak / memerlukan revisi oleh ${evaluatorProfile.full_name}. Progress diturunkan menjadi 80%.`,
      });

    if (auditError) {
      console.error('[AuditEngine] Gagal mencatat audit REVISION_REJECT:', auditError);
    }

    revalidateTaskPaths(taskId);

    return {
      success: true,
      decision: 'REJECT',
      task: rejectedTask,
      message: 'Tugas dikembalikan ke status IN_PROGRESS untuk revisi staf.',
    };
  }
}

// ==============================================================================
// 5. updateTaskProgress (KOMPATIBILITAS KANBAN & MUTASI PROGRESS REAL-TIME)
// ==============================================================================
export async function updateTaskProgress(input: UpdateTaskProgressInput) {
  const supabase: any = await createClient();

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized: Authentication required.');
  }

  // 2. Fetch User Profile
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role, division_id')
    .eq('id', user.id)
    .single();

  if (profileError || !userProfile) {
    throw new Error('Forbidden: Profile record missing.');
  }

  // 3. Fetch Existing Task State
  const { data: currentTask, error: fetchError } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, email, whatsapp_number),
      assigner:profiles!tasks_assigner_id_fkey(id, full_name, email, whatsapp_number),
      division:divisions(id, name)
    `)
    .eq('id', input.taskId)
    .single();

  if (fetchError || !currentTask) {
    throw new Error('Task not found or access denied by RLS.');
  }

  // 4. Role-Level Authorization Verification
  if (userProfile.role === 'STAFF') {
    if (currentTask.assignee_id !== user.id) {
      throw new Error('RBAC Violation: Staff can only update progress on tasks assigned to them.');
    }
    // Staf tidak boleh mengubah status ke DONE secara langsung melalui updateTaskProgress
    if (input.status === 'DONE') {
      throw new Error('RBAC Violation: Staf dilarang meng-ACC tugas sendiri. Gunakan fitur submitForReview.');
    }
  } else if (userProfile.role === 'MANAGER') {
    if (currentTask.division_id !== userProfile.division_id) {
      throw new Error('RBAC Violation: Managers cannot mutate tasks outside their division.');
    }
  }

  // 5. Determine changes
  const targetStatus = input.status ?? currentTask.status;
  const targetProgress = input.progressPercentage !== undefined 
    ? Math.min(100, Math.max(0, Math.round(input.progressPercentage))) 
    : (targetStatus === 'DONE' ? 100 : currentTask.progress_percentage);

  const statusChanged = currentTask.status !== targetStatus;
  const progressChanged = currentTask.progress_percentage !== targetProgress;

  if (!statusChanged && !progressChanged && !input.auditComment) {
    return { success: true, message: 'No mutations detected.' };
  }

  // 6. Execute Task Mutation
  const { data: updatedTask, error: updateError } = await supabase
    .from('tasks')
    .update({
      status: targetStatus,
      progress_percentage: targetProgress,
    })
    .eq('id', input.taskId)
    .select()
    .single();

  if (updateError || !updatedTask) {
    throw new Error(`Task mutation failed: ${updateError?.message}`);
  }

  // 7. THE BLACK BOX: Sequential Audit Activity Logging
  const auditEntries: Array<{
    task_id: string;
    user_id: string;
    action_type: ActivityActionType;
    old_value: string | null;
    new_value: string | null;
    comment_text: string | null;
  }> = [];

  if (statusChanged) {
    auditEntries.push({
      task_id: input.taskId,
      user_id: user.id,
      action_type: 'STATUS_CHANGE',
      old_value: currentTask.status,
      new_value: targetStatus,
      comment_text: input.auditComment || null,
    });
  }

  if (progressChanged) {
    auditEntries.push({
      task_id: input.taskId,
      user_id: user.id,
      action_type: 'PROGRESS_UPDATE',
      old_value: `${currentTask.progress_percentage}%`,
      new_value: `${targetProgress}%`,
      comment_text: !statusChanged ? input.auditComment || null : null,
    });
  }

  if (!statusChanged && !progressChanged && input.auditComment) {
    auditEntries.push({
      task_id: input.taskId,
      user_id: user.id,
      action_type: 'COMMENT',
      old_value: null,
      new_value: null,
      comment_text: input.auditComment.trim(),
    });
  }

  if (auditEntries.length > 0) {
    const { error: auditError } = await supabase
      .from('task_activities')
      .insert(auditEntries);

    if (auditError) {
      console.error('[AuditEngine] Critical Audit Trail Failure:', auditError);
    }
  }

  // 8. OMNICHANNEL NOTIFICATION TRIGGERS
  if (statusChanged && targetStatus === 'IN_REVIEW' && currentTask.assigner?.email) {
    await sendTaskNotificationEmail({
      to: currentTask.assigner.email,
      recipientName: currentTask.assigner.full_name,
      assigneeName: currentTask.assignee?.full_name || 'Staff',
      taskTitle: currentTask.title,
      taskId: currentTask.id,
      eventType: 'REVIEW_REQUESTED',
      divisionName: currentTask.division?.name,
    }).catch(err => console.error('[NotificationEngine] Email error:', err));
  }

  revalidateTaskPaths(input.taskId);

  return { 
    success: true, 
    task: updatedTask, 
    auditCount: auditEntries.length 
  };
}

// ==============================================================================
// 6. reassignTask Server Action
// ==============================================================================
export async function reassignTask(input: ReassignTaskInput) {
  const supabase: any = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('id, full_name, role, division_id')
    .eq('id', user.id)
    .single();

  if (!userProfile || (userProfile.role !== 'OWNER' && userProfile.role !== 'MANAGER')) {
    throw new Error('Forbidden: Only Owners or Managers can reassign tasks.');
  }

  const { data: task } = await supabase
    .from('tasks')
    .select('*, assignee:profiles!tasks_assignee_id_fkey(full_name)')
    .eq('id', input.taskId)
    .single();

  if (!task) throw new Error('Task not found.');

  const { data: newAssignee } = await supabase
    .from('profiles')
    .select('id, full_name, division_id')
    .eq('id', input.newAssigneeId)
    .single();

  if (!newAssignee) throw new Error('New assignee profile not found.');

  if (userProfile.role === 'MANAGER' && newAssignee.division_id !== userProfile.division_id) {
    throw new Error('RBAC Violation: Cannot assign to staff in another division.');
  }

  const { error: updateError } = await supabase
    .from('tasks')
    .update({ assignee_id: input.newAssigneeId })
    .eq('id', input.taskId);

  if (updateError) throw new Error(`Reassignment failed: ${updateError.message}`);

  // The Black Box Log for Reassignment
  await supabase.from('task_activities').insert({
    task_id: input.taskId,
    user_id: user.id,
    action_type: 'REASSIGN',
    old_value: task.assignee?.full_name || task.assignee_id,
    new_value: newAssignee.full_name,
    comment_text: input.reason || `Reassigned by ${userProfile.full_name}`,
  });

  revalidateTaskPaths(input.taskId);

  return { success: true };
}

// ==============================================================================
// 7. checkAndNotifyOverdueTasks (CRON / BATCH TRIGGER)
// ==============================================================================
export async function checkAndNotifyOverdueTasks() {
  const supabase: any = await createClient();
  const now = new Date().toISOString();

  const { data: overdueTasks, error } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      due_date,
      status,
      assignee:profiles!tasks_assignee_id_fkey(full_name),
      assigner:profiles!tasks_assigner_id_fkey(full_name, email),
      division:divisions(name)
    `)
    .lt('due_date', now)
    .neq('status', 'DONE');

  if (error || !overdueTasks) {
    console.error('Failed to query overdue tasks:', error);
    return { success: false, error: error?.message };
  }

  let dispatchedCount = 0;
  for (const task of overdueTasks) {
    if (task.assigner?.email) {
      await sendTaskNotificationEmail({
        to: task.assigner.email,
        recipientName: task.assigner.full_name,
        assigneeName: task.assignee?.full_name || 'Staff',
        taskTitle: task.title,
        taskId: task.id,
        eventType: 'TASK_OVERDUE',
        divisionName: task.division?.name,
        dueDate: task.due_date ? new Date(task.due_date).toLocaleDateString('id-ID') : undefined,
      });
      dispatchedCount++;
    }
  }

  return { success: true, dispatchedCount };
}
