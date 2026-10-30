'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Layers, 
  MapPin, 
  AlertTriangle, 
  Building2, 
  CheckCircle2, 
  ShieldAlert, 
  Wrench, 
  ArrowRight,
  Maximize2,
  Eye,
  RefreshCw,
  Compass,
  Boxes,
  Activity
} from 'lucide-react';
import CampusScene from '@/components/digital-twin/CampusScene';
import CampusFallback2D from '@/components/digital-twin/CampusFallback2D';
import { fetchWithAuth } from '@/lib/api';

export default function CommandCenterPage() {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [selectedBuilding, setSelectedBuilding] = useState<any | null>(null);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [buildingStatusMap, setBuildingStatusMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/campus/buildings');
      setBuildings(data);

      const statusMap: Record<string, string> = {};
      data.forEach((b: any) => {
        statusMap[b.id] = b.status;
      });
      setBuildingStatusMap(statusMap);

      if (data.length > 0 && !selectedBuilding) {
        setSelectedBuilding(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectBuilding = (bldData: any) => {
    // Match with backend building object
    const match = buildings.find(b => b.id === bldData.building_id || b.code === bldData.code);
    if (match) {
      setSelectedBuilding(match);
    } else {
      setSelectedBuilding(bldData);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400 mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Zero-Cost Procedural Spatial Twin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Spatial Command Center
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Real-time digital twin extruded from OpenStreetMap geospatial coordinates. Zero paid Mapbox or Google Earth tokens.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <div className="bg-zinc-950 p-1 rounded-xl border border-white/[0.08] flex items-center space-x-1 text-xs">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === '3d'
                  ? 'bg-zinc-800 text-white shadow-sm border border-white/[0.08]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              3D WebGL
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === '2d'
                  ? 'bg-zinc-800 text-white shadow-sm border border-white/[0.08]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              2D Site Plan
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors"
            title="Refresh facility status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: The 3D Scene or 2D Fallback */}
        <div className="lg:col-span-8 space-y-3">
          <div className="card-glass rounded-2xl overflow-hidden border border-white/[0.08] relative">
            {viewMode === '3d' ? (
              <CampusScene
                onSelectBuilding={handleSelectBuilding}
                selectedBuildingId={selectedBuilding?.id}
                buildingStatusMap={buildingStatusMap}
              />
            ) : (
              <CampusFallback2D
                onSelectBuilding={handleSelectBuilding}
                selectedBuildingId={selectedBuilding?.id}
                buildingStatusMap={buildingStatusMap}
              />
            )}
          </div>

          {/* Status Legend */}
          <div className="card-glass rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs border border-white/[0.06]">
            <span className="text-zinc-500 text-[11px] font-medium">Telemetry Key:</span>
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5 text-zinc-300 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Normal Operations</span>
              </span>
              <span className="flex items-center space-x-1.5 text-zinc-300 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Maintenance / Disrupted</span>
              </span>
              <span className="flex items-center space-x-1.5 text-zinc-300 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Evacuation / Hazard</span>
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              SRM-IST Kattankulathur
            </span>
          </div>
        </div>

        {/* Right: Facility Inspector Drawer */}
        <div className="lg:col-span-4">
          {selectedBuilding ? (
            <div className="card-glass p-5 rounded-2xl space-y-5 border border-white/[0.08]">
              <div className="border-b border-white/[0.06] pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-blue-400 uppercase tracking-wider">
                    {selectedBuilding.code}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                    selectedBuilding.status === 'closed'
                      ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                      : selectedBuilding.status === 'maintenance' || selectedBuilding.status === 'disrupted'
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {selectedBuilding.status}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white mt-1 tracking-tight">
                  {selectedBuilding.name}
                </h3>
              </div>

              {/* Building Spec Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-zinc-950/70 p-3 rounded-xl border border-white/[0.06]">
                  <span className="text-zinc-500 text-[10px] block">Floors</span>
                  <span className="font-semibold text-zinc-200 text-xs">
                    {selectedBuilding.total_floors || 4} Levels
                  </span>
                </div>
                <div className="bg-zinc-950/70 p-3 rounded-xl border border-white/[0.06]">
                  <span className="text-zinc-500 text-[10px] block">Facility Class</span>
                  <span className="font-semibold text-zinc-200 capitalize text-xs">
                    {selectedBuilding.building_type || 'Academic'}
                  </span>
                </div>
              </div>

              {/* Active Incidents Alert */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-300 block">
                  Active Incident Status
                </span>
                {selectedBuilding.active_incidents_count > 0 ? (
                  <div className="p-3.5 bg-amber-950/30 border border-amber-500/20 rounded-xl text-xs space-y-1.5 text-amber-200">
                    <div className="flex items-center space-x-2 font-medium">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>{selectedBuilding.active_incidents_count} Open Incident Tickets</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Assigned technicians dispatched to facility. Isolation protocol active.
                    </p>
                    <Link
                      href="/incidents"
                      className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 font-medium pt-1 text-[11px]"
                    >
                      <span>Inspect Incident Queue</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-950/60 rounded-xl border border-white/[0.06] text-xs text-zinc-400 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>All building systems operating nominal.</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-white/[0.06] space-y-2">
                <Link
                  href="/intake"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 shadow-sm transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Report Issue for {selectedBuilding.code}</span>
                </Link>
                <Link
                  href="/bookings"
                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 border border-white/[0.08] transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Check Room Schedules</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-zinc-500 card-glass rounded-2xl text-xs space-y-1">
              <Building2 className="w-6 h-6 mx-auto text-zinc-600 mb-2" />
              <p>Select a facility polygon in the spatial twin to inspect status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
