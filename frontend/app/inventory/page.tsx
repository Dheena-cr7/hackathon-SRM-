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
import RoleGuard from '@/components/RoleGuard';

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
        fetchWithAuth('/inventory').catch(() => fetchWithAuth('/inventory/items')).catch(() => []),
        fetchWithAuth('/inventory/purchases').catch(() => fetchWithAuth('/inventory/purchase-requests')).catch(() => []),
      ]);
      const safeItems = Array.isArray(invData) ? invData : [];
      const safePurchases = Array.isArray(prData) ? prData : [];
      setItems(safeItems);
      setPurchases(safePurchases);
      if (safeItems.length > 0 && !reserveItemId) {
        setReserveItemId(safeItems[0].id);
      }
    } catch (err) {
      console.error('Error loading inventory data:', err);
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
          reserved_by: activeUser?.id || 'usr-default',
        }),
      });
      setReserveSuccess(`Reserved ${res.quantity_reserved} units. Updated uncommitted stock: ${res.new_available_quantity}`);
      setTimeout(() => setReserveSuccess(null), 5000);
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
          requester_id: activeUser?.id || 'usr-default',
        }),
      });
      setPrSuccess(`Requisition order ${res.pr_number} created by ${activeUser?.name || 'Requisitioner'}!`);
      setTimeout(() => setPrSuccess(null), 5000);
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
          approver_id: activeUser?.id || 'usr-default',
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
    <RoleGuard pageName="Inventory & Procurement Approvals">
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-[#BFF549]/10 border border-[#BFF549]/30 text-xs font-semibold text-[#BFF549] mb-2">
            <Boxes className="w-3.5 h-3.5" />
            <span>Warehouse Stock & Procurement Guard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Inventory & Procurement
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Strict negative-stock prevention, work-order component allocation, and anti-self-approval enforcement on purchase orders.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="p-2 px-3 bg-[#1A1A1A] hover:bg-[#242424] border border-white/[0.08] text-neutral-300 hover:text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start sm:self-auto focus-ring cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#BFF549]' : ''}`} />
          <span>Sync Inventory</span>
        </button>
      </div>

      {authError && (
        <div className="p-4 bg-[#FF2B3A]/10 border border-[#FF2B3A]/30 text-[#FF2B3A] rounded-xl text-xs flex items-center space-x-3 animate-fade-in">
          <ShieldAlert className="w-5 h-5 shrink-0 text-[#FF2B3A]" />
          <span className="font-semibold">{authError}</span>
        </div>
      )}

      {/* Stock Table */}
      <div className="bg-[#1A1A1A] rounded-2xl overflow-hidden border border-white/[0.08] shadow-glaido-card card-sheen">
        <div className="p-4 px-5 border-b border-white/[0.06] flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-white">
              Critical Spare Parts Inventory
            </h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">Live campus warehouse stocks & reserved parts allocation</p>
          </div>
          <span className="text-xs text-neutral-400 font-mono">{items.length} SKUs registered</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-[#0D0D0D] text-neutral-400 uppercase text-[10px] tracking-wider border-b border-white/[0.06] font-bold">
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
                  <tr key={item.id} className="hover:bg-[#202020] transition-colors">
                    <td className="p-3.5 px-5 font-mono font-bold text-white">{item.sku}</td>
                    <td className="p-3.5 font-semibold text-neutral-100">{item.name}</td>
                    <td className="p-3.5 capitalize text-neutral-400">{item.category}</td>
                    <td className="p-3.5 text-right font-mono tabular-nums text-neutral-300">{item.quantity_on_hand}</td>
                    <td className="p-3.5 text-right font-mono tabular-nums text-[#FF8A1F] font-semibold">{item.quantity_reserved}</td>
                    <td className="p-3.5 text-right font-mono tabular-nums font-bold text-[#BFF549]">{available}</td>
                    <td className="p-3.5 text-neutral-400">{item.location || 'Central Depot'}</td>
                    <td className="p-3.5 px-5">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-1.5 rounded-full bg-[#0D0D0D] overflow-hidden border border-white/[0.08]">
                          <div 
                            className={`h-full rounded-full ${isLow ? 'bg-[#FF8A1F]' : 'bg-[#BFF549]'}`}
                            style={{ width: `${healthPercent}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${
                          isLow ? 'text-[#FF8A1F]' : 'text-[#BFF549]'
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
        {/* Left: Stock Reservation Simulator */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleReserve}
            className="bg-[#1A1A1A] border border-white/[0.08] p-5 rounded-2xl space-y-4 shadow-glaido-card card-sheen"
          >
            <div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#BFF549]" />
                <h3 className="text-xs font-bold text-white">
                  Atomic Stock Reservation Guard
                </h3>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                Test atomic database constraint that prevents inventory from ever dipping below zero.
              </p>
            </div>

            {reserveSuccess && (
              <div className="p-3 bg-[#BFF549]/10 border border-[#BFF549]/30 text-[#BFF549] rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{reserveSuccess}</span>
              </div>
            )}

            {reserveError && (
              <div className="p-3 bg-[#FF2B3A]/10 border border-[#FF2B3A]/30 text-[#FF2B3A] rounded-xl text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Negative Stock Guard Intercepted</span>
                  <span className="text-[11px] text-red-200">{reserveError}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Select Spare Part SKU</label>
              <select
                value={reserveItemId}
                onChange={(e) => setReserveItemId(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-white/[0.10] rounded-xl px-2.5 py-2 text-xs text-white focus-ring cursor-pointer"
              >
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name} (Available: {it.quantity_on_hand - it.quantity_reserved})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Units to Allocate
              </label>
              <input
                type="number"
                value={reserveQty}
                onChange={(e) => setReserveQty(Number(e.target.value))}
                min={1}
                className="w-full bg-[#0D0D0D] border border-white/[0.10] rounded-xl px-3 py-2 text-xs text-white font-mono focus-ring"
              />
              <span className="text-[11px] text-neutral-500 mt-1 block">
                Tip: Enter &gt; uncommitted stock (e.g. 500) to test transaction rollback.
              </span>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 bg-[#BFF549] hover:bg-[#8CC21F] disabled:opacity-40 text-black font-bold rounded-xl text-xs shadow-glaido-button transition-all active:scale-[0.98] flex items-center justify-center space-x-1.5 focus-ring cursor-pointer"
            >
              <Package className="w-4 h-4 text-black" />
              <span>{actionLoading ? 'Executing Check...' : 'Attempt Reservation'}</span>
            </button>
          </form>
        </div>

        {/* Right: Procurement Approvals & Anti-Self-Approval */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#1A1A1A] border border-white/[0.08] p-5 rounded-2xl space-y-4 shadow-glaido-card card-sheen">
            <div className="border-b border-white/[0.06] pb-3">
              <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Lock className="w-4 h-4 text-[#BFF549]" />
                <span>Purchase Requisitions & Separation of Duties</span>
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Anti-self-approval rule: Approver identity cannot match Requisition author.
              </p>
            </div>

            {/* PR List */}
            <div className="space-y-2.5">
              {purchases.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-400 bg-[#0D0D0D] rounded-xl border border-white/[0.08]">
                  No purchase requisitions currently pending review.
                </div>
              ) : (
                purchases.map((pr) => {
                  const isApproved = pr.status === 'approved';
                  const activeUser = getActiveUser();
                  const isRequester = activeUser ? activeUser.id === pr.requester_id : false;

                  return (
                    <div
                      key={pr.id}
                      className="p-3.5 rounded-xl bg-[#0D0D0D] border border-white/[0.08] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-white">{pr.pr_number}</span>
                          <h4 className="font-semibold text-neutral-200 mt-0.5">{pr.item_name}</h4>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isApproved
                            ? 'bg-[#BFF549]/10 text-[#BFF549] border-[#BFF549]/30'
                            : 'bg-[#FF8A1F]/10 text-[#FF8A1F] border-[#FF8A1F]/30'
                        }`}>
                          {pr.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-neutral-400 text-[11px] pt-1 border-t border-white/[0.04]">
                        <div>Quantity: <strong className="text-white">{pr.quantity}</strong></div>
                        <div>Total: <strong className="text-white">${(pr.quantity * pr.estimated_unit_cost).toFixed(2)}</strong></div>
                        <div>Vendor: <strong className="text-white truncate block">{pr.vendor}</strong></div>
                      </div>

                      <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
                        <span className="text-neutral-400">
                          Author: <strong className="text-neutral-200">{pr.requester_name || pr.requester_id}</strong>
                          {isRequester && <span className="text-[#FF8A1F] font-semibold ml-1">(Your Requisition)</span>}
                        </span>

                        {!isApproved && (
                          <button
                            type="button"
                            onClick={() => handleApprovePR(pr.id)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-[#BFF549] hover:bg-[#8CC21F] disabled:opacity-40 text-black font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-glaido-button active:scale-[0.98] focus-ring cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-black" />
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
              <span className="text-xs font-bold text-white block">
                Submit New Requisition
              </span>

              {prSuccess && (
                <div className="p-3 bg-[#BFF549]/10 border border-[#BFF549]/30 text-[#BFF549] rounded-xl text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{prSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Item Description</label>
                  <input
                    type="text"
                    value={prItemName}
                    onChange={(e) => setPrItemName(e.target.value)}
                    required
                    className="w-full bg-[#0D0D0D] border border-white/[0.10] rounded-xl px-2.5 py-1.5 text-xs text-white focus-ring"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={prQty}
                    onChange={(e) => setPrQty(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full bg-[#0D0D0D] border border-white/[0.10] rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Estimated Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prUnitCost}
                    onChange={(e) => setPrUnitCost(Number(e.target.value))}
                    required
                    className="w-full bg-[#0D0D0D] border border-white/[0.10] rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus-ring"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Authorized Supplier</label>
                  <input
                    type="text"
                    value={prVendor}
                    onChange={(e) => setPrVendor(e.target.value)}
                    required
                    className="w-full bg-[#0D0D0D] border border-white/[0.10] rounded-xl px-2.5 py-1.5 text-xs text-white focus-ring"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2 bg-[#242424] hover:bg-[#2F2F2F] border border-white/[0.08] text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm active:scale-[0.98] focus-ring cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit Requisition for Approval</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}
