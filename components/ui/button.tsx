'use client';

import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

    const variantStyles = {
      default: 'bg-slate-900 text-white hover:bg-slate-800 shadow-xs',
      destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-xs',
      outline: 'border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 text-slate-800',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
      ghost: 'hover:bg-slate-100 hover:text-slate-900 text-slate-700',
      link: 'text-slate-900 underline-offset-4 hover:underline',
      success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs',
    };

    const sizeStyles = {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-10 rounded-md px-8 text-sm',
      icon: 'h-9 w-9',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
