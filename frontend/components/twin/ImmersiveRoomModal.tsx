import React from 'react';
import { 
  X, Cpu, Zap, Thermometer, Users, AlertTriangle, 
  CheckCircle2, ArrowRight, ShieldCheck, Activity, Calendar, Wrench
} from 'lucide-react';
import { RoomRecord } from './CampusThreeViewer';

interface ImmersiveRoomModalProps {
  room: RoomRecord | null;
  onClose: () => void;
  onBookSpace?: (roomId: string) => void;
  onReportIncident?: (roomId: string) => void;
}

/**
 * ImmersiveRoomModal
 * Eye-level room inspection overlay inspired by high-end interior 3D walkthroughs.
 * Provides deep architectural specifications, live telemetry, hardware diagnostics,
 * and operational facilities actions.
 */
export const ImmersiveRoomModal: React.FC<ImmersiveRoomModalProps> = ({
  room,
  onClose,
  onBookSpace,
  onReportIncident,
}) => {
  if (!room) return null;

  const isDisrupted = room.disrupted || room.power_status === 'OUTAGE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#090E1D] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-[#0D152A] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800">
              {room.id.replace('ROOM_ACAD_', 'RM-')}
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">{room.name}</h3>
              <p className="text-xs text-slate-400">Academic Complex • Level 0{room.floor} • {room.type}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              isDisrupted 
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              {isDisrupted ? 'CRITICAL OUTAGE' : 'OPERATIONAL'}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Outage Warning Banner if disrupted */}
          {isDisrupted && (
            <div className="p-4 bg-red-950/60 border border-red-500/60 rounded-xl text-xs text-red-200 flex items-start gap-3 shadow-lg shadow-red-950/40">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-300 text-sm">Emergency Power Breaker Trip Active</h4>
                <p className="mt-1 text-slate-300">
                  Sub-panel 204-B triggered overcurrent protection. Main presentation rig and HVAC booster offline.
                  Scheduled final examination CS-401 requires immediate automated relocation.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => onReportIncident?.(room.id)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Dispatch Emergency Technician</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Environmental & Capacity Telemetry Grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Thermometer className="w-4 h-4 text-amber-400" />
                <span>Ambient</span>
              </div>
              <div className="text-xl font-black text-white mt-1">{room.temperature_c}°C</div>
              <span className="text-[10px] text-slate-500 font-mono">HVAC: {room.hvac_status}</span>
            </div>

            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Capacity</span>
              </div>
              <div className="text-xl font-black text-white mt-1">{room.capacity}</div>
              <span className="text-[10px] text-slate-500 font-mono">{room.current_occupancy} present</span>
            </div>

            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Power Feed</span>
              </div>
              <div className={`text-xl font-black mt-1 ${isDisrupted ? 'text-red-400' : 'text-emerald-400'}`}>
                {room.power_status}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Bus: 480V 3-Phase</span>
            </div>

            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Safety Rating</span>
              </div>
              <div className="text-xl font-black text-white mt-1">Class A</div>
              <span className="text-[10px] text-slate-500 font-mono">AED & Exting. 6m</span>
            </div>
          </div>

          {/* AI Computing Cluster Telemetry (if AI zone) */}
          {(room.zone === 'AI' || room.name.toLowerCase().includes('ai') || room.name.toLowerCase().includes('cluster')) && (
            <div className="p-4 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 rounded-xl border border-cyan-800/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    High-Density Neural Supercluster Specs
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                  NVIDIA H100 SXM5
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Compute Throughput</span>
                  <span className="font-bold text-cyan-400 text-sm">1.42 PFLOPS</span>
                </div>
                <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Liquid Chilled Loop</span>
                  <span className="font-bold text-white text-sm">19.2°C Delta</span>
                </div>
                <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Memory Bandwidth</span>
                  <span className="font-bold text-white text-sm">3.35 TB/sec</span>
                </div>
              </div>
            </div>
          )}

          {/* Installed Space Hardware & Amenities */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Installed Hardware & Architectural Equipment
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {room.equipment?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#0D152A] border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Current occupancy status: <span className="text-emerald-400 font-bold">Verified via IoT sensor array</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onBookSpace?.(room.id)}
              disabled={isDisrupted}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                isDisrupted
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Reserve / Book Space</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

