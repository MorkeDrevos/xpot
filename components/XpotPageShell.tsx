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
    <div className="relative min-h-screen bg-[#02020a] text-slate-100">
      {/* GLOBAL NEBULA BACKGROUND (fixed, always visible) */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#02020a]" />

      <div
        className="
          pointer-events-none fixed inset-0 -z-10
          opacity-95
          bg-[radial-gradient(circle_at_10%_0%,rgba(37,99,235,0.45),transparent_60%),
              radial-gradient(circle_at_100%_30%,rgba(168,85,247,0.55),transparent_60%),
              radial-gradient(circle_at_100%_90%,rgba(236,72,153,0.45),transparent_65%),
              radial-gradient(circle_at_35%_85%,rgba(56,189,248,0.18),transparent_55%)]
        "
      />

      {/* gentle vignette (lighter so nebula survives) */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.65)_72%,rgba(0,0,0,0.85)_100%)]" />

      {/* top star sprinkle */}
      <div
        className="
          pointer-events-none fixed inset-x-0 top-0 -z-10
          h-[260px] opacity-80 mix-blend-screen
          [background-image:
            radial-gradient(circle_at_12%_18%,rgba(248,250,252,0.95)_1.6px,transparent_0),
            radial-gradient(circle_at_72%_10%,rgba(226,232,240,0.85)_1.4px,transparent_0),
            radial-gradient(circle_at_55%_26%,rgba(148,163,184,0.75)_1.2px,transparent_0)
          ]
          [background-size:900px_260px,1200px_260px,1400px_260px]
          [background-position:-120px_-40px,260px_-30px,40px_10px]
        "
      />

      {/* Page container – match admin width feel */}
      <div className="relative z-10 mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-6">
        {/* Optional header slot if you ever want it */}
        {(title || rightSlot) && (
          <header className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {title && (
                <span className="rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  {title}
                </span>
              )}
            </div>
            {rightSlot && <div>{rightSlot}</div>}
          </header>
        )}

        {subtitle && <p className="mb-6 text-sm text-slate-400">{subtitle}</p>}

        {children}
      </div>
    </div>
  );
}
