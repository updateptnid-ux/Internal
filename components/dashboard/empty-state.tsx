'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, compact }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-14'} px-6`}
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#E5E5E5] bg-white">
        <Icon className="h-5 w-5 text-[#A3A3A3]" strokeWidth={1.25} />
      </div>
      <p className="text-sm font-medium text-[#171717]">{title}</p>
      {description && <p className="mt-1 max-w-xs text-xs leading-relaxed text-[#737373]">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 rounded-md border border-[#E5E5E5] bg-white px-3.5 py-1.5 text-xs font-medium text-[#171717] transition-colors hover:bg-[#FAFAFA]"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}

