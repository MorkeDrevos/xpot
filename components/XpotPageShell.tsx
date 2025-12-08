// components/XpotPageShell.tsx
'use client';

import { ReactNode } from 'react';

type XpotPageShellProps = {
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
    <div className="min-h-screen bg-[#020617] text-slate-50">
      {/* gradient halo behind content */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,_rgba(94,234,212,0.14),_transparent_55%),radial-gradient(circle_at_20%_80%,_rgba(56,189,248,0.18),_transparent_55%)]" />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        {/* Header row (optional) */}
        {(title || rightSlot) && (
          <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
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
            {rightSlot && <div className="shrink-0">{rightSlot}</div>}
          </header>
        )}

        {children}
      </main>
    </div>
  );
}
