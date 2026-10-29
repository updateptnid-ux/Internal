'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { UserRole, AccountStatus } from '@/types/database';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid').min(1, 'Email wajib diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'Nama lengkap minimal 2 karakter').max(150),
  email: z.string().email('Format email tidak valid').min(1, 'Email wajib diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  whatsappNumber: z.string().min(8, 'Nomor WhatsApp minimal 8 digit'),
  divisionId: z.string().uuid('ID divisi harus berformat UUID yang valid dari database'),
});

/**
 * 0. getPublicDivisions Server Action
 * - Mengambil daftar divisi resmi langsung dari tabel `divisions` di database
 * - Berjalan di server environment dengan service client, aman dan selalu mengembalikan UUID asli
 */
export async function getPublicDivisions(): Promise<Array<{ id: string; name: string }>> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('divisions')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('[getPublicDivisions] Error:', error.message);
      return [];
    }

    return (data as Array<{ id: string; name: string }>) || [];
  } catch (err: any) {
    console.error('[getPublicDivisions] Exception:', err.message);
    return [];
  }
}

/**
 * 1. loginUser Server Action
 * - Memverifikasi kredensial via Supabase Auth
 * - Memeriksa account_status pada tabel profiles
 * - Jika PENDING -> Arahkan ke /pending-approval
 * - Jika REJECTED -> Tolak sesi dan sign out
 * - Jika ACTIVE -> Arahkan ke /dashboard/tasks
 */
export async function loginUser(formData: { email: string; password: string }) {
  const parseResult = loginSchema.safeParse(formData);

  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message || 'Input tidak valid',
    };
  }

  const supabase: any = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: formData.email.trim(),
    password: formData.password,
  });

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message === 'Invalid login credentials'
        ? 'Email atau password yang Anda masukkan salah.'
        : authError?.message || 'Gagal melakukan autentikasi.',
    };
  }

  // Periksa profil dan account_status
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role, account_status')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    return {
      success: true,
      pendingApproval: true,
      redirectUrl: '/pending-approval',
    };
  }

  // Jika akun masih dalam status PENDING
  if (profile.account_status === 'PENDING') {
    return {
      success: true,
      pendingApproval: true,
      redirectUrl: '/pending-approval',
    };
  }

  // Jika akun DITOLAK
  if (profile.account_status === 'REJECTED') {
    await supabase.auth.signOut();
    return {
      success: false,
      error: 'Pendaftaran akun Anda ditolak oleh jajaran Owner.',
    };
  }

  revalidatePath('/', 'layout');

  return {
    success: true,
    pendingApproval: false,
    redirectUrl: profile.role === 'OWNER' ? '/dashboard/owner' : '/dashboard/tasks',
  };
}

/**
 * 2. registerUser Server Action
 * - Mendaftarkan akun tim baru ke Supabase Auth
 * - Mengirimkan metadata division_id berupa UUID valid dari tabel divisions
 * - Menyimpan profil dengan status PENDING dan role STAFF
 */
export async function registerUser(formData: {
  fullName: string;
  email: string;
  password: string;
  whatsappNumber: string;
  divisionId: string;
}) {
  const parseResult = registerSchema.safeParse(formData);

  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message || 'Input form pendaftaran tidak valid.',
    };
  }

  const supabase: any = await createClient();

  // 1. SignUp ke Supabase Auth dengan metadata lengkap
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email.trim(),
    password: formData.password,
    options: {
      data: {
        full_name: formData.fullName.trim(),
        whatsapp_number: formData.whatsappNumber.trim(),
        division_id: formData.divisionId.trim(), // INI WAJIB UUID DARI DATABASE
        role: 'STAFF',
      },
    },
  });

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message || 'Gagal mendaftarkan akun.',
    };
  }

  // 2. Pastikan record di profiles tersimpan dengan status 'PENDING'
  const admin = createAdminClient();
  const { error: profileError } = await admin
    .from('profiles')
    .upsert(
      {
        id: authData.user.id,
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        whatsapp_number: formData.whatsappNumber.trim(),
        division_id: formData.divisionId.trim(),
        role: 'STAFF',
        account_status: 'PENDING',
      },
      { onConflict: 'id' }
    );

  if (profileError) {
    console.warn('[RegisterEngine] Profile upsert notice:', profileError.message);
  }

  return {
    success: true,
    message: 'Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan (ACC) dari jajaran Owner.',
  };
}

/**
 * 3. approveUserAccount Server Action (Hak Prerogatif Owner)
 * - Menyetujui (ACC) atau menolak pendaftaran akun tim baru
 * - Menetapkan peran jabatan (STAFF atau MANAGER)
 */
export async function approveUserAccount(
  userId: string,
  assignedRole: 'STAFF' | 'MANAGER',
  decision: 'ACTIVE' | 'REJECTED'
) {
  const supabase: any = await createClient();

  // 1. Verifikasi bahwa eksekutor adalah OWNER
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Sesi kedaluwarsa. Silakan login kembali.' };
  }

  const { data: executorProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (executorProfile?.role !== 'OWNER') {
    return {
      success: false,
      error: 'Hanya jajaran Owner yang berhak menyetujui akun pendaftaran tim baru.',
    };
  }

  // 2. Mutasi account_status dan role
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      account_status: decision,
      role: decision === 'ACTIVE' ? assignedRole : 'STAFF',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    return {
      success: false,
      error: updateError.message || 'Gagal memperbarui status akun.',
    };
  }

  revalidatePath('/dashboard/owner');

  return {
    success: true,
    message: decision === 'ACTIVE'
      ? `Akun berhasil disetujui (ACC) dengan role ${assignedRole}.`
      : 'Pendaftaran akun telah ditolak.',
  };
}

/**
 * 4. logoutUser Server Action
 * - Mengakhiri sesi pengguna
 */
export async function logoutUser() {
  const supabase: any = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
