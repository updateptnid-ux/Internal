'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { createTask } from '@/actions/tasks';
import { approveUserAccount } from '@/actions/auth';
import { 
  Building2, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  UserCheck, 
  UserX, 
  Users, 
  AlertCircle, 
  Phone,
  Plus,
  CheckCircle,
  FileText
} from 'lucide-react';
import { TaskPriority } from '@/types/database';
import { AnalyticsCharts, DivisionPerformance, KpiPerformance } from './analytics-charts';

const createTaskSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(255, 'Judul terlalu panjang'),
  description: z.string().optional(),
  divisionId: z.string().min(1, 'Divisi wajib dipilih'),
  assigneeId: z.string().min(1, 'Penerima tugas wajib dipilih'),
  kpiWeight: z.number().min(1, 'Bobot minimal 1').max(10, 'Bobot maksimal 10'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.string().optional(),
});

export interface StaffKpiSummary {
  userId: string;
  fullName: string;
  divisionName: string;
  totalTasksCompleted: number;
  totalTasksOverdue: number;
  totalKpiScore: number;
}

export interface PendingUser {
  id: string;
  full_name: string;
  email: string;
  whatsapp_number: string;
  created_at: string;
  division_id: string | null;
  division?: { name: string } | null;
}

interface GodEyeAnalyticsProps {
  totalActiveTasks: number;
  totalOverdueTasks: number;
  totalInReviewTasks: number;
  staffKpiList: StaffKpiSummary[];
  divisions: { id: string; name: string }[];
  staffMembers: { id: string; full_name: string; division_id: string | null }[];
  pendingUsers?: PendingUser[];
  divisionPerformanceData: DivisionPerformance[];
  kpiPerformanceData: KpiPerformance[];
}

