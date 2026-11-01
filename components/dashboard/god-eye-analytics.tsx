'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { createTask } from '@/actions/tasks';
import { 
  Building2, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Users, 
  AlertCircle, 
  Plus,
  Activity,
  Award,
  ArrowUpRight,
  Flame,
  GraduationCap,
  Target,
  Megaphone,
  Layers,
  Calendar
} from 'lucide-react';
import { TaskPriority, TaskCategory, PriorityIndonesia } from '@/types/database';
import { AnalyticsCharts, DivisionPerformance, KpiPerformance } from './analytics-charts';
import {
  CORE_TEAM_MEMBERS,
  PTN_DIVISIONS,
  INITIAL_PTN_TASKS,
  calculateWeightedEvaluation,
  EnrichedTask,
} from '@/lib/operational-data';

const createTaskSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(255, 'Judul terlalu panjang'),
  description: z.string().optional(),
  divisionId: z.string().min(1, 'Divisi wajib dipilih'),
  assigneeId: z.string().min(1, 'Penerima tugas wajib dipilih'),
  kpiWeight: z.number().min(1, 'Bobot minimal 1').max(10, 'Bobot maksimal 10'),
  priorityLabel: z.enum(['Tinggi', 'Sedang', 'Rendah']),
  category: z.enum(['B2B', 'Affiliate', 'Media Partnership', 'SEO', 'TikTok Live', 'Operasional']),
  dueDate: z.string().optional(),
});

export interface StaffKpiSummary {
  userId: string;
  fullName: string;
  divisionName: string;
  jobTitles?: string[];
  handledDivisions?: string[];
  totalTasksCompleted: number;
  totalTasksOverdue: number;
  totalKpiScore: number;
  targetScore?: number;
  completionRate?: number;
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
  highPriorityTasks?: EnrichedTask[];
}

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 14 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.4, 
      ease: 'easeOut'
    } 
  },
};

