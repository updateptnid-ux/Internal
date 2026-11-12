'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  CalendarDays,
  ClipboardList,
  LayoutGrid,
  LogOut,
  Menu,
  RotateCw,
  UserPlus,
  X,
  Sparkles,
} from 'lucide-react';
import type { CalendarTask, TaskPing } from '@/types/database';
import { logoutUser } from '@/actions/auth';
import { markPingsRead } from '@/actions/tasks';
import { useWorkspace } from '@/hooks/use-workspace';
import { firstName, initials } from '@/lib/performance';
import { ExecutiveSummary } from './executive-summary';
import { RealtimeCalendar } from './realtime-calendar';
import { KpiTracker } from './kpi-tracker';
import { AnalyticsCharts } from './analytics-charts';
import { InviteMemberModal } from './invite-member-modal';
import { TaskDetailModal } from '@/components/tasks/task-detail-modal';

export type Notify = (
  message: string,
  opts?: { tone?: 'default' | 'error'; action?: { label: string; href: string } }
) => void;

interface Toast {
  id: number;
  message: string;
  tone: 'default' | 'error';
  action?: { label: string; href: string };
}

type Tab = 'summary' | 'calendar' | 'kpi';

const TABS: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'summary', label: 'Ringkasan & Analitik', icon: LayoutGrid },
  { id: 'calendar', label: 'Kalender & Agenda', icon: CalendarDays },
  { id: 'kpi', label: 'KPI Jobdesk', icon: ClipboardList },
];

interface Props {
  currentUser: {
    id: string;
    fullName: string;
    email: string;
    role: 'OWNER' | 'TEAM';
    title?: string;
  };
}

