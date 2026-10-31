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
import RoleGuard from '@/components/RoleGuard';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // New Booking Form State
  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const [bookingTitle, setBookingTitle] = useState('Data Structures Lab Session');
  const [roomId, setRoomId] = useState('RM-TP-204');
  const [startDate, setStartDate] = useState(getTodayISO());
  const [startTime, setStartTime] = useState('10:00');
  const [endDate, setEndDate] = useState(getTodayISO());
  const [endTime, setEndTime] = useState('13:00');
  const [attendees, setAttendees] = useState(40);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // Quick preset helpers
  const setDatePreset = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const dateStr = d.toISOString().split('T')[0];
    setStartDate(dateStr);
    setEndDate(dateStr);
  };

  const setDurationPreset = (hours: number) => {
    try {
      const [h, m] = startTime.split(':').map(Number);
      const endH = (h + hours) % 24;
      const endHStr = String(endH).padStart(2, '0');
      const endMStr = String(m || 0).padStart(2, '0');
      setEndTime(`${endHStr}:${endMStr}`);
    } catch {
      setEndTime('13:00');
    }
  };

  // Disruption Analyzer State
  const [disruptedRoomId, setDisruptedRoomId] = useState('RM-TP-204');
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
      const startIso = `${startDate}T${startTime.length === 5 ? startTime + ':00' : startTime}`;
      const endIso = `${endDate}T${endTime.length === 5 ? endTime + ':00' : endTime}`;
      const startDateTime = new Date(startIso);
      const endDateTime = new Date(endIso);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error('Please select valid start and end dates and times.');
      }
      if (endDateTime <= startDateTime) {
        throw new Error('End date and time must be later than start date and time.');
      }

      const activeUser = getActiveUser();
      const payload = {
        title: bookingTitle,
        room_id: roomId || 'RM-TP-204',
        user_id: activeUser?.id || 'usr-default',
        user_name: activeUser?.name || 'Department Officer',
        user_email: activeUser?.email || 'manager@campus.edu',
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        attendee_count: Number(attendees),
        expected_attendees: Number(attendees),
      };

      const result = await fetchWithAuth('/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setBookingSuccess(`Booking "${result.title}" confirmed! Concurrency and collision checks verified clean.`);
      setTimeout(() => setBookingSuccess(null), 5000);
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
      const startIso = `${startDate}T${startTime.length === 5 ? startTime + ':00' : startTime}`;
      const endIso = `${endDate}T${endTime.length === 5 ? endTime + ':00' : endTime}`;
      const result = await fetchWithAuth('/bookings/disruptions/analyze', {
        method: 'POST',
        body: JSON.stringify({
          compromised_room_id: disruptedRoomId,
          start_time: new Date(startIso).toISOString(),
          end_time: new Date(endIso).toISOString(),
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
          authorized_by: activeUser?.id || 'usr-default',
          reason: 'Emergency electrical hazard evacuation & relocation',
        }),
      });
      setRelocationSuccess(
        `Relocation executed! "${result.booking_title}" relocated to ${result.target_room_name}.`
      );
      setDisruptionResult(null);
      await loadData();
      setTimeout(() => setRelocationSuccess(null), 5000);
    } catch (err) {
      alert(`Relocation execution failed: ${(err as Error).message}`);
    } finally {
      setRelocating(false);
    }
  };

  return (
    <RoleGuard pageName="Classroom Schedules & Disruption Relocation">
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-[#BFF549]/10 border border-[#BFF549]/30 text-xs font-semibold text-[#BFF549] mb-2">
            <CalendarCheck2 className="w-3.5 h-3.5" />
            <span>Room Scheduling & Concurrency Guard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Classroom & Space Allocation
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Atomic overlap prevention, automated conflict detection, and 1-click emergency classroom relocation during active campus incidents.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="p-2 px-3 bg-[#1A1A1A] hover:bg-[#242424] border border-white/[0.08] text-neutral-300 hover:text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start sm:self-auto focus-ring cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#BFF549]' : ''}`} />
          <span>Refresh Schedule</span>
        </button>
      </div>

      {/* Emergency Disruption Management Banner */}
      <div className="bg-[#1A1A1A] border border-[#FF2B3A]/30 p-5 sm:p-6 rounded-2xl space-y-4 shadow-glaido-card card-sheen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-[#FF2B3A]/10 border border-[#FF2B3A]/30 text-[#FF2B3A] shrink-0 mt-0.5">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white">
                  Emergency Facility Disruption & Relocation
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FF2B3A]/10 text-[#FF2B3A] border border-[#FF2B3A]/30">
                  Scenario A Available
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed max-w-3xl">
                Scan Room TP-204 for compromised midterm examinations or lab sessions and automatically identify nearby unoccupied rooms with matching capacity and equipment.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAnalyzeDisruption}
            disabled={analyzingDisruption}
            className="px-4 py-2 bg-[#FF2B3A] hover:bg-[#D9202E] disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all active:scale-[0.98] whitespace-nowrap self-start sm:self-auto focus-ring cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{analyzingDisruption ? 'Scanning Facilities...' : 'Analyze Disruption Impact'}</span>
          </button>
        </div>

        {relocationSuccess && (
          <div className="p-3 bg-[#BFF549]/10 border border-[#BFF549]/30 rounded-xl text-[#BFF549] text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#BFF549] shrink-0" />
            <span>{relocationSuccess}</span>
          </div>
        )}

        {/* Disruption Results Grid */}
        {disruptionResult && (
          <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Compromised Bookings */}
              <div className="bg-[#0D0D0D] p-4 rounded-xl border border-white/[0.08] space-y-3">
                <span className="text-xs font-bold text-[#FF2B3A] flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Compromised Schedule ({disruptionResult.affected_bookings.length})</span>
                </span>
                {disruptionResult.affected_bookings.length === 0 ? (
                  <p className="text-xs text-neutral-400">No scheduled bookings found in compromised room window.</p>
                ) : (
                  disruptionResult.affected_bookings.map((b: any) => (
                    <div key={b.id} className="p-3 bg-[#1A1A1A] rounded-xl border border-white/[0.08] text-xs space-y-1">
                      <div className="flex justify-between font-bold text-white">
                        <span>{b.title}</span>
                        <span className="text-[#FF2B3A] uppercase font-mono text-[10px]">{b.status}</span>
                      </div>
                      <div className="text-neutral-400 text-[11px]">
                        Organizer: {b.user_name} ({b.user_email})
                      </div>
                      <div className="text-neutral-400 text-[11px] flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{b.expected_attendees} Expected Attendees</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Eligible Alternative Rooms */}
              <div className="bg-[#0D0D0D] p-4 rounded-xl border border-white/[0.08] space-y-3">
                <span className="text-xs font-bold text-[#BFF549] flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Eligible Alternative Rooms ({disruptionResult.eligible_alternative_rooms.length})</span>
                </span>
                {disruptionResult.eligible_alternative_rooms.length === 0 ? (
                  <p className="text-xs text-neutral-400">No suitable empty rooms matching capacity and equipment found.</p>
                ) : (
                  disruptionResult.eligible_alternative_rooms.map((alt: any) => {
                    const firstBooking = disruptionResult.affected_bookings[0];
                    return (
                      <div key={alt.id} className="p-3 bg-[#1A1A1A] rounded-xl border border-white/[0.08] text-xs flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-white">{alt.name} ({alt.code})</div>
                          <div className="text-neutral-400 text-[11px] mt-0.5">
                            Capacity: {alt.capacity} seats • Type: {alt.room_type}
                          </div>
                        </div>
                        {firstBooking && (
                          <button
                            type="button"
                            onClick={() => handleExecuteRelocation(firstBooking.id, alt.id)}
                            disabled={relocating}
                            className="px-3 py-1.5 bg-[#BFF549] hover:bg-[#8CC21F] disabled:opacity-40 text-black font-bold rounded-xl text-xs flex items-center space-x-1 shadow-glaido-button transition-all active:scale-[0.98] whitespace-nowrap focus-ring cursor-pointer"
                          >
                            <ArrowRight className="w-3.5 h-3.5 text-black" />
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
            <h2 className="text-sm font-bold text-white">Current Confirmed Schedule</h2>
            <span className="text-xs text-neutral-400 font-mono">{bookings.length} reservations</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-neutral-400 text-xs">Querying schedule database...</div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 text-xs bg-[#1A1A1A] border border-white/[0.08] rounded-2xl">
              No confirmed bookings currently on record.
            </div>
          ) : (
            bookings.map((b) => (
              <div
                key={b.id}
                className="bg-[#1A1A1A] border border-white/[0.08] hover:border-white/[0.18] p-4 rounded-xl transition-all card-sheen"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-[#BFF549] uppercase tracking-wider block">
                      {b.room_code || 'ROOM'}
                    </span>
                    <h3 className="font-semibold text-neutral-100 text-sm mt-0.5">{b.title}</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    b.status === 'relocated'
                      ? 'bg-[#D97757]/10 text-[#D97757] border-[#D97757]/30'
                      : b.status === 'confirmed'
                      ? 'bg-[#BFF549]/10 text-[#BFF549] border-[#BFF549]/30'
                      : 'bg-[#FF2B3A]/10 text-[#FF2B3A] border-[#FF2B3A]/30'
                  }`}>
                    {b.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-neutral-400 border-t border-white/[0.06] pt-2.5">
                  <div className="sm:col-span-2 flex items-center space-x-1.5 font-mono text-neutral-300">
                    <Clock className="w-3.5 h-3.5 text-[#BFF549] shrink-0" />
                    <span>
                      {new Date(b.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end space-x-2">
                    <div className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{b.expected_attendees || b.attendee_count} Seats</span>
                    </div>
                    <div className="text-right text-neutral-300 truncate font-medium max-w-[120px]">
                      {b.user_name}
                    </div>
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
            className="bg-[#1A1A1A] border border-white/[0.08] p-5 rounded-2xl space-y-4 shadow-glaido-card card-sheen"
          >
            <div>
              <h3 className="text-xs font-bold text-white">
                Reserve Facility Room
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                Atomic time-window overlap validation guarantees zero double-bookings.
              </p>
            </div>

            {bookingSuccess && (
              <div className="p-3 bg-[#BFF549]/10 border border-[#BFF549]/30 text-[#BFF549] rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{bookingSuccess}</span>
              </div>
            )}

            {bookingError && (
              <div className="p-3 bg-[#FF2B3A]/10 border border-[#FF2B3A]/30 text-[#FF2B3A] rounded-xl text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Booking Conflict Detected</span>
                  <span className="text-[11px] text-red-200">{bookingError}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Event or Session Title</label>
              <input
                type="text"
                value={bookingTitle}
                onChange={(e) => setBookingTitle(e.target.value)}
                required
                className="w-full bg-[#0D0D0D] border border-white/[0.10] rounded-xl px-3 py-2 text-xs text-white focus-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Target Room</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-white/[0.10] rounded-xl px-2.5 py-2 text-xs text-white focus-ring cursor-pointer"
              >
                <option value="RM-TP-204">Tech Park B204 (Specialized Systems Lab - Cap 60)</option>
                <option value="RM-TP-101">Tech Park 101 (Main Seminar Hall - Cap 80)</option>
                <option value="RM-AUD-01">Auditorium Main Hall (Dr. T.P. Ganesan - Cap 120)</option>
                <option value="RM-MECH-102">Mechanical & Civil Lab 102 (Cap 40)</option>
                <option value="RM-LIB-101">Central Library Seminar L101 (Cap 40)</option>
                <option value="ROOM_ACAD_101">Academic AI Supercluster Lab 101 (Cap 45)</option>
                <option value="ROOM_ACAD_202">Academic Neural Vision AI Lab 202 (Cap 50)</option>
                <option value="ROOM_ACAD_002">Academic Auditorium Hall A 002 (Cap 100)</option>
              </select>
            </div>

            {/* Quick Date Presets */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] font-semibold text-neutral-400">Quick Date Presets</label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setDatePreset(0)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-[#BFF549]/20 hover:text-[#BFF549] text-neutral-300 text-[11px] font-medium border border-white/[0.08] transition-colors cursor-pointer"
                >
                  📅 Today
                </button>
                <button
                  type="button"
                  onClick={() => setDatePreset(1)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-[#BFF549]/20 hover:text-[#BFF549] text-neutral-300 text-[11px] font-medium border border-white/[0.08] transition-colors cursor-pointer"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setDatePreset(2)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-[#BFF549]/20 hover:text-[#BFF549] text-neutral-300 text-[11px] font-medium border border-white/[0.08] transition-colors cursor-pointer"
                >
                  In 2 Days
                </button>
                <button
                  type="button"
                  onClick={() => setDatePreset(7)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-[#BFF549]/20 hover:text-[#BFF549] text-neutral-300 text-[11px] font-medium border border-white/[0.08] transition-colors cursor-pointer"
                >
                  Next Week
                </button>
              </div>
            </div>

            {/* Start Date & Start Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#BFF549]" />
                  <span>Start Date</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-[#0D0D0D] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus-ring cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#BFF549]" />
                  <span>Start Time</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-[#0D0D0D] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus-ring cursor-pointer"
                />
              </div>
            </div>

            {/* End Date & End Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#FF8A1F]" />
                  <span>End Date</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-[#0D0D0D] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus-ring cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#FF8A1F]" />
                  <span>End Time</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-[#0D0D0D] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus-ring cursor-pointer"
                />
              </div>
            </div>

            {/* Quick Duration Helper */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#0D0D0D] border border-white/[0.06] text-[11px]">
              <span className="text-neutral-400">Add Duration:</span>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setDurationPreset(1)}
                  className="px-2.5 py-0.5 rounded-lg bg-white/[0.06] hover:bg-[#BFF549]/20 hover:text-[#BFF549] text-neutral-300 font-mono text-xs border border-white/[0.08] transition-colors cursor-pointer"
                >
                  +1h
                </button>
                <button
                  type="button"
                  onClick={() => setDurationPreset(2)}
                  className="px-2.5 py-0.5 rounded-lg bg-white/[0.06] hover:bg-[#BFF549]/20 hover:text-[#BFF549] text-neutral-300 font-mono text-xs border border-white/[0.08] transition-colors cursor-pointer"
                >
                  +2h
                </button>
                <button
                  type="button"
                  onClick={() => setDurationPreset(3)}
                  className="px-2.5 py-0.5 rounded-lg bg-white/[0.06] hover:bg-[#BFF549]/20 hover:text-[#BFF549] text-neutral-300 font-mono text-xs border border-white/[0.08] transition-colors cursor-pointer"
                >
                  +3h
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Expected Attendees</label>
              <input
                type="number"
                value={attendees}
                onChange={(e) => setAttendees(Number(e.target.value))}
                min={1}
                className="w-full bg-[#0D0D0D] border border-white/[0.10] rounded-xl px-3 py-2 text-xs text-white focus-ring"
              />
            </div>

            <button
              type="submit"
              disabled={bookingSubmitting}
              className="w-full py-2.5 bg-[#BFF549] hover:bg-[#8CC21F] disabled:opacity-40 text-black font-bold rounded-xl text-xs shadow-glaido-button transition-all active:scale-[0.98] flex items-center justify-center space-x-1.5 focus-ring cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-black" />
              <span>{bookingSubmitting ? 'Evaluating Concurrency...' : 'Reserve Room'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}
