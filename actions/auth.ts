'use server';

import { createClient } from '@/lib/supabase/server';
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
  divisionId: z.string().min(1, 'Divisi wajib dipilih'),
});

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

  // 1. SignUp ke Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email.trim(),
    password: formData.password,
    options: {
      data: {
        full_name: formData.fullName.trim(),
        whatsapp_number: formData.whatsappNumber.trim(),
        division_id: formData.divisionId,
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
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: authData.user.id,
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        whatsapp_number: formData.whatsappNumber.trim(),
        division_id: formData.divisionId,
        role: 'STAFF',
        account_status: 'PENDING',
      },
      { onConflict: 'id' }
    );

  if (profileError) {
    console.warn('[RegisterEngine] Profile upsert warning:', profileError.message);
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
  assignedRole: 'STAFF' | 'MANAGER' = 'STAFF',
  decision: 'ACTIVE' | 'REJECTED' = 'ACTIVE'
) {
  const supabase: any = await createClient();

  // 1. Verifikasi Sesi Actor
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized: Otentikasi diperlukan.');
  }

  // 2. Verifikasi Role Owner
  const { data: actorProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || actorProfile?.role !== 'OWNER') {
    throw new Error('Forbidden: Hanya jajaran Owner yang berhak menyetujui akun anggota tim baru.');
  }

  // 3. Mutasi status akun & role
  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update({
      account_status: decision,
      role: decision === 'ACTIVE' ? assignedRole : 'STAFF',
    })
    .eq('id', userId)
    .select()
    .single();

  if (updateError || !updatedProfile) {
    throw new Error(`Gagal memperbarui status akun: ${updateError?.message}`);
  }

  revalidatePath('/dashboard/owner');
  revalidatePath('/dashboard/tasks');

  return {
    success: true,
    message: decision === 'ACTIVE'
      ? `Akun ${updatedProfile.full_name} berhasil di-ACC dengan role ${assignedRole}.`
      : `Pendaftaran ${updatedProfile.full_name} telah ditolak.`,
  };
}

/**
 * 4. logoutUser Server Action
 */
export async function logoutUser() {
  const supabase: any = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
