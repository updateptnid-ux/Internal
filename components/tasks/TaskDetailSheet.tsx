'use client';

import * as React from 'react';
import { z } from 'zod';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  uploadTaskEvidence, 
  submitForReview, 
  evaluateTask, 
  updateTaskProgress 
} from '@/actions/tasks';
import { DirectWAButton } from '@/components/ui/direct-wa-button';
import { 
  Calendar, 
  Clock, 
  FileText, 
  ExternalLink, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  UploadCloud, 
  History, 
  Paperclip, 
  Award, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { TaskStatus, AttachmentFileType } from '@/types/database';

// Zod Schema for Evidence Upload Form
const evidenceSchema = z.object({
  fileUrl: z.string().url('URL bukti harus valid (contoh: https://drive.google.com/...)').min(5, 'URL wajib diisi'),
  fileType: z.enum(['DOCUMENT', 'IMAGE', 'LINK']),
  notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
});

interface TaskDetailSheetProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: {
    id: string;
    role: 'OWNER' | 'MANAGER' | 'STAFF';
    fullName: string;
  };
  taskData?: any;
  onTaskUpdated?: () => void;
}

export function TaskDetailSheet({
  taskId,
  open,
  onOpenChange,
  currentUser,
  taskData: initialTaskData,
  onTaskUpdated,
}: TaskDetailSheetProps) {
  const [task, setTask] = React.useState<any>(initialTaskData || null);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Form States for Upload Evidence
  const [evidenceUrl, setEvidenceUrl] = React.useState('');
  const [evidenceType, setEvidenceType] = React.useState<AttachmentFileType>('DOCUMENT');
  const [evidenceNotes, setEvidenceNotes] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);

  // Form State for Evaluation (ACC / Reject)
  const [evalFeedback, setEvalFeedback] = React.useState('');
  const [isEvaluating, setIsEvaluating] = React.useState(false);

  // Sync initialTaskData
  React.useEffect(() => {
    if (initialTaskData) {
      setTask(initialTaskData);
    }
  }, [initialTaskData]);

  if (!task) return null;

  const isAssignee = currentUser.id === task.assignee_id;
  const isAssigner = currentUser.id === task.assigner_id;
  const isOwner = currentUser.role === 'OWNER';
  const canEvaluate = isOwner || isAssigner;
  const attachments = task.attachments || [];
  const activities = task.activities || [];

  // Reset alerts on open
  const clearFeedback = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // 1. Action: Upload Bukti Kerja
  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    const parseResult = evidenceSchema.safeParse({
      fileUrl: evidenceUrl,
      fileType: evidenceType,
      notes: evidenceNotes,
    });

    if (!parseResult.success) {
      setErrorMsg(parseResult.error.issues[0]?.message || 'Input bukti tidak valid.');
      return;
    }

    try {
      setIsUploading(true);
      const res = await uploadTaskEvidence(
        task.id,
        evidenceUrl,
        evidenceType,
        evidenceNotes
      );

      if (res.success) {
        setSuccessMsg(res.message);
        setEvidenceUrl('');
        setEvidenceNotes('');
        // Update local state
        setTask((prev: any) => ({
          ...prev,
          attachments: [res.attachment, ...(prev.attachments || [])],
        }));
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengunggah bukti kerja.');
    } finally {
      setIsUploading(false);
    }
  };

  // 2. Action: Ajukan untuk ACC (submitForReview)
  const handleSubmitReview = async () => {
    clearFeedback();
    try {
      setLoading(true);
      const res = await submitForReview(task.id);
      if (res.success) {
        setSuccessMsg(res.message);
        setTask((prev: any) => ({
          ...prev,
          status: 'IN_REVIEW',
          progress_percentage: 100,
        }));
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengajukan review.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Action: Evaluasi Tugas (ACC / Tolak)
  const handleEvaluate = async (decision: 'APPROVE' | 'REJECT') => {
    clearFeedback();
    try {
      setIsEvaluating(true);
      const res = await evaluateTask(task.id, decision, evalFeedback);
      if (res.success) {
        setSuccessMsg(res.message);
        setEvalFeedback('');
        setTask((prev: any) => ({
          ...prev,
          status: decision === 'APPROVE' ? 'DONE' : 'IN_PROGRESS',
          progress_percentage: decision === 'APPROVE' ? 100 : 80,
        }));
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengevaluasi tugas.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // 4. Action: Update Progress Manual
  const handleUpdateProgress = async (newProgress: number) => {
    clearFeedback();
    try {
      const res = await updateTaskProgress({
        taskId: task.id,
        progressPercentage: newProgress,
      });
      if (res.success) {
        setTask((prev: any) => ({
          ...prev,
          progress_percentage: newProgress,
        }));
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui progres.');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent onClose={() => onOpenChange(false)}>
        {/* HEADER SECTION */}
        <SheetHeader>
          <div className="flex items-center justify-between gap-2 pr-6">
            <div className="flex items-center gap-2">
              <Badge variant={task.priority === 'URGENT' ? 'urgent' : task.priority === 'HIGH' ? 'high' : 'outline'}>
                {task.priority || 'MEDIUM'}
              </Badge>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                <Award className="w-3 h-3 text-indigo-600" />
                KPI: {task.kpi_weight || 1}
              </span>
              <Badge 
                variant="secondary"
                className={
                  task.status === 'DONE' 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : task.status === 'IN_REVIEW' 
                    ? 'bg-purple-100 text-purple-800 border border-purple-300'
                    : 'bg-slate-100 text-slate-800'
                }
              >
                {task.status.replace('_', ' ')}
              </Badge>
            </div>
            {task.due_date && (
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(task.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
          <SheetTitle className="text-xl mt-1">{task.title}</SheetTitle>
          <SheetDescription className="text-slate-600 text-xs">
            {task.description || 'Tidak ada deskripsi rinci untuk tugas ini.'}
          </SheetDescription>
        </SheetHeader>

        {/* FEEDBACK ALERTS */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* BODY CONTENT SCROLLABLE */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* ASSIGNEE & PROGRESS SUMMARY */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase">
                  {task.assignee?.full_name?.charAt(0) || 'S'}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{task.assignee?.full_name || 'Staf Pelaksana'}</p>
                  <p className="text-[11px] text-slate-500">Pemberi: {task.assigner?.full_name || 'Owner'}</p>
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

            {/* PROGRESS BAR & CONTROLS */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-600">Penyelesaian Tugas:</span>
                <span className="font-bold text-slate-900">{task.progress_percentage || 0}%</span>
              </div>
              <Progress value={task.progress_percentage || 0} />
              
              {/* Progress Steppers for Assignee/Owner */}
              {task.status !== 'DONE' && (isAssignee || isOwner) && (
                <div className="flex items-center gap-1.5 pt-2">
                  {[0, 25, 50, 75, 100].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => handleUpdateProgress(step)}
                      className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                        task.progress_percentage === step
                          ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {step}%
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* APPROVAL BANNER (KHUSUS ASSIGNER / OWNER SAAT STATUS IN_REVIEW) */}
          {task.status === 'IN_REVIEW' && canEvaluate && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">Tinjauan Tugas</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                    Anggota tim telah melampirkan bukti kerja. Tinjau lampiran sebelum menyetujui atau meminta revisi.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 block">
                  Catatan atau instruksi revisi:
                </label>
                <textarea
                  rows={2}
                  value={evalFeedback}
                  onChange={(e) => setEvalFeedback(e.target.value)}
                  placeholder="Contoh: Pekerjaan sudah sesuai, terima kasih..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  onClick={() => handleEvaluate('APPROVE')}
                  disabled={isEvaluating}
                  className="flex-1 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-8"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Setujui Tugas
                </Button>
                <Button
                  onClick={() => handleEvaluate('REJECT')}
                  disabled={isEvaluating}
                  variant="ghost"
                  className="flex-1 text-xs gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg h-8"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Minta Revisi
                </Button>
              </div>
            </div>
          )}

          {/* TABS: BUKTI KERJA & RIWAYAT AKTIVITAS */}
          <Tabs defaultValue="evidence" className="w-full">
            <TabsList className="w-full grid grid-cols-2 bg-slate-100 rounded-lg p-1">
              <TabsTrigger value="evidence" className="gap-1.5 text-xs rounded-md">
                <Paperclip className="w-3.5 h-3.5" />
                Bukti Kerja ({attachments.length})
              </TabsTrigger>
              <TabsTrigger value="audit" className="gap-1.5 text-xs rounded-md">
                <History className="w-3.5 h-3.5" />
                Riwayat Aktivitas ({activities.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: BUKTI KERJA (ATTACHMENTS) */}
            <TabsContent value="evidence" className="space-y-4">
              {/* UPLOAD FORM KHUSUS STAF / PELAKSANA */}
              {task.status !== 'DONE' && (isAssignee || isOwner) && (
                <form onSubmit={handleUploadEvidence} className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-3">
                  <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-slate-700" />
                    Lampirkan Bukti Kerja / Deliverable
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="md:col-span-2">
                      <input
                        type="url"
                        value={evidenceUrl}
                        onChange={(e) => setEvidenceUrl(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        required
                        className="w-full text-xs p-2 rounded-md border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <select
                        value={evidenceType}
                        onChange={(e) => setEvidenceType(e.target.value as AttachmentFileType)}
                        className="w-full text-xs p-2 rounded-md border border-slate-200 bg-white focus:outline-hidden"
                      >
                        <option value="DOCUMENT">Dokumen (PDF/Doc)</option>
                        <option value="IMAGE">Gambar/Foto</option>
                        <option value="LINK">Tautan (Link Web)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={evidenceNotes}
                      onChange={(e) => setEvidenceNotes(e.target.value)}
                      placeholder="Catatan pelengkap bukti kerja (opsional)..."
                      className="w-full text-xs p-2 rounded-md border border-slate-200 focus:outline-hidden"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">Lampirkan bukti kerja sebelum mengajukan peninjauan.</span>
                    <Button type="submit" size="sm" disabled={isUploading} className="text-xs rounded-lg">
                      {isUploading ? 'Menyimpan...' : 'Unggah Bukti'}
                    </Button>
                  </div>
                </form>
              )}

              {/* TOMBOL AJUKAN PENINJAUAN */}
              {task.status !== 'DONE' && task.status !== 'IN_REVIEW' && isAssignee && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Tugas telah selesai?</p>
                    <p className="text-[11px] text-slate-500">Ajukan ke pemberi tugas untuk diperiksa.</p>
                  </div>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={loading || attachments.length === 0}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs gap-1.5 rounded-lg h-8"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Ajukan Peninjauan
                  </Button>
                </div>
              )}

              {/* LIST LAMPIRAN BUKTI */}
              <div className="space-y-2">
                {attachments.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                    <FileText className="w-8 h-8 mx-auto mb-1.5 opacity-40" />
                    Belum ada bukti kerja yang dilampirkan.
                  </div>
                ) : (
                  attachments.map((att: any) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-slate-700" />
                        </div>
                        <div className="truncate">
                          <a
                            href={att.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1 truncate"
                          >
                            {att.notes || att.file_url}
                            <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                          </a>
                          <p className="text-[10px] text-slate-500">
                            {att.file_type} • Diunggah {new Date(att.created_at).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        Terverifikasi
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* TAB 2: KOTAK HITAM (AUDIT TRAIL TIMELINE) */}
            <TabsContent value="audit" className="space-y-3">
              {activities.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                  <History className="w-8 h-8 mx-auto mb-1.5 opacity-40" />
                  Belum ada rekaman audit trail.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {activities.map((act: any) => {
                    const isAcc = act.action_type === 'APPROVAL_ACC';
                    const isReject = act.action_type === 'REVISION_REJECT';
                    const isUpload = act.action_type === 'EVIDENCE_UPLOAD';

                    return (
                      <div key={act.id} className="relative group text-xs">
                        {/* Dot Indicator */}
                        <div className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white ring-2 ${
                          isAcc
                            ? 'bg-emerald-500 ring-emerald-200'
                            : isReject
                            ? 'bg-rose-500 ring-rose-200'
                            : isUpload
                            ? 'bg-indigo-500 ring-indigo-200'
                            : 'bg-slate-500 ring-slate-200'
                        }`} />

                        <div className="bg-slate-50 border border-slate-200/80 rounded-md p-3 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-900">
                              {act.profiles?.full_name || 'Sistem / Pelaku'}
                            </span>
                            <span className="text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(act.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="text-slate-700">
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold mr-1.5 ${
                              isAcc
                                ? 'bg-emerald-100 text-emerald-800'
                                : isReject
                                ? 'bg-rose-100 text-rose-800'
                                : isUpload
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-200 text-slate-800'
                            }`}>
                              {act.action_type.replace('_', ' ')}
                            </span>
                            {act.old_value && act.new_value && (
                              <span className="text-slate-500">
                                {act.old_value} → <strong className="text-slate-900">{act.new_value}</strong>
                              </span>
                            )}
                          </div>

                          {act.comment_text && (
                            <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200/60 mt-1 italic">
                              &ldquo;{act.comment_text}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
