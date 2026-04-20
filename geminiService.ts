import DOMPurify from 'dompurify';
import { UserProfile, AnalysisResult, ChronicDisease, ComparisonResult, SymptomAnalysis, MealSuggestion, MealSuggestionResponse } from "./types";

// Base URL for Cloud Functions backend
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:5001/nutri-guardian-pro/us-central1';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const getDiseaseContext = (userProfile: UserProfile): string => {
  if (userProfile.chronicDisease === ChronicDisease.CUSTOM) {
    return `Condition: ${userProfile.customDiseaseName || 'Custom Condition'}. Mandatory Dietary Restrictions: ${userProfile.customRestrictions || 'User-defined healthy limits'}.`;
  }
  return `Condition: ${userProfile.chronicDisease}.`;
};

const isSimulationMode = (): boolean => {
  return false; // Proxied via backend now, Simulation logic removed
};

/**
 * Converts raw Gemini API errors into human-readable messages.
 * Handles: 429 quota exceeded, 403 invalid key, network failures.
 */
const handleApiError = (err: any): never => {
  const msg: string = err?.message || String(err);
  if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit')) {
    throw new Error('API quota exceeded. Your free-tier limit has been reached. Please wait a few minutes and try again, or upgrade your Gemini API plan at https://aistudio.google.com.');
  }
  if (msg.includes('403') || msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('permission')) {
    throw new Error('Invalid API key. Please check your GEMINI_API_KEY in .env.local and restart the dev server.');
  }
  if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
    throw new Error('Network error. Please check your internet connection and try again.');
  }
  throw new Error(`AI service error: ${msg}`);
};

/**
 * Phase 8 — XSS Defense:
 * Recursively sanitize all string values in AI response objects using DOMPurify.
 * Prevents any HTML/script injection from AI-generated content reaching the DOM.
 */
const sanitizeStrings = <T>(obj: T): T => {
  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }) as unknown as T;
  }
  if (Array.isArray(obj)) return obj.map(sanitizeStrings) as unknown as T;
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, sanitizeStrings(v)])
    ) as T;
  }
  return obj;
};

const parseJSON = (text: string | undefined): any => {
  if (!text) return {};
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    // Coerce all nutrient fields to numbers
    if (parsed.keyNutrients) {
      const n = parsed.keyNutrients;
      ['calories', 'sodium', 'sugar', 'protein', 'vitamins', 'potassium', 'phosphorus'].forEach(key => {
        if (n[key] !== undefined) {
          const val = parseFloat(String(n[key]));
          n[key] = isNaN(val) ? 0 : val;
        } else {
          n[key] = 0; // Default missing nutrients to 0 to avoid undefined errors
        }
      });
    }

    // Ensure arrays are always arrays
    if (!Array.isArray(parsed.redFlags)) parsed.redFlags = [];
    if (!Array.isArray(parsed.ingredientsBreakdown)) parsed.ingredientsBreakdown = [];
    if (!Array.isArray(parsed.optimizationTips)) parsed.optimizationTips = [];

    return parsed;
  } catch (e) {
    console.error("[Nutri-Guardian] Failed to parse JSON from AI response:", text);
    return {};
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Schemas & System Instructions
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `You are Nutri-Guardian Pro, a clinical nutritional assistant for chronic disease management.
You perform a "Deep Clinical Audit" of food labels and products.

CORE SCAN PROTOCOLS:
1. VALIDATION: If the input (text or image) contains offensive content, is unrelated to food, or is not a consumable product, you MUST return a JSON object with a 'status' of 'ERROR' and a 'medicalWarning' explaining the rejection.
2. NUTRIENT EXTRACTION: Calories, Sodium (mg), Sugar (g), Protein (g), Vitamins (as % Daily Value). ALL values MUST be numbers (not strings).
3. SAFETY CHECK (RED FLAGS): Scan ingredients for specific medical triggers based on the patient's condition.
4. INGREDIENT LABORATORY: Categorize EACH ingredient into one of: Core Matrix, Refined Sugars, Synthetic Sweeteners, Bio-Preservatives, Industrial Additives, Essential Nutrients, Clinical Triggers, Other.
5. CLINICAL OPTIMIZATION: Provide 2-3 specific preparation or usage hacks to lower nutrient risks.
6. CLINICAL SCORING: Assign 'clinicalScore' (1-5) and 'calorieScore' (1-5) based on disease adherence.

RESPONSE FORMAT: ALWAYS return ONLY a single valid JSON object. No markdown wrapper.`;

const PRODUCT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    status: { type: Type.STRING, description: "One of: 🟢, 🟡, 🔴, ERROR" },
    productName: { type: Type.STRING },
    clinicalScore: { type: Type.INTEGER },
    calorieScore: { type: Type.INTEGER },
    keyNutrients: {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.NUMBER },
        sodium: { type: Type.NUMBER },
        sugar: { type: Type.NUMBER },
        protein: { type: Type.NUMBER },
        vitamins: { type: Type.NUMBER },
        potassium: { type: Type.NUMBER },
        phosphorus: { type: Type.NUMBER }
      },
      required: ['calories', 'sodium', 'sugar', 'protein', 'vitamins']
    },
    redFlags: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          ingredient: { type: Type.STRING },
          reason: { type: Type.STRING },
          severity: { type: Type.STRING, description: "CRITICAL or CAUTION" }
        },
        required: ['ingredient', 'reason', 'severity']
      }
    },
    ingredientsBreakdown: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ['name', 'category']
      }
    },
    optimizationTips: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    medicalWarning: { type: Type.STRING },
    dailyImpact: {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.STRING },
        sodium: { type: Type.STRING },
        sugar: { type: Type.STRING },
        protein: { type: Type.STRING },
        vitamins: { type: Type.STRING }
      },
      required: ['calories', 'sodium', 'sugar', 'protein', 'vitamins']
    },
    recommendation: {
      type: Type.OBJECT,
      properties: {
        verdict: { type: Type.STRING }
      },
      required: ['verdict']
    },
    compliance: {
      type: Type.OBJECT,
      properties: {
        whoSaltTarget: { type: Type.STRING },
        nutriScore: { type: Type.STRING }
      },
      required: ['whoSaltTarget', 'nutriScore']
    },
    voiceResponse: { type: Type.STRING }
  },
  required: ['status', 'clinicalScore', 'calorieScore', 'keyNutrients', 'redFlags', 'medicalWarning', 'dailyImpact', 'recommendation', 'compliance', 'voiceResponse', 'ingredientsBreakdown', 'optimizationTips']
};

