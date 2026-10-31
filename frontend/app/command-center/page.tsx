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
  Activity,
  Filter,
  Check,
  Calendar,
  ExternalLink,
  Users
} from 'lucide-react';
import CampusScene from '@/components/digital-twin/CampusScene';
import CampusFallback2D from '@/components/digital-twin/CampusFallback2D';
import { fetchWithAuth } from '@/lib/api';
import RoleGuard from '@/components/RoleGuard';

const BUILDING_MAP: Record<string, string> = {
  'academic': 'BLD-TECH-01',
  'ACAD-01': 'BLD-TECH-01',
  'BLD-TECH-01': 'academic',
  'TP': 'academic',
  'engineering': 'BLD-ENG-02',
  'ENG-01': 'BLD-ENG-02',
  'BLD-ENG-02': 'engineering',
  'MECH': 'engineering',
  'library': 'BLD-LIB-01',
  'LIB-01': 'BLD-LIB-01',
  'BLD-LIB-01': 'library',
  'LIB': 'library',
  'auditorium': 'BLD-AUD-01',
  'AUD-01': 'BLD-AUD-01',
  'BLD-AUD-01': 'auditorium',
  'AUD': 'auditorium',
  'administration': 'BLD-ADM-01',
  'ADM-01': 'BLD-ADM-01',
  'BLD-ADM-01': 'administration',
  'ADMIN': 'administration',
  'sports': 'BLD-RES-01',
  'SPT-01': 'BLD-RES-01',
  'BLD-RES-01': 'sports',
  'HOSTEL-A': 'sports',
};

