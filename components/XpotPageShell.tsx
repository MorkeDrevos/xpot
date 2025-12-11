// components/XpotPageShell.tsx
'use client';

import { ReactNode } from 'react';

type XpotPageShellProps = {
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
};

export default function XpotPageShell({
  title,
  subtitle,
  rightSlot,
  children,
}: XpotPageShellProps) {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-50">
      {/* nebula / galaxy glow in the background */}
      <div
        className="pointer-events-none fixed inset-0 z-0
        bg-[radial-gradient(circle_at_top,_rgba(94,234,212,0.18),_transparent_55%),radial-gradient(circle_at_20%_80%,_rgba(56,189,248,0.16),_transparent_55%)]"
      />

      {/* main content container */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        {(title || subtitle || rightSlot) && (
          <header className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {title && (
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
              )}
            </div>
            {rightSlot && <div className="flex items-center gap-3">{rightSlot}</div>}
          </header>
        )}

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
