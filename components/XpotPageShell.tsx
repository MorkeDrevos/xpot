// components/XpotPageShell.tsx
'use client';

import { ReactNode } from 'react';

export type XpotPageShellProps = {
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
};

export function XpotPageShell({
  title,
  subtitle,
  rightSlot,
  children,
}: XpotPageShellProps) {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 relative">
      {/* Background galaxy halos */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-70"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(56,189,248,0.14), transparent 55%),
            radial-gradient(circle at 80% 80%, rgba(168,85,247,0.18), transparent 55%),
            radial-gradient(circle at 50% 120%, rgba(236,72,153,0.10), transparent 70%)
          `,
        }}
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.65)_72%,rgba(0,0,0,0.85)_100%)]" />

      <div