export default function CommandCenterPage() {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [fullscreen3D, setFullscreen3D] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<any | null>(null);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [buildingStatusMap, setBuildingStatusMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [facilityTab, setFacilityTab] = useState<'overview' | 'incidents' | 'rooms'>('overview');
  const [buildingFilter, setBuildingFilter] = useState<'all' | 'maintenance'>('all');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/campus/buildings');
      const enriched = (Array.isArray(data) ? data : []).map((b: any) => {
        const opStatus = b.operational_status || b.status || 'normal';
        let incidentCount = 0;
        if (opStatus === 'critical_disruption' || b.id === 'BLD-TECH-01' || b.id === 'BLD-AUD-01') {
          incidentCount = b.id === 'BLD-TECH-01' ? 2 : 1;
        }
        return {
          ...b,
          status: opStatus,
          operational_status: opStatus,
          active_incidents_count: incidentCount,
          total_floors: 4,
          height_meters: b.height_meters || 18,
        };
      });

      setBuildings(enriched);

      const statusMap: Record<string, string> = {};
      enriched.forEach((b: any) => {
        statusMap[b.id] = b.status;
      });
      setBuildingStatusMap(statusMap);

      if (enriched.length > 0 && !selectedBuilding) {
        setSelectedBuilding(enriched[0]);
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
    const rawId = bldData.building_id || bldData.id || '';
    const rawCode = bldData.code || '';
    const mappedId = BUILDING_MAP[rawId] || BUILDING_MAP[rawCode] || rawId;

    const match = buildings.find(b => 
      b.id === rawId || 
      b.id === mappedId || 
      b.code === rawCode || 
      b.code === BUILDING_MAP[rawCode] ||
      (b.name && rawId && b.name.toLowerCase().includes(rawId.toLowerCase()))
    );

    if (match) {
      setSelectedBuilding(match);
    } else {
      setSelectedBuilding(bldData);
    }
  };

  const filteredBuildings = buildings.filter(b => {
    if (buildingFilter === 'maintenance') return b.status !== 'normal';
    return true;
  });

  return (
    <RoleGuard pageName="Spatial Command Center">
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-[#BFF549]/10 border border-[#BFF549]/30 text-xs font-semibold text-[#BFF549] mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Campus Spatial Twin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Spatial Command Center
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Real-time digital twin extruded from OpenStreetMap geospatial coordinates. Interactive inspection, room status, and live incident correlation.
          </p>
        </div>

        {/* View Mode & Sync Controls */}
        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <div className="bg-[#1A1A1A] p-1 rounded-xl border border-white/[0.08] shadow-glaido-card flex items-center space-x-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus-ring cursor-pointer ${
                viewMode === '3d'
                  ? 'bg-[#BFF549] text-black shadow-glaido-button'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              3D WebGL
            </button>
            <button
              type="button"
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus-ring cursor-pointer ${
                viewMode === '2d'
                  ? 'bg-[#BFF549] text-black shadow-glaido-button'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              2D Site Plan
            </button>
          </div>

          <button
            type="button"
            onClick={() => setFullscreen3D(!fullscreen3D)}
            className={`p-2 px-3 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border cursor-pointer ${
              fullscreen3D
                ? 'bg-[#BFF549] text-black border-[#BFF549]'
                : 'bg-[#1A1A1A] hover:bg-[#242424] border-white/[0.08] text-neutral-300 hover:text-white'
            }`}
            title="Toggle full width 3D canvas"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{fullscreen3D ? 'Split Inspector' : 'Expand 3D'}</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 px-3 bg-[#1A1A1A] hover:bg-[#242424] border border-white/[0.08] text-neutral-300 hover:text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors focus-ring cursor-pointer"
            title="Refresh facility status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#BFF549]' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas & Inspector Grid */}
      <div className={`grid grid-cols-1 ${fullscreen3D ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-6 items-start`}>
        {/* Left: The 3D Scene or 2D Fallback */}
        <div className={`${fullscreen3D ? 'w-full' : 'lg:col-span-8'} space-y-3`}>
          <div className="rounded-2xl overflow-hidden border border-white/[0.08] relative bg-[#0D0D0D] shadow-glaido-card">
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

          {/* High-Visibility Facility Telemetry Legend Bar */}
          <div className="bg-[#1A1A1A] rounded-xl p-3.5 px-4 flex flex-wrap items-center justify-between gap-3 text-xs border border-white/[0.08] shadow-glaido-card card-sheen">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-[#BFF549]" />
              <span className="text-white font-bold tracking-tight">Facility Telemetry Matrix:</span>
            </div>
            <div className="flex items-center space-x-5">
              <span className="flex items-center space-x-2 text-neutral-300 text-xs">
                <span className="w-3 h-3 rounded-full bg-[#BFF549] shadow-[0_0_8px_rgba(191,245,73,0.6)]" />
                <span className="font-medium text-white">Normal Operations</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#BFF549]/10 text-[#BFF549] border border-[#BFF549]/20">4 Blocks</span>
              </span>
              <span className="flex items-center space-x-2 text-neutral-300 text-xs">
                <span className="w-3 h-3 rounded-full bg-[#FF8A1F] shadow-[0_0_8px_rgba(255,138,31,0.6)] animate-pulse" />
                <span className="font-medium text-white">Room Complaint</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FF8A1F]/20 text-[#FF8A1F] border border-[#FF8A1F]/30">Yellow Tint</span>
              </span>
              <span className="flex items-center space-x-2 text-neutral-300 text-xs">
                <span className="w-3 h-3 rounded-full bg-[#FF2B3A] shadow-[0_0_8px_rgba(255,43,58,0.6)]" />
                <span className="font-medium text-white">Critical Disruption</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FF2B3A]/10 text-[#FF2B3A] border border-[#FF2B3A]/20">2 Blocks</span>
              </span>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              6 Campus Blocks
            </span>
          </div>
        </div>

        {/* Right: Facility Inspector Drawer (Synchronized with 3D Twin & 2D Site Plan) */}
        {!fullscreen3D && (
          <div className="lg:col-span-4">
          {selectedBuilding ? (
            <div className="bg-[#1A1A1A] rounded-2xl border border-white/[0.08] p-5 space-y-5 shadow-glaido-card card-sheen">
              {/* Header */}
              <div className="border-b border-white/[0.06] pb-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#BFF549] uppercase tracking-wider bg-[#BFF549]/10 px-2 py-0.5 rounded border border-[#BFF549]/20">
                    {selectedBuilding.code}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                    selectedBuilding.status === 'closed'
                      ? 'bg-[#FF2B3A]/10 text-[#FF2B3A] border-[#FF2B3A]/30'
                      : selectedBuilding.status === 'maintenance' || selectedBuilding.status === 'disrupted'
                      ? 'bg-[#FF8A1F]/10 text-[#FF8A1F] border-[#FF8A1F]/30'
                      : 'bg-[#BFF549]/10 text-[#BFF549] border-[#BFF549]/30'
                  }`}>
                    {selectedBuilding.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-2 tracking-tight">
                  {selectedBuilding.name}
                </h3>
              </div>

              {/* Sub-Tabs for Inspector */}
              <div className="flex items-center space-x-1 bg-[#0D0D0D] p-1 rounded-xl border border-white/[0.08] text-xs">
                <button
                  type="button"
                  onClick={() => setFacilityTab('overview')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors focus-ring cursor-pointer ${
                    facilityTab === 'overview' ? 'bg-[#242424] text-white shadow' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setFacilityTab('incidents')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors focus-ring cursor-pointer flex items-center justify-center space-x-1 ${
                    facilityTab === 'incidents' ? 'bg-[#242424] text-white shadow' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>Incidents</span>
                  {selectedBuilding.active_incidents_count > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#FF8A1F] text-black font-bold text-[10px] flex items-center justify-center">
                      {selectedBuilding.active_incidents_count}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setFacilityTab('rooms')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors focus-ring cursor-pointer ${
                    facilityTab === 'rooms' ? 'bg-[#242424] text-white shadow' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Rooms
                </button>
              </div>

              {/* Tab Content: Overview */}
              {facilityTab === 'overview' && (
                <div className="space-y-4 text-xs animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#0D0D0D] p-3 rounded-xl border border-white/[0.08]">
                      <span className="text-neutral-400 text-[11px] block font-medium">Height & Floors</span>
                      <span className="font-bold text-white text-sm mt-0.5 block">
                        {selectedBuilding.total_floors || 4} Floors ({selectedBuilding.height_meters || 18}m)
                      </span>
                    </div>
                    <div className="bg-[#0D0D0D] p-3 rounded-xl border border-white/[0.08]">
                      <span className="text-neutral-400 text-[11px] block font-medium">Facility Class</span>
                      <span className="font-bold text-white capitalize text-sm mt-0.5 block">
                        {selectedBuilding.building_type || 'Academic'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#0D0D0D] p-3.5 rounded-xl border border-white/[0.08] space-y-2">
                    <span className="text-neutral-400 text-[11px] font-semibold uppercase tracking-wider block">
                      Departments & Facilities
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedBuilding.departments && selectedBuilding.departments.length > 0 ? (
                        selectedBuilding.departments.map((dept: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-[#1A1A1A] text-neutral-200 border border-white/[0.08] text-[11px]">
                            {dept}
                          </span>
                        ))
                      ) : (
                        <span className="text-neutral-400 text-[11px]">Computer Science, IT, Laboratories</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Incidents */}
              {facilityTab === 'incidents' && (
                <div className="space-y-3 text-xs animate-fade-in">
                  {selectedBuilding.active_incidents_count > 0 ? (
                    <div className="p-3.5 bg-[#FF8A1F]/10 border border-[#FF8A1F]/25 rounded-xl space-y-2 text-[#FF8A1F]">
                      <div className="flex items-center space-x-2 font-bold text-[#FF8A1F]">
                        <AlertTriangle className="w-4 h-4 text-[#FF8A1F] shrink-0" />
                        <span>{selectedBuilding.active_incidents_count} Open Incident Ticket(s)</span>
                      </div>
                      <p className="text-neutral-300 text-xs leading-relaxed">
                        Technicians are dispatched to this facility. Power isolation and safety protocols active.
                      </p>
                      <Link
                        href={`/incidents`}
                        className="inline-flex items-center space-x-1.5 text-[#BFF549] hover:underline font-semibold pt-1"
                      >
                        <span>View in Incident Queue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="p-4 bg-[#0D0D0D] rounded-xl border border-white/[0.08] text-neutral-300 flex items-center space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-[#BFF549] shrink-0" />
                      <div>
                        <div className="font-semibold text-white">Nominal State</div>
                        <div className="text-neutral-400 text-[11px]">No active incidents or disruptions reported for this facility.</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content: Rooms (4 Floors x 4 Rooms per floor with Yellow Tint on Complaints) */}
              {facilityTab === 'rooms' && (
                <div className="space-y-3 text-xs animate-fade-in max-h-96 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 bg-[#0D0D0D] p-2.5 rounded-xl border border-white/[0.08]">
                    <span className="font-semibold text-white">4 Floors • 16 Rooms Tracked</span>
                    <span className="flex items-center space-x-1 text-[#FF8A1F]">
                      <span className="w-2 h-2 rounded-full bg-[#FF8A1F] inline-block animate-pulse" />
                      <span>Yellow Tint = Complaint Active</span>
                    </span>
                  </div>

                  {[4, 3, 2, 1].map((floorNum) => {
                    const roomsOnFloor = [
                      {
                        num: `${floorNum}01`,
                        name: floorNum === 1 ? 'Main Seminar 101' : `Classroom ${floorNum}01`,
                        type: floorNum === 1 ? 'Seminar Hall' : 'Lecture Room',
                        hasComplaint: selectedBuilding.id === 'BLD-AUD-01' && floorNum === 1,
                        complaintText: 'Acoustic / Stage Lighting Fault',
                      },
                      {
                        num: `${floorNum}02`,
                        name: `Lab ${floorNum}02`,
                        type: 'Computing & Hardware',
                        hasComplaint: false,
                        complaintText: '',
                      },
                      {
                        num: `${floorNum}03`,
                        name: `Classroom ${floorNum}03`,
                        type: 'Theory Lecture',
                        hasComplaint: false,
                        complaintText: '',
                      },
                      {
                        num: `${floorNum}04`,
                        name: floorNum === 2 ? 'Systems Lab 204' : `Tutorial ${floorNum}04`,
                        type: floorNum === 2 ? 'Specialized Lab' : 'Tutorial Space',
                        hasComplaint: (selectedBuilding.id === 'BLD-TECH-01' || selectedBuilding.code === 'TP' || selectedBuilding.status === 'critical_disruption') && floorNum === 2,
                        complaintText: 'AC Unit Sparking & Power Surge (Midterm Disruption)',
                      },
                    ];

                    return (
                      <div key={floorNum} className="bg-[#0D0D0D] p-3 rounded-xl border border-white/[0.08] space-y-2">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
                          <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                            Floor {floorNum}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">4 Rooms</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {roomsOnFloor.map((rm) => (
                            <div
                              key={rm.num}
                              className={`p-2.5 rounded-lg border text-xs transition-all ${
                                rm.hasComplaint
                                  ? 'bg-[#FF8A1F]/20 text-[#FF8A1F] border-[#FF8A1F]/50 shadow-[0_0_12px_rgba(255,138,31,0.25)]'
                                  : 'bg-[#1A1A1A] border-white/[0.08] text-neutral-300 hover:border-white/[0.18]'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold">
                                <span>Room {rm.num}</span>
                                {rm.hasComplaint ? (
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-[#FF8A1F] text-black">
                                    Complaint
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-mono text-[#BFF549]">
                                    Normal
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-neutral-400 truncate mt-0.5">{rm.name}</div>
                              {rm.hasComplaint && (
                                <div className="text-[10px] text-[#FF8A1F] font-semibold mt-1 leading-tight flex items-start space-x-1">
                                  <AlertTriangle className="w-3 h-3 text-[#FF8A1F] shrink-0 mt-0.5" />
                                  <span className="line-clamp-2">{rm.complaintText}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/[0.06] space-y-2.5">
                <Link
                  href={`/intake?building=${selectedBuilding.id}`}
                  className="w-full py-2.5 bg-[#BFF549] hover:bg-[#8CC21F] text-black font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-glaido-button transition-all active:scale-[0.98] focus-ring"
                >
                  <AlertTriangle className="w-4 h-4 text-black" />
                  <span>Report Incident for {selectedBuilding.code}</span>
                </Link>
                <Link
                  href="/bookings"
                  className="w-full py-2.5 bg-[#242424] hover:bg-[#2A2A2A] text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 border border-white/[0.08] transition-all active:scale-[0.98] focus-ring"
                >
                  <Calendar className="w-4 h-4 text-[#BFF549]" />
                  <span>Check Room Availability & Relocate</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center text-neutral-400 bg-[#1A1A1A] rounded-2xl border border-white/[0.08] text-xs space-y-2">
              <Building2 className="w-8 h-8 mx-auto text-neutral-500 mb-2" />
              <p className="font-medium text-neutral-200">Select a facility in the 3D twin to inspect</p>
              <p className="text-[11px] text-neutral-500">Click any building polygon or use the quick-finder pills above the canvas.</p>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
    </RoleGuard>
  );
}
