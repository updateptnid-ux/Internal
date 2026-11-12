'use client';

import React from 'react';
import {
  LayoutGrid,
  CalendarDays,
  ClipboardList,
  UserPlus,
  LogOut,
  Bell,
  Sparkles,
} from 'lucide-react';
import { logoutUser } from '@/actions/auth';
import { initials } from '@/lib/performance';

export type DashboardTab = 'summary' | 'calendar' | 'kpi';

export interface SidebarProps {
  currentUser: {
    id: string;
    fullName: string;
    email: string;
    role: 'OWNER' | 'TEAM';
    title?: string;
  };
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onInviteClick?: () => void;
  unreadPingsCount?: number;
  realtimeStatus?: 'connecting' | 'live' | 'offline';
}

export function Sidebar({
  currentUser,
  activeTab,
  onTabChange,
  onInviteClick,
  unreadPingsCount = 0,
  realtimeStatus = 'live',
}: SidebarProps) {
  const navItems: { id: DashboardTab; label: string; icon: React.ElementType; badge?: string }[] = [
    {
      id: 'summary',
      label: 'Ringkasan & Metrik',
      icon: LayoutGrid,
    },
    {
      id: 'calendar',
      label: 'Kalender & Agenda',
      icon: CalendarDays,
      badge: 'Realtime',
    },
    {
      id: 'kpi',
      label: 'KPI Jobdesk',
      icon: ClipboardList,
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-[#E5E5E5] bg-white flex flex-col justify-between h-screen sticky top-0 font-sans">
      {/* Brand & Workspace Info */}
      <div>
        <div className="h-16 px-6 border-b border-[#F0F0F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#171717] text-white flex items-center justify-center font-bold text-xs tracking-wider">
              PTN
            </div>
            <div>
              <p className="text-sm font-semibold text-[#171717] tracking-tight leading-none">
                Internal Update
              </p>
              <p className="text-[10px] text-[#737373] mt-0.5 leading-none">
                Enterprise Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Realtime Status Indicator */}
        <div className="px-6 py-2.5 bg-[#FAFAFA] border-b border-[#F0F0F0] flex items-center justify-between text-[11px] text-[#737373]">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                realtimeStatus === 'live'
                  ? 'bg-emerald-600'
                  : realtimeStatus === 'connecting'
                    ? 'bg-[#D4D4D4] animate-pulse'
                    : 'bg-amber-600'
              }`}
            />
            {realtimeStatus === 'live'
              ? 'Realtime Aktif'
              : realtimeStatus === 'connecting'
                ? 'Menghubungkan...'
                : 'Offline'}
          </span>
          {unreadPingsCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-[#171717] text-white px-1.5 py-0.2 rounded-full">
              <Bell className="w-2.5 h-2.5" />
              {unreadPingsCount}
            </span>
          )}
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#171717] text-white shadow-xs'
                    : 'text-[#737373] hover:text-[#171717] hover:bg-[#FAFAFA]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#F0F0F0] text-[#737373]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {currentUser.role === 'OWNER' && onInviteClick && (
            <button
              onClick={onInviteClick}
              className="w-full flex items-center gap-2.5 px-3 py-2 mt-2 rounded-md text-xs font-medium text-[#737373] hover:text-[#171717] hover:bg-[#FAFAFA] border border-dashed border-[#E5E5E5] transition-colors"
            >
              <UserPlus className="w-4 h-4 text-[#171717]" strokeWidth={1.5} />
              <span>Undang Anggota</span>
            </button>
          )}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-[#F0F0F0]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#171717] text-white flex items-center justify-center text-xs font-semibold shrink-0">
              {initials(currentUser.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[#171717] truncate leading-tight">
                {currentUser.fullName}
              </p>
              <p className="text-[10px] text-[#737373] truncate leading-tight mt-0.5">
                {currentUser.title || (currentUser.role === 'OWNER' ? 'Owner' : 'Tim')}
              </p>
            </div>
          </div>

          <form action={logoutUser}>
            <button
              type="submit"
              title="Keluar"
              className="p-1.5 text-[#737373] hover:text-[#171717] rounded-md hover:bg-[#FAFAFA] transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

