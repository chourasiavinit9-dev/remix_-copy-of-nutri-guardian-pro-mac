<
</div>
<div align="center">
<img src="https://img.shields.io/badge/Hack2Skill-PromptWars%202025-blueviolet?style=for-the-badge&logo=bolt" />
<img src="https://img.shields.io/badge/Powered%20by-Gemini%20AI-4285F4?style=for-the-badge&logo=google" />
<img src="https://img.shields.io/badge/Built%20with-React%20%2B%20Firebase-F6820D?style=for-the-badge&logo=firebase" />
<br /><br />
# 🛡️ Nutri-Guardian Pro
### *Clinical Nutrition Intelligence, Powered by Gemini*
**Hack2Skill PromptWars 2025 Submission**
*An AI-first, clinical-grade nutrition auditing platform for chronic disease patients — built entirely around precision prompt engineering with Google Gemini.*
</div>
---
## 🏆 Hackathon Context
> **Competition:** Hack2Skill — PromptWars 2025
> **Theme:** Build real-world AI solutions using advanced prompt engineering techniques.
> **Core Tech Mandate:** Google Gemini AI (Gemini 2.5 Flash / Pro)
Nutri-Guardian Pro was designed from the ground up as a **prompt-engineering-first** application. The AI isn't a bolt-on feature — it **is** the product. Every user interaction routes through a carefully engineered Gemini prompt pipeline to deliver clinical-grade nutrition intelligence to India's 100M+ chronic disease population.
---
## 🩺 Problem Statement
Patients managing **Type 2 Diabetes, Hypertension, and CKD (Chronic Kidney Disease)** face a daily, life-or-death question: *"Is this food safe for me?"* Existing nutrition apps give generic info. Nutri-Guardian Pro gives **personalized clinical verdicts** — in real time, from any food label or barcode.
---
## ✨ Core AI Features (Prompt Engineering Highlights)
Every feature below is powered by a distinct, structured Gemini prompt:
### 1. 🔬 Deep Clinical Audit (Scan & Search)
A **multi-stage system prompt** instructs Gemini to act as a clinical nutritional auditor:
- **Input**: Camera photo of a food label OR a product name/barcode
- **Structured JSON Schema**: Forces Gemini to return a strict, machine-readable schema covering `status`, `clinicalScore`, `keyNutrients`, `redFlags`, `ingredientsBreakdown`, `optimizationTips`, `dailyImpact`, and `compliance`
- **Disease-Aware**: The user's chronic disease is injected into the prompt context, so AI reasoning is always personalized (e.g. potassium limits for CKD; glycemic risk flags for Diabetes)
- **Safety Guardrails**: The prompt includes explicit fallback logic — off-topic queries return an `ERROR` status with a `medicalWarning`, blocking prompt injection and non-food inputs
### 2. ↔️ Head-to-Head Clinical Comparison
- Provide two scanned products and Gemini returns a `betterChoice` verdict with granular `comparisonPoints` nutrient-by-nutrient
- The prompt provides both products' full clinical data and asks for a structured ranking with `clinicalReasoning`
### 3. 🥗 AI Meal Planner (Smart Pantry)
- Ingredients from the user's fridge are sent to a meal suggestion prompt
- Gemini returns a complete recipe with `clinicalScore`, `swaps`, `clinicalTips`, `estimatedNutrients`, and step-by-step `instructions`
- Meal is validated before suggestion against the user's disease restrictions
### 4. 🩺 Symptom Checker (Clinical Consult)
- User-reported symptoms flow through a clinical consultation prompt that returns `possibleCondition`, `confidence`, `suggestedMedication`, `lifestyleAdvice`, `avoidanceProtocol`, and an `urgency` level (Low → Emergency)
- Designed with strong medical disclaimers baked into the prompt
---
## 🏗️ Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                       │
│   App.tsx → geminiService.ts (Fetch calls to Cloud Functions)   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS Proxy (No Key on Client)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│             Firebase Cloud Functions (Node.js)                  │
│  searchProductProxy | analyzeImageProxy | suggestMealProxy      │
│  compareProductsProxy | clinicalConsult                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │ @google/genai SDK
                           ▼
                  ┌─────────────────────┐
                  │   Google Gemini API  │
                  │  (gemini-2.5-flash)  │
                  └─────────────────────┘
