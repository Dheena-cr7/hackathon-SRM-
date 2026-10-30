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
  UserCheck, 
  Compass, 
  MessageSquare, 
  Send,
  Sparkles,
  Flame,
  Layers,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';
import { fetchWithAuth, getActiveUser, UserPreset } from '@/lib/api';
import RoleGuard from '@/components/RoleGuard';

export default function IncidentsPage() {
  const [currentUser, setCurrentUser] = useState<UserPreset | null>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority_desc' | 'priority_asc' | 'newest' | 'oldest'>('priority_desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [incidentComment, setIncidentComment] = useState('');

  // AI Summary & Correlation State
  const [aiSummary, setAiSummary] = useState<any | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState(true);
  const [correlatedList, setCorrelatedList] = useState<any[]>([]);

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

  const loadAiSummary = async () => {
    try {
      setAiSummaryLoading(true);
      const data = await fetchWithAuth('/incidents/ai-summary');
      setAiSummary(data);
    } catch (err) {
      console.error('AI summary fetch failed:', err);
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const loadCorrelated = async (incId: string) => {
    try {
      const data = await fetchWithAuth(`/incidents/${incId}/correlated`);
      setCorrelatedList(data);
    } catch {
      setCorrelatedList([]);
    }
  };

  useEffect(() => {
    const user = getActiveUser();
    setCurrentUser(user);
    loadIncidents();
    loadAiSummary();
  }, []);

  useEffect(() => {
    if (selectedIncident?.id) {
      loadCorrelated(selectedIncident.id);
    }
  }, [selectedIncident]);

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
      setFeedbackMessage({ text: `Status successfully updated to ${newStatus.replace('_', ' ')}`, type: 'success' });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err) {
      setFeedbackMessage({ text: `Status update failed: ${(err as Error).message}`, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !incidentComment.trim()) return;
    setActionLoading(true);
    setFeedbackMessage(null);
    try {
      const updated = await fetchWithAuth(`/incidents/${selectedIncident.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ comment: incidentComment }),
      });
      setSelectedIncident(updated);
      setIncidentComment('');
      await loadIncidents();
      setFeedbackMessage({ text: 'Comment added to incident audit log!', type: 'success' });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err) {
      setFeedbackMessage({ text: `Failed to add comment: ${(err as Error).message}`, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!selectedIncident) return;
    setActionLoading(true);
    setFeedbackMessage(null);
    try {
      const updated = await fetchWithAuth(`/incidents/${selectedIncident.id}/escalate`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Manual operator escalation due to imminent class disruption' }),
      });
      setSelectedIncident(updated);
      await loadIncidents();
      setFeedbackMessage({ text: `⚡ Incident ${updated.incident_number} escalated to CRITICAL! SLA timer expedited.`, type: 'success' });
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err) {
      setFeedbackMessage({ text: `Escalation failed: ${(err as Error).message}`, type: 'error' });
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
          priority: incident.severity || 'medium',
        }),
      });
      setFeedbackMessage({ text: `Work Order ${wo.order_number || wo.work_order_number || 'created'} dispatched!`, type: 'success' });
      await loadIncidents();
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err) {
      setFeedbackMessage({ text: `Failed to create work order: ${(err as Error).message}`, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    const itemPriority = (inc.priority || inc.severity || 'medium').toLowerCase();
    const matchesSeverity = filterSeverity === 'all' || itemPriority === filterSeverity.toLowerCase();
    const matchesStatus = filterStatus === 'all' || inc.status === filterStatus;
    const matchesSearch = 
      inc.incident_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.room_number && inc.room_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inc.building_name && inc.building_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSeverity && matchesStatus && matchesSearch;
  });

  const priorityWeight: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    const pA = priorityWeight[(a.priority || a.severity || 'medium').toLowerCase()] || 2;
    const pB = priorityWeight[(b.priority || b.severity || 'medium').toLowerCase()] || 2;
    if (sortBy === 'priority_desc') return pB - pA;
    if (sortBy === 'priority_asc') return pA - pB;
    if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    if (sortBy === 'oldest') return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    return 0;
  });

  const totalCount = incidents.length;
  const criticalCount = incidents.filter(i => (i.severity === 'critical' || i.priority === 'critical') && i.status !== 'resolved' && i.status !== 'closed').length;
  const activeCount = incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed').length;

  const isStudent = currentUser?.role === 'student' || currentUser?.role === 'faculty';

  return (
    <RoleGuard pageName="Incident Registry & Triage">
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-[#BFF549]/10 border border-[#BFF549]/30 text-xs font-semibold text-[#BFF549] mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isStudent ? 'Complaint Progress Tracker' : 'Incident Registry & Triage'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isStudent ? 'My Maintenance Complaints & Progress' : 'Campus Incidents & SLA Tracking'}
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            {isStudent 
              ? 'Track the real-time resolution progress and technician assignments of your campus maintenance complaints.' 
              : 'Real-time ticket logging, AI executive summary synthesis, correlated complaint clusters, and 1-click priority escalation.'}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => { loadIncidents(); loadAiSummary(); }}
            disabled={loading || aiSummaryLoading}
            className="p-2 px-3 bg-[#1A1A1A] hover:bg-[#242424] border border-white/[0.08] text-neutral-300 hover:text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#BFF549]' : ''}`} />
            <span>Sync Registry</span>
          </button>
          <Link
            href="/intake"
            className="px-3.5 py-2 bg-[#BFF549] hover:bg-[#8CC21F] text-black font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-glaido-button active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Report Incident</span>
          </Link>
        </div>
      </div>

      {/* AI Executive Summary & Correlation Banner */}
      {aiSummary && (
        <div className="bg-[#1A1A1A] border border-white/[0.08] rounded-2xl p-5 shadow-glaido-card space-y-3 card-sheen">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#BFF549]/10 text-[#BFF549] border border-[#BFF549]/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#BFF549]" />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                AI Incident Synthesis & Correlation Matrix
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAiSummary(!showAiSummary)}
              className="text-xs text-neutral-400 hover:text-white flex items-center space-x-1 cursor-pointer"
            >
              <span>{showAiSummary ? 'Collapse' : 'Expand'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAiSummary ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showAiSummary && (
            <div className="space-y-3 text-xs animate-fade-in">
              <p className="text-neutral-300 leading-relaxed bg-[#0D0D0D] p-3.5 rounded-xl border border-white/[0.08]">
                {aiSummary.executive_summary}
              </p>

              {aiSummary.correlated_clusters?.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Correlated Geographic Clusters:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {aiSummary.correlated_clusters.map((c: any, i: number) => (
                      <div key={i} className="p-3 bg-[#0D0D0D] rounded-xl border border-white/[0.08] space-y-1">
                        <div className="flex items-center justify-between font-bold text-white">
                          <span>{c.building_id}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#BFF549]/10 text-[#BFF549] border border-[#BFF549]/30">
                            {c.incident_count} reports linked
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400">{c.correlation_reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats Counter Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#1A1A1A] border border-white/[0.08] p-3.5 rounded-xl card-sheen">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">Total Logged</span>
          <span className="text-2xl font-bold text-white tracking-tight font-mono mt-1 block">{totalCount}</span>
        </div>
        <div className="bg-[#1A1A1A] border border-white/[0.08] p-3.5 rounded-xl card-sheen">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">Active Triage</span>
          <span className="text-2xl font-bold text-[#BFF549] tracking-tight font-mono mt-1 block">{activeCount}</span>
        </div>
        <div className="bg-[#1A1A1A] border border-white/[0.08] p-3.5 rounded-xl card-sheen">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">Critical Safety</span>
          <span className="text-2xl font-bold text-[#FF2B3A] tracking-tight font-mono mt-1 block">{criticalCount}</span>
        </div>
        <div className="bg-[#1A1A1A] border border-white/[0.08] p-3.5 rounded-xl card-sheen">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">SLA Compliance</span>
          <span className="text-2xl font-bold text-[#BFF549] tracking-tight font-mono mt-1 block">99.4%</span>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-[#1A1A1A] border border-white/[0.08] p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-glaido-card">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-neutral-400 ml-1" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ticket #, title, or room designation..."
            className="w-full bg-[#0D0D0D] border border-white/[0.10] rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus-ring"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#BFF549]" />
            <span className="text-neutral-400 text-xs font-semibold">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#0D0D0D] border border-white/[0.10] rounded-xl px-2.5 py-1 text-xs text-white cursor-pointer"
            >
              <option value="priority_desc">Priority: Critical → Low</option>
              <option value="priority_asc">Priority: Low → Critical</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-neutral-400 text-xs font-semibold">Priority:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-[#0D0D0D] border border-white/[0.10] rounded-xl px-2.5 py-1 text-xs text-white cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-neutral-400 text-xs font-semibold">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#0D0D0D] border border-white/[0.10] rounded-xl px-2.5 py-1 text-xs text-white cursor-pointer"
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Incident List */}
        <div className="lg:col-span-5 space-y-2.5">
          {loading && incidents.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 text-xs">Querying incident database...</div>
          ) : sortedIncidents.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 bg-[#1A1A1A] border border-white/[0.08] rounded-2xl text-xs">
              No matching incidents found.
            </div>
          ) : (
            sortedIncidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              const prio = (inc.priority || inc.severity || 'medium').toLowerCase();
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left card-sheen ${
                    isSelected
                      ? 'bg-[#1A1A1A] border-[#BFF549] shadow-glaido-card'
                      : 'bg-[#1A1A1A] border-white/[0.08] hover:border-white/[0.18]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-white">{inc.incident_number}</span>
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        prio === 'critical' 
                          ? 'bg-[#FF2B3A]/10 text-[#FF2B3A] border-[#FF2B3A]/30' 
                          : prio === 'high'
                          ? 'bg-[#FF8A1F]/10 text-[#FF8A1F] border-[#FF8A1F]/30'
                          : prio === 'low'
                          ? 'bg-[#242424] text-neutral-400 border-white/[0.08]'
                          : 'bg-[#BFF549]/10 text-[#BFF549] border-[#BFF549]/30'
                      }`}>
                        {prio}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#242424] text-neutral-300 border border-white/[0.08]">
                        {inc.status}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xs font-semibold text-white line-clamp-1">{inc.title}</h4>
                  <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">{inc.description}</p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-400 border-t border-white/[0.06] pt-2">
                    <div className="flex items-center space-x-1.5 text-neutral-400 truncate">
                      <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{inc.building_name || inc.building_id || 'Campus'} {inc.room_number ? `• Rm ${inc.room_number}` : ''}</span>
                    </div>
                    <div className="flex items-center space-x-1 font-mono text-neutral-400 shrink-0">
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
            <div className="bg-[#1A1A1A] border border-white/[0.08] p-6 rounded-2xl space-y-5 shadow-glaido-card card-sheen">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-base font-bold text-white">
                      {selectedIncident.incident_number}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      selectedIncident.severity === 'critical' || selectedIncident.priority === 'critical'
                        ? 'bg-[#FF2B3A]/10 text-[#FF2B3A] border-[#FF2B3A]/30'
                        : 'bg-[#FF8A1F]/10 text-[#FF8A1F] border-[#FF8A1F]/30'
                    }`}>
                      {selectedIncident.severity || selectedIncident.priority || 'medium'}
                    </span>
                    <span className="text-xs text-neutral-400 capitalize">
                      Category: <strong className="text-white">{selectedIncident.category}</strong>
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1.5 tracking-tight">
                    {selectedIncident.title}
                  </h2>
                </div>

                {isStudent ? (
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1.5 rounded-xl bg-[#BFF549]/10 text-[#BFF549] border border-[#BFF549]/30 text-xs font-bold capitalize flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Status: {selectedIncident.status ? selectedIncident.status.replace('_', ' ') : 'Reported'}</span>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    {selectedIncident.priority !== 'critical' && selectedIncident.severity !== 'critical' && (
                      <button
                        type="button"
                        onClick={handleEscalate}
                        disabled={actionLoading}
                        className="px-2.5 py-1.5 bg-[#FF2B3A]/10 hover:bg-[#FF2B3A]/20 text-[#FF2B3A] border border-[#FF2B3A]/30 text-xs font-bold rounded-xl flex items-center space-x-1 cursor-pointer transition-colors"
                        title="Escalate priority to Critical"
                      >
                        <Flame className="w-3.5 h-3.5 text-[#FF2B3A]" />
                        <span>Escalate</span>
                      </button>
                    )}
                    <select
                      value={selectedIncident.status}
                      onChange={(e) => handleUpdateStatus(selectedIncident.id, e.target.value)}
                      disabled={actionLoading}
                      className="bg-[#0D0D0D] border border-white/[0.10] text-xs text-white rounded-xl px-2.5 py-1.5 font-semibold cursor-pointer"
                    >
                      <option value="reported">Reported</option>
                      <option value="triaged">Triaged</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Visual 5-Step Resolution Progress Pipeline */}
              <div className="bg-[#0D0D0D] p-4 rounded-xl border border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#BFF549]" />
                    <span>Resolution Timeline & Progress</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1A1A1A] border border-white/[0.08] text-neutral-300 capitalize">
                    Current: {selectedIncident.status ? selectedIncident.status.replace('_', ' ') : 'Reported'}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {[
                    { key: 'reported', label: '1. Reported' },
                    { key: 'triaged', label: '2. Triaged' },
                    { key: 'assigned', label: '3. Dispatched' },
                    { key: 'in_progress', label: '4. Repairing' },
                    { key: 'resolved', label: '5. Resolved' },
                  ].map((step, idx) => {
                    const stages = ['reported', 'triaged', 'assigned', 'in_progress', 'resolved', 'closed'];
                    const currentIdx = stages.indexOf(selectedIncident.status || 'reported');
                    const isDone = currentIdx >= idx;
                    const isCurrent = currentIdx === idx;

                    return (
                      <div key={step.key} className="flex flex-col items-center text-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] transition-all ${
                          isCurrent
                            ? 'bg-[#BFF549] text-black shadow-glaido-button animate-pulse'
                            : isDone
                            ? 'bg-[#BFF549]/20 text-[#BFF549] border border-[#BFF549]/40'
                            : 'bg-[#1A1A1A] text-neutral-600 border border-white/[0.08]'
                        }`}>
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <span className={`text-[9px] mt-1 font-semibold truncate max-w-full ${
                          isCurrent ? 'text-[#BFF549] font-bold' : isDone ? 'text-neutral-300' : 'text-neutral-600'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {feedbackMessage && (
                <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                  feedbackMessage.type === 'success' 
                    ? 'bg-[#BFF549]/10 border border-[#BFF549]/30 text-[#BFF549]' 
                    : 'bg-[#FF2B3A]/10 border border-[#FF2B3A]/30 text-[#FF2B3A]'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{feedbackMessage.text}</span>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-neutral-300">
                  Incident Description & Field History
                </span>
                <p className="text-xs text-neutral-200 bg-[#0D0D0D] p-3.5 rounded-xl border border-white/[0.08] leading-relaxed whitespace-pre-wrap">
                  {selectedIncident.description}
                </p>
              </div>

              {/* Add Comment / Field Note Form */}
              <form onSubmit={handleAddComment} className="p-3.5 rounded-xl bg-[#0D0D0D] border border-white/[0.08] space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-300">
                  <MessageSquare className="w-3.5 h-3.5 text-[#BFF549]" />
                  <span>Post Comment or Dispatch Update</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={incidentComment}
                    onChange={(e) => setIncidentComment(e.target.value)}
                    placeholder="Enter technician update, inspection note, or status remark..."
                    className="flex-1 bg-[#1A1A1A] border border-white/[0.10] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus-ring"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading || !incidentComment.trim()}
                    className="px-4 py-2 bg-[#BFF549] hover:bg-[#8CC21F] disabled:opacity-40 text-black font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-glaido-button transition-all cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </div>
              </form>

              {/* Correlated Incidents in same area */}
              {correlatedList.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#2B6CFF]/10 border border-[#2B6CFF]/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span className="flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#2B6CFF]" />
                      <span>Correlated Complaints in Same Zone ({correlatedList.length})</span>
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {correlatedList.map((c) => (
                      <div key={c.id} className="p-2 rounded-lg bg-[#0D0D0D] border border-white/[0.08] text-[11px] flex items-center justify-between">
                        <span className="font-mono font-bold text-[#BFF549]">{c.incident_number}</span>
                        <span className="text-neutral-300 truncate max-w-xs">{c.title}</span>
                        <span className="text-[10px] uppercase text-neutral-400">{c.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SLA Deadlines */}
              <div className="grid grid-cols-2 gap-3 bg-[#0D0D0D] p-3.5 rounded-xl border border-white/[0.08]">
                <div>
                  <span className="text-[11px] text-neutral-400 flex items-center space-x-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#BFF549]" />
                    <span>Response Target SLA:</span>
                  </span>
                  <div className="font-mono text-xs font-semibold text-white mt-1">
                    {selectedIncident.response_due_at
                      ? new Date(selectedIncident.response_due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Immediate (<15m)'}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-400 flex items-center space-x-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#BFF549]" />
                    <span>Resolution Target:</span>
                  </span>
                  <div className="font-mono text-xs font-semibold text-white mt-1">
                    {selectedIncident.resolution_due_at
                      ? new Date(selectedIncident.resolution_due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Within 4h'}
                  </div>
                </div>
              </div>

              {/* Work Order Action Bar */}
              <div className="border-t border-white/[0.06] pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-white">Dispatch Field Technician</span>
                  <span className="text-[11px] text-neutral-400 block">Spawn work order and calculate best technician rank</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCreateWorkOrder(selectedIncident)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#BFF549] hover:bg-[#8CC21F] disabled:opacity-40 text-black font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-glaido-button transition-all cursor-pointer"
                >
                  <Wrench className="w-4 h-4 text-black" />
                  <span>Generate Work Order</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-neutral-400 bg-[#1A1A1A] border border-white/[0.08] rounded-2xl text-xs space-y-1">
              <p>Select an incident from the queue to inspect details</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}
