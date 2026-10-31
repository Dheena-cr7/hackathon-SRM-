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
  Building2,
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { fetchWithAuth, getActiveUser, AUTHORIZED_ACCOUNTS } from '@/lib/api';
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
  const [prItemId, setPrItemId] = useState<string>('');
  const [prItemName, setPrItemName] = useState('Epson Laser Projector Lamp');
  const [prQty, setPrQty] = useState(10);
  const [prUnitCost, setPrUnitCost] = useState(185.0);
  const [prVendor, setPrVendor] = useState('Epson Commercial Direct');
  const [prJustification, setPrJustification] = useState('Critical stock replenishment for campus operations');
  const [prRequesterId, setPrRequesterId] = useState<string>('59fad526-6182-40d9-8d52-6b4138c04ea1'); // Rajesh Kumar default
  const [prSuccess, setPrSuccess] = useState<string | null>(null);
  const [prError, setPrError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Live stock update confirmation toast
  const [recentApproved, setRecentApproved] = useState<{
    itemName: string;
    qtyAdded: number;
    newOnHand: number;
    newAvailable: number;
  } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const ts = Date.now();
      const [invData, prData] = await Promise.all([
        fetchWithAuth(`/inventory?_t=${ts}`).catch(() => fetchWithAuth(`/inventory/items?_t=${ts}`)).catch(() => []),
        fetchWithAuth(`/inventory/purchases?_t=${ts}`).catch(() => fetchWithAuth(`/inventory/purchase-requests?_t=${ts}`)).catch(() => []),
      ]);
      const safeItems = Array.isArray(invData) ? invData : [];
      const safePurchases = Array.isArray(prData) ? prData : [];
      setItems(safeItems);
      setPurchases(safePurchases);
      
      if (safeItems.length > 0 && !reserveItemId) {
        setReserveItemId(safeItems[0].id);
      }
      if (safeItems.length > 0 && !prItemId) {
        setPrItemId(safeItems[0].id);
        setPrItemName(safeItems[0].name);
        setPrUnitCost(safeItems[0].unit_cost || 45.0);
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

  const handleItemSelectChange = (itemId: string) => {
    setPrItemId(itemId);
    const selected = items.find((i) => i.id === itemId);
    if (selected) {
      setPrItemName(selected.name);
      setPrUnitCost(selected.unit_cost || 45.0);
      if (selected.category === 'electrical') setPrVendor('Schneider / Siemens Direct');
      else if (selected.category === 'audiovisual') setPrVendor('Epson Commercial Direct');
      else if (selected.category === 'hvac') setPrVendor('Daikin Global Facilities');
      else if (selected.category === 'network') setPrVendor('Anixter Network Distribution');
      else setPrVendor('Authorized Industrial Partner');
    }
  };

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
      setTimeout(() => setReserveSuccess(null), 6000);
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
      const targetRequester = prRequesterId === 'active_user' ? (activeUser?.id || 'usr-default') : prRequesterId;

      const res = await fetchWithAuth('/inventory/purchases', {
        method: 'POST',
        body: JSON.stringify({
          item_id: prItemId || undefined,
          item_name: prItemName,
          quantity: Number(prQty),
          estimated_unit_cost: Number(prUnitCost),
          vendor: prVendor,
          justification: prJustification,
          requester_id: targetRequester,
        }),
      });
      setPrSuccess(`Requisition order ${res.pr_number} created successfully for ${res.item_name}!`);
      setTimeout(() => setPrSuccess(null), 6000);
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
    setRecentApproved(null);
    try {
      const activeUser = getActiveUser();
      const res = await fetchWithAuth(`/inventory/purchases/${prId}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          approver_id: activeUser?.id || 'usr-default',
          decision: 'approved',
          comments: `Authorized by ${activeUser?.name || 'Administrator'} (${activeUser?.role || 'authorized_role'})`,
        }),
      });

      // Instantly update local items state for zero latency visual feedback
      if (res.item_id && res.new_quantity_on_hand !== undefined) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === res.item_id
              ? {
                  ...it,
                  quantity_on_hand: res.new_quantity_on_hand,
                  available_stock: res.new_available_stock,
                }
              : it
          )
        );
      }

      // Mark purchase request approved in list
      setPurchases((prev) =>
        prev.map((p) =>
          p.id === prId ? { ...p, status: 'approved' } : p
        )
      );

      // Display high-visibility stock update notification
      setRecentApproved({
        itemName: res.item_name || 'Component SKU',
        qtyAdded: res.quantity_added || 0,
        newOnHand: res.new_quantity_on_hand || 0,
        newAvailable: res.new_available_stock || 0,
      });

      // Re-synchronize with database in background
      await loadData();
    } catch (err) {
      setAuthError(`Procurement Audit Intercept: ${(err as Error).message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const activeUser = getActiveUser();
  const isSysAdmin = activeUser?.role === 'system_admin';

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
              Negative-stock prevention, work-order part reservations, and anti-self-approval enforcement with instant inventory replenishment.
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

        {/* Live Stock Replenishment Banner */}
        {recentApproved && (
          <div className="p-4 bg-[#BFF549]/10 border border-[#BFF549]/40 text-white rounded-xl text-xs flex items-center justify-between shadow-glaido-card animate-fade-in">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-[#BFF549] shrink-0" />
              <div>
                <span className="font-bold text-[#BFF549] block text-sm">
                  Requisition Authorized & Live Stock Replenished!
                </span>
                <span className="text-neutral-300">
                  Added <strong className="text-white">+{recentApproved.qtyAdded}</strong> units to <strong className="text-white">{recentApproved.itemName}</strong>. 
                  Physical on hand is now <strong className="text-white font-mono">{recentApproved.newOnHand}</strong> | 
                  Net uncommitted available: <strong className="text-[#BFF549] font-mono text-sm">{recentApproved.newAvailable}</strong>.
                </span>
              </div>
            </div>
            <button 
              onClick={() => setRecentApproved(null)}
              className="text-neutral-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Audit Guard Intercept Warning */}
        {authError && (
          <div className="p-4 bg-[#FF2B3A]/10 border border-[#FF2B3A]/30 text-[#FF2B3A] rounded-xl text-xs flex items-center justify-between animate-fade-in">
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-5 h-5 shrink-0 text-[#FF2B3A]" />
              <div>
                <span className="font-bold block text-sm">Anti-Self-Approval Enforcement Triggered</span>
                <span className="text-red-200 mt-0.5 block">{authError}</span>
              </div>
            </div>
            <button 
              onClick={() => setAuthError(null)}
              className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded bg-white/[0.05]"
            >
              Close
            </button>
          </div>
        )}

        {/* Stock Table */}
        <div className="bg-[#1A1A1A] rounded-2xl overflow-hidden border border-white/[0.08] shadow-glaido-card card-sheen">
          <div className="p-4 px-5 border-b border-white/[0.06] flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-[#BFF549]" />
                <span>Critical Spare Parts Inventory Catalog</span>
              </h2>
              <p className="text-[11px] text-neutral-400 mt-0.5">Live campus warehouse stocks, work order reservations, and net available counts</p>
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
                  <th className="p-3.5">Unit Cost</th>
                  <th className="p-3.5">Facility Bay</th>
                  <th className="p-3.5 px-5">Stock Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {items.map((item) => {
                  const available = item.quantity_on_hand - item.quantity_reserved;
                  const isLow = available <= item.reorder_threshold;
                  const isBlocked = available <= 0;
                  const healthPercent = Math.min(100, Math.round((available / Math.max(1, item.quantity_on_hand)) * 100));

                  return (
                    <tr key={item.id} className="hover:bg-[#202020] transition-colors">
                      <td className="p-3.5 px-5 font-mono font-bold text-white">{item.sku}</td>
                      <td className="p-3.5 font-semibold text-neutral-100">{item.name}</td>
                      <td className="p-3.5 capitalize text-neutral-400">{item.category}</td>
                      <td className="p-3.5 text-right font-mono tabular-nums text-neutral-200 font-semibold">{item.quantity_on_hand}</td>
                      <td className="p-3.5 text-right font-mono tabular-nums text-[#FF8A1F] font-semibold">{item.quantity_reserved}</td>
                      <td className={`p-3.5 text-right font-mono tabular-nums font-bold ${isBlocked ? 'text-[#FF2B3A]' : 'text-[#BFF549]'}`}>
                        {available}
                      </td>
                      <td className="p-3.5 font-mono text-neutral-400">${Number(item.unit_cost).toFixed(2)}</td>
                      <td className="p-3.5 text-neutral-400">{item.location || 'Central Depot'}</td>
                      <td className="p-3.5 px-5">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-1.5 rounded-full bg-[#0D0D0D] overflow-hidden border border-white/[0.08]">
                            <div 
                              className={`h-full rounded-full ${isBlocked ? 'bg-[#FF2B3A]' : isLow ? 'bg-[#FF8A1F]' : 'bg-[#BFF549]'}`}
                              style={{ width: `${Math.max(5, healthPercent)}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-bold uppercase ${
                            isBlocked ? 'text-[#FF2B3A]' : isLow ? 'text-[#FF8A1F]' : 'text-[#BFF549]'
                          }`}>
                            {isBlocked ? 'Depleted' : isLow ? 'Low' : 'OK'}
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
                  Deterministic transaction test: prevents available inventory from ever dipping below zero.
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
                      {it.name} (Net Available: {it.quantity_on_hand - it.quantity_reserved})
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
                  Tip: Enter &gt; net available stock to test atomic rollback rejection.
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
              <div className="border-b border-white/[0.06] pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <Lock className="w-4 h-4 text-[#BFF549]" />
                    <span>Purchase Requisitions & Separation of Duties</span>
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Approver identity cannot match Requisition author. Authorizing immediately increments stock.
                  </p>
                </div>
                {isSysAdmin && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#BFF549]/10 border border-[#BFF549]/30 text-[#BFF549]">
                    System Admin Privilege Active
                  </span>
                )}
              </div>

              {/* PR List */}
              <div className="space-y-3">
                {purchases.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-400 bg-[#0D0D0D] rounded-xl border border-white/[0.08]">
                    No purchase requisitions currently pending review.
                  </div>
                ) : (
                  purchases.map((pr) => {
                    const isApproved = pr.status === 'approved';
                    const activeUser = getActiveUser();
                    // Match by user ID or user email
                    const isRequester = activeUser ? (
                      activeUser.id === pr.requester_id || 
                      activeUser.email.toLowerCase() === (pr.requester_name || '').toLowerCase()
                    ) : false;

                    return (
                      <div
                        key={pr.id}
                        className={`p-3.5 rounded-xl border space-y-2 text-xs transition-colors ${
                          isApproved 
                            ? 'bg-[#0D0D0D]/60 border-white/[0.05] opacity-75' 
                            : 'bg-[#0D0D0D] border-white/[0.08]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono text-xs font-bold text-white">{pr.pr_number}</span>
                            <h4 className="font-semibold text-neutral-100 mt-0.5">{pr.item_name}</h4>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isApproved
                              ? 'bg-[#BFF549]/10 text-[#BFF549] border-[#BFF549]/30'
                              : 'bg-[#FF8A1F]/10 text-[#FF8A1F] border-[#FF8A1F]/30'
                          }`}>
                            {isApproved ? 'Approved & Stocked' : pr.status}
                          </span>
                        </div>

                        {pr.justification && (
                          <p className="text-[11px] text-neutral-400 italic bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                            &ldquo;{pr.justification}&rdquo;
                          </p>
                        )}

                        <div className="grid grid-cols-3 gap-2 text-neutral-400 text-[11px] pt-1 border-t border-white/[0.04]">
                          <div>Quantity: <strong className="text-white font-mono">+{pr.quantity}</strong></div>
                          <div>Total: <strong className="text-white font-mono">${(pr.quantity * pr.estimated_unit_cost).toFixed(2)}</strong></div>
                          <div>Supplier: <strong className="text-white truncate block">{pr.vendor}</strong></div>
                        </div>

                        <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
                          <span className="text-neutral-400">
                            Author: <strong className="text-neutral-200">{pr.requester_name || pr.requester_id}</strong>
                            {isRequester && (
                              <span className="text-[#FF8A1F] font-semibold ml-1.5 text-[10px] bg-[#FF8A1F]/10 px-1.5 py-0.5 rounded">
                                (Your Request)
                              </span>
                            )}
                          </span>

                          {!isApproved && (
                            <div className="flex items-center space-x-2">
                              {isRequester && !isSysAdmin ? (
                                <div className="flex items-center space-x-1.5 text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-xl text-[10px] font-semibold">
                                  <Lock className="w-3 h-3" />
                                  <span>Self-Approval Prohibited</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleApprovePR(pr.id)}
                                  disabled={actionLoading}
                                  className="px-3.5 py-1.5 bg-[#BFF549] hover:bg-[#8CC21F] disabled:opacity-40 text-black font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-glaido-button active:scale-[0.98] focus-ring cursor-pointer"
                                  title={isRequester && isSysAdmin ? 'System Admin Executive Override' : 'Authorize Requisition'}
                                >
                                  {isRequester && isSysAdmin ? (
                                    <>
                                      <ShieldCheck className="w-3.5 h-3.5 text-black" />
                                      <span>Authorize (Admin Override)</span>
                                    </>
                                  ) : (
                                    <>
                                      <FileCheck className="w-3.5 h-3.5 text-black" />
                                      <span>Authorize PR</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Create PR Form */}
              <form onSubmit={handleCreatePR} className="border-t border-white/[0.06] pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white block">
                    Submit New Spare Part Requisition
                  </span>
                  <span className="text-[10px] text-neutral-400">Institutional Purchase Order Flow</span>
                </div>

                {prSuccess && (
                  <div className="p-3 bg-[#BFF549]/10 border border-[#BFF549]/30 text-[#BFF549] rounded-xl text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{prSuccess}</span>
                  </div>
                )}

                {prError && (
                  <div className="p-3 bg-[#FF2B3A]/10 border border-[#FF2B3A]/30 text-[#FF2B3A] rounded-xl text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{prError}</span>
                  </div>
                )}

                {/* SKU Selector Dropdown */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Select Target Inventory SKU to Replenish
                  </label>
                  <select
                    value={prItemId}
                    onChange={(e) => handleItemSelectChange(e.target.value)}
                    className="w-full bg-[#0D0D0D] border border-white/[0.10] rounded-xl px-2.5 py-1.5 text-xs text-white focus-ring cursor-pointer"
                  >
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name} ({it.sku}) — [On Hand: {it.quantity_on_hand} | Available: {it.quantity_on_hand - it.quantity_reserved}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Requester Persona Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Requisition Author (Maker)
                  </label>
                  <select
                    value={prRequesterId}
                    onChange={(e) => setPrRequesterId(e.target.value)}
                    className="w-full bg-[#0D0D0D] border border-white/[0.10] rounded-xl px-2.5 py-1.5 text-xs text-white focus-ring cursor-pointer"
                  >
                    <option value="59fad526-6182-40d9-8d52-6b4138c04ea1">
                      Rajesh Kumar (Field Electrical Technician) — Standard Flow
                    </option>
                    <option value="79ddba57-e453-4ebf-9ade-1b2bc105b461">
                      Ananya Verma (Field Operations Technician)
                    </option>
                    <option value="3d6ddc30-cde8-402d-a15f-48b955e61025">
                      Prof. Sharma (Academic Complex Faculty)
                    </option>
                    <option value="active_user">
                      Current Logged-in User ({activeUser?.name || 'Self'}) — Tests Separation of Duties
                    </option>
                  </select>
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Choose a field technician to authorize directly, or choose Current User to test self-approval policy.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Requisition Justification</label>
                    <input
                      type="text"
                      value={prJustification}
                      onChange={(e) => setPrJustification(e.target.value)}
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
                  <span>Submit Requisition for Review</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