```
**Security design**: The `GEMINI_API_KEY` is **never exposed to the browser**. All AI calls are proxied through Firebase Cloud Functions, making this production-safe.
---
## 🔑 Prompt Engineering Techniques Used
| Technique | Where Applied |
|---|---|
| **Role-based system instructions** | Gemini is assigned the "Nutri-Guardian Pro Clinical Auditor" persona |
| **Structured JSON Schema output** | Enforced via `responseMimeType: 'application/json'` and Zod-like schema |
| **Dynamic context injection** | User's disease, weight, age injected per-request |
| **Zero-shot classification** | Food safety status: 🟢 Safe / 🟡 Caution / 🔴 Danger |
| **Few-shot nutritional reasoning** | `dailyImpact` section contextualizes values against WHO/disease targets |
| **Output sanitization** | DOMPurify + recursive sanitizer prevent XSS from AI responses |
| **Input validation guard** | System prompt explicitly rejects non-food/offensive queries |
| **Open Food Facts fallback** | Barcode lookup enriches the prompt context before Gemini analysis |
---
## 🚀 Running the Project Locally
### Prerequisites
- Node.js ≥ 18 & npm
- A Google Gemini API Key (from [Google AI Studio](https://aistudio.google.com/))
- Firebase CLI (for running functions locally): `npm install -g firebase-tools`
### Frontend Setup
```bash
# 1. Install frontend dependencies
npm install
# 2. Add your Gemini API Key to the env file
echo "GEMINI_API_KEY=your_key_here" > .env.local
# 3. Start the dev server
npm run dev
```
### Backend Setup (Firebase Functions)
```bash
cd functions
# Install function dependencies
npm install
# Run emulator locally (emulates Firebase Functions)
firebase emulators:start --only functions
```
> The frontend will automatically point to `localhost:5001` when running in dev mode.
---
## 🗂️ Project Structure
```
nutri-guardian-pro/
├── App.tsx                  # Root layout, routing, global state
├── geminiService.ts         # All AI integration (fetch → Cloud Functions)
├── types.ts                 # Shared TypeScript types & interfaces
├── constants.tsx            # Disease-specific clinical guardrails
├── store.ts / db.ts         # Zustand store & Dexie.js IndexedDB
├── components/
│   ├── Dashboard.tsx        # Daily health budget overview
│   ├── Scanner.tsx          # Barcode/image scanner → Gemini audit
│   ├── FridgeManager.tsx    # Smart pantry + meal suggestions
│   ├── SymptomChecker.tsx   # AI clinical consultation
│   ├── EatingHistory.tsx    # Nutrition log & journal
│   └── ProfileSettings.tsx  # Chronic disease profile setup
└── functions/src/
    └── index.ts             # Firebase Cloud Functions (AI proxy layer)
```
---
## 🛠️ Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Routing | React Router v7 |
| State | Zustand + Dexie.js (IndexedDB) + localStorage |
| AI | Google Gemini 2.5 Flash via `@google/genai` |
| Backend | Firebase Cloud Functions (Node.js 20) |
| Hosting | Firebase Hosting + Google Cloud Run |
| Icons | Lucide React |
| Animation | Framer Motion |
| PDF Export | jsPDF + jspdf-autotable |
| Security | DOMPurify, input sanitization, Zod |
---
## 👤 Team
**Solo Submission** — Built for Hack2Skill PromptWars 2025.
---
*⚠️ Disclaimer: Nutri-Guardian Pro is an AI-assisted informational tool. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified physician for medical decisions.*

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/6ffe41a6-f7ed-4202-9378-87e1165b9e1d

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
