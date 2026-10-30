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
  Lock
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
      setReserveSuccess(`Successfully reserved ${res.quantity_reserved} units! New available: ${res.new_available_quantity}`);
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
      setPrSuccess(`Purchase Request ${res.pr_number} created by ${activeUser.name}!`);
      await loadData();
    } catch (err) {
      setPrError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprovePR = async (prId: string) => {
    setActionLoading(true);
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
      alert(`PR ${updated.pr_number} approved successfully!`);
      await loadData();
    } catch (err) {
      alert(`Procurement Error: ${(err as Error).message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Package className="w-6 h-6 text-amber-400" />
            <span>Spare Parts Inventory & Procurement</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enforces negative stock prevention and strict anti-self-approval on purchase orders.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs flex items-center space-x-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stock Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Critical Spare Parts Stock
          </h2>
          <span className="text-xs text-slate-400">{items.length} SKUs registered</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">SKU / Code</th>
                <th className="p-3.5">Item Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 text-right">On Hand</th>
                <th className="p-3.5 text-right">Reserved</th>
                <th className="p-3.5 text-right">Available</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {items.map((item) => {
                const available = item.quantity_on_hand - item.quantity_reserved;
                const isLow = available <= item.reorder_threshold;
                return (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-white">{item.sku}</td>
                    <td className="p-3.5 font-medium text-slate-100">{item.name}</td>
                    <td className="p-3.5 capitalize text-slate-400">{item.category}</td>
                    <td className="p-3.5 text-right font-mono">{item.quantity_on_hand}</td>
                    <td className="p-3.5 text-right font-mono text-amber-400">{item.quantity_reserved}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-400">{available}</td>
                    <td className="p-3.5 text-slate-400">{item.location || 'Warehouse A'}</td>
                    <td className="p-3.5">
                      {isLow ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-800">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                          Sufficient
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Section: Stock Reservation Simulator vs Procurement Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Stock Reservation Simulator (Negative Stock Guard) */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleReserve}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4"
          >
            <div>
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Stock Reservation Simulator (AC-06.1)
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Atomic database reservation query prevents inventory from ever dipping below zero.
              </p>
            </div>

            {reserveSuccess && (
              <div className="p-3 bg-emerald-950/70 border border-emerald-700 text-emerald-300 rounded-lg text-xs">
                {reserveSuccess}
              </div>
            )}

            {reserveError && (
              <div className="p-3 bg-rose-950/70 border border-rose-700 text-rose-300 rounded-lg text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Negative Stock Guard Prevented Transaction</span>
                  <span>{reserveError}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Select Part</label>
              <select
                value={reserveItemId}
                onChange={(e) => setReserveItemId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name} (Available: {it.quantity_on_hand - it.quantity_reserved})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Quantity to Reserve
              </label>
              <input
                type="number"
                value={reserveQty}
                onChange={(e) => setReserveQty(Number(e.target.value))}
                min={1}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Tip: Enter &gt; available quantity (e.g. 999) to verify atomic rejection.
              </span>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center justify-center space-x-1.5"
            >
              <Package className="w-4 h-4" />
              <span>{actionLoading ? 'Verifying...' : 'Attempt Stock Reservation'}</span>
            </button>
          </form>
        </div>

        {/* Right: Procurement Approvals & Anti-Self-Approval (AC-06.2) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                  <Lock className="w-4 h-4 text-blue-400" />
                  <span>Purchase Orders & Anti-Self-Approval (AC-06.2)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Strict separation of duties: Approver must be distinct from Requester.
                </p>
              </div>
            </div>

            {/* PR List */}
            <div className="space-y-3">
              {purchases.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-950 rounded-lg border border-slate-800">
                  No purchase requests currently pending.
                </div>
              ) : (
                purchases.map((pr) => {
                  const isApproved = pr.status === 'approved';
                  const activeUser = getActiveUser();
                  const isRequester = activeUser.id === pr.requester_id;

                  return (
                    <div
                      key={pr.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-white">{pr.pr_number}</span>
                          <h4 className="font-semibold text-slate-200 mt-0.5">{pr.item_name}</h4>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isApproved
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {pr.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-slate-400 text-[11px] pt-1">
                        <div>Quantity: <strong className="text-slate-200">{pr.quantity}</strong></div>
                        <div>Total: <strong className="text-slate-200">${(pr.quantity * pr.estimated_unit_cost).toFixed(2)}</strong></div>
                        <div>Vendor: <strong className="text-slate-200">{pr.vendor}</strong></div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">
                          Requested by: <strong className="text-slate-300">{pr.requester_name || pr.requester_id}</strong>
                          {isRequester && <span className="text-rose-400 font-semibold ml-1">(You)</span>}
                        </span>

                        {!isApproved && (
                          <button
                            onClick={() => handleApprovePR(pr.id)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded font-semibold flex items-center space-x-1"
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
            <form onSubmit={handleCreatePR} className="border-t border-slate-800 pt-4 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Submit New Purchase Request
              </span>

              {prSuccess && (
                <div className="p-3 bg-emerald-950/70 border border-emerald-700 text-emerald-300 rounded-lg text-xs">
                  {prSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Item Description</label>
                  <input
                    type="text"
                    value={prItemName}
                    onChange={(e) => setPrItemName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={prQty}
                    onChange={(e) => setPrQty(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Est. Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prUnitCost}
                    onChange={(e) => setPrUnitCost(Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Supplier / Vendor</label>
                  <input
                    type="text"
                    value={prVendor}
                    onChange={(e) => setPrVendor(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded text-xs font-semibold flex items-center justify-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Purchase Request</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

