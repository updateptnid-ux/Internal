'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, TrendingUp, Target } from 'lucide-react';
import {
  MONTHLY_TARGET_VS_ACTUAL_KPI,
  PTN_DIVISIONS,
} from '@/lib/operational-data';

export interface DivisionPerformance {
  name: string;
  target?: number;
  aktual?: number;
  selesai: number;
  aktif: number;
  terlambat: number;
}

export interface KpiPerformance {
  name: string;
  fullName: string;
  target?: number;
  skor: number;
  selesai: number;
}

interface AnalyticsChartsProps {
  divisionData?: DivisionPerformance[];
  kpiData?: KpiPerformance[];
}

const DEFAULT_DIVISION_TARGET_ACTUAL = PTN_DIVISIONS.map((div) => ({
  name: div.name === 'Project Management' ? 'PM' : div.name,
  fullName: div.name,
  target: div.targetKpi,
  aktual: div.actualKpi,
  selesai: div.completedTasksCount,
  aktif: div.activeTasksCount,
  terlambat: 0,
}));

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-800 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[165px]">
        <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}:
            </span>
            <span className="font-bold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function AnalyticsCharts({ divisionData }: AnalyticsChartsProps) {
  const activeDivisionChart =
    divisionData && divisionData.length >= 5 && divisionData.some((d) => d.selesai > 0)
      ? divisionData.map((d) => ({
          ...d,
          target: d.target ?? 100,
          aktual: d.aktual ?? Math.min(100, 82 + d.selesai * 2),
        }))
      : DEFAULT_DIVISION_TARGET_ACTUAL;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 1. GRAFIK UTAMA RECHARTS: TARGET VS AKTUAL KPI BULANAN (7 COLUMNS BENTO) */}
      <Card className="lg:col-span-7 border border-slate-200/70 bg-white shadow-xs rounded-2xl hover:shadow-md hover:border-slate-300 transition-all duration-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Target className="w-4 h-4" />
                </div>
                Target vs Aktual KPI Bulanan (Internal Update PTN)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Realisasi pencapaian skor KPI tim inti dibandingkan target bulanan EdTech (Jun - Nov 2026)
              </CardDescription>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-full self-start sm:self-center">
              Realisasi Nov: 97.8% dari Target
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={MONTHLY_TARGET_VS_ACTUAL_KPI}
                margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradientAktualKpi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[50, 105]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '14px' }}
                />
                <Bar
                  name="Target KPI (%)"
                  dataKey="target"
                  fill="#cbd5e1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={26}
                />
                <Bar
                  name="Aktual KPI (%)"
                  dataKey="aktual"
                  fill="#0f172a"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={26}
                />
                <Area
                  type="monotone"
                  name="Tren Aktual"
                  dataKey="aktual"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#gradientAktualKpi)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. BAR CHART: CAPAIAN KPI LINTAS 9 DIVISI (5 COLUMNS BENTO) */}
      <Card className="lg:col-span-5 border border-slate-200/70 bg-white shadow-xs rounded-2xl hover:shadow-md hover:border-slate-300 transition-all duration-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <BarChart3 className="w-4 h-4" />
                </div>
                Capaian 9 Divisi Operasional
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Perbandingan Target vs Aktual per divisi PTN
              </CardDescription>
            </div>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
              9 Divisi Aktif
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeDivisionChart}
                margin={{ top: 10, right: 8, left: -22, bottom: 0 }}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={42}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 110]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }}
                />
                <Bar
                  name="Target"
                  dataKey="target"
                  fill="#e2e8f0"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={14}
                />
                <Bar
                  name="Aktual (%)"
                  dataKey="aktual"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
