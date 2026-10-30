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
  RefreshCw
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

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/incidents');
      setIncidents(data);
      if (data.length > 0 && !selectedIncident) {
        setSelectedIncident(data[0]);
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
    try {
      const updated = await fetchWithAuth(`/incidents/${incidentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setSelectedIncident(updated);
      await loadIncidents();
    } catch (err) {
      alert(`Status update failed: ${(err as Error).message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateWorkOrder = async (incident: any) => {
    setActionLoading(true);
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
      alert(`Work Order ${wo.work_order_number} created successfully!`);
      await loadIncidents();
    } catch (err) {
      alert(`Failed to create work order: ${(err as Error).message}`);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <span>Incident Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track reported issues, monitor SLA countdowns, and dispatch field work orders.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadIncidents}
            disabled={loading}
            className="p-2 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs flex items-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/intake"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm"
          >
            + Report New
          </Link>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ticket #, title, or room..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <span className="text-slate-400">Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-slate-400">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
            >
              <option value="all">All Statuses</option>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Incident List */}
        <div className="lg:col-span-5 space-y-3">
          {loading && incidents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading incidents...</div>
          ) : filteredIncidents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-xl">
              No matching incidents found.
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
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-white">
                          {inc.incident_number}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-700/60'
                            : isHigh
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-700/60'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-700/60'
                        }`}>
                          {inc.severity}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-200 mt-1 line-clamp-1">
                        {inc.title}
                      </h4>
                    </div>

                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border capitalize ${
                      isResolved
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}>
                      {inc.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                    <div className="flex items-center space-x-1 text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{inc.building_name || 'Campus'} {inc.room_number ? `• Rm ${inc.room_number}` : ''}</span>
                    </div>
                    <div className="flex items-center space-x-1 font-mono text-slate-400">
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
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-base font-extrabold text-blue-400">
                      {selectedIncident.incident_number}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      selectedIncident.severity === 'critical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-700/60'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-700/60'
                    }`}>
                      {selectedIncident.severity}
                    </span>
                    <span className="text-xs text-slate-400 capitalize">
                      Category: <strong className="text-slate-200">{selectedIncident.category}</strong>
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">
                    {selectedIncident.title}
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={selectedIncident.status}
                    onChange={(e) => handleUpdateStatus(selectedIncident.id, e.target.value)}
                    disabled={actionLoading}
                    className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 font-medium cursor-pointer"
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

              {/* Description */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Description
                </span>
                <p className="text-sm text-slate-200 bg-slate-950 p-3.5 rounded-lg border border-slate-800 leading-relaxed">
                  {selectedIncident.description}
                </p>
              </div>

              {/* SLA Deadlines */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Response Deadline:</span>
                  </span>
                  <div className="font-mono text-sm font-semibold text-slate-200 mt-1">
                    {selectedIncident.response_due_at
                      ? new Date(selectedIncident.response_due_at).toLocaleString()
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Resolution Target:</span>
                  </span>
                  <div className="font-mono text-sm font-semibold text-slate-200 mt-1">
                    {selectedIncident.resolution_due_at
                      ? new Date(selectedIncident.resolution_due_at).toLocaleString()
                      : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Location & Reporter Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Facility / Room:</span>
                  <div className="text-slate-200 font-semibold flex items-center space-x-1.5">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>{selectedIncident.building_name || 'Main Campus'} (Rm {selectedIncident.room_number || 'Common Area'})</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Reported By:</span>
                  <div className="text-slate-200 font-semibold">
                    {selectedIncident.reporter_name || 'Anonymous User'} 
                    <span className="text-slate-400 text-[11px] block">{selectedIncident.reporter_email}</span>
                  </div>
                </div>
              </div>

              {/* Work Order Action Bar */}
              <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Dispatch technician for repair</span>
                </div>
                <button
                  onClick={() => handleCreateWorkOrder(selectedIncident)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-md transition-all"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Generate Work Order</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              Select an incident from the left to view details and dispatch actions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

