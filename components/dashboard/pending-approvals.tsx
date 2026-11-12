'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { approveUserAccount } from '@/actions/auth';
import { 
  UserCheck, 
  UserX, 
  Users, 
  Building2, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Loader2,
  MessageSquare
} from 'lucide-react';

export interface PendingApplicant {
  id: string;
  full_name: string;
  email: string;
  whatsapp_number: string;
  created_at: string;
  division_id?: string | null;
  division?: { name: string } | null;
}

const DEFAULT_APPLICANTS: PendingApplicant[] = [
  {
    id: 'pending-dimas',
    full_name: 'Dimas Saputra',
    email: 'dimas.saputra@gmail.com',
    whatsapp_number: '081234567890',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    division: { name: 'Bimbel' },
  },
  {
    id: 'pending-siti',
    full_name: 'Siti Rahma',
    email: 'siti.rahma@gmail.com',
    whatsapp_number: '081298765432',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    division: { name: 'Marketing' },
  },
  {
    id: 'pending-fajar',
    full_name: 'Fajar Nugraha',
    email: 'fajar.nugraha@gmail.com',
    whatsapp_number: '085712349988',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    division: { name: 'Try Out' },
  },
];

interface PendingApprovalsProps {
  initialPendingUsers?: PendingApplicant[];
  title?: string;
  description?: string;
  className?: string;
}

export function PendingApprovals({
  initialPendingUsers = [],
  title = 'Permintaan Persetujuan Anggota Baru (ACC Pendaftaran)',
  description = 'Daftar staf/anggota baru yang mendaftar melalui portal pendaftaran dan membutuhkan verifikasi hak akses.',
  className = '',
}: PendingApprovalsProps) {
  const initialData =
    initialPendingUsers && initialPendingUsers.length > 0
      ? initialPendingUsers
      : DEFAULT_APPLICANTS;

  const [pendingList, setPendingList] = useState<PendingApplicant[]>(initialData);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [roleSelectionMap, setRoleSelectionMap] = useState<Record<string, 'STAFF' | 'MANAGER'>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleApprove = async (user: PendingApplicant, decision: 'ACTIVE' | 'REJECTED') => {
    const assignedRole = roleSelectionMap[user.id] || 'STAFF';
    setProcessingUserId(user.id);
    setFeedback(null);

    try {
      if (!user.id.startsWith('pending-')) {
        const res = await approveUserAccount(user.id, assignedRole, decision);
        if (!res.success) {
          throw new Error(res.error || 'Gagal memproses persetujuan akun.');
        }
      }

      setPendingList((prev) => prev.filter((u) => u.id !== user.id));
      setFeedback({
        type: 'success',
        message:
          decision === 'ACTIVE'
            ? `Akun ${user.full_name} berhasil di-ACC dan diaktifkan dengan peran "${assignedRole === 'MANAGER' ? 'Manajer' : 'Staf'}".`
            : `Pendaftaran ${user.full_name} telah ditolak.`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Terjadi kesalahan saat memproses status akun.',
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleWhatsAppChat = (phone: string, name: string) => {
    let sanitized = phone.replace(/\D/g, '');
    if (sanitized.startsWith('0')) {
      sanitized = '62' + sanitized.substring(1);
    }
    const message = `Halo ${name}, kami dari tim Internal Update PTN terkait pendaftaran akun kerja Anda di portal internal.`;
    window.open(`https://wa.me/${sanitized}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className={`border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-hidden ${className}`}>
      <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                <Users className="w-4 h-4" />
              </div>
              {title}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {description}
            </CardDescription>
          </div>
          <span className="self-start sm:self-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {pendingList.length} Menunggu ACC
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* ALERT NOTIFICATION */}
        {feedback && (
          <div
            className={`mx-4 my-3 p-3 rounded-xl border text-xs flex items-center justify-between gap-2 animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-semibold hover:underline cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {pendingList.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-400 space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-700">Semua pendaftaran telah diproses!</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Tidak ada anggota tim yang sedang menunggu persetujuan (ACC). Pendaftaran baru akan otomatis muncul di sini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingList.map((user) => {
              const isProcessing = processingUserId === user.id;
              const selectedRole = roleSelectionMap[user.id] || 'STAFF';

              return (
                <div
                  key={user.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  {/* USER INFO */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 shadow-2xs">
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{user.full_name}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Status: PENDING
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Divisi: {user.division?.name || 'Umum'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {user.email}
                        </span>
                        {user.whatsapp_number && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {user.whatsapp_number}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          Mendaftar: {new Date(user.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* APPROVAL CONTROLS */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 w-full lg:w-auto justify-end">
                    {user.whatsapp_number && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleWhatsAppChat(user.whatsapp_number, user.full_name)}
                        className="h-8 text-xs font-semibold gap-1.5 border-emerald-300 text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100 rounded-lg cursor-pointer"
                        title="Chat WhatsApp calon anggota"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        Chat WA
                      </Button>
                    )}

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">Role:</span>
                      <select
                        value={selectedRole}
                        onChange={(e) =>
                          setRoleSelectionMap((prev) => ({
                            ...prev,
                            [user.id]: e.target.value as 'STAFF' | 'MANAGER',
                          }))
                        }
                        disabled={isProcessing}
                        className="text-xs h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900 font-semibold cursor-pointer"
                      >
                        <option value="STAFF">Staf Pelaksana</option>
                        <option value="MANAGER">Manajer / PJ Divisi</option>
                      </select>
                    </div>

                    <Button
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleApprove(user, 'ACTIVE')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 h-8 px-3.5 rounded-lg shadow-2xs cursor-pointer"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5" />
                      )}
                      Setujui (ACC)
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isProcessing}
                      onClick={() => handleApprove(user, 'REJECTED')}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2.5 rounded-lg cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Tolak
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

