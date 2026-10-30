'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Building2, 
  Wrench, 
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Plus,
  Zap,
  Wind,
  Droplets,
  HardHat,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/incidents');
      setIncidents(data);
      if (data.length > 0 && !selectedIncident) {
        setSelectedIncident(data[0]);
      } else if (selectedIncident) {
        const updated = data.find((i: any) => i.id === selectedIncident.id);
        if (updated) setSelectedIncident(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleUpdateStatus = async (incidentId: string, newStatus: string) => {
    setActionLoading(true);
    setFeedbackMessage(null);
    try {
      const updated = await fetchWithAuth(`/incidents/${incidentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setSelectedIncident(updated);
      await loadIncidents();
      setFeedbackMessage({ text: `Status updated to ${newStatus.replace('_', ' ')}`, type: 'success' });
    } catch (err) {
      setFeedbackMessage({ text: `Status update failed: ${(err as Error).message}`, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateWorkOrder = async (incident: any) => {
    setActionLoading(true);
    setFeedbackMessage(null);
    try {
      const wo = await fetchWithAuth('/work-orders', {
        method: 'POST',
        body: JSON.stringify({
          incident_id: incident.id,
          title: `WO: ${incident.title}`,
          description: incident.description,
          priority: incident.severity,
          category: incident.category,
          room_id: incident.room_id || null,
        }),
      });
      setFeedbackMessage({ text: `Work Order ${wo.work_order_number} initiated and queued!`, type: 'success' });
      await loadIncidents();
    } catch (err) {
      setFeedbackMessage({ text: `Failed to create work order: ${(err as Error).message}`, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSeverity = filterSeverity === 'all' || inc.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || inc.status === filterStatus;
    const matchesSearch = 
      inc.incident_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.room_number && inc.room_number.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSeverity && matchesStatus && matchesSearch;
  });

  const totalCount = incidents.length;
  const criticalCount = incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'closed').length;
  const activeCount = incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Quick Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-white/[0.08] text-xs font-medium text-zinc-300 mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>Incident Registry & Triage</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Campus Incidents
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time ticket logging, SLA countdown telemetry, and direct work-order generation.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={loadIncidents}
            disabled={loading}
            className="p-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <Link
            href="/intake"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report Incident</span>
          </Link>
        </div>
      </div>

      {/* Stats Counter Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-glass p-3.5 rounded-xl">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">Total Logged</span>
          <span className="text-xl font-semibold text-white tracking-tight font-mono mt-0.5">{totalCount}</span>
        </div>
        <div className="card-glass p-3.5 rounded-xl">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">Active Triage</span>
          <span className="text-xl font-semibold text-blue-400 tracking-tight font-mono mt-0.5">{activeCount}</span>
        </div>
        <div className="card-glass p-3.5 rounded-xl">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">Critical Unresolved</span>
          <span className="text-xl font-semibold text-rose-400 tracking-tight font-mono mt-0.5">{criticalCount}</span>
        </div>
        <div className="card-glass p-3.5 rounded-xl">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block">SLA Compliance</span>
          <span className="text-xl font-semibold text-emerald-400 tracking-tight font-mono mt-0.5">99.4%</span>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="card-glass p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ticket #, keyword, or room designation..."
            className="w-full bg-zinc-950/60 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60"
          />
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-zinc-500 text-[11px]">Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-zinc-950/70 border border-white/[0.08] rounded-md px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-blue-500/60"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-zinc-500 text-[11px]">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-zinc-950/70 border border-white/[0.08] rounded-md px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-blue-500/60"
            >
              <option value="all">All</option>
              <option value="reported">Reported</option>
              <option value="triaged">Triaged</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Incident List */}
        <div className="lg:col-span-5 space-y-2.5">
          {loading && incidents.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs">Querying incident database...</div>
          ) : filteredIncidents.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs card-glass rounded-xl">
              No matching records found.
            </div>
          ) : (
            filteredIncidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              const isCritical = inc.severity === 'critical';
              const isHigh = inc.severity === 'high';
              const isResolved = inc.status === 'resolved' || inc.status === 'closed';

              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-900 border-blue-500/60 shadow-lg ring-1 ring-blue-500/30'
                      : 'bg-zinc-900/40 border-white/[0.06] hover:border-white/[0.12] hover:bg-zinc-900/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-semibold text-zinc-100">
                          {inc.incident_number}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                          isCritical
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : isHigh
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {inc.severity}
                        </span>
                      </div>
                      <h4 className="text-xs font-medium text-zinc-200 mt-1.5 truncate">
                        {inc.title}
                      </h4>
                    </div>

                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded capitalize whitespace-nowrap ${
                      isResolved
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-400 border border-white/[0.06]'
                    }`}>
                      {inc.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 border-t border-white/[0.04] pt-2">
                    <div className="flex items-center space-x-1.5 text-zinc-400 truncate">
                      <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{inc.building_name || 'Campus'} {inc.room_number ? `• Rm ${inc.room_number}` : ''}</span>
                    </div>
                    <div className="flex items-center space-x-1 font-mono text-zinc-500 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Incident Detail Pane */}
        <div className="lg:col-span-7">
          {selectedIncident ? (
            <div className="card-glass p-6 rounded-2xl space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-base font-semibold text-blue-400">
                      {selectedIncident.incident_number}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                      selectedIncident.severity === 'critical'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {selectedIncident.severity}
                    </span>
                    <span className="text-xs text-zinc-400 capitalize">
                      Category: <strong className="text-zinc-200">{selectedIncident.category}</strong>
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-white mt-1.5 tracking-tight">
                    {selectedIncident.title}
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={selectedIncident.status}
                    onChange={(e) => handleUpdateStatus(selectedIncident.id, e.target.value)}
                    disabled={actionLoading}
                    className="bg-zinc-950/70 border border-white/[0.08] text-xs text-zinc-200 rounded-lg px-2.5 py-1.5 font-medium cursor-pointer focus:outline-none focus:border-blue-500/60"
                  >
                    <option value="reported">Reported</option>
                    <option value="triaged">Triaged</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {feedbackMessage && (
                <div className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
                  feedbackMessage.type === 'success' 
                    ? 'bg-emerald-950/30 border border-emerald-500/20 text-emerald-300' 
                    : 'bg-rose-950/30 border border-rose-500/20 text-rose-300'
                }`}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{feedbackMessage.text}</span>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-zinc-400">
                  Incident Description & Field Notes
                </span>
                <p className="text-xs text-zinc-200 bg-zinc-950/60 p-3.5 rounded-xl border border-white/[0.06] leading-relaxed">
                  {selectedIncident.description}
                </p>
              </div>

              {/* SLA Deadlines */}
              <div className="grid grid-cols-2 gap-3 bg-zinc-950/60 p-3.5 rounded-xl border border-white/[0.06]">
                <div>
                  <span className="text-[11px] text-zinc-500 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Response Target SLA:</span>
                  </span>
                  <div className="font-mono text-xs font-medium text-zinc-200 mt-1">
                    {selectedIncident.response_due_at
                      ? new Date(selectedIncident.response_due_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                      : 'Immediate'}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-500 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Resolution Target:</span>
                  </span>
                  <div className="font-mono text-xs font-medium text-zinc-200 mt-1">
                    {selectedIncident.resolution_due_at
                      ? new Date(selectedIncident.resolution_due_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                      : 'Within 4h'}
                  </div>
                </div>
              </div>

              {/* Location & Reporter Info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-zinc-950/40 border border-white/[0.04] space-y-1">
                  <span className="text-zinc-500 text-[11px]">Facility Location:</span>
                  <div className="text-zinc-200 font-medium flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{selectedIncident.building_name || 'Main Campus'} (Rm {selectedIncident.room_number || 'Common'})</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950/40 border border-white/[0.04] space-y-1">
                  <span className="text-zinc-500 text-[11px]">Reporter Origin:</span>
                  <div className="text-zinc-200 font-medium flex items-center space-x-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="truncate">{selectedIncident.reporter_name || 'Anonymous'}</span>
                  </div>
                </div>
              </div>

              {/* Work Order Action Bar */}
              <div className="border-t border-white/[0.06] pt-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400">Need boots on the ground?</span>
                  <span className="text-[11px] text-zinc-500 block">Spawn work order and calculate best technician rank</span>
                </div>
                <button
                  onClick={() => handleCreateWorkOrder(selectedIncident)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium flex items-center space-x-2 shadow-sm transition-colors"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Generate Work Order</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-zinc-500 card-glass rounded-2xl text-xs space-y-1">
              <p>Select an incident from the queue to inspect details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
