'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Building2, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { loginWithCredentials, getActiveUser, AUTHORIZED_ACCOUNTS, UserPreset } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDirectory, setShowDirectory] = useState(false);

  // If already logged in, show current session note
  const [existingUser, setExistingUser] = useState<UserPreset | null>(null);

  useEffect(() => {
    const user = getActiveUser();
    if (user) {
      setExistingUser(user);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both your institutional email and password.');
      return;
    }

    setLoading(true);
    try {
      // Real authentication against the backend database credential pool
      const user = await loginWithCredentials(cleanEmail, password);
      
      setSuccessMessage(`Authenticated successfully as ${user.name} (${user.role.replace('_', ' ').toUpperCase()}). Granting access...`);
      
      // Determine landing page according to role permissions
      setTimeout(() => {
        if (redirectPath) {
          router.push(redirectPath);
        } else if (user.role === 'student' || user.role === 'faculty') {
          router.push('/intake'); // Students land on Make Complaints / Track Progress
        } else if (user.role === 'technician') {
          router.push('/work-orders'); // Technicians land on Dispatch Board
        } else {
          router.push('/'); // Administrators & Managers land on Dashboard
        }
      }, 700);
    } catch (err) {
      setErrorMessage(
        (err as Error).message || 
        'Access Denied: Incorrect email or password. Only credentials registered in the campus directory are granted entrance.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUseCredentials = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="max-w-md w-full space-y-6">
        {/* Brand & Heading */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 bg-[#BFF549]/10 border border-[#BFF549]/30 px-3.5 py-1.5 rounded-full shadow-sm mb-1">
            <Building2 className="w-3.5 h-3.5 text-[#BFF549]" />
            <span className="text-[11px] font-bold tracking-wider text-[#BFF549] uppercase">
              SRI KRISHNA CAMPUS OPERATIONS
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Sign In to CampusOps
          </h1>
          <p className="text-xs text-white/50 max-w-sm mx-auto">
            Access to campus facilities and operational workflows is protected. Enter your institutional credentials below to enter.
          </p>
        </div>

        {/* Existing Session Alert */}
        {existingUser && (
          <div className="bg-[#1A1A1A] border border-white/[0.10] rounded-2xl p-3.5 text-xs flex items-center justify-between text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="flex items-center space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-[#BFF549] animate-pulse shadow-[0_0_8px_#BFF549]" />
              <div>
                <span className="text-white/50">Current Session: </span>
                <span className="font-semibold text-white">{existingUser.name}</span>
                <span className="text-[11px] text-[#BFF549] ml-1">({existingUser.role})</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push(existingUser.role === 'student' ? '/intake' : '/')}
              className="text-xs text-[#BFF549] hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Real Authentication Form */}
        <div className="bg-[#1A1A1A] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_12px_40px_rgba(0,0,0,0.7)] relative overflow-hidden backdrop-blur-md">
          {/* Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-16 bg-[#BFF549]/10 blur-2xl pointer-events-none" />

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-[#FF2B3A]/10 border border-[#FF2B3A]/30 text-[#FF2B3A] text-xs flex items-start space-x-2.5 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-[#FF2B3A] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3.5 rounded-xl bg-[#BFF549]/10 border border-[#BFF549]/30 text-[#BFF549] text-xs flex items-start space-x-2.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-[#BFF549] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-white/80">
                Institutional Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. student@campus.edu or admin.facilities@campus.edu"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D0D0D] border border-white/[0.08] text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#BFF549] focus:ring-1 focus:ring-[#BFF549] transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-white/80">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0D0D0D] border border-white/[0.08] text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#BFF549] focus:ring-1 focus:ring-[#BFF549] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button (Glaido Hero Button) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-[#BFF549] hover:bg-[#8CC21F] disabled:opacity-50 text-black rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-[0_2px_14px_rgba(191,245,73,0.35)] transition-all active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <span>Verifying Credentials...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-black" />
                  <span>Sign In to CampusOps</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Collapsible Institutional Account Directory */}
        <div className="bg-[#1A1A1A] border border-white/[0.08] rounded-2xl overflow-hidden text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <button
            type="button"
            onClick={() => setShowDirectory(!showDirectory)}
            className="w-full px-4 py-3 flex items-center justify-between text-white/60 hover:text-white transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-[#BFF549]" />
              <span className="font-semibold text-white/90">Authorized Campus Accounts Pool (Demo Directory)</span>
            </div>
            {showDirectory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDirectory && (
            <div className="px-4 pb-4 pt-1 space-y-2 border-t border-white/[0.08] bg-[#141414] animate-fade-in">
              <p className="text-[11px] text-white/50">
                Click any credential below to fill the login form and verify that role's restricted feature permissions:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleUseCredentials('student@campus.edu', 'student123')}
                  className="p-2.5 rounded-xl bg-[#1A1A1A] border border-white/[0.06] hover:border-[#BFF549]/50 text-left transition-colors cursor-pointer group shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white group-hover:text-[#BFF549]">Student (Aarav)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.06] text-white/80 border border-white/[0.10]">Student</span>
                  </div>
                  <div className="text-[10px] text-white/50 font-mono mt-0.5">student@campus.edu</div>
                  <div className="text-[10px] text-white/40 mt-1">Can make complaints & track progress only. No inventory.</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleUseCredentials('tech.rajesh@campus.edu', 'tech123')}
                  className="p-2.5 rounded-xl bg-[#1A1A1A] border border-white/[0.06] hover:border-[#BFF549]/50 text-left transition-colors cursor-pointer group shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white group-hover:text-[#BFF549]">Field Tech (Rajesh)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">Technician</span>
                  </div>
                  <div className="text-[10px] text-white/50 font-mono mt-0.5">tech.rajesh@campus.edu</div>
                  <div className="text-[10px] text-white/40 mt-1">Work orders & field repairs only. No bookings/approvals.</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleUseCredentials('manager@campus.edu', 'manager123')}
                  className="p-2.5 rounded-xl bg-[#1A1A1A] border border-white/[0.06] hover:border-[#BFF549]/50 text-left transition-colors cursor-pointer group shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white group-hover:text-[#BFF549]">Dept Manager (Dr. Raman)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">Manager</span>
                  </div>
                  <div className="text-[10px] text-white/50 font-mono mt-0.5">manager@campus.edu</div>
                  <div className="text-[10px] text-white/40 mt-1">Room bookings & requisitions. Cannot self-approve.</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleUseCredentials('approver.finance@campus.edu', 'approver123')}
                  className="p-2.5 rounded-xl bg-[#1A1A1A] border border-white/[0.06] hover:border-[#BFF549]/50 text-left transition-colors cursor-pointer group shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white group-hover:text-[#BFF549]">Procurement (Sunita)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Finance</span>
                  </div>
                  <div className="text-[10px] text-white/50 font-mono mt-0.5">approver.finance@campus.edu</div>
                  <div className="text-[10px] text-white/40 mt-1">Approve/reject parts purchase requisitions.</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleUseCredentials('admin.facilities@campus.edu', 'admin123')}
                  className="p-2.5 rounded-xl bg-[#1A1A1A] border border-white/[0.06] hover:border-[#BFF549]/50 text-left transition-colors cursor-pointer group shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white group-hover:text-[#BFF549]">Facilities Admin (Karthik)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">Operations</span>
                  </div>
                  <div className="text-[10px] text-white/50 font-mono mt-0.5">admin.facilities@campus.edu</div>
                  <div className="text-[10px] text-white/40 mt-1">Full operational dispatch, triage & twin controls.</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleUseCredentials('sysadmin@campus.edu', 'sysadmin123')}
                  className="p-2.5 rounded-xl bg-[#1A1A1A] border border-white/[0.06] hover:border-[#BFF549]/50 text-left transition-colors cursor-pointer group shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white group-hover:text-[#BFF549]">System Admin (DevOps)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">Super Admin</span>
                  </div>
                  <div className="text-[10px] text-white/50 font-mono mt-0.5">sysadmin@campus.edu</div>
                  <div className="text-[10px] text-white/40 mt-1">All features, settings, system health & overrides.</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
