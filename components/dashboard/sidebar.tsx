'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Layers
} from 'lucide-react';
import { logoutUser } from '@/actions/auth';

interface SidebarProps {
  currentUser?: {
    id: string;
    fullName: string;
    email: string;
    role: 'OWNER' | 'MANAGER' | 'STAFF';
  };
}

export function Sidebar({ currentUser }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const isOwner = currentUser?.role === 'OWNER';

  const navItems = [
    {
      label: 'Ringkasan',
      href: isOwner ? '/dashboard/owner' : '/dashboard/tasks',
      activeMatch: isOwner ? '/dashboard/owner' : '/dashboard/summary',
      icon: LayoutDashboard,
    },
    {
      label: 'Tugas',
      href: '/dashboard/tasks',
      activeMatch: '/dashboard/tasks',
      icon: CheckSquare,
    },
    {
      label: 'Tim',
      href: '/dashboard/team',
      activeMatch: '/dashboard/team',
      icon: Users,
    },
    {
      label: 'Pengaturan',
      href: '/dashboard/settings',
      activeMatch: '/dashboard/settings',
      icon: Settings,
    },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full justify-between">
      {/* BRAND & TOP NAV */}
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-slate-900 leading-none">
              Internal
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">Workspace</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.activeMatch && pathname.startsWith(item.activeMatch));

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* USER PROFILE & LOGOUT FOOTER */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-xs shrink-0">
            {currentUser?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="truncate flex-1">
            <p className="text-xs font-medium text-slate-900 truncate">
              {currentUser?.fullName || 'Anggota Tim'}
            </p>
            <span className="inline-block text-[10px] text-slate-400 uppercase tracking-wider font-medium">
              {currentUser?.role || 'STAFF'}
            </span>
          </div>
        </div>

        <form action={logoutUser}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Keluar</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE HEADER BAR */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Internal</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-50 w-64 bg-white h-full p-4 flex flex-col shadow-xl border-r border-slate-200">
            <NavContent />
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR (FIXED LEFT) */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 h-screen sticky top-0 bg-white border-r border-slate-200/70 p-4">
        <NavContent />
      </aside>
    </>
  );
}
