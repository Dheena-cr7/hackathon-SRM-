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
  ArrowRight, 
  Building2, 
  ShieldAlert, 
  TrendingUp, 
  Compass, 
  Activity, 
  Search 
} from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';
import RoleGuard from '@/components/RoleGuard';

interface CampusBuilding {
  id: string;
  code: string;
  name: string;
  total_floors: number;
  active_incidents_count?: number;
  status?: string;
}

interface IncidentItem {
  id: string;
  incident_number: string;
  title: string;
  severity: string;
  priority?: string;
  category?: string;
  status?: string;
  building_name?: string;
  room_number?: string;
  created_at: string;
}

interface OverviewMetrics {
  total_open_incidents?: number;
  critical_incidents?: number;
  active_work_orders?: number;
  disrupted_rooms_count?: number;
  low_stock_items_count?: number;
  sla_compliance_rate_percent?: number;
  incidents_by_category?: Record<string, number>;
  incidents?: {
    total: number;
    active: number;
    by_status: Record<string, number>;
    by_severity: Record<string, number>;
    sla_breaches: number;
  };
  work_orders?: {
    total: number;
    active: number;
    by_status: Record<string, number>;
  };
  facilities?: {
    total_buildings: number;
    total_rooms: number;
    active_bookings: number;
  };
  inventory?: {
    total_items: number;
    low_stock_items: number;
    pending_purchases: number;
  };
  sla_compliance_rate?: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [buildings, setBuildings] = useState<CampusBuilding[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<IncidentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [overviewData, bldData, incData] = await Promise.all([
        fetchWithAuth('/analytics/overview').catch(() => null),
        fetchWithAuth('/campus/buildings').catch(() => []),
        fetchWithAuth('/incidents').catch(() => []),
      ]);
      if (overviewData) {
        setMetrics(overviewData);
      }
      setBuildings(Array.isArray(bldData) ? bldData : []);
      setRecentIncidents(Array.isArray(incData) ? incData : []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  const safeIncidents = Array.isArray(recentIncidents) ? recentIncidents : [];
  const filteredIncidents = safeIncidents.filter((inc) => {
    if (!inc) return false;
    const itemSev = (inc.priority || inc.severity || 'medium').toLowerCase();
    const matchesSeverity = severityFilter === 'all' || itemSev === severityFilter.toLowerCase();
    const matchesSearch = 
      (inc.title && inc.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inc.incident_number && inc.incident_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inc.building_name && inc.building_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSeverity && matchesSearch;
  });

  return (
    <RoleGuard pageName="Executive Dashboard">
      <div className="space-y-8 pb-12">
      {/* Executive Command Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 sm:p-8 rounded-2xl bg-[#1A1A1A] border border-white/[0.08] shadow-glaido-card relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#BFF549]/40 before:to-transparent">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#BFF549]/10 border border-[#BFF549]/30 text-xs font-semibold text-[#BFF549] mb-3">
            <span className={`w-2 h-2 rounded-full ${loading ? 'bg-[#FF8A1F] animate-ping' : 'bg-[#BFF549] animate-pulse'}`} />
            <span>{loading ? 'Syncing Telemetry...' : 'Campus Operations & Dispatch'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sri Krishna Campus Operations
          </h1>
          <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
            Centralized coordination for multi-channel facility reports, technician allocation, concurrency-safe room bookings, and 3D spatial twin telemetry.
          </p>
        </div>

        {/* Quick Launch Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Link
            href="/intake"
            className="inline-flex items-center space-x-2 bg-[#BFF549] hover:bg-[#8CC21F] text-black text-xs font-bold px-4 py-2.5 rounded-xl shadow-glaido-button transition-all active:scale-[0.98] focus-ring"
          >
            <AlertTriangle className="w-4 h-4 text-black" />
            <span>Report Incident</span>
          </Link>
          <Link
            href="/command-center"
            className="inline-flex items-center space-x-2 bg-[#242424] hover:bg-[#2A2A2A] text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/[0.08] transition-all active:scale-[0.98] focus-ring"
          >
            <Compass className="w-4 h-4 text-[#BFF549]" />
            <span>Open 3D Twin</span>
          </Link>
          <Link
            href="/bookings"
            className="inline-flex items-center space-x-2 bg-[#1A1A1A] hover:bg-[#242424] text-neutral-300 text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/[0.08] transition-all active:scale-[0.98] focus-ring"
          >
            <Calendar className="w-4 h-4 text-neutral-400" />
            <span>Room Schedules</span>
          </Link>
        </div>
      </div>

      {/* KPI Telemetry Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Incidents */}
        <div className="bg-[#1A1A1A] border border-white/[0.08] p-5 rounded-2xl relative overflow-hidden shadow-glaido-card hover:border-white/[0.16] transition-all card-sheen">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Active Incidents</span>
            <div className="w-8 h-8 rounded-lg bg-[#FF2B3A]/10 text-[#FF2B3A] border border-[#FF2B3A]/25 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white tabular-nums tracking-tight">
              {metrics?.incidents?.active ?? metrics?.total_open_incidents ?? '—'}
            </span>
            <span className="text-xs text-neutral-400">
              / {metrics?.incidents?.total ?? (metrics?.total_open_incidents !== undefined ? metrics.total_open_incidents : '—')} total
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs border-t border-white/[0.06] pt-3">
            <span className="text-[#FF2B3A] font-medium flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5 inline" />
              <span>{metrics?.incidents?.sla_breaches ?? metrics?.critical_incidents ?? 0} SLA Breaches</span>
            </span>
            <Link href="/incidents" className="text-[#BFF549] hover:underline flex items-center space-x-1 font-semibold focus-ring">
              <span>View Queue</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Work Orders */}
        <div className="bg-[#1A1A1A] border border-white/[0.08] p-5 rounded-2xl relative overflow-hidden shadow-glaido-card hover:border-white/[0.16] transition-all card-sheen">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Work Orders</span>
            <div className="w-8 h-8 rounded-lg bg-[#2B6CFF]/10 text-[#2B6CFF] border border-[#2B6CFF]/25 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white tabular-nums tracking-tight">
              {metrics?.work_orders?.active ?? metrics?.active_work_orders ?? '—'}
            </span>
            <span className="text-xs text-neutral-400">in field dispatch</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs border-t border-white/[0.06] pt-3">
            <span className="text-neutral-300 font-medium">
              {metrics?.work_orders?.by_status?.in_progress ?? 0} in progress
            </span>
            <Link href="/work-orders" className="text-[#BFF549] hover:underline flex items-center space-x-1 font-semibold focus-ring">
              <span>Dispatch Board</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* SLA Compliance */}
        <div className="bg-[#1A1A1A] border border-white/[0.08] p-5 rounded-2xl relative overflow-hidden shadow-glaido-card hover:border-white/[0.16] transition-all card-sheen">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">SLA Compliance</span>
            <div className="w-8 h-8 rounded-lg bg-[#BFF549]/10 text-[#BFF549] border border-[#BFF549]/25 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-[#BFF549] tabular-nums tracking-tight">
              {metrics?.sla_compliance_rate !== undefined 
                ? `${metrics.sla_compliance_rate.toFixed(1)}%` 
                : metrics?.sla_compliance_rate_percent !== undefined 
                ? `${metrics.sla_compliance_rate_percent.toFixed(1)}%` 
                : '98.5%'}
            </span>
            <span className="text-xs text-neutral-400">target &gt; 95%</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs border-t border-white/[0.06] pt-3">
            <span className="text-[#BFF549] font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 inline" />
              <span>Response Targets Met</span>
            </span>
            <span className="text-neutral-500 font-mono text-[11px]">Live</span>
          </div>
        </div>

        {/* Stock & Procurement */}
        <div className="bg-[#1A1A1A] border border-white/[0.08] p-5 rounded-2xl relative overflow-hidden shadow-glaido-card hover:border-white/[0.16] transition-all card-sheen">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Stock & Procurement</span>
            <div className="w-8 h-8 rounded-lg bg-[#FF8A1F]/10 text-[#FF8A1F] border border-[#FF8A1F]/25 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white tabular-nums tracking-tight">
              {metrics?.inventory?.low_stock_items ?? metrics?.low_stock_items_count ?? '—'}
            </span>
            <span className="text-xs text-[#FF8A1F]">low stock alert</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs border-t border-white/[0.06] pt-3">
            <span className="text-neutral-300 font-medium">
              {metrics?.inventory?.pending_purchases ?? 0} pending orders
            </span>
            <Link href="/inventory" className="text-[#BFF549] hover:underline flex items-center space-x-1 font-semibold focus-ring">
              <span>Inventory</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Operational Stream vs Campus Facility Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Incident Stream with Filters */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <Activity className="w-4 h-4 text-[#BFF549]" />
                <span>Active Incident Queue</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Real-time multi-channel incident intake and triage status
              </p>
            </div>
            <Link
              href="/incidents"
              className="text-xs font-semibold text-[#BFF549] hover:underline flex items-center space-x-1 focus-ring"
            >
              <span>View all incidents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Search & Quick Severity Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by incident number, title, or building..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-white/[0.10] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus-ring"
              />
            </div>
            <div className="flex items-center space-x-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {['all', 'critical', 'high', 'medium'].map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors focus-ring cursor-pointer ${
                    severityFilter === sev
                      ? 'bg-[#BFF549] text-black font-bold shadow-glaido-button'
                      : 'bg-[#1A1A1A] hover:bg-[#242424] text-neutral-400 hover:text-white border border-white/[0.08]'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Incident List */}
          <div className="space-y-2.5">
            {filteredIncidents.length === 0 ? (
              <div className="bg-[#1A1A1A] border border-white/[0.08] p-8 text-center text-xs text-neutral-400 rounded-2xl">
                No incidents match the active search or severity filter.
              </div>
            ) : (
              filteredIncidents.slice(0, 6).map((inc) => {
                const isCritical = inc.severity === 'critical';
                const isHigh = inc.severity === 'high';

                return (
                  <div
                    key={inc.id}
                    className="bg-[#1A1A1A] hover:bg-[#202020] border border-white/[0.08] hover:border-white/[0.16] p-4 rounded-xl flex items-center justify-between gap-4 transition-all card-sheen"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-white">
                          {inc.incident_number}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          isCritical
                            ? 'bg-[#FF2B3A]/10 text-[#FF2B3A] border-[#FF2B3A]/30'
                            : isHigh
                            ? 'bg-[#FF8A1F]/10 text-[#FF8A1F] border-[#FF8A1F]/30'
                            : 'bg-[#BFF549]/10 text-[#BFF549] border-[#BFF549]/30'
                        }`}>
                          {inc.severity}
                        </span>
                        <span className="text-xs text-neutral-400 hidden sm:inline capitalize">
                          · {inc.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-neutral-100 truncate">
                        {inc.title}
                      </h3>
                      <div className="flex items-center space-x-3 text-[11px] text-neutral-400">
                        <span className="flex items-center space-x-1">
                          <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                          <span>{inc.building_name || 'Tech Park'} {inc.room_number ? `(Rm ${inc.room_number})` : ''}</span>
                        </span>
                        <span>·</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-neutral-500" />
                          <span>{new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/incidents`}
                      className="px-3 py-1.5 rounded-lg bg-[#242424] hover:bg-[#2F2F2F] border border-white/[0.08] text-xs font-semibold text-white whitespace-nowrap transition-colors focus-ring"
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
                <Building2 className="w-4 h-4 text-[#BFF549]" />
                <span>Campus Facilities Health</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Physical blocks mapped to the 3D twin
              </p>
            </div>
            <Link
              href="/command-center"
              className="text-xs font-semibold text-[#BFF549] hover:underline flex items-center space-x-1 focus-ring"
            >
              <span>Launch 3D</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {(!buildings || buildings.length === 0) ? (
              <div className="bg-[#1A1A1A] border border-white/[0.08] p-8 text-center text-xs text-neutral-400 rounded-2xl">
                Loading campus buildings telemetry...
              </div>
            ) : (
              buildings.map((bld) => {
                const isDegraded = bld.status === 'maintenance' || bld.status === 'disrupted';
                const isClosed = bld.status === 'closed';
                const incidentCount = bld.active_incidents_count ?? 0;

                return (
                  <div
                    key={bld.id}
                    className="bg-[#1A1A1A] border border-white/[0.08] p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-white/[0.16] transition-colors card-sheen"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-[#BFF549] bg-[#BFF549]/10 px-1.5 py-0.5 rounded border border-[#BFF549]/20">
                          {bld.code}
                        </span>
                        <h4 className="font-semibold text-neutral-100 text-xs truncate">
                          {bld.name}
                        </h4>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-1 flex items-center space-x-2">
                        <span>{bld.total_floors} Floors</span>
                        <span>·</span>
                        <span className={incidentCount > 0 ? 'text-[#FF8A1F] font-semibold' : 'text-neutral-400'}>
                          {incidentCount} active tickets
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        isClosed
                          ? 'bg-[#FF2B3A]/10 text-[#FF2B3A] border-[#FF2B3A]/30'
                          : isDegraded
                          ? 'bg-[#FF8A1F]/10 text-[#FF8A1F] border-[#FF8A1F]/30'
                          : 'bg-[#BFF549]/10 text-[#BFF549] border-[#BFF549]/30'
                      }`}>
                        {bld.status || 'operational'}
                      </span>
                      <Link
                        href="/command-center"
                        className="p-1.5 rounded-lg bg-[#242424] hover:bg-[#2F2F2F] text-neutral-300 hover:text-white transition-colors focus-ring"
                        title="Inspect in 3D Command Center"
                      >
                        <Compass className="w-3.5 h-3.5 text-[#BFF549]" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Analytics Matrix: Recurring Incidents & Inventory Shortages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Recurring Incidents Tracker */}
        <div className="bg-[#1A1A1A] border border-white/[0.08] p-5 rounded-2xl shadow-glaido-card space-y-3 card-sheen">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#FF2B3A]/10 text-[#FF2B3A] border border-[#FF2B3A]/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Recurring Campus Incidents Tracker
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#FF2B3A] bg-[#FF2B3A]/10 px-2 py-0.5 rounded-full border border-[#FF2B3A]/30">
              Chronic Failures
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-[#0D0D0D] border border-white/[0.08] space-y-1">
              <div className="flex items-center justify-between font-bold text-white">
                <span>Tech Park (Room 204) — Electrical Breaker Tripping</span>
                <span className="text-[10px] font-mono text-[#FF8A1F]">3 Occurrences / 30d</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Pattern: Overcurrent trips during peak lecture lab hours. Preventive overhaul & 40A upgrade recommended.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#0D0D0D] border border-white/[0.08] space-y-1">
              <div className="flex items-center justify-between font-bold text-white">
                <span>Dr. T.P. Ganesan Auditorium — Split AC Unit</span>
                <span className="text-[10px] font-mono text-[#FF8A1F]">2 Occurrences / 14d</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Pattern: Refrigerant pressure drop before high-occupancy university events.
              </p>
            </div>
          </div>
        </div>

        {/* Warehouse Shortages & Blocked Repairs */}
        <div className="bg-[#1A1A1A] border border-white/[0.08] p-5 rounded-2xl shadow-glaido-card space-y-3 card-sheen">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#FF8A1F]/10 text-[#FF8A1F] border border-[#FF8A1F]/20 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Inventory Shortages & Blocked Repairs
              </h3>
            </div>
            <Link
              href="/inventory"
              className="text-xs text-[#BFF549] hover:underline font-semibold"
            >
              Order Parts →
            </Link>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-[#0D0D0D] border border-[#FF2B3A]/30 space-y-1">
              <div className="flex items-center justify-between font-bold text-white">
                <span>Schneider 32A DIN Rail Circuit Breaker</span>
                <span className="text-[10px] font-mono text-[#FF2B3A] bg-[#FF2B3A]/10 px-2 py-0.5 rounded border border-[#FF2B3A]/25">
                  CRITICAL: 0 IN STOCK
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Impact: Work Order WO-2026-0001 flagged as BLOCKED awaiting arrival. Purchase requisition PR-24FE0B approved.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#0D0D0D] border border-[#FF8A1F]/30 space-y-1">
              <div className="flex items-center justify-between font-bold text-white">
                <span>Cat6 Gigabit Ethernet Spool (100m)</span>
                <span className="text-[10px] font-mono text-[#FF8A1F] bg-[#FF8A1F]/10 px-2 py-0.5 rounded border border-[#FF8A1F]/25">
                  LOW STOCK: 1 SPOOL LEFT
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Below reorder threshold (2 units). Automatic requisition draft queued for procurement approval.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}
