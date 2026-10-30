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
  Compass
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-blue-900/60 border border-blue-700/50 text-[11px] font-medium text-blue-300 mb-2">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Zero-Cost Procedural Digital Twin</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Layers className="w-6 h-6 text-blue-400" />
            <span>3D Spatial Command Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time campus operational twin extruded from OpenStreetMap polygons. Zero Mapbox/Google token costs.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <div className="bg-slate-900 p-1 rounded-lg border border-slate-700 flex items-center space-x-1 text-xs">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                viewMode === '3d'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3D Twin (WebGL)
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                viewMode === '2d'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2D Site Plan (SVG)
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs"
            title="Refresh facility status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: The 3D Scene or 2D Fallback */}
        <div className="lg:col-span-8">
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

          {/* Status Legend */}
          <div className="mt-3 bg-slate-900/80 border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 font-medium">Status Indicators:</span>
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                <span>Normal Operations</span>
              </span>
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>Maintenance / Disrupted</span>
              </span>
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>Closed / Hazard</span>
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              SRM-IST Kattankulathur
            </span>
          </div>
        </div>

        {/* Right: Facility Inspector Drawer */}
        <div className="lg:col-span-4">
          {selectedBuilding ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-400 uppercase tracking-wider">
                    {selectedBuilding.code}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    selectedBuilding.status === 'closed'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : selectedBuilding.status === 'maintenance' || selectedBuilding.status === 'disrupted'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}>
                    {selectedBuilding.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedBuilding.name}
                </h3>
              </div>

              {/* Building Spec Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Floors</span>
                  <span className="font-semibold text-slate-200">
                    {selectedBuilding.total_floors || 4} Levels
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Facility Type</span>
                  <span className="font-semibold text-slate-200 capitalize">
                    {selectedBuilding.building_type || 'Academic'}
                  </span>
                </div>
              </div>

              {/* Active Incidents Alert */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Active Incident Status
                </span>
                {selectedBuilding.active_incidents_count > 0 ? (
                  <div className="p-3 bg-amber-950/40 border border-amber-800 rounded-lg text-xs space-y-1 text-amber-200">
                    <div className="flex items-center space-x-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>{selectedBuilding.active_incidents_count} Active Incidents Logged</span>
                    </div>
                    <p className="text-[11px] text-amber-300/80">
                      Work orders dispatched. Maintenance teams are on-site.
                    </p>
                    <Link
                      href="/incidents"
                      className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 font-semibold pt-1 text-[11px]"
                    >
                      <span>View in Incident Tracker</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>All systems fully operational. No open tickets.</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <Link
                  href="/intake"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-md transition-all"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Report Issue for {selectedBuilding.code}</span>
                </Link>
                <Link
                  href="/bookings"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 border border-slate-700 transition-all"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Check Room Schedules</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              Click a building in the 3D twin or 2D map to inspect floor layouts, tenants, and real-time operational status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