const CATEGORY_BADGE_STYLES: Record<string, string> = {
  B2B: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Affiliate: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Media Partnership': 'bg-amber-50 text-amber-700 border-amber-200',
  SEO: 'bg-purple-50 text-purple-700 border-purple-200',
  'TikTok Live': 'bg-rose-50 text-rose-700 border-rose-200',
  Operasional: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function GodEyeAnalytics({
  divisions,
  staffMembers,
  divisionPerformanceData,
  kpiPerformanceData,
  highPriorityTasks,
}: GodEyeAnalyticsProps) {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const activeDivisionsList = divisions.length >= 9 ? divisions : PTN_DIVISIONS;
  const activeStaffOptions =
    staffMembers.length >= 5
      ? staffMembers
      : CORE_TEAM_MEMBERS.map((m) => ({
          id: m.id,
          full_name: m.fullName,
          division_id: PTN_DIVISIONS[0].id,
        }));

  const defaultHighPriority = INITIAL_PTN_TASKS.filter((t) => t.priority_label === 'Tinggi');
  const [priorityTasks, setPriorityTasks] = useState<EnrichedTask[]>(
    highPriorityTasks && highPriorityTasks.length > 0 ? highPriorityTasks : defaultHighPriority
  );

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDivision, setSelectedDivision] = useState(activeDivisionsList[0]?.id || '');
  const [selectedAssignee, setSelectedAssignee] = useState(activeStaffOptions[0]?.id || '');
  const [kpiWeight, setKpiWeight] = useState<number>(8);
  const [priorityLabel, setPriorityLabel] = useState<PriorityIndonesia>('Tinggi');
  const [category, setCategory] = useState<TaskCategory>('B2B');
  const [dueDate, setDueDate] = useState('');

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
      priorityLabel,
      category,
      dueDate: dueDate || undefined,
    });

    if (!validation.success) {
      setErrorMsg(validation.error.issues[0]?.message || 'Input form tidak valid.');
      return;
    }

    const mappedPriority: TaskPriority =
      priorityLabel === 'Tinggi' ? 'HIGH' : priorityLabel === 'Sedang' ? 'MEDIUM' : 'LOW';

    const assigneeObj = CORE_TEAM_MEMBERS.find((m) => m.id === selectedAssignee) || CORE_TEAM_MEMBERS[0];
    const divisionObj = PTN_DIVISIONS.find((d) => d.id === selectedDivision) || PTN_DIVISIONS[0];

    try {
      setIsSubmitting(true);
      await createTask({
        title,
        description,
        divisionId: selectedDivision,
        assigneeId: selectedAssignee,
        kpiWeight,
        priority: mappedPriority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      }).catch(() => null);

      const newLocalTask: EnrichedTask = {
        id: `local-${Date.now()}`,
        title,
        description: description || null,
        assigner_id: CORE_TEAM_MEMBERS[0].id,
        assignee_id: assigneeObj.id,
        division_id: divisionObj.id,
        status: 'TODO',
        priority: mappedPriority,
        priority_label: priorityLabel,
        category,
        kpi_weight: kpiWeight,
        progress_percentage: 0,
        due_date: dueDate ? new Date(dueDate).toISOString() : new Date(Date.now() + 86400000 * 3).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assignee: {
          id: assigneeObj.id,
          full_name: assigneeObj.fullName,
          email: assigneeObj.email,
          whatsapp_number: assigneeObj.whatsapp,
          role: assigneeObj.role,
          division_id: divisionObj.id,
          account_status: 'ACTIVE',
          job_titles: assigneeObj.jobTitles,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        division: {
          id: divisionObj.id,
          name: divisionObj.name,
          created_at: new Date().toISOString(),
        },
        assignee_roles: assigneeObj.jobTitles,
      };

      if (priorityLabel === 'Tinggi') {
        setPriorityTasks((prev) => [newLocalTask, ...prev]);
      }

      setSuccessMsg(`Tugas "${title}" (${category} - Prioritas ${priorityLabel}) berhasil didelegasikan kepada ${assigneeObj.fullName}.`);
      setTitle('');
      setDescription('');
      setDueDate('');
      setIsAssignModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membuat tugas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 font-sans"
    >
      {/* 1. HEADER OPERASIONAL INTERNAL UPDATE PTN */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Operasional EdTech PTN Aktif
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">9 Divisi • 5 Personel Multi-Role</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Ringkasan Eksekutif (Overview)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitoring KPI Target vs Aktual, tugas prioritas tinggi, dan matriks kinerja tim inti Internal Update PTN.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/marketing">
            <Button
              variant="outline"
              className="h-9 px-3.5 text-xs font-semibold gap-1.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <Megaphone className="w-3.5 h-3.5 text-indigo-600" />
              Marketing Hub
            </Button>
          </Link>
          <Button
            onClick={handleOpenModal}
            className="h-9 px-4 text-xs font-semibold gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-all hover:shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Delegasi Tugas
          </Button>
        </div>
      </motion.div>

      {/* FEEDBACK ALERTS */}
      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between"
        >
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
        </motion.div>
      )}

      {/* 2. BENTO GRID ROW 1: 4 METRIK UTAMA EDTECH PTN */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Card 1: Peserta Try Out Akbar */}
        <Card className="border border-slate-200/70 bg-white shadow-xs rounded-2xl hover:shadow-md transition-all p-5">
          <div className="flex items-center justify-between pb-2.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Peserta Try Out UTBK
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            9.450 <span className="text-xs font-normal text-slate-400">/ 10.000</span>
          </div>
          <div className="flex items-center justify-between mt-2.5 text-xs">
            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
              94.5% Target <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] text-slate-400">PJ: Arya</span>
          </div>
        </Card>

        {/* Card 2: Siswa Bimbel & Mitra B2B */}
        <Card className="border border-slate-200/70 bg-white shadow-xs rounded-2xl hover:shadow-md transition-all p-5">
          <div className="flex items-center justify-between pb-2.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Siswa Bimbel & B2B
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            445 <span className="text-xs font-normal text-slate-400">Siswa • 31 SMA</span>
          </div>
          <div className="flex items-center justify-between mt-2.5 text-xs">
            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
              +18.2% Konversi <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] text-slate-400">PJ: Zidan</span>
          </div>
        </Card>

        {/* Card 3: Tugas Prioritas Tinggi */}
        <Card className="border border-slate-200/70 bg-white shadow-xs rounded-2xl hover:shadow-md transition-all p-5">
          <div className="flex items-center justify-between pb-2.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Tugas Prioritas Tinggi
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-600">
            {priorityTasks.length} <span className="text-xs font-normal text-slate-400">Tugas Inti</span>
          </div>
          <div className="flex items-center justify-between mt-2.5 text-xs">
            <span className="text-slate-600 font-medium">
              Lintas 9 Divisi
            </span>
            <Link href="/dashboard/tasks" className="text-[11px] font-semibold text-indigo-600 hover:underline">
              Buka Kanban →
            </Link>
          </div>
        </Card>

        {/* Card 4: Rata-rata Skor KPI Tim Inti */}
        <Card className="border border-slate-200/70 bg-white shadow-xs rounded-2xl hover:shadow-md transition-all p-5">
          <div className="flex items-center justify-between pb-2.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Skor Kinerja Tim Inti
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            89.8 <span className="text-xs font-normal text-slate-400">/ 100 pts</span>
          </div>
          <div className="flex items-center justify-between mt-2.5 text-xs">
            <span className="text-amber-700 font-semibold">
              Bobot 60/25/15
            </span>
            <Link href="/dashboard/evaluation" className="text-[11px] font-semibold text-indigo-600 hover:underline">
              Detail Rapor →
            </Link>
          </div>
        </Card>
      </motion.div>

      {/* 3. BENTO GRID ROW 2: RECHARTS TARGET VS AKTUAL KPI BULANAN & CAPAIAN 9 DIVISI */}
      <motion.div variants={itemVariants}>
        <AnalyticsCharts 
          divisionData={divisionPerformanceData}
          kpiData={kpiPerformanceData}
        />
      </motion.div>

      {/* 4. BENTO GRID ROW 3: DAFTAR TUGAS PRIORITAS TINGGI (5 COL) + STATUS KPI 5 ANGGOTA TIM INTI (7 COL) */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5"
      >
        {/* LEFT BENTO (5 COLS): DAFTAR TUGAS PRIORITAS TINGGI */}
        <Card className="lg:col-span-5 border border-slate-200/70 bg-white shadow-xs rounded-2xl flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                      <Flame className="w-4 h-4" />
                    </div>
                    Daftar Tugas Prioritas Tinggi
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Fokus eksekusi kritikal Try Out, Bimbel, IT & Marketing
                  </CardDescription>
                </div>
                <Badge variant="urgent" className="text-[10px]">
                  Prioritas Tinggi
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {priorityTasks.slice(0, 6).map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-100 text-rose-700">
                        {task.priority_label || 'Tinggi'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                          CATEGORY_BADGE_STYLES[task.category] || CATEGORY_BADGE_STYLES.Operasional
                        }`}
                      >
                        {task.category}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                        {task.division?.name || 'Operasional'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 shrink-0">
                      {task.progress_percentage}%
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-900 leading-snug">
                    {task.title}
                  </h4>

                  <Progress value={task.progress_percentage} className="h-1.5" />

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                        {task.assignee?.full_name?.charAt(0) || 'A'}
                      </div>
                      <span className="font-semibold text-slate-800">
                        {task.assignee?.full_name}
                      </span>
                      <span className="text-slate-400 truncate max-w-[140px]">
                        ({task.assignee_roles?.[0] || 'PJ Divisi'})
                      </span>
                    </div>
                    {task.due_date && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.due_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </div>
          <div className="p-4 pt-0">
            <Link href="/dashboard/tasks">
              <Button variant="outline" size="sm" className="w-full text-xs rounded-xl border-slate-200">
                Lihat Seluruh Tugas di Papan Kanban →
              </Button>
            </Link>
          </div>
        </Card>

        {/* RIGHT BENTO (7 COLS): STATUS PENCAPAIAN KPI 5 ANGGOTA TIM INTI (MULTI-ROLE) */}
        <Card className="lg:col-span-7 border border-slate-200/70 bg-white shadow-xs rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                    <Award className="w-4 h-4" />
                  </div>
                  Status Pencapaian KPI 5 Anggota Tim Inti (Multi-Role)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Realisasi KPI spesifik per penanggung jawab divisi (Arya, Zidan, Abdur, Zaki, Rendi)
                </CardDescription>
              </div>
              <Link href="/dashboard/evaluation">
                <Badge variant="outline" className="text-[11px] font-semibold text-indigo-700 border-indigo-200 bg-indigo-50/60 cursor-pointer">
                  Buka Evaluasi 60/25/15 →
                </Badge>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3.5">
            {CORE_TEAM_MEMBERS.map((member, index) => {
              const weightedTotal = calculateWeightedEvaluation(
                member.kpiScore,
                member.collaborationScore,
                member.professionalismScore
              );

              return (
                <div
                  key={member.id}
                  className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${member.avatarBg} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs`}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="text-sm font-bold text-slate-900">{member.name}</h4>
                          {index === 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                              Lead PM
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">•</span>
                          <span className="text-[11px] font-medium text-slate-500">
                            {member.tasksCompleted} tugas selesai
                          </span>
                        </div>
                        {/* MULTI-JOB BADGES */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {member.jobTitles.map((title) => (
                            <span
                              key={title}
                              className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${member.badgeColor}`}
                            >
                              {title}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Skor KPI Aktual</span>
                        <span className="text-base font-extrabold text-slate-900">
                          {member.monthlyActualPoints}%{' '}
                          <span className="text-[11px] font-normal text-slate-400">
                            / {member.monthlyTargetPoints}%
                          </span>
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5">
                        Nilai Akhir: {weightedTotal}
                      </span>
                    </div>
                  </div>

                  {/* DELIVERABLE METRICS PER DIVISION */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {member.keyDeliverables.map((deliv, idx) => {
                      const pct = Math.min(100, Math.round((deliv.actual / deliv.target) * 100));
                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/60 space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-slate-700 truncate">{deliv.division}</span>
                            <span className="font-semibold text-emerald-600">{pct}%</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate" title={deliv.metric}>
                            {deliv.metric}
                          </p>
                          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-800">
                            <span>
                              {deliv.actual.toLocaleString('id-ID')} / {deliv.target.toLocaleString('id-ID')} {deliv.unit}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* 5. MODAL DELEGASI TUGAS BARU (MENDUKUNG 9 DIVISI, KATEGORI MARKETING & PRIORITAS INDONESIA) */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent onClose={() => setIsAssignModalOpen(false)} className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Delegasikan Tugas Operasional PTN
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pilih divisi dari 9 departemen, kategori tugas, tingkat prioritas, dan PJ Tim Inti.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateTask} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Judul Tugas <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Follow-up MoU Try Out B2B SMAN 8 Jakarta"
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Deskripsi & Target Output
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Uraikan deliverable spesifik dan target metrik..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Divisi (9 Departemen) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden"
                >
                  {PTN_DIVISIONS.map((div) => (
                    <option key={div.id} value={div.id}>
                      {div.name} (PJ: {div.head})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  PIC Tim Inti <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden"
                >
                  {CORE_TEAM_MEMBERS.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} — {member.jobTitles.join(', ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Kategori Tugas
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden"
                >
                  <option value="B2B">B2B</option>
                  <option value="Affiliate">Affiliate</option>
                  <option value="Media Partnership">Media Partnership</option>
                  <option value="SEO">SEO</option>
                  <option value="TikTok Live">TikTok Live</option>
                  <option value="Operasional">Operasional</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Prioritas
                </label>
                <select
                  value={priorityLabel}
                  onChange={(e) => setPriorityLabel(e.target.value as PriorityIndonesia)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden"
                >
                  <option value="Tinggi">Tinggi</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Rendah">Rendah</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Bobot KPI (1-10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={kpiWeight}
                  onChange={(e) => setKpiWeight(parseInt(e.target.value) || 8)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Tenggat Waktu (Deadline)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAssignModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan & Delegasikan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
