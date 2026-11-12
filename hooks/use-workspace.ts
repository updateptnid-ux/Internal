'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { CalendarTask, KpiJobdesk, Profile, TaskPing } from '@/types/database';

export type RealtimeStatus = 'connecting' | 'live' | 'offline';

type WithId = { id: string };

function upsertById<T extends WithId>(list: T[], row: T): T[] {
  const idx = list.findIndex((r) => r.id === row.id);
  if (idx === -1) return [...list, row];
  const next = list.slice();
  next[idx] = row;
  return next;
}

function removeById<T extends WithId>(list: T[], id: string): T[] {
  return list.filter((r) => r.id !== id);
}

function applyChange<T extends WithId>(list: T[], payload: RealtimePostgresChangesPayload<T>): T[] {
  if (payload.eventType === 'DELETE') {
    const oldId = (payload.old as Partial<T>).id;
    return oldId ? removeById(list, oldId) : list;
  }
  return upsertById(list, payload.new as T);
}

export function useWorkspace(currentUserId: string, onIncomingPing?: (ping: TaskPing) => void) {
  const supabase = useMemo(() => createClient(), []);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [jobdesks, setJobdesks] = useState<KpiJobdesk[]>([]);
  const [pings, setPings] = useState<TaskPing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('connecting');

  // Simpan callback terbaru tanpa memicu re-subscribe.
  const pingHandler = useRef(onIncomingPing);
  pingHandler.current = onIncomingPing;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [p, t, j, n] = await Promise.all([
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('calendar_tasks').select('*').order('start_time'),
      supabase.from('kpi_jobdesks').select('*').order('created_at'),
      supabase
        .from('task_pings')
        .select('*')
        .eq('recipient_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    const firstError = p.error || t.error || j.error || n.error;
    if (firstError) {
      setError(firstError.message);
    } else {
      setProfiles(p.data ?? []);
      setTasks(t.data ?? []);
      setJobdesks(j.data ?? []);
      setPings(n.data ?? []);
    }
    setLoading(false);
  }, [supabase, currentUserId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      // Pastikan socket realtime memakai JWT user agar lolos RLS.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) supabase.realtime.setAuth(session.access_token);
      if (cancelled) return;

      channel = supabase
        .channel(`workspace:${currentUserId}`)
        .on<CalendarTask>('postgres_changes', { event: '*', schema: 'public', table: 'calendar_tasks' }, (payload) =>
          setTasks((prev) => applyChange(prev, payload))
        )
        .on<KpiJobdesk>('postgres_changes', { event: '*', schema: 'public', table: 'kpi_jobdesks' }, (payload) =>
          setJobdesks((prev) => applyChange(prev, payload))
        )
        .on<Profile>('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) =>
          setProfiles((prev) =>
            applyChange(prev, payload).sort((a, b) => a.full_name.localeCompare(b.full_name))
          )
        )
        .on<TaskPing>(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'task_pings', filter: `recipient_id=eq.${currentUserId}` },
          (payload) => {
            const ping = payload.new as TaskPing;
            setPings((prev) => (prev.some((x) => x.id === ping.id) ? prev : [ping, ...prev].slice(0, 30)));
            pingHandler.current?.(ping);
          }
        )
        .on<TaskPing>(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'task_pings', filter: `recipient_id=eq.${currentUserId}` },
          (payload) => setPings((prev) => upsertById(prev, payload.new as TaskPing))
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') setRealtimeStatus('live');
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setRealtimeStatus('offline');
          }
        });
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, currentUserId]);

  // Mutator lokal: hasil server action langsung diterapkan (idempoten dengan event realtime).
  const local = useMemo(
    () => ({
      upsertTask: (row: CalendarTask) => setTasks((prev) => upsertById(prev, row)),
      removeTask: (id: string) => setTasks((prev) => removeById(prev, id)),
      upsertJobdesk: (row: KpiJobdesk) => setJobdesks((prev) => upsertById(prev, row)),
      removeJobdesk: (id: string) => setJobdesks((prev) => removeById(prev, id)),
      markPingsRead: (ids: string[]) =>
        setPings((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, is_read: true } : p))),
    }),
    []
  );

  return { profiles, tasks, jobdesks, pings, loading, error, realtimeStatus, reload: load, local };
}

