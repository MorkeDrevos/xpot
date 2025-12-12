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

function XpotPageShell({
  title,
  subtitle,
  rightSlot,
  children,
}: XpotPageShellProps) {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-50">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,_rgba(94,234,212,0.14),_transparent_55%),radial-gradient(circle_at_20%_80%,_rgba(45,212,191,0.10),_transparent_55%)]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <header className="mb-8 flex items-center justify-between">
          {/* LEFT: animated XPOT logo */}
          <div className="flex items-center gap-3">
            <XpotLogo />
            {title && (
              <span className="ml-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide">
                {title}
              </span>
            )}
          </div>

          {/* RIGHT */}
          {rightSlot && <div>{rightSlot}</div>}
        </header>

        {subtitle && (
          <p className="mb-6 text-sm text-slate-400">{subtitle}</p>
        )}

        {children}
      </div>
    </div>
  );
}

export { XpotPageShell };
export default XpotPageShell;
