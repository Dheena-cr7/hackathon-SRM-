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
  Cpu
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

  const loadWorkOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/work-orders');
      setWorkOrders(data);
      if (data.length > 0 && !selectedWO) {
        setSelectedWO(data[0]);
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
    } catch (err) {
      alert(`Assignment failed: ${(err as Error).message}`);
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleTransition = async (toStatus: string) => {
    if (!selectedWO) return;
    setTransitionLoading(true);
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
    } catch (err) {
      alert(`State machine error: ${(err as Error).message}`);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Wrench className="w-6 h-6 text-blue-400" />
            <span>Work Orders & Technician Dispatch</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Explainable candidate matching, skill certifications, and strict state machine lifecycle transitions.
          </p>
        </div>
        <button
          onClick={loadWorkOrders}
          disabled={loading}
          className="p-2 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs flex items-center space-x-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Work Order Queue */}
        <div className="lg:col-span-5 space-y-3">
          {loading && workOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading work orders...</div>
          ) : workOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-xl">
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
                          {wo.work_order_number}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-700/60">
                          {wo.priority}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-200 mt-1 line-clamp-1">
                        {wo.title}
                      </h4>
                    </div>

                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border capitalize ${
                      isCompleted
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : 'bg-slate-950 text-amber-300 border-amber-800/60'
                    }`}>
                      {wo.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                    <span className="capitalize">{wo.category}</span>
                    <span className="text-slate-300 font-medium">
                      {wo.assigned_technician_name ? `Tech: ${wo.assigned_technician_name}` : 'Unassigned'}
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
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-base font-extrabold text-blue-400">
                      {selectedWO.work_order_number}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-700/60">
                      {selectedWO.priority} Priority
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">
                    {selectedWO.title}
                  </h2>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Current Lifecycle State</span>
                  <span className="text-xs font-bold uppercase font-mono px-2.5 py-1 rounded bg-slate-950 text-amber-400 border border-slate-700 inline-block mt-0.5">
                    {selectedWO.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Scope of Work
                </span>
                <p className="text-sm text-slate-200 bg-slate-950 p-3.5 rounded-lg border border-slate-800 leading-relaxed">
                  {selectedWO.description}
                </p>
              </div>

              {/* Assigned Technician or Explainable Candidate Allocator */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span>Technician Allocation Engine</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Explainable Match</span>
                </div>

                {selectedWO.assigned_technician_name ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">
                          {selectedWO.assigned_technician_name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {selectedWO.assigned_technician_email || 'Certified Field Technician'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-400 font-medium bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800">
                      Active Dispatch
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {candidatesLoading ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Evaluating technician certifications, shift availability, and active workloads...
                      </div>
                    ) : candidates.length === 0 ? (
                      <div className="p-4 bg-slate-950 rounded-lg text-xs text-slate-400 border border-slate-800">
                        No certified candidates currently available for this category.
                      </div>
                    ) : (
                      candidates.map((cand) => (
                        <div
                          key={cand.id}
                          className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white text-sm">{cand.name}</span>
                              <span className="text-emerald-400 font-mono text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                                Match Score: {(cand.score * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">
                              <span>Workload: <strong className="text-slate-200">{cand.active_work_orders}</strong> active</span>
                              <span className="mx-2">•</span>
                              <span>Shift: <strong className="text-slate-200 capitalize">{cand.shift}</strong></span>
                            </div>
                            <div className="text-[11px] text-blue-400 mt-0.5 font-medium">
                              Skills: {cand.certifications.join(', ')}
                            </div>
                          </div>

                          <button
                            onClick={() => handleAssign(cand.id)}
                            disabled={transitionLoading}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center space-x-1 shadow-sm whitespace-nowrap"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Dispatch Technician</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* State Machine Transition Actions */}
              <div className="border-t border-slate-800 pt-5 space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Deterministic Lifecycle Transitions
                </span>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional transition notes / work summary..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {getValidTransitions(selectedWO.status).map((targetStatus) => (
                    <button
                      key={targetStatus}
                      onClick={() => handleTransition(targetStatus)}
                      disabled={transitionLoading}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-blue-600 hover:text-white border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Advance to &quot;{targetStatus.replace('_', ' ')}&quot;</span>
                    </button>
                  ))}
                  {getValidTransitions(selectedWO.status).length === 0 && (
                    <span className="text-xs text-slate-500 italic">
                      Terminal state reached ({selectedWO.status}). No further transitions allowed.
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              Select a work order from the queue to view dispatch options and lifecycle state transitions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
