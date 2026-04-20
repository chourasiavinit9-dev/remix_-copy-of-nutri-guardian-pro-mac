import { GoogleGenAI, Type, Modality } from "@google/genai";
import DOMPurify from 'dompurify';
import { UserProfile, AnalysisResult, ChronicDisease, ComparisonResult, SymptomAnalysis, MealSuggestion, MealSuggestionResponse } from "./types";

const getDiseaseContext = (userProfile: UserProfile) => {
  if (userProfile.chronicDisease === ChronicDisease.CUSTOM) {
    return `Condition: ${userProfile.customDiseaseName || 'Custom Condition'}. 
            Mandatory Dietary Restrictions: ${userProfile.customRestrictions || 'User-defined healthy limits'}.`;
  }
  return `Condition: ${userProfile.chronicDisease}.`;
};

const SYSTEM_INSTRUCTION = `You are Nutri-Guardian Pro, a clinical nutritional assistant for chronic disease management.
You perform a "Deep Clinical Audit" of food labels and products.

CORE SCAN PROTOCOLS:
1. VALIDATION: If the input (text or image) contains offensive content, is unrelated to food, or is not a consumable product, you MUST return a JSON object with a 'status' of 'ERROR' and a 'medicalWarning' explaining that the item is not a food product or is inappropriate. This applies even if a food item is mentioned alongside offensive content.
2. NUTRIENT EXTRACTION: Calories, Sodium (mg), Sugar (g), Protein (g), Vitamins (as % Daily Value). Ensure all values are numbers.
3. SAFETY CHECK (RED FLAGS): Scan ingredients for specific medical triggers.
4. INGREDIENT LABORATORY: Categorize EACH ingredient.
5. CLINICAL OPTIMIZATION: Provide specific preparation or usage hacks to lower nutrient risks.
6. CLINICAL SCORING: Assign 'clinicalScore' (1-5) based on disease adherence.

RESPONSE FORMAT: ALWAYS return valid JSON within a code block.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    status: { type: Type.STRING },
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
      }
    },
    redFlags: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          ingredient: { type: Type.STRING },
          reason: { type: Type.STRING },
          severity: { type: Type.STRING }
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
      }
    },
    recommendation: {
      type: Type.OBJECT,
      properties: {
        verdict: { type: Type.STRING }
      }
    },
    compliance: {
      type: Type.OBJECT,
      properties: {
        whoSaltTarget: { type: Type.STRING },
        nutriScore: { type: Type.STRING }
      }
    },
    voiceResponse: { type: Type.STRING }
  },
  required: ['status', 'clinicalScore', 'calorieScore', 'keyNutrients', 'redFlags', 'medicalWarning', 'dailyImpact', 'recommendation', 'compliance', 'voiceResponse', 'ingredientsBreakdown', 'optimizationTips']
};

const parseJSON = (text: string | undefined) => {
  if (!text) return {};
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    
    // Sanitize nutrients to ensure they are numbers
    if (parsed.keyNutrients) {
      const n = parsed.keyNutrients;
      ['calories', 'sodium', 'sugar', 'protein', 'vitamins', 'potassium', 'phosphorus'].forEach(key => {
        if (n[key] !== undefined) {
          const val = parseFloat(String(n[key]));
          n[key] = isNaN(val) ? 0 : val;
        }
      });
    }
    
    return parsed;
  } catch (e) {
    console.error("Failed to parse JSON from AI response:", text);
    return {};
  }
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
export const searchAndAnalyzeProduct = async (query: string, userProfile: UserProfile): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const diseaseContext = getDiseaseContext(userProfile);
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Search and analyze the nutritional profile of "${query}" for a patient with ${diseaseContext}. Provide a complete clinical audit.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA
    }
  });
  return parseJSON(response.text) as AnalysisResult;
};

export const analyzeProduct = async (imageB64: string, userProfile: UserProfile): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const diseaseContext = getDiseaseContext(userProfile);
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: {
      parts: [
        { inlineData: { data: imageB64, mimeType: 'image/jpeg' } },
        { text: `Clinical Audit for ${diseaseContext}. Analyze label.` }
      ]
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA
    }
  });
  return parseJSON(response.text) as AnalysisResult;
};

export const compareProducts = async (p1: AnalysisResult, p2: AnalysisResult, userProfile: UserProfile): Promise<ComparisonResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const diseaseContext = getDiseaseContext(userProfile);
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Compare for ${diseaseContext}: Product A: ${p1.productName} (Score: ${p1.clinicalScore}) vs Product B: ${p2.productName} (Score: ${p2.clinicalScore}).`,
    config: {
      systemInstruction: "You are a clinical nutritionist. Compare products and return valid JSON.",
      responseMimeType: "application/json"
    }
  });
  return parseJSON(response.text) as ComparisonResult;
};

