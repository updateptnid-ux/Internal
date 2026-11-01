import React from 'react';

export default function RootLoading() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
        <span className="text-xs font-medium text-slate-500">Memuat workspace...</span>
      </div>
    </div>
  );
}
