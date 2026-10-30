'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  MapPin, 
  Layers, 
  Clock, 
  ShieldAlert, 
  RefreshCw,
  HelpCircle,
  Building,
  ArrowRight
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

  // Preset sample prompts
  const samplePrompts = [
    {
      label: '⚡ Scenario A: Sparking Panel (Room 204)',
      text: 'Tech Park room 204 electrical panel sparking, smoke visible, exam scheduled at 2pm',
    },
    {
      label: '❄️ Main Auditorium AC Outage',
      text: 'Main Auditorium central AC unit stopped cooling, temperature rising above 32C ahead of keynote',
    },
    {
      label: '💧 Tech Park Water Leak',
      text: 'Plumbing leak detected in Tech Park 2nd floor corridor near restrooms, water pooling on floor',
    },
    {
      label: '❓ Vague Report (Test Clarification)',
      text: 'The power went out in my classroom and the projector shut off',
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
        setTitle(`${result.category.toUpperCase()}: Issue in ${result.extracted_entities.room_number || 'Facility'}`);
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
        title: title || `${category.toUpperCase()} Incident Report`,
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-blue-900/60 border border-blue-700/50 text-xs font-medium text-blue-300 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Layer 1 Deterministic NLP Intake</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Intelligent Incident Intake
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Submit freeform text in natural language. Our offline deterministic AI engine extracts entities, computes severity, flags emergency isolation hazards, and routes work orders immediately.
        </p>
      </div>

      {/* Preset Chips */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Quick Test Scenarios
        </label>
        <div className="flex flex-wrap gap-2">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSample(p.text)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-blue-500 hover:bg-slate-800 transition-all text-left"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Created Incident Success Modal */}
      {createdIncident && (
        <div className="p-6 rounded-2xl bg-emerald-950/70 border border-emerald-600 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center space-x-3 text-emerald-400">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-white">Incident Successfully Dispatched</h3>
              <p className="text-xs text-emerald-300">
                Ticket Reference: <span className="font-mono font-bold text-white">{createdIncident.incident_number}</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-xl text-xs text-slate-300">
            <div>
              <span className="text-slate-500 block">Severity</span>
              <span className="font-semibold uppercase text-rose-400">{createdIncident.severity}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Category</span>
              <span className="font-semibold uppercase text-blue-400">{createdIncident.category}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Response Deadline</span>
              <span className="font-semibold text-slate-200">
                {new Date(createdIncident.response_due_at).toLocaleTimeString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Resolution Target</span>
              <span className="font-semibold text-slate-200">
                {new Date(createdIncident.resolution_due_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => router.push(`/incidents?focus=${createdIncident.id}`)}
              className="text-xs font-semibold px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center space-x-1.5"
            >
              <span>View Incident Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push('/work-orders')}
              className="text-xs font-semibold px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700"
            >
              Open Work Orders Queue
            </button>
            <button
              onClick={() => {
                setCreatedIncident(null);
                setDescription('');
                setAnalysis(null);
                setTitle('');
              }}
              className="text-xs text-slate-400 hover:text-white px-3 py-2"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      )}

      {/* Main Intake Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Natural-Language Input Box */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                <span>Natural-Language Description</span>
              </label>
              <button
                type="button"
                onClick={() => handleAnalyze()}
                disabled={analyzing || !description.trim()}
                className="inline-flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 font-medium disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
                <span>{analyzing ? 'Analyzing...' : 'Re-parse Entities'}</span>
              </button>
            </div>

            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue clearly (e.g., Tech Park room 204 electrical panel sparking, smoke visible, exam scheduled at 2pm)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                Layer 1 offline dictionary links building codes, rooms & hazard indicators
              </span>
              <button
                type="button"
                onClick={() => handleAnalyze()}
                disabled={analyzing || !description.trim()}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1 shadow-sm disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analyze Text</span>
              </button>
            </div>
          </div>

          {/* Structured Overrides */}
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
              Dispatch Parameters & Overrides
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Incident Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="electrical">Electrical</option>
                  <option value="hvac">HVAC / Cooling</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="it">IT & Network</option>
                  <option value="safety">Safety & Hazard</option>
                  <option value="facilities">General Facilities</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="critical">Critical (Immediate Hazard)</option>
                  <option value="high">High (Classroom / Facility Disruption)</option>
                  <option value="medium">Medium (Standard Maintenance)</option>
                  <option value="low">Low (Minor Non-disruptive)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target Building</label>
                <select
                  value={buildingId}
                  onChange={(e) => setBuildingId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} — {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Room / Location</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 204 or TP-204"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !description.trim()}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Dispatching Incident...' : 'Confirm & Dispatch Incident'}</span>
            </button>
          </form>
        </div>

        {/* Right: Real-Time Layer 1 NLP Analysis HUD */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  AI Entity Extraction HUD
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                Deterministic Layer 1
              </span>
            </div>

            {analyzing ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-400" />
                <p>Running local entity extraction and regex matching...</p>
              </div>
            ) : analysis ? (
              <div className="space-y-4 text-xs">
                {/* Confidence & Severity Header */}
                <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Classified Category</span>
                    <span className="font-bold text-white uppercase text-sm text-blue-400">
                      {analysis.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Computed Severity</span>
                    <span className={`font-bold uppercase text-sm ${
                      analysis.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      {analysis.severity}
                    </span>
                  </div>
                </div>

                {/* Safety Hazard Warning */}
                {(analysis.extracted_entities.has_sparks || analysis.extracted_entities.is_safety_hazard) && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg text-rose-300 flex items-start space-x-2">
                    <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <span className="font-bold block">Safety Hazard Flagged</span>
                      <span className="text-[11px] text-rose-300">
                        Sparks or emergency conditions detected. Requires immediate technician electrical isolation protocol before room access.
                      </span>
                    </div>
                  </div>
                )}

                {/* Entity Table */}
                <div className="bg-slate-950 rounded-lg border border-slate-800 divide-y divide-slate-800/80 font-mono text-[11px]">
                  <div className="p-2.5 flex justify-between">
                    <span className="text-slate-400">Building Code:</span>
                    <span className="text-white font-semibold">
                      {analysis.extracted_entities.building_code || 'Unspecified'}
                    </span>
                  </div>
                  <div className="p-2.5 flex justify-between">
                    <span className="text-slate-400">Room Number:</span>
                    <span className="text-white font-semibold">
                      {analysis.extracted_entities.room_number || 'Unspecified'}
                    </span>
                  </div>
                  <div className="p-2.5 flex justify-between">
                    <span className="text-slate-400">Equipment Type:</span>
                    <span className="text-white font-semibold">
                      {analysis.extracted_entities.equipment_type || 'Unspecified'}
                    </span>
                  </div>
                  <div className="p-2.5 flex justify-between">
                    <span className="text-slate-400">Time References:</span>
                    <span className="text-amber-300 font-semibold">
                      {analysis.extracted_entities.time_mentions.length > 0 
                        ? analysis.extracted_entities.time_mentions.join(', ')
                        : 'None'}
                    </span>
                  </div>
                </div>

                {/* Clarification Questions (if any) */}
                {analysis.clarification_questions.length > 0 && (
                  <div className="p-3 bg-blue-950/30 border border-blue-800/60 rounded-lg space-y-2">
                    <span className="font-semibold text-blue-300 flex items-center space-x-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                      <span>Clarification Recommended:</span>
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                      {analysis.clarification_questions.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Explanation text */}
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-slate-400 text-[11px]">
                  <span className="text-slate-500 font-bold block mb-1">Extraction Rationale:</span>
                  <p>{analysis.explanation}</p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-slate-600" />
                <p>Type an incident description or select a scenario chip above to view live deterministic entity extraction.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
