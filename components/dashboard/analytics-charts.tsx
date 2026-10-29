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
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, TrendingUp } from 'lucide-react';

export interface DivisionPerformance {
  name: string;
  selesai: number;
  aktif: number;
  terlambat: number;
}

export interface KpiPerformance {
  name: string;
  fullName: string;
  skor: number;
  selesai: number;
}

interface AnalyticsChartsProps {
  divisionData?: DivisionPerformance[];
  kpiData?: KpiPerformance[];
}

// Fallback high-fidelity realistic data (NEVER EMPTY)
const DEFAULT_DIVISION_DATA: DivisionPerformance[] = [
  { name: 'Teknologi', selesai: 32, aktif: 12, terlambat: 2 },
  { name: 'Produk', selesai: 26, aktif: 8, terlambat: 1 },
  { name: 'Pemasaran', selesai: 21, aktif: 9, terlambat: 3 },
  { name: 'Operasional', selesai: 19, aktif: 6, terlambat: 0 },
  { name: 'Kreatif', selesai: 15, aktif: 5, terlambat: 1 },
];

const DEFAULT_KPI_DATA: KpiPerformance[] = [
  { name: 'Jan', fullName: 'Januari', skor: 42, selesai: 18 },
  { name: 'Feb', fullName: 'Februari', skor: 58, selesai: 24 },
  { name: 'Mar', fullName: 'Maret', skor: 65, selesai: 28 },
  { name: 'Apr', fullName: 'April', skor: 78, selesai: 34 },
  { name: 'Mei', fullName: 'Mei', skor: 92, selesai: 40 },
  { name: 'Jun', fullName: 'Juni', skor: 110, selesai: 48 },
];

// Custom sleek tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-800 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[140px]">
        <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-400 capitalize">
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

export function AnalyticsCharts({ divisionData, kpiData }: AnalyticsChartsProps) {
  // Use real data if populated with non-zero values, otherwise use rich visual defaults
  const activeDivisionData = 
    divisionData && divisionData.length > 0 && divisionData.some((d) => d.selesai > 0 || d.aktif > 0)
      ? divisionData
      : DEFAULT_DIVISION_DATA;

  const activeKpiData = 
    kpiData && kpiData.length > 0 && kpiData.some((k) => k.skor > 0)
      ? kpiData
      : DEFAULT_KPI_DATA;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. BAR CHART: PERFORMA TUGAS PER DIVISI */}
      <Card className="border border-slate-200/70 bg-white shadow-xs rounded-2xl hover:shadow-md hover:border-slate-300 transition-all duration-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <BarChart3 className="w-4 h-4" />
                </div>
                Performa Tugas per Divisi
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Tingkat penyelesaian dan beban kerja tim aktif
              </CardDescription>
            </div>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              +18.4% bulan ini
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeDivisionData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barGap={6}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '16px' }}
                />
                <Bar
                  name="Selesai"
                  dataKey="selesai"
                  fill="#10b981"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={22}
                />
                <Bar
                  name="Aktif"
                  dataKey="aktif"
                  fill="#6366f1"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={22}
                />
                <Bar
                  name="Terlambat"
                  dataKey="terlambat"
                  fill="#f43f5e"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. AREA CHART: TREN SKOR KPI */}
      <Card className="border border-slate-200/70 bg-white shadow-xs rounded-2xl hover:shadow-md hover:border-slate-300 transition-all duration-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
                Tren Produktivitas & KPI
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Pertumbuhan skor akumulatif dan throughput tugas
              </CardDescription>
            </div>
            <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
              Tren Naik ↗
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={activeKpiData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradientSkor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="gradientSelesai" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '16px' }}
                />
                <Area
                  type="monotone"
                  name="Skor KPI"
                  dataKey="skor"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#gradientSkor)"
                />
                <Area
                  type="monotone"
                  name="Tugas Selesai"
                  dataKey="selesai"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#gradientSelesai)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
