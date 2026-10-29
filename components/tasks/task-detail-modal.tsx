'use client';

import React, { useState, useEffect } from 'react';
import { Task, TaskActivity, TaskStatus } from '@/types/database';
import { updateTaskProgress } from '@/actions/tasks';
import { createClient } from '@/lib/supabase/client';
import { DirectWAButton } from '@/components/ui/direct-wa-button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  History, 
  Send, 
  ArrowRight,
  ShieldAlert,
  CheckCircle,
  FileText
} from 'lucide-react';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskMutated?: (updatedTask: Partial<Task> & { id: string }) => void;
}

export function TaskDetailModal({ task, isOpen, onClose, onTaskMutated }: TaskDetailModalProps) {
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(task?.progress_percentage ?? 0);
  const [currentStatus, setCurrentStatus] = useState<TaskStatus>(task?.status ?? 'TODO');

  const supabase = createClient();

  useEffect(() => {
    if (task && isOpen) {
      setCurrentProgress(task.progress_percentage);
      setCurrentStatus(task.status);
      fetchActivities(task.id);
    }
  }, [task, isOpen]);

  const fetchActivities = async (taskId: string) => {
    setIsLoadingActivities(true);
    try {
      const { data, error } = await supabase
        .from('task_activities')
        .select(`
          *,
          user:profiles!task_activities_user_id_fkey(full_name, role)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching audit trail:', error);
      } else {
        setActivities((data as any) || []);
      }
    } catch (err) {
      console.error('Failed to load audit trail:', err);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  if (!isOpen || !task) return null;

  const handleUpdateStatus = async (newStatus: TaskStatus) => {
    setCurrentStatus(newStatus);
    const targetProgress = newStatus === 'DONE' ? 100 : currentProgress;
    if (newStatus === 'DONE') setCurrentProgress(100);

    setIsSubmitting(true);
    try {
      await updateTaskProgress({
        taskId: task.id,
        status: newStatus,
        progressPercentage: targetProgress,
        auditComment: `Status updated to ${newStatus} from Task Detail View.`,
      });

      if (onTaskMutated) {
        onTaskMutated({ id: task.id, status: newStatus, progress_percentage: targetProgress });
      }
      await fetchActivities(task.id);
    } catch (err) {
      console.error('Failed to update status:', err);
      // Revert state
      setCurrentStatus(task.status);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProgress = async (progressVal: number) => {
    setCurrentProgress(progressVal);
    try {
      await updateTaskProgress({
        taskId: task.id,
        progressPercentage: progressVal,
      });

      if (onTaskMutated) {
        onTaskMutated({ id: task.id, progress_percentage: progressVal });
      }
      await fetchActivities(task.id);
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      await updateTaskProgress({
        taskId: task.id,
        auditComment: commentText.trim(),
      });
      setCommentText('');
      await fetchActivities(task.id);
    } catch (err) {
      console.error('Failed to post audit comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200/90 rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs text-slate-400">TASK-{task.id.slice(0, 8).toUpperCase()}</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
              {task.division?.name || 'General Division'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content - Dual Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-slate-200">
          
          {/* Left Column: Task Core Specifications (7 Cols) */}
          <div className="md:col-span-7 p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                {task.title}
              </h2>

              {/* Status and Priority Meta Controls */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={currentStatus}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleUpdateStatus(e.target.value as TaskStatus)}
                  disabled={isSubmitting}
                  className="text-xs font-semibold bg-white border border-slate-300 rounded-md px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="BACKLOG">BACKLOG</option>
                  <option value="TODO">TO DO</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="IN_REVIEW">IN REVIEW</option>
                  <option value="DONE">DONE (ACC)</option>
                  <option value="REJECTED">REJECTED (Revisi)</option>
                </select>

                <Badge variant={task.priority === 'URGENT' ? 'urgent' : task.priority === 'HIGH' ? 'high' : 'medium'}>
                  {task.priority} PRIORITY
                </Badge>

                {task.due_date && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Due: {new Date(task.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Scope of Work & Specification</span>
              </div>
              <div className="text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-4 rounded-lg border border-slate-200/80 whitespace-pre-wrap min-h-[100px]">
                {task.description || 'No detailed description provided for this task.'}
              </div>
            </div>

            {/* Milestone Progress Slider */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                <span>Progress Tracking</span>
                <span className="font-mono text-xs font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                  {currentProgress}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={currentProgress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateProgress(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg accent-slate-900 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1.5">
                <span>0% (Not Started)</span>
                <span>50% (Active)</span>
                <span>100% (Completed)</span>
              </div>
            </div>

            {/* Assignee Contact Card */}
            <div className="border border-slate-200 rounded-lg p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
                Assigned Staff Member
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    {task.assignee?.full_name?.charAt(0) || <User className="w-4 h-4" />}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{task.assignee?.full_name}</h5>
                    <p className="text-[11px] text-slate-500">{task.assignee?.email}</p>
                  </div>
                </div>

                {task.assignee?.whatsapp_number && (
                  <DirectWAButton
                    phone={task.assignee.whatsapp_number}
                    recipientName={task.assignee.full_name}
                    taskTitle={task.title}
                    taskId={task.id}
                    status={currentStatus}
                    progress={currentProgress}
                    variant="badge"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Audit Trail Timeline (5 Cols) */}
          <div className="md:col-span-5 p-6 flex flex-col bg-slate-50/40">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Audit Trail Timeline
                </h3>
              </div>
              <span className="text-[10px] font-mono font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                Immutable Log
              </span>
            </div>

            {/* Timeline Events Stream */}
            <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1 max-h-[380px]">
              {isLoadingActivities ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading audit records...</div>
              ) : activities.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 italic">
                  No audit log entries recorded yet.
                </div>
              ) : (
                activities.map((act: any) => (
                  <div key={act.id} className="relative pl-5 pb-2 border-l-2 border-slate-200 last:border-transparent">
                    {/* Timeline Node Dot */}
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-slate-700 ring-2 ring-white" />
                    
                    {/* Timestamp & User */}
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900">
                        {act.user?.full_name || 'System / Service'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(act.created_at).toLocaleString('id-ID', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Action Diff Display */}
                    {act.action_type === 'STATUS_CHANGE' && (
                      <p className="text-[11px] text-slate-600 mt-1">
                        Status modified: <span className="line-through text-slate-400 font-mono">{act.old_value}</span>{' '}
                        ➔ <span className="font-semibold text-slate-900 font-mono">{act.new_value}</span>
                      </p>
                    )}

                    {act.action_type === 'PROGRESS_UPDATE' && (
                      <p className="text-[11px] text-slate-600 mt-1">
                        Progress milestone: <span className="line-through text-slate-400 font-mono">{act.old_value}</span>{' '}
                        ➔ <span className="font-bold text-slate-900 font-mono">{act.new_value}</span>
                      </p>
                    )}

                    {act.action_type === 'REASSIGN' && (
                      <p className="text-[11px] text-slate-600 mt-1">
                        Reassigned: <span className="text-slate-500">{act.old_value}</span> ➔{' '}
                        <strong className="text-slate-900">{act.new_value}</strong>
                      </p>
                    )}

                    {act.comment_text && (
                      <div className="mt-1.5 bg-white border border-slate-200 p-2.5 rounded text-xs text-slate-800 leading-normal shadow-2xs">
                        {act.comment_text}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Audit Log / Comment Input */}
            <form onSubmit={handleAddComment} className="mt-4 pt-3 border-t border-slate-200">
              <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                Add Executive Note / Audit Log
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Record note in permanent audit trail..."
                  value={commentText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommentText(e.target.value)}
                  className="flex-1 text-xs border border-slate-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !commentText.trim()}
                  className="p-2 bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
