'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  AlertTriangle, 
  TrendingUp, 
  Layers, 
  PlusCircle, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  UserCheck 
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: 'danger' | 'warning' | 'success' | 'neutral';
}

function MetricCard({ title, value, subtitle, icon, badge, badgeVariant = 'neutral' }: MetricCardProps) {
  const badgeColors = {
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-lg p-5 shadow-sm hover:border-slate-300 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <div className="p-2 bg-slate-50 text-slate-700 rounded-md border border-slate-100">{icon}</div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900">{value}</span>
        {badge && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${badgeColors[badgeVariant]}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

export function GodEyeDashboard() {
  const [isCrossAssignModalOpen, setIsCrossAssignModalOpen] = useState(false);

  // Sample aggregated data (in production, passed from Next.js Server Component page)
  const enterpriseMetrics = {
    totalActiveTasks: 184,
    enterpriseCompletionRate: '87.4%',
    overdueTasksTotal: 12,
    divisionsCount: 6,
  };

  const divisionOverdueBreakdown = [
    { division: 'Engineering & Tech', active: 64, overdue: 5, avgProgress: 72 },
    { division: 'Sales & BD', active: 38, overdue: 4, avgProgress: 61 },
    { division: 'Finance & Legal', active: 29, overdue: 2, avgProgress: 89 },
    { division: 'Supply Chain & Ops', active: 32, overdue: 1, avgProgress: 94 },
    { division: 'People & HR', active: 21, overdue: 0, avgProgress: 98 },
  ];

  const staffPerformance = [
    { name: 'Reyhan Saputra', division: 'Engineering', tasksDone: 18, pending: 3, onTimeRate: '96%' },
    { name: 'Dian Paramita', division: 'Sales & BD', tasksDone: 14, pending: 2, onTimeRate: '92%' },
    { name: 'Arif Wibowo', division: 'Finance', tasksDone: 21, pending: 1, onTimeRate: '99%' },
    { name: 'Bambang Kusuma', division: 'Engineering', tasksDone: 11, pending: 4, onTimeRate: '81%' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-900 text-white tracking-wider uppercase">
              God-Eye Oversight
            </span>
            <span className="text-xs text-slate-500 font-medium">5-Owner Council Portal</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Enterprise Executive Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Real-time multi-division execution telemetry, audit monitoring, and company-wide SLA tracking.
          </p>
        </div>

        {/* Cross Division Assign Action */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCrossAssignModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-md text-xs font-semibold shadow-sm hover:bg-slate-800 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Assign Cross-Division Task</span>
          </button>
        </div>
      </div>

      {/* Aggregate Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <MetricCard
          title="Total Active Tasks"
          value={enterpriseMetrics.totalActiveTasks}
          subtitle="Berjalan di seluruh 6 divisi korporat"
          icon={<Layers className="w-5 h-5 text-slate-700" />}
          badge="+8 minggu ini"
          badgeVariant="neutral"
        />
        <MetricCard
          title="Overdue Tasks by Division"
          value={enterpriseMetrics.overdueTasksTotal}
          subtitle="Melewati target SLA due date"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          badge="Kritikal"
          badgeVariant="danger"
        />
        <MetricCard
          title="Enterprise Completion Rate"
          value={enterpriseMetrics.enterpriseCompletionRate}
          subtitle="Target kuartal Q4 2026: 85.0%"
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          badge="Exceeding Target"
          badgeVariant="success"
        />
        <MetricCard
          title="Divisi Terdaftar"
          value={enterpriseMetrics.divisionsCount}
          subtitle="Seluruh hierarki tersinkronisasi RLS"
          icon={<Building2 className="w-5 h-5 text-indigo-600" />}
        />
      </div>

      {/* Deep Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Overdue & SLA Tracking by Division */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-lg shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Overdue Tasks & Progress by Division</h2>
              <p className="text-xs text-slate-500">Kepatuhan SLA dan beban kerja divisi operasional</p>
            </div>
            <span className="text-xs font-medium text-slate-500">Live Telemetry</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-5">Divisi</th>
                  <th className="py-3 px-4">Tugas Aktif</th>
                  <th className="py-3 px-4">Overdue</th>
                  <th className="py-3 px-4">Rata-rata Progress</th>
                  <th className="py-3 px-4 text-right">Status SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {divisionOverdueBreakdown.map((row) => (
                  <tr key={row.division} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-slate-800">{row.division}</td>
                    <td className="py-3.5 px-4 text-slate-600">{row.active}</td>
                    <td className="py-3.5 px-4">
                      {row.overdue > 0 ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <Clock className="w-3 h-3" />
                          {row.overdue} Tasks
                        </span>
                      ) : (
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          0 Overdue
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 w-44">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-slate-900 h-full rounded-full" 
                            style={{ width: `${row.avgProgress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-700">{row.avgProgress}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {row.overdue >= 4 ? (
                        <span className="text-[11px] text-rose-600 font-semibold">Memerlukan Intervensi</span>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">Sesuai Target</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Staff Progress Performance Panel */}
        <div className="bg-white border border-slate-200/80 rounded-lg shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Staff Performance</h2>
              <p className="text-xs text-slate-500">Peringkat penyelesaian tugas staf korporat</p>
            </div>
            <UserCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="p-4 space-y-3.5 flex-1 overflow-y-auto">
            {staffPerformance.map((staff, idx) => (
              <div key={idx} className="p-3 rounded-md border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{staff.name}</p>
                      <p className="text-[11px] text-slate-500">{staff.division}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {staff.onTimeRate}
                  </span>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex justify-between text-[11px] text-slate-600">
                  <span>Selesai: <strong className="text-slate-900">{staff.tasksDone}</strong></span>
                  <span>Pending: <strong className="text-slate-900">{staff.pending}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Cross-Division Assignment (Owner Privilege) */}
      {isCrossAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Assign Cross-Division Enterprise Task</h3>
              <button 
                onClick={() => setIsCrossAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Hak istimewa Owner: Menugaskan tugas lintas divisi tanpa batasan hierarki manajerial lokal.
            </p>
            <form className="mt-4 space-y-4" onSubmit={(e) => { e.preventDefault(); setIsCrossAssignModalOpen(false); }}>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Tugas</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Audit Integrasi ISO 27001 Divisi Tech & Legal"
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-900" 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Divisi</label>
                  <select className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900">
                    <option>Engineering & Tech</option>
                    <option>Sales & BD</option>
                    <option>Finance & Legal</option>
                    <option>Supply Chain & Ops</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prioritas</label>
                  <select className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900">
                    <option value="URGENT">URGENT (Pemicu WA)</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instruksi Eksekutif</label>
                <textarea 
                  rows={3} 
                  placeholder="Instruksi langsung dari jajaran 5 Owners..."
                  className="w-full text-xs border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCrossAssignModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800"
                >
                  Terbitkan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
