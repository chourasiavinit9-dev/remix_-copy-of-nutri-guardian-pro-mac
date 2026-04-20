
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Camera, AlertTriangle, Info, Speaker, Loader2, Database, 
  ArrowLeftRight, CheckCircle2, XCircle, ShieldCheck, Trophy, 
  Target, Zap, ChevronRight, Activity, HelpCircle, RefreshCw, 
  BookmarkPlus, Check, Sparkles, RefreshCcw, ArrowLeft, 
  ShieldAlert, Star, Upload, Scan, WifiOff, Key, Bookmark, 
  MapPin, Volume2, Beaker, Candy, Shield, FlaskConical, 
  Droplet, Pill, Box, Maximize, AlertCircle, Settings, X, 
  Files, Download, Flame, Search, Microscope, Thermometer, 
  Biohazard, Bell, Copy, RotateCcw 
} from 'lucide-react';
import { UserProfile, AnalysisResult, ComparisonResult, SavedComparison, IngredientInfo } from '../types';
import { analyzeProduct, compareProducts } from '../geminiService';

interface ScannerProps {
  profile: UserProfile;
  onConsume: (sodium: number, sugar: number, protein: number, vitamins: number, calories: number, name: string) => void;
  onSaveComparison: (comparison: any) => void;
}

const CATEGORY_MAP: Record<string, { icon: any, color: string, light: string, dark: string }> = {
  'Core Matrix': { icon: Box, color: 'text-slate-600', light: 'bg-slate-50', dark: 'bg-slate-900' },
  'Refined Sugars': { icon: Candy, color: 'text-amber-600', light: 'bg-amber-50', dark: 'bg-amber-900' },
  'Synthetic Sweeteners': { icon: Sparkles, color: 'text-purple-600', light: 'bg-purple-50', dark: 'bg-purple-900' },
  'Bio-Preservatives': { icon: Shield, color: 'text-rose-600', light: 'bg-rose-50', dark: 'bg-rose-900' },
  'Industrial Additives': { icon: FlaskConical, color: 'text-blue-600', light: 'bg-blue-50', dark: 'bg-blue-900' },
  'Essential Nutrients': { icon: Pill, color: 'text-emerald-600', light: 'bg-emerald-50', dark: 'bg-emerald-900' },
  'Clinical Triggers': { icon: Biohazard, color: 'text-red-600', light: 'bg-red-50', dark: 'bg-red-900' },
  'Other': { icon: Beaker, color: 'text-slate-400', light: 'bg-slate-50', dark: 'bg-slate-900' }
};

const StarRating: React.FC<{ rating: number; size?: number; label?: string }> = ({ rating, size = 12, label }) => (
  <div className="flex flex-col items-start gap-1">
    {label && <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</span>}
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <div key={s} className={`p-1 rounded-md ${s <= rating ? 'bg-amber-100 text-amber-500 shadow-sm' : 'bg-slate-100 text-slate-300'}`}>
          <Star size={size} className={s <= rating ? 'fill-amber-500' : ''} />
        </div>
      ))}
    </div>
  </div>
);

