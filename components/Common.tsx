
import React from 'react';

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded-2xl ${className}`} />
);

export const BentoSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Skeleton className="lg:col-span-2 h-64" />
    <Skeleton className="h-64" />
    <Skeleton className="h-40" />
    <Skeleton className="h-40" />
    <Skeleton className="h-40" />
    <Skeleton className="h-40" />
  </div>
);

/**
 * AudioVisualizer — shows an animated waveform when the AI is speaking.
 * Uses pure CSS keyframes (no motion/framer-motion dependency required).
 */
export const AudioVisualizer = ({ isSpeaking }: { isSpeaking: boolean }) => {
  if (!isSpeaking) return null;

  const bars = [
    { delay: '0ms',   duration: '0.5s' },
    { delay: '100ms', duration: '0.7s' },
    { delay: '200ms', duration: '0.6s' },
    { delay: '50ms',  duration: '0.8s' },
    { delay: '150ms', duration: '0.55s' },
  ];

  return (
    <div className="flex items-center gap-1 h-8 px-4 bg-emerald-50 rounded-full border border-emerald-100">
      {bars.map((b, i) => (
        <div
          key={i}
          className="w-1 bg-emerald-500 rounded-full"
          style={{
            height: '8px',
            animation: `nutri-bar-bounce ${b.duration} ease-in-out ${b.delay} infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes nutri-bar-bounce {
          from { height: 4px; }
          to   { height: 24px; }
        }
      `}</style>
    </div>
  );
};
