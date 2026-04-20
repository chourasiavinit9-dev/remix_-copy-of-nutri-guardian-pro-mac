
export enum ChronicDisease {
  DIABETES = 'Type 2 Diabetes',
  CKD = 'CKD Stage 3',
  HYPERTENSION = 'Hypertension',
  CUSTOM = 'Custom / Other'
}

export interface UserProfile {
  weight: number;
  height: number;
  age: number;
  chronicDisease: ChronicDisease;
  customDiseaseName?: string;
  customRestrictions?: string;
}

export interface RedFlag {
  ingredient: string;
  reason: string;
  severity: 'CRITICAL' | 'CAUTION';
}

export interface IngredientInfo {
  name: string;
  category: string;
  description?: string;
}

export interface KeyNutrients {
  calories: number;
  sodium: number;
  sugar: number;
  protein: number;
  vitamins: number; 
  potassium?: number;
  phosphorus?: number;
}

export interface MealSuggestion {
  name: string;
  clinicalScore: number; // 1 to 5
  calories: number;
  ingredients: string[];
  swaps: string[];
  clinicalTips: string[]; // Specific prep hacks (e.g., "Rinse beans to reduce sodium by 40%")
  instructions: string[];
  estimatedNutrients: {
    sodium: number;
    sugar: number;
    protein: number;
    vitamins: number;
  };
}

export interface MealSuggestionResponse {
  mealSuggestion: MealSuggestion;
}

export interface SavedMeal extends MealSuggestion {
  id: string;
  timestamp: number;
}

export interface AnalysisResult {
  status: '🟢' | '🟡' | '🔴' | 'ERROR';
  productName?: string;
  clinicalScore: number; // 1 to 5 stars
  calorieScore: number; // 1 to 5 stars relative to diet
  keyNutrients: KeyNutrients;
  medicalWarning: string;
  redFlags: RedFlag[];
  ingredientsBreakdown?: IngredientInfo[];
  optimizationTips?: string[]; // Prep/Usage hacks for the scanned product
  dailyImpact: {
    calories: string;
    sodium: string;
    sugar: string;
    protein: string;
    vitamins: string;
    [key: string]: string;
  };
  recommendation: {
    verdict: string;
    mealSuggestion?: MealSuggestion;
  };
  compliance: {
    whoSaltTarget: string;
    nutriScore: string;
  };
  voiceResponse: string;
  fallbackIdentifier?: {
    type: 'barcode' | 'name';
    value: string;
  };
}

export interface ComparisonResult {
  betterChoice: string;
  product1Score: number; // 1 to 5 stars
  product2Score: number; // 1 to 5 stars
  clinicalReasoning: string;
  comparisonPoints: {
    nutrient: string;
    product1Value: string;
    product2Value: string;
    verdict: string;
  }[];
  voiceResponse: string;
}

export interface SavedComparison {
  id: string;
  timestamp: number;
  product1Name: string;
  product2Name: string;
  winner: string;
  reasoning: string;
  product1Score: number;
  product2Score: number;
}

export interface HealthBudget {
  calories: { max: number; used: number };
  sodium: { max: number; used: number };
  sugar: { max: number; used: number };
  protein: { max: number; used: number };
  vitamins: { max: number; used: number }; 
  potassium?: { max: number; used: number };
  phosphorus?: { max: number; used: number };
}

export interface EatingLog {
  id: string;
  timestamp: number;
  name: string;
  calories: number;
  sodium: number;
  sugar: number;
  protein: number;
  vitamins: number;
}

export interface SymptomAnalysis {
  possibleCondition: string;
  confidence: string;
  explanation: string;
  suggestedMedication: {
    name: string;
    type: string; // OTC or Prescription
    action?: string; // e.g. "Alleviates pain"
    notes: string;
  }[];
  lifestyleAdvice: string[];
  avoidanceProtocol: string[];
  nextSteps: string[];
  urgency: 'Low' | 'Medium' | 'High' | 'Emergency';
  disclaimer: string;
}
