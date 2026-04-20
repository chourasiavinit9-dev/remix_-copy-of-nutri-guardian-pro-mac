
import React, { useState } from 'react';
import { Apple, Plus, X, Search, ChevronRight, Loader2, Sparkles, Utensils, ChefHat, Heart, Trash2, ShoppingBasket, Soup, Flame, Star, ListOrdered, Info, ArrowLeftRight, Activity, BookmarkPlus, CheckCircle2, Zap, AlertCircle } from 'lucide-react';
import { UserProfile, MealSuggestion, SavedMeal } from '../types';
import { suggestMeal, validatePantryItem } from '../geminiService';

interface FridgeProps {
  profile: UserProfile;
  fridge: string[];
  setFridge: (f: string[]) => void;
  onLogMeal?: (sodium: number, sugar: number, protein: number, vitamins: number, calories: number, name: string) => void;
  savedMeals?: SavedMeal[];
  onSaveMeal?: (meal: SavedMeal) => void;
  onRemoveMeal?: (id: string) => void;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <div key={s} className={`p-1 rounded-md ${s <= rating ? 'bg-amber-100 text-amber-500 shadow-sm' : 'bg-slate-100 text-slate-300'}`}>
        <Star size={12} className={s <= rating ? 'fill-amber-500' : ''} />
      </div>
    ))}
  </div>
);

