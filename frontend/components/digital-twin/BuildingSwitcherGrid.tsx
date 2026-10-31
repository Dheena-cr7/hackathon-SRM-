import React from 'react';
import { Building2, Cpu, Sparkles, Server, Check } from 'lucide-react';

export interface BuildingThumb {
  id: string;
  name: string;
  code: string;
  isDetailed?: boolean;
  status: string;
}

interface BuildingSwitcherGridProps {
  activeBuildingId: string | null;
  onSelectBuilding: (buildingId: string) => void;
  className?: string;
}

/**
 * BuildingSwitcherGrid
 * Architectural building switcher grid inspired by Reference Image 1 (bottom-right 2x2 selector cards).
 * Features stylized vector footprints, status pills, and instant flyover navigation.
 */
export const BuildingSwitcherGrid: React.FC<BuildingSwitcherGridProps> = ({
  activeBuildingId,
  onSelectBuilding,
  className = '',
}) => {
  const cards: BuildingThumb[] = [
    { id: 'academic', name: 'Academic Complex', code: 'ACAD-01', isDetailed: true, status: '3D BIM Cutaway' },
    { id: 'innovation', name: 'AI Innovation Hub', code: 'INN-01', isDetailed: false, status: 'Active Research' },
    { id: 'engineering', name: 'Engineering Hall', code: 'ENG-01', isDetailed: false, status: 'Robotics Labs' },
    { id: 'library', name: 'Central Library', code: 'LIB-01', isDetailed: false, status: 'Study Commons' },
  ];

  return (
    <div className={`bg-[#0B132B]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-3 shadow-2xl ${className}`}>
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Campus Sectors</span>
        <span className="text-[10px] font-mono text-cyan-400">4 Monitored Blocks</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {cards.map((bldg) => {
          const isActive = activeBuildingId === bldg.id;
          return (
            <button
              key={bldg.id}
              onClick={() => onSelectBuilding(bldg.id)}
              className={`relative p-2.5 rounded-xl border text-left transition-all group overflow-hidden ${
                isActive
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              {/* Architectural Mini Vector Footprint Background */}
              <div className="w-full h-10 mb-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 relative flex items-center justify-center overflow-hidden">
                <svg className="w-full h-full opacity-30 group-hover:opacity-60 transition-opacity" viewBox="0 0 100 40">
                  <path
                    d={
                      bldg.id === 'academic'
                        ? 'M15 10 L85 10 L85 30 L55 30 L55 20 L35 20 L35 30 L15 30 Z'
                        : bldg.id === 'innovation'
                        ? 'M20 8 L80 8 L80 32 L20 32 Z'
                        : bldg.id === 'engineering'
                        ? 'M15 8 L60 8 L85 24 L60 32 L15 32 Z'
                        : 'M25 8 L75 8 L85 28 L15 28 Z'
                    }
                    fill="none"
                    stroke={isActive ? '#06B6D4' : '#64748B'}
                    strokeWidth="1.5"
                  />
                  <circle cx="50" cy="20" r="2.5" fill={isActive ? '#06B6D4' : '#64748B'} />
                </svg>

                {isActive && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white text-[11px] truncate group-hover:text-cyan-300">
                  {bldg.name}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                <span className="font-mono text-cyan-400 font-semibold">{bldg.code}</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                  bldg.isDetailed ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-800 text-slate-400'
                }`}>
                  {bldg.status}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
