
import { create } from 'zustand';
import { UserProfile, HealthBudget, EatingLog, ChronicDisease } from './types';
import { db } from './db';

interface NutriState {
  profile: UserProfile;
  budget: HealthBudget;
  logs: EatingLog[];
  pantry: string[];
  isDoctorMode: boolean;
  
  // Actions
  setProfile: (profile: UserProfile) => void;
  setBudget: (budget: HealthBudget | ((prev: HealthBudget) => HealthBudget)) => void;
  setLogs: (logs: EatingLog[]) => void;
  setPantry: (pantry: string[]) => void;
  setDoctorMode: (isDoctorMode: boolean) => void;
  
  // Async Hydration & Persistence
  hydrate: () => Promise<void>;
  addLog: (log: EatingLog) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  resetDailyBudget: (chronicDisease: ChronicDisease) => void;
}

const DEFAULT_PROFILE: UserProfile = {
  weight: 72,
  height: 175,
  age: 42,
  chronicDisease: ChronicDisease.DIABETES
};

const DEFAULT_BUDGET: HealthBudget = {
  calories: { max: 2000, used: 0 },
  sodium: { max: 2300, used: 0 },
  sugar: { max: 10, used: 0 },
  protein: { max: 70, used: 0 },
  vitamins: { max: 100, used: 0 }
};

export const useNutriStore = create<NutriState>((set, get) => ({
  profile: DEFAULT_PROFILE,
  budget: DEFAULT_BUDGET,
  logs: [],
  pantry: ['Greek Yogurt', 'Avocado', 'Almonds', 'Baby Spinach', 'Salmon', 'Quinoa'],
  isDoctorMode: false,

  setProfile: (profile) => {
    set({ profile });
    db.profiles.clear().then(() => db.profiles.add(profile));
  },
  setBudget: (budget) => {
    if (typeof budget === 'function') {
      set((state) => {
        const nextBudget = budget(state.budget);
        localStorage.setItem('nutri_guardian_budget', JSON.stringify(nextBudget));
        return { budget: nextBudget };
      });
    } else {
      set({ budget });
      localStorage.setItem('nutri_guardian_budget', JSON.stringify(budget));
    }
  },
  setLogs: (logs) => set({ logs }),
  setPantry: (pantry) => {
    set({ pantry });
    // Sync with Dexie pantry table if needed, for now we use simple string array for dashboard
  },
  setDoctorMode: (isDoctorMode) => set({ isDoctorMode }),

  hydrate: async () => {
    const profile = await db.profiles.toArray();
    const logs = await db.eatingLogs.orderBy('timestamp').reverse().toArray();
    const savedBudget = localStorage.getItem('nutri_guardian_budget');
    
    set({
      profile: profile.length > 0 ? profile[0] : DEFAULT_PROFILE,
      logs: logs,
      budget: savedBudget ? JSON.parse(savedBudget) : DEFAULT_BUDGET
    });
  },

  addLog: async (log) => {
    await db.eatingLogs.add(log);
    set((state) => ({ logs: [log, ...state.logs] }));
  },

  deleteLog: async (id) => {
    await db.eatingLogs.delete(id);
    set((state) => ({ logs: state.logs.filter(l => l.id !== id) }));
  },

  resetDailyBudget: (chronicDisease) => {
    // Logic for resetting budget based on disease
    // This will be called from the daily reset effect
  }
}));