const FridgeManager: React.FC<FridgeProps> = ({ profile, fridge, setFridge, onLogMeal, savedMeals = [], onSaveMeal, onRemoveMeal }) => {
  const [newItem, setNewItem] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [meal, setMeal] = useState<MealSuggestion | null>(null);
  const [isLogged, setIsLogged] = useState(false);
  const [mealError, setMealError] = useState<string | null>(null);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    
    setIsAdding(true);
    setAddError(null);
    try {
      const validation = await validatePantryItem(newItem.trim());
      if (validation.isValid) {
        setFridge([...fridge, newItem.trim()]);
        setNewItem('');
      } else {
        setAddError(validation.error || "This item is not recognized as a food product or is inappropriate.");
      }
    } catch (err) {
      console.error("Validation failed:", err);
      setAddError("Clinical validation failed. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const removeItem = (index: number) => setFridge(fridge.filter((_, i) => i !== index));

  const generateAILunch = async (focusItem?: string) => {
    setIsGenerating(true); 
    setMeal(null); 
    setIsLogged(false);
    setMealError(null);
    
    const itemsToAnalyze = focusItem ? [focusItem, ...fridge.filter(i => i !== focusItem)] : fridge;
    
    try {
      const result = await suggestMeal(itemsToAnalyze, profile);
      if (result && result.mealSuggestion) {
        setMeal(result.mealSuggestion);
      }
    } catch (err: any) { 
      console.error("Meal generation failed:", err);
      setMealError(err?.message || 'Failed to generate recipe. Please try again.');
    } finally { 
      setIsGenerating(false); 
    }
  };

  const handleLogMeal = () => {
    if (!meal || !onLogMeal) return;
    const { sodium = 0, sugar = 0, protein = 0, vitamins = 0 } = meal.estimatedNutrients || {};
    onLogMeal(sodium, sugar, protein, vitamins, meal.calories || 0, meal.name || 'Pantry Meal');
    setIsLogged(true);
    setTimeout(() => {
      setMeal(null);
      setIsLogged(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bento-card p-10 bg-white shadow-xl shadow-slate-100 border-none relative overflow-hidden">
          <div className="flex justify-between items-start mb-10">
            <div className="flex items-center gap-4">
               <div className="p-3.5 bg-emerald-50 rounded-2xl text-emerald-600 shadow-inner">
                 <ShoppingBasket size={28} />
               </div>
               <div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Pantry</h2>
                 <p className="text-slate-400 font-medium text-xs mt-0.5">Inventorying ingredients for audit</p>
               </div>
            </div>
            <div className="bg-slate-50 px-4 py-2 rounded-full border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">{fridge.length} Items</div>
          </div>
          
          <form onSubmit={addItem} className="flex gap-3 mb-4 relative">
            <input 
              type="text" 
              placeholder="E.g. Baby Spinach, Wild Salmon..."
              className={`flex-1 bg-slate-50 border-2 rounded-2xl px-6 py-4.5 text-sm font-bold focus:bg-white focus:ring-4 transition-all placeholder:text-slate-300 shadow-inner ${addError ? 'border-rose-200 focus:border-rose-300' : 'border-transparent focus:border-emerald-200'}`}
              value={newItem}
              onChange={(e) => { setNewItem(e.target.value); if(addError) setAddError(null); }}
              disabled={isAdding}
            />
            <button 
              type="submit" 
              disabled={isAdding || !newItem.trim()}
              className="bg-emerald-500 text-white w-14 h-14 rounded-2xl shadow-lg hover:bg-emerald-600 transition-all active:scale-90 flex items-center justify-center disabled:opacity-50"
            >
              {isAdding ? <Loader2 size={24} className="animate-spin" /> : <Plus size={28} />}
            </button>
          </form>

          {addError && (
            <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest mb-6 px-2 animate-in slide-in-from-top-2">
              <AlertCircle size={14} />
              {addError}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {fridge.map((item, idx) => (
              <div key={idx} className="bg-slate-50/80 border border-slate-200 py-3 pl-5 pr-3 rounded-xl text-xs font-black text-slate-700 flex items-center gap-3 group hover:border-emerald-500 transition-all shadow-sm">
                <span>{item}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => generateAILunch(item)} 
                    className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                    title="Generate recipe with this"
                  >
                    <ChefHat size={14} />
                  </button>
                  <button onClick={() => removeItem(idx)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
            {fridge.length === 0 && (
              <div className="w-full py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Pantry is empty</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
           <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest px-2 flex items-center gap-2">
            <Heart size={16} className="text-rose-500" /> Favorite Audits
          </h3>
          <div className="flex flex-col gap-4">
            {savedMeals && savedMeals.length > 0 ? savedMeals.map((saved) => (
              <div key={saved.id} className="bento-card p-5 bg-white flex items-center justify-between">
                 <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500"><Soup size={20} /></div>
                    <div className="max-w-[120px]">
                      <h5 className="font-extrabold text-slate-800 text-xs truncate">{saved.name}</h5>
                      <StarRating rating={saved.clinicalScore} />
                    </div>
                 </div>
                 <button onClick={() => onRemoveMeal?.(saved.id)} className="p-2.5 text-slate-200 hover:text-rose-500 rounded-xl transition-all"><Trash2 size={16} /></button>
              </div>
            )) : (
              <div className="bento-card p-10 bg-white/50 border-dashed text-center text-slate-300 font-bold text-[10px] uppercase">No saved recipes</div>
            )}
          </div>
        </div>
      </div>

      <button 
        onClick={() => generateAILunch()} 
        disabled={fridge.length < 2 || isGenerating} 
        className="w-full bg-slate-900 text-white py-7 rounded-3xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 group relative overflow-hidden disabled:bg-slate-100 disabled:text-slate-300"
      >
        {isGenerating ? <Loader2 className="animate-spin" size={26} /> : <Sparkles size={26} />}
        <span className="uppercase tracking-[0.2em] text-sm">Launch Neural Recipe Lab</span>
      </button>

      {mealError && !isGenerating && !meal && (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-3xl flex items-start gap-4 animate-in slide-in-from-top-2 duration-300">
          <div className="p-2.5 bg-rose-100 text-rose-600 rounded-2xl shrink-0">
            <AlertCircle size={20} />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-black text-rose-900 uppercase tracking-widest mb-1">Neural Lab Error</h4>
            <p className="text-[11px] font-bold text-rose-700 leading-relaxed">{mealError}</p>
          </div>
          <button onClick={() => setMealError(null)} className="text-rose-300 hover:text-rose-500 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {meal && (
        <div className="animate-in zoom-in duration-500 space-y-8">
          <div className="bento-card overflow-hidden border-none shadow-2xl bg-white">
            {/* Clinical Header */}
            <div className="bg-emerald-500 p-12 text-white relative">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                   <div className="bg-white/20 text-[10px] font-black uppercase px-4 py-2 rounded-xl backdrop-blur-md border border-white/20">Clinical Outcome Report</div>
                   <button onClick={() => setMeal(null)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
                      <X size={20} />
                   </button>
                </div>
                <h3 className="text-4xl font-black mb-6 tracking-tight">{meal.name}</h3>
                <div className="flex flex-wrap items-center gap-8">
                   <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase text-emerald-100 tracking-widest">Condition Suitability</span>
                      <StarRating rating={meal.clinicalScore} />
                   </div>
                   <div className="w-px h-10 bg-white/20 hidden sm:block" />
                   <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase text-emerald-100 tracking-widest">Energy Density</span>
                      <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/10">
                        <Flame size={16} />
                        <span className="text-sm font-black uppercase tracking-widest">{meal.calories} kcal</span>
                      </div>
                   </div>
                </div>
              </div>
              <Utensils className="absolute top-10 right-10 text-white/5 rotate-12" size={180} />
            </div>

            <div className="p-8 md:p-12 space-y-12">
              {/* Nutrient Metrics Module */}
              <section className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner">
                <div className="flex items-center gap-3 mb-8">
                  <Activity size={20} className="text-emerald-500" />
                  <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Nutrient Diagnostic Metrics</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                   {(Object.entries(meal.estimatedNutrients || {}) as [string, number][]).map(([key, val]) => (
                     <div key={key} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center group hover:border-emerald-200 transition-all">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{key}</p>
                        <p className="text-xl font-black text-slate-900 leading-none">
                          {val}<span className="text-[10px] ml-1 text-slate-400 font-bold lowercase">{key === 'sodium' ? 'mg' : 'g'}</span>
                        </p>
                     </div>
                   ))}
                </div>
              </section>

              {/* Lab Contents & Protocols */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <section className="space-y-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <ListOrdered size={20} className="text-emerald-500" />
                      <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Audited Pantry Items</h4>
                    </div>
                    <ul className="space-y-3">
                      {meal.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-center gap-4 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl group hover:bg-white transition-all">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
                          <span className="text-xs font-bold text-slate-700">{ing}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {meal.swaps && meal.swaps.length > 0 && (
                    <div className="p-8 bg-amber-50/50 border border-amber-100 rounded-[2rem]">
                      <div className="flex items-center gap-3 mb-4">
                        <ArrowLeftRight size={18} className="text-amber-500" />
                        <h5 className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Clinical Ingredient Swaps</h5>
                      </div>
                      <div className="space-y-3">
                        {meal.swaps.map((swap, i) => (
                          <div key={i} className="flex gap-2">
                             <span className="text-amber-400 text-xs">•</span>
                             <p className="text-[11px] font-bold text-amber-700 leading-relaxed">{swap}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Clinical Preparation Hacks Section */}
                  {meal.clinicalTips && meal.clinicalTips.length > 0 && (
                    <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-[2rem]">
                      <div className="flex items-center gap-3 mb-4">
                        <Zap size={18} className="text-blue-500" />
                        <h5 className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Clinical Preparation Hacks</h5>
                      </div>
                      <div className="space-y-3">
                        {meal.clinicalTips.map((tip, i) => (
                          <div key={i} className="flex gap-3 items-start">
                             <div className="mt-1 p-1 bg-blue-100 rounded text-blue-600"><CheckCircle2 size={10} /></div>
                             <p className="text-[11px] font-bold text-blue-700 leading-relaxed">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                <section className="space-y-8">
                  <div className="flex items-center gap-3">
                    <ChefHat size={20} className="text-emerald-500" />
                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Preparation Protocol</h4>
                  </div>
                  <div className="space-y-8">
                    {meal.instructions.map((step, i) => (
                      <div key={i} className="flex gap-5 relative">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white text-[11px] font-black flex items-center justify-center shadow-lg">
                            {i + 1}
                          </div>
                          {i < meal.instructions.length - 1 && (
                            <div className="w-px h-full bg-slate-100 absolute left-4 top-8 -z-10" />
                          )}
                        </div>
                        <p className="text-xs font-medium text-slate-600 leading-relaxed pt-1.5">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Lab Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-slate-100">
                <button 
                  onClick={handleLogMeal} 
                  disabled={isLogged} 
                  className="flex-[2] bg-slate-900 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-4 active:scale-95"
                >
                  {isLogged ? <><CheckCircle2 size={24} /> Audit Completed</> : <><BookmarkPlus size={24} /> Confirm & Log Consumption</>}
                </button>
                <button 
                  onClick={() => setMeal(null)} 
                  className="flex-1 bg-white border border-slate-200 text-slate-400 py-6 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Clear Lab
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!meal && !isGenerating && (
        <div className="bg-blue-50/40 p-8 rounded-[2.5rem] border border-blue-100 flex items-start gap-5">
           <div className="p-3 bg-white rounded-2xl text-blue-500 shadow-sm mt-1 shrink-0">
             <Info size={24} />
           </div>
           <div>
              <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-1">Clinical Laboratory Note</h4>
              <p className="text-[11px] text-blue-800 leading-relaxed font-bold opacity-70">
                The Neural Recipe Lab customizes preparation protocols to minimize {profile.chronicDisease} triggers. Selecting an ingredient for "Solo Audit" will prioritize its clinical integration in the final report.
              </p>
           </div>
        </div>
      )}
    </div>
  );
};

export default FridgeManager;
