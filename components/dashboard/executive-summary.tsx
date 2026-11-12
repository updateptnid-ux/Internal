'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CalendarClock, CheckCircle2, ListTodo, Timer, Users } from 'lucide-react';
import type { CalendarTask, KpiJobdesk, Profile } from '@/types/database';
import { computeOwnerPerformance, isInMonth, isOverdue, isCompletedLate, initials } from '@/lib/performance';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from './empty-state';

interface Props {
  profiles: Profile[];
  tasks: CalendarTask[];
  jobdesks: KpiJobdesk[];
  loading: boolean;
  onGoToCalendar: () => void;
  onInvite: () => void;
}

const STATUS_LABEL = {
  empty: 'Belum ada aktivitas',
  good: 'On track',
  watch: 'Perlu dipantau',
  risk: 'Perlu tindakan',
} as const;

const STATUS_DOT = {
  empty: 'bg-[#D4D4D4]',
  good: 'bg-[#171717]',
  watch: 'bg-[#A3A3A3]',
  risk: 'bg-[#B45309]',
} as const;

export function ExecutiveSummary({ profiles, tasks, jobdesks, loading, onGoToCalendar, onInvite }: Props) {
  const now = useMemo(() => new Date(), [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const monthTasks = useMemo(() => tasks.filter((t) => isInMonth(t.due_date, now)), [tasks, now]);
  const totals = useMemo(() => {
    const completed = monthTasks.filter((t) => t.status === 'COMPLETED');
    const late = completed.filter(isCompletedLate).length;
    const overdue = monthTasks.filter((t) => isOverdue(t, now)).length;
    const evaluated = completed.length + overdue;
    return {
      total: monthTasks.length,
      completed: completed.length,
      overdue,
      onTimeRate: evaluated > 0 ? Math.round(((completed.length - late) / evaluated) * 100) : null,
    };
  }, [monthTasks, now]);

  const performances = useMemo(
    () => profiles.map((p) => computeOwnerPerformance(p, tasks, jobdesks, now)),
    [profiles, tasks, jobdesks, now]
  );

  const overdueList = useMemo(
    () =>
      tasks
        .filter((t) => isOverdue(t, now))
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        .slice(0, 6),
    [tasks, now]
  );

  const profileName = (id: string | null) => profiles.find((p) => p.id === id)?.full_name ?? 'Belum ditugaskan';
  const monthLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  if (loading) return <SummarySkeleton />;

  if (profiles.length === 0) {
    return (
      <div className="rounded-xl border border-[#E5E5E5] bg-white">
        <EmptyState
          icon={Users}
          title="Belum ada anggota tim"
          description="Undang Owner dan anggota tim untuk mulai mencatat agenda dan KPI."
          actionLabel="Undang anggota"
          onAction={onInvite}
        />
      </div>
    );
  }

  const metrics = [
    { label: 'Tugas bulan ini', value: String(totals.total), icon: ListTodo },
    { label: 'Selesai', value: String(totals.completed), icon: CheckCircle2 },
    { label: 'Melewati tenggat', value: String(totals.overdue), icon: AlertCircle },
    {
      label: 'Tepat waktu',
      value: totals.onTimeRate === null ? '—' : `${totals.onTimeRate}%`,
      hint: totals.onTimeRate === null ? 'Belum ada tugas jatuh tempo' : undefined,
      icon: Timer,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-[#171717]">Rekap Performa Bulanan</h2>
        <p className="text-xs text-[#737373]">
          {monthLabel} · dihitung langsung dari status dan tenggat tugas di database.
        </p>
      </div>

      {/* Metrik utama */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className="rounded-xl border border-[#E5E5E5] bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#737373]">{m.label}</span>
              <m.icon className="h-4 w-4 text-[#A3A3A3]" strokeWidth={1.5} />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[#171717]">{m.value}</p>
            {m.hint && <p className="mt-0.5 text-[11px] text-[#A3A3A3]">{m.hint}</p>}
          </motion.div>
        ))}
      </div>

      {totals.total === 0 && (
        <div className="rounded-xl border border-dashed border-[#E5E5E5] bg-white">
          <EmptyState
            compact
            icon={CalendarClock}
            title="Belum ada agenda kerja bulan ini"
            description="Rekap akan terisi otomatis begitu tugas pertama dibuat di kalender."
            actionLabel="Buat agenda"
            onAction={onGoToCalendar}
          />
        </div>
      )}

      {/* Kartu per orang */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {performances.map((perf, i) => (
          <motion.div
            key={perf.profile.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 + i * 0.03 }}
            className="flex flex-col rounded-xl border border-[#E5E5E5] bg-white p-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] text-xs font-medium text-[#171717]">
                {initials(perf.profile.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#171717]">{perf.profile.full_name}</p>
                <p className="truncate text-xs text-[#737373]">
                  {perf.profile.title || (perf.profile.role === 'OWNER' ? 'Owner' : 'Tim')}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-[#737373]">
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[perf.status]}`} />
                {STATUS_LABEL[perf.status]}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 border-y border-[#F0F0F0] py-3 text-center">
              <Stat label="Selesai" value={`${perf.completedTasks}/${perf.totalTasks}`} />
              <Stat label="Tepat waktu" value={perf.onTimeRate === null ? '—' : `${perf.onTimeRate}%`} />
              <Stat label="Terlambat" value={String(perf.overdueTasks + perf.completedLate)} />
            </div>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="text-[#737373]">KPI jobdesk</span>
                <span className="font-medium text-[#171717]">
                  {perf.kpiProgress === null ? '—' : `${perf.kpiProgress}%`}
                  <span className="ml-1 font-normal text-[#A3A3A3]">
                    ({perf.jobdeskDone}/{perf.jobdeskTotal})
                  </span>
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-[#F0F0F0]">
                <motion.div
                  className="h-full rounded-full bg-[#171717]"
                  initial={{ width: 0 }}
                  animate={{ width: `${perf.kpiProgress ?? 0}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-[#737373]">{perf.summary}</p>
          </motion.div>
        ))}
      </div>

      {/* Tugas melewati tenggat */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white">
        <div className="border-b border-[#F0F0F0] px-5 py-3.5">
          <p className="text-sm font-medium text-[#171717]">Perlu perhatian</p>
          <p className="text-xs text-[#737373]">Tugas yang belum selesai dan sudah lewat tenggat.</p>
        </div>
        {overdueList.length === 0 ? (
          <EmptyState compact icon={CheckCircle2} title="Tidak ada tugas yang terlambat" />
        ) : (
          <ul className="divide-y divide-[#F0F0F0]">
            {overdueList.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-[#171717]">{t.title}</p>
                  <p className="text-xs text-[#737373]">{profileName(t.assignee_id)}</p>
                </div>
                <span className="shrink-0 text-xs text-[#B45309]">
                  Tenggat {new Date(t.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#171717]">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-[#A3A3A3]">{label}</p>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-[#E5E5E5] bg-white p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-14" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4 rounded-xl border border-[#E5E5E5] bg-white p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-1 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

