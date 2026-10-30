'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Plus, 
  ArrowRight, 
  RefreshCw,
  FileCheck,
  XCircle,
  Lock,
  Boxes,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { fetchWithAuth, getActiveUser } from '@/lib/api';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Reservation Form State
  const [reserveItemId, setReserveItemId] = useState('');
  const [reserveQty, setReserveQty] = useState(2);
  const [reserveSuccess, setReserveSuccess] = useState<string | null>(null);
  const [reserveError, setReserveError] = useState<string | null>(null);

  // New Purchase Request State
  const [prItemName, setPrItemName] = useState('Siemens 32A Industrial Breaker');
  const [prQty, setPrQty] = useState(10);
  const [prUnitCost, setPrUnitCost] = useState(45.0);
  const [prVendor, setPrVendor] = useState('Schneider / Siemens Direct');
  const [prJustification, setPrJustification] = useState('Emergency spare stock replenishment');
  const [prSuccess, setPrSuccess] = useState<string | null>(null);
  const [prError, setPrError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invData, prData] = await Promise.all([
        fetchWithAuth('/inventory'),
        fetchWithAuth('/inventory/purchases'),
      ]);
      setItems(invData);
      setPurchases(prData);
      if (invData.length > 0 && !reserveItemId) {
        setReserveItemId(invData[0].id);
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

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setReserveSuccess(null);
    setReserveError(null);

    try {
      const activeUser = getActiveUser();
      const res = await fetchWithAuth('/inventory/reserve', {
        method: 'POST',
        body: JSON.stringify({
          item_id: reserveItemId,
          quantity: Number(reserveQty),
          work_order_id: null,
          reserved_by: activeUser.id,
        }),
      });
      setReserveSuccess(`Reserved ${res.quantity_reserved} units. Updated uncommitted stock: ${res.new_available_quantity}`);
      await loadData();
    } catch (err) {
      setReserveError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePR = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setPrSuccess(null);
    setPrError(null);

    try {
      const activeUser = getActiveUser();
      const res = await fetchWithAuth('/inventory/purchases', {
        method: 'POST',
        body: JSON.stringify({
          item_name: prItemName,
          quantity: Number(prQty),
          estimated_unit_cost: Number(prUnitCost),
          vendor: prVendor,
          justification: prJustification,
          requester_id: activeUser.id,
        }),
      });
      setPrSuccess(`Requisition order ${res.pr_number} created by ${activeUser.name}!`);
      await loadData();
    } catch (err) {
      setPrError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprovePR = async (prId: string) => {
    setActionLoading(true);
    setAuthError(null);
    try {
      const activeUser = getActiveUser();
      const updated = await fetchWithAuth(`/inventory/purchases/${prId}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          approver_id: activeUser.id,
          decision: 'approved',
          comments: 'Approved under facilities threshold limit',
        }),
      });
      await loadData();
    } catch (err) {
      setAuthError(`Procurement Audit Guard: ${(err as Error).message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400 mb-2">
            <Boxes className="w-3.5 h-3.5" />
            <span>Atomic Stock Engine & Separation of Duties</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Inventory & Procurement
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Strict negative-stock prevention (AC-06.1) and role-enforced anti-self-approval (AC-06.2) on all procurement requisitions.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Inventory</span>
        </button>
      </div>

      {authError && (
        <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center space-x-2.5 animate-in fade-in">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{authError}</span>
        </div>
      )}

      {/* Stock Table */}
      <div className="card-glass rounded-2xl overflow-hidden border border-white/[0.06]">
        <div className="p-4 px-5 border-b border-white/[0.06] flex justify-between items-center">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Critical Spare Parts Inventory
            </h2>
            <p className="text-[11px] text-zinc-500">Live warehouse stocks & reserved parts allocation</p>
          </div>
          <span className="text-xs text-zinc-400 font-mono">{items.length} SKUs registered</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950/80 text-zinc-500 uppercase text-[10px] tracking-wider border-b border-white/[0.06]">
              <tr>
                <th className="p-3.5 px-5">SKU Designation</th>
                <th className="p-3.5">Component Name</th>
                <th className="p-3.5">Trade Category</th>
                <th className="p-3.5 text-right">Physical On Hand</th>
                <th className="p-3.5 text-right">Work Order Hold</th>
                <th className="p-3.5 text-right">Net Available</th>
                <th className="p-3.5">Facility Bay</th>
                <th className="p-3.5 px-5">Stock Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {items.map((item) => {
                const available = item.quantity_on_hand - item.quantity_reserved;
                const isLow = available <= item.reorder_threshold;
                const healthPercent = Math.min(100, Math.round((available / Math.max(1, item.quantity_on_hand)) * 100));

                return (
                  <tr key={item.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="p-3.5 px-5 font-mono font-semibold text-white">{item.sku}</td>
                    <td className="p-3.5 font-medium text-zinc-200">{item.name}</td>
                    <td className="p-3.5 capitalize text-zinc-400">{item.category}</td>
                    <td className="p-3.5 text-right font-mono tabular-nums text-zinc-300">{item.quantity_on_hand}</td>
                    <td className="p-3.5 text-right font-mono tabular-nums text-amber-400">{item.quantity_reserved}</td>
                    <td className="p-3.5 text-right font-mono tabular-nums font-semibold text-emerald-400">{available}</td>
                    <td className="p-3.5 text-zinc-400">{item.location || 'Warehouse A'}</td>
                    <td className="p-3.5 px-5">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isLow ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${healthPercent}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-medium uppercase ${
                          isLow ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {isLow ? 'Low' : 'OK'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Section: Stock Reservation Simulator vs Procurement Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Stock Reservation Simulator (Negative Stock Guard) */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleReserve}
            className="card-glass p-5 rounded-2xl space-y-4"
          >
            <div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-zinc-200">
                  Stock Reservation Sandbox (AC-06.1)
                </h3>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                Test atomic database constraint that prevents inventory from ever dipping below zero.
              </p>
            </div>

            {reserveSuccess && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 rounded-lg text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{reserveSuccess}</span>
              </div>
            )}

            {reserveError && (
              <div className="p-3 bg-rose-950/30 border border-rose-500/20 text-rose-300 rounded-lg text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Negative Stock Guard Intercepted</span>
                  <span className="text-[11px] text-rose-200">{reserveError}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Select Spare Part SKU</label>
              <select
                value={reserveItemId}
                onChange={(e) => setReserveItemId(e.target.value)}
                className="w-full bg-zinc-950/70 border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500/60"
              >
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name} (Available: {it.quantity_on_hand - it.quantity_reserved})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Units to Allocate
              </label>
              <input
                type="number"
                value={reserveQty}
                onChange={(e) => setReserveQty(Number(e.target.value))}
                min={1}
                className="w-full bg-zinc-950/70 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500/60 font-mono"
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Tip: Enter &gt; uncommitted stock (e.g. 500) to test immediate transaction abort.
              </span>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium shadow-sm transition-colors flex items-center justify-center space-x-1.5"
            >
              <Package className="w-3.5 h-3.5" />
              <span>{actionLoading ? 'Executing Check...' : 'Attempt Reservation'}</span>
            </button>
          </form>
        </div>

        {/* Right: Procurement Approvals & Anti-Self-Approval (AC-06.2) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card-glass p-5 rounded-2xl space-y-4">
            <div className="border-b border-white/[0.06] pb-3">
              <h3 className="text-xs font-semibold text-zinc-200 flex items-center space-x-1.5">
                <Lock className="w-4 h-4 text-blue-400" />
                <span>Requisitions & Separation-of-Duties (AC-06.2)</span>
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Zero self-approvals allowed: Approver identity cannot match Requisition author.
              </p>
            </div>

            {/* PR List */}
            <div className="space-y-2.5">
              {purchases.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-950/50 rounded-xl border border-white/[0.06]">
                  No purchase requisitions currently pending review.
                </div>
              ) : (
                purchases.map((pr) => {
                  const isApproved = pr.status === 'approved';
                  const activeUser = getActiveUser();
                  const isRequester = activeUser.id === pr.requester_id;

                  return (
                    <div
                      key={pr.id}
                      className="p-3.5 rounded-xl bg-zinc-950/70 border border-white/[0.06] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-xs font-semibold text-zinc-100">{pr.pr_number}</span>
                          <h4 className="font-medium text-zinc-200 mt-0.5">{pr.item_name}</h4>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                          isApproved
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}>
                          {pr.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-zinc-400 text-[11px] pt-1 border-t border-white/[0.04]">
                        <div>Quantity: <strong className="text-zinc-200">{pr.quantity}</strong></div>
                        <div>Total: <strong className="text-zinc-200">${(pr.quantity * pr.estimated_unit_cost).toFixed(2)}</strong></div>
                        <div>Vendor: <strong className="text-zinc-200 truncate block">{pr.vendor}</strong></div>
                      </div>

                      <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">
                          Author: <strong className="text-zinc-300">{pr.requester_name || pr.requester_id}</strong>
                          {isRequester && <span className="text-amber-400 font-medium ml-1">(Your Requisition)</span>}
                        </span>

                        {!isApproved && (
                          <button
                            onClick={() => handleApprovePR(pr.id)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors shadow-sm"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Authorize PR</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Create PR Form */}
            <form onSubmit={handleCreatePR} className="border-t border-white/[0.06] pt-4 space-y-3">
              <span className="text-xs font-semibold text-zinc-300 block">
                Submit New Requisition
              </span>

              {prSuccess && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 rounded-lg text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{prSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Item Description</label>
                  <input
                    type="text"
                    value={prItemName}
                    onChange={(e) => setPrItemName(e.target.value)}
                    required
                    className="w-full bg-zinc-950/70 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500/60"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={prQty}
                    onChange={(e) => setPrQty(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full bg-zinc-950/70 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500/60 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Estimated Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prUnitCost}
                    onChange={(e) => setPrUnitCost(Number(e.target.value))}
                    required
                    className="w-full bg-zinc-950/70 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500/60 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Authorized Supplier</label>
                  <input
                    type="text"
                    value={prVendor}
                    onChange={(e) => setPrVendor(e.target.value)}
                    required
                    className="w-full bg-zinc-950/70 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500/60"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-zinc-200 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit Requisition for Approval</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
