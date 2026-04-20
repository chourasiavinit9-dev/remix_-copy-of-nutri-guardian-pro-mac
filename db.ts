
import Dexie, { Table } from 'dexie';
import { UserProfile, EatingLog, SavedComparison, SavedMeal } from './types';

export interface PantryItem {
  id?: number;
  name: string;
  quantity?: string;
  expiryDate?: string;
  addedAt: number;
}

export class NutriGuardianDB extends Dexie {
  profiles!: Table<UserProfile, number>;
  eatingLogs!: Table<EatingLog, string>;
  pantry!: Table<PantryItem, number>;
  savedComparisons!: Table<SavedComparison, string>;
  savedMeals!: Table<SavedMeal, string>;

  constructor() {
    super('NutriGuardianDB');
    this.version(1).stores({
      profiles: '++id', // We'll just use one profile for now
      eatingLogs: 'id, timestamp',
      pantry: '++id, name',
      savedComparisons: 'id, timestamp',
      savedMeals: 'id, timestamp'
    });
  }
}

export const db = new NutriGuardianDB();
