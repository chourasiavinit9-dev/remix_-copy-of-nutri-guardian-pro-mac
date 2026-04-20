
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Scan, User, ShieldCheck, Menu, X, Apple, RotateCcw, Activity, LayoutDashboard, Search, Bell, Loader2, Sparkles, ArrowRight, ShieldAlert, History, Volume2, BookmarkPlus, CheckCircle2, Stethoscope, Utensils } from 'lucide-react';
import { UserProfile, ChronicDisease, HealthBudget, SavedComparison, SavedMeal, AnalysisResult, EatingLog } from './types';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import FridgeManager from './components/FridgeManager';
import ProfileSettings from './components/ProfileSettings';
import SymptomChecker from './components/SymptomChecker';
import EatingHistory from './components/EatingHistory';
import { DISEASE_GUARDRAILS } from './constants';
import { searchAndAnalyzeProduct } from './geminiService';

const NavItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link to={to} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${active ? 'scale-105' : 'hover:scale-105'}`}>
    <div className={`p-3.5 rounded-2xl transition-all duration-300 ${active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:bg-slate-50 hover:text-emerald-500'}`}>
      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    </div>
    <span className={`text-[10px] font-bold tracking-wide transition-colors duration-300 ${active ? 'text-emerald-600' : 'text-slate-400'}`}>
      {label}
    </span>
  </Link>
);

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('nutri_guardian_profile');
    return saved ? JSON.parse(saved) : {
      weight: 72,
      height: 175,
      age: 42,
      chronicDisease: ChronicDisease.DIABETES
    };
  });

  const [budget, setBudget] = useState<HealthBudget>(() => {
    const saved = localStorage.getItem('nutri_guardian_budget');
    return saved ? JSON.parse(saved) : {
      calories: { max: 2000, used: 0 },
      sodium: { max: 2300, used: 0 },
      sugar: { max: 10, used: 0 },
      protein: { max: 70, used: 0 },
      vitamins: { max: 100, used: 0 }
    };
  });

  const [logs, setLogs] = useState<EatingLog[]>(() => {
    const saved = localStorage.getItem('nutri_guardian_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [fridge, setFridge] = useState<string[]>(['Greek Yogurt', 'Avocado', 'Almonds', 'Baby Spinach', 'Salmon', 'Quinoa']);
  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  
  // Search & Notifications State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<AnalysisResult | null>(null);
  const [notifications, setNotifications] = useState<{id: string, title: string, body: string, time: string, type: 'warning' | 'info' | 'success'}[]>([]);

  // PERSISTENCE & AUTO-RESET LOGIC
  useEffect(() => {
    localStorage.setItem('nutri_guardian_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('nutri_guardian_budget', JSON.stringify(budget));
  }, [budget]);

  useEffect(() => {
    localStorage.setItem('nutri_guardian_logs', JSON.stringify(logs));
  }, [logs]);

  // AUTOMATIC NEXT DAY RESET
  useEffect(() => {
    const checkDailyReset = () => {
      const lastReset = localStorage.getItem('nutri_guardian_last_reset');
      const today = new Date().toDateString();

      if (lastReset !== today) {
        setBudget(prev => {
          const resetBudget = { ...prev };
          Object.keys(resetBudget).forEach(key => {
            const k = key as keyof HealthBudget;
            if (resetBudget[k]) {
              (resetBudget[k] as any).used = 0;
            }
          });
          return resetBudget;
        });
        localStorage.setItem('nutri_guardian_last_reset', today);
        console.info(`[Clinical Reset] Daily budget refreshed for ${today}`);
      }
    };

    checkDailyReset();
    const interval = setInterval(checkDailyReset, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fix: Cast guardrail limits to any to avoid property access errors on union types
    const limits = (DISEASE_GUARDRAILS[profile.chronicDisease as keyof typeof DISEASE_GUARDRAILS] || DISEASE_GUARDRAILS['Custom / Other']) as any;
    setBudget(prev => ({
      ...prev,
      sodium: { ...prev.sodium, max: limits.sodium },
      sugar: { ...prev.sugar, max: limits.sugar },
      protein: { ...prev.protein, max: limits.protein || 70 },
      vitamins: { ...prev.vitamins, max: 100 },
      ...(limits.potassium ? { potassium: { max: limits.potassium, used: prev.potassium?.used || 0 } } : {}),
      ...(limits.phosphorus ? { phosphorus: { max: limits.phosphorus, used: prev.phosphorus?.used || 0 } } : {}),
    }));
  }, [profile.chronicDisease]);

  // Generate budget-based notifications
  useEffect(() => {
    const newNotifications = [];
    if (budget.sodium.used > budget.sodium.max * 0.9) {
      newNotifications.push({
        id: 'sodium-alert',
        title: 'Sodium Threshold Alert',
        body: `You have consumed 90%+ of your daily sodium limit for ${profile.chronicDisease}.`,
        time: 'Just now',
        type: 'warning' as const
      });
    }
    if (budget.sugar.used > budget.sugar.max * 0.9) {
      newNotifications.push({
        id: 'sugar-alert',
        title: 'Glycemic Risk High',
        body: 'Sugar consumption near daily guardrail. Monitor blood glucose.',
        time: 'Just now',
        type: 'warning' as const
      });
    }
    setNotifications(newNotifications);
  }, [budget.sodium.used, budget.sugar.used]);

  const addConsumption = (name: string, sodium: number, sugar: number, protein: number = 0, vitamins: number = 0, calories: number = 0) => {
    const newLog: EatingLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      name,
      sodium,
      sugar,
      protein,
      vitamins,
      calories
    };

    setLogs(prev => [newLog, ...prev]);

    setBudget(prev => ({
      ...prev,
      calories: { ...prev.calories, used: prev.calories.used + calories },
      sodium: { ...prev.sodium, used: Math.min(prev.sodium.max * 2, prev.sodium.used + sodium) },
      sugar: { ...prev.sugar, used: Math.min(prev.sugar.max * 2, prev.sugar.used + sugar) },
      protein: { ...prev.protein, used: Math.min(prev.protein.max * 2, prev.protein.used + protein) },
      vitamins: { ...prev.vitamins, used: Math.min(prev.vitamins.max, prev.vitamins.used + vitamins) } 
    }));
  };

  const deleteLog = (id: string) => {
    const logToDelete = logs.find(l => l.id === id);
    if (!logToDelete) return;

    setLogs(prev => prev.filter(l => l.id !== id));

    const logDate = new Date(logToDelete.timestamp).toDateString();
    const today = new Date().toDateString();
    if (logDate === today) {
        setBudget(prev => ({
            ...prev,
            calories: { ...prev.calories, used: Math.max(0, prev.calories.used - logToDelete.calories) },
            sodium: { ...prev.sodium, used: Math.max(0, prev.sodium.used - logToDelete.sodium) },
            sugar: { ...prev.sugar, used: Math.max(0, prev.sugar.used - logToDelete.sugar) },
            protein: { ...prev.protein, used: Math.max(0, prev.protein.used - logToDelete.protein) },
            vitamins: { ...prev.vitamins, used: Math.max(0, prev.vitamins.used - logToDelete.vitamins) }
        }));
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResult(null);
    try {
      const result = await searchAndAnalyzeProduct(searchQuery, profile);
      setSearchResult(result);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  const resetBudget = () => {
    if (window.confirm("Perform a Clinical Flush? This will reset all daily nutrient counters (Sodium, Protein, Sugar, etc.) for today.")) {
      setBudget(prev => {
        const resetBudget = { ...prev };
        Object.keys(resetBudget).forEach(key => {
          const k = key as keyof HealthBudget;
          if (resetBudget[k]) {
            (resetBudget[k] as any).used = 0;
          }
        });
        return resetBudget;
      });
      localStorage.setItem('nutri_guardian_last_reset', new Date().toDateString());
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Plus_Jakarta_Sans'] pb-32 lg:pb-0">
      <header className="sticky top-0 z-50 glass border-b border-slate-200/60 px-6 py-4 flex justify-between items-center transition-all">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-100">
              <ShieldCheck className="text-white" size={22} />
            </div>
            <div className="hidden sm:block text-left">
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">Nutri-Guardian</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Clinical Suite</p>
              </div>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex bg-slate-100 rounded-full px-4 py-1.5 items-center gap-2 border border-slate-200/50">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-600">{profile.chronicDisease} Monitoring</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => { setIsSearchOpen(true); setIsNotificationsOpen(false); }}
              className="p-2.5 text-slate-400 hover:text-emerald-500 transition-colors bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-200"
            >
              <Search size={18} />
            </button>
            <button 
              onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsSearchOpen(false); }}
              className={`p-2.5 transition-colors bg-white border border-slate-200 rounded-xl shadow-sm relative hover:border-emerald-200 ${isNotificationsOpen ? 'text-emerald-500 border-emerald-500' : 'text-slate-400'}`}
            >
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          </div>
        </div>
      </header>

      {isNotificationsOpen && (
        <div className="fixed top-20 right-6 w-[360px] glass border border-slate-200 shadow-2xl rounded-3xl z-[60] animate-in slide-in-from-top-4 duration-300 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Clinical Alerts</h3>
            <button onClick={() => setIsNotificationsOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>
          <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {notifications.length > 0 ? notifications.map(n => (
              <div key={n.id} className={`p-4 rounded-2xl border flex gap-4 ${n.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                <div className={`p-2 rounded-xl h-fit ${n.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                  {n.type === 'warning' ? <ShieldAlert size={18} /> : <Activity size={18} />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 mb-1">{n.title}</h4>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-2">{n.body}</p>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{n.time}</span>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center">
                <ShieldCheck className="mx-auto mb-4 text-emerald-100" size={32} />
                <p className="text-xs font-bold text-slate-400">All clinical guardrails clear.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)}></div>
          <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-slate-200/60 animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search product by name or barcode..."
                  className="w-full bg-white border-2 border-transparent rounded-2xl py-4.5 pl-14 pr-6 text-base font-bold focus:border-emerald-200 transition-all shadow-inner placeholder:text-slate-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isSearching && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2">
                    <Loader2 size={20} className="animate-spin text-emerald-500" />
                  </div>
                )}
              </form>
            </div>
            
            <div className="max-h-[70vh] overflow-y-auto p-8 custom-scrollbar">
              {isSearching ? (
                <div className="py-20 text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 border-4 border-slate-100 rounded-full mx-auto" />
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto animate-spin absolute inset-0" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Conducting Clinical Audit</h3>
                  <p className="text-sm text-slate-400 font-medium">Querying global databases and validating against your profile...</p>
                </div>
              ) : searchResult ? (
                searchResult.status === 'ERROR' ? (
                  <div className="py-12 text-center space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="bg-rose-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto border-4 border-rose-100 shadow-inner">
                      <ShieldAlert size={32} className="text-rose-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-slate-900">Search Rejected</h3>
                      <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                        {searchResult.medicalWarning || "The query is not recognized as a food product or contains inappropriate content."}
                      </p>
                    </div>
                    <button 
                      onClick={() => { setSearchQuery(''); setSearchResult(null); }}
                      className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
                    >
                      Try Another Search
                    </button>
                  </div>
                ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className={`p-8 rounded-[2rem] text-white relative overflow-hidden ${searchResult.status === '🔴' ? 'bg-rose-500' : searchResult.status === '🟡' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                    <div className="relative z-10 flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2.5 mb-4">
                          <span className="bg-white/20 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-white/20">AI Search Result</span>
                          <span className="text-xl">{searchResult.status}</span>
                        </div>
                        <h3 className="text-3xl font-black mb-1 tracking-tight">{searchResult.productName}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Clinical Score: {searchResult.clinicalScore}/5</p>
                      </div>
                      <button className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl backdrop-blur-md transition-all"><Volume2 size={20} /></button>
                    </div>
                    <Sparkles className="absolute -right-8 -bottom-8 text-white/10" size={140} />
                  </div>

                  <div className="space-y-6">
                    <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <h4 className="text-[9px] uppercase tracking-widest font-black text-slate-400 mb-3">Auditor Summary</h4>
                      <p className="text-xs font-bold text-slate-700 leading-loose italic">"{searchResult.medicalWarning}"</p>
                    </section>

                    {searchResult.redFlags.length > 0 && (
                      <section>
                        <h4 className="text-[9px] uppercase tracking-widest font-black text-slate-400 mb-4">Detected Clinical Triggers</h4>
                        <div className="space-y-2">
                          {searchResult.redFlags.map((flag, idx) => (
                            <div key={idx} className={`p-3 rounded-xl border flex gap-3 ${flag.severity === 'CRITICAL' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
                              <ShieldAlert size={14} className={flag.severity === 'CRITICAL' ? 'text-rose-500' : 'text-amber-500'} />
                              <p className="text-[11px] font-bold text-slate-800">{flag.ingredient}: <span className="text-slate-500 font-medium">{flag.reason}</span></p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => { addConsumption(searchResult.productName || 'Search Result', searchResult.keyNutrients.sodium, searchResult.keyNutrients.sugar, searchResult.keyNutrients.protein, searchResult.keyNutrients.vitamins, searchResult.keyNutrients.calories); setIsSearchOpen(false); }}
                      className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all saas-button"
                    >
                      <BookmarkPlus size={16} /> Log to Budget
                    </button>
                    <button onClick={() => setSearchResult(null)} className="px-6 border border-slate-200 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Clear</button>
                  </div>
                </div>
                )
              ) : (
                <div className="py-12">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Suggested Searches</h4>
                   <div className="grid grid-cols-2 gap-3">
                      {['Greek Yogurt', 'Protein Granola', 'Diet Soda', 'Gluten-Free Pasta'].map(t => (
                        <button 
                          key={t}
                          onClick={() => { setSearchQuery(t); handleSearch(); }}
                          className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left text-xs font-black text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all flex items-center justify-between group"
                        >
                          {t} <ArrowRight size={14} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                   </div>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">A.I. Neural Search Active</span>
               </div>
               <button onClick={() => setIsSearchOpen(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Close Overlay</button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 lg:p-12">
        <Routes>
          <Route path="/" element={<Dashboard profile={profile} budget={budget} savedComparisons={savedComparisons} onReset={resetBudget} logs={logs} />} />
          <Route path="/scan" element={<Scanner profile={profile} onConsume={(sodium, sugar, protein, vitamins, calories, name) => addConsumption(name, sodium, sugar, protein, vitamins, calories)} onSaveComparison={(c) => setSavedComparisons(prev => [{...c, id: Math.random().toString(), timestamp: Date.now()}, ...prev])} />} />
          <Route path="/fridge" element={
            <FridgeManager 
              profile={profile} 
              fridge={fridge} 
              setFridge={setFridge} 
              onLogMeal={(sodium, sugar, protein, vitamins, calories, name) => addConsumption(name, sodium, sugar, protein, vitamins, calories)} 
              savedMeals={savedMeals}
              onSaveMeal={(m) => setSavedMeals(prev => [m, ...prev])}
              onRemoveMeal={(id) => setSavedMeals(prev => prev.filter(m => m.id !== id))}
            />
          } />
          <Route path="/symptoms" element={<SymptomChecker profile={profile} />} />
          <Route path="/history" element={<EatingHistory logs={logs} onDelete={deleteLog} />} />
          <Route path="/profile" element={<ProfileSettings profile={profile} setProfile={setProfile} logs={logs} />} />
        </Routes>
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl glass border border-white/50 shadow-2xl shadow-slate-900/10 rounded-[2rem] flex justify-around items-center py-3.5 px-2 z-50 overflow-x-auto custom-scrollbar no-scrollbar">
        <NavItem to="/" icon={LayoutDashboard} label="Hub" active={location.pathname === '/'} />
        <NavItem to="/scan" icon={Scan} label="Scan" active={location.pathname === '/scan'} />
        <NavItem to="/history" icon={History} label="Logs" active={location.pathname === '/history'} />
        <NavItem to="/symptoms" icon={Stethoscope} label="Consult" active={location.pathname === '/symptoms'} />
        <NavItem to="/fridge" icon={Apple} label="Pantry" active={location.pathname === '/fridge'} />
        <NavItem to="/profile" icon={User} label="Me" active={location.pathname === '/profile'} />
      </nav>
    </div>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
