import React from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, X, Sparkles, Compass } from 'lucide-react';

interface CinematicTourControllerProps {
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  currentLabel: string;
  onTogglePlay: () => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onRestart: () => void;
  onClose: () => void;
  className?: string;
}

/**
 * CinematicTourController
 * Interactive autonomous walkthrough director inspired by luxury architectural tours (The Solenne Brickell Bay).
 * Supports play/pause, step scrubbing, direction reversal, and dynamic camera flyover.
 */
export const CinematicTourController: React.FC<CinematicTourControllerProps> = ({
  isPlaying,
  currentStep,
  totalSteps = 5,
  currentLabel,
  onTogglePlay,
  onNextStep,
  onPrevStep,
  onRestart,
  onClose,
  className = '',
}) => {
  const progressPct = Math.round(((currentStep + 1) / totalSteps) * 100);

  return (
    <div className={`flex items-center gap-3 bg-[#070B14]/95 backdrop-blur-2xl border border-slate-700/80 px-4 py-2.5 rounded-2xl shadow-2xl text-slate-100 ${className}`}>
      {/* Tour Status Beacon */}
      <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
        <span className="relative flex h-2.5 w-2.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPlaying ? 'bg-amber-400 opacity-75' : 'bg-slate-500 opacity-25'}`} />
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPlaying ? 'bg-amber-400' : 'bg-slate-500'}`} />
        </span>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Cinematic Tour</span>
          </span>
          <span className="text-xs font-semibold text-white max-w-[200px] truncate">
            {currentLabel || `Tour Stop ${currentStep + 1} of ${totalSteps}`}
          </span>
        </div>
      </div>

      {/* Play / Pause / Step Controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onPrevStep}
          title="Previous Stop"
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onTogglePlay}
          title={isPlaying ? 'Pause Tour' : 'Resume Tour'}
          className="p-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-all shadow-lg shadow-amber-400/25"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
        </button>

        <button
          onClick={onNextStep}
          title="Next Stop"
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onRestart}
          title="Restart Tour from Beginning"
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress Track */}
      <div className="flex flex-col w-28 gap-1 pl-2 border-l border-slate-800">
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>{currentStep + 1}/{totalSteps}</span>
          <span>{progressPct}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Close Tour Button */}
      <button
        onClick={onClose}
        title="Exit Cinematic Walkthrough"
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
