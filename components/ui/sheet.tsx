'use client';

import * as React from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: 'left' | 'right';
}

export function Sheet({ open, onOpenChange, children, side = 'right' }: SheetProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const isLeft = side === 'left';

  return (
    <div className={`fixed inset-0 z-50 flex ${isLeft ? 'justify-start' : 'justify-end'}`}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />
      {/* Drawer */}
      <div className={`relative z-50 h-full w-full ${isLeft ? 'max-w-[280px] animate-in slide-in-from-left border-r' : 'max-w-2xl animate-in slide-in-from-right border-l'} bg-white shadow-2xl duration-300 flex flex-col border-slate-200`}>
        {children}
      </div>
    </div>
  );
}

export function SheetContent({
  children,
  className = '',
  onClose,
}: {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}) {
  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-sm p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-hidden cursor-pointer"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Tutup</span>
        </button>
      )}
      {children}
    </div>
  );
}

export function SheetHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col space-y-2 p-6 border-b border-slate-100 bg-slate-50/50 ${className}`} {...props} />;
}

export function SheetTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`text-lg font-bold tracking-tight text-slate-900 ${className}`} {...props} />;
}

export function SheetDescription({ className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-xs text-slate-500 leading-normal ${className}`} {...props} />;
}

export function SheetFooter({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50 mt-auto ${className}`} {...props} />;
}
