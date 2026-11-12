'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Bell,
  Trash2,
  MessageCircle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import type { CalendarTask, Profile, TaskStatus } from '@/types/database';
import { updateCalendarTaskStatus, sendTaskPing, deleteCalendarTask } from '@/actions/tasks';
import { firstName, isOverdue } from '@/lib/performance';

interface TaskDetailModalProps {
  task: CalendarTask | null;
  isOpen: boolean;
  onClose: () => void;
  profiles: Profile[];
  currentUserId: string;
  onTaskUpdated?: (updated: CalendarTask) => void;
  onTaskDeleted?: (taskId: string) => void;
  onNotify?: (msg: string, opts?: { tone?: 'default' | 'error'; action?: { label: string; href: string } }) => void;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  profiles,
  currentUserId,
  onTaskUpdated,
  onTaskDeleted,
  onNotify,
}: TaskDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  if (!isOpen || !task) return null;

  const assignee = profiles.find((p) => p.id === task.assignee_id);
  const overdue = isOverdue(task);
  const isDone = task.status === 'COMPLETED';
  const canPing = !isDone && !!task.assignee_id && task.assignee_id !== currentUserId;

  async function handleStatusChange(newStatus: TaskStatus) {
    if (!task) return;
    setIsUpdating(true);
    const res = await updateCalendarTaskStatus(task.id, newStatus);
    setIsUpdating(false);
    if (res.success) {
      if (onTaskUpdated) onTaskUpdated(res.data);
      if (onNotify) onNotify(`Status tugas diubah menjadi ${newStatus}.`);
    } else {
      if (onNotify) onNotify(res.error, { tone: 'error' });
    }
  }

  async function handlePing() {
    if (!task) return;
    setIsPinging(true);
    const res = await sendTaskPing(task.id);
    setIsPinging(false);
    if (res.success) {
      if (onTaskUpdated) onTaskUpdated(res.data.task);
      const name = assignee ? firstName(assignee.full_name) : 'penanggung jawab';
      if (onNotify) {
        onNotify(`Pengingat berhasil dikirim ke ${name}.`, {
          action: res.data.whatsappUrl
            ? { label: 'Kirim via WhatsApp', href: res.data.whatsappUrl }
            : undefined,
        });
      }
    } else {
      if (onNotify) onNotify(res.error, { tone: 'error' });
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!confirm(`Hapus tugas "${task.title}"?`)) return;
    const res = await deleteCalendarTask(task.id);
    if (res.success) {
      if (onTaskDeleted) onTaskDeleted(task.id);
      if (onNotify) onNotify('Tugas berhasil dihapus.');
      onClose();
    } else {
      if (onNotify) onNotify(res.error, { tone: 'error' });
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl border border-[#E5E5E5] w-full max-w-lg shadow-xl overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                  task.priority === 'HIGH'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : task.priority === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-[#FAFAFA] text-[#737373] border border-[#E5E5E5]'
                }`}
              >
                Prioritas {task.priority}
              </span>
              {overdue && (
                <span className="text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-600" />
                  Lewat Tenggat
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1 text-[#737373] hover:text-[#171717] rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-[#171717] leading-snug">
                {task.title}
              </h2>
              {task.description ? (
                <p className="text-xs text-[#737373] mt-2 leading-relaxed whitespace-pre-wrap bg-[#FAFAFA] p-3 rounded-lg border border-[#F0F0F0]">
                  {task.description}
                </p>
              ) : (
                <p className="text-xs text-[#A3A3A3] italic mt-1">Tidak ada deskripsi tambahan.</p>
              )}
            </div>

            {/* Timing & Dates */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-[#FAFAFA] p-3 rounded-lg border border-[#F0F0F0]">
              <div className="flex items-start gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#737373] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-[#A3A3A3] uppercase block">Waktu Mulai</span>
                  <span className="font-medium text-[#171717]">
                    {new Date(task.start_time).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-[#737373] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-[#A3A3A3] uppercase block">Tenggat Waktu</span>
                  <span className={`font-medium ${overdue ? 'text-rose-600 font-semibold' : 'text-[#171717]'}`}>
                    {new Date(task.due_date).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Assignee Card */}
            <div className="border border-[#E5E5E5] rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#171717] text-white flex items-center justify-center text-xs font-semibold">
                  {assignee ? assignee.full_name.charAt(0) : '?'}
                </div>
                <div>
                  <p className="text-xs font-medium text-[#171717]">
                    {assignee ? assignee.full_name : 'Belum Ditugaskan'}
                  </p>
                  <p className="text-[10px] text-[#737373]">
                    {assignee?.title || (assignee?.role === 'OWNER' ? 'Owner' : 'Tim')}
                  </p>
                </div>
              </div>

              {canPing && (
                <button
                  onClick={handlePing}
                  disabled={isPinging}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#171717] bg-[#FAFAFA] border border-[#E5E5E5] rounded-md hover:bg-[#F0F0F0] transition-colors"
                >
                  {isPinging ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Bell className="w-3 h-3" />
                  )}
                  <span>Ingatkan ({task.ping_count})</span>
                </button>
              )}
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-medium text-[#737373] mb-2 uppercase tracking-wider text-[10px]">
                Status Pengerjaan:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['TODO', 'IN_PROGRESS', 'COMPLETED'] as TaskStatus[]).map((st) => {
                  const isActive = task.status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange(st)}
                      className={`py-2 px-3 rounded-md text-xs font-medium border text-center transition-all ${
                        isActive
                          ? 'border-[#171717] bg-[#171717] text-white shadow-xs'
                          : 'border-[#E5E5E5] bg-white text-[#737373] hover:text-[#171717] hover:bg-[#FAFAFA]'
                      }`}
                    >
                      {st === 'TODO' ? 'Belum Dimulai' : st === 'IN_PROGRESS' ? 'Sedang Dikerjakan' : 'Selesai'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-3.5 bg-[#FAFAFA] border-t border-[#F0F0F0] flex items-center justify-between">
            <button
              onClick={handleDelete}
              className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Tugas</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium bg-white border border-[#E5E5E5] text-[#171717] rounded-md hover:bg-[#F0F0F0] transition-colors"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
