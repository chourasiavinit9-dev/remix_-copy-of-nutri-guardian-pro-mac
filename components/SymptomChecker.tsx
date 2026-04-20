import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Loader2, ShieldAlert, Pill, Stethoscope, ArrowRight, Activity, X, Info, HelpCircle, Mic, MicOff, Volume2, StopCircle, MessageSquareText, Sparkles, Brain, AlertCircle, CheckCircle2, ShieldCheck, HeartPulse, UserRound, ClipboardList, Settings, Lock, RefreshCw, AlertTriangle, ShieldX, RotateCcw, Languages, UserCheck } from 'lucide-react';
import { UserProfile, SymptomAnalysis } from '../types';
import { analyzeSymptoms } from '../geminiService';
import { BentoSkeleton, AudioVisualizer } from './Common';

interface SymptomCheckerProps {
  profile: UserProfile;
}

const SymptomChecker: React.FC<SymptomCheckerProps> = ({ profile }) => {
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SymptomAnalysis | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{ role: 'user' | 'assistant', text: string }[]>([]);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isInitializing, setIsInitializing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const transcriptionEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptionBufferRef = useRef({ user: '', model: '' });

  useEffect(() => {
    transcriptionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptions, currentTranscription]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setResult(null);
    setErrorMessage(null);
    try {
      const analysis = await analyzeSymptoms(symptoms, profile);
      setResult(analysis);
    } catch (err: any) {
      console.error("Symptom analysis failed", err);
      setErrorMessage(err?.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearLabData = () => {
    setResult(null);
    setSymptoms('');
    setTranscriptions([]);
  };

  const stopLiveSession = useCallback(() => {
    if (sessionRef.current) { sessionRef.current.close(); sessionRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close().catch(() => {}); audioContextRef.current = null; }
    if (outputAudioContextRef.current) { outputAudioContextRef.current.close().catch(() => {}); outputAudioContextRef.current = null; }
    setIsLiveActive(false); setIsAiSpeaking(false); setIsInitializing(false); nextStartTimeRef.current = 0;
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} }); sourcesRef.current.clear();
  }, []);

  const startLiveSession = async () => {
    setErrorMessage("Live Voice features are disabled in this deployment to prevent API Key exposure. The backend text clinical triage remains active.");
  };

  useEffect(() => { return () => stopLiveSession(); }, [stopLiveSession]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-700 pb-32">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isLiveMode ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {isLiveMode ? <Languages size={24} /> : <Stethoscope size={24} />}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Clinical Assistant</h2>
            <p className="text-slate-400 font-medium text-[10px] uppercase tracking-widest">
              {isLiveMode ? 'Hindi / Bengali / Tamil Voice Consult' : 'Diagnostic Lab Audit'}
            </p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
          <button onClick={() => { setIsLiveMode(false); stopLiveSession(); }} className={`flex-1 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isLiveMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
            Audit
          </button>
          <button onClick={() => setIsLiveMode(true)} className={`flex-1 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isLiveMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>
            Voice Consult
          </button>
        </div>
      </div>

      {!isLiveMode ? (
        <>
          <div className="bento-card p-10 bg-white shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3.5 bg-rose-50 rounded-2xl text-rose-600 shadow-inner"><Search size={28} /></div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Diagnostic Lab</h2>
                <p className="text-slate-400 font-medium text-xs mt-0.5">Symptom verification for {profile.chronicDisease}</p>
              </div>
            </div>
            <form onSubmit={handleAnalyze} className="space-y-6">
              <textarea
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-6 px-6 text-sm font-bold focus:bg-white focus:border-rose-200 transition-all placeholder:text-slate-300 shadow-inner min-h-[140px] resize-none"
                placeholder="Describe current symptoms..."
                value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
              />
              <button type="submit" disabled={!symptoms.trim() || isAnalyzing} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 disabled:bg-slate-100 shadow-lg transition-all">
                {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                Run Clinical Analysis
              </button>
            </form>
            {errorMessage && !isAnalyzing && (
              <div className="mt-4 bg-rose-50 border border-rose-200 p-5 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
                <AlertCircle size={18} className="text-rose-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-black text-rose-900 mb-0.5">Analysis Error</p>
                  <p className="text-[11px] font-bold text-rose-700 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}
          </div>

          {isAnalyzing && (
            <div className="mt-8">
              <BentoSkeleton />
            </div>
          )}

          {result && (
            <div className="animate-in slide-in-from-bottom-6 duration-500 space-y-6">
              <div className="bento-card overflow-hidden border-none shadow-2xl bg-white p-10 space-y-8">
                <div className={`p-6 rounded-2xl text-white ${result.urgency === 'Emergency' ? 'bg-red-600' : result.urgency === 'High' ? 'bg-rose-500' : 'bg-slate-900'}`}>
                  <h3 className="text-2xl font-black mb-1">{result.possibleCondition}</h3>
                  <p className="text-[10px] uppercase font-black opacity-70 tracking-widest">Urgency: {result.urgency}</p>
                </div>
                
                <section>
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-4 flex items-center gap-2">
                    <Info size={16} /> Clinical Reasoning
                  </h4>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{result.explanation}"</p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section>
                    <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-4 flex items-center gap-2">
                      <Pill size={16} className="text-indigo-500" /> Medications
                    </h4>
                    <div className="space-y-3">
                      {result.suggestedMedication?.map((med, i) => (
                        <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                          <p className="text-xs font-black text-slate-900">{med.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold mt-1">{med.notes}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section>
                    <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-4 flex items-center gap-2">
                      <ShieldX size={16} className="text-rose-500" /> Strict Avoidance
                    </h4>
                    <div className="space-y-2">
                      {result.avoidanceProtocol.map((item, i) => (
                        <div key={i} className="flex gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                          <X size={12} className="text-rose-500 mt-0.5" />
                          <p className="text-[11px] font-black text-rose-900">{item}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="flex justify-center pt-8 border-t border-slate-100">
                  <button onClick={clearLabData} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors">
                    <RotateCcw size={14} /> Clear Analysis
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="bento-card p-10 bg-white shadow-2xl min-h-[500px] flex flex-col relative overflow-hidden">
             {!isLiveActive ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
                    <Languages size={44} />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Bilingual Voice Consult</h3>
                  <p className="text-slate-400 font-medium text-sm max-w-xs mb-12">Speak in English or Hindi (हिंदी) for a clinical triage relative to your {profile.chronicDisease}.</p>
                  <button onClick={startLiveSession} disabled={isInitializing} className="bg-emerald-600 text-white px-12 py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-4 hover:bg-emerald-700 shadow-xl transition-all">
                    {isInitializing ? <Loader2 size={20} className="animate-spin" /> : <Mic size={20} />}
                    {isInitializing ? 'Connecting Neural Link...' : 'Start Bilingual Consult'}
                  </button>
                </div>
             ) : (
                <div className="flex-1 flex flex-col h-full animate-in fade-in">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Neural Link Active</span>
                    </div>
                    <div className="flex-1 flex justify-center">
                      <AudioVisualizer isSpeaking={isAiSpeaking} />
                    </div>
                    <button onClick={stopLiveSession} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <StopCircle size={16} /> End Session
                    </button>
                  </div>
                  <div className="flex-1 bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 overflow-y-auto space-y-4 max-h-[350px] custom-scrollbar">
                    {transcriptions.map((t, i) => (
                      <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-[11px] font-bold leading-relaxed shadow-sm ${t.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-100'}`}>
                          <p className="opacity-50 text-[8px] uppercase tracking-widest mb-1">{t.role === 'user' ? 'Patient' : 'Neural Assistant'}</p>
                          {t.text}
                        </div>
                      </div>
                    ))}
                    <div ref={transcriptionEndRef} />
                  </div>
                </div>
             )}
             <Brain className="absolute -right-16 -bottom-16 text-emerald-500/5 rotate-12" size={320} />
           </div>
        </div>
      )}

      {/* PERSISTENT MEDICAL DISCLAIMER */}
      <div className="bg-white border-2 border-rose-100 p-8 rounded-[2.5rem] shadow-sm animate-in fade-in duration-1000">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shadow-inner shrink-0">
            <UserCheck size={24} />
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-black text-rose-900 uppercase tracking-widest">Mandatory Medical Protocol</h4>
            <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
              Nutri-Guardian Pro is an AI nutritional and triage audit tool. It does not provide medical diagnoses or treatment.
              <span className="text-rose-700 block mt-2">
                CRITICAL: You MUST consult with a <span className="underline font-black">Licensed Physician</span> or qualified healthcare professional before taking any clinical action, starting medications, or modifying your prescribed medical regimen.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymptomChecker;