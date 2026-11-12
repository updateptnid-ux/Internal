'use client';

import React from 'react';
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
import { BarChart3, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import type { CalendarTask, KpiJobdesk, Profile } from '@/types/database';
import { computeOwnerPerformance, firstName } from '@/lib/performance';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from './empty-state';

export interface AnalyticsChartsProps {
  profiles: Profile[];
  tasks: CalendarTask[];
  jobdesks: KpiJobdesk[];
  loading?: boolean;
  onGoToCalendar?: () => void;
}

export function AnalyticsCharts({
  profiles,
  tasks,
  jobdesks,
  loading = false,
  onGoToCalendar,
}: AnalyticsChartsProps) {
  if (loading) {
    return <AnalyticsChartsSkeleton />;
  }

  const now = new Date();
  const ownerPerformances = profiles.map((p) => computeOwnerPerformance(p, tasks, jobdesks, now));

  // 1. Data Tugas per Owner (Selesai vs Berjalan vs Terlambat)
  const taskChartData = ownerPerformances.map((perf) => ({
    name: firstName(perf.profile.full_name),
    fullName: perf.profile.full_name,
    Selesai: perf.completedTasks,
    Berjalan: perf.openTasks - perf.overdueTasks > 0 ? perf.openTasks - perf.overdueTasks : 0,
    Terlambat: perf.overdueTasks,
    total: perf.totalTasks,
  }));

  // 2. Data KPI Jobdesk (%) per Owner
  const kpiChartData = ownerPerformances.map((perf) => ({
    name: firstName(perf.profile.full_name),
    fullName: perf.profile.full_name,
    kpi: perf.kpiProgress ?? 0,
    jobdesks: perf.jobdeskTotal,
  }));

  const hasAnyTasks = tasks.length > 0;
  const hasAnyJobdesks = jobdesks.length > 0;

  if (!hasAnyTasks && !hasAnyJobdesks) {
    return (
      <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-xs">
        <EmptyState
          icon={BarChart3}
          title="Belum ada data analitik"
          description="Grafik pencapaian target dan ketepatan waktu akan terbentuk otomatis setelah ada tugas atau jobdesk aktif di sistem."
          actionLabel="Buat agenda baru"
          onAction={onGoToCalendar}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Status Penyelesaian Tugas per Owner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[#FAFAFA] border border-[#E5E5E5]">
                  <BarChart3 className="w-4 h-4 text-[#171717]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#171717]">Status Tugas per Anggota</h3>
                  <p className="text-xs text-[#737373]">Perbandingan tugas selesai, aktif, dan terlambat</p>
                </div>
              </div>
            </div>

            <div className="h-64 mt-4 w-full">
              {!hasAnyTasks ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs text-[#737373]">Belum ada tugas tercatat bulan ini.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taskChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#737373', fontSize: 11 }}
                      axisLine={{ stroke: '#E5E5E5' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#737373', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: '#FAFAFA' }}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E5E5',
                        borderRadius: '8px',
                        fontSize: '11px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      }}
                      formatter={(val: number) => [`${val} tugas`, '']}
                      labelFormatter={(label) => `Owner: ${label}`}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      iconSize={6}
                      wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                    />
                    <Bar dataKey="Selesai" fill="#171717" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Berjalan" fill="#A3A3A3" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Terlambat" fill="#B45309" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0F0F0] flex items-center justify-between text-[11px] text-[#737373]">
            <span>Metrik murni Supabase</span>
            <span className="font-medium text-[#171717]">Total {tasks.length} Tugas Terdaftar</span>
          </div>
        </motion.div>

        {/* Chart 2: Capaian Bobot KPI Jobdesk per Owner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[#FAFAFA] border border-[#E5E5E5]">
                  <TrendingUp className="w-4 h-4 text-[#171717]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#171717]">Pencapaian KPI Jobdesk (%)</h3>
                  <p className="text-xs text-[#737373]">Dihitung dari bobot jobdesk selesai bulan berjalan</p>
                </div>
              </div>
            </div>

            <div className="h-64 mt-4 w-full">
              {!hasAnyJobdesks ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs text-[#737373]">Belum ada jobdesk tercatat bulan ini.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kpiChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#737373', fontSize: 11 }}
                      axisLine={{ stroke: '#E5E5E5' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: '#737373', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip
                      cursor={{ fill: '#FAFAFA' }}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E5E5',
                        borderRadius: '8px',
                        fontSize: '11px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      }}
                      formatter={(val: number) => [`${val}% KPI`, 'Capaian']}
                      labelFormatter={(label) => `Owner: ${label}`}
                    />
                    <Bar dataKey="kpi" name="Capaian KPI" fill="#171717" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0F0F0] flex items-center justify-between text-[11px] text-[#737373]">
            <span>Target bulanan: 100%</span>
            <span className="font-medium text-[#171717]">Total {jobdesks.length} Jobdesk Terdaftar</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function AnalyticsChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-[#E5E5E5] bg-white p-5 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-[#F0F0F0]">
            <Skeleton className="w-8 h-8 rounded-md" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
          <Skeleton className="h-60 w-full rounded-md" />
          <div className="pt-3 border-t border-[#F0F0F0] flex justify-between">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
