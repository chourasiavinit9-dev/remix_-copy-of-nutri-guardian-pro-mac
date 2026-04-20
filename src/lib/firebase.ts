// src/lib/firebase.ts
// ─────────────────────────────────────────────────────────────────────────────
// Firebase SDK initialization — all config values come from .env.local
// Copy .env.example → .env.local and fill in values from Firebase Console.
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// ── Startup guard: throw at load time if any required env var is missing ──────
const REQUIRED_ENV = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

for (const key of REQUIRED_ENV) {
  if (!import.meta.env[key]) {
    throw new Error(
      `[Nutri-Guardian] Missing required environment variable: ${key}. ` +
      `Copy .env.example → .env.local and fill in your Firebase project values.`
    );
  }
}

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Prevent double-initialisation in Vite HMR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth      = getAuth(app);
export const functions = getFunctions(app, 'us-central1');
export const googleProvider = new GoogleAuthProvider();

// Scopes: only request what we need — email + profile for the login card
googleProvider.addScope('email');
googleProvider.addScope('profile');

// ── Local emulator support (opt-in via VITE_USE_EMULATOR=true) ────────────────
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
  console.info('[Nutri-Guardian] 🔧 Running against local Firebase Emulator');
}

export default app;
