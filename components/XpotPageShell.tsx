// components/XpotPageShell.tsx
'use client';

import type { ReactNode } from 'react';

type XpotPageShellProps = {
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
};

function XpotPageShell({
  title,
  subtitle,
  rightSlot,
  children,
}: XpotPageShellProps) {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-50">
      {/* gradient halo behind content */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,_rgba(94,234,212,0.14),_transparent_55%),radial-gradient(circle_at_20%_80%,_rgba(45,212,191,0.10),_transparent_55%)]" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8">
        {(title || subtitle || rightSlot) && (
          <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              {title && (
                <h1 className="truncate text-2xl font-semibold tracking-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
              )}
            </div>

            {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
          </header>
        )}

        {children}
      </div>
    </div>
  );
}

export { XpotPageShell };
export default XpotPageShell;
