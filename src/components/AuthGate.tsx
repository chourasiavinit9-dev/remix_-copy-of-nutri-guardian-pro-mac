
import React, { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

// Shared context so any component can access the current user
export const AuthContext = React.createContext<{
  user: User | null;
  signOutUser: () => Promise<void>;
}>({ user: null, signOutUser: async () => {} });

export const useAuth = () => React.useContext(AuthContext);

// ─────────────────────────────────────────────────────────────────────────────
// AuthGate — renders children only when Firebase confirms the user is signed in.
// Matches exact design language of the existing app (no new Tailwind classes).
// ─────────────────────────────────────────────────────────────────────────────
const AuthGate: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [signing, setSigning] = useState(false);

  // Listen to Firebase auth state (persisted across page refreshes)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleGoogleSignIn = async () => {
    setSigning(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Sign-in failed. Please try again.');
      }
    } finally {
      setSigning(false);
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
    setUser(null);
  };

  // ── Loading state (checking persisted session) ──────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Signed-in: pass user + signOut down via context ────────────────────────
  if (user) {
    return (
      <AuthContext.Provider value={{ user, signOutUser }}>
        {children}
      </AuthContext.Provider>
    );
  }

  // ── Not signed in: login gate ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-['Plus_Jakarta_Sans']">
      {/* Ambient blob */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bento-card p-10 bg-white text-center space-y-8 border-none shadow-2xl shadow-slate-200/60">

          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="bg-emerald-500 p-4 rounded-3xl shadow-xl shadow-emerald-200 inline-flex">
              {/* ShieldCheck — inline SVG so no import needed */}
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                Nutri-Guardian
              </h1>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400">
                  Clinical Suite Pro
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 leading-relaxed">
              AI-powered clinical nutrition monitoring for chronic disease management.
            </p>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              Sign in to access your health dashboard
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest p-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={signing}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {signing ? (
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
            ) : (
              /* Google "G" icon */
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {signing ? 'Connecting...' : 'Continue with Google'}
          </button>

          {/* Disclaimer */}
          <p className="text-[9px] text-slate-300 font-bold leading-relaxed">
            By signing in, you acknowledge this is an AI clinical audit tool.
            Always consult a licensed physician for medical decisions.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[9px] text-slate-300 font-black uppercase tracking-widest mt-6">
          Built with Google Gemini AI · Prompt Wars 2025
        </p>
      </div>
    </div>
  );
};

export default AuthGate;