export function DashboardShell({ currentUser }: Props) {
  const [tab, setTab] = useState<Tab>('summary');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const notify: Notify = useCallback((message, opts) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, tone: opts?.tone ?? 'default', action: opts?.action }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), opts?.action ? 8000 : 4000);
  }, []);

  // Dipanggil saat ada ping masuk lewat Supabase Realtime.
  const profilesRef = useRef<Map<string, string>>(new Map());
  const tasksRef = useRef<Map<string, string>>(new Map());
  const handlePing = useCallback(
    (ping: TaskPing) => {
      const sender = profilesRef.current.get(ping.sender_id) ?? 'Rekan tim';
      const task = tasksRef.current.get(ping.task_id);
      notify(`${firstName(sender)} mengingatkan: ${task ?? 'sebuah tugas'}`);
    },
    [notify]
  );

  const ws = useWorkspace(currentUser.id, handlePing);

  useEffect(() => {
    profilesRef.current = new Map(ws.profiles.map((p) => [p.id, p.full_name]));
  }, [ws.profiles]);
  useEffect(() => {
    tasksRef.current = new Map(ws.tasks.map((t) => [t.id, t.title]));
  }, [ws.tasks]);

  const unread = ws.pings.filter((p) => !p.is_read);
  const canInvite = currentUser.role === 'OWNER';

  async function openInbox() {
    setInboxOpen((v) => !v);
    if (unread.length > 0) {
      const ids = unread.map((p) => p.id);
      ws.local.markPingsRead(ids);
      const res = await markPingsRead(ids);
      if (!res.success) {
        notify(res.error, { tone: 'error' });
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#171717] font-sans antialiased">
      {/* Minimalist Header */}
      <header className="sticky top-0 z-40 border-b border-[#E5E5E5] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#171717] text-xs font-bold tracking-wider text-white shadow-xs">
                PTN
              </div>
              <div>
                <span className="text-sm font-semibold tracking-tight text-[#171717]">
                  Internal Update
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-medium bg-[#FAFAFA] text-[#737373] border border-[#E5E5E5] px-1.5 py-0.2 rounded">
                  100% Realtime
                </span>
              </div>
            </div>

            <nav className="hidden items-center gap-1 md:flex">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    tab === t.id
                      ? 'text-[#171717] bg-[#FAFAFA] border border-[#E5E5E5]'
                      : 'text-[#737373] hover:text-[#171717]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Realtime Status Indicator */}
            <span
              className="hidden items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] text-[#737373] border border-[#E5E5E5] bg-white sm:flex"
              title={ws.realtimeStatus === 'live' ? 'Tersambung Realtime' : 'Realtime Offline'}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  ws.realtimeStatus === 'live'
                    ? 'bg-emerald-500'
                    : ws.realtimeStatus === 'connecting'
                      ? 'animate-pulse bg-[#D4D4D4]'
                      : 'bg-amber-500'
                }`}
              />
              {ws.realtimeStatus === 'live'
                ? 'Realtime Aktif'
                : ws.realtimeStatus === 'connecting'
                  ? 'Menyambung...'
                  : 'Offline'}
            </span>

            {canInvite && (
              <button
                onClick={() => setInviteOpen(true)}
                className="hidden items-center gap-1.5 rounded-md border border-[#E5E5E5] bg-white px-3 py-1.5 text-xs font-medium text-[#171717] hover:bg-[#FAFAFA] sm:flex shadow-xs transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
                Undang Anggota
              </button>
            )}

            {/* Notification Bell / Inbox */}
            <div className="relative">
              <button
                onClick={openInbox}
                aria-label="Pengingat masuk"
                className="relative rounded-md p-2 text-[#737373] hover:bg-[#F5F5F5] hover:text-[#171717] transition-colors"
              >
                <Bell className="h-4 w-4" strokeWidth={1.5} />
                <AnimatePresence>
                  {unread.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#171717] px-1 text-[9px] font-semibold text-white"
                    >
                      {unread.length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <AnimatePresence>
                {inboxOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-lg z-50"
                  >
                    <div className="border-b border-[#F0F0F0] px-4 py-2.5 text-xs font-semibold text-[#171717] flex items-center justify-between">
                      <span>Pengingat Masuk</span>
                      <span className="text-[10px] text-[#737373] font-normal">{ws.pings.length} total</span>
                    </div>
                    {ws.pings.length === 0 ? (
                      <div className="flex flex-col items-center px-4 py-8 text-center">
                        <Bell className="mb-2 h-5 w-5 text-[#D4D4D4]" strokeWidth={1.25} />
                        <p className="text-xs text-[#737373]">Belum ada pengingat masuk.</p>
                      </div>
                    ) : (
                      <ul className="max-h-80 divide-y divide-[#F5F5F5] overflow-y-auto">
                        {ws.pings.map((p) => (
                          <li key={p.id} className="px-4 py-3 hover:bg-[#FAFAFA] transition-colors">
                            <p className="text-xs text-[#171717] leading-relaxed">
                              {p.message ?? 'Pengingat tugas'}
                            </p>
                            <p className="mt-1 text-[10px] text-[#A3A3A3]">
                              {new Date(p.created_at).toLocaleString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar & Logout */}
            <div className="ml-1 hidden items-center gap-2.5 border-l border-[#E5E5E5] pl-3 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171717] text-xs font-semibold text-white">
                {initials(currentUser.fullName)}
              </div>
              <div className="hidden leading-tight lg:block">
                <p className="text-xs font-medium text-[#171717]">{currentUser.fullName}</p>
                <p className="text-[10px] text-[#737373]">
                  {currentUser.title || (currentUser.role === 'OWNER' ? 'Owner' : 'Tim')}
                </p>
              </div>
              <form action={logoutUser}>
                <button
                  type="submit"
                  aria-label="Keluar"
                  className="rounded-md p-1.5 text-[#A3A3A3] hover:text-[#171717] transition-colors"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </form>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-md p-2 text-[#737373] md:hidden"
              aria-label="Menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[#E5E5E5] bg-white md:hidden"
            >
              <div className="space-y-1 p-3">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTab(t.id);
                      setMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm ${
                      tab === t.id ? 'bg-[#171717] text-white font-medium' : 'text-[#737373]'
                    }`}
                  >
                    <t.icon className="h-4 w-4" strokeWidth={1.5} />
                    {t.label}
                  </button>
                ))}
                {canInvite && (
                  <button
                    onClick={() => {
                      setInviteOpen(true);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[#737373]"
                  >
                    <UserPlus className="h-4 w-4" strokeWidth={1.5} />
                    Undang Anggota
                  </button>
                )}
                <form action={logoutUser}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[#737373]"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.5} />
                    Keluar ({firstName(currentUser.fullName)})
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Workspace Area */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 md:py-8">
        {ws.error ? (
          <div className="flex flex-col items-center rounded-xl border border-[#E5E5E5] bg-white px-6 py-14 text-center">
            <p className="text-sm font-semibold text-[#171717]">Gagal memuat data dari database</p>
            <p className="mt-1 max-w-sm text-xs text-[#737373]">{ws.error}</p>
            <button
              onClick={ws.reload}
              className="mt-5 flex items-center gap-1.5 rounded-md border border-[#E5E5E5] bg-white px-4 py-2 text-xs font-medium text-[#171717] hover:bg-[#FAFAFA] transition-colors"
            >
              <RotateCw className="h-3.5 w-3.5" strokeWidth={1.5} />
              Coba Lagi
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {tab === 'summary' && (
                <>
                  <ExecutiveSummary
                    profiles={ws.profiles}
                    tasks={ws.tasks}
                    jobdesks={ws.jobdesks}
                    loading={ws.loading}
                    onGoToCalendar={() => setTab('calendar')}
                    onInvite={() => setInviteOpen(true)}
                  />

                  {/* Visualisasi Grafik Analytics */}
                  <AnalyticsCharts
                    profiles={ws.profiles}
                    tasks={ws.tasks}
                    jobdesks={ws.jobdesks}
                    loading={ws.loading}
                    onGoToCalendar={() => setTab('calendar')}
                  />
                </>
              )}

              {tab === 'calendar' && (
                <RealtimeCalendar
                  profiles={ws.profiles}
                  tasks={ws.tasks}
                  loading={ws.loading}
                  currentUserId={currentUser.id}
                  onUpsert={ws.local.upsertTask}
                  onRemove={ws.local.removeTask}
                  notify={notify}
                />
              )}

              {tab === 'kpi' && (
                <KpiTracker
                  profiles={ws.profiles}
                  jobdesks={ws.jobdesks}
                  loading={ws.loading}
                  currentUserId={currentUser.id}
                  onUpsert={ws.local.upsertJobdesk}
                  onRemove={ws.local.removeJobdesk}
                  onInvite={() => setInviteOpen(true)}
                  notify={notify}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Invite Member Modal */}
      <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} />

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        profiles={ws.profiles}
        currentUserId={currentUser.id}
        onTaskUpdated={(updated) => {
          ws.local.upsertTask(updated);
          setSelectedTask(updated);
        }}
        onTaskDeleted={(id) => {
          ws.local.removeTask(id);
          setSelectedTask(null);
        }}
        onNotify={notify}
      />

      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex max-w-sm items-center gap-3 rounded-lg border px-4 py-2.5 text-xs shadow-md ${
                t.tone === 'error'
                  ? 'border-[#FECACA] bg-white text-[#991B1B]'
                  : 'border-[#262626] bg-[#171717] text-white'
              }`}
            >
              <span className="flex-1 leading-relaxed">{t.message}</span>
              {t.action && (
                <a
                  href={t.action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 font-medium underline underline-offset-2 text-emerald-400"
                >
                  {t.action.label}
                </a>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
