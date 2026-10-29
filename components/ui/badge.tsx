import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'urgent' | 'high' | 'medium' | 'low';
}

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-slate-900 text-white hover:bg-slate-800',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    destructive: 'bg-red-50 text-red-700 border-red-200 border',
    outline: 'border border-slate-200 text-slate-800',
    urgent: 'bg-rose-50 text-rose-700 border-rose-300 border font-bold animate-pulse',
    high: 'bg-amber-50 text-amber-700 border-amber-200 border font-semibold',
    medium: 'bg-blue-50 text-blue-700 border-blue-200 border font-medium',
    low: 'bg-slate-100 text-slate-600 border-slate-200 border font-medium',
  };

  return (
    <div
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
}
