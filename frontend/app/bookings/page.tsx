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
  Building2
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

      setBookingSuccess(`Booking "${result.title}" confirmed successfully! (ID: ${result.id.slice(0, 8)})`);
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
        `Relocation executed! Booking "${result.booking_title}" safely moved to ${result.target_room_name}.`
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-blue-400" />
            <span>Room Scheduling & Disruption Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Prevent double-bookings concurrency, evaluate facility constraints, and execute 1-click emergency classroom relocations.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs flex items-center space-x-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Disruption Alert Banner */}
      <div className="bg-gradient-to-r from-rose-950/70 to-slate-900 border border-rose-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Disruption Impact Analyzer (Scenario A)
              </h2>
              <p className="text-xs text-slate-300">
                Detect affected examinations & find compliant replacement rooms with identical equipment and capacity.
              </p>
            </div>
          </div>
          <button
            onClick={handleAnalyzeDisruption}
            disabled={analyzingDisruption}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-md transition-all whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span>{analyzingDisruption ? 'Scanning...' : 'Run Disruption Analysis'}</span>
          </button>
        </div>

        {relocationSuccess && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-600 rounded-lg text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{relocationSuccess}</span>
          </div>
        )}

        {/* Disruption Results Grid */}
        {disruptionResult && (
          <div className="mt-4 pt-4 border-t border-rose-900/60 space-y-4 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Affected Bookings */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                  Compromised Bookings ({disruptionResult.affected_bookings.length})
                </span>
                {disruptionResult.affected_bookings.length === 0 ? (
                  <p className="text-xs text-slate-400">No scheduled bookings in the compromised window.</p>
                ) : (
                  disruptionResult.affected_bookings.map((b: any) => (
                    <div key={b.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between font-semibold text-white">
                        <span>{b.title}</span>
                        <span className="text-rose-400 uppercase font-mono">{b.status}</span>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Organizer: {b.user_name} ({b.user_email})
                      </div>
                      <div className="text-slate-400 text-[11px] flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 inline text-slate-500" />
                        <span>{b.expected_attendees} registered attendees</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Eligible Alternative Rooms */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  Eligible Alternative Rooms ({disruptionResult.eligible_alternative_rooms.length})
                </span>
                {disruptionResult.eligible_alternative_rooms.length === 0 ? (
                  <p className="text-xs text-slate-400">No eligible alternatives found matching capacity and equipment.</p>
                ) : (
                  disruptionResult.eligible_alternative_rooms.map((alt: any) => {
                    const firstBooking = disruptionResult.affected_bookings[0];
                    return (
                      <div key={alt.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-white">{alt.name} ({alt.code})</div>
                          <div className="text-slate-400 text-[11px]">
                            Capacity: {alt.capacity} seats • Type: {alt.room_type}
                          </div>
                        </div>
                        {firstBooking && (
                          <button
                            onClick={() => handleExecuteRelocation(firstBooking.id, alt.id)}
                            disabled={relocating}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center space-x-1 shadow-sm whitespace-nowrap"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>Relocate Here</span>
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

      {/* Main Grid: Create Booking Form vs Confirmed Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Schedule List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Confirmed Schedule</h2>
            <span className="text-xs text-slate-400">{bookings.length} reservations</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading schedule...</div>
          ) : bookings.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-xl">
              No confirmed bookings currently on record.
            </div>
          ) : (
            bookings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-blue-400 uppercase tracking-wider block">
                      {b.room_code || 'ROOM'}
                    </span>
                    <h3 className="font-bold text-slate-100 text-sm mt-0.5">{b.title}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    b.status === 'relocated'
                      ? 'bg-purple-950 text-purple-300 border border-purple-800'
                      : b.status === 'confirmed'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    {b.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>{b.expected_attendees} Attendees</span>
                  </div>
                  <div className="text-right sm:col-span-1 col-span-2 text-slate-300 truncate">
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
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4"
          >
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Book a Facility / Classroom
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Evaluates time-window overlap and prevents double-booking (AC-05.1).
              </p>
            </div>

            {bookingSuccess && (
              <div className="p-3 bg-emerald-950/70 border border-emerald-700 text-emerald-300 rounded-lg text-xs">
                {bookingSuccess}
              </div>
            )}

            {bookingError && (
              <div className="p-3 bg-rose-950/70 border border-rose-700 text-rose-300 rounded-lg text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Conflict Detected</span>
                  <span>{bookingError}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Session / Event Title</label>
              <input
                type="text"
                value={bookingTitle}
                onChange={(e) => setBookingTitle(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Target Room</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="room-tp-204">TP-204 (Tech Park 2nd Floor, Cap 60)</option>
                <option value="room-aud-01">AUD-01 (Main Auditorium, Cap 500)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Expected Attendees</label>
              <input
                type="number"
                value={attendees}
                onChange={(e) => setAttendees(Number(e.target.value))}
                min={1}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={bookingSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{bookingSubmitting ? 'Validating Overlap...' : 'Reserve Room'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

