'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CORE_TEAM_MEMBERS,
  calculateWeightedEvaluation,
  CoreTeamMember,
} from '@/lib/operational-data';
import {
  Award,
  Target,
  Users,
  ShieldCheck,
  Sliders,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

function EvaluationTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const total = payload.reduce((acc: number, curr: any) => acc + Number(curr.value || 0), 0);
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-800 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[180px]">
        <p className="font-bold text-slate-100 border-b border-slate-800 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}:
            </span>
            <span className="font-bold text-white">{entry.value} pts</span>
          </div>
        ))}
        <div className="pt-1 border-t border-slate-800 flex items-center justify-between font-bold text-emerald-400">
          <span>Total Skor Akhir:</span>
          <span>{total.toFixed(1)} / 100</span>
        </div>
      </div>
    );
  }
  return null;
}

export function PerformanceEvaluation() {
  const [teamScores, setTeamScores] = useState<CoreTeamMember[]>(CORE_TEAM_MEMBERS);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(CORE_TEAM_MEMBERS[0].id);

  const selectedMember =
    teamScores.find((m) => m.id === selectedMemberId) || teamScores[0];

  const handleScoreChange = (
    field: 'kpiScore' | 'collaborationScore' | 'professionalismScore',
    value: number
  ) => {
    setTeamScores((prev) =>
      prev.map((m) =>
        m.id === selectedMemberId
          ? { ...m, [field]: Math.min(100, Math.max(0, value)) }
          : m
      )
    );
  };

  // Data untuk Recharts Stacked Bar berdasarkan kontribusi bobot (60%, 25%, 15%)
  const chartData = teamScores.map((m) => {
    const kpiWeighted = Number((m.kpiScore * 0.6).toFixed(1));
    const collabWeighted = Number((m.collaborationScore * 0.25).toFixed(1));
    const profWeighted = Number((m.professionalismScore * 0.15).toFixed(1));
    return {
      name: m.name,
      kpiContribution: kpiWeighted,
      collabContribution: collabWeighted,
      profContribution: profWeighted,
      total: Number((kpiWeighted + collabWeighted + profWeighted).toFixed(1)),
    };
  });

  const getGradeInfo = (score: number) => {
    if (score >= 90) return { grade: 'A+ (Sangat Memuaskan)', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (score >= 85) return { grade: 'A (Optimal)', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    if (score >= 75) return { grade: 'B+ (Baik)', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { grade: 'B (Perlu Pembinaan)', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 font-sans"
    >
      {/* 1. HEADER EVALUASI KINERJA */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
              <Sparkles className="w-3 h-3" />
              Standar Penilaian SDM PTN
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">
              Pencapaian KPI (60%) + Kolaborasi (25%) + Profesionalisme (15%)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Evaluasi Kinerja Tim Inti
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Visualisasi skor kinerja tertimbang untuk ke-5 anggota tim inti multi-jabatan (Arya, Zidan, Abdur, Zaki, Rendi).
          </p>
        </div>
      </motion.div>

      {/* 2. 3 KARTU KOMPONEN BOBOT PENILAIAN (60% / 25% / 15%) */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card className="border border-slate-200/70 bg-white shadow-xs rounded-2xl p-5">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-900">1. Pencapaian KPI Divisi</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Bobot 60%
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Diukur dari realisasi Target vs Aktual pada seluruh divisi yang diampu (Try Out, Bimbel, Marketing, IT, Keuangan, Cek Skor, Admin, SDM).
          </p>
        </Card>

        <Card className="border border-slate-200/70 bg-white shadow-xs rounded-2xl p-5">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-900">2. Kolaborasi Lintas Tim</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Bobot 25%
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Responsivitas komunikasi lintas PJ, dukungan saat pelaksanaan Try Out serentak, dan kelancaran serah-terima tugas.
          </p>
        </Card>

        <Card className="border border-slate-200/70 bg-white shadow-xs rounded-2xl p-5">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-900">3. Profesionalisme & Disiplin</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
              Bobot 15%
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Ketepatan waktu penyelesaian sprint (zero overdue), kelengkapan bukti kerja (proof of work), dan kepatuhan SOP.
          </p>
        </Card>
      </motion.div>

      {/* 3. BENTO GRID: RECHARTS VISUALISASI BOBOT (7 COL) + SIMULATOR PENILAIAN INTERAKTIF (5 COL) */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5"
      >
        {/* RECHARTS STACKED BAR CHART */}
        <Card className="lg:col-span-7 border border-slate-200/70 bg-white shadow-xs rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <Award className="w-4 h-4" />
                  </div>
                  Komposisi Skor Akhir Tertimbang (60% KPI + 25% Kolaborasi + 15% Profesionalisme)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Perbandingan kontribusi poin tertimbang dari ke-5 anggota tim inti
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={12}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<EvaluationTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '16px' }}
                  />
                  <Bar
                    name="Pencapaian KPI (Maks 60)"
                    dataKey="kpiContribution"
                    stackId="a"
                    fill="#4f46e5"
                    radius={[0, 0, 4, 4]}
                    maxBarSize={42}
                  />
                  <Bar
                    name="Kolaborasi (Maks 25)"
                    dataKey="collabContribution"
                    stackId="a"
                    fill="#10b981"
                    maxBarSize={42}
                  />
                  <Bar
                    name="Profesionalisme (Maks 15)"
                    dataKey="profContribution"
                    stackId="a"
                    fill="#f59e0b"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={42}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* SIMULATOR & KALIBRASI SKOR KINERJA INTERAKTIF */}
        <Card className="lg:col-span-5 border border-slate-200/70 bg-white shadow-xs rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-100 text-slate-800">
                <Sliders className="w-4 h-4" />
              </div>
              Kalibrasi & Simulasi Penilaian Kinerja
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Pilih personel untuk menyesuaikan skor dan melihat perubahan grafik secara real-time
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Selector Anggota Tim */}
            <div className="flex flex-wrap gap-1.5">
              {teamScores.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMemberId(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedMemberId === m.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            {/* Detail Personel Terpilih */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{selectedMember.name}</span>
                <span className="text-lg font-extrabold text-indigo-600">
                  {calculateWeightedEvaluation(
                    selectedMember.kpiScore,
                    selectedMember.collaborationScore,
                    selectedMember.professionalismScore
                  )}{' '}
                  <span className="text-xs font-normal text-slate-400">/ 100</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Jabatan: <strong>{selectedMember.jobTitles.join(' • ')}</strong>
              </p>
            </div>

            {/* Slider 1: KPI (60%) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  1. Pencapaian KPI (Bobot 60%)
                </span>
                <span className="font-bold text-indigo-600">
                  {selectedMember.kpiScore} → {(selectedMember.kpiScore * 0.6).toFixed(1)} pts
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                value={selectedMember.kpiScore}
                onChange={(e) => handleScoreChange('kpiScore', Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Slider 2: Kolaborasi (25%) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  2. Kolaborasi Tim (Bobot 25%)
                </span>
                <span className="font-bold text-emerald-600">
                  {selectedMember.collaborationScore} →{' '}
                  {(selectedMember.collaborationScore * 0.25).toFixed(1)} pts
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                value={selectedMember.collaborationScore}
                onChange={(e) =>
                  handleScoreChange('collaborationScore', Number(e.target.value))
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Slider 3: Profesionalisme (15%) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  3. Profesionalisme (Bobot 15%)
                </span>
                <span className="font-bold text-amber-600">
                  {selectedMember.professionalismScore} →{' '}
                  {(selectedMember.professionalismScore * 0.15).toFixed(1)} pts
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                value={selectedMember.professionalismScore}
                onChange={(e) =>
                  handleScoreChange('professionalismScore', Number(e.target.value))
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 4. TABEL RAPOR LENGKAP 5 ANGGOTA TIM INTI */}
      <motion.div variants={itemVariants}>
        <Card className="border border-slate-200/70 bg-white shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">
              Matriks Evaluasi Kinerja 5 Anggota Tim Inti (Periode November 2026)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Perhitungan otomatis: (Skor KPI × 0.60) + (Skor Kolaborasi × 0.25) + (Skor Profesionalisme × 0.15)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-5">Personel & Multi-Jabatan</th>
                    <th className="py-3.5 px-4 text-center">KPI (60%)</th>
                    <th className="py-3.5 px-4 text-center">Kolaborasi (25%)</th>
                    <th className="py-3.5 px-4 text-center">Profesionalisme (15%)</th>
                    <th className="py-3.5 px-4 text-center">Skor Akhir</th>
                    <th className="py-3.5 px-5 text-right">Predikat Evaluasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamScores.map((m) => {
                    const finalScore = calculateWeightedEvaluation(
                      m.kpiScore,
                      m.collaborationScore,
                      m.professionalismScore
                    );
                    const gradeInfo = getGradeInfo(finalScore);

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl ${m.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0`}
                            >
                              {m.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {m.jobTitles.map((t) => (
                                  <span
                                    key={t}
                                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="font-bold text-slate-900">{m.kpiScore}</div>
                          <div className="text-[10px] text-indigo-600 font-semibold">
                            Kontribusi: {(m.kpiScore * 0.6).toFixed(1)}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="font-bold text-slate-900">{m.collaborationScore}</div>
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            Kontribusi: {(m.collaborationScore * 0.25).toFixed(1)}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="font-bold text-slate-900">{m.professionalismScore}</div>
                          <div className="text-[10px] text-amber-600 font-semibold">
                            Kontribusi: {(m.professionalismScore * 0.15).toFixed(1)}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-base font-extrabold text-slate-900">
                            {finalScore}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${gradeInfo.badge}`}
                          >
                            {gradeInfo.grade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

