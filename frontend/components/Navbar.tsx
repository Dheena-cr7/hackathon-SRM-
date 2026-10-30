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
  ShieldCheck,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { PRESET_USERS, getActiveUser, setActiveUser, loginAs, UserPreset } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUserState] = useState<UserPreset>(PRESET_USERS[0]);
  const [switching, setSwitching] = useState(false);
  const [serverOnline, setServerOnline] = useState<boolean>(true);

  useEffect(() => {
    const user = getActiveUser();
    setCurrentUserState(user);
    loginAs(user).catch(() => setServerOnline(false));

    // Periodic heartbeat to verify offline/local runtime
    const interval = setInterval(async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/health');
        setServerOnline(res.ok);
      } catch {
        setServerOnline(false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEmail = e.target.value;
    const targetUser = PRESET_USERS.find(u => u.email === selectedEmail);
    if (!targetUser) return;
    setSwitching(true);
    try {
      await loginAs(targetUser);
      setCurrentUserState(targetUser);
      window.location.reload();
    } catch (err) {
      alert(`Role switch error: ${(err as Error).message}`);
    } finally {
      setSwitching(false);
    }
  };

  const navItems = [
    { name: 'Command Center (3D)', href: '/command-center', icon: Layers },
    { name: 'Dashboard', href: '/', icon: Activity },
    { name: 'AI Intake', href: '/intake', icon: Cpu },
    { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
    { name: 'Work Orders', href: '/work-orders', icon: Wrench },
    { name: 'Room Bookings', href: '/bookings', icon: Calendar },
    { name: 'Parts & Approvals', href: '/inventory', icon: Package },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50 shadow-md">
      {/* Top Banner / System Ribbon */}
      <div className="bg-slate-950 px-4 py-1 text-xs text-slate-400 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1 font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            <span>Zero-Cost Runtime</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="hidden sm:inline">100% Offline Capable</span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="hidden md:inline">Deterministic AI Layer 1 Active</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${serverOnline ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-rose-950/80 text-rose-300 border border-rose-800'}`}>
            {serverOnline ? 'FastAPI Operational :8000' : 'Backend Disconnected'}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono text-[11px]">SRM-IST Kattankulathur</span>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20 group-hover:bg-blue-500 transition-colors">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white flex items-center space-x-1.5">
                  <span>CampusOps</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-900/80 text-blue-300 border border-blue-700/60">v1.0</span>
                </span>
                <p className="text-[11px] text-slate-400 leading-none">Intelligent Operations Twin</p>
              </div>
            </Link>
          </div>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Role Switcher */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
              <UserCheck className="w-4 h-4 text-blue-400 hidden sm:block ml-1" />
              <div className="text-right hidden sm:block pr-1">
                <div className="text-xs font-semibold text-slate-200 leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-blue-400 uppercase font-mono tracking-wider">{currentUser.role.replace('_', ' ')}</div>
              </div>
              <select
                value={currentUser.email}
                onChange={handleRoleChange}
                disabled={switching}
                className="bg-slate-900 text-xs text-slate-200 rounded px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer"
                title="Switch active user role"
              >
                {PRESET_USERS.map((u) => (
                  <option key={u.email} value={u.email}>
                    {u.name} ({u.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav Sub-row */}
      <div className="lg:hidden flex overflow-x-auto py-2 px-4 space-x-2 border-t border-slate-800 bg-slate-950/60 text-xs">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded whitespace-nowrap font-medium ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
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

