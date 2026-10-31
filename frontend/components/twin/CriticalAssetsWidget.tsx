import React from 'react';
import { Flame, Heart, Shield, ShieldCheck, DoorOpen, Radio, Video } from 'lucide-react';

export interface CriticalAssetsWidgetProps {
  totalAssets?: number;
  fireExtinguishers?: number;
  aedCount?: number;
  securityOutside?: number;
  securityInside?: number;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
  className?: string;
}

/**
 * CriticalAssetsWidget
 * Facilities Security & Asset Management HUD inspired by Reference Image 1.
 * Features high-contrast metric counters, category breakdown bars, and interactive 3D filter toggles.
 */
export const CriticalAssetsWidget: React.FC<CriticalAssetsWidgetProps> = ({
  totalAssets = 270,
  fireExtinguishers = 160,
  aedCount = 6,
  securityOutside = 2,
  securityInside = 7,
  activeFilter = 'all',
  onFilterChange,
  className = '',
}) => {
  const assetCategories = [
    { id: 'fire_extinguisher', label: 'Fire Extinguishers', count: fireExtinguishers, max: 180, color: '#EF4444', icon: Flame },
    { id: 'aed', label: 'Automated External Defibrillators', count: aedCount, max: 20, color: '#EC4899', icon: Heart },
    { id: 'exit', label: 'Emergency Egress Exits', count: 21, max: 30, color: '#10B981', icon: DoorOpen },
    { id: 'gate', label: 'Access Control Turnstiles', count: 17, max: 25, color: '#06B6D4', icon: ShieldCheck },
    { id: 'soc', label: 'CCTV Surveillance Rigs', count: 9, max: 15, color: '#A855F7', icon: Video },
    { id: 'case', label: 'Emergency Call Stations', count: 4, max: 10, color: '#F59E0B', icon: Radio },
  ];

  return (
    <div className={`bg-[#0B132B]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-2xl text-slate-100 flex flex-col gap-4 ${className}`}>
      {/* Header Metric */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Monitored Facilities</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl font-black text-white tracking-tight">{totalAssets}</span>
            <span className="text-xs font-semibold text-cyan-400">Safety & Security Assets</span>
          </div>
        </div>
        <button
          onClick={() => onFilterChange?.('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
            activeFilter === 'all'
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
              : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700'
          }`}
        >
          View All Pins
        </button>
      </div>

      {/* Critical Assets Hero Cards (Fire Extinguishers & AED) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Fire Extinguisher Card */}
        <button
          onClick={() => onFilterChange?.(activeFilter === 'fire_extinguisher' ? 'all' : 'fire_extinguisher')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeFilter === 'fire_extinguisher'
              ? 'bg-red-950/70 border-red-500 shadow-lg shadow-red-500/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Flame className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Critical</span>
          </div>
          <div className="text-2xl font-black text-white">{fireExtinguishers}</div>
          <div className="text-xs text-slate-400 font-medium mt-0.5">Fire Extinguishers</div>
        </button>

        {/* AED Card */}
        <button
          onClick={() => onFilterChange?.(activeFilter === 'aed' ? 'all' : 'aed')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeFilter === 'aed'
              ? 'bg-pink-950/70 border-pink-500 shadow-lg shadow-pink-500/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
              <Heart className="w-4 h-4 text-pink-500" />
            </div>
            <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">Medical</span>
          </div>
          <div className="text-2xl font-black text-white">{aedCount}</div>
          <div className="text-xs text-slate-400 font-medium mt-0.5">AED Defibrillators</div>
        </button>
      </div>

      {/* Category Breakdown Horizontal Bars */}
      <div className="space-y-2 pt-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inventory Distribution</span>
        {assetCategories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = activeFilter === cat.id;
          const pct = Math.round((cat.count / cat.max) * 100);
          return (
            <button
              key={cat.id}
              onClick={() => onFilterChange?.(isSelected ? 'all' : cat.id)}
              className={`w-full group text-left p-1.5 rounded-lg transition-colors ${
                isSelected ? 'bg-slate-800/90' : 'hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-slate-300 group-hover:text-white">
                  <Icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                  <span className="font-medium text-[11px] truncate max-w-[140px]">{cat.label}</span>
                </span>
                <span className="font-mono font-bold text-slate-200 text-xs">{cat.count}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: cat.color }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Security Presence Counter Footnote */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-center text-xs">
        <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800/80">
          <div className="text-lg font-black text-white">{securityOutside}</div>
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Security Outside</div>
        </div>
        <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800/80">
          <div className="text-lg font-black text-white">{securityInside}</div>
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Security Inside</div>
        </div>
      </div>
    </div>
  );
};
