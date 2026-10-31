'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Building2, 
  Activity, 
  Compass, 
  Cpu, 
  AlertTriangle, 
  Wrench, 
  Calendar, 
  Package, 
  ChevronDown, 
  Bell, 
  X, 
  LogOut, 
  KeyRound, 
  ArrowRight, 
  Menu, 
  CheckCircle2, 
  User,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { getActiveUser, logoutUser, UserPreset } from '@/lib/api';
import { ROLE_HIERARCHY, isRouteAllowed } from '@/lib/rbac';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserPreset | null>(null);
  const [mounted, setMounted] = useState(false);
  const [serverOnline, setServerOnline] = useState<boolean>(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [clockStr, setClockStr] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const dateFormatted = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const timeFormatted = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setClockStr(`${dateFormatted} • ${timeFormatted}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; message: string } | null>({
    id: 'n-1',
    title: '🚨 Targeted Disruption Relocation',
    message: 'Room TP-204 compromised. Exam relocated to AUD-01 Auditorium.',
  });

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const [notifList, setNotifList] = useState([
    {
      id: 'n-1',
      title: '🚨 Disruption Relocation Scheduled',
      message: 'Room TP-204 compromised. CS301 Midterm Exam relocated to AUD-01 Auditorium.',
      time: '5m ago',
    },
    {
      id: 'n-2',
      title: '⚡ Incident Escalated to Critical',
      message: 'Auditorium Main Hall AC electrical fault escalated. SLA target expedited to 15m.',
      time: '12m ago',
    },
    {
      id: 'n-3',
      title: '✅ Requisition Approved',
      message: 'Purchase request PR-24FE0B approved by Procurement Approver.',
      time: '35m ago',
    },
  ]);

  useEffect(() => {
    setMounted(true);
    const user = getActiveUser();
    setCurrentUser(user);

    const checkHealth = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/health', { method: 'GET' });
        setServerOnline(res.ok);
      } catch {
        setServerOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 20000);
    return () => clearInterval(interval);
  }, [pathname]);

  // Auto-dismiss floating targeted alert toast after 4.5 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  // Close popovers on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        setNotificationsOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    setUserMenuOpen(false);
    logoutUser();
    setCurrentUser(null);
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Base list of platform navigation items
  const allNavItems = [
    { 
      name: 'Dashboard', 
      href: '/', 
      icon: Activity, 
      roles: ['facilities_admin', 'dept_manager', 'procurement_approver', 'system_admin'] 
    },
    { 
      name: 'AI Intake', 
      href: '/intake', 
      icon: Cpu, 
      roles: ['student', 'faculty', 'facilities_admin', 'technician', 'dept_manager', 'system_admin'],
      labelForStudent: 'Make Complaint' 
    },
    { 
      name: 'Incidents', 
      href: '/incidents', 
      icon: AlertTriangle, 
      roles: ['student', 'faculty', 'technician', 'facilities_admin', 'dept_manager', 'procurement_approver', 'system_admin'],
      labelForStudent: 'My Complaints' 
    },
    { 
      name: '3D Command Center', 
      href: '/command-center', 
      icon: Compass, 
      roles: ['facilities_admin', 'technician', 'dept_manager', 'student', 'faculty', 'system_admin'],
      labelForStudent: 'Campus Map' 
    },
    { 
      name: 'Work Orders', 
      href: '/work-orders', 
      icon: Wrench, 
      roles: ['facilities_admin', 'technician', 'system_admin'] 
    },
    { 
      name: 'Room Bookings', 
      href: '/bookings', 
      icon: Calendar, 
      roles: ['facilities_admin', 'dept_manager', 'system_admin'] 
    },
    { 
      name: 'Parts & Procurement', 
      href: '/inventory', 
      icon: Package, 
      roles: ['facilities_admin', 'procurement_approver', 'dept_manager', 'system_admin'] 
    },
  ];

  // Dynamic nav filtering strictly by role
  const userRole = currentUser?.role || '';
  const filteredNavItems = currentUser 
    ? allNavItems
        .filter(item => item.roles.includes(userRole) || userRole === 'system_admin')
        .map(item => ({
          ...item,
          name: (userRole === 'student' || userRole === 'faculty') && item.labelForStudent 
            ? item.labelForStudent 
            : item.name
        }))
    : [];

  const roleMeta = ROLE_HIERARCHY[userRole] || {
    label: userRole.replace('_', ' ') || 'Guest',
    badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
    color: 'text-slate-300',
    description: 'Campus User',
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0D0D0D]/90 backdrop-blur-md border-b border-white/[0.08] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-6">
            <Link 
              href={currentUser?.role === 'student' ? '/intake' : '/'} 
              className="flex items-center space-x-3 group rounded-lg focus-ring py-1 px-1"
              aria-label="CampusOps Home"
            >
              <div className="w-9 h-9 rounded-xl bg-[#1A1A1A] border border-white/[0.12] flex items-center justify-center text-[#BFF549] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] group-hover:scale-105 transition-transform duration-200">
                <Building2 className="w-5 h-5 text-[#BFF549]" />
              </div>
              <div className="text-left">
                <div className="flex items-center space-x-2">
                  <span className="text-base font-bold tracking-tight text-white">CampusOps</span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#BFF549]/10 text-[#BFF549] border border-[#BFF549]/30">
                    SRI KRISHNA
                  </span>
                </div>
                <p className="text-[11px] text-white/50 font-medium leading-none">Intelligent Operations Twin</p>
              </div>
            </Link>

            {/* Desktop Navigation Links (Strictly filtered by role) */}
            {mounted && currentUser && (
              <nav className="hidden lg:flex items-center space-x-1 pl-4 border-l border-white/[0.08]" aria-label="Main Navigation">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 focus-ring ${
                        isActive
                          ? 'bg-[#1A1A1A] text-white border border-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#BFF549]' : 'text-white/50'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right Section: Status Indicator, Notifications & User Profile */}
          <div className="flex items-center space-x-3">
            {/* Live Campus Operations Clock */}
            {mounted && clockStr && (
              <div 
                className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1A1A1A] border border-white/[0.08] text-[11px] text-neutral-300 font-mono"
                title="Synchronized Institutional Operational Clock"
              >
                <Clock className="w-3.5 h-3.5 text-[#BFF549]" />
                <span>{clockStr}</span>
              </div>
            )}

            {/* Real-time Status Badge */}
            <div 
              className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1A1A1A] border border-white/[0.08] text-[11px]"
              title={serverOnline ? 'FastAPI Service Connected' : 'Offline Engine Active'}
            >
              <span className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-[#BFF549] shadow-[0_0_8px_#BFF549]' : 'bg-amber-400'}`} />
              <span className="text-white/80 font-medium">{serverOnline ? 'FastAPI Live' : 'Offline Engine'}</span>
            </div>

            {/* Targeted Notifications Bell (Only when logged in) */}
            {currentUser && (
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setUnreadCount(0);
                  }}
                  className="p-2 rounded-xl bg-[#1A1A1A] hover:bg-[#222222] border border-white/[0.08] text-white/70 hover:text-white relative transition-colors focus-ring cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  aria-label="Targeted notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF2B3A] text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-md">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-84 rounded-2xl bg-[#141414] border border-white/[0.10] shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_16px_40px_rgba(0,0,0,0.8)] z-50 p-3 text-left animate-fade-in space-y-2">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Targeted Notifications</span>
                      <button
                        type="button"
                        onClick={() => { setNotifList([]); setNotificationsOpen(false); }}
                        className="text-[10px] text-white/50 hover:text-[#FF2B3A] transition-colors font-semibold cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {notifList.length === 0 ? (
                        <div className="py-6 text-center text-white/50 text-xs">
                          <CheckCircle2 className="w-5 h-5 mx-auto text-[#BFF549] mb-1" />
                          <span>All alerts cleared</span>
                        </div>
                      ) : (
                        notifList.map((n) => (
                          <div key={n.id} className="p-2.5 rounded-xl bg-[#0D0D0D] border border-white/[0.06] space-y-1 text-xs">
                            <div className="font-bold text-white/90">{n.title}</div>
                            <p className="text-[11px] text-white/60 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Session Profile Menu or Sign In Button */}
            {mounted && currentUser ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2.5 bg-[#1A1A1A] hover:bg-[#222222] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-1.5 pr-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all focus-ring cursor-pointer"
                  aria-expanded={userMenuOpen}
                  aria-label={`Logged in as ${currentUser.name}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-[#BFF549]/15 text-[#BFF549] border border-[#BFF549]/30 flex items-center justify-center font-bold text-xs">
                    {getInitials(currentUser.name)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-semibold text-white leading-tight">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-white/50 font-medium">
                      {roleMeta.label}
                    </div>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/50 transition-transform duration-200 ${userMenuOpen ? 'rotate-180 text-[#BFF549]' : ''}`} />
                </button>

                {/* Profile Popover with Sign Out Action */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#141414] border border-white/[0.10] shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_16px_40px_rgba(0,0,0,0.8)] z-50 p-3 text-left animate-fade-in space-y-3">
                    <div className="p-2.5 rounded-xl bg-[#0D0D0D] border border-white/[0.06] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{currentUser.name}</span>
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#BFF549]/10 text-[#BFF549] border border-[#BFF549]/30">
                          {roleMeta.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-white/60 font-mono truncate">{currentUser.email}</div>
                      {currentUser.department && (
                        <div className="text-[10px] text-white/40 pt-0.5">{currentUser.department}</div>
                      )}
                    </div>

                    <div className="space-y-1 pt-1 border-t border-white/[0.08] text-xs">
                      <Link
                        href="/login"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <KeyRound className="w-4 h-4 text-[#BFF549]" />
                        <span>Switch Account</span>
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-[#FF2B3A] hover:text-white hover:bg-[#FF2B3A]/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-2 px-4 py-2 bg-[#BFF549] hover:bg-[#8CC21F] text-black rounded-xl text-xs font-bold transition-all shadow-[0_2px_12px_rgba(191,245,73,0.35)] active:scale-[0.98]"
              >
                <KeyRound className="w-3.5 h-3.5 text-black" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile Menu Hamburger */}
            {currentUser && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg bg-[#1A1A1A] border border-white/[0.08] text-white/70 hover:text-white focus-ring cursor-pointer"
                aria-label="Toggle mobile menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation (Strictly filtered by role) */}
      {mobileMenuOpen && currentUser && (
        <div className="lg:hidden border-t border-white/[0.08] bg-[#0D0D0D] px-4 pt-3 pb-5 space-y-3 animate-fade-in">
          <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider px-2">
            Navigation ({roleMeta.label})
          </div>
          <div className="grid grid-cols-1 gap-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    isActive 
                      ? 'bg-[#1A1A1A] text-white border border-white/[0.12]' 
                      : 'text-white/70 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#BFF549]' : 'text-white/50'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-white/60">{currentUser.name}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-[#FF2B3A] hover:underline font-semibold flex items-center space-x-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Targeted Alert Toast */}
      {activeToast && currentUser && (
        <div className="fixed top-20 right-5 z-50 bg-[#141414] border border-[#BFF549]/40 text-white p-3.5 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_12px_36px_rgba(0,0,0,0.8)] max-w-sm text-xs animate-fade-in space-y-1.5 backdrop-blur-md">
          <div className="flex items-center justify-between font-bold text-[#BFF549]">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#BFF549] animate-ping" />
              <span>{activeToast.title}</span>
            </span>
            <button
              type="button"
              onClick={() => setActiveToast(null)}
              className="text-white/50 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-white/70 leading-relaxed">{activeToast.message}</p>
        </div>
      )}
    </header>
  );
}
