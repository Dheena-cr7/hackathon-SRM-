'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Award, 
  AlertCircle, 
  ShieldCheck, 
  RefreshCw, 
  Cpu, 
  Layers, 
  Sparkles, 
  Building2, 
  AlertTriangle, 
  MessageSquare, 
  Send,
  Users,
  ShieldAlert,
  UserX,
  Package,
  Zap,
  Flame,
  Droplets,
  Wifi,
  Search,
  Filter,
  MapPin,
  Activity,
  Check,
  ChevronRight
} from 'lucide-react';
import { fetchWithAuth, getActiveUser } from '@/lib/api';
import RoleGuard from '@/components/RoleGuard';

export default function WorkOrdersPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'roster'>('orders');
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [selectedWO, setSelectedWO] = useState<any | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [staffRoster, setStaffRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'blocked' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Disruption Scenario B State
  const [disruptionLoading, setDisruptionLoading] = useState(false);
  const [disruptionResult, setDisruptionResult] = useState<any | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const ts = Date.now();
      const [woData, rosterData] = await Promise.all([
        fetchWithAuth(`/work-orders?_t=${ts}`),
        fetchWithAuth(`/work-orders/staff-roster?_t=${ts}`).catch(() => []),
      ]);
      const safeWOs = Array.isArray(woData) ? woData : [];
      setWorkOrders(safeWOs);
      setStaffRoster(Array.isArray(rosterData) ? rosterData : []);
      
      if (safeWOs.length > 0 && !selectedWO) {
        setSelectedWO(safeWOs[0]);
      } else if (selectedWO) {
        const updated = safeWOs.find((w: any) => w.id === selectedWO.id);
        if (updated) setSelectedWO(updated);
      }
    } catch (err) {
      console.error('Error loading work orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedWO && (selectedWO.status === 'pending' || !selectedWO.assigned_technician_id)) {
      loadCandidates(selectedWO.id, selectedWO.category || 'electrical');
    } else {
      setCandidates([]);
    }
  }, [selectedWO]);

  const loadCandidates = async (woId: string, category: string) => {
    try {
      setCandidatesLoading(true);
      const data = await fetchWithAuth(`/work-orders/technician-recommendations/${category || 'electrical'}`);
      setCandidates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading candidate recommendations:', err);
      setCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const handleAssign = async (technicianId: string) => {
    if (!selectedWO) return;
    setTransitionLoading(true);
    setActionMessage(null);
    try {
      const updated = await fetchWithAuth(`/work-orders/${selectedWO.id}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          technician_id: technicianId,
          reason: 'Dispatcher assigned certified technician via skill matching algorithm',
        }),
      });
      setSelectedWO(updated);
      await loadData();
      setActionMessage({ text: 'Technician successfully dispatched and work order assigned!', type: 'success' });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      setActionMessage({ text: `Assignment failed: ${(err as Error).message}`, type: 'error' });
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleAddNote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedWO || !notes.trim()) return;
    setTransitionLoading(true);
    setActionMessage(null);
    try {
      const updated = await fetchWithAuth(`/work-orders/${selectedWO.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ notes: notes }),
      });
      setSelectedWO(updated);
      setNotes('');
      await loadData();
      setActionMessage({ text: 'Field note added to work order history!', type: 'success' });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      setActionMessage({ text: `Failed to add note: ${(err as Error).message}`, type: 'error' });
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleTransition = async (toStatus: string) => {
    if (!selectedWO) return;
    setTransitionLoading(true);
    setActionMessage(null);
    try {
      const updated = await fetchWithAuth(`/work-orders/${selectedWO.id}/transition`, {
        method: 'POST',
        body: JSON.stringify({
          new_status: toStatus,
          to_status: toStatus,
          resolution_notes: notes || undefined,
          notes: notes || undefined,
        }),
      });
      setSelectedWO(updated);
      setNotes('');
      await loadData();
      setActionMessage({ text: `Advanced state to: ${toStatus.replace('_', ' ').toUpperCase()}`, type: 'success' });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      setActionMessage({ text: `State machine transition rejected: ${(err as Error).message}`, type: 'error' });
    } finally {
      setTransitionLoading(false);
    }
  };

  // Disruption Scenario B Execution
  const handleSimulateDisruptionB = async () => {
    setDisruptionLoading(true);
    setDisruptionResult(null);
    try {
      const res = await fetchWithAuth('/work-orders/reassign-disruption', {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Sudden high fever & medical leave reported during active shift',
        }),
      });
      setDisruptionResult(res);
      await loadData();
    } catch (err) {
      alert(`Disruption simulation failed: ${(err as Error).message}`);
    } finally {
      setDisruptionLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'electrical':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'hvac':
        return <Flame className="w-3.5 h-3.5 text-blue-400" />;
      case 'plumbing':
        return <Droplets className="w-3.5 h-3.5 text-cyan-400" />;
      case 'it_av':
      case 'it':
        return <Wifi className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Wrench className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'bg-[#FF2B3A]/15 text-[#FF2B3A] border-[#FF2B3A]/30 font-bold';
      case 'high':
        return 'bg-[#FF8A1F]/15 text-[#FF8A1F] border-[#FF8A1F]/30 font-bold';
      case 'medium':
        return 'bg-amber-400/15 text-amber-300 border-amber-400/30 font-medium';
      default:
        return 'bg-blue-400/15 text-blue-300 border-blue-400/30 font-medium';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-[#BFF549]/10 text-[#BFF549] border-[#BFF549]/30';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'awaiting_parts':
        return 'bg-[#FF2B3A]/15 text-[#FF2B3A] border-[#FF2B3A]/40 animate-pulse';
      case 'pending_verification':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'assigned':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  const getValidTransitions = (status: string) => {
    switch (status) {
      case 'pending':
        return ['assigned'];
      case 'assigned':
        return ['in_progress', 'cancelled'];
      case 'in_progress':
        return ['awaiting_parts', 'pending_verification'];
      case 'awaiting_parts':
        return ['in_progress'];
      case 'pending_verification':
        return ['completed', 'in_progress'];
      default:
        return [];
    }
  };

  const lifecycleStages = [
    { key: 'pending', label: '1. Pending' },
    { key: 'assigned', label: '2. Dispatched' },
    { key: 'in_progress', label: '3. In Progress' },
    { key: 'awaiting_parts', label: 'Hold: Parts' },
    { key: 'pending_verification', label: '4. Verification' },
    { key: 'completed', label: '5. Completed' },
  ];

  const getStageIndex = (status: string) => {
    return lifecycleStages.findIndex(s => s.key === status);
  };

  // Filtered Queue
  const filteredWorkOrders = workOrders.filter((wo) => {
    const num = (wo.work_order_number || wo.order_number || '').toLowerCase();
    const title = (wo.title || '').toLowerCase();
    const desc = (wo.description || '').toLowerCase();
    const room = (wo.room_name || '').toLowerCase();
    const bld = (wo.building_name || '').toLowerCase();
    const tech = (wo.assigned_technician_name || wo.assigned_technician?.full_name || '').toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesSearch = !q || num.includes(q) || title.includes(q) || desc.includes(q) || room.includes(q) || bld.includes(q) || tech.includes(q);
    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return wo.status === 'pending' || !wo.assigned_technician_id;
    if (statusFilter === 'active') return wo.status === 'assigned' || wo.status === 'in_progress';
    if (statusFilter === 'blocked') return wo.status === 'awaiting_parts';
    if (statusFilter === 'completed') return wo.status === 'completed' || wo.status === 'pending_verification';
    return true;
  });

  // Metrics
  const totalOrders = workOrders.length;
  const pendingOrders = workOrders.filter(w => w.status === 'pending' || !w.assigned_technician_id).length;
  const activeOrders = workOrders.filter(w => w.status === 'assigned' || w.status === 'in_progress').length;
  const blockedOrders = workOrders.filter(w => w.status === 'awaiting_parts').length;
  const completedOrders = workOrders.filter(w => w.status === 'completed').length;

  return (
    <RoleGuard pageName="Technician Dispatch Board">
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-[#BFF549]/10 border border-[#BFF549]/30 text-xs font-semibold text-[#BFF549] mb-2">
              <Wrench className="w-3.5 h-3.5" />
              <span>Field Dispatch & Skill Allocation Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Work Order Operations
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              Multi-factor technician matching with explainable scoring (certifications, shifts, workloads) and automated reassignment.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <div className="p-1 rounded-xl bg-[#1A1A1A] border border-white/[0.08] shadow-glaido-card flex items-center space-x-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'orders' 
                    ? 'bg-[#BFF549] text-black shadow-glaido-button' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Dispatch Queue ({workOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('roster')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'roster' 
                    ? 'bg-[#BFF549] text-black shadow-glaido-button' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Staff Skills & Shifts
              </button>
            </div>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="p-2 px-3 bg-[#1A1A1A] hover:bg-[#242424] border border-white/[0.08] text-neutral-300 hover:text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#BFF549]' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Real-Time Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 bg-[#1A1A1A] border border-white/[0.08] rounded-xl shadow-glaido-card">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Total Work Orders</span>
            <span className="text-xl font-extrabold text-white font-mono mt-1 block">{totalOrders}</span>
          </div>
          <div className="p-3.5 bg-[#1A1A1A] border border-amber-500/20 rounded-xl shadow-glaido-card">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Needs Dispatch</span>
            <span className="text-xl font-extrabold text-amber-400 font-mono mt-1 block">{pendingOrders}</span>
          </div>
          <div className="p-3.5 bg-[#1A1A1A] border border-blue-500/20 rounded-xl shadow-glaido-card">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Active In-Field</span>
            <span className="text-xl font-extrabold text-blue-400 font-mono mt-1 block">{activeOrders}</span>
          </div>
          <div className="p-3.5 bg-[#1A1A1A] border border-[#FF2B3A]/20 rounded-xl shadow-glaido-card">
            <span className="text-[10px] font-bold text-[#FF2B3A] uppercase tracking-wider block">Parts Hold</span>
            <span className="text-xl font-extrabold text-[#FF2B3A] font-mono mt-1 block">{blockedOrders}</span>
          </div>
          <div className="p-3.5 bg-[#1A1A1A] border border-[#BFF549]/20 rounded-xl shadow-glaido-card">
            <span className="text-[10px] font-bold text-[#BFF549] uppercase tracking-wider block">Completed</span>
            <span className="text-xl font-extrabold text-[#BFF549] font-mono mt-1 block">{completedOrders}</span>
          </div>
        </div>

        {/* DISRUPTION SCENARIO B BANNER */}
        <div className="bg-[#1A1A1A] border border-[#FF8A1F]/30 p-5 rounded-2xl shadow-glaido-card space-y-3 card-sheen">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-[#FF8A1F]/10 border border-[#FF8A1F]/30 text-[#FF8A1F] shrink-0">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-white">Disruption Scenario B: Technician Unavailable / Sickness</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF8A1F]/10 text-[#FF8A1F] border border-[#FF8A1F]/30 font-semibold">
                    Dynamic Reallocation
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1 max-w-3xl leading-relaxed">
                  Simulate assigned Technician Rajesh reporting sick mid-shift. The platform intercepts active work orders, re-evaluates trade certifications & live workloads, and deterministically reassigns to certified Technician Ananya Verma.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSimulateDisruptionB}
              disabled={disruptionLoading}
              className="px-4 py-2.5 bg-[#FF8A1F] hover:bg-[#E57A18] text-black font-bold rounded-xl text-xs flex items-center space-x-2 shrink-0 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${disruptionLoading ? 'animate-spin' : ''}`} />
              <span>Simulate Technician Sickness</span>
            </button>
          </div>

          {/* Disruption Result Box */}
          {disruptionResult && (
            <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#FF8A1F]/40 text-xs space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-[#FF8A1F] font-bold">
                <span>Disruption Intercepted: {disruptionResult.reassigned_work_orders?.length || 0} Work Order(s) Dynamically Reallocated</span>
                <span className="text-[10px] font-mono text-neutral-400">Algorithmic Load Rebalance</span>
              </div>
              {disruptionResult.reassigned_work_orders?.map((r: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-lg bg-[#1A1A1A] border border-white/[0.08] text-[11px] space-y-1">
                  <div>Work Order: <span className="font-bold text-white">{r.work_order_number}</span></div>
                  <div>New Assignee: <span className="font-bold text-[#BFF549]">{r.new_technician}</span> ({r.new_technician_email})</div>
                  <div className="text-neutral-400">Justification: <span className="text-neutral-200">{r.reason}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {actionMessage && (
          <div className={`p-3.5 rounded-xl text-xs font-medium border flex items-center space-x-2 ${
            actionMessage.type === 'success' 
              ? 'bg-[#BFF549]/10 text-[#BFF549] border-[#BFF549]/25' 
              : 'bg-[#FF2B3A]/10 text-[#FF2B3A] border-[#FF2B3A]/25'
          }`}>
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#BFF549]" /> : <AlertCircle className="w-4 h-4 text-[#FF2B3A]" />}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* TAB 1: WORK ORDERS LIST & DETAIL VIEW */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Work Orders List (5 Cols) */}
            <div className="lg:col-span-5 space-y-3">
              {/* Filter and Search Bar */}
              <div className="bg-[#1A1A1A] p-3 rounded-2xl border border-white/[0.08] space-y-2.5 shadow-glaido-card">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ticket, room, title, technician..."
                    className="w-full bg-[#0D0D0D] border border-white/[0.10] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus-ring"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      statusFilter === 'all' ? 'bg-white text-black font-bold' : 'bg-[#0D0D0D] text-neutral-400 hover:text-white'
                    }`}
                  >
                    All ({workOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('pending')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      statusFilter === 'pending' ? 'bg-amber-400 text-black font-bold' : 'bg-[#0D0D0D] text-neutral-400 hover:text-amber-400'
                    }`}
                  >
                    Pending ({pendingOrders})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('active')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      statusFilter === 'active' ? 'bg-blue-400 text-black font-bold' : 'bg-[#0D0D0D] text-neutral-400 hover:text-blue-400'
                    }`}
                  >
                    Active ({activeOrders})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('blocked')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      statusFilter === 'blocked' ? 'bg-[#FF2B3A] text-white font-bold' : 'bg-[#0D0D0D] text-neutral-400 hover:text-[#FF2B3A]'
                    }`}
                  >
                    Blocked ({blockedOrders})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('completed')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      statusFilter === 'completed' ? 'bg-[#BFF549] text-black font-bold' : 'bg-[#0D0D0D] text-neutral-400 hover:text-[#BFF549]'
                    }`}
                  >
                    Completed ({completedOrders})
                  </button>
                </div>
              </div>

              {/* Active Dispatch Queue Cards */}
              <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
                {filteredWorkOrders.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-500 bg-[#1A1A1A] rounded-2xl border border-white/[0.08]">
                    No work orders found matching current filter.
                  </div>
                ) : (
                  filteredWorkOrders.map((wo) => {
                    const isSelected = selectedWO?.id === wo.id;
                    const isBlocked = wo.status === 'awaiting_parts';
                    const woNum = wo.work_order_number || wo.order_number || `WO-${wo.id.slice(0, 6).toUpperCase()}`;
                    const title = wo.title || `Maintenance Work Order ${woNum}`;
                    const techName = wo.assigned_technician?.full_name || wo.assigned_technician_name;
                    const priorityClass = getPriorityBadge(wo.priority);
                    const statusClass = getStatusBadge(wo.status);

                    return (
                      <div
                        key={wo.id}
                        onClick={() => setSelectedWO(wo)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer text-left card-sheen relative overflow-hidden ${
                          isSelected
                            ? 'bg-[#1D1D1D] border-[#BFF549] shadow-glaido-card ring-1 ring-[#BFF549]/30'
                            : 'bg-[#1A1A1A] border-white/[0.08] hover:border-white/[0.18]'
                        }`}
                      >
                        {/* Priority Accent Stripe */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                          wo.priority === 'critical' ? 'bg-[#FF2B3A]' :
                          wo.priority === 'high' ? 'bg-[#FF8A1F]' :
                          wo.priority === 'medium' ? 'bg-amber-400' : 'bg-blue-400'
                        }`} />

                        <div className="pl-1 space-y-2">
                          {/* Header Line: WO Number + Category + Status */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-xs font-bold text-white tracking-wide">
                                {woNum}
                              </span>
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[10px] text-neutral-300 capitalize font-medium">
                                {getCategoryIcon(wo.category)}
                                <span>{wo.category || 'General'}</span>
                              </span>
                            </div>

                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusClass}`}>
                              {isBlocked ? 'Blocked: Parts' : wo.status.replace('_', ' ')}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="text-xs font-bold text-white line-clamp-1 leading-snug">
                            {title}
                          </h4>

                          {/* Description preview */}
                          {wo.description && (
                            <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                              {wo.description}
                            </p>
                          )}

                          {/* Location & Room */}
                          <div className="flex items-center space-x-1.5 text-[11px] text-neutral-400">
                            <MapPin className="w-3 h-3 text-[#BFF549] shrink-0" />
                            <span className="truncate">
                              {wo.building_name || 'Campus Complex'} {wo.room_name ? `• Room ${wo.room_name}` : ''}
                            </span>
                          </div>

                          {/* Footer: Assigned Tech & Priority */}
                          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/[0.06]">
                            <div className="flex items-center space-x-1.5">
                              {techName ? (
                                <>
                                  <div className="w-4 h-4 rounded-full bg-[#BFF549]/20 text-[#BFF549] flex items-center justify-center text-[9px] font-bold">
                                    {techName[0]}
                                  </div>
                                  <span className="font-medium text-neutral-200">{techName}</span>
                                </>
                              ) : (
                                <span className="text-amber-400 font-semibold flex items-center space-x-1">
                                  <UserX className="w-3 h-3" />
                                  <span>Unassigned (Needs Dispatch)</span>
                                </span>
                              )}
                            </div>

                            <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded border ${priorityClass}`}>
                              {wo.priority || 'Medium'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Work Order Detail & State Machine Controls (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {selectedWO ? (
                <div className="bg-[#1A1A1A] border border-white/[0.08] rounded-2xl p-6 shadow-glaido-card space-y-5 card-sheen">
                  {/* Detail Header */}
                  <div className="border-b border-white/[0.06] pb-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm font-extrabold text-[#BFF549]">
                            {selectedWO.work_order_number || selectedWO.order_number}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${getStatusBadge(selectedWO.status)}`}>
                            {selectedWO.status === 'awaiting_parts' ? 'Blocked: Parts' : selectedWO.status.replace('_', ' ')}
                          </span>
                          <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full border ${getPriorityBadge(selectedWO.priority)}`}>
                            {selectedWO.priority} Priority
                          </span>
                        </div>
                        <h2 className="text-base font-bold text-white mt-1.5">{selectedWO.title || 'Maintenance Operation'}</h2>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed bg-[#0D0D0D] p-3 rounded-xl border border-white/[0.06]">
                      {selectedWO.description || 'Facility maintenance and emergency repair ticket.'}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                      <div className="p-2 rounded-lg bg-[#0D0D0D] border border-white/[0.06]">
                        <span className="text-neutral-500 block text-[10px]">Location</span>
                        <strong className="text-white truncate block">{selectedWO.building_name || 'Complex'}</strong>
                        <span className="text-neutral-400 text-[10px]">Room {selectedWO.room_name || 'N/A'}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#0D0D0D] border border-white/[0.06]">
                        <span className="text-neutral-500 block text-[10px]">Trade Category</span>
                        <strong className="text-white capitalize block flex items-center space-x-1 mt-0.5">
                          {getCategoryIcon(selectedWO.category)}
                          <span>{selectedWO.category}</span>
                        </strong>
                      </div>
                      <div className="p-2 rounded-lg bg-[#0D0D0D] border border-white/[0.06]">
                        <span className="text-neutral-500 block text-[10px]">Assigned Tech</span>
                        <strong className="text-[#BFF549] truncate block">
                          {selectedWO.assigned_technician?.full_name || selectedWO.assigned_technician_name || 'Unassigned'}
                        </strong>
                        <span className="text-neutral-400 text-[10px]">{selectedWO.assigned_technician?.title || 'Maintenance Staff'}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#0D0D0D] border border-white/[0.06]">
                        <span className="text-neutral-500 block text-[10px]">Estimated SLA</span>
                        <strong className="text-white block font-mono">{selectedWO.estimated_duration_hours || 1.0} hrs</strong>
                        <span className="text-neutral-400 text-[10px]">Target Completion</span>
                      </div>
                    </div>
                  </div>

                  {/* Lifecycle Stepper */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                      State Machine Lifecycle Progress
                    </span>
                    <div className="grid grid-cols-6 gap-1 bg-[#0D0D0D] p-1.5 rounded-xl border border-white/[0.06]">
                      {lifecycleStages.map((stg, idx) => {
                        const curIdx = getStageIndex(selectedWO.status);
                        const isDone = idx <= curIdx && selectedWO.status !== 'cancelled';
                        const isCurrent = stg.key === selectedWO.status;
                        return (
                          <div
                            key={stg.key}
                            className={`p-2 rounded-lg text-center transition-all ${
                              isCurrent
                                ? 'bg-[#BFF549] text-black font-bold shadow-sm'
                                : isDone
                                ? 'bg-[#BFF549]/15 text-[#BFF549] font-medium'
                                : 'text-neutral-500'
                            }`}
                          >
                            <span className="text-[10px] block truncate">{stg.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* State Machine Transition Buttons */}
                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    <span className="text-xs font-bold text-white block">Operational State Actions:</span>
                    <div className="flex flex-wrap gap-2">
                      {getValidTransitions(selectedWO.status).map((targetStatus) => (
                        <button
                          key={targetStatus}
                          type="button"
                          onClick={() => handleTransition(targetStatus)}
                          disabled={transitionLoading}
                          className="px-3.5 py-2 rounded-xl bg-[#BFF549] hover:bg-[#8CC21F] disabled:opacity-40 text-black text-xs font-bold shadow-glaido-button transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                          <span>Advance to {targetStatus.replace('_', ' ').toUpperCase()}</span>
                        </button>
                      ))}

                      {selectedWO.status === 'in_progress' && (
                        <button
                          type="button"
                          onClick={() => handleTransition('awaiting_parts')}
                          disabled={transitionLoading}
                          className="px-3.5 py-2 rounded-xl bg-[#FF2B3A]/10 hover:bg-[#FF2B3A]/20 text-[#FF2B3A] border border-[#FF2B3A]/40 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>Flag as Blocked (Parts Shortage)</span>
                        </button>
                      )}

                      {selectedWO.status === 'awaiting_parts' && (
                        <button
                          type="button"
                          onClick={() => handleTransition('in_progress')}
                          disabled={transitionLoading}
                          className="px-3.5 py-2 rounded-xl bg-[#BFF549] hover:bg-[#8CC21F] text-black text-xs font-bold shadow-glaido-button transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5 text-black" />
                          <span>Parts Received: Resume In Progress</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Technician Assignment Panel (if pending or unassigned) */}
                  {(!selectedWO.assigned_technician_id || selectedWO.status === 'pending') && (
                    <div className="p-4 rounded-xl bg-[#0D0D0D] border border-white/[0.08] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#BFF549]" />
                          <span>AI Explainable Staff Allocation</span>
                        </span>
                        <span className="text-[10px] text-neutral-400">Ranked by Skills, Certifications & Workloads</span>
                      </div>

                      {candidatesLoading ? (
                        <div className="p-4 text-center text-xs text-neutral-400 animate-pulse">
                          Evaluating technician skill profiles and live duty shifts...
                        </div>
                      ) : candidates.length === 0 ? (
                        <div className="p-3 text-center text-xs text-neutral-500 bg-[#1A1A1A] rounded-lg">
                          No certified technicians currently on duty for this trade category.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {candidates.map((cand) => (
                            <div key={cand.user_id} className="p-3 rounded-lg bg-[#1A1A1A] border border-white/[0.08] flex items-center justify-between text-xs">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-white">{cand.full_name}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#BFF549]/10 text-[#BFF549] font-mono">
                                    {(cand.score * 100).toFixed(0)}% Match
                                  </span>
                                  <span className="text-[10px] text-neutral-400">
                                    Load: <strong className="text-white">{cand.current_workload} active</strong>
                                  </span>
                                </div>
                                <div className="text-[11px] text-neutral-400 leading-snug">
                                  {cand.recommendation_reason}
                                </div>
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {cand.matched_skills?.map((sk: string, i: number) => (
                                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.05] text-neutral-300">
                                      {sk}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAssign(cand.user_id)}
                                disabled={transitionLoading}
                                className="px-3.5 py-1.5 bg-[#BFF549] hover:bg-[#8CC21F] disabled:opacity-40 text-black font-bold rounded-lg text-xs cursor-pointer shadow-glaido-button shrink-0 ml-3"
                              >
                                Dispatch
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resolution Notes & Log */}
                  <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                    <span className="text-xs font-bold text-white block">Field Investigation History:</span>
                    <div className="bg-[#0D0D0D] p-3.5 rounded-xl border border-white/[0.08] text-xs text-neutral-300 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                      {selectedWO.resolution_notes || 'No field investigation notes logged yet.'}
                    </div>

                    <form onSubmit={handleAddNote} className="flex space-x-2">
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add field note (e.g. isolated panel, replaced breaker, tested continuity)..."
                        className="flex-1 bg-[#0D0D0D] border border-white/[0.10] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus-ring"
                      />
                      <button
                        type="submit"
                        disabled={transitionLoading || !notes.trim()}
                        className="px-3.5 py-2 bg-[#242424] hover:bg-[#2F2F2F] text-white border border-white/[0.08] rounded-xl text-xs font-semibold cursor-pointer shrink-0 disabled:opacity-40"
                      >
                        Add Note
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-neutral-500 text-xs bg-[#1A1A1A] rounded-2xl border border-white/[0.08]">
                  Select a work order from the dispatch queue.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: STAFF SKILLS & SHIFT ROSTER */}
        {activeTab === 'roster' && (
          <div className="bg-[#1A1A1A] border border-white/[0.08] rounded-2xl p-6 shadow-glaido-card space-y-4 card-sheen">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#BFF549]" />
                  <span>Campus Maintenance Staff Roster & Skill Certifications</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Real-time visibility into technician specialty certificates, active shift windows, and active ticket workloads.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#BFF549] bg-[#BFF549]/10 px-2 py-0.5 rounded-full border border-[#BFF549]/30">
                Shift Calendar Synchronized
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffRoster.map((s, idx) => (
                <div key={idx} className="bg-[#0D0D0D] p-4 rounded-xl border border-white/[0.08] space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white">{s.full_name}</h3>
                      <span className="text-[10px] text-neutral-400 block">{s.title}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      s.is_on_duty 
                        ? 'bg-[#BFF549]/10 text-[#BFF549] border-[#BFF549]/30' 
                        : 'bg-[#FF2B3A]/10 text-[#FF2B3A] border-[#FF2B3A]/30'
                    }`}>
                      {s.is_on_duty ? 'ON DUTY' : 'OFF DUTY'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span>Shift Window:</span>
                      <span className="font-mono text-neutral-200">{s.shift}</span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-400">
                      <span>Active Workload:</span>
                      <span className="font-bold text-[#BFF549]">{s.current_workload} tickets</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06]">
                    <span className="text-[10px] font-bold text-neutral-400 block mb-1.5">Trade Certifications:</span>
                    <div className="flex flex-wrap gap-1">
                      {s.skills?.map((sk: string, i: number) => (
                        <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#BFF549]/10 text-[#BFF549] border border-[#BFF549]/20">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