// ─────────────────────────────────────────────────────────────────────────────
// Simulation Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_PRODUCT_RESULT = (name: string): AnalysisResult => ({
  status: '🟢',
  productName: name,
  clinicalScore: 4,
  calorieScore: 4,
  keyNutrients: { calories: 150, sodium: 80, sugar: 5, protein: 10, vitamins: 12, potassium: 300, phosphorus: 150 },
  redFlags: [],
  ingredientsBreakdown: [
    { name: 'Whole Grain Oats', category: 'Core Matrix', description: 'High-fiber complex carbohydrate. Clinically safe.' },
    { name: 'Sea Salt', category: 'Industrial Additives', description: 'Sodium contributor. Monitor intake.' }
  ],
  optimizationTips: [
    'Pair with a protein source to stabilize blood glucose.',
    'Check total serving size — nutrients shown are per 100g.'
  ],
  medicalWarning: '⚠️ SIMULATION MODE: No GEMINI_API_KEY detected. Set GEMINI_API_KEY in .env.local to enable live AI analysis.',
  dailyImpact: { calories: '8%', sodium: '4%', sugar: '5%', protein: '14%', vitamins: '12%' },
  recommendation: { verdict: 'SAFE' },
  compliance: { whoSaltTarget: 'PASSED', nutriScore: 'B' },
  voiceResponse: 'This product appears clinically safe. Running in simulation mode — enable your API key for real analysis.'
});

// ─────────────────────────────────────────────────────────────────────────────
// Exported Service Functions
// ─────────────────────────────────────────────────────────────────────────────

export const searchAndAnalyzeProduct = async (query: string, userProfile: UserProfile): Promise<AnalysisResult> => {
  let finalQuery = query.toLowerCase();
  
  // Open Food Facts Fallback for Barcodes
  if (/^\d{8,14}$/.test(finalQuery)) {
    try {
      const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${finalQuery}.json`);
      const offData = await offRes.json();
      if (offData.status === 1 && offData.product && offData.product.product_name) {
         finalQuery = `${offData.product.product_name} nutritional information`;
      }
    } catch(e) {
      console.warn("Open Food Facts fallback failed", e);
    }
  }

  const diseaseContext = getDiseaseContext(userProfile);

  try {
    const res = await fetch(`${BACKEND_URL}/searchProductProxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { query: finalQuery, diseaseContext } })
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error('API quota exceeded.');
      throw new Error('Backend proxy error.');
    }

    const { data } = await res.json();
    const parsed = parseJSON(data.result);
    if (!parsed || !parsed.status) throw new Error('Invalid or empty response from backend API');
    return sanitizeStrings(parsed as AnalysisResult);
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Analyze a food product from a captured image (base64).
 */
