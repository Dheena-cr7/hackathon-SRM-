import React from 'react';
import { Cpu, Layers, Users, ShieldAlert, Sparkles, RotateCw, ArrowLeftRight, CheckCircle2 } from 'lucide-react';

export interface RoomTourItem {
  id: string;
  label: string;
  category: 'ai' | 'lecture' | 'collab' | 'exec' | 'incident';
  isOutage?: boolean;
}

interface RoomTourDockProps {
  rooms: RoomTourItem[];
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onReverseAngle?: () => void;
  onReverseZone?: () => void;
  onToggleDisruption?: () => void;
  isDisrupted?: boolean;
  visible?: boolean;
  className?: string;
}

/**
 * RoomTourDock
 * Segmented room tour navigation dock inspired by high-end architectural walkthroughs.
 * Provides instant 1-click room flyover, 180° reverse view angle, and live disruption state reversal.
 */
export const RoomTourDock: React.FC<RoomTourDockProps> = ({
  rooms,
  activeRoomId,
  onSelectRoom,
  onReverseAngle,
  onReverseZone,
  onToggleDisruption,
  isDisrupted = true,
  visible = true,
  className = '',
}) => {
  if (!visible || rooms.length === 0) return null;

  return (
    <div className={`absolute z-20 flex items-center gap-1.5 bg-[#070B14]/92 backdrop-blur-xl p-1.5 rounded-xl border border-slate-700/80 shadow-2xl transition-all duration-300 ${className}`}>
      {/* Reverse Camera Angle Shortcut */}
      {onReverseAngle && (
        <button
          onClick={onReverseAngle}
          title="Reverse Viewing Angle (180° Orbit)"
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1 transition-all"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>⟲ 180°</span>
        </button>
      )}

      {/* Reverse / Swap Key Zones Shortcut */}
      {onReverseZone && (
        <button
          onClick={onReverseZone}
          title="Reverse / Swap Focus (AI Superpod ⇄ Red Disrupted Zone)"
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 flex items-center gap-1 transition-all"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>⇄ Swap</span>
        </button>
      )}

      <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />

      {/* Room Tour Buttons */}
      {rooms.map((room) => {
        const isActive = activeRoomId === room.id;
        return (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
              isActive
                ? 'bg-amber-100 text-slate-950 font-bold shadow-lg shadow-amber-200/20'
                : room.isOutage
                ? 'text-red-400 hover:bg-red-950/40 hover:text-red-300'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {room.category === 'ai' && (
              <Cpu className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-cyan-400'}`} />
            )}
            {room.category === 'lecture' && (
              <Layers className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-blue-400'}`} />
            )}
            {room.category === 'collab' && (
              <Sparkles className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
            )}
            {room.category === 'exec' && (
              <Users className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-purple-400'}`} />
            )}
            {room.isOutage && (
              <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            )}
            <span>{room.label}</span>
          </button>
        );
      })}

      {/* Disruption State Reversal Toggle (Room 204 Outage ⇄ Restored) */}
      {onToggleDisruption && (
        <>
          <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />
          <button
            onClick={onToggleDisruption}
            title={isDisrupted ? "Reverse Disruption (Restore Room 204 Power)" : "Simulate Disruption (Trip Breaker)"}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
              isDisrupted
                ? 'bg-red-950/40 text-red-300 border-red-500/40 hover:bg-red-900/50'
                : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
            }`}
          >
            {isDisrupted ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span>Restore Rm 204</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulate Trip</span>
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
};
