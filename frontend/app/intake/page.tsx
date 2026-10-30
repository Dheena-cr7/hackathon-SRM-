'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Cpu, 
  Send, 
  CheckCircle2, 
  MapPin, 
  Layers, 
  Clock, 
  ShieldAlert, 
  RefreshCw,
  HelpCircle,
  Building2,
  ArrowRight,
  Zap,
  Wind,
  Droplets,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { fetchWithAuth, getActiveUser } from '@/lib/api';

interface AnalysisResult {
  category: string;
  severity: string;
  confidence: number;
  extracted_entities: {
    building_code: string | null;
    building_name: string | null;
    room_number: string | null;
    equipment_type: string | null;
    has_sparks: boolean;
    is_safety_hazard: boolean;
    time_mentions: string[];
  };
  missing_fields: string[];
  clarification_questions: string[];
  explanation: string;
}

export default function IntakePage() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [createdIncident, setCreatedIncident] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form override state
  const [category, setCategory] = useState('electrical');
  const [severity, setSeverity] = useState('high');
  const [buildingId, setBuildingId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    fetchWithAuth('/campus/buildings')
      .then((data) => {
        setBuildings(data);
        if (data.length > 0) setBuildingId(data[0].id);
      })
      .catch((err) => console.error(err));
  }, []);

  // Preset sample prompts with Lucide vector icons
  const samplePrompts = [
    {
      icon: Zap,
      badge: 'Scenario A',
      title: 'Sparking Panel (Tech Park 204)',
      text: 'Tech Park room 204 electrical panel sparking, smoke visible, exam scheduled at 2pm',
      color: 'text-amber-400 border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40',
    },
    {
      icon: Wind,
      badge: 'HVAC',
      title: 'Auditorium AC Failure',
      text: 'Main Auditorium central AC unit stopped cooling, temperature rising above 32C ahead of keynote',
      color: 'text-sky-400 border-sky-500/20 bg-sky-500/5 hover:border-sky-500/40',
    },
    {
      icon: Droplets,
      badge: 'Facility',
      title: 'Corridor Water Leak',
      text: 'Plumbing leak detected in Tech Park 2nd floor corridor near restrooms, water pooling on floor',
      color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/40',
    },
    {
      icon: HelpCircle,
      badge: 'Vague',
      title: 'Power Outage & Projector',
      text: 'The power went out in my classroom and the projector shut off',
      color: 'text-purple-400 border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40',
    },
  ];

  const handleAnalyze = async (textToAnalyze?: string) => {
    const raw = textToAnalyze || description;
    if (!raw.trim()) return;

    setAnalyzing(true);
    setError(null);
    try {
      const result: AnalysisResult = await fetchWithAuth('/intake/analyze', {
        method: 'POST',
        body: JSON.stringify({ raw_text: raw }),
      });
      setAnalysis(result);

      // Auto-populate form overrides based on extraction
      setCategory(result.category);
      setSeverity(result.severity);
      if (result.extracted_entities.room_number) {
        setRoomNumber(result.extracted_entities.room_number);
      }
      if (result.extracted_entities.building_code && buildings.length > 0) {
        const match = buildings.find(b => b.code === result.extracted_entities.building_code);
        if (match) setBuildingId(match.id);
      }
      if (!title) {
        const roomText = result.extracted_entities.room_number ? `Room ${result.extracted_entities.room_number}` : 'Facility';
        setTitle(`${result.category.charAt(0).toUpperCase() + result.category.slice(1)} Hazard: ${roomText}`);
      }
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectSample = (sample: string) => {
    setDescription(sample);
    setTitle('');
    handleAnalyze(sample);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a description.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const activeUser = getActiveUser();
      const payload = {
        title: title || `${category.charAt(0).toUpperCase() + category.slice(1)} Incident Report`,
        description: description,
        category: category,
        severity: severity,
        building_id: buildingId || (buildings[0]?.id ?? null),
        room_number: roomNumber || null,
        reporter_name: activeUser.name,
        reporter_email: activeUser.email,
        channel: 'web_portal',
      };

      const res = await fetchWithAuth('/incidents', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setCreatedIncident(res);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400 mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Deterministic NLP Intake Engine</span>
            <span className="text-white/30">•</span>
            <span className="text-zinc-400">Layer 1 Zero-Cost</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Incident Ingestion & Classification
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Ingest raw dispatch notices or natural language reports. The local deterministic regex parser extracts location telemetry, infers criticality, and enforces immediate hazard isolation.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs text-zinc-400">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/[0.08]">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Local Lexer Online</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/[0.08]">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>&lt; 5ms Inference</span>
          </div>
        </div>
      </div>

      {/* Quick Test Scenarios */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Quick Test Scenarios</span>
          <span className="text-[11px] text-zinc-500">Click any preset to auto-parse and inspect live extraction</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {samplePrompts.map((p, idx) => {
            const Icon = p.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(p.text)}
                className={`flex items-start space-x-3 p-3 rounded-xl border transition-all text-left group ${p.color}`}
              >
                <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] group-hover:scale-105 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider opacity-75">{p.badge}</span>
                  </div>
                  <div className="text-xs font-medium text-zinc-200 truncate group-hover:text-white">
                    {p.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Success Modal / Banner */}
      {createdIncident && (
        <div className="p-5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 shadow-lg space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Incident Dispatched Successfully</h3>
                <p className="text-xs text-zinc-400">
                  Assigned reference tracking code: <span className="font-mono font-semibold text-emerald-300">{createdIncident.incident_number}</span>
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {createdIncident.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950/80 p-3.5 rounded-lg border border-white/[0.06] text-xs">
            <div>
              <span className="text-zinc-500 text-[11px] block">Severity Tier</span>
              <span className={`font-semibold capitalize ${
                createdIncident.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
              }`}>{createdIncident.severity}</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[11px] block">Trade Category</span>
              <span className="font-semibold capitalize text-blue-400">{createdIncident.category}</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[11px] block">Response Target SLA</span>
              <span className="font-medium text-zinc-200">
                {new Date(createdIncident.response_due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 text-[11px] block">Resolution Target</span>
              <span className="font-medium text-zinc-200">
                {new Date(createdIncident.resolution_due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => router.push(`/incidents?focus=${createdIncident.id}`)}
              className="text-xs font-medium px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <span>Inspect Incident Record</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => router.push('/work-orders')}
              className="text-xs font-medium px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-white/[0.08] transition-colors"
            >
              Open Work Order Queue
            </button>
            <button
              onClick={() => {
                setCreatedIncident(null);
                setDescription('');
                setAnalysis(null);
                setTitle('');
              }}
              className="text-xs text-zinc-400 hover:text-white px-3 py-2 transition-colors ml-auto"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Natural Language Input & Overrides */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card-glass p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 flex items-center space-x-2">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Unstructured Freeform Narrative</span>
              </label>
              <button
                type="button"
                onClick={() => handleAnalyze()}
                disabled={analyzing || !description.trim()}
                className="inline-flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors disabled:opacity-40"
              >
                <RefreshCw className={`w-3 h-3 ${analyzing ? 'animate-spin' : ''}`} />
                <span>{analyzing ? 'Extracting...' : 'Re-parse Entities'}</span>
              </button>
            </div>

            <div className="relative">
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe campus disruption or safety issue (e.g. Tech Park room 204 electrical panel sparking, smoke visible, exam scheduled at 2pm)..."
                className="w-full bg-zinc-950/70 border border-white/[0.08] rounded-xl p-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-all font-sans leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-zinc-500 flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                <span>Deterministic token matching against campus room directory</span>
              </span>
              <button
                type="button"
                onClick={() => handleAnalyze()}
                disabled={analyzing || !description.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/[0.1] text-zinc-200 text-xs font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-40"
              >
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>Parse Live</span>
              </button>
            </div>
          </div>

          {/* Structured Parameters & Overrides */}
          <form onSubmit={handleSubmit} className="card-glass p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-xs font-semibold text-zinc-300">
                Dispatch Target & Manual Overrides
              </h3>
              <span className="text-[11px] text-zinc-500">Auto-filled from parser</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Incident Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., Electrical Hazard: Room 204"
                className="w-full bg-zinc-950/70 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500/60 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Trade Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-950/70 border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500/60 transition-all"
                >
                  <option value="electrical">Electrical</option>
                  <option value="hvac">HVAC / Climate</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="it">IT & Networking</option>
                  <option value="safety">Safety & Hazard</option>
                  <option value="facilities">General Facilities</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Severity Priority</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-zinc-950/70 border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500/60 transition-all"
                >
                  <option value="critical">Critical (Immediate Isolation Hazard)</option>
                  <option value="high">High (Academic Disruption / Exam)</option>
                  <option value="medium">Medium (Standard Maintenance)</option>
                  <option value="low">Low (Minor / Deferred)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Target Facility</label>
                <select
                  value={buildingId}
                  onChange={(e) => setBuildingId(e.target.value)}
                  className="w-full bg-zinc-950/70 border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500/60 transition-all"
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} — {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Room Designation</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 204 or TP-204"
                  className="w-full bg-zinc-950/70 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500/60 transition-all font-mono"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !description.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium text-xs transition-all flex items-center justify-center space-x-2 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Dispatching Incident Record...' : 'Confirm & Dispatch Work Order'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Real-Time Parser Inspection HUD */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card-glass p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-white">
                  Parser Inspection HUD
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Layer 1 Deterministic
              </span>
            </div>

            {analyzing ? (
              <div className="py-14 text-center text-zinc-400 text-xs space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-400" />
                <p>Matching token patterns & campus ontology...</p>
              </div>
            ) : analysis ? (
              <div className="space-y-4 text-xs">
                {/* Confidence & Severity Header */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-950/70 border border-white/[0.06]">
                  <div>
                    <span className="text-[11px] text-zinc-500 block">Classified Trade</span>
                    <span className="font-semibold text-white capitalize text-sm text-blue-400">
                      {analysis.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-zinc-500 block">Computed Criticality</span>
                    <span className={`font-semibold capitalize text-sm ${
                      analysis.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      {analysis.severity}
                    </span>
                  </div>
                </div>

                {/* Safety Hazard Warning */}
                {(analysis.extracted_entities.has_sparks || analysis.extracted_entities.is_safety_hazard) && (
                  <div className="p-3.5 bg-rose-950/30 border border-rose-500/30 rounded-xl text-rose-300 flex items-start space-x-2.5">
                    <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-white text-xs">Electrical Safety Hazard Flagged</span>
                      <span className="text-[11px] text-rose-200/90 leading-relaxed block mt-0.5">
                        Active sparking or thermal hazard recognized. Triggers mandatory high-voltage lockout protocol before facility entry.
                      </span>
                    </div>
                  </div>
                )}

                {/* Entity Table */}
                <div className="bg-zinc-950/70 rounded-xl border border-white/[0.06] divide-y divide-white/[0.04] text-xs">
                  <div className="p-2.5 px-3 flex justify-between items-center">
                    <span className="text-zinc-400">Building Match:</span>
                    <span className="text-zinc-100 font-medium font-mono">
                      {analysis.extracted_entities.building_code || 'Unspecified'}
                    </span>
                  </div>
                  <div className="p-2.5 px-3 flex justify-between items-center">
                    <span className="text-zinc-400">Room Location:</span>
                    <span className="text-zinc-100 font-medium font-mono">
                      {analysis.extracted_entities.room_number || 'Unspecified'}
                    </span>
                  </div>
                  <div className="p-2.5 px-3 flex justify-between items-center">
                    <span className="text-zinc-400">Asset / Equipment:</span>
                    <span className="text-zinc-100 font-medium">
                      {analysis.extracted_entities.equipment_type || 'Unspecified'}
                    </span>
                  </div>
                  <div className="p-2.5 px-3 flex justify-between items-center">
                    <span className="text-zinc-400">Time Constraints:</span>
                    <span className="text-amber-300 font-medium">
                      {analysis.extracted_entities.time_mentions.length > 0 
                        ? analysis.extracted_entities.time_mentions.join(', ')
                        : 'None Detected'}
                    </span>
                  </div>
                </div>

                {/* Clarification Questions (if any) */}
                {analysis.clarification_questions.length > 0 && (
                  <div className="p-3.5 bg-blue-950/20 border border-blue-500/20 rounded-xl space-y-1.5">
                    <span className="font-medium text-blue-300 flex items-center space-x-1.5 text-xs">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                      <span>Missing Telemetry Prompts:</span>
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-zinc-300 text-[11px] pl-1">
                      {analysis.clarification_questions.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Explanation text */}
                <div className="p-3 rounded-xl bg-zinc-950/50 border border-white/[0.04] text-zinc-400 text-[11px] leading-relaxed">
                  <span className="text-zinc-500 font-medium block mb-0.5">Classification Logic:</span>
                  <p>{analysis.explanation}</p>
                </div>
              </div>
            ) : (
              <div className="py-14 text-center text-zinc-500 text-xs space-y-2">
                <Cpu className="w-7 h-7 mx-auto text-zinc-700" />
                <p className="text-zinc-400">Awaiting input stream</p>
                <p className="text-[11px] text-zinc-600">Enter text or select a scenario preset to evaluate extraction.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