export const analyzeProduct = async (imageB64: string, userProfile: UserProfile): Promise<AnalysisResult> => {
  const diseaseContext = getDiseaseContext(userProfile);

  try {
    const res = await fetch(`${BACKEND_URL}/analyzeImageProxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { imageB64, diseaseContext } })
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error('API quota exceeded.');
      throw new Error('Backend proxy error.');
    }

    const { data } = await res.json();
    const parsed = parseJSON(data.result);
    if (!parsed || !parsed.status) throw new Error('Invalid or empty response from backend API');
    return sanitizeStrings(parsed as AnalysisResult);
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Compare two scanned products and return a clinical verdict.
 */
export const compareProducts = async (p1: AnalysisResult, p2: AnalysisResult, userProfile: UserProfile): Promise<ComparisonResult> => {
  try {
    const res = await fetch(`${BACKEND_URL}/compareProductsProxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { p1, p2, diseaseContext: getDiseaseContext(userProfile) } })
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error('API quota exceeded.');
      throw new Error('Backend proxy error.');
    }

    const { data } = await res.json();
    const parsed = parseJSON(data.result);
    if (!parsed || !parsed.betterChoice) throw new Error('Invalid compare response from backend API');
    return sanitizeStrings(parsed as ComparisonResult);
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Analyze patient-reported symptoms against their chronic disease profile.
 */
export const analyzeSymptoms = async (symptoms: string, userProfile: UserProfile): Promise<SymptomAnalysis> => {
  try {
    const res = await fetch(`${BACKEND_URL}/clinicalConsult`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { symptoms, userId: 'frontend-user' } })
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error('API quota exceeded.');
      throw new Error('Backend proxy error.');
    }

    const { data } = await res.json();
    // The backend clinicalConsult returns plaintext assessment, we need to adapt it 
    // to SymptomAnalysis UI structure
    return sanitizeStrings({
      triageLevel: 'Yellow', // Fallback
      possibleCauses: ['Pending deeper analysis'],
      whatToAvoid: ['Self medication'],
      recommendedActions: ["Please consult a physician"],
      riskAssessment: data.assessment,
      medicationContraindications: [],
      erWarning: false,
      disclaimer: "This is a backend consult. Not medical advice."
    });
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Validate whether a pantry item is a real food/ingredient.
 */
export interface PantryValidationResponse {
  isValid: boolean;
  error?: string;
}

// Non-food keywords that should be blocked client-side with no API call needed
const EXPLICIT_BLOCK_TERMS = [
  'javascript', 'script', 'hack', 'exploit', 'sql', 'drop table', 'ignore previous',
  'system prompt', 'jailbreak', 'ignore all', 'nuclear', 'weapon', 'bomb', 'drug', 'cocaine',
  'meth', 'heroin', 'poison',
];

export const validatePantryItem = async (item: string): Promise<PantryValidationResponse> => {
  const lower = item.toLowerCase().trim();

  // Empty check
  if (!lower) return { isValid: false, error: 'Item name cannot be empty.' };

  // Block obvious non-food / injection attempts locally — no API call needed
  if (EXPLICIT_BLOCK_TERMS.some(term => lower.includes(term))) {
    return { isValid: false, error: 'This item is not recognized as a food product.' };
  }

  // Block if item is purely numeric or a single character
  if (/^\d+$/.test(lower) || lower.length < 2) {
    return { isValid: false, error: 'Please enter a valid food item name.' };
  }

  // Everything else is allowed — real food validation is handled by the recipe AI
  // Calling Gemini for every pantry item is unreliable and causes false rejections
  return { isValid: true };
};

/**
 * Generate an AI-powered meal suggestion based on fridge contents and disease profile.
 */
export const suggestMeal = async (ingredients: string[], userProfile: UserProfile): Promise<MealSuggestionResponse> => {
  if (!ingredients.length) throw new Error("No ingredients provided");
  const diseaseContext = getDiseaseContext(userProfile);

  try {
    const res = await fetch(`${BACKEND_URL}/suggestMealProxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { ingredients, diseaseContext } })
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error('API quota exceeded.');
      throw new Error('Backend proxy error.');
    }

    const { data } = await res.json();
    const parsed = parseJSON(data.result);
    // The suggestMealProxy returns a single object containing the recipe properties.
    // We wrap it in mealSuggestion to match the UI's expected Trial structure.
    return sanitizeStrings({ mealSuggestion: parsed as MealSuggestion });
  } catch (err) {
    return handleApiError(err);
  }
};

export const refineClinicalRestrictions = async (restrictions: string): Promise<string> => {
  // Since this is a minor text refinement, we can route it through the suggestMealProxy or simply return it
  // For the hackathon proxy build, we just return the cleaned string to avoid adding another endpoint
  return restrictions.trim();
};