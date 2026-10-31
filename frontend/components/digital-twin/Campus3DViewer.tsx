'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  Building2, Layers, Zap, Thermometer, AlertTriangle, 
  CheckCircle2, RefreshCw, Eye, Monitor, DollarSign, Activity,
  Search, Shield, Flame, Heart, MapPin, Navigation, ArrowRight,
  ChevronRight, ChevronLeft, Cpu, Server, Sparkles, Compass, Maximize2,
  RotateCw, ArrowLeftRight, ShieldAlert, Calendar
} from 'lucide-react';
import * as THREE from 'three';
import { 
  CampusThreeViewer, 
  ViewerMode, 
  BuildingRecord, 
  RoomRecord, 
  SafetyAssetRecord 
} from './CampusThreeViewer';
import { SpatialHotspotCard, HotspotData } from './SpatialHotspotCard';
import { RoomTourDock, RoomTourItem } from './RoomTourDock';
import { ArchitecturalTourHeader } from './ArchitecturalTourHeader';
import { ImmersiveRoomModal } from './ImmersiveRoomModal';
import { CriticalAssetsWidget } from './CriticalAssetsWidget';
import { BuildingSwitcherGrid } from './BuildingSwitcherGrid';
import { CinematicTourController } from './CinematicTourController';
import { SpaceReservationModal } from './SpaceReservationModal';

export interface RoomTwinData {
  id: string;
  room_number: string;
  floor_level: number;
  capacity: number;
  room_type: string;
  current_state: string;
  power_status: 'NORMAL' | 'OUTAGE';
  temperature_c: number;
  has_active_outage: boolean;
  active_incident: {
    id: string;
    urgency: string;
    category: string;
    summary: string;
  } | null;
}

export interface Building3DTwin {
  building_id: string;
  building_name: string;
  building_code: string;
  total_floors: number;
  status: string;
  telemetry: {
    energy_consumption_kwh: number;
    cost_per_day_usd: number;
    workstations_total: number;
    furniture_counts: {
      desks: number;
      chairs: number;
      bookshelves: number;
    };
  };
  floors: {
    FLOOR_2: {
      label: string;
      level: number;
      elevation_y: number;
      rooms: RoomTwinData[];
    };
    FLOOR_1: {
      label: string;
      level: number;
      elevation_y: number;
      rooms: RoomTwinData[];
    };
    GROUND: {
      label: string;
      level: number;
      elevation_y: number;
      rooms: RoomTwinData[];
    };
  };
}

interface Campus3DViewerProps {
  onRoomSelect?: (room: RoomTwinData) => void;
  disruptionTriggered?: boolean;
}

const CAMPUS_BLOCKS = [
  { id: 'academic', name: 'Academic & AI Center', code: 'ACAD-01', icon: Cpu, isAI: true },
  { id: 'innovation', name: 'AI Innovation Hub', code: 'INN-01', icon: Sparkles, isAI: true },
  { id: 'engineering', name: 'Engineering Hall', code: 'ENG-01', icon: Server, isAI: false },
  { id: 'library', name: 'Central Library', code: 'LIB-01', icon: Building2, isAI: false },
  { id: 'auditorium', name: 'Auditorium Complex', code: 'AUD-01', icon: Layers, isAI: false },
  { id: 'administration', name: 'Administration', code: 'ADM-01', icon: Compass, isAI: false },
  { id: 'sports', name: 'Sports Arena', code: 'SPT-01', icon: Activity, isAI: false },
];

const FUNCTIONAL_ZONES = [
  { id: 'ALL', name: 'All Zones', color: '#94A3B8' },
  { id: 'AI', name: 'AI Supercluster', color: '#06B6D4' },
  { id: 'LECTURE', name: 'Academic & Lecture', color: '#3B82F6' },
  { id: 'COLLAB', name: 'Collab & Commons', color: '#10B981' },
  { id: 'EXECUTIVE', name: 'Executive Suites', color: '#A855F7' },
  { id: 'INCIDENT', name: 'Physical Plant (Rm 204)', color: '#EF4444' },
];

export const Campus3DViewer: React.FC<Campus3DViewerProps> = ({ onRoomSelect, disruptionTriggered }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CampusThreeViewer | null>(null);

  // High-level operational state
  const [twinData, setTwinData] = useState<Building3DTwin | null>(null);
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialModeParam = (urlParams?.get('mode') as ViewerMode) || 'campus';
  const initialFloorParam = urlParams?.get('floor') || '0';
  const initialHudParam = urlParams?.get('hud') !== '0';
  const initialModalParam = urlParams?.get('modal');

  const [activeTab, setActiveTab] = useState<'inspector' | 'dashboard'>('inspector');
  const [hudOpen, setHudOpen] = useState<boolean>(initialHudParam);
  const [isTouring, setIsTouring] = useState<boolean>(false);
  const [tourStepLabel, setTourStepLabel] = useState<string>('');

  const [mode, setMode] = useState<ViewerMode>(initialModeParam);
  const [selectedFloor, setSelectedFloor] = useState<string>(initialFloorParam);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingRecord | null>(null);
  const [selectedRoomRecord, setSelectedRoomRecord] = useState<RoomRecord | null>(null);
  const [selectedRoomForModal, setSelectedRoomForModal] = useState<RoomRecord | null>(null);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<RoomRecord | null>(null);
  const [tourStepIndex, setTourStepIndex] = useState<number>(0);
  const [selectedAsset, setSelectedAsset] = useState<SafetyAssetRecord | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [showAssets, setShowAssets] = useState<boolean>(true);
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [view2DFallback, setView2DFallback] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingLabel] = useState<string>('Initializing 3D Spatial Twin...');

  // Hotspot Screen Position state
  const [hotspotScreenPos, setHotspotScreenPos] = useState<{ x: number; y: number } | null>(null);

  // Fetch telemetry and existing backend data
  const loadTwin = async () => {
    try {
      const res = await fetch('/api/buildings/bld-eng-01/twin');
      if (res.ok) {
        const data = await res.json();
        setTwinData(data);
      }
    } catch (err) {
      console.warn('[Campus3DViewer] Telemetry API call skipped (running autonomous):', err);
    }
  };

  useEffect(() => {
    loadTwin();
  }, [disruptionTriggered]);

  // Initialize Three.js Digital Twin Engine
  useEffect(() => {
    if (!mountRef.current || view2DFallback) return;

    const viewer = new CampusThreeViewer({
      container: mountRef.current,
      assetBasePath: '/campus-models',
      initialMode: mode,
      onSelectBuilding: (bldg) => {
        setSelectedBuilding(bldg);
        setSelectedRoomRecord(null);
        if (bldg) {
          updateHotspotPosition(bldg.center);
        } else {
          setHotspotScreenPos(null);
        }
      },
      onSelectRoom: (rm) => {
        setSelectedRoomRecord(rm);
        if (rm && onRoomSelect) {
          const isOutage = (disruptionTriggered && rm.id === 'ROOM_ACAD_204') || rm.power_status === 'OUTAGE';
          onRoomSelect({
            id: rm.id,
            room_number: rm.id.replace('ROOM_ACAD_', ''),
            room_type: rm.type,
            floor_level: parseInt(rm.floor, 10),
            capacity: rm.capacity,
            current_state: isOutage ? 'OUT_OF_SERVICE' : 'AVAILABLE',
            power_status: isOutage ? 'OUTAGE' : 'NORMAL',
            temperature_c: rm.temperature_c,
            has_active_outage: isOutage,
            active_incident: isOutage ? {
              id: 'INC-204-PWR',
              urgency: 'P1_CRITICAL',
              category: 'ELECTRICAL',
              summary: 'Main breaker trip in Room 204'
            } : null
          });
        }
      },
      onSelectAsset: (ast) => {
        setSelectedAsset(ast);
      },
      onModeChange: (m) => setMode(m),
      onLoadingChange: (isLoading, label) => {
        setLoading(isLoading);
        if (label) setLoadingLabel(label);
        if (!isLoading && viewer.metadata?.buildings) {
          const defaultBldg = viewer.metadata.buildings.find(b => b.id === 'academic');
          if (defaultBldg) {
            setSelectedBuilding(defaultBldg);
            setTimeout(() => {
              const worldPos = new THREE.Vector3(defaultBldg.center[0], defaultBldg.center[1] + 12, defaultBldg.center[2]);
              const screen = viewer.getScreenCoordinates(worldPos);
              if (screen.visible) {
                setHotspotScreenPos({ x: Math.min(screen.x, window.innerWidth - 380), y: screen.y });
              }
            }, 300);
          }
        }
        if (!isLoading && viewer.metadata?.rooms) {
          const roomParam = urlParams?.get('room') || initialModalParam;
          const zoneParam = urlParams?.get('zone');
          if (roomParam) {
            const rm = viewer.metadata.rooms.find(r => r.id === roomParam);
            if (rm) {
              setSelectedRoomRecord(rm);
              if (initialModalParam) setSelectedRoomForModal(rm);
              setTimeout(() => {
                if (rm.camera_focus) {
                  viewer.focusRoomCamera(rm.camera_focus);
                }
                viewer.highlightRoomById(rm.id, rm.zone === 'INCIDENT' ? 0xEF4444 : 0x06B6D4);
              }, 400);
            }
          }
          if (zoneParam) {
            setSelectedZone(zoneParam);
            setTimeout(() => {
              viewer.setZoneFilter(zoneParam);
            }, 300);
          }
        }
      },
      onError: (err) => {
        console.error('[Campus3DViewer] Three.js engine error:', err);
      }
    });

    viewerRef.current = viewer;

    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
  }, [view2DFallback]);

  const updateHotspotPosition = (centerCoords: [number, number, number]) => {
    if (!viewerRef.current) return;
    const worldPos = new THREE.Vector3(centerCoords[0], centerCoords[1] + 12, centerCoords[2]);
    const screen = viewerRef.current.getScreenCoordinates(worldPos);
    if (screen.visible) {
      setHotspotScreenPos({ x: Math.min(screen.x, window.innerWidth - 380), y: screen.y });
    } else {
      setHotspotScreenPos(null);
    }
  };

  // Disruption State Management for Room 204 (Active Outage vs Nominal/Restored)
  const [room204Disrupted, setRoom204Disrupted] = useState<boolean>(true);
  const isRoom204Outage = room204Disrupted;

  // 180° Camera Inversion / Reverse Viewing Angle
  const handleReverseAngle = () => {
    viewerRef.current?.reverseCameraAngle(1.1);
  };

  // Bidirectional Quick Zone Swap: AI Superpod ⇄ Red Incident Zone
  const handleReverseZoneFocus = () => {
    if (selectedZone === 'INCIDENT') {
      handleZoneSelect('AI');
    } else {
      handleZoneSelect('INCIDENT');
    }
  };

  // Real-time Disruption State Reversal (Simulate Breaker Trip ⇄ Power Restored)
  const handleToggleDisruptionState = () => {
    const newState = viewerRef.current?.toggleRoomDisruption('ROOM_ACAD_204');
    const isNowDisrupted = newState !== undefined ? newState : !room204Disrupted;
    setRoom204Disrupted(isNowDisrupted);

    // Update local twinData state for reactive UI updates
    if (twinData?.floors?.FLOOR_2?.rooms) {
      const updatedRooms = twinData.floors.FLOOR_2.rooms.map((r) => {
        if (r.room_number === '204') {
          return {
            ...r,
            power_status: isNowDisrupted ? ('OUTAGE' as const) : ('NORMAL' as const),
            current_state: isNowDisrupted ? ('OUT_OF_SERVICE' as const) : ('AVAILABLE' as const),
            has_active_outage: isNowDisrupted
          };
        }
        return r;
      });
      setTwinData({
        ...twinData,
        floors: {
          ...twinData.floors,
          FLOOR_2: {
            ...twinData.floors.FLOOR_2,
            rooms: updatedRooms
          }
        }
      });
    }

    if (selectedRoomRecord?.id === 'ROOM_ACAD_204') {
      setSelectedRoomRecord({
        ...selectedRoomRecord,
        disrupted: isNowDisrupted,
        power_status: isNowDisrupted ? 'OUTAGE' : 'NORMAL',
        hvac_status: isNowDisrupted ? 'DEGRADED' : 'NORMAL',
        temperature_c: isNowDisrupted ? 24.6 : 21.0
      });
    }
  };

  const handleModeChange = (newMode: ViewerMode) => {
    setMode(newMode);
    viewerRef.current?.setMode(newMode, selectedBuilding?.id || 'academic', selectedFloor);
    if (newMode !== 'campus') {
      setHotspotScreenPos(null);
    }
  };

  const handleFloorChange = (fl: string) => {
    setSelectedFloor(fl);
    viewerRef.current?.setFloor(fl);
  };

  const handleFlyToBlock = (bldgId: string) => {
    if (viewerRef.current) {
      viewerRef.current.flyToBuilding(bldgId);
      const bldg = viewerRef.current.metadata?.buildings.find(b => b.id === bldgId);
      if (bldg) {
        setSelectedBuilding(bldg);
        setTimeout(() => updateHotspotPosition(bldg.center), 600);
      }
    }
  };

  const handleZoneSelect = (zoneId: string) => {
    // Reversal / Toggle: clicking an already selected single zone reverses back to 'ALL'!
    const targetZone = selectedZone === zoneId && zoneId !== 'ALL' ? 'ALL' : zoneId;
    setSelectedZone(targetZone);
    if (viewerRef.current) {
      viewerRef.current.setZoneFilter(targetZone === 'ALL' ? null : targetZone);
      if (targetZone === 'INCIDENT') {
        if (mode !== 'floor') handleModeChange('floor');
        handleFloorChange('2');
        viewerRef.current.focusRoomCamera([8.5, 0.5, -6.5]);
        const rm = viewerRef.current.metadata?.rooms.find(r => r.id === 'ROOM_ACAD_204');
        if (rm) setSelectedRoomRecord(rm);
      } else if (targetZone === 'AI') {
        if (mode !== 'floor') handleModeChange('floor');
        handleFloorChange('2');
        viewerRef.current.focusRoomCamera([-8.5, 0.5, 6.5]);
        const rm = viewerRef.current.metadata?.rooms.find(r => r.id === 'ROOM_ACAD_202');
        if (rm) setSelectedRoomRecord(rm);
      } else if (targetZone === 'EXECUTIVE') {
        if (mode !== 'floor') handleModeChange('floor');
        handleFloorChange('2');
        viewerRef.current.focusRoomCamera([-8.5, 0.5, -6.5]);
        const rm = viewerRef.current.metadata?.rooms.find(r => r.id === 'ROOM_ACAD_201');
        if (rm) setSelectedRoomRecord(rm);
      } else if (targetZone === 'COLLAB') {
        if (mode !== 'floor') handleModeChange('floor');
        handleFloorChange('2');
        viewerRef.current.focusRoomCamera([8.5, 0.5, 6.5]);
        const rm = viewerRef.current.metadata?.rooms.find(r => r.id === 'ROOM_ACAD_203');
        if (rm) setSelectedRoomRecord(rm);
      } else if (targetZone === 'ALL') {
        viewerRef.current.tweenCameraToPreset(`floor_${selectedFloor}`, 1.2);
        setSelectedRoomRecord(null);
      }
    }
  };

  const handleToggleAssets = (visible: boolean) => {
    setShowAssets(visible);
    viewerRef.current?.setSafetyAssetsVisible(visible, assetFilter);
  };

  const handleAssetFilter = (filter: string) => {
    setAssetFilter(filter);
    viewerRef.current?.setSafetyAssetsVisible(showAssets, filter);
  };

  const handleStartCinematicTour = () => {
    if (isTouring) {
      viewerRef.current?.stopCinematicTour();
      setIsTouring(false);
      setTourStepLabel('');
    } else {
      setIsTouring(true);
      viewerRef.current?.startCinematicTour((stepName) => {
        setTourStepLabel(stepName);
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const q = searchQuery.toLowerCase().trim();
    if (q.includes('acad') || q.includes('ai') || q.includes('cutaway')) {
      handleModeChange('building');
    } else if (q.includes('204') || q.includes('outage') || q.includes('lecture')) {
      handleModeChange('floor');
      handleFloorChange('2');
      viewerRef.current?.focusRoomCamera([8, 10, -6]);
    } else if (q.includes('101') || q.includes('robot')) {
      handleModeChange('floor');
      handleFloorChange('1');
      viewerRef.current?.focusRoomCamera([-8, 6, -6]);
    } else if (q.includes('003') || q.includes('cluster') || q.includes('gpu')) {
      handleModeChange('floor');
      handleFloorChange('0');
      viewerRef.current?.focusRoomCamera([8, 2, -6]);
    } else {
      const match = CAMPUS_BLOCKS.find(b => b.name.toLowerCase().includes(q) || b.id.includes(q));
      if (match) {
        handleFlyToBlock(match.id);
      } else {
        handleModeChange('campus');
      }
    }
  };

  // Solenne-style Room Dock Items for Level 02
  const roomDockItems: RoomTourItem[] = [
    { id: 'ROOM_ACAD_202', label: 'AI Superpod', category: 'ai' },
    { id: 'ROOM_ACAD_204', label: room204Disrupted ? 'Amphitheater (Red Zone)' : 'Amphitheater (Restored)', category: 'lecture', isOutage: room204Disrupted },
    { id: 'ROOM_ACAD_203', label: 'Ideation Pod', category: 'collab' },
    { id: 'ROOM_ACAD_201', label: 'Executive Senate', category: 'exec' },
  ];

  const handleDockSelectRoom = (roomId: string) => {
    if (!viewerRef.current) return;
    if (mode !== 'floor') {
      viewerRef.current.setMode('floor', 'academic', '2');
      setSelectedFloor('2');
    }
    const rm = viewerRef.current.metadata?.rooms.find(r => r.id === roomId);
    if (rm) {
      setSelectedRoomRecord(rm);
      if (rm.camera_focus) {
        viewerRef.current.focusRoomCamera(rm.camera_focus);
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-[#070B14] text-slate-100 overflow-hidden select-none">
      {/* Solenne-Style Architectural Tour Header */}
      <ArchitecturalTourHeader
        onStartTour={handleStartCinematicTour}
        isTouring={isTouring}
        onNavigateTab={(tab) => {
          if (tab === 'campus') handleModeChange('campus');
          else if (tab === 'cutaway') handleModeChange('building');
          else if (tab === 'ai') {
            handleZoneSelect('AI');
            handleFlyToBlock('academic');
          } else if (tab === 'safety') {
            handleToggleAssets(true);
          }
        }}
        activeNavTab={mode}
      />

      {/* 3D WebGL Canvas Mount Container - Full Bleed Maximum Real Estate */}
      <div 
        ref={mountRef} 
        className={`w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing ${view2DFallback ? 'hidden' : 'block'}`} 
      />

      {/* Solenne-style Interactive Spatial Hotspot Card */}
      {selectedBuilding && mode === 'campus' && hotspotScreenPos && (
        <SpatialHotspotCard
          hotspot={{
            floorNumber: selectedBuilding.code.includes('ACAD') ? '03 / 02' : '01',
            title: selectedBuilding.name,
            subtitle: selectedBuilding.code,
            specs: selectedBuilding.has_detailed_interior 
              ? '3 Stacked Furnished Levels · 12 Spaces · High-Density AI Cluster' 
              : 'Exterior Model Complete · Phase 2 LiDAR Scan Scheduled',
            statusBadge: selectedBuilding.has_detailed_interior ? 'OPERATIONAL · AI RESEARCH' : 'PHASE 1 EXTERIOR',
            statusType: selectedBuilding.has_detailed_interior ? 'ai' : 'available',
            onExplore: () => {
              handleModeChange('building');
            }
          }}
          position={hotspotScreenPos}
          visible={true}
        />
      )}

      {/* Accessible 2D Vector Plan Fallback */}
      {view2DFallback && (
        <div className="w-full h-full absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#0B132B] z-10 pt-16">
          <div className="w-full max-w-4xl h-[85%] bg-[#0A0F1D] rounded-2xl border border-slate-800 p-4 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <Navigation className="w-4 h-4 text-cyan-400" />
                <span>Accessible 2D Campus Floor Plan (Level 0{selectedFloor})</span>
              </div>
              <div className="flex items-center gap-2">
                {['0', '1', '2'].map((fl) => (
                  <button
                    key={fl}
                    onClick={() => setSelectedFloor(fl)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                      selectedFloor === fl ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    L0{fl}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              <img 
                src={`/campus-models/academic_floorplan_${selectedFloor}.svg`} 
                alt={`Floor plan level ${selectedFloor}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && !view2DFallback && (
        <div className="absolute inset-0 bg-[#070B14]/85 backdrop-blur-md z-40 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-300 tracking-wide">{loadingMessage}</span>
        </div>
      )}

      {/* Tour Step Notification Banner */}
      {isTouring && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 backdrop-blur-md border border-cyan-500/60 shadow-xl text-xs text-cyan-300 animate-bounce">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Cinematic Flyover: <strong>{tourStepLabel}</strong></span>
        </div>
      )}

      {/* TOP FLOATING HUD BAR (Mode & Zone Selection) */}
      <div className="absolute top-16 left-4 z-20 flex flex-col gap-2 max-w-[calc(100vw-30rem)]">
        {/* Primary Mode Switcher */}
        <div className="flex items-center gap-2 bg-[#0B132B]/85 backdrop-blur-xl px-3 py-2 rounded-xl border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-1 border-r border-slate-700/60 pr-2 mr-1">
            <button
              onClick={() => handleModeChange('campus')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                mode === 'campus'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Campus Aerial</span>
            </button>

            <button
              onClick={() => handleModeChange('building')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                mode === 'building'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3D Cutaway</span>
            </button>

            <button
              onClick={() => handleModeChange('floor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                mode === 'floor'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Floor Level</span>
            </button>
          </div>

          {/* Level Switcher (Active in Floor Mode) */}
          {mode === 'floor' && (
            <div className="flex items-center gap-1 border-r border-slate-700/60 pr-2 mr-1">
              {['0', '1', '2'].map((fl) => (
                <button
                  key={fl}
                  onClick={() => handleFloorChange(fl)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                    selectedFloor === fl
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  L0{fl}
                </button>
              ))}
            </div>
          )}

          {/* 2D Accessible SVG Toggle Button */}
          <button
            onClick={() => setView2DFallback(!view2DFallback)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
            title="Toggle 2D Accessible Vector Plan"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>{view2DFallback ? '3D View' : '2D Plan'}</span>
          </button>
        </div>

        {/* Functional Multi-Zone Selector Pills & Dynamic Reversal Controls */}
        <div className="flex items-center gap-1.5 bg-[#0B132B]/85 backdrop-blur-xl px-2.5 py-1.5 rounded-xl border border-slate-800 shadow-xl overflow-x-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 border-r border-slate-700/60 mr-1 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>Zones</span>
          </span>
          {FUNCTIONAL_ZONES.map((z) => (
            <button
              key={z.id}
              onClick={() => handleZoneSelect(z.id)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all whitespace-nowrap ${
                selectedZone === z.id
                  ? 'bg-slate-700 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: z.id === 'INCIDENT' && !room204Disrupted ? '#10B981' : z.color }} 
              />
              <span>{z.id === 'INCIDENT' && !room204Disrupted ? 'Physical Plant (Restored)' : z.name}</span>
            </button>
          ))}

          {/* Quick Zone Reversal Controls */}
          <div className="h-4 w-[1px] bg-slate-700/80 mx-1" />

          {/* Bidirectional Zone Switcher: AI Supercluster ⇄ Red Disrupted Zone */}
          <button
            onClick={handleReverseZoneFocus}
            title="Reverse / Swap Focus (AI Superpod ⇄ Red Disruption Zone)"
            className="px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 transition-all whitespace-nowrap"
          >
            <ArrowLeftRight className="w-3 h-3 text-cyan-400" />
            <span>{selectedZone === 'INCIDENT' ? '⇄ Swap to AI' : '⇄ Swap to Red'}</span>
          </button>

          {/* 180° Camera Inversion / Reverse View */}
          <button
            onClick={handleReverseAngle}
            title="Reverse Viewing Angle (180° Orbit)"
            className="px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 transition-all whitespace-nowrap"
          >
            <RotateCw className="w-3 h-3 text-amber-400" />
            <span>⟲ 180°</span>
          </button>

          {/* Live Disruption State Reversal Toggle (Room 204 Outage ⇄ Restored) */}
          {(selectedZone === 'INCIDENT' || selectedRoomRecord?.id === 'ROOM_ACAD_204') && (
            <button
              onClick={handleToggleDisruptionState}
              title={room204Disrupted ? "Reverse Disruption (Restore Room 204 Power)" : "Simulate Outage"}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all border whitespace-nowrap ${
                room204Disrupted
                  ? 'bg-red-950/80 text-red-300 border-red-500/70 hover:bg-red-900'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/70 hover:bg-emerald-900'
              }`}
            >
              {room204Disrupted ? (
                <>
                  <ShieldAlert className="w-3 h-3 text-red-400 animate-pulse" />
                  <span>Reverse Outage ⚡</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Power Restored ✅</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* TOP RIGHT SAFETY & SEARCH HUD */}
      <div className="absolute top-16 right-4 z-20 flex items-center gap-2 bg-[#0B132B]/85 backdrop-blur-xl px-3 py-2 rounded-xl border border-slate-800 shadow-2xl text-xs">
        <button
          onClick={() => handleToggleAssets(!showAssets)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-colors ${
            showAssets ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Safety Pins</span>
        </button>

        {showAssets && (
          <div className="flex items-center gap-1 pl-2 border-l border-slate-700/60">
            <button
              onClick={() => handleAssetFilter('all')}
              className={`px-2 py-0.5 rounded text-[11px] ${
                assetFilter === 'all' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleAssetFilter('fire_extinguisher')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                assetFilter === 'fire_extinguisher' ? 'bg-red-950 text-red-300 font-bold border border-red-800' : 'text-slate-400'
              }`}
            >
              <Flame className="w-3 h-3 text-red-400" />
              <span>Exting.</span>
            </button>
            <button
              onClick={() => handleAssetFilter('aed')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                assetFilter === 'aed' ? 'bg-pink-950 text-pink-300 font-bold border border-pink-800' : 'text-slate-400'
              }`}
            >
              <Heart className="w-3 h-3 text-pink-400" />
              <span>AED</span>
            </button>
          </div>
        )}

        {/* Quick Search */}
        <form onSubmit={handleSearch} className="flex items-center pl-2 border-l border-slate-700/60">
          <input
            type="text"
            placeholder="Search space..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 w-28 focus:w-40 transition-all focus:outline-none focus:border-cyan-500"
          />
        </form>

        {/* HUD Collapse / Expand Button */}
        <button
          onClick={() => setHudOpen(!hudOpen)}
          className="ml-1 p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
          title={hudOpen ? 'Collapse Inspector HUD (Maximize 3D Real Estate)' : 'Open Inspector HUD'}
        >
          {hudOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Solenne-Style Room Tour Segmented Dock (Active in Cutaway and Floor modes) */}
      {(mode === 'building' || mode === 'floor') && (
        <RoomTourDock
          rooms={roomDockItems}
          activeRoomId={selectedRoomRecord?.id || null}
          onSelectRoom={handleDockSelectRoom}
          onReverseAngle={handleReverseAngle}
          onReverseZone={handleReverseZoneFocus}
          onToggleDisruption={handleToggleDisruptionState}
          isDisrupted={room204Disrupted}
          className={hudOpen ? 'bottom-6 right-[26rem]' : 'bottom-6 right-6'}
        />
      )}

      {/* BOTTOM CAMPUS BUILDING BLOCK QUICK JUMP CAROUSEL (Campus Aerial Overview Only) */}
      {mode === 'campus' && (
        <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 bg-[#0B132B]/85 backdrop-blur-xl px-3 py-2 rounded-xl border border-slate-800 shadow-2xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 border-r border-slate-700/60 pr-2 mr-1">
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fly-To Block</span>
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[50vw]">
            {CAMPUS_BLOCKS.map((bldg) => {
              const Icon = bldg.icon;
              const isSelected = selectedBuilding?.id === bldg.id;
              return (
                <button
                  key={bldg.id}
                  onClick={() => handleFlyToBlock(bldg.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/25'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : bldg.isAI ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{bldg.name}</span>
                  {bldg.isAI && (
                    <span className={`text-[9px] px-1 rounded font-bold ${isSelected ? 'bg-slate-950 text-cyan-300' : 'bg-cyan-950 text-cyan-400 border border-cyan-800'}`}>
                      AI
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4-Sector Building Switcher Grid (Reference Image 1: Campus Mode) */}
      {mode === 'campus' && (
        <div className={`absolute bottom-6 z-20 transition-all duration-300 ${hudOpen ? 'right-[26rem]' : 'right-6'} w-72`}>
          <BuildingSwitcherGrid
            activeBuildingId={selectedBuilding?.id || null}
            onSelectBuilding={handleFlyToBlock}
          />
        </div>
      )}

      {/* Autonomous Cinematic Tour Controller HUD (The Solenne Walkthrough) */}
      {isTouring && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-top-4 duration-300">
          <CinematicTourController
            isPlaying={isTouring}
            currentStep={tourStepIndex}
            totalSteps={5}
            currentLabel={tourStepLabel}
            onTogglePlay={handleStartCinematicTour}
            onNextStep={() => {
              setTourStepIndex((prev) => (prev + 1) % 5);
              viewerRef.current?.startCinematicTour((l) => setTourStepLabel(l));
            }}
            onPrevStep={() => {
              setTourStepIndex((prev) => (prev - 1 + 5) % 5);
              viewerRef.current?.startCinematicTour((l) => setTourStepLabel(l));
            }}
            onRestart={() => {
              setTourStepIndex(0);
              viewerRef.current?.stopCinematicTour();
              handleStartCinematicTour();
            }}
            onClose={() => {
              viewerRef.current?.stopCinematicTour();
              setIsTouring(false);
              setTourStepLabel('');
            }}
          />
        </div>
      )}

      {/* FLOATING GLASSMORHPIC INSPECTOR & DASHBOARD DRAWER */}
      {hudOpen && (
        <div className="w-96 absolute right-4 top-28 bottom-6 z-20 backdrop-blur-xl bg-[#090E1D]/92 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in">
          {/* Drawer Tabs */}
          <div className="flex border-b border-slate-800 bg-[#0B132B]">
            <button
              onClick={() => setActiveTab('inspector')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'inspector'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-[#090E1D]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Inspector</span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'dashboard'
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-[#090E1D]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'inspector' ? (
              <>
                {/* AI Research Supercluster Telemetry (Hero Section) */}
                <div className="p-3.5 bg-gradient-to-br from-cyan-950/40 to-slate-900 rounded-xl border border-cyan-800/40 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">AI Computing Cluster</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 font-mono">
                      DGX-H100
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="p-2 bg-slate-900/80 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">Compute Load</div>
                      <div className="text-sm font-black text-cyan-400">94.2%</div>
                    </div>
                    <div className="p-2 bg-slate-900/80 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">Rack Loop Temp</div>
                      <div className="text-sm font-black text-white">21.4°C Chilled</div>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Active LLM Inference Jobs:</span>
                    <span className="font-mono text-cyan-300 font-bold">14 Online</span>
                  </div>
                </div>

                {/* Selected Building Card */}
                {selectedBuilding && (
                  <div className="p-4 bg-slate-900/70 rounded-xl border border-slate-800">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">{selectedBuilding.code}</span>
                        <h3 className="text-sm font-bold text-white">{selectedBuilding.name}</h3>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {selectedBuilding.status}
                      </span>
                    </div>

                    <div className="mt-3 text-xs text-slate-400 space-y-1">
                      <div>Departments: {selectedBuilding.departments?.join(', ') || 'Campus Facilities'}</div>
                      <div>Floors: {selectedBuilding.floors?.length || 1} Levels</div>
                      {selectedBuilding.primary_zone && (
                        <div>Primary Zone: <span className="text-cyan-300 font-medium">{selectedBuilding.primary_zone}</span></div>
                      )}
                    </div>

                    {selectedBuilding.has_detailed_interior ? (
                      <button
                        onClick={() => handleModeChange('building')}
                        className="mt-3 w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-cyan-500/25"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Explore 3D Furnished Cutaway</span>
                      </button>
                    ) : (
                      <div className="mt-3 p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 italic">
                        {selectedBuilding.notice || 'Detailed interior not yet modelled. Architectural LiDAR survey scheduled.'}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Classroom / Space Selector Pills (Level 02) */}
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Level 02 Spaces:</span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      { id: 'ROOM_ACAD_201', num: '201', name: 'Executive Senate', zone: 'EXECUTIVE', isOutage: false },
                      { id: 'ROOM_ACAD_202', num: '202', name: 'AI Vision Lab', zone: 'AI', isOutage: false },
                      { id: 'ROOM_ACAD_203', num: '203', name: 'Ideation Commons', zone: 'COLLAB', isOutage: false },
                      { id: 'ROOM_ACAD_204', num: '204', name: 'Lecture Hall', zone: 'INCIDENT', isOutage: isRoom204Outage }
                    ].map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          handleModeChange('floor');
                          handleFloorChange('2');
                          viewerRef.current?.focusRoomCamera(r.id === 'ROOM_ACAD_204' ? [8, 10, -6] : [-8, 10, -6]);
                        }}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          selectedRoomRecord?.id === r.id
                            ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                            : r.isOutage
                            ? 'border-red-500 bg-red-950/40 text-red-300 animate-pulse'
                            : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">Rm {r.num}</span>
                          <span className="text-[9px] font-mono text-cyan-400">{r.zone}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{r.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Room Details Card */}
                {selectedRoomRecord ? (
                  <div className={`p-4 rounded-xl border ${
                    (selectedRoomRecord.id === 'ROOM_ACAD_204' && isRoom204Outage)
                      ? 'border-red-500/50 bg-red-950/20' 
                      : 'border-slate-800 bg-slate-900/60'
                  }`}>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-sm font-bold text-white">{selectedRoomRecord.name}</h3>
                        <p className="text-xs text-slate-400">Academic Complex • Level 0{selectedRoomRecord.floor}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        (selectedRoomRecord.id === 'ROOM_ACAD_204' && isRoom204Outage)
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {(selectedRoomRecord.id === 'ROOM_ACAD_204' && isRoom204Outage) ? 'DISRUPTED' : 'NORMAL'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                          <span>Temp</span>
                        </div>
                        <div className="text-base font-bold text-white mt-1">{selectedRoomRecord.temperature_c}°C</div>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <Zap className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Capacity</span>
                        </div>
                        <div className="text-base font-bold text-white mt-1">{selectedRoomRecord.capacity} Seats</div>
                      </div>
                    </div>

                    {/* Eye-Level Immersive Walkthrough Button */}
                    <button
                      onClick={() => setSelectedRoomForModal(selectedRoomRecord)}
                      className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Open Immersive Room Walkthrough</span>
                    </button>

                    {/* Reference Image 3: Reserve & Book Space Button */}
                    <button
                      onClick={() => setSelectedRoomForBooking(selectedRoomRecord)}
                      className="mt-2 w-full py-2 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border border-cyan-500/40"
                    >
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Reserve / Book Space</span>
                    </button>

                    {/* Disruption State & Live Reversal Controls for Room 204 */}
                    {selectedRoomRecord.id === 'ROOM_ACAD_204' && (
                      <div className="mt-4 p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                        {room204Disrupted ? (
                          <div className="p-2.5 bg-red-950/60 border border-red-500/50 rounded-lg text-xs text-red-200 mb-3">
                            <div className="flex items-center gap-1.5 font-bold text-red-400 mb-1">
                              <AlertTriangle className="w-4 h-4" />
                              <span>Emergency Outage Active (Red Zone)</span>
                            </div>
                            <p>Main breaker tripped in Room 204. Final Exam CS-401 requires relocation to Room 202.</p>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-xs text-emerald-200 mb-3">
                            <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Power Nominal & Restored (Grid OK)</span>
                            </div>
                            <p>Sub-panel breaker reset successfully. Laser projector and HVAC operational.</p>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleToggleDisruptionState}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                              room204Disrupted
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/50 shadow-lg shadow-emerald-500/20'
                                : 'bg-red-900/60 hover:bg-red-800 text-red-200 border-red-500/50'
                            }`}
                          >
                            {room204Disrupted ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Reverse State: Restore Power</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Simulate Breaker Trip</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={handleReverseAngle}
                            title="Reverse Viewing Angle (180° Orbit)"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors"
                          >
                            <RotateCw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Equipment List */}
                    <div className="mt-4 pt-3 border-t border-slate-800">
                      <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Installed Hardware</h5>
                      <div className="space-y-1 text-xs">
                        {selectedRoomRecord.equipment?.map((eq, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-slate-300">
                            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                            <span>{eq}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                    Click any building block or room mesh in the 3D canvas to inspect live occupancy, climate, and telemetry.
                  </div>
                )}
              </>
            ) : (
              /* Dashboard View (Matches Reference Image 2) */
              <>
                {/* Costes Card */}
                <div className="p-4 bg-slate-900/70 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-3">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Costes (Daily Facility Cost)</span>
                  </div>
                  <div className="text-2xl font-black text-white">$482.00 / day</div>
                  <p className="text-[11px] text-slate-400 mt-1">Normal baseline within projected budget</p>
                </div>

                {/* Consumo Card */}
                <div className="p-4 bg-slate-900/70 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>Consumo (Energy Consumption)</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-black text-cyan-400">19,754 kWh</span>
                    <span className="text-xs text-slate-400">Rooftop Solar: 3,120 kWh</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-3 border border-slate-800">
                    <div className="bg-cyan-500 h-full w-[78%]" />
                  </div>
                </div>

                {/* PCs Card (Image 2 Donut reference) */}
                <div className="p-4 bg-slate-900/70 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-2">
                    <Monitor className="w-4 h-4 text-cyan-400" />
                    <span>Active Workstations & PCs</span>
                  </div>
                  <div className="text-2xl font-black text-white">355</div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      <span>PC Desktop (206)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                      <span>Laptop Docks (149)</span>
                    </span>
                  </div>
                </div>

                {/* Mobiliario Card */}
                <div className="p-4 bg-slate-900/70 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Mobiliario (Asset Furniture)</h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mt-3">
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <div className="text-white font-bold">148</div>
                      <div className="text-[10px] text-slate-400">Tables/Desks</div>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <div className="text-white font-bold">380</div>
                      <div className="text-[10px] text-slate-400">Chairs</div>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <div className="text-white font-bold">24</div>
                      <div className="text-[10px] text-slate-400">Bookshelves</div>
                    </div>
                  </div>
                </div>

                {/* Critical Assets Telemetry HUD (Reference Image 1) */}
                <CriticalAssetsWidget
                  totalAssets={270}
                  fireExtinguishers={160}
                  aedCount={6}
                  securityOutside={2}
                  securityInside={7}
                  activeFilter={assetFilter}
                  onFilterChange={(f) => handleAssetFilter(f)}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* COLLAPSED HUD PILL (When user collapses the drawer to maximize 3D real estate) */}
      {!hudOpen && (
        <button
          onClick={() => setHudOpen(true)}
          className="absolute right-4 top-28 z-20 flex items-center gap-2 bg-[#0B132B]/90 backdrop-blur-xl px-3.5 py-2 rounded-xl border border-slate-800 shadow-2xl hover:border-cyan-500/60 transition-all text-xs text-slate-200"
        >
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold">Inspector & Telemetry (355 PCs • 19,754 kWh)</span>
          <ChevronLeft className="w-4 h-4 text-slate-400 ml-1" />
        </button>
      )}

      {/* Immersive Eye-Level Room Walkthrough Modal */}
      {selectedRoomForModal && (
        <ImmersiveRoomModal
          room={selectedRoomForModal}
          onClose={() => setSelectedRoomForModal(null)}
          onBookSpace={() => {
            setSelectedRoomForBooking(selectedRoomForModal);
            setSelectedRoomForModal(null);
          }}
          onReportIncident={(rmId) => {
            alert(`Emergency Work Order dispatched for ${rmId}. High-priority technician en route.`);
            setSelectedRoomForModal(null);
          }}
        />
      )}

      {/* Space Reservation & Booking Modal (Reference Image 3) */}
      <SpaceReservationModal
        room={selectedRoomForBooking}
        isOpen={selectedRoomForBooking !== null}
        onClose={() => setSelectedRoomForBooking(null)}
        onConfirmBooking={(b) => {
          console.log('[Campus3DViewer] Space reservation confirmed:', b);
        }}
      />
    </div>
  );
};
