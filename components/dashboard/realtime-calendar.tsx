'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  X,
} from 'lucide-react';
import type { CalendarTask, Profile, TaskPriority } from '@/types/database';
import { createCalendarTask, deleteCalendarTask, sendTaskPing, updateCalendarTaskStatus } from '@/actions/tasks';
import { firstName, isOverdue } from '@/lib/performance';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from './empty-state';
import type { Notify } from './dashboard-shell';

interface Props {
  profiles: Profile[];
  tasks: CalendarTask[];
  loading: boolean;
  currentUserId: string;
  onUpsert: (t: CalendarTask) => void;
  onRemove: (id: string) => void;
  notify: Notify;
}

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const PRIORITY_LABEL: Record<TaskPriority, string> = { HIGH: 'Tinggi', MEDIUM: 'Sedang', LOW: 'Rendah' };

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

export function RealtimeCalendar({ profiles, tasks, loading, currentUserId, onUpsert, onRemove, notify }: Props) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);
  const [view, setView] = useState<'month' | 'agenda'>('month');
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const profileById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    for (const t of tasks) {
      const key = toDateInput(new Date(t.start_time));
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
    map.forEach((list) => list.sort((a, b) => a.start_time.localeCompare(b.start_time)));
    return map;
  }, [tasks]);

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const selectedTasks = tasksByDay.get(toDateInput(selected)) ?? [];

  const agendaTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== 'COMPLETED')
        .sort((a, b) => a.due_date.localeCompare(b.due_date)),
    [tasks]
  );

  async function toggleStatus(task: CalendarTask) {
    setBusyId(task.id);
    const next = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    const res = await updateCalendarTaskStatus(task.id, next);
    setBusyId(null);
    if (res.success) onUpsert(res.data);
    else notify(res.error, { tone: 'error' });
  }

  async function ping(task: CalendarTask) {
    setBusyId(task.id);
    const res = await sendTaskPing(task.id);
    setBusyId(null);
    if (!res.success) return notify(res.error, { tone: 'error' });
    onUpsert(res.data.task);
    const name = profileById.get(task.assignee_id ?? '')?.full_name ?? 'penanggung jawab';
    notify(`Pengingat terkirim ke ${firstName(name)}.`, {
      action: res.data.whatsappUrl ? { label: 'Kirim via WhatsApp', href: res.data.whatsappUrl } : undefined,
    });
  }

  async function remove(task: CalendarTask) {
    if (!confirm(`Hapus agenda "${task.title}"?`)) return;
    setBusyId(task.id);
    const res = await deleteCalendarTask(task.id);
    setBusyId(null);
    if (res.success) onRemove(task.id);
    else notify(res.error, { tone: 'error' });
  }

  const rowProps = { profileById, currentUserId, busyId, onToggle: toggleStatus, onPing: ping, onDelete: remove };

  if (loading) return <CalendarSkeleton />;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="rounded-md border border-[#E5E5E5] bg-white p-1.5 text-[#737373] hover:text-[#171717]"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="rounded-md border border-[#E5E5E5] bg-white p-1.5 text-[#737373] hover:text-[#171717]"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <h2 className="ml-1 text-base font-semibold capitalize tracking-tight text-[#171717]">
            {cursor.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => {
              setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
              setSelected(today);
            }}
            className="ml-1 rounded-md px-2 py-1 text-xs text-[#737373] hover:bg-white hover:text-[#171717]"
          >
            Hari ini
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-[#E5E5E5] bg-white p-0.5">
            {(['month', 'agenda'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded px-3 py-1 text-xs transition-colors ${
                  view === v ? 'bg-[#171717] text-white' : 'text-[#737373] hover:text-[#171717]'
                }`}
              >
                {v === 'month' ? 'Bulan' : 'Agenda'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-[#171717] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#262626]"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Tambah agenda
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'month' ? (
          <motion.div
            key="month"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]"
          >
            {/* Grid bulan */}
            <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white">
              <div className="grid grid-cols-7 border-b border-[#F0F0F0]">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="py-2 text-center text-[11px] font-medium text-[#A3A3A3]">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((d, i) => {
                  const inMonth = d.getMonth() === cursor.getMonth();
                  const dayTasks = tasksByDay.get(toDateInput(d)) ?? [];
                  const isSel = sameDay(d, selected);
                  const isToday = sameDay(d, today);
                  return (
                    <button
                      key={i}
                      onClick={() => setSelected(d)}
                      className={`min-h-[64px] border-b border-r border-[#F5F5F5] p-1.5 text-left align-top transition-colors sm:min-h-[92px] ${
                        isSel ? 'bg-[#FAFAFA]' : 'hover:bg-[#FCFCFC]'
                      } ${i % 7 === 6 ? 'border-r-0' : ''}`}
                    >
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                          isToday
                            ? 'bg-[#171717] font-medium text-white'
                            : inMonth
                              ? 'text-[#171717]'
                              : 'text-[#D4D4D4]'
                        } ${isSel && !isToday ? 'ring-1 ring-[#171717]' : ''}`}
                      >
                        {d.getDate()}
                      </span>
                      <div className="mt-1 hidden space-y-0.5 sm:block">
                        {dayTasks.slice(0, 2).map((t) => (
                          <div
                            key={t.id}
                            className={`truncate rounded px-1 py-0.5 text-[10px] ${
                              t.status === 'COMPLETED'
                                ? 'text-[#A3A3A3] line-through'
                                : isOverdue(t)
                                  ? 'bg-[#FEF3C7]/60 text-[#92400E]'
                                  : 'bg-[#F5F5F5] text-[#404040]'
                            }`}
                          >
                            {t.title}
                          </div>
                        ))}
                        {dayTasks.length > 2 && (
                          <div className="px-1 text-[10px] text-[#A3A3A3]">+{dayTasks.length - 2} lainnya</div>
                        )}
                      </div>
                      {dayTasks.length > 0 && (
                        <div className="mt-1 flex gap-0.5 sm:hidden">
                          {dayTasks.slice(0, 3).map((t) => (
                            <span key={t.id} className="h-1 w-1 rounded-full bg-[#171717]" />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Panel hari terpilih */}
            <div className="rounded-xl border border-[#E5E5E5] bg-white">
              <div className="border-b border-[#F0F0F0] px-4 py-3">
                <p className="text-sm font-medium capitalize text-[#171717]">
                  {selected.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <p className="text-xs text-[#737373]">{selectedTasks.length} agenda</p>
              </div>
              {selectedTasks.length === 0 ? (
                <EmptyState
                  compact
                  icon={CalendarDays}
                  title={sameDay(selected, today) ? 'Belum ada agenda kerja hari ini' : 'Tidak ada agenda di tanggal ini'}
                  description="Tambahkan agenda dan tentukan penanggung jawabnya."
                  actionLabel="Tambah agenda"
                  onAction={() => setFormOpen(true)}
                />
              ) : (
                <ul className="divide-y divide-[#F5F5F5]">
                  <AnimatePresence initial={false}>
                    {selectedTasks.map((t) => (
                      <TaskRow key={t.id} task={t} {...rowProps} />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="agenda"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-[#E5E5E5] bg-white"
          >
            <div className="border-b border-[#F0F0F0] px-4 py-3">
              <p className="text-sm font-medium text-[#171717]">Semua agenda yang belum selesai</p>
              <p className="text-xs text-[#737373]">Diurutkan berdasarkan tenggat terdekat.</p>
            </div>
            {agendaTasks.length === 0 ? (
              <EmptyState
                icon={Check}
                title="Semua agenda sudah selesai"
                description="Belum ada tugas terbuka. Tambahkan agenda baru kapan saja."
                actionLabel="Tambah agenda"
                onAction={() => setFormOpen(true)}
              />
            ) : (
              <ul className="divide-y divide-[#F5F5F5]">
                <AnimatePresence initial={false}>
                  {agendaTasks.map((t) => (
                    <TaskRow key={t.id} task={t} showDate {...rowProps} />
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {formOpen && (
          <TaskForm
            profiles={profiles}
            currentUserId={currentUserId}
            defaultDate={selected}
            onClose={() => setFormOpen(false)}
            onCreated={(t) => {
              onUpsert(t);
              setSelected(new Date(t.start_time));
              setFormOpen(false);
              notify('Agenda tersimpan.');
            }}
            notify={notify}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TaskRow({
  task,
  showDate,
  profileById,
  currentUserId,
  busyId,
  onToggle,
  onPing,
  onDelete,
}: {
  task: CalendarTask;
  showDate?: boolean;
  profileById: Map<string, Profile>;
  currentUserId: string;
  busyId: string | null;
  onToggle: (t: CalendarTask) => void;
  onPing: (t: CalendarTask) => void;
  onDelete: (t: CalendarTask) => void;
}) {
  const done = task.status === 'COMPLETED';
  const overdue = isOverdue(task);
  const assignee = task.assignee_id ? profileById.get(task.assignee_id) : undefined;
  const canPing = !done && !!task.assignee_id && task.assignee_id !== currentUserId;
  const busy = busyId === task.id;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="group flex items-start gap-3 px-4 py-3"
    >
      <button
        onClick={() => onToggle(task)}
        disabled={busy}
        aria-label={done ? 'Tandai belum selesai' : 'Tandai selesai'}
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
          done ? 'border-[#171717] bg-[#171717]' : 'border-[#D4D4D4] hover:border-[#171717]'
        }`}
      >
        {done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={`text-sm ${done ? 'text-[#A3A3A3] line-through' : 'text-[#171717]'}`}>{task.title}</p>
        {task.description && <p className="mt-0.5 line-clamp-2 text-xs text-[#737373]">{task.description}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#A3A3A3]">
          <span>
            {showDate &&
              new Date(task.start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' · '}
            {fmtTime(task.start_time)}
          </span>
          <span>·</span>
          <span>{assignee ? firstName(assignee.full_name) : 'Belum ditugaskan'}</span>
          <span>·</span>
          <span>{PRIORITY_LABEL[task.priority]}</span>
          {overdue && <span className="text-[#B45309]">· Lewat tenggat</span>}
          {task.ping_count > 0 && (
            <span className="flex items-center gap-0.5">
              · <Bell className="h-2.5 w-2.5" /> {task.ping_count}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#A3A3A3]" />}
        {canPing && !busy && (
          <button
            onClick={() => onPing(task)}
            title={`Ingatkan ${assignee ? firstName(assignee.full_name) : ''}`}
            className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] transition-colors hover:bg-[#F5F5F5] ${
              overdue ? 'text-[#171717]' : 'text-[#737373]'
            }`}
          >
            <Bell className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">Ingatkan</span>
          </button>
        )}
        {!busy && (
          <button
            onClick={() => onDelete(task)}
            aria-label="Hapus agenda"
            className="rounded-md p-1 text-[#D4D4D4] opacity-100 transition hover:text-[#171717] sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </motion.li>
  );
}

function TaskForm({
  profiles,
  currentUserId,
  defaultDate,
  onClose,
  onCreated,
  notify,
}: {
  profiles: Profile[];
  currentUserId: string;
  defaultDate: Date;
  onClose: () => void;
  onCreated: (t: CalendarTask) => void;
  notify: Notify;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState(
    profiles.some((p) => p.id === currentUserId) ? currentUserId : profiles[0]?.id ?? ''
  );
  const [date, setDate] = useState(toDateInput(defaultDate));
  const [startTime, setStartTime] = useState('09:00');
  const [dueDate, setDueDate] = useState(toDateInput(defaultDate));
  const [dueTime, setDueTime] = useState('17:00');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const start = new Date(`${date}T${startTime}`);
    const due = new Date(`${dueDate}T${dueTime}`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(due.getTime())) return setError('Tanggal tidak valid.');
    if (due < start) return setError('Tenggat tidak boleh lebih awal dari waktu mulai.');

    setSaving(true);
    const res = await createCalendarTask({
      title,
      description,
      assigneeId: assigneeId || null,
      startTime: start.toISOString(),
      dueDate: due.toISOString(),
      priority,
    });
    setSaving(false);
    if (res.success) onCreated(res.data);
    else {
      setError(res.error);
      notify(res.error, { tone: 'error' });
    }
  }

  const input =
    'w-full rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#171717] outline-none transition-colors focus:border-[#171717]';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-t-xl border border-[#E5E5E5] bg-white p-5 sm:rounded-xl"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#171717]">Agenda baru</p>
          <button type="button" onClick={onClose} className="text-[#A3A3A3] hover:text-[#171717]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <p className="rounded-md bg-[#FEF2F2] px-3 py-2 text-xs text-[#991B1B]">{error}</p>}

        <input
          autoFocus
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Judul agenda"
          className={input}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Catatan (opsional)"
          rows={2}
          className={`${input} resize-none`}
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 space-y-1 sm:col-span-1">
            <span className="text-[11px] text-[#737373]">Penanggung jawab</span>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={input}>
              <option value="">Belum ditugaskan</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                  {p.id === currentUserId ? ' (saya)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="col-span-2 space-y-1 sm:col-span-1">
            <span className="text-[11px] text-[#737373]">Prioritas</span>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className={input}>
              <option value="HIGH">Tinggi</option>
              <option value="MEDIUM">Sedang</option>
              <option value="LOW">Rendah</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] text-[#737373]">Mulai</span>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={input} />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] text-transparent">Jam</span>
            <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className={input} />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] text-[#737373]">Tenggat</span>
            <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={input} />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] text-transparent">Jam</span>
            <input type="time" required value={dueTime} onChange={(e) => setDueTime(e.target.value)} className={input} />
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-3 py-2 text-xs text-[#737373] hover:text-[#171717]">
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-md bg-[#171717] px-4 py-2 text-xs font-medium text-white hover:bg-[#262626] disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Simpan
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-3">
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-14 sm:h-20" />
            ))}
          </div>
        </div>
        <div className="space-y-3 rounded-xl border border-[#E5E5E5] bg-white p-4">
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-4 w-4 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-4/5" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

