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
  Layers,
  Megaphone,
  Award,
  Sparkles
} from 'lucide-react';
import { logoutUser } from '@/actions/auth';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  currentUser?: {
    id: string;
    fullName: string;
    email: string;
    role: 'OWNER' | 'MANAGER' | 'STAFF';
    jobTitles?: string[];
  };
}

export function Sidebar({ currentUser }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems = [
    {
      label: 'Ringkasan (Overview)',
      href: '/dashboard/owner',
      activeMatch: '/dashboard/owner',
      icon: LayoutDashboard,
      badge: 'Bento',
    },
    {
      label: 'Tugas (Kanban/List)',
      href: '/dashboard/tasks',
      activeMatch: '/dashboard/tasks',
      icon: CheckSquare,
      badge: '9 Divisi',
    },
    {
      label: 'Marketing Hub',
      href: '/dashboard/marketing',
      activeMatch: '/dashboard/marketing',
      icon: Megaphone,
      badge: 'EdTech',
    },
    {
      label: 'Evaluasi Kinerja',
      href: '/dashboard/evaluation',
      activeMatch: '/dashboard/evaluation',
      icon: Award,
      badge: '60/25/15',
    },
    {
      label: 'Tim Inti & Divisi',
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
    <div className="flex flex-col h-full justify-between p-4">
      {/* BRAND & TOP NAV */}
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight text-slate-900 leading-none truncate">
              Internal Update PTN
            </h2>
            <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">
              EdTech Try Out & Bimbel
            </p>
          </div>
        </div>

        {/* Operational Quick Pill */}
        <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <span>Batch Aktif</span>
            <span className="text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SNBT 2026
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-900">9 Divisi • 5 Tim Inti</p>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.activeMatch && pathname.startsWith(item.activeMatch));

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 ${
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* USER PROFILE & LOGOUT FOOTER */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">
                {currentUser?.fullName || 'Arya'}
              </p>
              <span className="inline-block text-[10px] text-emerald-700 font-semibold">
                {currentUser?.role === 'OWNER' ? 'Project Manager' : currentUser?.role || 'Tim Inti'}
              </span>
            </div>
          </div>
          {currentUser?.jobTitles && currentUser.jobTitles.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {currentUser.jobTitles.map((title) => (
                <span
                  key={title}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-medium"
                >
                  {title}
                </span>
              ))}
            </div>
          )}
        </div>

        <form action={logoutUser}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50/70 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Keluar Sesi</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE TOP BAR (STICKY, ZERO INTRUSIVE, HAMBURGER MENU) */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs font-bold tracking-tight text-slate-900 block leading-none">
              Internal Update PTN
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Enterprise Task & KPI</span>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileOpen(true)}
          className="h-8 w-8 p-0 border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg"
          aria-label="Buka Menu Navigasi"
        >
          <Menu className="w-4 h-4" />
        </Button>
      </div>

      {/* MOBILE DRAWER (SHADCN SHEET COMPONENT) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen} side="left">
        <SheetContent onClose={() => setMobileOpen(false)} className="p-0">
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* DESKTOP PERSISTENT SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-white border-r border-slate-200/70 shadow-2xs">
        <NavContent />
      </aside>
    </>
  );
}
