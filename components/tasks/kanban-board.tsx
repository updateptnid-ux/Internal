'use client';

import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types/database';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet';
import { DirectWAButton } from '@/components/ui/direct-wa-button';
import { 
  Calendar, 
  Award, 
  Filter
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
    label: 'Rencana', 
    dotColor: 'bg-slate-400',
    badgeColor: 'bg-slate-100 text-slate-700' 
  },
  { 
    id: 'IN_PROGRESS', 
    label: 'Dikerjakan', 
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
    label: 'Selesai', 
    dotColor: 'bg-emerald-500',
    badgeColor: 'bg-emerald-50 text-emerald-700' 
  },
];

const PRIORITY_LABELS: Record<string, string> = {
  ALL: 'Semua',
  URGENT: 'Mendesak',
  HIGH: 'Tinggi',
  MEDIUM: 'Sedang',
  LOW: 'Rendah',
};

export function KanbanBoard({ 
  initialTasks, 
  currentUser = { id: '', role: 'STAFF', fullName: 'Anggota Tim' } 
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const handleCardClick = (task: Task) => {
    setSelectedTask(task);
    setSheetOpen(true);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterPriority === 'ALL') return true;
    return t.priority === filterPriority;
  });

  return (
    <div className="space-y-6">
      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/60 rounded-xl p-3 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 text-slate-400 mr-2 text-xs font-medium shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Prioritas:</span>
          </div>
          {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setFilterPriority(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                filterPriority === p
                  ? 'bg-slate-900 text-white font-medium'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {PRIORITY_LABELS[p] || p}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500 font-medium px-1">
          {filteredTasks.length} tugas ditampilkan
        </div>
      </div>

      {/* KANBAN BOARD COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div 
              key={col.id} 
              className="flex flex-col bg-slate-50/50 border border-slate-200/60 rounded-xl overflow-hidden"
            >
              {/* COLUMN HEADER */}
              <div className="flex items-center justify-between p-3.5 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <h3 className="text-xs font-semibold text-slate-900">
                    {col.label}
                  </h3>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${col.badgeColor}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* TASK LIST */}
              <div className="p-3 space-y-3 min-h-[500px]">
                {colTasks.length === 0 ? (
                  <div className="h-28 flex flex-col items-center justify-center border border-dashed border-slate-200/80 rounded-xl text-slate-400 text-xs">
                    Tidak ada tugas
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleCardClick(task)}
                      className="group bg-white border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 shadow-xs hover:shadow-sm transition-all cursor-pointer space-y-3"
                    >
                      {/* CARD BADGES */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <Badge 
                            variant={
                              task.priority === 'URGENT' 
                                ? 'urgent' 
                                : task.priority === 'HIGH' 
                                ? 'high' 
                                : task.priority === 'LOW' 
                                ? 'low' 
                                : 'medium'
                            }
                            className="text-[10px] font-normal"
                          >
                            {PRIORITY_LABELS[task.priority] || task.priority}
                          </Badge>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            <Award className="w-2.5 h-2.5 text-slate-500" />
                            {task.kpi_weight || 1} pt
                          </span>
                        </div>

                        {task.due_date && (
                          <span className={`text-[10px] flex items-center gap-1 font-medium ${
                            new Date(task.due_date) < new Date() && task.status !== 'DONE'
                              ? 'text-rose-600'
                              : 'text-slate-400'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            {new Date(task.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>

                      {/* TITLE */}
                      <h4 className="text-xs font-semibold text-slate-900 group-hover:text-slate-950 line-clamp-2 leading-relaxed">
                        {task.title}
                      </h4>

                      {/* PROGRESS BAR */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Progres</span>
                          <span className="font-medium text-slate-700">{task.progress_percentage || 0}%</span>
                        </div>
                        <Progress value={task.progress_percentage || 0} />
                      </div>

                      {/* FOOTER: ASSIGNEE & WA */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-2 truncate max-w-[150px]">
                          <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-medium text-[10px] shrink-0">
                            {task.assignee?.full_name?.charAt(0) || 'S'}
                          </div>
                          <span className="text-xs text-slate-600 truncate font-medium">
                            {task.assignee?.full_name || 'Staf'}
                          </span>
                        </div>

                        {task.assignee?.whatsapp_number && (
                          <DirectWAButton
                            whatsappNumber={task.assignee.whatsapp_number}
                            taskTitle={task.title}
                            assigneeName={task.assignee.full_name}
                          />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

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
