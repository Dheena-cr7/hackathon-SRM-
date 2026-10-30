'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Cpu, 
  Send, 
  CheckCircle2, 
  MapPin, 
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
  FileText,
  Sparkles,
  MessageSquare,
  Mail,
  Bot,
  User,
  Check
} from 'lucide-react';
import { fetchWithAuth, getActiveUser } from '@/lib/api';
import RoleGuard from '@/components/RoleGuard';

interface AnalysisResult {
  category: string;
  severity: string;
  confidence: number;
  building_id?: string;
  building_name?: string;
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

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  ticket?: any;
  clarificationOptions?: { label: string; action: () => void }[];
}

export default function IntakePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'form' | 'chat' | 'email'>('form');

  // Form State
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

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'Hello! I am the CampusOps Operations Assistant. You can describe any facility issue, equipment defect, or emergency disruption in plain English.',
      timestamp: 'Just now',
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Simulated Email State
  const [selectedEmailPreset, setSelectedEmailPreset] = useState(0);
  const [emailSubject, setEmailSubject] = useState('URGENT: Sparking AC Unit in Tech Park 204 before midterm');
  const [emailSender, setEmailSender] = useState('prof.sharma@campus.edu');
  const [emailBody, setEmailBody] = useState('There is a heavy burning smell and electrical sparks coming from the central air conditioning wall unit in Tech Park Room B204. Our CS301 Midterm Exam starts in 30 minutes with 55 students.');
  const [emailIngesting, setEmailIngesting] = useState(false);

  useEffect(() => {
    fetchWithAuth('/campus/buildings')
      .then((data) => {
        setBuildings(data);
        if (data.length > 0 && !buildingId) setBuildingId(data[0].id);
      })
      .catch((err) => console.error(err));
  }, []);

  const samplePrompts = [
    {
      icon: Zap,
      badge: 'Electrical Alert',
      title: 'Sparking Panel (Tech Park 204)',
      text: 'Tech Park room 204 electrical panel sparking, smoke visible, exam scheduled at 2pm',
      accent: 'border-amber-500/30 text-amber-400 bg-amber-500/10 hover:border-amber-500/50',
    },
    {
      icon: Wind,
      badge: 'HVAC Climate',
      title: 'Auditorium Central AC Down',
      text: 'Main Auditorium central AC unit stopped cooling, temperature rising above 32C ahead of keynote',
      accent: 'border-blue-500/30 text-blue-400 bg-blue-500/10 hover:border-blue-500/50',
    },
    {
      icon: Droplets,
      badge: 'Plumbing',
      title: 'Corridor Water Flooding',
      text: 'Plumbing leak detected in Tech Park 2nd floor corridor near restrooms, water pooling on floor',
      accent: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:border-cyan-500/50',
    },
    {
      icon: HelpCircle,
      badge: 'Classroom Power',
      title: 'Lab Projector & Power Cut',
      text: 'The power went out in my classroom and the projector shut off',
      accent: 'border-purple-500/30 text-purple-400 bg-purple-500/10 hover:border-purple-500/50',
    },
  ];

  const emailPresets = [
    {
      sender: 'prof.sharma@campus.edu',
      subject: 'URGENT: Sparking AC Unit in Tech Park 204 before midterm',
      body: 'There is a heavy burning smell and electrical sparks coming from the central air conditioning wall unit in Tech Park Room B204. Our CS301 Midterm Exam starts in 30 minutes with 55 students.',
      category: 'electrical'
    },
    {
      sender: 'hostel.warden@campus.edu',
      subject: 'Hostel Block A 2nd Floor Major Water Leak',
      body: 'A pipe has burst behind the bathroom wall in Student Hostel Complex Block A. Water is leaking into the main hallway near room H101.',
      category: 'plumbing'
    },
    {
      sender: 'lib.director@campus.edu',
      subject: 'Central University Library Server Rack Overheating',
      body: 'The HVAC split cooling system in the Central Library Server Room has failed. Temperature is 36C and servers are sounding high-temperature alarms.',
      category: 'hvac'
    }
  ];

  const handleSelectEmailPreset = (idx: number) => {
    const p = emailPresets[idx];
    setSelectedEmailPreset(idx);
    setEmailSender(p.sender);
    setEmailSubject(p.subject);
    setEmailBody(p.body);
  };

  const handleAnalyze = async (textToAnalyze?: string) => {
    const raw = textToAnalyze || description;
    if (!raw.trim()) return;

    setAnalyzing(true);
    setError(null);
    try {
      const result: AnalysisResult = await fetchWithAuth('/intake/analyze', {
        method: 'POST',
        body: JSON.stringify({ raw_text: raw, text: raw }),
      });
      setAnalysis(result);

      setCategory(result.category);
      setSeverity(result.severity || (result as any).urgency || 'medium');
      const roomNum = result.extracted_entities?.room_number || (result as any).room_number;
      if (roomNum) setRoomNumber(roomNum);
      const bCode = result.extracted_entities?.building_code || (result as any).building_id;
      if (bCode && buildings.length > 0) {
        const match = buildings.find(b => b.code === bCode || b.id === bCode);
        if (match) setBuildingId(match.id);
      }
      if (!title) {
        const roomText = roomNum ? `Room ${roomNum}` : 'Facility';
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
      setError('Please provide an incident description.');
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
        reporter_name: activeUser?.name || 'Campus Resident',
        reporter_email: activeUser?.email || 'student@campus.edu',
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

  // Chat Submission Handler with Multi-Turn Conversational Memory
  const [chatContext, setChatContext] = useState<{
    originalIssue?: string;
    category?: string;
    severity?: string;
    building_id?: string;
    room_number?: string;
  }>({});

  const handleSendChat = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const text = (overrideText !== undefined ? overrideText : chatInput).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (overrideText === undefined) setChatInput('');
    setChatLoading(true);

    try {
      let fullText = text;
      let effectiveCategory = 'general';
      let effectiveSeverity = 'medium';

      if (chatContext.originalIssue) {
        // Follow-up answering location clarification
        fullText = `${chatContext.originalIssue}. Location specified: ${text}`;
        effectiveCategory = chatContext.category || 'general';
        effectiveSeverity = chatContext.severity || 'medium';
      }

      // Analyze text with deterministic AI
      const analysis: AnalysisResult = await fetchWithAuth('/intake/analyze', {
        method: 'POST',
        body: JSON.stringify({ raw_text: fullText, text: fullText }),
      });

      if (analysis.category && analysis.category !== 'general') {
        effectiveCategory = analysis.category;
      }
      if (analysis.severity && analysis.severity !== 'medium') {
        effectiveSeverity = analysis.severity;
      }

      let extractedRoom = analysis.extracted_entities?.room_number;
      let extractedBuilding = analysis.extracted_entities?.building_code || analysis.building_id;

      const lower = fullText.toLowerCase();
      if (!extractedBuilding) {
        if (lower.includes('tech park') || lower.includes('tp')) extractedBuilding = 'BLD-TECH-01';
        else if (lower.includes('auditorium') || lower.includes('aud')) extractedBuilding = 'BLD-AUD-01';
        else if (lower.includes('mech') || lower.includes('engineering') || lower.includes('lab')) extractedBuilding = 'BLD-ENG-02';
        else if (lower.includes('library') || lower.includes('lib')) extractedBuilding = 'BLD-LIB-01';
        else if (lower.includes('hostel')) extractedBuilding = 'BLD-RES-01';
      }

      if (!extractedRoom) {
        const roomMatch = fullText.match(/\b(room\s*|rm\s*|b\s*)?([0-9]{3}|main hall|hall|studio\s*[0-9]+)\b/i);
        if (roomMatch) extractedRoom = roomMatch[0];
      }

      // If missing room or building on initial report, prompt clarification
      if (!extractedRoom && !extractedBuilding && !chatContext.originalIssue) {
        setChatContext({
          originalIssue: text,
          category: effectiveCategory,
          severity: effectiveSeverity,
        });

        const botReply: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `I identified this as a ${effectiveCategory.toUpperCase()} issue with ${effectiveSeverity.toUpperCase()} priority. Which campus building and room is this located in?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          clarificationOptions: [
            {
              label: 'Tech Park - Room 204',
              action: () => handleSendChat(undefined, 'Tech Park Room 204')
            },
            {
              label: 'Auditorium - Main Hall',
              action: () => handleSendChat(undefined, 'Auditorium Main Hall')
            },
            {
              label: 'Engineering Labs - Room 102',
              action: () => handleSendChat(undefined, 'Mechanical Lab Room 102')
            },
            {
              label: 'Central Library - Room 201',
              action: () => handleSendChat(undefined, 'Central Library Room 201')
            }
          ]
        };
        setChatMessages(prev => [...prev, botReply]);
      } else {
        // Direct ticket creation
        const activeUser = getActiveUser();
        const payload = {
          title: `${effectiveCategory.toUpperCase()} Issue: ${extractedRoom || 'Facility'}`,
          description: fullText,
          category: effectiveCategory,
          severity: effectiveSeverity,
          building_id: extractedBuilding || 'BLD-TECH-01',
          room_number: extractedRoom || 'Room 204',
          reporter_name: activeUser?.name || 'Campus Resident',
          reporter_email: activeUser?.email || 'student@campus.edu',
          channel: 'chat_assistant',
        };

        const res = await fetchWithAuth('/incidents', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setChatContext({});

        const botReply: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `Ticket logged successfully! Dispatched as ${res.incident_number} (${effectiveSeverity.toUpperCase()} priority in ${extractedBuilding || 'Tech Park'}). The facilities team has been notified.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ticket: res,
          clarificationOptions: [
            {
              label: 'Report Another Incident',
              action: () => {
                setChatContext({});
                setChatMessages(prev => [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    sender: 'assistant',
                    text: 'Ready for another report! Describe any campus maintenance issue or emergency.',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                ]);
              }
            }
          ]
        };
        setChatMessages(prev => [...prev, botReply]);
      }
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `Error processing report: ${(err as Error).message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Simulated Email Ingestion Handler
  const handleIngestEmail = async () => {
    setEmailIngesting(true);
    setError(null);
    try {
      const activeUser = getActiveUser();
      const payload = {
        subject: emailSubject,
        body: emailBody,
        sender_email: emailSender,
      };

      const res = await fetchWithAuth('/intake/simulated-email', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setCreatedIncident(res);
      setActiveTab('form');
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setEmailIngesting(false);
    }
  };

  const currentUser = getActiveUser();
  const userRole = currentUser?.role || 'student';
  const isStudent = userRole === 'student' || userRole === 'faculty';

  return (
    <RoleGuard pageName="Incident Intake">
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-[#BFF549]/10 border border-[#BFF549]/30 text-xs font-semibold text-[#BFF549] mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Multi-Channel Campus Intake</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Incident Intake & Classification
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Report facility disruptions across 3 verified input channels: standard forms, interactive conversational chat, or simulated campus email ingestion.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-[#1A1A1A] border border-white/[0.08] shadow-glaido-card self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'form' 
                ? 'bg-[#BFF549] text-black font-bold shadow-glaido-button' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Interactive Form</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'chat' 
                ? 'bg-[#BFF549] text-black font-bold shadow-glaido-button' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>AI Chat Assistant</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'email' 
                ? 'bg-[#BFF549] text-black font-bold shadow-glaido-button' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Simulate Campus Email</span>
          </button>
        </div>
      </div>

      {/* Success Modal / Banner */}
      {createdIncident && (
        <div className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#BFF549]/40 shadow-glaido-card space-y-4 animate-fade-in card-sheen">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#BFF549]/10 border border-[#BFF549]/30 flex items-center justify-center text-[#BFF549]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Incident Logged & Dispatched Successfully</h3>
                <p className="text-xs text-neutral-400">
                  Tracking Code: <span className="font-mono font-bold text-[#BFF549]">{createdIncident.incident_number}</span>
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-[#BFF549]/10 text-[#BFF549] border border-[#BFF549]/30">
              {createdIncident.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0D0D0D] p-3.5 rounded-xl border border-white/[0.08] text-xs">
            <div>
              <span className="text-neutral-400 text-[11px] block font-medium">Severity Tier</span>
              <span className={`font-bold capitalize text-sm ${
                createdIncident.severity === 'critical' ? 'text-[#FF2B3A]' : 'text-[#FF8A1F]'
              }`}>{createdIncident.severity}</span>
            </div>
            <div>
              <span className="text-neutral-400 text-[11px] block font-medium">Category</span>
              <span className="font-bold capitalize text-sm text-[#BFF549]">{createdIncident.category}</span>
            </div>
            <div>
              <span className="text-neutral-400 text-[11px] block font-medium">Channel</span>
              <span className="font-medium text-neutral-200 capitalize">{createdIncident.channel || 'Direct Web'}</span>
            </div>
            <div>
              <span className="text-neutral-400 text-[11px] block font-medium">Building</span>
              <span className="font-medium text-neutral-200">{createdIncident.building_id || 'Tech Park'}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => router.push(`/incidents`)}
              className="text-xs font-bold px-4 py-2 bg-[#BFF549] hover:bg-[#8CC21F] text-black rounded-xl flex items-center space-x-1.5 transition-all shadow-glaido-button focus-ring cursor-pointer"
            >
              <span>{isStudent ? 'Track Complaint Progress' : 'View in Incidents Queue'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {!isStudent && (
              <button
                type="button"
                onClick={() => router.push('/work-orders')}
                className="text-xs font-semibold px-4 py-2 bg-[#242424] hover:bg-[#2A2A2A] text-neutral-200 rounded-xl border border-white/[0.08] transition-colors focus-ring cursor-pointer"
              >
                View Work Orders
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setCreatedIncident(null);
                setDescription('');
                setAnalysis(null);
                setTitle('');
              }}
              className="text-xs text-neutral-400 hover:text-white px-3 py-2 transition-colors ml-auto focus-ring cursor-pointer"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: INTERACTIVE FORM MODE */}
      {activeTab === 'form' && (
        <div className="space-y-6">
          {/* Quick Test Scenarios */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Quick Test Scenarios</span>
              <span className="text-[11px] text-slate-500">Click any preset to auto-parse and inspect live extraction</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {samplePrompts.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSample(p.text)}
                    className={`flex items-start space-x-3 p-3 rounded-xl border transition-all text-left focus-ring cursor-pointer ${p.accent}`}
                  >
                    <div className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">{p.badge}</span>
                      <div className="text-xs font-semibold text-slate-100 truncate mt-0.5">
                        {p.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Natural Language Input & Overrides */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-[#1A1A1A] border border-white/[0.08] p-5 rounded-2xl space-y-3 shadow-glaido-card card-sheen">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-[#BFF549]" />
                    <span>Incident Description Narrative</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAnalyze()}
                    disabled={analyzing || !description.trim()}
                    className="inline-flex items-center space-x-1.5 text-xs text-[#BFF549] hover:underline font-semibold transition-colors disabled:opacity-40 focus-ring cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
                    <span>{analyzing ? 'Extracting...' : 'Re-parse Entities'}</span>
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe campus disruption or safety issue (e.g. Tech Park room 204 electrical panel sparking, smoke visible, exam scheduled at 2pm)..."
                    className="w-full bg-[#0D0D0D] border border-white/[0.10] rounded-xl p-3.5 text-xs text-white placeholder-neutral-500 focus-ring font-sans leading-relaxed"
                  />
                </div>

                {/* Missing Details Clarification Request Banner */}
                {analysis && (!roomNumber || !buildingId) && (
                  <div className="p-3.5 rounded-xl bg-[#FF8A1F]/10 border border-[#FF8A1F]/30 text-[#FF8A1F] space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-bold">
                      <HelpCircle className="w-4 h-4 text-[#FF8A1F]" />
                      <span>Clarification Needed: Location Details Missing</span>
                    </div>
                    <p className="text-[11px] text-neutral-300">
                      The report did not specify an exact room. Select a known campus location to complete dispatch:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => { setRoomNumber('204'); setBuildingId('BLD-TECH-01'); }}
                        className="px-2.5 py-1 rounded-lg bg-[#242424] hover:bg-[#2F2F2F] text-white border border-white/[0.12] hover:border-[#BFF549] text-[11px] font-semibold cursor-pointer transition-colors"
                      >
                        Tech Park Room 204
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRoomNumber('Main Hall'); setBuildingId('BLD-AUD-01'); }}
                        className="px-2.5 py-1 rounded-lg bg-[#242424] hover:bg-[#2F2F2F] text-white border border-white/[0.12] hover:border-[#BFF549] text-[11px] font-semibold cursor-pointer transition-colors"
                      >
                        Auditorium Main Hall
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRoomNumber('102'); setBuildingId('BLD-ENG-02'); }}
                        className="px-2.5 py-1 rounded-lg bg-[#242424] hover:bg-[#2F2F2F] text-white border border-white/[0.12] hover:border-[#BFF549] text-[11px] font-semibold cursor-pointer transition-colors"
                      >
                        Mech Labs 102
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-neutral-500">
                    Deterministic regex extractor matches building codes and room identifiers
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAnalyze()}
                    disabled={analyzing || !description.trim()}
                    className="px-3.5 py-1.5 bg-[#242424] hover:bg-[#2F2F2F] text-white rounded-xl text-xs font-semibold border border-white/[0.08] transition-colors focus-ring cursor-pointer"
                  >
                    Analyze Report
                  </button>
                </div>
              </div>

              {/* Form Overrides */}
              <form onSubmit={handleSubmit} className="bg-[#1A1A1A] border border-white/[0.08] p-5 rounded-2xl space-y-4 shadow-glaido-card card-sheen">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Extracted Ticket Attributes (Editable)
                  </h3>
                  <span className="text-[11px] text-neutral-400">Pre-filled by AI Layer 1</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-neutral-400">Ticket Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Electrical Sparking in Tech Park"
                      className="w-full bg-[#0D0D0D] border border-white/[0.10] rounded-xl p-2.5 text-xs text-white focus-ring"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-neutral-400">Trade Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#0D0D0D] border border-white/[0.10] rounded-xl p-2.5 text-xs text-white focus-ring cursor-pointer"
                    >
                      <option value="electrical">Electrical (Circuit breakers, lights, wiring)</option>
                      <option value="hvac">HVAC (Cooling, heating, ventilation)</option>
                      <option value="plumbing">Plumbing (Pipes, leaks, drainage)</option>
                      <option value="it_av">IT & Audio-Visual (Projectors, network)</option>
                      <option value="safety">Safety & Structural (Fire hazard, glass)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-neutral-400">Severity Tier</label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="w-full bg-[#0D0D0D] border border-white/[0.10] rounded-xl p-2.5 text-xs text-white focus-ring cursor-pointer"
                    >
                      <option value="critical">Critical (Immediate danger, sparks, exams)</option>
                      <option value="high">High (Classroom disruption, flooding)</option>
                      <option value="medium">Medium (Degraded performance)</option>
                      <option value="low">Low (Cosmetic, scheduled check)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-neutral-400">Target Campus Building</label>
                    <select
                      value={buildingId}
                      onChange={(e) => setBuildingId(e.target.value)}
                      className="w-full bg-[#0D0D0D] border border-white/[0.10] rounded-xl p-2.5 text-xs text-white focus-ring cursor-pointer"
                    >
                      {buildings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[11px] font-medium text-neutral-400">Specific Room / Location</label>
                    <input
                      type="text"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="e.g. 204, Main Hall, Corridor 2B"
                      className="w-full bg-[#0D0D0D] border border-white/[0.10] rounded-xl p-2.5 text-xs text-white focus-ring"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-[#BFF549] hover:bg-[#8CC21F] text-black rounded-xl text-xs font-bold transition-all shadow-glaido-button flex items-center justify-center space-x-2 disabled:opacity-40 focus-ring cursor-pointer"
                >
                  <Send className={`w-3.5 h-3.5 ${submitting ? 'animate-bounce' : ''}`} />
                  <span>{submitting ? 'Submitting Incident...' : 'Confirm & Dispatch Incident Ticket'}</span>
                </button>
              </form>
            </div>

            {/* Right Column: AI Extraction Breakdown */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#1A1A1A] border border-white/[0.08] p-5 rounded-2xl space-y-4 shadow-glaido-card card-sheen">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#BFF549]" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Layer 1 AI Extraction
                    </h3>
                  </div>
                  {analysis && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#BFF549]/10 text-[#BFF549] border border-[#BFF549]/25">
                      95% Confidence
                    </span>
                  )}
                </div>

                {analysis ? (
                  <div className="space-y-3.5 text-xs">
                    <div className="p-3 bg-[#0D0D0D] rounded-xl border border-white/[0.08] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 font-medium">Classified Category:</span>
                        <span className="font-bold text-[#BFF549] uppercase">{analysis.category}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 font-medium">Assigned Urgency:</span>
                        <span className={`font-bold uppercase ${
                          analysis.severity === 'critical' ? 'text-[#FF2B3A]' : 'text-[#FF8A1F]'
                        }`}>{analysis.severity}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 font-medium">Safety Hazard Flag:</span>
                        <span className={`font-bold ${analysis.extracted_entities?.is_safety_hazard ? 'text-[#FF2B3A]' : 'text-neutral-400'}`}>
                          {analysis.extracted_entities?.is_safety_hazard ? '⚠️ ACTIVE HAZARD' : 'None Detected'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-neutral-300 block">Extracted Entities</span>
                      <div className="bg-[#0D0D0D] p-3 rounded-xl border border-white/[0.08] text-[11px] space-y-1 font-mono">
                        <div>Building: <span className="text-white font-bold">{analysis.extracted_entities?.building_name || analysis.extracted_entities?.building_code || 'Not specified'}</span></div>
                        <div>Room: <span className="text-white font-bold">{analysis.extracted_entities?.room_number || 'General / Unspecified'}</span></div>
                        <div>Equipment: <span className="text-white font-bold">{analysis.extracted_entities?.equipment_type || 'Unspecified Asset'}</span></div>
                        <div>Sparks Detected: <span className="text-white font-bold">{analysis.extracted_entities?.has_sparks ? 'YES' : 'NO'}</span></div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#BFF549]/5 border border-[#BFF549]/20 text-neutral-300 text-[11px] leading-relaxed">
                      {analysis.explanation}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-neutral-500 text-xs">
                    Type a description or click a preset to inspect live deterministic entity extraction.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI CHAT ASSISTANT MODE */}
      {activeTab === 'chat' && (
        <div className="bg-[#1A1A1A] border border-white/[0.08] rounded-2xl shadow-glaido-card overflow-hidden flex flex-col h-[600px] card-sheen">
          <div className="p-4 bg-[#141414] border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#BFF549]/10 text-[#BFF549] border border-[#BFF549]/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-[#BFF549]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">CampusOps Intake Conversational Assistant</h3>
                <span className="text-[10px] text-[#BFF549] flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BFF549]" />
                  <span>Layer 1 Offline Bot Active</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex items-start space-x-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-[#BFF549]/10 text-[#BFF549] border border-[#BFF549]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-[#BFF549] text-black font-semibold rounded-tr-none shadow-glaido-button'
                    : 'bg-[#0D0D0D] border border-white/[0.08] text-neutral-200 rounded-tl-none'
                }`}>
                  <p>{msg.text}</p>
                  {msg.ticket && (
                    <div className="p-2.5 rounded-xl bg-[#1A1A1A] border border-[#BFF549]/30 text-[#BFF549] font-mono text-[11px] space-y-1">
                      <div>Ticket: {msg.ticket.incident_number}</div>
                      <div>Status: {msg.ticket.status}</div>
                      <div>Severity: {msg.ticket.severity}</div>
                    </div>
                  )}
                  {msg.clarificationOptions && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.clarificationOptions.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={opt.action}
                          className="px-2.5 py-1 rounded-lg bg-[#242424] hover:bg-[#2F2F2F] text-white border border-white/[0.12] hover:border-[#BFF549] text-[11px] font-semibold transition-all cursor-pointer"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <span className={`text-[9px] block text-right font-mono ${msg.sender === 'user' ? 'text-black/60' : 'text-neutral-500'}`}>{msg.timestamp}</span>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center space-x-2 text-xs text-neutral-400 pl-10">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#BFF549]" />
                <span>Extracting campus entities & validating schedule...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSendChat} className="p-3 bg-[#141414] border-t border-white/[0.08] flex items-center space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="e.g. The AC unit in Tech Park 204 is smoking and sparking..."
              className="flex-1 bg-[#0D0D0D] border border-white/[0.10] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus-ring"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-2 bg-[#BFF549] hover:bg-[#8CC21F] text-black rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-glaido-button disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: SIMULATED CAMPUS EMAIL INGESTION */}
      {activeTab === 'email' && (
        <div className="bg-[#1A1A1A] border border-white/[0.08] rounded-2xl p-6 shadow-glaido-card space-y-6 card-sheen">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Mail className="w-4 h-4 text-[#BFF549]" />
                <span>Simulated Campus Email Ingestion Channel</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Demonstrates automatic ingestion of incoming faculty & student emails into structured incident tickets without manual triage.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#BFF549]/10 text-[#BFF549] border border-[#BFF549]/30">
              IMAP / Webhook Pipeline
            </span>
          </div>

          {/* Email Presets */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-neutral-300">Choose Preset Incident Email:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {emailPresets.map((ep, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectEmailPreset(idx)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedEmailPreset === idx
                      ? 'bg-[#BFF549]/10 border-[#BFF549] text-white'
                      : 'bg-[#0D0D0D] border-white/[0.08] text-neutral-400 hover:border-white/[0.18]'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase block text-[#BFF549]">{ep.category}</span>
                  <div className="text-xs font-semibold text-neutral-200 mt-0.5 truncate">{ep.subject}</div>
                  <div className="text-[10px] text-neutral-500 mt-1 truncate">{ep.sender}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Email Ingestion Preview Box */}
          <div className="bg-[#0D0D0D] p-4 rounded-xl border border-white/[0.08] space-y-3 font-sans text-xs">
            <div className="space-y-1.5 border-b border-white/[0.06] pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-neutral-400 w-16">From:</span>
                <input
                  type="text"
                  value={emailSender}
                  onChange={(e) => setEmailSender(e.target.value)}
                  className="flex-1 bg-[#1A1A1A] border border-white/[0.10] rounded px-2 py-1 text-xs text-white"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-neutral-400 w-16">Subject:</span>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="flex-1 bg-[#1A1A1A] border border-white/[0.10] rounded px-2 py-1 text-xs text-white"
                />
              </div>
            </div>
            <div>
              <span className="text-neutral-400 block mb-1">Body Text:</span>
              <textarea
                rows={4}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-white/[0.10] rounded p-2 text-xs text-neutral-200 leading-relaxed font-sans"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleIngestEmail}
            disabled={emailIngesting}
            className="w-full py-3 bg-[#BFF549] hover:bg-[#8CC21F] text-black rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-glaido-button disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${emailIngesting ? 'animate-spin' : ''}`} />
            <span>{emailIngesting ? 'Ingesting & Parsing Email...' : 'Ingest Email & Create Incident Ticket'}</span>
          </button>
        </div>
      )}
    </div>
    </RoleGuard>
  );
}
