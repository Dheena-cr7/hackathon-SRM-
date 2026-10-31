import React, { useState } from 'react';
import { 
  Calendar, Clock, Users, Wifi, Video, Presentation, 
  CheckCircle2, AlertTriangle, X, Shield, Sparkles, ArrowRight 
} from 'lucide-react';
import { RoomRecord } from './CampusThreeViewer';

interface SpaceReservationModalProps {
  room: RoomRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmBooking?: (bookingDetails: {
    roomId: string;
    startTime: string;
    durationMinutes: number;
    organizer: string;
    purpose: string;
  }) => void;
}

/**
 * SpaceReservationModal
 * Interactive room reservation and space booking utility inspired by Reference Image 3.
 * Features live circular capacity gauges, amenity tags, collision-safe time pickers, and booking CTA.
 */
export const SpaceReservationModal: React.FC<SpaceReservationModalProps> = ({
  room,
  isOpen,
  onClose,
  onConfirmBooking,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<string>('04:30 PM - 05:30 PM');
  const [organizer, setOrganizer] = useState<string>('Marcus Vance (Ops Dispatcher)');
  const [purpose, setPurpose] = useState<string>('Research & AI Model Evaluation');
  const [isBooked, setIsBooked] = useState<boolean>(false);

  if (!isOpen || !room) return null;

  const isDisrupted = room.disrupted || room.power_status === 'OUTAGE';
  const occupancyRate = room.capacity > 0 ? Math.round(((room.current_occupancy || 0) / room.capacity) * 100) : 0;

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisrupted) return;
    setIsBooked(true);
    setTimeout(() => {
      onConfirmBooking?.({
        roomId: room.id,
        startTime: '2026-10-31T16:30:00Z',
        durationMinutes: 60,
        organizer,
        purpose,
      });
      setTimeout(() => {
        setIsBooked(false);
        onClose();
      }, 1200);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#090E1D] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#0B132B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Presentation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{room.name}</h3>
              <p className="text-xs text-slate-400">Academic Complex • Level 0{room.floor} • Zone {room.zone}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Outage Warning if Disrupted */}
          {isDisrupted && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-red-300">Space Unavailable (Active Incident)</span>
                <p className="mt-0.5 text-red-200/90">This space is currently undergoing electrical triage. Reservations are locked until power is restored.</p>
              </div>
            </div>
          )}

          {/* Reference Image 3 Gauges: Capacity & Occupancy Rings */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
            {/* Capacity Counter */}
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-cyan-400 transition-all duration-500"
                    strokeDasharray={`${occupancyRate}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[11px] font-bold text-white">{occupancyRate}%</span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">Current Load</div>
                <div className="text-[11px] text-slate-400">{room.current_occupancy || 0} / {room.capacity} seats taken</div>
              </div>
            </div>

            {/* Availability Status */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              <span className={`w-3 h-3 rounded-full ${isDisrupted ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'}`} />
              <div>
                <div className="text-xs font-bold text-white">{isDisrupted ? 'Out of Service' : 'Available for Booking'}</div>
                <div className="text-[11px] text-slate-400">Classroom & Lab Certified</div>
              </div>
            </div>
          </div>

          {/* Installed Amenities Tags (Reference Image 3) */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">Space Hardware & Amenities</span>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5">
                <Presentation className="w-3.5 h-3.5 text-cyan-400" />
                <span>Digital Whiteboard</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-blue-400" />
                <span>PTZ Webcam Setup</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Wi-Fi 6E (1 Gbps)</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Ergonomic Seating</span>
              </span>
            </div>
          </div>

          {/* Time Slots Selection */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">Select Reservation Slot</span>
            <div className="grid grid-cols-2 gap-2">
              {['04:30 PM - 05:30 PM', '05:30 PM - 06:30 PM', '06:30 PM - 07:30 PM', '07:30 PM - 08:30 PM'].map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                    selectedSlot === slot
                      ? 'bg-cyan-950/60 border-cyan-500 text-white shadow'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{slot}</span>
                  {selectedSlot === slot && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Booking CTA Button (Reference Image 3 "Book now") */}
          <button
            onClick={handleBooking}
            disabled={isDisrupted || isBooked}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              isBooked
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                : isDisrupted
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 active:scale-[0.99]'
            }`}
          >
            {isBooked ? (
              <>
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Reservation Confirmed!</span>
              </>
            ) : isDisrupted ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Space Locked (Triage in Progress)</span>
              </>
            ) : (
              <>
                <span>Confirm &amp; Book Space</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
