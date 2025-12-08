'use client';

import { ReactNode } from 'react';

type XpotCardProps = {
  children: ReactNode;
  className?: string;
};

export function XpotCard({ children, className = '' }: XpotCardProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-slate-800/70 
      bg-gradient-to-b from-slate-950/80 via-slate-950/95 to-slate-950/98
      shadow-[0_18px_60px_rgba(15,23,42,0.9)]
      px-5 py-4 sm:px-6 sm:py-5 ${className}`}
    >
      {/* glow */}
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-40 
      bg-[radial-gradient(circle,_rgba(94,234,212,0.20),_transparent_60%)] opacity-40" />

      {/* content */}
      <div className="relative z-10">{children}</div>
    </section>
  );
}
