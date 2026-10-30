'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ShieldAlert, 
  ArrowRight, 
  KeyRound,
  Lock,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { getActiveUser, UserPreset } from '@/lib/api';
import { ROLE_HIERARCHY, isRouteAllowed } from '@/lib/rbac';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  pageName?: string;
}

export default function RoleGuard({ children, allowedRoles, pageName }: RoleGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserPreset | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = getActiveUser();
    setCurrentUser(user);
  }, [pathname]);

  // SSR or initial hydration
  if (!mounted) {
    return <>{children}</>;
  }

  // 1. Not Authenticated: Prompt to log in
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 animate-fade-in text-center">
        <div className="bg-[#1A1A1A] border border-white/[0.08] rounded-3xl p-8 sm:p-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_12px_40px_rgba(0,0,0,0.7)] relative overflow-hidden backdrop-blur-md space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#BFF549]/10 border border-[#BFF549]/30 text-[#BFF549] mx-auto flex items-center justify-center shadow-lg shadow-black/40">
            <Lock className="w-8 h-8 text-[#BFF549]" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#BFF549]/10 border border-[#BFF549]/30 text-xs font-semibold text-[#BFF549]">
              <Building2 className="w-3.5 h-3.5" />
              <span>Sri Krishna Campus Operations</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Authentication Required
            </h2>
            <p className="text-white/50 text-xs max-w-sm mx-auto leading-relaxed">
              Please enter your institutional email and password to access the platform.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname)}`}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#BFF549] hover:bg-[#8CC21F] text-black rounded-xl text-xs font-bold transition-all shadow-[0_2px_14px_rgba(191,245,73,0.35)] active:scale-[0.98]"
            >
              <KeyRound className="w-4 h-4 text-black" />
              <span>Sign In to Continue</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const userRole = currentUser.role || 'student';
  const roleDef = ROLE_HIERARCHY[userRole] || ROLE_HIERARCHY.student;

  // 2. Evaluate Role Authorization
  const authorized = allowedRoles 
    ? (roleDef.level >= 5 || allowedRoles.includes(userRole))
    : isRouteAllowed(userRole, pathname);

  if (authorized) {
    return <>{children}</>;
  }

  // 3. Authenticated but Unauthorized for this specific module
  const displayName = pageName || pathname.replace('/', '').toUpperCase() || 'THIS MODULE';

  // Role-specific explanation
  let roleExplanation = `Your account role (${roleDef.label}) is not authorized to access ${displayName}.`;
  if (userRole === 'student' || userRole === 'faculty') {
    roleExplanation = 'As a student, your access is limited to making maintenance complaints and tracking the progress of your submitted issues. Administrative inventory, technician dispatch, and classroom booking controls are restricted.';
  } else if (userRole === 'technician') {
    roleExplanation = 'Technicians have operational clearance for field work orders and incident investigation, but cannot access procurement approvals or academic room bookings.';
  } else if (userRole === 'dept_manager') {
    roleExplanation = 'Department managers oversee classroom bookings and purchase requests, but technician dispatch queues are reserved for facilities operations.';
  } else if (userRole === 'procurement_approver') {
    roleExplanation = 'Procurement approvers verify inventory and approve purchase requests, but technician dispatch and classroom bookings are restricted.';
  }

  // Determine user's primary allowed portal
  const homePath = (userRole === 'student' || userRole === 'faculty') 
    ? '/intake' 
    : userRole === 'technician' 
    ? '/work-orders' 
    : '/';

  return (
    <div className="max-w-2xl mx-auto py-20 px-4 animate-fade-in text-center">
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md space-y-6">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-16 bg-rose-500/10 blur-2xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center shadow-lg shadow-rose-950/40">
          <ShieldAlert className="w-8 h-8 text-rose-400" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-xs font-semibold text-rose-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Role-Based Access Control</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Access Restricted: {displayName}
          </h2>
          <p className="text-slate-400 text-xs max-w-lg mx-auto leading-relaxed">
            {roleExplanation}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 max-w-md mx-auto text-left flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Current Signed In User:</span>
            <span className="text-white font-bold">{currentUser.name}</span>
            <span className="text-slate-400 font-mono text-[11px] block">{currentUser.email}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${roleDef.badgeBg}`}>
            {roleDef.label}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href={homePath}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md active:scale-[0.98]"
          >
            <span>Go to My Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 border border-slate-700 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-blue-400" />
            <span>Switch Account</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
