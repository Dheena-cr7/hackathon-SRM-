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
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Layers,
  Sparkles,
  Check
} from 'lucide-react';
import { fetchWithAuth, getActiveUser } from '@/lib/api';

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [selectedWO, setSelectedWO] = useState<any | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadWorkOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/work-orders');
      setWorkOrders(data);
      if (data.length > 0 && !selectedWO) {
        setSelectedWO(data[0]);
      } else if (selectedWO) {
        const updated = data.find((w: any) => w.id === selectedWO.id);
        if (updated) setSelectedWO(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkOrders();
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
      const data = await fetchWithAuth(`/work-orders/${woId}/candidates`);
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
      const activeUser = getActiveUser();
      const updated = await fetchWithAuth(`/work-orders/${selectedWO.id}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          technician_id: technicianId,
          assigned_by: activeUser.id,
        }),
      });
      setSelectedWO(updated);
      await loadWorkOrders();
      setActionMessage({ text: 'Technician dispatched and work order assigned!', type: 'success' });
    } catch (err) {
      setActionMessage({ text: `Assignment failed: ${(err as Error).message}`, type: 'error' });
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
          to_status: toStatus,
          notes: notes || undefined,
        }),
      });
      setSelectedWO(updated);
      setNotes('');
      await loadWorkOrders();
      setActionMessage({ text: `Advanced state to: ${toStatus.replace('_', ' ')}`, type: 'success' });
    } catch (err) {
      setActionMessage({ text: `State machine transition rejected: ${(err as Error).message}`, type: 'error' });
    } finally {
      setTransitionLoading(false);
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400 mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Deterministic Allocation & State Machine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Work Order Operations
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Multi-factor technician matching with explainable scoring (certifications, proximity, shift workload) and strict lifecycle transitions.
          </p>
        </div>

        <button
          onClick={loadWorkOrders}
          disabled={loading}
          className="p-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Pipeline</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Work Order Queue */}
        <div className="lg:col-span-5 space-y-2.5">
          {loading && workOrders.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs">Loading work order queue...</div>
          ) : workOrders.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs card-glass rounded-2xl">
              No active work orders in the queue.
            </div>
          ) : (
            workOrders.map((wo) => {
              const isSelected = selectedWO?.id === wo.id;
              const isCompleted = wo.status === 'completed';

              return (
                <div
                  key={wo.id}
                  onClick={() => setSelectedWO(wo)}
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
                          {wo.work_order_number}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {wo.priority}
                        </span>
                      </div>
                      <h4 className="text-xs font-medium text-zinc-200 mt-1.5 truncate">
                        {wo.title}
                      </h4>
                    </div>

                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded capitalize whitespace-nowrap ${
                      isCompleted
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }`}>
                      {wo.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 border-t border-white/[0.04] pt-2">
                    <span className="capitalize text-zinc-400">{wo.category} trade</span>
                    <span className="text-zinc-300 font-medium">
                      {wo.assigned_technician_name ? `${wo.assigned_technician_name}` : 'Unassigned'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Work Order Inspector & Actions */}
        <div className="lg:col-span-7">
          {selectedWO ? (
            <div className="card-glass p-6 rounded-2xl space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-base font-semibold text-blue-400">
                      {selectedWO.work_order_number}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {selectedWO.priority} Priority
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-white mt-1.5 tracking-tight">
                    {selectedWO.title}
                  </h2>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-[11px] text-zinc-500 block">Lifecycle State</span>
                  <span className="text-xs font-semibold capitalize font-mono px-2.5 py-1 rounded bg-zinc-950/80 text-amber-300 border border-white/[0.08] inline-block mt-1">
                    {selectedWO.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {actionMessage && (
                <div className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
                  actionMessage.type === 'success' 
                    ? 'bg-emerald-950/30 border border-emerald-500/20 text-emerald-300' 
                    : 'bg-rose-950/30 border border-rose-500/20 text-rose-300'
                }`}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{actionMessage.text}</span>
                </div>
              )}

              {/* Visual Lifecycle Stepper */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-zinc-400 block">Workflow State Pipeline</span>
                <div className="grid grid-cols-6 gap-1 bg-zinc-950/60 p-2 rounded-xl border border-white/[0.06]">
                  {lifecycleStages.map((stage, idx) => {
                    const currentIndex = getStageIndex(selectedWO.status);
                    const isPast = idx < currentIndex;
                    const isCurrent = idx === currentIndex;

                    return (
                      <div 
                        key={stage.key}
                        className={`text-center py-2 px-1 rounded-lg text-[10px] font-medium transition-all ${
                          isCurrent
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-semibold'
                            : isPast
                            ? 'bg-zinc-900/80 text-zinc-400'
                            : 'text-zinc-600'
                        }`}
                      >
                        <div className="flex items-center justify-center mb-1">
                          {isPast ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-blue-400 animate-pulse' : 'bg-zinc-700'}`}></span>
                          )}
                        </div>
                        <span className="truncate block">{stage.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Scope of Work */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-zinc-400">
                  Scope of Work & Diagnostics
                </span>
                <p className="text-xs text-zinc-200 bg-zinc-950/60 p-3.5 rounded-xl border border-white/[0.06] leading-relaxed">
                  {selectedWO.description}
                </p>
              </div>

              {/* Technician Allocation / Explainable Match Engine */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300 flex items-center space-x-1.5">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span>Technician Allocation Engine</span>
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">Multi-Factor Algorithm</span>
                </div>

                {selectedWO.assigned_technician_name ? (
                  <div className="p-4 rounded-xl bg-zinc-950/70 border border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-semibold">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {selectedWO.assigned_technician_name}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {selectedWO.assigned_technician_email || 'Certified Field Technician'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                      Active Dispatch
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {candidatesLoading ? (
                      <div className="p-6 text-center text-xs text-zinc-400 flex items-center justify-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                        <span>Evaluating certifications, proximity, and queue load...</span>
                      </div>
                    ) : candidates.length === 0 ? (
                      <div className="p-4 bg-zinc-950/60 rounded-xl text-xs text-zinc-400 border border-white/[0.06]">
                        No certified candidates currently available in active shift.
                      </div>
                    ) : (
                      candidates.map((cand) => (
                        <div
                          key={cand.id}
                          className="p-3.5 rounded-xl bg-zinc-950/70 border border-white/[0.06] hover:border-white/[0.12] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-white text-xs">{cand.name}</span>
                              <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                Match Score: {(cand.score * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-1 flex items-center space-x-3">
                              <span>Queue: <strong className="text-zinc-200">{cand.active_work_orders}</strong> active</span>
                              <span className="text-zinc-600">•</span>
                              <span>Shift: <strong className="text-zinc-200 capitalize">{cand.shift}</strong></span>
                            </div>
                            <div className="text-[11px] text-blue-400 mt-1 font-medium">
                              Certifications: {cand.certifications.join(', ')}
                            </div>
                          </div>

                          <button
                            onClick={() => handleAssign(cand.id)}
                            disabled={transitionLoading}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Dispatch</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* State Machine Transition Actions */}
              <div className="border-t border-white/[0.06] pt-5 space-y-3">
                <span className="text-xs font-semibold text-zinc-300 block">
                  Deterministic Lifecycle Execution
                </span>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Transition notes or technician field sign-off remark..."
                    className="flex-1 bg-zinc-950/70 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {getValidTransitions(selectedWO.status).map((targetStatus) => (
                    <button
                      key={targetStatus}
                      onClick={() => handleTransition(targetStatus)}
                      disabled={transitionLoading}
                      className="px-3.5 py-2 bg-zinc-900 hover:bg-blue-600 hover:text-white border border-white/[0.08] text-zinc-200 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors shadow-sm"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Advance to &quot;{targetStatus.replace('_', ' ')}&quot;</span>
                    </button>
                  ))}
                  {getValidTransitions(selectedWO.status).length === 0 && (
                    <span className="text-xs text-zinc-500 italic">
                      Terminal state reached ({selectedWO.status}). Strict state machine forbids further mutation.
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-zinc-500 card-glass rounded-2xl text-xs">
              Select a work order from the queue to view dispatch options and lifecycle state transitions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
