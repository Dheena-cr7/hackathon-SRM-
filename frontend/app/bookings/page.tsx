'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  ShieldAlert, 
  ArrowRight,
  RefreshCw,
  Sparkles,
  Building2,
  Check,
  CalendarCheck2
} from 'lucide-react';
import { fetchWithAuth, getActiveUser } from '@/lib/api';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // New Booking Form State
  const [bookingTitle, setBookingTitle] = useState('Data Structures Lab Session');
  const [roomId, setRoomId] = useState('');
  const [startTime, setStartTime] = useState('2026-10-30T14:00');
  const [endTime, setEndTime] = useState('2026-10-30T17:00');
  const [attendees, setAttendees] = useState(40);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // Disruption Analyzer State
  const [disruptedRoomId, setDisruptedRoomId] = useState('room-tp-204');
  const [analyzingDisruption, setAnalyzingDisruption] = useState(false);
  const [disruptionResult, setDisruptionResult] = useState<any | null>(null);
  const [relocating, setRelocating] = useState(false);
  const [relocationSuccess, setRelocationSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsData, bldData] = await Promise.all([
        fetchWithAuth('/bookings'),
        fetchWithAuth('/campus/buildings'),
      ]);
      setBookings(bookingsData);
      setBuildings(bldData);
      if (bldData.length > 0 && !selectedBuildingId) {
        setSelectedBuildingId(bldData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSubmitting(true);
    setBookingError(null);
    setBookingSuccess(null);

    try {
      const activeUser = getActiveUser();
      const payload = {
        title: bookingTitle,
        room_id: roomId || 'room-tp-204',
        user_id: activeUser.id,
        user_name: activeUser.name,
        user_email: activeUser.email,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        expected_attendees: Number(attendees),
      };

      const result = await fetchWithAuth('/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setBookingSuccess(`Booking "${result.title}" confirmed! Room collision checks verified clean.`);
      await loadData();
    } catch (err) {
      setBookingError((err as Error).message);
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleAnalyzeDisruption = async () => {
    setAnalyzingDisruption(true);
    setRelocationSuccess(null);
    try {
      const result = await fetchWithAuth('/bookings/disruptions/analyze', {
        method: 'POST',
        body: JSON.stringify({
          compromised_room_id: disruptedRoomId,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
        }),
      });
      setDisruptionResult(result);
    } catch (err) {
      alert(`Disruption analysis failed: ${(err as Error).message}`);
    } finally {
      setAnalyzingDisruption(false);
    }
  };

  const handleExecuteRelocation = async (bookingId: string, targetRoomId: string) => {
    setRelocating(true);
    try {
      const activeUser = getActiveUser();
      const result = await fetchWithAuth('/bookings/disruptions/relocate', {
        method: 'POST',
        body: JSON.stringify({
          booking_id: bookingId,
          target_room_id: targetRoomId,
          authorized_by: activeUser.id,
          reason: 'Emergency electrical hazard evacuation & relocation',
        }),
      });
      setRelocationSuccess(
        `Relocation executed! "${result.booking_title}" relocated to ${result.target_room_name}.`
      );
      setDisruptionResult(null);
      await loadData();
    } catch (err) {
      alert(`Relocation execution failed: ${(err as Error).message}`);
    } finally {
      setRelocating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400 mb-2">
            <CalendarCheck2 className="w-3.5 h-3.5" />
            <span>Facility Scheduling & Concurrency Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Classroom & Space Allocation
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Atomic overlap prevention (AC-05.1), automated conflict detection, and 1-click emergency classroom relocation during active incidents.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Schedule</span>
        </button>
      </div>

      {/* Emergency Disruption Management Banner */}
      <div className="card-glass p-5 rounded-2xl border-rose-500/30 bg-rose-950/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex-shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-semibold text-white">
                  Emergency Facility Disruption Protocol
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Scenario A Active
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                Scan Room TP-204 for compromised midterm examinations and identify unoccupied rooms with equal capacity and A/V equipment.
              </p>
            </div>
          </div>

          <button
            onClick={handleAnalyzeDisruption}
            disabled={analyzingDisruption}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{analyzingDisruption ? 'Scanning Facilities...' : 'Analyze Disruption Impact'}</span>
          </button>
        </div>

        {relocationSuccess && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{relocationSuccess}</span>
          </div>
        )}

        {/* Disruption Results Grid */}
        {disruptionResult && (
          <div className="mt-4 pt-4 border-t border-rose-500/20 space-y-4 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Compromised Bookings */}
              <div className="bg-zinc-950/70 p-4 rounded-xl border border-white/[0.06] space-y-3">
                <span className="text-xs font-medium text-rose-400 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Compromised Schedule ({disruptionResult.affected_bookings.length})</span>
                </span>
                {disruptionResult.affected_bookings.length === 0 ? (
                  <p className="text-xs text-zinc-400">No scheduled bookings found in compromised room window.</p>
                ) : (
                  disruptionResult.affected_bookings.map((b: any) => (
                    <div key={b.id} className="p-3 bg-zinc-900/60 rounded-lg border border-white/[0.06] text-xs space-y-1">
                      <div className="flex justify-between font-medium text-white">
                        <span>{b.title}</span>
                        <span className="text-rose-400 uppercase font-mono text-[10px]">{b.status}</span>
                      </div>
                      <div className="text-zinc-400 text-[11px]">
                        Organizer: {b.user_name} ({b.user_email})
                      </div>
                      <div className="text-zinc-400 text-[11px] flex items-center space-x-1.5">
                        <Users className="w-3 h-3 text-zinc-500" />
                        <span>{b.expected_attendees} Expected Attendees</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Eligible Alternative Rooms */}
              <div className="bg-zinc-950/70 p-4 rounded-xl border border-white/[0.06] space-y-3">
                <span className="text-xs font-medium text-emerald-400 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Eligible Alternative Rooms ({disruptionResult.eligible_alternative_rooms.length})</span>
                </span>
                {disruptionResult.eligible_alternative_rooms.length === 0 ? (
                  <p className="text-xs text-zinc-400">No suitable empty rooms matching capacity and equipment found.</p>
                ) : (
                  disruptionResult.eligible_alternative_rooms.map((alt: any) => {
                    const firstBooking = disruptionResult.affected_bookings[0];
                    return (
                      <div key={alt.id} className="p-3 bg-zinc-900/60 rounded-lg border border-white/[0.06] text-xs flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-white">{alt.name} ({alt.code})</div>
                          <div className="text-zinc-400 text-[11px] mt-0.5">
                            Capacity: {alt.capacity} seats • Type: {alt.room_type}
                          </div>
                        </div>
                        {firstBooking && (
                          <button
                            onClick={() => handleExecuteRelocation(firstBooking.id, alt.id)}
                            disabled={relocating}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium flex items-center space-x-1 shadow-sm transition-colors whitespace-nowrap"
                          >
                            <ArrowRight className="w-3 h-3" />
                            <span>1-Click Relocate</span>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Confirmed Schedule vs Reservation Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Schedule List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Current Confirmed Schedule</h2>
            <span className="text-xs text-zinc-500 font-mono">{bookings.length} reservations</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-zinc-500 text-xs">Querying schedule database...</div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs card-glass rounded-2xl">
              No confirmed bookings currently on record.
            </div>
          ) : (
            bookings.map((b) => (
              <div
                key={b.id}
                className="card-glass p-4 rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] text-blue-400 uppercase tracking-wider block">
                      {b.room_code || 'ROOM'}
                    </span>
                    <h3 className="font-medium text-zinc-100 text-sm mt-0.5">{b.title}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                    b.status === 'relocated'
                      ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                      : b.status === 'confirmed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                  }`}>
                    {b.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-zinc-400 border-t border-white/[0.04] pt-2.5">
                  <div className="flex items-center space-x-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{b.expected_attendees} Attendees</span>
                  </div>
                  <div className="text-right sm:col-span-1 col-span-2 text-zinc-300 truncate">
                    {b.user_name}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Booking Reservation Form */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleCreateBooking}
            className="card-glass p-5 rounded-2xl space-y-4"
          >
            <div>
              <h3 className="text-xs font-semibold text-zinc-200">
                Reserve Facility Room
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                Atomic time-window overlap validation guarantees zero double-bookings.
              </p>
            </div>

            {bookingSuccess && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 rounded-lg text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{bookingSuccess}</span>
              </div>
            )}

            {bookingError && (
              <div className="p-3 bg-rose-950/30 border border-rose-500/20 text-rose-300 rounded-lg text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Booking Conflict Detected</span>
                  <span className="text-[11px] text-rose-200">{bookingError}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Event or Session Title</label>
              <input
                type="text"
                value={bookingTitle}
                onChange={(e) => setBookingTitle(e.target.value)}
                required
                className="w-full bg-zinc-950/70 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Target Room</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-zinc-950/70 border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500/60"
              >
                <option value="room-tp-204">TP-204 (Tech Park 2nd Fl, Cap 60, Lab Equip)</option>
                <option value="room-aud-01">AUD-01 (Main Auditorium, Cap 500, Keynote A/V)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Start Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full bg-zinc-950/70 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">End Time</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full bg-zinc-950/70 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Expected Attendees</label>
              <input
                type="number"
                value={attendees}
                onChange={(e) => setAttendees(Number(e.target.value))}
                min={1}
                className="w-full bg-zinc-950/70 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500/60"
              />
            </div>

            <button
              type="submit"
              disabled={bookingSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium shadow-sm transition-colors flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{bookingSubmitting ? 'Evaluating Concurrency...' : 'Reserve Room'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
