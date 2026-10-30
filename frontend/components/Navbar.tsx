'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building2, 
  Layers, 
  AlertTriangle, 
  Wrench, 
  Calendar, 
  Package, 
  Activity, 
  UserCheck, 
  CheckCircle2,
  Cpu,
  ChevronDown,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { PRESET_USERS, getActiveUser, setActiveUser, loginAs, UserPreset } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUserState] = useState<UserPreset>(PRESET_USERS[0]);
  const [serverOnline, setServerOnline] = useState<boolean>(true);

  useEffect(() => {
    const user = getActiveUser();
    setCurrentUserState(user);
    loginAs(user).catch(() => setServerOnline(false));

    const interval = setInterval(async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/health');
        setServerOnline(res.ok);
      } catch {
        setServerOnline(false);
      }
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEmail = e.target.value;
    const targetUser = PRESET_USERS.find(u => u.email === selectedEmail);
    if (!targetUser) return;
    try {
      await loginAs(targetUser);
      setCurrentUserState(targetUser);
      window.location.reload();
    } catch (err) {
      alert(`Role switch error: ${(err as Error).message}`);
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: Activity },
    { name: '3D Command Center', href: '/command-center', icon: Compass },
    { name: 'AI Intake', href: '/intake', icon: Cpu },
    { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
    { name: 'Work Orders', href: '/work-orders', icon: Wrench },
    { name: 'Room Bookings', href: '/bookings', icon: Calendar },
    { name: 'Parts & Procurement', href: '/inventory', icon: Package },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#090a0f]/80 border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white flex items-center space-x-2">
                  <span>CampusOps</span>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    SRM
                  </span>
                </span>
                <p className="text-[11px] text-slate-400 leading-none">Intelligent Operations Twin</p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 pl-4 border-l border-white/[0.08]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-white/[0.12] text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Section: Status Indicator & Role Switcher */}
          <div className="flex items-center space-x-3">
            {/* Real-time Status Badge */}
            <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px]">
              <span className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-400'}`} />
              <span className="text-slate-300 font-medium">
                {serverOnline ? 'FastAPI Operational' : 'Offline Engine'}
              </span>
            </div>

            {/* Role Switcher Pill */}
            <div className="relative flex items-center bg-[#11131a] border border-white/[0.1] rounded-xl p-1 shadow-sm hover:border-white/[0.2] transition-colors">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                {getInitials(currentUser.name)}
              </div>
              <div className="hidden md:block pl-2 pr-1 text-left">
                <div className="text-xs font-semibold text-slate-200 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-400 capitalize">
                  {currentUser.role.replace('_', ' ')}
                </div>
              </div>
              <select
                value={currentUser.email}
                onChange={handleRoleChange}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                title="Switch active demonstration role"
              >
                {PRESET_USERS.map((u) => (
                  <option key={u.email} value={u.email}>
                    {u.name} — {u.role.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex overflow-x-auto py-2 px-4 space-x-1.5 border-t border-white/[0.06] bg-[#090a0f]/90 text-xs">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                isActive ? 'bg-white/[0.12] text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
