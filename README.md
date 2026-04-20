<div align="center">

<img src="https://img.shields.io/badge/Hack2Skill-PromptWars%202026-blueviolet?style=for-the-badge&logo=bolt&logoColor=white" />
<img src="https://img.shields.io/badge/Powered%20by-Google%20Gemini%202.0-4285F4?style=for-the-badge&logo=google&logoColor=white" />
<img src="https://img.shields.io/badge/Stack-React%20%2B%20Firebase%20%2B%20Cloud%20Run-F6820D?style=for-the-badge&logo=firebase&logoColor=white" />
<img src="https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=for-the-badge" />

<br /><br />

# 🛡️ Nutri-Guardian Pro
### *Clinical Nutrition Intelligence for India's Chronic Disease Crisis*

**Hack2Skill PromptWars 2026 — Gemini AI Track Submission**

> *An AI-first, clinical-grade platform transforming how 100M+ Indians with Diabetes, Hypertension & CKD navigate food safety — built entirely on precision Gemini prompt engineering.*

[🔴 Live Demo](https://nutri-guardian-pro.web.app) &nbsp;|&nbsp; [📹 Demo Video](#) &nbsp;|&nbsp; [🏗️ Architecture](#️-system-architecture)

</div>

---

## 🚨 The Problem — A Daily Life-or-Death Question

India has **101 million diabetics**, **220 million hypertensives**, and **7.5 million CKD patients**. Every single day, each one faces the same unanswered question:

> **_"Is this food safe for me?"_**

Existing nutrition apps give **generic, population-wide data**. They don't know your HbA1c. They don't know your GFR. They don't know that potassium in that banana can be fatal for your Stage 3 kidney failure.

**Nutri-Guardian Pro** closes this gap with real-time, **personalized clinical reasoning** powered by Google Gemini.

---

## 🏆 Hackathon Alignment

| Judging Criterion | Our Implementation |
|---|---|
| **🎯 Problem Impact** | Addresses India's chronic disease nutrition gap for 100M+ patients |
| **💡 Innovation** | 8-layer Gemini prompt engineering pipeline with disease-aware AI reasoning |
| **⚙️ Technical Depth** | Secure backend proxy, RAG pipeline, Zod validation, DOMPurify XSS defense |
| **🎨 UX/Design** | Bento-grid clinical UI, real-time nutrient budget, animated audit reports |
| **📚 Documentation** | Full architecture diagrams, prompt engineering breakdown, deployment guide |

---

## ✨ Core Features & Prompt Engineering Pipeline

Every feature is powered by a distinct, carefully engineered Gemini prompt. The AI is not a bolt-on — **it is the product**.

### 🔬 1. Deep Clinical Audit Scanner
**What it does:** Point your camera at any food label (or type/scan a barcode) and get a full clinical safety report in under 3 seconds.

**Prompt Engineering Techniques:**
- **Role-based system instruction:** Gemini is assigned the `"Nutri-Guardian Pro Clinical Auditor"` persona with explicit medical reasoning protocols
- **Structured JSON Schema enforcement:** `responseMimeType: 'application/json'` forces a strict output schema with `status`, `clinicalScore`, `keyNutrients`, `redFlags`, `ingredientsBreakdown`, `optimizationTips`, `dailyImpact`, and `compliance`
- **Dynamic context injection:** User's chronic disease, age, and weight are injected per-request — Gemini flags potassium for CKD, glycemic load for Diabetes, sodium for Hypertension
- **Zero-shot safety classification:** Returns 🟢 Safe / 🟡 Caution / 🔴 Danger with clinical reasoning
- **Input validation guardrail:** System prompt explicitly instructs Gemini to reject non-food, offensive, or injection-attempt queries with an `ERROR` status + `medicalWarning`
- **Open Food Facts integration:** Barcode queries first resolve product data from Open Food Facts API, feeding real product context into the Gemini prompt to prevent hallucination

**Output includes:** Clinical score, per-nutrient risk flags, ingredient-by-ingredient categorization (Core Matrix / Synthetic Sweeteners / Clinical Triggers etc.), WHO compliance check, and 3 clinician-approved optimization tips.

---

### ↔️ 2. Head-to-Head Clinical Comparison
**What it does:** Scan Product A, then Product B — Gemini returns a clinically-reasoned verdict on which is safer for YOUR condition.

**Prompt Engineering Techniques:**
- Both products' full clinical profiles are serialized and injected into a comparative reasoning prompt
- Gemini returns a structured `comparisonPoints` array with nutrient-by-nutrient verdicts and a `clinicalReasoning` narrative
- A `voiceResponse` field is generated for text-to-speech accessibility

---

### 🥗 3. Neural Recipe Lab (Smart Pantry AI)
**What it does:** Add your fridge ingredients to the Clinical Pantry and get a personalized, disease-safe meal suggestion with step-by-step instructions.

**Prompt Engineering Techniques:**
- **Few-shot nutritional reasoning:** Ingredients are ranked by disease relevance before being passed to Gemini
- **Constraint-aware generation:** The prompt explicitly requires the recipe to adhere to the patient's dietary restrictions (e.g., low-potassium for CKD, low-GI for Diabetes)
- Output includes `clinicalTips` (e.g., *"Rinse canned beans to cut sodium by ~40%"*), `swaps` for healthier alternatives, and full macronutrient breakdown

---

### 🩺 4. AI Clinical Symptom Consultant
**What it does:** Describe your symptoms and get a structured clinical triage analysis with urgency classification, medication contraindications, and red flags.

**Prompt Engineering Techniques:**
- **Sandwich defense:** User input is wrapped in `<patient_data>` XML tags with explicit instructions to treat content as read-only data — prevents prompt injection
- **Urgency classification:** Returns `Low → Medium → High → Emergency` triage level
- **Disease-aware medication filtering:** Suggested medications are contextualized against the user's chronic condition (e.g., NSAIDs flagged for CKD)
- **Built-in Firestore rate limiting:** 5-second cooldown per user to prevent abuse

---

### 📊 5. Daily Clinical Health Budget (Dashboard)
Real-time nutrient tracking with clinical guardrails:
- Visual progress bars for Calories, Sodium, Sugar, Protein, Vitamins against WHO/disease-specific daily limits
- Automatic daily reset at midnight
- Eating history log with PDF export (`jsPDF`)
- "Clinical Flush" emergency reset for testing

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        User Browser                                 │
│                   React 19 + Vite + TypeScript                      │
│                                                                     │
│  Scanner  │  Pantry AI  │  Symptom Checker  │  Dashboard  │  Scan  │
└────────────────────────┬────────────────────────────────────────────┘
                         │  fetch() HTTPS POST (No API key on client)
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│               Firebase Cloud Functions (Node.js 20)                 │
│                                                                     │
│  searchProductProxy   │  analyzeImageProxy  │  suggestMealProxy     │
│  compareProductsProxy │  clinicalConsult    │  analyzeLabReport     │
│  searchClinicalGuidelines (RAG)             │  generateEmbeddings   │
│                                                                     │
│  ✅ Zod input validation (injection defense)                        │
│  ✅ CORS origin policy (production domains only)                    │
│  ✅ Firestore rate limiting (per-user cooldowns)                    │
└────────────────────────┬────────────────────────────────────────────┘
                         │  @google/genai SDK (GEMINI_API_KEY secure)
                         ▼
              ┌──────────────────────┐
              │  Google Gemini API   │
              │  gemini-2.0-flash    │
              │  text-embedding-004  │
              └──────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Cloud Firestore     │
              │  (RAG + Rate Limits) │
              └──────────────────────┘
```

**Key Security Properties:**
- 🔐 `GEMINI_API_KEY` is **never in the browser bundle** — removed from `vite.config.ts` `define` block
- 🛡️ All AI calls are proxied through Cloud Functions on the server
- 🧼 All AI responses sanitized via DOMPurify (XSS defense)
- 🔒 Input validated via Zod schemas before any Gemini call (SQL/NoSQL injection defense)
- 🚧 Prompt injection blocked via XML sandwich wrapping and `<patient_data>` tagging

---

## 🔑 Prompt Engineering Techniques — Full Breakdown

| Technique | Implementation | Feature |
|---|---|---|
| **Role-based System Instructions** | `"You are Nutri-Guardian Pro Clinical Auditor"` persona | All features |
| **Structured JSON Schema Output** | `responseMimeType: application/json` + field-level schema | Scanner, Comparison, Pantry |
| **Dynamic Context Injection** | Disease type, age, weight injected per-request | All features |
| **Zero-shot Classification** | 🟢/🟡/🔴 safety status with reasoning | Scanner |
| **Constraint-aware Generation** | Disease dietary restrictions enforced in recipe prompts | Neural Recipe Lab |
| **XML Sandwich Defense** | `<patient_data>...</patient_data>` wraps user input to prevent injection | Symptom Checker |
| **Few-shot Nutritional Reasoning** | `dailyImpact` section contextualizes against WHO targets | Scanner |
| **RAG Pipeline** | `text-embedding-004` for clinical guideline retrieval via cosine similarity | Backend RAG |
| **Output Sanitization** | DOMPurify + recursive string sanitizer on all AI responses | All features |
| **Prompt Validation Guardrail** | System prompt rejects non-food inputs with error status | Scanner |
| **Barcode Context Enrichment** | Open Food Facts API pre-fills product data to prevent hallucination | Scanner |
| **Rate Limiting** | Firestore-backed per-user cooldown prevents abuse | Symptom Checker |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript 5.8, Vite 6 |
| **Routing** | React Router v7 |
| **State Management** | Zustand (global) + Dexie.js (IndexedDB) + localStorage |
| **AI** | Google Gemini 2.0 Flash via `@google/genai` (server-side only) |
| **Backend** | Firebase Cloud Functions (Node.js 20) |
| **Database** | Cloud Firestore (RAG embeddings + rate limiting) |
| **Hosting** | Firebase Hosting + Google Cloud Run (Docker/Nginx) |
| **Security** | DOMPurify, Zod input validation, CORS policy, API key proxying |
| **PDF Export** | jsPDF + jspdf-autotable |
| **Icons/Animation** | Lucide React + Framer Motion |
| **External APIs** | Open Food Facts (barcode enrichment) |

---

## 🚀 Running Locally

### Prerequisites
- Node.js ≥ 18 & npm
- A Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)
- Firebase CLI: `npm install -g firebase-tools`

### 1. Frontend Setup
```bash
# Install dependencies
npm install

# Add your Gemini API key (for local backend only)
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Start Vite dev server
npm run dev
# → Opens on http://localhost:3000
```

### 2. Backend Setup (Firebase Functions)
```bash
cd functions
npm install

# Start the local Firebase Functions emulator
firebase emulators:start --only functions
# → Functions available at http://localhost:5001
```

> The frontend dev server automatically proxies to `localhost:5001` in development mode via `VITE_BACKEND_URL`.

### 3. Production Build
```bash
npm run build
# Outputs to /dist — ready for Firebase Hosting or Cloud Run
```

---

## ☁️ Cloud Run Deployment

This project ships with a production-ready Dockerfile:

```bash
# Deploy to Google Cloud Run in one command
gcloud run deploy nutri-guardian-pro \
  --source . \
  --port 8080 \
  --allow-unauthenticated \
  --set-env-vars VITE_BACKEND_URL=https://your-functions-url.cloudfunctions.net
```

---

## 📁 Project Structure

```
nutri-guardian-pro/
├── App.tsx                   # Root layout, routing, global state, search
├── geminiService.ts          # AI integration layer (fetch → Cloud Functions proxy)
├── types.ts                  # Shared TypeScript interfaces
├── constants.tsx             # Disease-specific clinical guardrails & limits
├── store.ts / db.ts          # Zustand state + Dexie.js IndexedDB
├── Dockerfile                # Production container (Nginx + React build)
├── nginx.conf                # SPA routing config for Cloud Run
├── components/
│   ├── Dashboard.tsx         # Daily health budget + eating log
│   ├── Scanner.tsx           # Camera scan + barcode → Gemini deep audit
│   ├── FridgeManager.tsx     # Smart pantry + Neural Recipe Lab
│   ├── SymptomChecker.tsx    # AI clinical consultation (text triage)
│   ├── EatingHistory.tsx     # Nutrition log + PDF export
│   └── ProfileSettings.tsx  # Chronic disease profile + custom restrictions
└── functions/src/
    └── index.ts              # All Firebase Cloud Functions (secure AI proxy)
        ├── searchProductProxy
        ├── analyzeImageProxy
        ├── suggestMealProxy
        ├── compareProductsProxy
        ├── clinicalConsult         (+ Firestore rate limiting)
        ├── analyzeLabReport        (+ RAG context + sandwich defense)
        └── searchClinicalGuidelines (RAG retrieval with cosine similarity)
```

---

## 🌍 Impact & Market Opportunity

| Metric | Value |
|---|---|
| Target users (India) | 101M diabetics + 220M hypertensives + 7.5M CKD patients |
| Daily food decisions per patient | ~3-5 critical choices |
| Existing solution gap | Generic nutrition apps with no disease personalization |
| Nutri-Guardian's advantage | Real-time, personalized, disease-aware clinical verdicts |

**Use cases enabled:**
- ✅ Safe grocery shopping with live barcode scanning
- ✅ Clinical pantry management with AI-generated safe recipes
- ✅ Head-to-head food product comparison for safer choices
- ✅ Symptom triage integrated with nutritional context
- ✅ Full eating history log with PDF clinical reports for doctor visits

---

## 👤 Team

**Solo Submission** — Vinit Chaurasia  
Built for Hack2Skill PromptWars 2026 — Gemini AI Track

---

*⚠️ Medical Disclaimer: Nutri-Guardian Pro is an AI-assisted informational tool. It is not a substitute for professional medical advice, diagnosis, or treatment. All clinical data is generated by AI and should be reviewed by a qualified physician before acting on it.*
