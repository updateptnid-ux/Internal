'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, TaskStatus } from '@/types/database';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet';
import { DirectWAButton } from '@/components/ui/direct-wa-button';
import {
  INITIAL_PTN_TASKS,
  PTN_DIVISIONS,
  CORE_TEAM_MEMBERS,
  EnrichedTask,
} from '@/lib/operational-data';
import { 
  Calendar, 
  Award, 
  Filter,
  LayoutGrid,
  List,
  Building2,
  Tag,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface KanbanBoardProps {
  initialTasks: Task[];
  currentUser?: {
    id: string;
    role: 'OWNER' | 'MANAGER' | 'STAFF';
    fullName: string;
  };
}

const COLUMNS: { id: TaskStatus; label: string; dotColor: string; badgeColor: string }[] = [
  { 
    id: 'TODO', 
    label: 'Rencana (To Do)', 
    dotColor: 'bg-slate-400',
    badgeColor: 'bg-slate-100 text-slate-700' 
  },
  { 
    id: 'IN_PROGRESS', 
    label: 'Dikerjakan (In Progress)', 
    dotColor: 'bg-blue-500',
    badgeColor: 'bg-blue-50 text-blue-700' 
  },
  { 
    id: 'IN_REVIEW', 
    label: 'Menunggu Review', 
    dotColor: 'bg-purple-500',
    badgeColor: 'bg-purple-50 text-purple-700' 
  },
  { 
    id: 'DONE', 
    label: 'Selesai (Done)', 
    dotColor: 'bg-emerald-500',
    badgeColor: 'bg-emerald-50 text-emerald-700' 
  },
];

const DIVISION_FILTERS = [
  'Semua Divisi',
  'Project Management',
  'Marketing',
  'Try Out',
  'Bimbel',
  'Keuangan',
  'SDM',
  'Cek Skor',
  'Admin',
  'IT',
];

const CATEGORY_FILTERS = [
  'Semua Kategori',
  'B2B',
  'Affiliate',
  'Media Partnership',
  'SEO',
  'TikTok Live',
  'Operasional',
];

const PRIORITY_FILTERS = ['Semua', 'Tinggi', 'Sedang', 'Rendah'];

const CATEGORY_BADGE_MAP: Record<string, string> = {
  B2B: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Affiliate: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Media Partnership': 'bg-amber-50 text-amber-700 border-amber-200',
  SEO: 'bg-purple-50 text-purple-700 border-purple-200',
  'TikTok Live': 'bg-rose-50 text-rose-700 border-rose-200',
  Operasional: 'bg-slate-100 text-slate-700 border-slate-200',
};

function normalizePriorityIndonesia(task: any): 'Tinggi' | 'Sedang' | 'Rendah' {
  if (task.priority_label) return task.priority_label;
  if (task.priority === 'URGENT' || task.priority === 'HIGH') return 'Tinggi';
  if (task.priority === 'LOW') return 'Rendah';
  return 'Sedang';
}

export function KanbanBoard({ 
  initialTasks, 
  currentUser = { id: CORE_TEAM_MEMBERS[0].id, role: 'OWNER', fullName: 'Arya' } 
}: KanbanBoardProps) {
  const resolvedTasks: EnrichedTask[] =
    initialTasks && initialTasks.length > 0
      ? initialTasks.map((t: any) => {
          const coreMember = CORE_TEAM_MEMBERS.find(
            (m) => m.id === t.assignee_id || m.name.toLowerCase() === (t.assignee?.full_name || '').toLowerCase()
          );
          return {
            ...t,
            priority_label: normalizePriorityIndonesia(t),
            category: t.category || 'Operasional',
            assignee_roles: t.assignee?.job_titles || coreMember?.jobTitles || ['Tim Inti'],
          };
        })
      : INITIAL_PTN_TASKS;

  const [tasks, setTasks] = useState<EnrichedTask[]>(resolvedTasks);
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Filter states
  const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST'>('KANBAN');
  const [filterDivision, setFilterDivision] = useState<string>('Semua Divisi');
  const [filterCategory, setFilterCategory] = useState<string>('Semua Kategori');
  const [filterPriority, setFilterPriority] = useState<string>('Semua');

  React.useEffect(() => {
    if (initialTasks && initialTasks.length > 0) {
      setTasks(
        initialTasks.map((t: any) => ({
          ...t,
          priority_label: normalizePriorityIndonesia(t),
          category: t.category || 'Operasional',
        }))
      );
    }
  }, [initialTasks]);

  const handleCardClick = (task: EnrichedTask) => {
    setSelectedTask(task);
    setSheetOpen(true);
  };

  const filteredTasks = tasks.filter((t) => {
    const divName = t.division?.name || 'Operasional';
    const matchDiv = filterDivision === 'Semua Divisi' || divName === filterDivision;
    const matchCat = filterCategory === 'Semua Kategori' || t.category === filterCategory;
    const prioIndo = normalizePriorityIndonesia(t);
    const matchPrio = filterPriority === 'Semua' || prioIndo === filterPriority;
    return matchDiv && matchCat && matchPrio;
  });

  return (
    <div className="space-y-5">
      {/* MULTI-DIMENSIONAL FILTER BAR (DIVISI, KATEGORI, PRIORITAS & VIEW MODE) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-xs space-y-3.5"
      >
        {/* Row 1: Filter Divisi (9 Divisi) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              Filter Divisi (9 Departemen PTN):
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewMode('KANBAN')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'KANBAN'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Kanban
              </button>
              <button
                type="button"
                onClick={() => setViewMode('LIST')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'LIST'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                List Tabel
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {DIVISION_FILTERS.map((div) => (
              <button
                key={div}
                type="button"
                onClick={() => setFilterDivision(div)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  filterDivision === div
                    ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {div}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Filter Kategori (B2B, Affiliate, Media Partnership, SEO, TikTok Live) & Prioritas */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1 shrink-0">
              <Tag className="w-3.5 h-3.5" />
              Kategori:
            </span>
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" />
                Prioritas:
              </span>
              {PRIORITY_FILTERS.map((prio) => (
                <button
                  key={prio}
                  type="button"
                  onClick={() => setFilterPriority(prio)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    filterPriority === prio
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {prio}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0">
              {filteredTasks.length} Tugas
            </span>
          </div>
        </div>
      </motion.div>

      {/* VIEW 1: KANBAN BOARD COLUMNS */}
      <AnimatePresence mode="wait">
        {viewMode === 'KANBAN' ? (
          <motion.div
            key="kanban-view"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start"
          >
            {COLUMNS.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.id);

              return (
                <div 
                  key={col.id} 
                  className="flex flex-col bg-slate-50/70 border border-slate-200/70 rounded-2xl overflow-hidden"
                >
                  {/* COLUMN HEADER */}
                  <div className="flex items-center justify-between p-3.5 border-b border-slate-100 bg-white">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                      <h3 className="text-xs font-bold text-slate-900">
                        {col.label}
                      </h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${col.badgeColor}`}>
                      {colTasks.length}
                    </span>
                  </div>

                  {/* TASK LIST */}
                  <div className="p-3 space-y-3 min-h-[460px]">
                    {colTasks.map((task) => {
                      const prioLabel = normalizePriorityIndonesia(task);
                      const catStyle =
                        CATEGORY_BADGE_MAP[task.category] || CATEGORY_BADGE_MAP.Operasional;

                      return (
                        <motion.div
                          layout
                          key={task.id}
                          onClick={() => handleCardClick(task)}
                          className="group bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2.5"
                        >
                          {/* CARD BADGES: PRIORITAS & KATEGORI */}
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge 
                                variant={
                                  prioLabel === 'Tinggi' 
                                    ? 'high' 
                                    : prioLabel === 'Rendah' 
                                    ? 'low' 
                                    : 'medium'
                                }
                                className="text-[10px] font-semibold"
                              >
                                {prioLabel}
                              </Badge>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${catStyle}`}
                              >
                                {task.category}
                              </span>
                            </div>

                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              <Award className="w-2.5 h-2.5 text-amber-500" />
                              {task.kpi_weight || 8} pt
                            </span>
                          </div>

                          {/* DIVISION CHIP */}
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="font-semibold text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded">
                              Divisi: {task.division?.name || 'Operasional'}
                            </span>
                            {task.due_date && (
                              <span className="flex items-center gap-1 font-medium text-slate-400">
                                <Calendar className="w-3 h-3" />
                                {new Date(task.due_date).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                            )}
                          </div>

                          {/* TITLE */}
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-slate-950 leading-relaxed">
                            {task.title}
                          </h4>

                          {task.target_metric && (
                            <p className="text-[11px] text-emerald-700 bg-emerald-50/70 border border-emerald-200/60 px-2 py-1 rounded-lg font-medium">
                              Target: {task.target_metric}
                            </p>
                          )}

                          {/* PROGRESS BAR */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Progres Capaian</span>
                              <span className="font-bold text-slate-700">{task.progress_percentage || 0}%</span>
                            </div>
                            <Progress value={task.progress_percentage || 0} />
                          </div>

                          {/* FOOTER: ASSIGNEE MULTI-ROLE & WA */}
                          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                {task.assignee?.full_name?.charAt(0) || 'A'}
                              </div>
                              <div className="truncate">
                                <span className="text-xs text-slate-900 font-bold block leading-none">
                                  {task.assignee?.full_name || 'Tim Inti'}
                                </span>
                                <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                                  {task.assignee_roles?.[0] || 'PJ Divisi'}
                                </span>
                              </div>
                            </div>

                            {task.assignee?.whatsapp_number && (
                              <DirectWAButton
                                whatsappNumber={task.assignee.whatsapp_number}
                                taskTitle={task.title}
                                assigneeName={task.assignee.full_name}
                              />
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          /* VIEW 2: LIST TABEL LENGKAP */
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="bg-white border border-slate-200/70 rounded-2xl shadow-xs overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Tugas & Target Output</th>
                    <th className="py-3.5 px-4">Divisi</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4">Prioritas</th>
                    <th className="py-3.5 px-4">PIC (Multi-Role)</th>
                    <th className="py-3.5 px-4">Progres</th>
                    <th className="py-3.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((task) => {
                    const prioLabel = normalizePriorityIndonesia(task);
                    const catStyle =
                      CATEGORY_BADGE_MAP[task.category] || CATEGORY_BADGE_MAP.Operasional;

                    return (
                      <tr
                        key={task.id}
                        onClick={() => handleCardClick(task)}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="font-bold text-slate-900 line-clamp-1">{task.title}</p>
                          {task.target_metric && (
                            <span className="text-[11px] text-emerald-600 font-medium">
                              Target: {task.target_metric}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {task.division?.name || 'Operasional'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${catStyle}`}>
                            {task.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              prioLabel === 'Tinggi'
                                ? 'high'
                                : prioLabel === 'Rendah'
                                ? 'low'
                                : 'medium'
                            }
                            className="text-[10px]"
                          >
                            {prioLabel}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{task.assignee?.full_name}</div>
                          <div className="text-[10px] text-slate-400">
                            {task.assignee_roles?.join(', ')}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 w-36">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-700">
                              {task.progress_percentage}%
                            </span>
                            <Progress value={task.progress_percentage} />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TASK DETAIL SHEET */}
      <TaskDetailSheet
        taskId={selectedTask?.id || null}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        currentUser={currentUser}
        taskData={selectedTask}
        onTaskUpdated={() => {}}
      />
    </div>
  );
}
