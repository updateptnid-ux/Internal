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
  divisionData: DivisionPerformance[];
  kpiData: KpiPerformance[];
}

// Custom modern tooltip for Clean SaaS aesthetic
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-xs border border-slate-200/80 rounded-lg p-3 shadow-lg text-xs space-y-1.5 min-w-[130px]">
        <p className="font-semibold text-slate-900 border-b border-slate-100 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-500 capitalize">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}:
            </span>
            <span className="font-medium text-slate-900">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function AnalyticsCharts({ divisionData, kpiData }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. BAR CHART: PERFORMA TUGAS PER DIVISI */}
      <Card className="border border-slate-200/60 bg-white shadow-xs rounded-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-700" />
                Performa Tugas per Divisi
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Distribusi status pengerjaan tugas di setiap divisi
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-64 w-full">
            {divisionData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Belum ada data divisi yang tersedia.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={divisionData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  barGap={4}
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
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }}
                  />
                  <Bar
                    name="Selesai"
                    dataKey="selesai"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    name="Aktif"
                    dataKey="aktif"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    name="Terlambat"
                    dataKey="terlambat"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. AREA / LINE CHART: TREN & DISTRIBUSI SKOR KPI TIM */}
      <Card className="border border-slate-200/60 bg-white shadow-xs rounded-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-700" />
                Tren Skor KPI Tim
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Pencapaian skor KPI dan total tugas selesai staf teratas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-64 w-full">
            {kpiData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Belum ada data pencapaian KPI bulan ini.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={kpiData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSkor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
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
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }}
                  />
                  <Area
                    type="monotone"
                    name="Skor KPI"
                    dataKey="skor"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSkor)"
                  />
                  <Area
                    type="monotone"
                    name="Tugas Selesai"
                    dataKey="selesai"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={0}
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
