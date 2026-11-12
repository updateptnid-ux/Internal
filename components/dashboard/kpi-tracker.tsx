'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ClipboardList, Loader2, Plus, Trash2, Users } from 'lucide-react';
import type { KpiJobdesk, Profile } from '@/types/database';
import { addJobdesk, deleteJobdesk, toggleJobdeskCompletion } from '@/actions/kpi';
import { calculateKpiProgress, currentPeriod, firstName } from '@/lib/performance';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from './empty-state';
import type { Notify } from './dashboard-shell';

interface Props {
  profiles: Profile[];
  jobdesks: KpiJobdesk[];
  loading: boolean;
  currentUserId: string;
  onUpsert: (j: KpiJobdesk) => void;
  onRemove: (id: string) => void;
  onInvite: () => void;
  notify: Notify;
}

export function KpiTracker({ profiles, jobdesks, loading, currentUserId, onUpsert, onRemove, onInvite, notify }: Props) {
  const [selectedId, setSelectedId] = useState<string>(currentUserId);
  const [title, setTitle] = useState('');
  const [weight, setWeight] = useState(3);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const period = currentPeriod();
  const owner = profiles.find((p) => p.id === selectedId) ?? profiles[0];

  const list = useMemo(
    () => (owner ? jobdesks.filter((j) => j.owner_id === owner.id && j.period_month === period) : []),
    [jobdesks, owner, period]
  );
  const progress = calculateKpiProgress(list);
  const doneCount = list.filter((j) => j.is_completed).length;
  const totalWeight = list.reduce((a, j) => a + j.weight, 0);

  const progressByOwner = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const p of profiles) {
      map.set(p.id, calculateKpiProgress(jobdesks.filter((j) => j.owner_id === p.id && j.period_month === period)));
    }
    return map;
  }, [profiles, jobdesks, period]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!owner || !title.trim()) return;
    setAdding(true);
    const res = await addJobdesk({ ownerId: owner.id, title, weight });
    setAdding(false);
    if (res.success) {
      onUpsert(res.data);
      setTitle('');
    } else notify(res.error, { tone: 'error' });
  }

  async function toggle(j: KpiJobdesk) {
    setBusyId(j.id);
    const res = await toggleJobdeskCompletion(j.id, !j.is_completed);
    setBusyId(null);
    if (res.success) onUpsert(res.data);
    else notify(res.error, { tone: 'error' });
  }

  async function remove(j: KpiJobdesk) {
    setBusyId(j.id);
    const res = await deleteJobdesk(j.id);
    setBusyId(null);
    if (res.success) onRemove(j.id);
    else notify(res.error, { tone: 'error' });
  }

  if (loading) return <KpiSkeleton />;

  if (!owner) {
    return (
      <div className="rounded-xl border border-[#E5E5E5] bg-white">
        <EmptyState
          icon={Users}
          title="Belum ada anggota tim"
          description="Undang anggota untuk mulai menyusun jobdesk dan KPI."
          actionLabel="Undang anggota"
          onAction={onInvite}
        />
      </div>
    );
  }

  const periodLabel = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-[#171717]">KPI Jobdesk</h2>
        <p className="text-xs text-[#737373]">
          Progres dihitung dari bobot jobdesk yang selesai · periode {periodLabel}.
        </p>
      </div>

      {/* Pemilih orang */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {profiles.map((p) => {
          const pr = progressByOwner.get(p.id);
          const active = p.id === owner.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`flex shrink-0 items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-colors ${
                active
                  ? 'border-[#171717] bg-[#171717] text-white'
                  : 'border-[#E5E5E5] bg-white text-[#737373] hover:text-[#171717]'
              }`}
            >
              {firstName(p.full_name)}
              {p.id === currentUserId && <span className={active ? 'text-white/60' : 'text-[#A3A3A3]'}>(saya)</span>}
              <span className={active ? 'text-white/70' : 'text-[#A3A3A3]'}>{pr === null || pr === undefined ? '—' : `${pr}%`}</span>
            </button>
          );
        })}
      </div>

      <motion.div
        key={owner.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl border border-[#E5E5E5] bg-white"
      >
        {/* Ringkasan progres */}
        <div className="border-b border-[#F0F0F0] p-5">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#171717]">{owner.full_name}</p>
              <p className="truncate text-xs text-[#737373]">{owner.title || (owner.role === 'OWNER' ? 'Owner' : 'Tim')}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold tracking-tight text-[#171717]">
                {progress === null ? '—' : `${progress}%`}
              </p>
              <p className="text-[11px] text-[#A3A3A3]">
                {doneCount}/{list.length} selesai · bobot {totalWeight}
              </p>
            </div>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#F0F0F0]">
            <motion.div
              className="h-full rounded-full bg-[#171717]"
              initial={{ width: 0 }}
              animate={{ width: `${progress ?? 0}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Form tambah */}
        <form onSubmit={submit} className="flex flex-col gap-2 border-b border-[#F0F0F0] p-4 sm:flex-row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Tambah jobdesk untuk ${firstName(owner.full_name)}…`}
            className="flex-1 rounded-md border border-[#E5E5E5] px-3 py-2 text-sm outline-none transition-colors focus:border-[#171717]"
          />
          <div className="flex gap-2">
            <label className="flex items-center gap-1.5 rounded-md border border-[#E5E5E5] px-2 text-xs text-[#737373]">
              Bobot
              <select
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="bg-transparent py-2 text-sm text-[#171717] outline-none"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={adding || !title.trim()}
              className="flex items-center gap-1.5 rounded-md bg-[#171717] px-3 py-2 text-xs font-medium text-white hover:bg-[#262626] disabled:opacity-40"
            >
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Tambah
            </button>
          </div>
        </form>

        {/* Daftar */}
        {list.length === 0 ? (
          <EmptyState
            compact
            icon={ClipboardList}
            title="Belum ada jobdesk bulan ini"
            description={`Tambahkan poin jobdesk ${firstName(owner.full_name)} di atas. Progres KPI akan dihitung otomatis.`}
          />
        ) : (
          <ul className="divide-y divide-[#F5F5F5]">
            <AnimatePresence initial={false}>
              {list.map((j) => (
                <motion.li
                  key={j.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="group flex items-center gap-3 px-4 py-3"
                >
                  <button
                    onClick={() => toggle(j)}
                    disabled={busyId === j.id}
                    aria-label={j.is_completed ? 'Tandai belum selesai' : 'Tandai selesai'}
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      j.is_completed ? 'border-[#171717] bg-[#171717]' : 'border-[#D4D4D4] hover:border-[#171717]'
                    }`}
                  >
                    {j.is_completed && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                  </button>
                  <span className={`flex-1 text-sm ${j.is_completed ? 'text-[#A3A3A3] line-through' : 'text-[#171717]'}`}>
                    {j.title}
                  </span>
                  <span className="text-[11px] text-[#A3A3A3]">bobot {j.weight}</span>
                  {busyId === j.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#A3A3A3]" />
                  ) : (
                    <button
                      onClick={() => remove(j)}
                      aria-label="Hapus jobdesk"
                      className="p-1 text-[#D4D4D4] transition hover:text-[#171717] sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </motion.div>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-64" />
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24" />
        ))}
      </div>
      <div className="space-y-4 rounded-xl border border-[#E5E5E5] bg-white p-5">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-7 w-14" />
        </div>
        <Skeleton className="h-1 w-full" />
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

