
import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded-md ${className}`} />
);

export const BentoSkeleton: React.FC = () => (
  <div className="space-y-6 animate-in fade-in duration-700">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton className="h-64 md:col-span-2 rounded-3xl" />
      <Skeleton className="h-64 rounded-3xl" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
    </div>
    <div className="space-y-4">
      <Skeleton className="h-12 w-1/4 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    </div>
  </div>
);
