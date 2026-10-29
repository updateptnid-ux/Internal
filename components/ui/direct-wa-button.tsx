'use client';

import React from 'react';
import { MessageSquareShare } from 'lucide-react';

export interface DirectWAButtonProps {
  phone?: string;
  whatsappNumber?: string;
  recipientName?: string;
  assigneeName?: string;
  taskTitle: string;
  taskId?: string;
  status?: string;
  progress?: number;
  variant?: 'icon' | 'badge' | 'button';
  className?: string;
}

export function DirectWAButton({
  phone,
  whatsappNumber,
  recipientName,
  assigneeName,
  taskTitle,
  taskId,
  status,
  progress,
  variant = 'icon',
  className = '',
}: DirectWAButtonProps) {
  const rawPhone = phone || whatsappNumber || '';
  const name = recipientName || assigneeName || 'Rekan Tim';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    let sanitized = rawPhone.replace(/\D/g, '');
    if (sanitized.startsWith('0')) {
      sanitized = '62' + sanitized.substring(1);
    }
    const message = `Halo ${name}, terkait tugas "${taskTitle}"${status ? ` (Status: ${status})` : ''}, mohon update progresnya. Terima kasih.`;
    const url = `https://wa.me/${sanitized}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!rawPhone) return null;

  if (variant === 'badge') {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={`Hubungi ${name} via WhatsApp`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer ${className}`}
      >
        <MessageSquareShare className="w-3.5 h-3.5 text-emerald-600" />
        <span>Direct WA</span>
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer ${className}`}
      >
        <MessageSquareShare className="w-4 h-4" />
        <span>Chat via WhatsApp</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Kirim WA ke ${name}`}
      className={`p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer ${className}`}
    >
      <MessageSquareShare className="w-3.5 h-3.5 text-emerald-600" />
    </button>
  );
}
