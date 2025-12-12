// components/XpotPageShell.tsx
'use client';

import type { ReactNode } from 'react';
import XpotLogo from '@/components/XpotLogo';

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
      {/* background */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,_rgba(94,234,212,0.14),_transparent_55%),radial-gradient(circle_at_20%_80%,_rgba(45,212,191,0.1),_transparent_55%)]" />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <XpotLogo className="cursor-pointer" />
            <div>
              {title && (
                <h1 className="text-xl font-semibold leading-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-sm text-slate-400">{subtitle}</p>
              )}
            </div>
          </div>
          {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
