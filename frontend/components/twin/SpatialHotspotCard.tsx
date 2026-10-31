import React from 'react';
import { Layers, ArrowRight, Zap, Thermometer, ShieldAlert, CheckCircle2 } from 'lucide-react';

export interface HotspotData {
  floorNumber: string;
  title: string;
  subtitle: string;
  specs: string;
  statusBadge: string;
  statusType: 'available' | 'operational' | 'disrupted' | 'ai';
  onExplore: () => void;
}

interface SpatialHotspotCardProps {
  hotspot: HotspotData;
  position?: { x: number; y: number };
  visible?: boolean;
}

/**
 * SpatialHotspotCard
 * Architectural callout card inspired by high-end 3D real estate twins.
 * Features a pulsing beacon dot, dual-compartment layout, large floor typography,
 * space specs, and an interactive exploration trigger.
 */
export const SpatialHotspotCard: React.FC<SpatialHotspotCardProps> = ({
  hotspot,
  position,
  visible = true,
}) => {
  if (!visible) return null;

  const getStatusBadgeStyle = () => {
    switch (hotspot.statusType) {
      case 'disrupted':
        return 'bg-red-950/80 text-red-300 border-red-700/80 animate-pulse';
      case 'ai':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-700/80 shadow-cyan-500/20';
      case 'available':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80';
      default:
        return 'bg-slate-800/80 text-slate-200 border-slate-700/80';
    }
  };

  const getBeaconColor = () => {
    switch (hotspot.statusType) {
      case 'disrupted':
        return 'bg-red-500 ring-red-400';
      case 'ai':
        return 'bg-cyan-400 ring-cyan-300';
      default:
        return 'bg-amber-400 ring-amber-300';
    }
  };

  return (
    <div 
      className="absolute z-30 pointer-events-auto flex items-center gap-3 transition-all duration-300"
      style={position ? { left: `${position.x}px`, top: `${position.y}px`, transform: 'translate(-10px, -50%)' } : undefined}
    >
      {/* Solenne-style Pulsing Hotspot Disc */}
      <div className="relative flex items-center justify-center w-8 h-8">
        <span className={`animate-ping absolute inline-flex h-6 w-6 rounded-full opacity-75 ring-4 ${getBeaconColor()}`} />
        <span className={`relative inline-flex rounded-full h-4 w-4 border-2 border-white/80 shadow-lg ${getBeaconColor()}`} />
      </div>

      {/* Dual-Compartment Architectural Callout Card */}
      <div className="flex items-stretch bg-[#080D1A]/95 backdrop-blur-xl border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden hover:border-cyan-500/80 transition-all duration-200 group">
        {/* Left Compartment: Clean Floor Typography */}
        <div className="px-3.5 py-3 bg-[#0D152A] border-r border-slate-800 flex flex-col justify-center items-center min-w-[4.2rem]">
          <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">FLOOR</span>
          <span className="text-xl font-black text-white font-mono leading-none mt-0.5">
            {hotspot.floorNumber}
          </span>
        </div>

        {/* Right Compartment: Space Title, Specs & Status Badge */}
        <div className="px-4 py-3 flex flex-col justify-between gap-1.5 min-w-[14rem]">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-xs font-bold text-white tracking-wide group-hover:text-cyan-300 transition-colors">
              {hotspot.title}
            </h4>
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${getStatusBadgeStyle()}`}>
              {hotspot.statusBadge}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 font-medium">
            {hotspot.specs}
          </p>

          <button
            onClick={hotspot.onExplore}
            className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 group-hover:translate-x-0.5 transition-all w-fit"
          >
            <span>Explore 3D Cutaway</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

