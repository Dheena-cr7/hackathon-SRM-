'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  Wrench, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Package, 
  Layers, 
  ArrowRight, 
  Building2, 
  ShieldAlert, 
  TrendingUp, 
  Cpu,
  Compass,
  Zap,
  Activity,
  CheckCircle
} from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

interface OverviewMetrics {
  incidents: {
    total: number;
    active: number;
    by_status: Record<string, number>;
    by_severity: Record<string, number>;
    sla_breaches: number;
  };
  work_orders: {
    total: number;
    active: number;
    by_status: Record<string, number>;
  };
  facilities: {
    total_buildings: number;
    total_rooms: number;
    active_bookings: number;
  };
  inventory: {
    total_items: number;
    low_stock_items: number;
    pending_purchases: number;
  };
  sla_compliance_rate: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [overviewData, bldData, incData] = await Promise.all([
        fetchWithAuth('/analytics/overview'),
        fetchWithAuth('/campus/buildings'),
        fetchWithAuth('/incidents'),
      ]);
      setMetrics(overviewData);
      setBuildings(bldData);
      setRecentIncidents(incData.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Executive Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#11131a] via-[#141824] to-[#0c101d] border border-white/[0.08] shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-xs font-medium text-blue-400 mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Autonomous Operational Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Campus Operational Reality
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            SRM Institute of Science & Technology · Kattankulathur Campus. Real-time incident intake, deterministic state machine triage, and procedural 3D spatial coordination.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Link
            href="/intake"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-150 hover:scale-[1.02]"
          >
            <AlertTriangle className="w-4 h-4 text-white" />
            <span>Report Incident</span>
          </Link>
          <Link
            href="/command-center"
            className="inline-flex items-center space-x-2 bg-white/[0.06] hover:bg-white/[0.1] text-slate-100 text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/[0.12] transition-all duration-150"
          >
            <Compass className="w-4 h-4 text-blue-400" />
            <span>Open 3D Twin</span>
          </Link>
        </div>

        {/* Subtle decorative background glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Telemetry Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Incidents */}
        <div className="card-glass p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Active Incidents</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/25 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white tabular-nums tracking-tight">
              {metrics ? metrics.incidents.active : '—'}
            </span>
            <span className="text-xs text-slate-400">/ {metrics ? metrics.incidents.total : '—'} logged</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs border-t border-white/[0.06] pt-3">
            <span className="text-rose-400 font-medium flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5 inline" />
              <span>{metrics ? metrics.incidents.sla_breaches : 0} Breaches</span>
            </span>
            <Link href="/incidents" className="text-blue-400 hover:text-blue-300 flex items-center space-x-1 font-medium">
              <span>Queue</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Work Orders */}
        <div className="card-glass p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Work Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/25 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white tabular-nums tracking-tight">
              {metrics ? metrics.work_orders.active : '—'}
            </span>
            <span className="text-xs text-slate-400">in dispatch</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs border-t border-white/[0.06] pt-3">
            <span className="text-slate-300">
              {metrics ? metrics.work_orders.by_status.in_progress || 0 : 0} in progress
            </span>
            <Link href="/work-orders" className="text-blue-400 hover:text-blue-300 flex items-center space-x-1 font-medium">
              <span>Dispatch</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* SLA Compliance */}
        <div className="card-glass p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">SLA Performance</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-400 tabular-nums tracking-tight">
              {metrics ? `${metrics.sla_compliance_rate.toFixed(1)}%` : '—'}
            </span>
            <span className="text-xs text-slate-400">target 95%</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs border-t border-white/[0.06] pt-3">
            <span className="text-emerald-400 font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 inline" />
              <span>Deterministic Gate</span>
            </span>
            <span className="text-slate-500 font-mono text-[11px]">Online</span>
          </div>
        </div>

        {/* Inventory & Parts */}
        <div className="card-glass p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Stock & Approvals</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white tabular-nums tracking-tight">
              {metrics ? metrics.inventory.low_stock_items : '—'}
            </span>
            <span className="text-xs text-amber-400">low stock items</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs border-t border-white/[0.06] pt-3">
            <span className="text-slate-300 font-medium">
              {metrics ? metrics.inventory.pending_purchases : 0} pending PRs
            </span>
            <Link href="/inventory" className="text-blue-400 hover:text-blue-300 flex items-center space-x-1 font-medium">
              <span>Inventory</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Operational Stream vs Campus Facility Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Incident Stream */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span>Live Operations & Incident Stream</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time multi-channel tickets processed by Layer 1 deterministic AI
              </p>
            </div>
            <Link
              href="/incidents"
              className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            >
              <span>View all tickets</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentIncidents.length === 0 ? (
              <div className="card-glass p-8 text-center text-xs text-slate-400 rounded-2xl">
                No active incidents reported. All campus facilities are operating normally.
              </div>
            ) : (
              recentIncidents.map((inc) => {
                const isCritical = inc.severity === 'critical';
                const isHigh = inc.severity === 'high';

                return (
                  <div
                    key={inc.id}
                    className="card-glass-interactive p-4 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-white">
                          {inc.incident_number}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isCritical
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : isHigh
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                        }`}>
                          {inc.severity}
                        </span>
                        <span className="text-xs text-slate-400 hidden sm:inline capitalize">
                          · {inc.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-200 truncate">
                        {inc.title}
                      </h3>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Building2 className="w-3 h-3 text-slate-500" />
                          <span>{inc.building_name || 'Tech Park'} {inc.room_number ? `(Rm ${inc.room_number})` : ''}</span>
                        </span>
                        <span>·</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/incidents?focus=${inc.id}`}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs font-semibold text-slate-200 whitespace-nowrap transition-colors"
                    >
                      Inspect
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Campus Facilities Matrix */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>SRM Kattankulathur Facilities</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic health state mapped to the 3D twin
              </p>
            </div>
            <Link
              href="/command-center"
              className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            >
              <span>3D Twin</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {buildings.map((bld) => {
              const isDegraded = bld.status === 'maintenance' || bld.status === 'disrupted';
              const isClosed = bld.status === 'closed';

              return (
                <div
                  key={bld.id}
                  className="card-glass p-3.5 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] font-bold text-blue-400">
                        {bld.code}
                      </span>
                      <h4 className="font-semibold text-slate-200 text-xs truncate">
                        {bld.name}
                      </h4>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                      <span>{bld.total_floors} Floors</span>
                      <span>·</span>
                      <span className={bld.active_incidents_count > 0 ? 'text-amber-400 font-medium' : 'text-slate-400'}>
                        {bld.active_incidents_count} active tickets
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                    isClosed
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : isDegraded
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {bld.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
