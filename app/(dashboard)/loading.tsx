import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-6xl mx-auto font-sans animate-in fade-in duration-200">
      {/* HEADER SKELETON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div className="space-y-2">
          <div className="w-32 h-5 rounded-full bg-slate-200/70 animate-pulse" />
          <div className="w-48 h-8 rounded-xl bg-slate-200/80 animate-pulse" />
          <div className="w-72 h-4 rounded-lg bg-slate-100 animate-pulse" />
        </div>
        <div className="w-28 h-9 rounded-xl bg-slate-200/80 animate-pulse" />
      </div>

      {/* 3 METRIC CARDS SKELETON */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-white border border-slate-200/70 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-24 h-4 rounded bg-slate-100 animate-pulse" />
              <div className="w-8 h-8 rounded-xl bg-slate-100 animate-pulse" />
            </div>
            <div className="w-16 h-8 rounded-lg bg-slate-200 animate-pulse" />
            <div className="w-36 h-3 rounded bg-slate-100 animate-pulse" />
          </div>
        ))}
      </div>

      {/* 2 CHARTS SKELETON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-white border border-slate-200/70 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="space-y-1.5">
                <div className="w-40 h-4 rounded bg-slate-200 animate-pulse" />
                <div className="w-56 h-3 rounded bg-slate-100 animate-pulse" />
              </div>
              <div className="w-20 h-5 rounded-full bg-slate-100 animate-pulse" />
            </div>
            <div className="h-64 rounded-xl bg-slate-50 flex items-end justify-between p-4 gap-3">
              {[40, 65, 85, 55, 95, 70, 60].map((h, idx) => (
                <div
                  key={idx}
                  style={{ height: `${h}%` }}
                  className="w-full rounded-t-md bg-slate-200/60 animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* TABLE SKELETON */}
      <div className="rounded-2xl bg-white border border-slate-200/70 shadow-xs p-6 space-y-4">
        <div className="w-44 h-5 rounded bg-slate-200 animate-pulse" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
                <div className="space-y-1">
                  <div className="w-28 h-3.5 rounded bg-slate-200 animate-pulse" />
                  <div className="w-16 h-2.5 rounded bg-slate-100 animate-pulse" />
                </div>
              </div>
              <div className="w-24 h-2 rounded-full bg-slate-100 animate-pulse hidden sm:block" />
              <div className="w-12 h-5 rounded bg-slate-100 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
