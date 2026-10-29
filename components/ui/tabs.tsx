'use client';

import * as React from 'react';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

export function Tabs({
  value,
  onValueChange,
  defaultValue,
  children,
  className = '',
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [currentValue, setCurrentValue] = React.useState(defaultValue || '');

  const activeValue = value !== undefined ? value : currentValue;
  const handleValueChange = (val: string) => {
    if (onValueChange) onValueChange(val);
    else setCurrentValue(val);
  };

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: handleValueChange }}>
      <div className={`flex flex-col ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`inline-flex h-9 items-center justify-start rounded-lg bg-slate-100 p-1 text-slate-500 ${className}`}>
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className = '',
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = ctx.value === value;

  return (
    <button
      type="button"
      onClick={() => ctx.onValueChange(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-white transition-all focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${
        isActive
          ? 'bg-white text-slate-950 shadow-xs font-semibold'
          : 'text-slate-600 hover:text-slate-900'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className = '',
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('TabsContent must be used within Tabs');

  if (ctx.value !== value) return null;

  return <div className={`pt-4 focus-visible:outline-hidden ${className}`}>{children}</div>;
}
