import * as React from 'react';

/** Shadcn-style Skeleton, palet netral. */
export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`animate-pulse rounded-md bg-[#F0F0F0] ${className}`} {...props} />;
}

