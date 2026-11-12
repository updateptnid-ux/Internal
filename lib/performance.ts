import type { CalendarTask, KpiJobdesk, Profile } from '@/types/database';

/** Periode bulan berjalan dalam format YYYY-MM (sesuai kolom period_month). */
export function currentPeriod(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function isInMonth(iso: string, ref: Date = new Date()): boolean {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

/** Belum selesai dan tenggat sudah lewat. */
export function isOverdue(task: CalendarTask, now: Date = new Date()): boolean {
  return task.status !== 'COMPLETED' && new Date(task.due_date).getTime() < now.getTime();
}

/** Selesai, tetapi melewati tenggat. */
export function isCompletedLate(task: CalendarTask): boolean {
  return (
    task.status === 'COMPLETED' &&
    !!task.completed_at &&
    new Date(task.completed_at).getTime() > new Date(task.due_date).getTime()
  );
}

/** Persentase berbobot dari jobdesk yang selesai. null bila belum ada jobdesk. */
export function calculateKpiProgress(jobdesks: KpiJobdesk[]): number | null {
  if (jobdesks.length === 0) return null;
  const total = jobdesks.reduce((acc, j) => acc + j.weight, 0);
  if (total === 0) return null;
  const done = jobdesks.filter((j) => j.is_completed).reduce((acc, j) => acc + j.weight, 0);
  return Math.round((done / total) * 100);
}

export interface OwnerPerformance {
  profile: Profile;
  totalTasks: number;
  completedTasks: number;
  completedOnTime: number;
  completedLate: number;
  overdueTasks: number;
  openTasks: number;
  /** % tugas selesai tepat waktu dari seluruh tugas yang sudah jatuh tempo / selesai. null bila belum ada dasar hitung. */
  onTimeRate: number | null;
  kpiProgress: number | null;
  jobdeskDone: number;
  jobdeskTotal: number;
  summary: string;
  status: 'empty' | 'good' | 'watch' | 'risk';
}

/**
 * Hitung performa bulanan satu orang. Seluruh angka berasal dari data:
 * - Basis on-time = tugas selesai + tugas overdue (tugas yang sudah "dinilai").
 * - on-time = selesai sebelum/tepat tenggat.
 */
export function computeOwnerPerformance(
  profile: Profile,
  tasks: CalendarTask[],
  jobdesks: KpiJobdesk[],
  now: Date = new Date()
): OwnerPerformance {
  const period = currentPeriod(now);
  const myTasks = tasks.filter((t) => t.assignee_id === profile.id && isInMonth(t.due_date, now));
  const myJobdesks = jobdesks.filter((j) => j.owner_id === profile.id && j.period_month === period);

  const completed = myTasks.filter((t) => t.status === 'COMPLETED');
  const completedLate = completed.filter(isCompletedLate).length;
  const completedOnTime = completed.length - completedLate;
  const overdue = myTasks.filter((t) => isOverdue(t, now)).length;
  const open = myTasks.length - completed.length;

  const evaluated = completed.length + overdue;
  const onTimeRate = evaluated > 0 ? Math.round((completedOnTime / evaluated) * 100) : null;
  const kpiProgress = calculateKpiProgress(myJobdesks);
  const jobdeskDone = myJobdesks.filter((j) => j.is_completed).length;

  let status: OwnerPerformance['status'] = 'empty';
  if (myTasks.length > 0 || myJobdesks.length > 0) {
    if (overdue > 0 && (onTimeRate ?? 100) < 60) status = 'risk';
    else if (overdue > 0 || completedLate > 0 || (onTimeRate !== null && onTimeRate < 80)) status = 'watch';
    else status = 'good';
  }

  return {
    profile,
    totalTasks: myTasks.length,
    completedTasks: completed.length,
    completedOnTime,
    completedLate,
    overdueTasks: overdue,
    openTasks: open,
    onTimeRate,
    kpiProgress,
    jobdeskDone,
    jobdeskTotal: myJobdesks.length,
    summary: buildSummary({
      total: myTasks.length,
      completed: completed.length,
      completedLate,
      overdue,
      open,
      onTimeRate,
      kpiProgress,
      jobdeskTotal: myJobdesks.length,
    }),
    status,
  };
}

function buildSummary(m: {
  total: number;
  completed: number;
  completedLate: number;
  overdue: number;
  open: number;
  onTimeRate: number | null;
  kpiProgress: number | null;
  jobdeskTotal: number;
}): string {
  if (m.total === 0 && m.jobdeskTotal === 0) {
    return 'Belum ada tugas atau jobdesk tercatat bulan ini.';
  }

  const parts: string[] = [];

  if (m.total === 0) {
    parts.push('Belum ada tugas kalender bulan ini.');
  } else {
    parts.push(`${m.completed} dari ${m.total} tugas selesai.`);
    if (m.onTimeRate !== null) parts.push(`Ketepatan waktu ${m.onTimeRate}%.`);
    if (m.overdue > 0) parts.push(`${m.overdue} tugas melewati tenggat dan perlu ditindaklanjuti.`);
    if (m.completedLate > 0) parts.push(`${m.completedLate} tugas selesai terlambat.`);
    if (m.overdue === 0 && m.completedLate === 0 && m.completed > 0) {
      parts.push('Semua tugas yang selesai tuntas sesuai tenggat.');
    }
    if (m.open > m.overdue) parts.push(`${m.open - m.overdue} tugas masih berjalan.`);
  }

  if (m.kpiProgress !== null) {
    parts.push(`Progres KPI jobdesk ${m.kpiProgress}%.`);
  } else {
    parts.push('Jobdesk KPI belum diisi.');
  }

  return parts.join(' ');
}

/** Link WhatsApp siap kirim. Mengembalikan null jika nomor tidak tersedia. */
export function createWhatsAppUrl(phone: string | null | undefined, message: string): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

export function firstName(name: string): string {
  return name.split(/\s+/)[0] || name;
}

