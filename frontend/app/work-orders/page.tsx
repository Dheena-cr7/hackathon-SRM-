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
  Package
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

  // Disruption Scenario B State
  const [disruptionLoading, setDisruptionLoading] = useState(false);
  const [disruptionResult, setDisruptionResult] = useState<any | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [woData, rosterData] = await Promise.all([
        fetchWithAuth('/work-orders'),
        fetchWithAuth('/work-orders/staff-roster').catch(() => []),
      ]);
      setWorkOrders(woData);
      setStaffRoster(rosterData);
      if (woData.length > 0 && !selectedWO) {
        setSelectedWO(woData[0]);
      } else if (selectedWO) {
        const updated = woData.find((w: any) => w.id === selectedWO.id);
        if (updated) setSelectedWO(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedWO && (selectedWO.status === 'pending' || !selectedWO.assigned_technician_id)) {
      loadCandidates(selectedWO.id);
    } else {
      setCandidates([]);
    }
  }, [selectedWO]);

  const loadCandidates = async (woId: string) => {
    try {
      setCandidatesLoading(true);
      const data = await fetchWithAuth(`/work-orders/technician-recommendations/${selectedWO?.category || 'electrical'}`);
      setCandidates(data);
    } catch (err) {
      console.error(err);
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
          reason: 'Dispatcher assigned certified technician',
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
      setActionMessage({ text: `Advanced state to: ${toStatus.replace('_', ' ')}`, type: 'success' });
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
    { key: 'pending', label: 'Pending' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'awaiting_parts', label: 'Parts Wait' },
    { key: 'pending_verification', label: 'Verification' },
    { key: 'completed', label: 'Completed' },
  ];

  const getStageIndex = (status: string) => {
    return lifecycleStages.findIndex(s => s.key === status);
  };

  return (
    <RoleGuard pageName="Technician Dispatch Board">
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-[#BFF549]/10 border border-[#BFF549]/30 text-xs font-semibold text-[#BFF549] mb-2">
            <Wrench className="w-3.5 h-3.5" />
            <span>Field Dispatch & Skill Allocation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Work Order Operations
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Multi-factor technician matching with explainable scoring (certifications, shifts, active loads) and automated reassignment when conditions change.
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
              Work Orders ({workOrders.length})
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
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF8A1F]/10 text-[#FF8A1F] border border-[#FF8A1F]/30">
                  Automated Reassignment
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-3xl leading-relaxed">
                Simulate assigned Technician Rajesh reporting sick mid-shift. The system identifies active tickets, re-evaluates candidate certifications and active loads, and deterministically reassigns to Technician Ananya Verma.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSimulateDisruptionB}
            disabled={disruptionLoading}
            className="px-4 py-2.5 bg-[#FF8A1F] hover:bg-[#E57A18] text-black font-bold rounded-xl text-xs flex items-center space-x-2 shrink-0 transition-all shadow-md cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${disruptionLoading ? 'animate-spin' : ''}`} />
            <span>Simulate Technician Sickness</span>
          </button>
        </div>

        {/* Disruption Result Box */}
        {disruptionResult && (
          <div className="p-4 rounded-xl bg-[#0D0D0D] border border-[#FF8A1F]/40 text-xs space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-[#FF8A1F] font-bold">
              <span>Disruption Handled: {disruptionResult.reassigned_work_orders?.length || 0} Work Order(s) Reassigned</span>
              <span className="text-[10px] font-mono text-neutral-400">Deterministic Reallocation</span>
            </div>
            {disruptionResult.reassigned_work_orders?.map((r: any, idx: number) => (
              <div key={idx} className="p-2.5 rounded-lg bg-[#1A1A1A] border border-white/[0.08] text-[11px] space-y-1">
                <div>Work Order: <span className="font-bold text-white">{r.work_order_number}</span></div>
                <div>New Assignee: <span className="font-bold text-[#BFF549]">{r.new_technician}</span> ({r.new_technician_email})</div>
                <div className="text-neutral-400">Match Justification: <span className="text-neutral-200">{r.reason}</span></div>
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
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Active Dispatch Queue</span>
              <span className="text-xs text-neutral-400">{workOrders.length} orders total</span>
            </div>

            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {workOrders.map((wo) => {
                const isSelected = selectedWO?.id === wo.id;
                const isBlocked = wo.status === 'awaiting_parts';
                return (
                  <div
                    key={wo.id}
                    onClick={() => setSelectedWO(wo)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left card-sheen ${
                      isSelected
                        ? 'bg-[#1A1A1A] border-[#BFF549] shadow-glaido-card'
                        : 'bg-[#1A1A1A] border-white/[0.08] hover:border-white/[0.18]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-white">{wo.work_order_number}</span>
                      <div className="flex items-center space-x-1.5">
                        {isBlocked && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF2B3A]/10 text-[#FF2B3A] border border-[#FF2B3A]/30 flex items-center space-x-1">
                            <Package className="w-3 h-3" />
                            <span>BLOCKED (Parts)</span>
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#242424] text-neutral-300 border border-white/[0.08]">
                          {wo.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-semibold text-white line-clamp-1">{wo.title}</h4>
                    <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">{wo.description}</p>

                    <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-3 pt-2.5 border-t border-white/[0.06]">
                      <span className="capitalize">{wo.category}</span>
                      <span className="font-medium text-neutral-200">
                        {wo.assigned_technician?.full_name || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Work Order Detail & State Machine Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {selectedWO ? (
              <div className="bg-[#1A1A1A] border border-white/[0.08] rounded-2xl p-6 shadow-glaido-card space-y-5 card-sheen">
                <div className="flex items-start justify-between border-b border-white/[0.06] pb-4">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#BFF549] block">{selectedWO.work_order_number}</span>
                    <h2 className="text-base font-bold text-white mt-0.5">{selectedWO.title}</h2>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{selectedWO.description}</p>
                  </div>
                  <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-[#BFF549]/10 text-[#BFF549] border border-[#BFF549]/30">
                    {selectedWO.status.replace('_', ' ')}
                  </span>
                </div>

                {/* State Machine Transition Buttons */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-white block">State Machine Progression:</span>
                  <div className="flex flex-wrap gap-2">
                    {getValidTransitions(selectedWO.status).map((targetStatus) => (
                      <button
                        key={targetStatus}
                        type="button"
                        onClick={() => handleTransition(targetStatus)}
                        disabled={transitionLoading}
                        className="px-3.5 py-1.5 rounded-xl bg-[#BFF549] hover:bg-[#8CC21F] text-black text-xs font-bold shadow-glaido-button transition-all flex items-center space-x-1.5 cursor-pointer"
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
                        className="px-3.5 py-1.5 rounded-xl bg-[#FF8A1F]/10 hover:bg-[#FF8A1F]/20 text-[#FF8A1F] border border-[#FF8A1F]/40 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Flag as Blocked (Parts Shortage)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Technician Assignment Panel (if pending) */}
                {(!selectedWO.assigned_technician_id || selectedWO.status === 'pending') && (
                  <div className="p-4 rounded-xl bg-[#0D0D0D] border border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#BFF549]" />
                        <span>AI Explainable Staff Allocation</span>
                      </span>
                      <span className="text-[10px] text-neutral-400">Ranked by Skills & Workload</span>
                    </div>

                    <div className="space-y-2">
                      {candidates.map((cand) => (
                        <div key={cand.user_id} className="p-3 rounded-lg bg-[#1A1A1A] border border-white/[0.08] flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-white">{cand.full_name}</div>
                            <div className="text-[10px] text-neutral-400">{cand.recommendation_reason}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAssign(cand.user_id)}
                            className="px-3 py-1 bg-[#BFF549] hover:bg-[#8CC21F] text-black font-bold rounded-lg text-xs cursor-pointer"
                          >
                            Dispatch
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution Notes & Log */}
                <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                  <span className="text-xs font-bold text-white block">Field Investigation History:</span>
                  <div className="bg-[#0D0D0D] p-3 rounded-xl border border-white/[0.08] text-xs text-neutral-300 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {selectedWO.resolution_notes || 'No field investigation notes logged yet.'}
                  </div>

                  <form onSubmit={handleAddNote} className="flex space-x-2">
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add technician field note (e.g. replaced circuit breaker, tested continuity)..."
                      className="flex-1 bg-[#0D0D0D] border border-white/[0.10] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus-ring"
                    />
                    <button
                      type="submit"
                      disabled={transitionLoading || !notes.trim()}
                      className="px-3.5 py-2 bg-[#242424] hover:bg-[#2F2F2F] text-white border border-white/[0.08] rounded-xl text-xs font-semibold cursor-pointer"
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
