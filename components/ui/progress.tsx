'use client';

import * as React from 'react';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  indicatorClassName?: string;
}

export function Progress({
  value = 0,
  max = 100,
  className = '',
  indicatorClassName = '',
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, ((value || 0) / max) * 100));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={`relative h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}
      {...props}
    >
      <div
        className={`h-full w-full flex-1 bg-slate-900 transition-all duration-300 ease-in-out ${indicatorClassName}`}
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  );
}
