// components/XpotPageShell.tsx
'use client';

import type { ReactNode } from 'react';

type XpotPageShellProps = {
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
};

function Shell({
  title,
  subtitle,
  rightSlot,
  children,
}: XpotPageShellProps) {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-50">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_55%),radial-gradient(circle_at_20%_80%,_rgba(56,189,248,0.08),_transparent_55%),radial-gradient(circle_at_85%_35%,_rgba(124,58,237,0.10),_transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      </div>

      {/* WIDE CONTENT SHELL (THIS IS THE KEY FIX) */}
      <div className="relative z-10 mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-10">
        {(title || subtitle || rightSlot) && (
          <header className="pt-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                {title && (
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
                )}
              </div>
              {rightSlot && <div>{rightSlot}</div>}
            </div>
          </header>
        )}

        <main className="pb-10">{children}</main>
      </div>
    </div>
  );
}

// Keep both exports to avoid breaking imports
export default Shell;
export { Shell as XpotPageShell };