const IngredientItem: React.FC<{ 
  ingredient: IngredientInfo; 
  isRedFlag?: boolean; 
  flagReason?: string;
  severity?: 'CRITICAL' | 'CAUTION';
}> = ({ ingredient, isRedFlag, flagReason, severity }) => {
  const cat = CATEGORY_MAP[isRedFlag ? 'Clinical Triggers' : ingredient.category] || CATEGORY_MAP['Other'];
  const Icon = cat.icon;

  let borderClass = 'border-slate-100 hover:border-emerald-200';
  
  if (isRedFlag) {
    if (severity === 'CRITICAL') {
      borderClass = 'border-red-500 shadow-xl shadow-red-100 ring-2 ring-red-100';
    } else if (severity === 'CAUTION') {
      borderClass = 'border-amber-400 shadow-lg shadow-amber-50 ring-2 ring-amber-50';
    } else {
      borderClass = 'border-red-200 shadow-lg shadow-red-50';
    }
  }

  return (
    <div className={`flex gap-4 p-5 rounded-2xl bg-white border transition-all group relative overflow-hidden ${borderClass}`}>
      <div className={`p-3.5 rounded-xl h-fit shadow-inner ${cat.light} ${cat.color}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 space-y-1.5">
        <div className="flex justify-between items-center">
          <h5 className="text-sm font-black text-slate-900 leading-tight">{ingredient.name}</h5>
          {isRedFlag && (
            <span className={`flex items-center gap-1 text-[8px] font-black uppercase px-2 py-1 rounded-md tracking-widest border ${
              severity === 'CRITICAL' 
                ? 'bg-red-600 text-white border-red-700' 
                : severity === 'CAUTION'
                ? 'bg-amber-100 text-amber-700 border-amber-200'
                : 'bg-red-100 text-red-600 border-red-200'
            }`}>
              {severity === 'CRITICAL' ? <ShieldAlert size={10} /> : <AlertTriangle size={10} />}
              {severity || 'Clinical Trigger'}
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
          {isRedFlag ? flagReason : ingredient.description || 'Verified clinical profile not established.'}
        </p>
      </div>
    </div>
  );
};

const Scanner: React.FC<ScannerProps> = ({ profile, onConsume, onSaveComparison }) => {
  const [mode, setMode] = useState<'STANDBY' | 'CAMERA' | 'ANALYZING' | 'RESULT' | 'COMPARISON' | 'ERROR'>('STANDBY');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Initializing Vision Diagnostic...");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isCompareModeEnabled, setIsCompareModeEnabled] = useState(false);
  const [product1, setProduct1] = useState<AnalysisResult | null>(null);
  const [product2, setProduct2] = useState<AnalysisResult | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [isLogged, setIsLogged] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [ingredientFilter, setIngredientFilter] = useState('');
  const [error, setError] = useState<{ message: string; type: string; title: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'CAMERA' && !stream) {
      const startCamera = async () => {
        try {
          const s = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
          });
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.onloadedmetadata = () => videoRef.current?.play();
          }
        } catch (err: any) {
          setError({ title: "Sensor Access Error", message: "Unable to connect to camera sensor. Check permissions.", type: 'permission' });
          setMode('ERROR');
        }
      };
      startCamera();
    }
    return () => { if (stream) { stream.getTracks().forEach(track => track.stop()); setStream(null); } };
  }, [mode]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const b64 = canvas.toDataURL('image/jpeg', 0.85);
        setImage(b64);
        processImage(b64.split(',')[1]);
        if (stream) { stream.getTracks().forEach(track => track.stop()); setStream(null); }
      }
    }
  };

  const processImage = async (b64Data: string) => {
    setMode('ANALYZING');
    setStatusText(isCompareModeEnabled ? `Auditing Product ${product1 ? 'B' : 'A'}...` : "Auditing Clinical Safety...");
    try {
      const finalAnalysis = await analyzeProduct(b64Data, profile);
      
      // Handle non-food or offensive content error
      if (finalAnalysis.status === 'ERROR') {
        setError({ 
          title: "Audit Rejected", 
          message: finalAnalysis.medicalWarning || "The scanned item is not recognized as a food product or contains inappropriate content.", 
          type: 'validation' 
        });
        setMode('ERROR');
        return;
      }

      if (isCompareModeEnabled) {
        if (!product1) { 
          setProduct1(finalAnalysis); 
          setMode('STANDBY'); 
          setToast("Product A Audited. Scan Product B.");
        }
        else { 
          setProduct2(finalAnalysis); 
          setStatusText("Performing Comparative Neural Audit..."); 
          const comp = await compareProducts(product1, finalAnalysis, profile); 
          setComparison(comp); 
          setMode('COMPARISON'); 
        }
      } else { 
        setResult(finalAnalysis); 
        setMode('RESULT'); 
      }
    } catch (err: any) { 
      handleDiagnosticFailure(err); 
    }
  };

  const handleDiagnosticFailure = (err: any) => {
    console.error("Diagnostic failure:", err);
    setError({ title: "Audit Connection Error", message: "The neural laboratory could not complete the request. Please try again with a clearer image.", type: 'api' });
    setMode('ERROR');
  };

  const reset = () => {
    setImage(null); setResult(null); setError(null); setIsCompareModeEnabled(false);
    setProduct1(null); setProduct2(null); setComparison(null); setIsLogged(false); setIsSaved(false);
    setIngredientFilter(''); setMode('STANDBY');
  };

  const handleLogConsumption = () => {
    if (!result) return;
    onConsume(result.keyNutrients.sodium, result.keyNutrients.sugar, result.keyNutrients.protein, result.keyNutrients.vitamins, result.keyNutrients.calories, result.productName || 'Scan');
    setIsLogged(true);
    setToast("Product logged successfully.");
    setTimeout(reset, 1500);
  };

  const handleSaveComparison = () => {
    if (!comparison || !product1 || !product2) return;
    const savedData: SavedComparison = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      product1Name: product1.productName || 'Product A',
      product2Name: product2.productName || 'Product B',
      winner: comparison.betterChoice,
      reasoning: comparison.clinicalReasoning,
      product1Score: comparison.product1Score,
      product2Score: comparison.product2Score
    };
    onSaveComparison(savedData);
    setIsSaved(true);
    setToast("Comparison Lab Archived.");
  };

  const filteredIngredients = useMemo(() => {
    if (!result?.ingredientsBreakdown) return [];
    return result.ingredientsBreakdown.filter(ing => 
      ing.name.toLowerCase().includes(ingredientFilter.toLowerCase()) ||
      ing.category.toLowerCase().includes(ingredientFilter.toLowerCase())
    );
  }, [result?.ingredientsBreakdown, ingredientFilter]);

  const groupedIngredients = useMemo(() => {
    const groups: Record<string, IngredientInfo[]> = {};
    filteredIngredients.forEach(ing => {
      const cat = ing.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ing);
    });
    return groups;
  }, [filteredIngredients]);

  const redFlagNames = useMemo(() => 
    new Set(result?.redFlags.map(f => f.ingredient.toLowerCase()) || []), 
    [result?.redFlags]
  );

  return (
    <div className="max-w-2xl mx-auto pb-32 relative">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3">
            <div className="bg-emerald-500 rounded-full p-1 text-white">
              <CheckCircle2 size={16} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">{toast}</span>
            <button onClick={() => setToast(null)} className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="bento-card bg-white shadow-2xl overflow-hidden border-none flex flex-col min-h-[520px] transition-all duration-500 relative">
        {mode === 'STANDBY' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col items-center mb-10">
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-6 relative group cursor-pointer bg-emerald-50 text-emerald-500`} onClick={() => setMode('CAMERA')}>
                {isCompareModeEnabled ? <ArrowLeftRight size={44} /> : <Scan size={44} />}
                <div className={`absolute -inset-2 border-2 rounded-[2.5rem] animate-[ping_3s_ease-in-out_infinite] border-emerald-500/20`} />
                {isCompareModeEnabled && product1 && (
                  <div className="absolute -top-2 -right-2 bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-4 border-white shadow-md">STEP 2</div>
                )}
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
                {isCompareModeEnabled ? (product1 ? 'Audit Target B' : 'Audit Target A') : 'Clinical Scan'}
              </h2>
              <p className="text-slate-400 font-medium text-sm px-8 max-w-sm">
                {isCompareModeEnabled ? 'Performing a cross-reference audit of two subjects for metabolic suitability.' : 'Analyze nutritional labels against your clinical guardrails.'}
              </p>
            </div>

            <div className="flex flex-col w-full gap-4 max-w-xs">
              <button onClick={() => setMode('CAMERA')} className="bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95">
                <Camera size={18} /> {isCompareModeEnabled ? `Initiate Scan ${product1 ? 'B' : 'A'}` : 'Initialize Sensor'}
              </button>
              
              {!isCompareModeEnabled && (
                <button 
                  onClick={() => setIsCompareModeEnabled(true)}
                  className="bg-white border-2 border-emerald-100 text-emerald-600 py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-50 transition-all active:scale-95"
                >
                  <ArrowLeftRight size={18} /> Differential Comparison
                </button>
              )}

              <button onClick={() => fileInputRef.current?.click()} className="bg-white border-2 border-slate-100 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95">
                <Upload size={18} /> Load Lab Image
              </button>
              
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const b64 = ev.target?.result as string;
                    setImage(b64);
                    processImage(b64.split(',')[1]);
                  };
                  reader.readAsDataURL(file);
                }
              }} />

              {isCompareModeEnabled && (
                <button onClick={reset} className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-4 hover:text-slate-600 flex items-center justify-center gap-2">
                  <RotateCcw size={12} /> Cancel Comparative Mode
                </button>
              )}
            </div>
          </div>
        )}

        {mode === 'ANALYZING' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 animate-in fade-in duration-300">
            <div className="relative mb-10">
              <div className="w-32 h-32 border-4 border-emerald-500 border-t-transparent rounded-[2.5rem] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-emerald-500"><Database size={40} /></div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{statusText}</h3>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Accessing Clinical Neural Engine</p>
          </div>
        )}

        {mode === 'COMPARISON' && comparison && product1 && product2 && (
          <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-8 duration-700 bg-[#F8FAFC]">
             <div className="bg-slate-900 p-10 text-white relative shrink-0">
                <div className="relative z-10 flex justify-between items-start">
                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 rounded-xl">
                          <ArrowLeftRight size={24} className="text-white" />
                        </div>
                        <h3 className="text-4xl font-black tracking-tight">Differential Audit</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Cross-Referenced Analysis Report</p>
                      </div>
                   </div>
                   <button onClick={reset} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"><X size={24} /></button>
                </div>
                <Sparkles className="absolute -right-16 -bottom-16 text-emerald-500/10" size={280} />
             </div>

             <div className="p-8 space-y-8 -mt-6 relative z-20">
                <section className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 ring-4 ring-slate-50">
                   <div className="flex items-center gap-3 mb-6">
                      <ShieldCheck size={20} className="text-emerald-500" />
                      <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-400">Clinical Optimization Verdict</h4>
                   </div>
                   <div className="space-y-4">
                      <h5 className="text-2xl font-black text-slate-900 leading-tight">
                        Target <span className="text-emerald-500">"{comparison.betterChoice}"</span> identified as the superior clinical match.
                      </h5>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <p className="text-sm font-bold text-slate-600 leading-loose italic">"{comparison.clinicalReasoning}"</p>
                      </div>
                   </div>
                </section>

                <div className="grid grid-cols-2 gap-4">
                   <div className={`p-6 rounded-[2rem] bg-white border-2 transition-all shadow-lg ${comparison.betterChoice === product1.productName ? 'border-emerald-500 ring-4 ring-emerald-50' : 'border-slate-100'}`}>
                      <div className="flex flex-col items-center text-center gap-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Subject A</p>
                        <h6 className="text-xs font-black text-slate-900 truncate w-full">{product1.productName}</h6>
                        <StarRating rating={comparison.product1Score} size={10} />
                        {comparison.betterChoice === product1.productName && (
                          <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest mt-2">Optimal</span>
                        )}
                      </div>
                   </div>
                   <div className={`p-6 rounded-[2rem] bg-white border-2 transition-all shadow-lg ${comparison.betterChoice === product2.productName ? 'border-emerald-500 ring-4 ring-emerald-50' : 'border-slate-100'}`}>
                      <div className="flex flex-col items-center text-center gap-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Subject B</p>
                        <h6 className="text-xs font-black text-slate-900 truncate w-full">{product2.productName}</h6>
                        <StarRating rating={comparison.product2Score} size={10} />
                        {comparison.betterChoice === product2.productName && (
                          <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest mt-2">Optimal</span>
                        )}
                      </div>
                   </div>
                </div>

                <section className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                   <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
                      <Microscope size={14} className="text-slate-400" />
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Nutrient Differential Table</h4>
                   </div>
                   <table className="w-full text-left">
                      <tbody className="divide-y divide-slate-50">
                         {comparison.comparisonPoints.map((point, i) => (
                            <tr key={i} className="hover:bg-emerald-50/30 transition-colors group">
                               <td className="p-6">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{point.nutrient}</p>
                                 <p className="text-11px font-black text-slate-900">{point.verdict}</p>
                               </td>
                               <td className="p-6">
                                  <div className={`p-3 rounded-xl text-center ${point.product1Value.toLowerCase().includes('high') ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
                                    <span className="text-[11px] font-black">{point.product1Value}</span>
                                  </div>
                               </td>
                               <td className="p-6">
                                  <div className={`p-3 rounded-xl text-center ${point.product2Value.toLowerCase().includes('high') ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
                                    <span className="text-[11px] font-black">{point.product2Value}</span>
                                  </div>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </section>

                <div className="flex gap-4 pt-6">
                  <button onClick={handleSaveComparison} disabled={isSaved} className="flex-1 bg-emerald-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none">
                    {isSaved ? <><CheckCircle2 size={18} /> Audit Archived</> : <><BookmarkPlus size={18} /> Save Differential Audit</>}
                  </button>
                  <button onClick={reset} className="px-8 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-50 transition-all">New Audit</button>
                </div>
             </div>
          </div>
        )}

        {mode === 'RESULT' && result && (
          <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-8 duration-700">
            <div className={`p-10 text-white relative shrink-0 ${result.status === '🔴' ? 'bg-rose-500' : result.status === '🟡' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
              <div className="relative z-10 flex justify-between items-start">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{result.status}</span>
                    <h3 className="text-4xl font-black tracking-tight">{result.productName || 'Audited Subject'}</h3>
                  </div>
                  <div className="flex gap-6">
                    <StarRating rating={result.clinicalScore} size={14} label="Condition Adherence" />
                    <StarRating rating={result.calorieScore} size={14} label="Calorie Density" />
                  </div>
                </div>
                <button onClick={reset} className="p-4 bg-white/20 rounded-2xl hover:bg-white/30 transition-all"><X size={24} /></button>
              </div>
              <Sparkles className="absolute -right-8 -bottom-8 text-white/10" size={180} />
            </div>

            <div className="p-8 bg-white space-y-12">
              <section className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <Activity size={20} className="text-emerald-500" />
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-400">Clinical Narrative</h4>
                </div>
                <p className="text-sm font-bold text-slate-700 leading-loose italic">"{result.medicalWarning}"</p>
              </section>

              {result.optimizationTips && result.optimizationTips.length > 0 && (
                <section className="p-8 bg-emerald-50/50 border border-emerald-100 rounded-[2.5rem]">
                   <div className="flex items-center gap-3 mb-6">
                     <Zap size={20} className="text-emerald-500" />
                     <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-400">Clinical Optimization Lab</h4>
                   </div>
                   <div className="space-y-4">
                      {/* Fixed: Use Array.isArray to ensure type narrowing and prevent 'unknown' property access errors. */}
                      {Array.isArray(result.optimizationTips) && result.optimizationTips.map((tip, i) => (
                        <div key={i} className="flex gap-4 items-start group">
                           <div className="mt-1 p-1 bg-white border border-emerald-200 rounded-lg text-emerald-500 shadow-sm transition-transform group-hover:scale-110"><CheckCircle2 size={12} /></div>
                           <p className="text-[11px] font-bold text-emerald-800 leading-relaxed">{tip}</p>
                        </div>
                      ))}
                   </div>
                </section>
              )}

              <section className="space-y-8">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-3">
                    <Microscope size={20} className="text-emerald-500" />
                    <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-400">Ingredient Audit Laboratory</h4>
                  </div>
                  <div className="relative w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                    <input type="text" placeholder="Filter Lab..." className="w-full bg-slate-50 border-none rounded-xl py-2 pl-8 text-[10px] font-bold" value={ingredientFilter} onChange={(e) => setIngredientFilter(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-10">
                  {Object.entries(groupedIngredients).map(([category, ings]) => {
                    const catInfo = CATEGORY_MAP[category] || CATEGORY_MAP['Other'];
                    const CatIcon = catInfo.icon;
                    return (
                      <div key={category} className="space-y-4">
                        <div className="flex items-center gap-3 px-1">
                          <div className={`p-1.5 rounded-lg ${catInfo.light} ${catInfo.color}`}><CatIcon size={14} /></div>
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-900">{category}</h5>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {ings.map((ing, idx) => {
                            const flag = result.redFlags.find(f => f.ingredient.toLowerCase() === ing.name.toLowerCase());
                            const isFlag = !!flag;
                            const flagReason = flag?.reason;
                            const severity = flag?.severity;
                            return <IngredientItem key={idx} ingredient={ing} isRedFlag={isFlag} flagReason={flagReason} severity={severity} />;
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button onClick={handleLogConsumption} disabled={isLogged} className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95">
                  {isLogged ? <CheckCircle2 /> : <><BookmarkPlus /> Log to Health Budget</>}
                </button>
                <button onClick={reset} className="px-8 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-100 transition-all">New Scan</button>
              </div>
            </div>
          </div>
        )}

        {mode === 'CAMERA' && (
          <div className="flex-1 relative flex flex-col bg-black">
            <video ref={videoRef} playsInline autoFocus className="flex-1 object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <button onClick={() => setMode('STANDBY')} className="absolute top-6 left-6 p-4 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-white/20 transition-all z-40"><ArrowLeft size={24} /></button>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-72 h-72 border-2 rounded-[3rem] relative animate-pulse border-emerald-500/20`}>
                <div className={`absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 rounded-tl-2xl border-emerald-500`} />
                <div className={`absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 rounded-tr-2xl border-emerald-500`} />
                <div className={`absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 rounded-bl-2xl border-emerald-500`} />
                <div className={`absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 rounded-br-2xl border-emerald-500`} />
              </div>
              {isCompareModeEnabled && (
                <div className="absolute top-1/2 -translate-y-1/2 bg-emerald-600 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl border border-white/20 backdrop-blur-md">
                   Auditing Target {product1 ? 'B' : 'A'}
                </div>
              )}
            </div>
            <div className="absolute bottom-10 left-0 right-0 flex justify-center z-30">
               <button onClick={captureFrame} className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all ring-8 ring-white/10"><div className="w-16 h-16 border-4 border-slate-900 rounded-full" /></button>
            </div>
          </div>
        )}

        {mode === 'ERROR' && error && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in duration-300">
             <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6"><AlertCircle size={40} /></div>
             <h3 className="text-2xl font-black text-slate-900 mb-2">{error.title}</h3>
             <p className="text-sm text-slate-400 font-medium mb-10 max-w-xs leading-relaxed">{error.message}</p>
             <button onClick={reset} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95">Retry Clinical Scan</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;
