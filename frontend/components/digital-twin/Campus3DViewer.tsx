'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  Building2, Layers, Zap, Thermometer, AlertTriangle, 
  CheckCircle2, RefreshCw, Eye, Monitor, DollarSign, Activity,
  Search, Shield, Flame, Heart, MapPin, Navigation, ArrowRight,
  ChevronRight, ChevronLeft, Cpu, Server, Sparkles, Compass, Maximize2,
  RotateCw, ArrowLeftRight, ShieldAlert, Calendar, Check, X, Wrench
} from 'lucide-react';
import * as THREE from 'three';
import { 
  CampusThreeViewer, 
  ViewerMode, 
  BuildingRecord, 
  RoomRecord, 
  SafetyAssetRecord 
} from './CampusThreeViewer';
import { SpatialHotspotCard } from './SpatialHotspotCard';
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
  onSelectBuilding?: (building: BuildingRecord) => void;
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

export const Campus3DViewer: React.FC<Campus3DViewerProps> = ({ 
  onSelectBuilding, 
  onRoomSelect, 
  disruptionTriggered 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CampusThreeViewer | null>(null);

  // High-level operational state
  const [twinData, setTwinData] = useState<Building3DTwin | null>(null);
  const [activeTab, setActiveTab] = useState<'inspector' | 'dashboard'>('inspector');
  const [hudOpen, setHudOpen] = useState<boolean>(true);
  
  // Cinematic Tour State
  const [isTouring, setIsTouring] = useState<boolean>(false);
  const [tourStepIndex, setTourStepIndex] = useState<number>(0);
  const [totalTourSteps, setTotalTourSteps] = useState<number>(8);
  const [tourStepLabel, setTourStepLabel] = useState<string>('Academic & AI Computing Center');

  const [mode, setMode] = useState<ViewerMode>('campus');
  const [selectedFloor, setSelectedFloor] = useState<string>('0');
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingRecord | null>(null);
  const [selectedRoomRecord, setSelectedRoomRecord] = useState<RoomRecord | null>(null);
  const [selectedRoomForModal, setSelectedRoomForModal] = useState<RoomRecord | null>(null);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<RoomRecord | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<SafetyAssetRecord | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [showAssets, setShowAssets] = useState<boolean>(true);
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [view2DFallback, setView2DFallback] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingLabel] = useState<string>('Initializing 3D Spatial Twin...');
  
  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'alert' } | null>(null);

  // Hotspot Screen Position state
  const [hotspotScreenPos, setHotspotScreenPos] = useState<{ x: number; y: number } | null>(null);

  // Room 204 Disruption State
  const [room204Disrupted, setRoom204Disrupted] = useState<boolean>(true);

  const showToast = (text: string, type: 'success' | 'alert' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const updateHotspotPosition = (centerCoords: [number, number, number]) => {
    if (!viewerRef.current || !mountRef.current) return;
    const worldPos = new THREE.Vector3(centerCoords[0], centerCoords[1] + 12, centerCoords[2]);
    const screen = viewerRef.current.getScreenCoordinates(worldPos);
    if (screen.visible) {
      const maxWidth = mountRef.current.clientWidth || window.innerWidth;
      const clampedX = Math.min(Math.max(screen.x, 20), maxWidth - 340);
      setHotspotScreenPos({ x: clampedX, y: screen.y });
    } else {
      setHotspotScreenPos(null);
    }
  };

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
        setSelectedAsset(null);
        if (bldg) {
          onSelectBuilding?.(bldg);
          updateHotspotPosition(bldg.center);
        } else {
          setHotspotScreenPos(null);
        }
      },
      onSelectLevel: (fl) => {
        setSelectedFloor(fl);
        setMode('floor');
        setSelectedRoomRecord(null);
      },
      onSelectRoom: (rm) => {
        setSelectedRoomRecord(rm);
        setSelectedAsset(null);
        setHudOpen(true);
        setActiveTab('inspector');
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
        setHudOpen(true);
        setActiveTab('dashboard');
      },
      onModeChange: (m) => {
        setMode(m);
        if (m !== 'campus') {
          setHotspotScreenPos(null);
        }
      },
      onCameraChange: () => {
        if (selectedBuilding && mode === 'campus') {
          updateHotspotPosition(selectedBuilding.center);
        }
      },
      onLoadingChange: (isLoading, label) => {
        setLoading(isLoading);
        if (label) setLoadingLabel(label);
        if (!isLoading && viewer.metadata?.buildings) {
          const defaultBldg = viewer.metadata.buildings.find(b => b.id === 'academic');
          if (defaultBldg) {
            setSelectedBuilding(defaultBldg);
            setTimeout(() => {
              updateHotspotPosition(defaultBldg.center);
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

  // Reverse Camera Angle 180°
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

  // Real-time Disruption State Reversal (Room 204 Outage ⇄ Restored)
  const handleToggleDisruptionState = () => {
    const newState = viewerRef.current?.toggleRoomDisruption('ROOM_ACAD_204');
    const isNowDisrupted = newState !== undefined ? newState : !room204Disrupted;
    setRoom204Disrupted(isNowDisrupted);

    showToast(
      isNowDisrupted 
        ? "Simulated Electrical Breaker Trip triggered in Room 204 (Outage Active)." 
        : "Sub-panel Breaker 204-B reset. Room 204 power fully restored!",
      isNowDisrupted ? 'alert' : 'success'
    );

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
    setSelectedAsset(null);
    viewerRef.current?.setMode(newMode, selectedBuilding?.id || 'academic', selectedFloor);
    if (newMode !== 'campus') {
      setHotspotScreenPos(null);
    }
  };

  const handleFloorChange = (fl: string) => {
    setSelectedFloor(fl);
    viewerRef.current?.setFloor(fl);
    setSelectedRoomRecord(null);
    setSelectedAsset(null);
  };

  const handleFlyToBlock = (bldgId: string) => {
    if (viewerRef.current) {
      viewerRef.current.flyToBuilding(bldgId);
      const bldg = viewerRef.current.metadata?.buildings.find(b => b.id === bldgId);
      if (bldg) {
        setSelectedBuilding(bldg);
        onSelectBuilding?.(bldg);
        setTimeout(() => updateHotspotPosition(bldg.center), 600);
      }
    }
  };

  const handleZoneSelect = (zoneId: string) => {
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
    setShowAssets(true);
    viewerRef.current?.setSafetyAssetsVisible(true, filter);
  };

  // Cinematic Tour Controllers
  const handleStartCinematicTour = () => {
    if (isTouring) {
      if (viewerRef.current?.isTourPaused) {
        viewerRef.current.resumeCinematicTour((idx, total, label) => {
          setTourStepIndex(idx);
          setTotalTourSteps(total);
          setTourStepLabel(label);
        });
      } else {
        viewerRef.current?.pauseCinematicTour();
      }
    } else {
      setIsTouring(true);
      viewerRef.current?.startCinematicTour((idx, total, label) => {
        setTourStepIndex(idx);
        setTotalTourSteps(total);
        setTourStepLabel(label);
      });
    }
  };

  const handleNextTourStep = () => {
    viewerRef.current?.nextTourStep();
  };

  const handlePrevTourStep = () => {
    viewerRef.current?.prevTourStep();
  };

  const handleRestartTour = () => {
    viewerRef.current?.goToTourStep(0);
  };

  const handleCloseTour = () => {
    viewerRef.current?.stopCinematicTour();
    setIsTouring(false);
  };

  // Comprehensive Search Handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const q = searchQuery.toLowerCase().trim();
    const rooms = viewerRef.current?.metadata?.rooms || [];
    const buildings = viewerRef.current?.metadata?.buildings || [];
    const assets = viewerRef.current?.metadata?.safety_assets || [];

    // 1. Search Rooms
    const matchedRoom = rooms.find(r => 
      r.id.toLowerCase().includes(q) || 
      r.name.toLowerCase().includes(q) || 
      r.type.toLowerCase().includes(q) ||
      r.equipment?.some(eq => eq.toLowerCase().includes(q))
    );
    if (matchedRoom) {
      if (mode !== 'floor') handleModeChange('floor');
      handleFloorChange(matchedRoom.floor);
      setSelectedRoomRecord(matchedRoom);
      setHudOpen(true);
      setActiveTab('inspector');
      setTimeout(() => {
        if (matchedRoom.camera_focus) viewerRef.current?.focusRoomCamera(matchedRoom.camera_focus);
        viewerRef.current?.highlightRoomById(matchedRoom.id, matchedRoom.disrupted ? 0xEF4444 : 0x06B6D4);
      }, 300);
      showToast(`Navigated to ${matchedRoom.name} (Level 0${matchedRoom.floor})`);
      return;
    }

    // 2. Search Safety Assets
    const matchedAsset = assets.find(a => 
      a.id.toLowerCase().includes(q) || 
      a.label.toLowerCase().includes(q) || 
      a.type.toLowerCase().includes(q)
    );
    if (matchedAsset) {
      setShowAssets(true);
      setAssetFilter('all');
      viewerRef.current?.setSafetyAssetsVisible(true, 'all');
      setSelectedAsset(matchedAsset);
      if (mode !== 'floor') handleModeChange('floor');
      handleFloorChange(matchedAsset.floor);
      showToast(`Located ${matchedAsset.label} on Level 0${matchedAsset.floor}`);
      return;
    }

    // 3. Search Buildings
    const matchedBldg = buildings.find(b => 
      b.id.toLowerCase().includes(q) || 
      b.name.toLowerCase().includes(q) || 
      b.code.toLowerCase().includes(q) ||
      b.departments?.some(d => d.toLowerCase().includes(q))
    );
    if (matchedBldg) {
      handleFlyToBlock(matchedBldg.id);
      showToast(`Flying to ${matchedBldg.name}`);
      return;
    }

    // Fallback campus aerial
    handleModeChange('campus');
  };

  // Dynamic Room Dock Items based on current selected floor
  const currentFloorRooms: RoomTourItem[] = useMemo(() => {
    const rooms = viewerRef.current?.metadata?.rooms?.filter(r => r.floor === selectedFloor) || [];
    if (rooms.length > 0) {
      return rooms.map(r => ({
        id: r.id,
        label: r.id === 'ROOM_ACAD_204'
          ? (room204Disrupted ? 'Rm 204 (Outage Active)' : 'Rm 204 (Restored)')
          : r.name,
        category: r.zone?.toLowerCase() === 'ai' ? 'ai'
          : r.zone?.toLowerCase() === 'executive' ? 'exec'
          : r.zone?.toLowerCase() === 'collab' ? 'collab'
          : 'lecture',
        isOutage: r.id === 'ROOM_ACAD_204' ? room204Disrupted : r.disrupted || r.power_status === 'OUTAGE'
      }));
    }
    // Fallback defaults
    if (selectedFloor === '1') {
      return [
        { id: 'ROOM_ACAD_101', label: 'AI Supercluster Lab', category: 'ai' },
        { id: 'ROOM_ACAD_102', label: 'Seminar Hall 102', category: 'lecture' },
        { id: 'ROOM_ACAD_103', label: 'Innovation Lounge', category: 'collab' },
        { id: 'ROOM_ACAD_104', label: 'Robotics Workshop', category: 'ai' },
      ];
    } else if (selectedFloor === '0') {
      return [
        { id: 'ROOM_ACAD_001', label: 'Welcome Commons', category: 'collab' },
        { id: 'ROOM_ACAD_002', label: 'Auditorium Hall A', category: 'lecture' },
        { id: 'ROOM_ACAD_003', label: 'AI Study Commons', category: 'ai' },
        { id: 'ROOM_ACAD_004', label: 'Faculty Offices', category: 'exec' },
      ];
    } else {
      return [
        { id: 'ROOM_ACAD_201', label: 'Executive Senate', category: 'exec' },
        { id: 'ROOM_ACAD_202', label: 'AI Superpod', category: 'ai' },
        { id: 'ROOM_ACAD_203', label: 'Ideation Pod', category: 'collab' },
        { id: 'ROOM_ACAD_204', label: room204Disrupted ? 'Amphitheater (Red Zone)' : 'Amphitheater (Restored)', category: 'lecture', isOutage: room204Disrupted },
      ];
    }
  }, [selectedFloor, room204Disrupted]);

  const handleDockSelectRoom = (roomId: string) => {
    if (!viewerRef.current) return;
    const rm = viewerRef.current.metadata?.rooms?.find(r => r.id === roomId);
    const targetFloor = rm?.floor || selectedFloor;
    
    if (mode !== 'floor' || selectedFloor !== targetFloor) {
      viewerRef.current.setMode('floor', 'academic', targetFloor);
      setSelectedFloor(targetFloor);
    }
    
    if (rm) {
      setSelectedRoomRecord(rm);
      setHudOpen(true);
      setActiveTab('inspector');
      viewerRef.current.highlightRoomById(rm.id, rm.id === 'ROOM_ACAD_204' && room204Disrupted ? 0xEF4444 : 0x06B6D4);
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
          if (tab === 'campus') {
            handleModeChange('campus');
          } else if (tab === 'cutaway') {
            handleModeChange('building');
          } else if (tab === 'ai') {
            handleZoneSelect('AI');
            if (mode === 'campus') handleFlyToBlock('academic');
          } else if (tab === 'safety') {
            handleToggleAssets(true);
            setHudOpen(true);
            setActiveTab('dashboard');
          }
        }}
        activeNavTab={
          activeTab === 'dashboard' && showAssets ? 'safety' :
          selectedZone === 'AI' ? 'ai' :
          mode === 'building' ? 'cutaway' :
          mode === 'campus' ? 'campus' : 'cutaway'
        }
      />

      {/* 3D WebGL Canvas Mount Container */}
      <div 
        ref={mountRef} 
        className={`w-full h-full absolute inset-0 ${view2DFallback ? 'hidden' : 'block'}`} 
      />

      {/* Interactive Spatial Hotspot Card on Selected Building */}
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
                <Navigation className="w-4 h-4 text-[#BFF549]" />
                <span>Accessible 2D Campus Floor Plan (Level 0{selectedFloor})</span>
              </div>
              <div className="flex items-center gap-2">
                {['0', '1', '2'].map((fl) => (
                  <button
                    key={fl}
                    onClick={() => setSelectedFloor(fl)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                      selectedFloor === fl ? 'bg-[#BFF549] text-black' : 'bg-slate-800 text-slate-300'
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
          <div className="w-10 h-10 border-2 border-[#BFF549] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-300 tracking-wide">{loadingMessage}</span>
        </div>
      )}

      {/* Notification Toast */}
      {toastMessage && (
        <div className={`fixed top-18 right-8 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-2xl border backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300 ${
          toastMessage.type === 'alert'
            ? 'bg-red-950/90 border-red-500/70 text-red-200'
            : 'bg-[#0D152A]/95 border-[#BFF549]/60 text-white'
        }`}>
          {toastMessage.type === 'alert' ? (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#BFF549] shrink-0" />
          )}
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* TOP FLOATING HUD BAR (Mode, Level & Zone Selection) */}
      <div className="absolute top-16 left-4 z-20 flex flex-col gap-2 max-w-[calc(100vw-28rem)]">
        {/* Primary Mode Switcher */}
        <div className="flex items-center gap-2 bg-[#0B132B]/90 backdrop-blur-xl px-3 py-2 rounded-xl border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-1 border-r border-slate-700/60 pr-2 mr-1">
            <button
              onClick={() => handleModeChange('campus')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                mode === 'campus'
                  ? 'bg-[#BFF549] text-black font-bold shadow-md shadow-[#BFF549]/20'
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
                  ? 'bg-[#BFF549] text-black font-bold shadow-md shadow-[#BFF549]/20'
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
                  ? 'bg-[#BFF549] text-black font-bold shadow-md shadow-[#BFF549]/20'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Floor Level</span>
            </button>
          </div>

          {/* Level Switcher (Active in Floor Mode or Cutaway Mode) */}
          {(mode === 'floor' || mode === 'building') && (
            <div className="flex items-center gap-1 border-r border-slate-700/60 pr-2 mr-1">
              {['0', '1', '2'].map((fl) => (
                <button
                  key={fl}
                  onClick={() => {
                    if (mode !== 'floor') handleModeChange('floor');
                    handleFloorChange(fl);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                    selectedFloor === fl && mode === 'floor'
                      ? 'bg-[#BFF549] text-black'
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
            <Eye className="w-3.5 h-3.5 text-[#BFF549]" />
            <span>{view2DFallback ? '3D View' : '2D Plan'}</span>
          </button>
        </div>

        {/* Functional Multi-Zone Selector Pills & Dynamic Reversal Controls */}
        <div className="flex items-center gap-1.5 bg-[#0B132B]/90 backdrop-blur-xl px-2.5 py-1.5 rounded-xl border border-slate-800 shadow-xl overflow-x-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 border-r border-slate-700/60 mr-1 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-[#BFF549]" />
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
      <div className="absolute top-16 right-4 z-20 flex items-center gap-2 bg-[#0B132B]/90 backdrop-blur-xl px-3 py-2 rounded-xl border border-slate-800 shadow-2xl text-xs">
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
            placeholder="Search space, asset, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 w-32 focus:w-48 transition-all focus:outline-none focus:border-[#BFF549]"
          />
        </form>

        {/* HUD Collapse / Expand Button */}
        <button
          onClick={() => setHudOpen(!hudOpen)}
          className="ml-1 p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[#BFF549] transition-colors"
          title={hudOpen ? 'Collapse Inspector HUD' : 'Open Inspector HUD'}
        >
          {hudOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Solenne-Style Room Tour Segmented Dock (Active in Cutaway and Floor modes) */}
      {(mode === 'building' || mode === 'floor') && (
        <RoomTourDock
          rooms={currentFloorRooms}
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
        <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 bg-[#0B132B]/90 backdrop-blur-xl px-3 py-2 rounded-xl border border-slate-800 shadow-2xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 border-r border-slate-700/60 pr-2 mr-1">
            <Navigation className="w-3.5 h-3.5 text-[#BFF549]" />
            <span>Fly-To Block</span>
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[45vw]">
            {CAMPUS_BLOCKS.map((bldg) => {
              const Icon = bldg.icon;
              const isSelected = selectedBuilding?.id === bldg.id;
              return (
                <button
                  key={bldg.id}
                  onClick={() => handleFlyToBlock(bldg.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#BFF549] text-black font-bold shadow-lg shadow-[#BFF549]/20'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : bldg.isAI ? 'text-[#BFF549]' : 'text-slate-400'}`} />
                  <span>{bldg.name}</span>
                  {bldg.isAI && (
                    <span className={`text-[9px] px-1 rounded font-bold ${isSelected ? 'bg-black text-[#BFF549]' : 'bg-[#BFF549]/10 text-[#BFF549] border border-[#BFF549]/30'}`}>
                      AI
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4-Sector Building Switcher Grid (Campus Mode) */}
      {mode === 'campus' && (
        <div className={`absolute bottom-6 z-20 transition-all duration-300 ${hudOpen ? 'right-[26rem]' : 'right-6'} w-72`}>
          <BuildingSwitcherGrid
            activeBuildingId={selectedBuilding?.id || null}
            onSelectBuilding={handleFlyToBlock}
          />
        </div>
      )}

      {/* Autonomous Cinematic Tour Controller HUD */}
      {isTouring && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-top-4 duration-300">
          <CinematicTourController
            isPlaying={!viewerRef.current?.isTourPaused}
            currentStep={tourStepIndex}
            totalSteps={totalTourSteps}
            currentLabel={tourStepLabel}
            onTogglePlay={handleStartCinematicTour}
            onNextStep={handleNextTourStep}
            onPrevStep={handlePrevTourStep}
            onRestart={handleRestartTour}
            onClose={handleCloseTour}
          />
        </div>
      )}

      {/* Interactive Safety Asset Pin Callout */}
      {selectedAsset && (
        <div className="absolute top-28 left-6 z-30 w-80 bg-[#090E1D]/95 backdrop-blur-xl border border-cyan-500/60 rounded-2xl p-4 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              {selectedAsset.type === 'fire_extinguisher' ? (
                <Flame className="w-4 h-4 text-red-400" />
              ) : selectedAsset.type === 'aed' ? (
                <Heart className="w-4 h-4 text-pink-400" />
              ) : (
                <Shield className="w-4 h-4 text-cyan-400" />
              )}
              <span className="text-xs font-bold text-white uppercase tracking-wider">Safety Asset Node</span>
            </div>
            <button
              onClick={() => setSelectedAsset(null)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div>
              <div className="text-[10px] text-slate-400 font-mono">ASSET ID: {selectedAsset.id}</div>
              <h4 className="font-bold text-white text-sm mt-0.5">{selectedAsset.label}</h4>
            </div>

            <div className="flex items-center justify-between pt-1 text-slate-300">
              <span>Location:</span>
              <span className="font-mono text-cyan-400 font-bold">Level 0{selectedAsset.floor} • Academic</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span>Inspection Status:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                selectedAsset.status === 'WARNING_CHECK'
                  ? 'bg-amber-950 text-amber-300 border border-amber-700'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
              }`}>
                {selectedAsset.status}
              </span>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  showToast(`Safety inspection verified for ${selectedAsset.id}. Next check in 30 days.`);
                  setSelectedAsset(null);
                }}
                className="flex-1 py-1.5 bg-[#BFF549] hover:bg-[#aee63a] text-black font-bold rounded-lg text-[11px] transition-colors"
              >
                Log Inspection
              </button>
              <button
                onClick={() => {
                  showToast(`Work order WO-2026-AST logged for ${selectedAsset.id}.`, 'alert');
                  setSelectedAsset(null);
                }}
                className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px]"
              >
                Report Issue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING GLASSMORHPIC INSPECTOR & DASHBOARD DRAWER */}
      {hudOpen && (
        <div className="w-96 absolute right-4 top-28 bottom-6 z-20 backdrop-blur-xl bg-[#090E1D]/95 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in">
          {/* Drawer Tabs */}
          <div className="flex border-b border-slate-800 bg-[#0B132B]">
            <button
              onClick={() => setActiveTab('inspector')}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'inspector'
                  ? 'text-[#BFF549] border-b-2 border-[#BFF549] bg-[#090E1D]'
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
                  ? 'text-[#BFF549] border-b-2 border-[#BFF549] bg-[#090E1D]'
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
                      <Cpu className="w-4 h-4 text-[#BFF549] animate-pulse" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">AI Computing Cluster</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 font-mono">
                      DGX-H100
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="p-2 bg-slate-900/80 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-400">Compute Load</div>
                      <div className="text-sm font-black text-[#BFF549]">94.2%</div>
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
                        <span className="text-[10px] font-mono text-[#BFF549] font-bold">{selectedBuilding.code}</span>
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
                        className="mt-3 w-full py-2 bg-[#BFF549] hover:bg-[#aee63a] text-black font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-[#BFF549]/20"
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

                {/* Level 02 Spaces Grid */}
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Level 02 Spaces:</span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      { id: 'ROOM_ACAD_201', num: '201', name: 'Executive Senate', zone: 'EXECUTIVE', isOutage: false },
                      { id: 'ROOM_ACAD_202', num: '202', name: 'AI Vision Lab', zone: 'AI', isOutage: false },
                      { id: 'ROOM_ACAD_203', num: '203', name: 'Ideation Commons', zone: 'COLLAB', isOutage: false },
                      { id: 'ROOM_ACAD_204', num: '204', name: 'Lecture Hall', zone: 'INCIDENT', isOutage: room204Disrupted }
                    ].map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          handleModeChange('floor');
                          handleFloorChange('2');
                          viewerRef.current?.focusRoomCamera(r.id === 'ROOM_ACAD_204' ? [8, 10, -6] : [-8, 10, -6]);
                          viewerRef.current?.highlightRoomById(r.id, r.isOutage ? 0xEF4444 : 0x06B6D4);
                          const rm = viewerRef.current?.metadata?.rooms?.find(rm => rm.id === r.id);
                          if (rm) setSelectedRoomRecord(rm);
                        }}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          selectedRoomRecord?.id === r.id
                            ? 'border-[#BFF549] bg-[#BFF549]/10 text-white font-bold'
                            : r.isOutage
                            ? 'border-red-500 bg-red-950/40 text-red-300 animate-pulse'
                            : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">Rm {r.num}</span>
                          <span className="text-[9px] font-mono text-cyan-400">{r.zone}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">{r.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Room Details Card */}
                {selectedRoomRecord ? (
                  <div className={`p-4 rounded-xl border ${
                    (selectedRoomRecord.id === 'ROOM_ACAD_204' && room204Disrupted)
                      ? 'border-red-500/50 bg-red-950/20' 
                      : 'border-slate-800 bg-slate-900/60'
                  }`}>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-sm font-bold text-white">{selectedRoomRecord.name}</h3>
                        <p className="text-xs text-slate-400">Academic Complex • Level 0{selectedRoomRecord.floor}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        (selectedRoomRecord.id === 'ROOM_ACAD_204' && room204Disrupted)
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {(selectedRoomRecord.id === 'ROOM_ACAD_204' && room204Disrupted) ? 'DISRUPTED' : 'NORMAL'}
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

                    {/* Reserve & Book Space Button */}
                    <button
                      onClick={() => setSelectedRoomForBooking(selectedRoomRecord)}
                      className="mt-2 w-full py-2 bg-cyan-950/60 hover:bg-cyan-900/60 text-[#BFF549] font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border border-[#BFF549]/40"
                    >
                      <Calendar className="w-3.5 h-3.5 text-[#BFF549]" />
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

                    {/* Installed Equipment List */}
                    <div className="mt-4 pt-3 border-t border-slate-800">
                      <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Installed Hardware</h5>
                      <div className="space-y-1 text-xs">
                        {selectedRoomRecord.equipment?.map((eq, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-slate-300">
                            <CheckCircle2 className="w-3 h-3 text-[#BFF549]" />
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
              /* Dashboard View */
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
                    <Zap className="w-4 h-4 text-[#BFF549]" />
                    <span>Consumo (Energy Consumption)</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-black text-[#BFF549]">19,754 kWh</span>
                    <span className="text-xs text-slate-400">Rooftop Solar: 3,120 kWh</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-3 border border-slate-800">
                    <div className="bg-[#BFF549] h-full w-[78%]" />
                  </div>
                </div>

                {/* Workstations Card */}
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

                {/* Critical Assets Telemetry HUD */}
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

      {/* COLLAPSED HUD PILL */}
      {!hudOpen && (
        <button
          onClick={() => setHudOpen(true)}
          className="absolute right-4 top-28 z-20 flex items-center gap-2 bg-[#0B132B]/90 backdrop-blur-xl px-3.5 py-2 rounded-xl border border-slate-800 shadow-2xl hover:border-[#BFF549]/60 transition-all text-xs text-slate-200"
        >
          <Activity className="w-4 h-4 text-[#BFF549]" />
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
            showToast(`Emergency Work Order WO-2026-08 dispatched for ${rmId}. Technician Rajesh Kumar assigned (ETA: 4 mins).`, 'alert');
            setSelectedRoomForModal(null);
          }}
        />
      )}

      {/* Space Reservation & Booking Modal */}
      <SpaceReservationModal
        room={selectedRoomForBooking}
        isOpen={selectedRoomForBooking !== null}
        onClose={() => setSelectedRoomForBooking(null)}
        onConfirmBooking={(b) => {
          showToast(`Space reserved successfully: ${selectedRoomForBooking?.name} for ${b.organizer}. Pin: 8492.`);
        }}
      />
    </div>
  );
};