export const analyzeSymptoms = async (symptoms: string, profile: UserProfile): Promise<SymptomAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const diseaseContext = getDiseaseContext(profile);
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro-preview-05-06',
    contents: `Patient with ${diseaseContext} reports: "${symptoms}". Perform deep triage.`,
    config: {
      systemInstruction: `You are a clinical diagnostic scribe using verified open-source data (Mayo Clinic, WebMD).
      
      OUTPUT REQUIREMENTS:
      1. CLINICAL REASONING: List 3-4 highly probable medical reasons for symptoms.
      2. MEDICATION SUGGESTIONS: Suggest common, verified medications (e.g., Paracetamol, Ibuprofen) ONLY if safe for ${profile.chronicDisease}. Include specific actions (e.g. "alleviates inflammatory pain").
      3. AVOIDANCE PROTOCOL: Explicitly list what to avoid (foods, specific over-the-counter meds that interact with their condition, or activities).
      4. RED FLAGS: List critical clinical warning signs that require ER visit.
      
      MANDATORY: Return ONLY valid JSON.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          possibleCondition: { type: Type.STRING },
          confidence: { type: Type.STRING },
          explanation: { type: Type.STRING, description: "Detailed clinical reasoning with 3-4 possible causes." },
          suggestedMedication: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                action: { type: Type.STRING },
                notes: { type: Type.STRING }
              }
            }
          },
          lifestyleAdvice: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Actions to alleviate pain and recovery tips." },
          avoidanceProtocol: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Critical 'What to Avoid' list." },
          urgency: { type: Type.STRING },
          disclaimer: { type: Type.STRING }
        },
        required: ['possibleCondition', 'explanation', 'suggestedMedication', 'lifestyleAdvice', 'avoidanceProtocol', 'urgency', 'disclaimer']
      }
    }
  });
  return parseJSON(response.text) as SymptomAnalysis;
};

export interface PantryValidationResponse {
  isValid: boolean;
  error?: string;
}

export const validatePantryItem = async (item: string): Promise<PantryValidationResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Is "${item}" a food item, ingredient, or consumable product? Return JSON with 'isValid' (boolean) and 'error' (string, optional message if invalid).`,
    config: {
      systemInstruction: "You are a clinical food auditor. If the item is offensive, non-food, or unrelated to nutrition, set isValid to false.",
      responseMimeType: "application/json"
    }
  });
  return parseJSON(response.text) as PantryValidationResponse;
};

export const suggestMeal = async (fridge: string[], userProfile: UserProfile): Promise<MealSuggestionResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const diseaseContext = getDiseaseContext(userProfile);
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Suggest a meal for ${diseaseContext} using some of: ${fridge.join(', ')}.`,
    config: {
      systemInstruction: "You are a clinical chef. Return a JSON object with a 'mealSuggestion' property including name, clinicalScore, calories, ingredients, swaps, clinicalTips, instructions, and estimatedNutrients (sodium, sugar, protein, vitamins).",
      responseMimeType: "application/json"
    }
  });
  return parseJSON(response.text) as MealSuggestionResponse;
};

export function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const refineClinicalRestrictions = async (restrictions: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Refine: "${restrictions}".`,
  });
  return response.text || restrictions;
};