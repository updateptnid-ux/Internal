'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Nama minimal 2 karakter').max(150),
  email: z.string().trim().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  whatsappNumber: z.string().trim().min(8, 'Nomor WhatsApp minimal 8 digit'),
  title: z.string().trim().max(150).optional(),
});

const inviteSchema = z.object({
  fullName: z.string().trim().min(2, 'Nama minimal 2 karakter').max(150),
  email: z.string().trim().email('Format email tidak valid'),
  whatsappNumber: z.string().trim().min(8, 'Nomor WhatsApp minimal 8 digit'),
  title: z.string().trim().min(2, 'Jabatan wajib diisi'),
  role: z.enum(['OWNER', 'TEAM']).default('TEAM'),
  password: z.string().min(6, 'Password minimal 6 karakter').optional(),
});

export type AuthResult =
  | { success: true; redirectUrl: string; error?: never }
  | { success: false; error: string; redirectUrl?: never };

export type InviteResult =
  | { success: true; tempPassword: string; error?: never }
  | { success: false; error: string; tempPassword?: never };

export async function loginUser(input: { email: string; password: string }): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Input tidak valid' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      success: false,
      error: error.message === 'Invalid login credentials' ? 'Email atau password salah.' : error.message,
    };
  }

  revalidatePath('/', 'layout');
  return { success: true, redirectUrl: '/dashboard' };
}

/**
 * Register frictionless: user dibuat via Admin API dengan email_confirm: true,
 * profil dibuat otomatis oleh trigger database, lalu langsung login.
 */
export async function registerUser(input: {
  fullName: string;
  email: string;
  password: string;
  whatsappNumber: string;
  title?: string;
}): Promise<AuthResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Input tidak valid' };
  }
  const { fullName, email, password, whatsappNumber, title } = parsed.data;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY belum diset di server.' };
  }

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, whatsapp_number: whatsappNumber, title: title || null, role: 'OWNER' },
  });

  if (createError || !created.user) {
    const msg = createError?.message ?? 'Pendaftaran gagal.';
    return {
      success: false,
      error: /already|registered|exists/i.test(msg) ? 'Email sudah terdaftar. Silakan masuk.' : msg,
    };
  }

  // Pastikan data profil sinkron di tabel profiles
  await admin.from('profiles').upsert(
    {
      id: created.user.id,
      full_name: fullName,
      email,
      whatsapp_number: whatsappNumber,
      title: title || null,
      role: 'OWNER',
    },
    { onConflict: 'id' }
  );

  const supabase = await createClient();
  const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
  if (loginError) return { success: false, error: loginError.message };

  revalidatePath('/', 'layout');
  return { success: true, redirectUrl: '/dashboard' };
}

export async function inviteTeamMember(input: {
  fullName: string;
  email: string;
  whatsappNumber: string;
  title: string;
  role: 'OWNER' | 'TEAM';
  password?: string;
}): Promise<InviteResult> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Data tidak valid' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Sesi berakhir. Silakan masuk kembali.' };

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!me || me.role !== 'OWNER') {
    return { success: false, error: 'Hanya Owner yang dapat mengundang anggota.' };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY belum diset di server.' };
  }

  const { fullName, email, whatsappNumber, title, role } = parsed.data;
  const tempPassword = parsed.data.password || `Ptn${Math.floor(100000 + Math.random() * 900000)}!`;

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, whatsapp_number: whatsappNumber, title, role },
  });

  if (error || !created.user) {
    const msg = error?.message ?? 'Gagal membuat akun.';
    return { success: false, error: /already|registered|exists/i.test(msg) ? 'Email sudah terdaftar.' : msg };
  }

  await admin.from('profiles').upsert(
    { id: created.user.id, full_name: fullName, email, whatsapp_number: whatsappNumber, title, role },
    { onConflict: 'id' }
  );

  return { success: true, tempPassword };
}

export async function logoutUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
