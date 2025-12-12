// components/XpotPageShell.tsx
'use client';

import type { ReactNode } from 'react';

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
      {/* background */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,_rgba(94,234,212,0.14),_transparent_55%),radial-gradient(circle_at_20%_80%,_rgba(56,189,248,0.12),_transparent_50%),radial-gradient(circle_at_80%_70%,_rgba(168,85,247,0.12),_transparent_55%)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {(title || subtitle || rightSlot) && (
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {title && (
                <h1 className="text-xl font-semibold text-slate-50">{title}</h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
              )}
            </div>

            {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
