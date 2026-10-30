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
  Cpu
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [overviewData, bldData] = await Promise.all([
        fetchWithAuth('/analytics/overview'),
        fetchWithAuth('/campus/buildings'),
      ]);
      setMetrics(overviewData);
      setBuildings(bldData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
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
    <div className="space-y-6">
      {/* Hero / Quick Nav */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-blue-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-blue-900/60 border border-blue-700/50 text-[11px] font-medium text-blue-300 mb-2">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Autonomous Layer 1 Triage & Real-Time Coordination</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Campus Operations Center
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            SRM Institute of Science & Technology operations control. Zero external API fees, 100% offline-ready, verifiable deterministic state machines.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/intake"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-md transition-all"
          >
            <AlertTriangle className="w-4 h-4 text-white" />
            <span>Report Incident</span>
          </Link>
          <Link
            href="/command-center"
            className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold px-4 py-2.5 rounded-lg border border-slate-700 shadow-md transition-all"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Open 3D Twin</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-200 text-xs flex items-center justify-between">
          <span>Backend status warning: {error}. Retrying automatically...</span>
          <button onClick={loadData} className="underline font-semibold hover:text-white">Refresh Now</button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Incidents */}
        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Incidents</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-white">
              {metrics ? metrics.incidents.active : '—'}
            </span>
            <span className="text-xs text-slate-400">/ {metrics ? metrics.incidents.total : '—'} total</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span className="text-rose-400 font-medium flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5 inline" />
              <span>{metrics ? metrics.incidents.sla_breaches : 0} SLA Breaches</span>
            </span>
            <Link href="/incidents" className="text-blue-400 hover:text-blue-300 flex items-center space-x-0.5">
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Work Orders */}
        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Open Work Orders</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-white">
              {metrics ? metrics.work_orders.active : '—'}
            </span>
            <span className="text-xs text-slate-400">in dispatch</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span>{metrics ? metrics.work_orders.by_status.in_progress || 0 : 0} in progress</span>
            <Link href="/work-orders" className="text-blue-400 hover:text-blue-300 flex items-center space-x-0.5">
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* SLA Compliance */}
        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">SLA Compliance</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-emerald-400">
              {metrics ? `${metrics.sla_compliance_rate.toFixed(1)}%` : '—'}
            </span>
            <span className="text-xs text-slate-400">target &gt; 95%</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span className="text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 inline" />
              <span>Deterministic Policy</span>
            </span>
            <span className="text-slate-500 font-mono text-[11px]">Real-time</span>
          </div>
        </div>

        {/* Inventory & Parts */}
        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Inventory & Approvals</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-white">
              {metrics ? metrics.inventory.low_stock_items : '—'}
            </span>
            <span className="text-xs text-amber-400">low stock items</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span className="text-amber-300 font-medium">
              {metrics ? metrics.inventory.pending_purchases : 0} pending PRs
            </span>
            <Link href="/inventory" className="text-blue-400 hover:text-blue-300 flex items-center space-x-0.5">
              <span>Review</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Buildings Status Overview */}
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              <span>Campus Facilities & Building Operational Health</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Derived dynamically from active incidents and ongoing maintenance across SRM campus
            </p>
          </div>
          <Link
            href="/command-center"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1"
          >
            <span>View 3D Campus Twin</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {buildings.map((bld) => {
            const isDegraded = bld.status === 'maintenance' || bld.status === 'disrupted';
            const isClosed = bld.status === 'closed';
            const statusColor = isClosed
              ? 'bg-rose-500/10 border-rose-800/60 text-rose-300'
              : isDegraded
              ? 'bg-amber-500/10 border-amber-800/60 text-amber-300'
              : 'bg-emerald-500/10 border-emerald-800/60 text-emerald-300';
            
            return (
              <div
                key={bld.id}
                className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase">{bld.code}</span>
                    <h3 className="font-semibold text-slate-100 text-sm">{bld.name}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${statusColor}`}>
                    {bld.status}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
                  <div>
                    <span className="block text-[10px] text-slate-500">Floors</span>
                    <span className="font-medium text-slate-300">{bld.total_floors} Levels</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">Active Incidents</span>
                    <span className={`font-medium ${bld.active_incidents_count > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {bld.active_incidents_count} active
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

