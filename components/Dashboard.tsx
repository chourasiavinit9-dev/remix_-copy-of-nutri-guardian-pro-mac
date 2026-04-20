
import React from 'react';
import { UserProfile, HealthBudget, SavedComparison, EatingLog } from '../types';
import { Heart, Activity, User, Info, TrendingUp, ShieldAlert, History, ArrowRight, ShieldCheck, Zap, Sparkles, RotateCcw, Target, Scale, Ruler, LayoutDashboard, ChevronRight, Utensils, RefreshCw, Clock, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardProps {
  profile: UserProfile;
  budget: HealthBudget;
  savedComparisons: SavedComparison[];
  onReset: () => void;
  logs: EatingLog[];
}

const MetricCard = ({ pct, label, value, max, unit, icon: Icon, color }: any) => {
  const normalizedPct = Math.min(100, pct);
  return (
    <div className="bento-card p-6 flex flex-col justify-between group">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${color.light} ${color.text} transition-all duration-300 group-hover:scale-110 shadow-sm`}>
          <Icon size={20} />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</span>
          <div className="text-xl font-black text-slate-900 leading-none">
            {value}<span className="text-[10px] ml-0.5 text-slate-400 font-bold">{unit}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Consumption</span>
          <span className={`text-[11px] font-black ${color.text}`}>{normalizedPct.toFixed(0)}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-out rounded-full ${color.bg}`} 
            style={{ width: `${normalizedPct}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ profile, budget, savedComparisons, onReset, logs }) => {
  const bmi = (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1);
  
  const dailyHealthScore = Math.max(0, Math.min(100, 100 - (
    (budget.sodium.used / budget.sodium.max * 40) + 
    (budget.sugar.used / budget.sugar.max * 40) +
    (budget.protein.used > budget.protein.max ? 10 : 0)
  ) + (budget.vitamins.used / 5))).toFixed(0);

  const stats = [
    { label: 'Sodium', value: budget.sodium.used, max: budget.sodium.max, unit: 'mg', pct: (budget.sodium.used / budget.sodium.max * 100), icon: Activity, color: { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50' } },
    { label: 'Sugar', value: budget.sugar.used, max: budget.sugar.max, unit: 'g', pct: (budget.sugar.used / budget.sugar.max * 100), icon: TrendingUp, color: { bg: 'bg-amber-400', text: 'text-amber-600', light: 'bg-amber-50' } },
    { label: 'Protein', value: budget.protein.used, max: budget.protein.max, unit: 'g', pct: (budget.protein.used / budget.protein.max * 100), icon: Zap, color: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50' } },
    { label: 'Micros', value: budget.vitamins.used, max: 100, unit: '%', pct: budget.vitamins.used, icon: Sparkles, color: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50' } },
  ];

  const recentLogs = logs.slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Patient Snapshot - Full Width Rectangle */}
        <div className="lg:col-span-4 bento-card p-10 bg-slate-900 text-white relative overflow-hidden group border-none shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row h-full justify-between items-center gap-8">
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Live Health Diagnostic</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Patient Snapshot</h2>
              <p className="text-slate-400 font-medium text-sm max-w-xl">
                Monitoring <span className="text-white font-bold">{profile.chronicDisease}</span> guardrails with real-time neural auditing.
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                 <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Audit Status</p>
                   <p className="text-sm font-bold text-emerald-400">Compliant</p>
                 </div>
                 <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Risk Profile</p>
                   <p className="text-sm font-bold text-slate-300">Stable</p>
                 </div>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end gap-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-sm">
              <div className="flex flex-col items-center md:items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Daily Health Score</span>
                <div className="text-6xl font-black text-emerald-400 flex items-baseline">
                  {dailyHealthScore}<span className="text-xl text-slate-600 ml-1">/100</span>
                </div>
              </div>
              <button 
                onClick={onReset}
                className="w-full md:w-auto px-8 py-4 bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl transition-all group flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
              >
                 <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Clinical Flush</span>
              </button>
            </div>
          </div>
          <Sparkles className="absolute -right-16 -bottom-16 text-emerald-500/10 transition-transform duration-1000 group-hover:scale-110" size={400} />
        </div>

        {/* Body Composition */}
        <div className="lg:col-span-2 bento-card p-8 flex flex-col md:flex-row justify-between items-center bg-white gap-8">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2">
              <Scale size={20} className="text-emerald-500" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Body Composition</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">BMI</p>
                <p className={`text-xl font-black ${parseFloat(bmi) < 25 ? 'text-emerald-600' : 'text-amber-600'}`}>{bmi}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Weight</p>
                <p className="text-xl font-black text-slate-900">{profile.weight}kg</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 text-white p-6 rounded-3xl flex flex-col items-center justify-center gap-2 min-w-[140px]">
             <Clock className="w-6 h-6 text-emerald-400" />
             <div className="text-center">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Next Reset</span>
                <span className="text-[10px] font-bold">Midnight</span>
             </div>
          </div>
        </div>

        {/* Clinical Best Practice */}
        <div className="lg:col-span-2 bento-card p-8 bg-emerald-50/50 border-emerald-100 flex items-center gap-6">
          <div className="bg-emerald-500 p-4 rounded-2xl text-white shadow-lg shadow-emerald-200 shrink-0">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 mb-1">Clinical Best Practice</h4>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              Regularly auditing your intake history allows the AI to refine your risk profile and offer more precise meal swaps.
            </p>
            <Link to="/scan" className="mt-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:underline">
              Audit Label Now <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Metabolic Health Budget Section */}
        <div className="lg:col-span-4 mt-4">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <LayoutDashboard size={16} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Metabolic Health Budget</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <MetricCard key={i} {...stat} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bento-card p-8 flex flex-col bg-white">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <History size={18} className="text-emerald-500" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Activity</h4>
            </div>
            <Link to="/history" className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-3 flex-1">
            {recentLogs.length > 0 ? recentLogs.map(log => (
              <div key={log.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group hover:border-emerald-200 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl text-slate-400 group-hover:text-emerald-500 transition-colors shadow-sm">
                    <Utensils size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">{log.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-xs font-black text-slate-900">{log.calories || 0}kcal</p>
                   <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">Analyzed</p>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center py-8 text-center opacity-40">
                <History size={32} className="mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">No recent logs</p>
              </div>
            )}
          </div>
        </div>

        {/* Clinical Best Practice */}
        <div className="lg:col-span-2 bento-card p-8 bg-emerald-50/50 border-emerald-100 flex flex-col justify-center">
          <div className="flex items-start gap-4">
            <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-200">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 mb-1">Clinical Best Practice</h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Regularly auditing your intake history allows the AI to refine your risk profile and offer more precise meal swaps based on {profile.chronicDisease} management protocols.
              </p>
              <Link to="/scan" className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all">
                Audit Label Now <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
