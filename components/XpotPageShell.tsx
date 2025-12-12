// components/XpotPageShell.tsx
'use client';

import type { ReactNode } from 'react';

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
    <div className="relative min-h-screen bg-[#020617] text-slate-50">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#020617]" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-80 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.14),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.18),transparent_55%),radial-gradient(circle_at_50%_120%,rgba(236,72,153,0.10),transparent_70%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.65)_72%,rgba(0,0,0,0.85)_100%)]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {(title || subtitle || rightSlot) && (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              {title && (
                <h1 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
              )}
            </div>
            {rightSlot && <div className="sm:pt-1">{rightSlot}</div>}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

export default XpotPageShell;
