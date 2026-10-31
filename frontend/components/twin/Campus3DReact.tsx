/**
 * Campus3DReact.tsx
 * Declarative React Adapter for CampusThreeViewer
 */

import React, { useEffect, useRef, useState } from 'react';
import { 
  CampusThreeViewer, 
  ViewerMode, 
  BuildingRecord, 
  RoomRecord, 
  SafetyAssetRecord 
} from './CampusThreeViewer';
import { 
  Building2, Layers, Shield, Flame, Heart, Eye, 
  Search, ZoomIn, ZoomOut, RefreshCw, AlertTriangle, 
  MapPin, CheckCircle, Navigation
} from 'lucide-react';

export interface Campus3DReactProps {
  assetBasePath?: string;
  initialMode?: ViewerMode;
  selectedBuildingId?: string;
  selectedFloor?: string;
  selectedRoomId?: string;
  disruptionTriggered?: boolean;
  onSelectBuilding?: (building: BuildingRecord | null) => void;
  onSelectRoom?: (room: RoomRecord | null) => void;
  onSelectAsset?: (asset: SafetyAssetRecord | null) => void;
  onDrillDownCutaway?: () => void;
}

export const Campus3DReact: React.FC<Campus3DReactProps> = ({
  assetBasePath = '/campus-models',
  initialMode = 'campus',
  selectedBuildingId,
  selectedFloor = '0',
  selectedRoomId,
  disruptionTriggered,
  onSelectBuilding,
  onSelectRoom,
  onSelectAsset,
  onDrillDownCutaway
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CampusThreeViewer | null>(null);

  const [mode, setMode] = useState<ViewerMode>(initialMode);
  const [activeFloor, setActiveFloor] = useState<string>(selectedFloor);
  const [currentBuilding, setCurrentBuilding] = useState<BuildingRecord | null>(null);
  const [currentRoom, setCurrentRoom] = useState<RoomRecord | null>(null);
  const [currentAsset, setCurrentAsset] = useState<SafetyAssetRecord | null>(null);
  const [showAssets, setShowAssets] = useState<boolean>(true);
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingLabel, setLoadingLabel] = useState<string>('Initializing 3D Twin...');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [view2DFallback, setView2DFallback] = useState<boolean>(false);
  const [webGLError, setWebGLError] = useState<string | null>(null);

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGLError('WebGL is not supported or hardware acceleration is disabled. Reverting to accessible 2D vector plan.');
        setView2DFallback(true);
      }
    } catch (e) {
      setWebGLError('Failed to detect WebGL context. Reverting to 2D fallback.');
      setView2DFallback(true);
    }
  }, []);

  // Initialize Viewer instance
  useEffect(() => {
    if (!mountRef.current || view2DFallback) return;

    const viewer = new CampusThreeViewer({
      container: mountRef.current,
      assetBasePath,
      initialMode: mode,
      onSelectBuilding: (bldg) => {
        setCurrentBuilding(bldg);
        onSelectBuilding?.(bldg);
      },
      onSelectRoom: (rm) => {
        setCurrentRoom(rm);
        onSelectRoom?.(rm);
      },
      onSelectAsset: (ast) => {
        setCurrentAsset(ast);
        onSelectAsset?.(ast);
      },
      onModeChange: (m) => setMode(m),
      onLoadingChange: (isLoading, label) => {
        setLoading(isLoading);
        if (label) setLoadingLabel(label);
      },
      onError: (err) => {
        console.error('[Campus3DReact] Viewer error:', err);
        setWebGLError(err.message);
      }
    });

    viewerRef.current = viewer;

    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
  }, [view2DFallback]);

  // Handle external mode changes
  const handleModeChange = (newMode: ViewerMode) => {
    setMode(newMode);
    viewerRef.current?.setMode(newMode, currentBuilding?.id || 'academic', activeFloor);
  };

  const handleFloorChange = (fl: string) => {
    setActiveFloor(fl);
    viewerRef.current?.setFloor(fl);
  };

  const handleToggleAssets = (visible: boolean) => {
    setShowAssets(visible);
    viewerRef.current?.setSafetyAssetsVisible(visible, assetFilter);
  };

  const handleAssetFilter = (filter: string) => {
    setAssetFilter(filter);
    viewerRef.current?.setSafetyAssetsVisible(showAssets, filter);
  };

  const handleDrillDown = () => {
    handleModeChange('building');
    onDrillDownCutaway?.();
  };

  return (
    <div className="relative w-full h-full bg-[#0A0F1D] text-slate-100 overflow-hidden select-none flex">
      {/* 3D Canvas Mount Point */}
      <div 
        ref={mountRef} 
        className={`w-full h-full ${view2DFallback ? 'hidden' : 'block'}`} 
      />

      {/* 2D Accessible SVG Fallback View */}
      {view2DFallback && (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#0B132B]">
          {webGLError && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-amber-950/80 border border-amber-600/50 px-3 py-2 rounded-lg text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>{webGLError}</span>
            </div>
          )}
          <div className="w-full max-w-4xl h-[80%] bg-[#0A0F1D] rounded-2xl border border-slate-800 p-4 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <Navigation className="w-4 h-4 text-cyan-400" />
                <span>Accessible 2D Campus Floor Plan (WCAG 2.1 AA)</span>
              </div>
              <button 
                onClick={() => setView2DFallback(false)}
                className="text-xs px-3 py-1 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-600/30"
              >
                Switch back to 3D View
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              <img 
                src={`${assetBasePath}/academic_floorplan_${activeFloor}.svg`} 
                alt={`Floor plan level ${activeFloor}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && !view2DFallback && (
        <div className="absolute inset-0 bg-[#0A0F1D]/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-300 tracking-wide">{loadingLabel}</span>
        </div>
      )}

      {/* Top Floating Spatial Navigation Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-[#0F172A]/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-1 border-r border-slate-700/60 pr-2 mr-1">
          <button
            onClick={() => handleModeChange('campus')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              mode === 'campus'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
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
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
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
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Floor Level</span>
          </button>
        </div>

        {/* Floor Level Selector (Active in Floor Mode) */}
        {mode === 'floor' && (
          <div className="flex items-center gap-1 border-r border-slate-700/60 pr-2 mr-1">
            {['0', '1', '2'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => handleFloorChange(lvl)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                  activeFloor === lvl
                    ? 'bg-cyan-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                L0{lvl}
              </button>
            ))}
          </div>
        )}

        {/* 2D / 3D Mode Toggle Button */}
        <button
          onClick={() => setView2DFallback(!view2DFallback)}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1"
          title="Toggle 2D Accessible Vector Plan"
        >
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>{view2DFallback ? '3D View' : '2D Plan'}</span>
        </button>
      </div>

      {/* Top Right Quick Safety Asset Filter Bar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-[#0F172A]/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 shadow-xl text-xs">
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
      </div>

      {/* Selected Entity Card Overlay (Bottom Left) */}
      {currentBuilding && mode === 'campus' && (
        <div className="absolute bottom-6 left-6 z-20 w-84 bg-[#0F172A]/95 backdrop-blur-md p-4 rounded-xl border border-slate-800 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                {currentBuilding.code}
              </span>
              <h3 className="text-base font-bold text-white">{currentBuilding.name}</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              {currentBuilding.status}
            </span>
          </div>

          <div className="mt-3 text-xs text-slate-300 space-y-1">
            <div>Departments: {currentBuilding.departments?.join(', ') || 'General Campus'}</div>
            <div>Floors: {currentBuilding.floors?.length || 1} Levels</div>
          </div>

          {currentBuilding.has_detailed_interior ? (
            <button
              onClick={handleDrillDown}
              className="mt-4 w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-cyan-500/20"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Drill Down into 3D Cutaway</span>
            </button>
          ) : (
            <div className="mt-3 p-2 rounded bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-400 italic">
              {currentBuilding.notice || 'Detailed interior not yet modelled. Architectural survey scheduled.'}
            </div>
          )}
        </div>
      )}

      {/* Selected Room Details (Bottom Left in Floor Mode) */}
      {currentRoom && mode === 'floor' && (
        <div className="absolute bottom-6 left-6 z-20 w-84 bg-[#0F172A]/95 backdrop-blur-md p-4 rounded-xl border border-slate-800 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                {currentRoom.id.replace('ROOM_ACAD_', 'RM ')}
              </span>
              <h3 className="text-base font-bold text-white">{currentRoom.name}</h3>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
              currentRoom.disrupted || currentRoom.power_status === 'OUTAGE'
                ? 'bg-red-950 text-red-400 border border-red-800'
                : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
            }`}>
              {currentRoom.disrupted ? 'DISRUPTED' : 'AVAILABLE'}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Capacity</span>
              <span className="font-bold text-white">{currentRoom.capacity} seats</span>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Occupancy</span>
              <span className="font-bold text-white">{currentRoom.current_occupancy} present</span>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Temperature</span>
              <span className="font-bold text-white">{currentRoom.temperature_c}°C</span>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Power Feed</span>
              <span className={`font-bold ${currentRoom.power_status === 'OUTAGE' ? 'text-red-400' : 'text-emerald-400'}`}>
                {currentRoom.power_status}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