export function GodEyeAnalytics({
  totalActiveTasks,
  totalOverdueTasks,
  totalInReviewTasks,
  staffKpiList,
  divisions,
  staffMembers,
  pendingUsers = [],
  divisionPerformanceData,
  kpiPerformanceData,
}: GodEyeAnalyticsProps) {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pending Users State & Processing
  const [pendingList, setPendingList] = useState<PendingUser[]>(pendingUsers);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [roleSelectionMap, setRoleSelectionMap] = useState<Record<string, 'STAFF' | 'MANAGER'>>({});

  // Sync initial pending users
  React.useEffect(() => {
    setPendingList(pendingUsers);
  }, [pendingUsers]);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDivision, setSelectedDivision] = useState(divisions[0]?.id || '');
  const [selectedAssignee, setSelectedAssignee] = useState(staffMembers[0]?.id || '');
  const [kpiWeight, setKpiWeight] = useState<number>(3);
  const [priority, setPriority] = useState<TaskPriority>('HIGH');
  const [dueDate, setDueDate] = useState('');

  // Filter staff by selected division
  const filteredStaff = selectedDivision
    ? staffMembers.filter((s) => !s.division_id || s.division_id === selectedDivision)
    : staffMembers;

  const handleOpenModal = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsAssignModalOpen(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = createTaskSchema.safeParse({
      title,
      description,
      divisionId: selectedDivision,
      assigneeId: selectedAssignee,
      kpiWeight,
      priority,
      dueDate: dueDate || undefined,
    });

    if (!validation.success) {
      setErrorMsg(validation.error.issues[0]?.message || 'Input form tidak valid.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createTask({
        title,
        description,
        divisionId: selectedDivision,
        assigneeId: selectedAssignee,
        kpiWeight,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });

      if (res.success) {
        setSuccessMsg('Tugas baru berhasil dibuat.');
        setTitle('');
        setDescription('');
        setDueDate('');
        setIsAssignModalOpen(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membuat tugas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler ACC / Tolak Akun Tim Baru
  const handleApproveAccount = async (userId: string, decision: 'ACTIVE' | 'REJECTED') => {
    const assignedRole = roleSelectionMap[userId] || 'STAFF';
    try {
      setProcessingUserId(userId);
      const res = await approveUserAccount(userId, assignedRole, decision);
      if (res.success) {
        setPendingList((prev) => prev.filter((u) => u.id !== userId));
        setSuccessMsg(decision === 'ACTIVE' ? 'Akun telah disetujui.' : 'Akun telah ditolak.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses persetujuan akun.');
    } finally {
      setProcessingUserId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. CLEAN SAAS HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Ringkasan
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau performa tim, tugas aktif, dan persetujuan secara real-time.
          </p>
        </div>

        <div>
          <Button
            onClick={handleOpenModal}
            className="h-9 px-4 text-xs font-medium gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tugas Baru
          </Button>
        </div>
      </div>

      {/* FEEDBACK ALERTS */}
      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button 
            onClick={() => setSuccessMsg(null)} 
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50/80 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button 
            onClick={() => setErrorMsg(null)} 
            className="text-rose-700 hover:text-rose-900 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 2. THREE MINIMALIST METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Tugas Aktif */}
        <Card className="border border-slate-200/60 bg-white shadow-xs rounded-xl hover:border-slate-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-slate-500">
              Tugas Aktif
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-3xl font-bold tracking-tight text-slate-900">
              {totalActiveTasks}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sedang dikerjakan oleh tim
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Terlambat */}
        <Card className="border border-slate-200/60 bg-white shadow-xs rounded-xl hover:border-slate-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-slate-500">
              Terlambat
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-3xl font-bold tracking-tight text-rose-600">
              {totalOverdueTasks}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Melewati batas waktu pengerjaan
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Butuh Persetujuan */}
        <Card className="border border-slate-200/60 bg-white shadow-xs rounded-xl hover:border-slate-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-medium text-slate-500">
              Butuh Persetujuan
            </span>
            <span className="w-2 h-2 rounded-full bg-purple-500" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-3xl font-bold tracking-tight text-purple-700">
              {totalInReviewTasks}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Menunggu tinjauan pengerjaan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. VISUAL CHARTS (RECHARTS) */}
      <AnalyticsCharts 
        divisionData={divisionPerformanceData}
        kpiData={kpiPerformanceData}
      />

      {/* 4. MENUNGGU PERSETUJUAN (NEW USERS APPROVAL) */}
      <Card className="border border-slate-200/60 bg-white shadow-xs rounded-xl">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-700" />
                Menunggu Persetujuan
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Pendaftaran anggota tim baru yang membutuhkan konfirmasi akses
              </CardDescription>
            </div>
            {pendingList.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                {pendingList.length} Permintaan
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {pendingList.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-slate-300" />
              Tidak ada akun yang menunggu persetujuan.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingList.map((user) => {
                const isProcessing = processingUserId === user.id;
                const assignedRole = roleSelectionMap[user.id] || 'STAFF';

                return (
                  <div 
                    key={user.id} 
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold text-xs shrink-0 mt-0.5">
                        {user.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-slate-900">{user.full_name}</h4>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">
                            Menunggu
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {user.division?.name || 'Belum ada divisi'}
                          </span>
                          {user.whatsapp_number && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {user.whatsapp_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <select
                        value={assignedRole}
                        onChange={(e) =>
                          setRoleSelectionMap((prev) => ({
                            ...prev,
                            [user.id]: e.target.value as 'STAFF' | 'MANAGER',
                          }))
                        }
                        disabled={isProcessing}
                        className="text-xs h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden"
                      >
                        <option value="STAFF">Staf</option>
                        <option value="MANAGER">Manajer</option>
                      </select>

                      <Button
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleApproveAccount(user.id, 'ACTIVE')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1 h-8 rounded-lg"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Setujui
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isProcessing}
                        onClick={() => handleApproveAccount(user.id, 'REJECTED')}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 rounded-lg"
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

      {/* 5. TABEL PERFORMA TIM */}
      <Card className="border border-slate-200/60 bg-white shadow-xs rounded-xl">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                Performa Tim
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Pencapaian tugas dan skor KPI staf bulan ini
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-medium text-[11px]">
                <tr>
                  <th className="py-3 px-5">Nama</th>
                  <th className="py-3 px-5">Divisi</th>
                  <th className="py-3 px-5 text-center">Selesai</th>
                  <th className="py-3 px-5 text-center">Terlambat</th>
                  <th className="py-3 px-5 text-right">Skor KPI</th>
                  <th className="py-3 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffKpiList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Belum ada catatan tugas bulan ini.
                    </td>
                  </tr>
                ) : (
                  staffKpiList.map((staff, idx) => {
                    const isTop = idx === 0 && staff.totalKpiScore > 0;
                    return (
                      <tr key={staff.userId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-5 font-medium text-slate-900 flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold text-[10px]">
                            {staff.fullName.charAt(0)}
                          </div>
                          <span className="truncate">{staff.fullName}</span>
                          {isTop && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              Teratas
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-5 text-slate-500">
                          {staff.divisionName || 'Umum'}
                        </td>
                        <td className="py-3 px-5 text-center font-medium text-emerald-600">
                          {staff.totalTasksCompleted}
                        </td>
                        <td className="py-3 px-5 text-center">
                          {staff.totalTasksOverdue > 0 ? (
                            <span className="text-rose-600 font-medium">
                              {staff.totalTasksOverdue}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-3 px-5 text-right font-semibold text-slate-900">
                          {staff.totalKpiScore} pts
                        </td>
                        <td className="py-3 px-5 text-center">
                          <Badge 
                            variant={
                              staff.totalKpiScore >= 20 
                                ? 'default' 
                                : staff.totalKpiScore >= 10 
                                ? 'high' 
                                : 'secondary'
                            }
                            className="text-[10px] font-normal"
                          >
                            {staff.totalKpiScore >= 20 ? 'Optimal' : staff.totalKpiScore >= 10 ? 'Baik' : 'Normal'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 6. MODAL: TAMBAH TUGAS BARU */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent onClose={() => setIsAssignModalOpen(false)} className="max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-900">
              Tambah Tugas Baru
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Berikan tugas ke anggota tim dan tentukan bobot KPI.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateTask} className="space-y-4 pt-1">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">
                Judul Tugas <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Audit Keamanan Sistem Supabase"
                required
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-900 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">
                Deskripsi
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan detail tugas dan kriteria selesai..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-900 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">
                  Divisi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedDivision}
                  onChange={(e) => {
                    setSelectedDivision(e.target.value);
                    const match = staffMembers.find((s) => s.division_id === e.target.value);
                    if (match) setSelectedAssignee(match.id);
                  }}
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-hidden"
                >
                  {divisions.map((div) => (
                    <option key={div.id} value={div.id}>
                      {div.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">
                  Penerima Tugas <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-hidden"
                >
                  {filteredStaff.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">
                  Bobot KPI (1-10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={kpiWeight}
                  onChange={(e) => setKpiWeight(parseInt(e.target.value) || 1)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">
                  Prioritas
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-hidden"
                >
                  <option value="LOW">Rendah</option>
                  <option value="MEDIUM">Sedang</option>
                  <option value="HIGH">Tinggi</option>
                  <option value="URGENT">Mendesak</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">
                  Batas Waktu
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-hidden"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAssignModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Tugas'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
