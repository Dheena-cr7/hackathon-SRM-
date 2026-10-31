import React from 'react';
import { Compass, Play, Pause, Layers, Cpu, Shield, Sparkles } from 'lucide-react';

interface ArchitecturalTourHeaderProps {
  onStartTour: () => void;
  isTouring: boolean;
  onNavigateTab: (tab: 'campus' | 'cutaway' | 'ai' | 'safety') => void;
  activeNavTab: string;
}

/**
 * ArchitecturalTourHeader
 * Minimalist luxury architectural navigation bar inspired by high-end real estate portals (The Solenne style).
 * Features refined typography, category quick-jump links, and an automated cinematic tour controller.
 */
export const ArchitecturalTourHeader: React.FC<ArchitecturalTourHeaderProps> = ({
  onStartTour,
  isTouring,
  onNavigateTab,
  activeNavTab,
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 h-14 bg-gradient-to-b from-[#070B14]/90 via-[#070B14]/60 to-transparent backdrop-blur-sm px-6 flex items-center justify-between border-b border-slate-800/40">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-[#BFF549]/10 border border-[#BFF549]/30 flex items-center justify-center text-[#BFF549] font-bold text-xs tracking-wider">
          SK
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-widest text-white uppercase font-sans">
              SRI KRISHNA CAMPUS OPS
            </span>
            <span className="text-[10px] text-neutral-500 font-light">|</span>
            <span className="text-[10px] tracking-wider text-[#BFF549] uppercase font-mono">
              3D DIGITAL TWIN · ARCHITECTURAL CUTAWAYS
            </span>
          </div>
        </div>
      </div>

      {/* Center Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-[11px] font-semibold uppercase tracking-widest text-slate-300">
        <button
          onClick={() => onNavigateTab('campus')}
          className={`hover:text-cyan-400 transition-colors ${
            activeNavTab === 'campus' ? 'text-cyan-400 font-bold' : ''
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => onNavigateTab('ai')}
          className={`flex items-center gap-1 hover:text-cyan-400 transition-colors ${
            activeNavTab === 'ai' ? 'text-cyan-400 font-bold' : ''
          }`}
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>AI Supercluster</span>
        </button>
        <button
          onClick={() => onNavigateTab('cutaway')}
          className={`hover:text-cyan-400 transition-colors ${
            activeNavTab === 'cutaway' ? 'text-cyan-400 font-bold' : ''
          }`}
        >
          3D Cutaways
        </button>
        <button
          onClick={() => onNavigateTab('safety')}
          className={`hover:text-cyan-400 transition-colors ${
            activeNavTab === 'safety' ? 'text-cyan-400 font-bold' : ''
          }`}
        >
          Safety & Assets
        </button>
      </nav>

      {/* Right Action CTA: Cinematic Flyover Tour */}
      <div className="flex items-center gap-3">
        <button
          onClick={onStartTour}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-300 ${
            isTouring
              ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 animate-pulse'
              : 'bg-[#1E293B]/80 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 border border-slate-700 hover:border-cyan-400'
          }`}
        >
          {isTouring ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isTouring ? 'Touring Campus...' : 'Cinematic Tour'}</span>
        </button>
      </div>
    </header>
  );
};

