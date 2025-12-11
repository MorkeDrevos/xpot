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
      {/* Bright starfield near top of page (under global banner) */}
      <div
        className="
          pointer-events-none absolute inset-x-0 top-0
          h-[220px] -z-10 opacity-85 mix-blend-screen
          [background-image:
            radial-gradient(circle_at_12%_18%,rgba(248,250,252,0.98)_1.6px,transparent_0),
            radial-gradient(circle_at_72%_10%,rgba(226,232,240,0.9)_1.4px,transparent_0),
            radial-gradient(circle_at_55%_26%,rgba(148,163,184,0.9)_1.2px,transparent_0)
          ]
          [background-size:900px_260px,1200px_260px,1400px_260px]
          [background-position:-120px_-40px,260px_-30px,40px_10px]
        "
      />

      {/* Galaxy background layers */}
      <div className="pointer-events-none absolute inset-0 -z-30 bg-[#02020a]" />

      <div
        className="
          pointer-events-none absolute inset-0 -z-20 opacity-90
          bg-[radial-gradient(circle_at_10%_0%,rgba(15,23,42,0.95),transparent_60%),radial-gradient(circle_at_0%_60%,rgba(37,99,235,0.45),transparent_60%),radial-gradient(circle_at_100%_30%,rgba(168,85,247,0.60),transparent_60%),radial-gradient(circle_at_100%_90%,rgba(236,72,153,0.55),transparent_65%)]
        "
      />

      {/* Soft vignette */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.82)_70%,rgba(0,0,0,0.97)_100%)]" />

      {/* Nebula band behind content shell */}
      <div
        className="
          pointer-events-none absolute -z-10
          -inset-x-40 top-12 h-[640px]
          bg-[radial-gradient(circle_at_0%_10%,rgba(37,99,235,0.55),transparent_55%),radial-gradient(circle_at_45%_0%,rgba(15,23,42,0.95),transparent_55%),radial-gradient(circle_at_100%_60%,rgba(168,85,247,0.60),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(236,72,153,0.55),transparent_60%)]
          opacity-95 blur-2xl
        "
      />

      {/* Main content container – matches admin width */}
      <main className="relative mx-auto flex w-full max-w-[1520px] flex-col gap-6 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        {(title || subtitle || rightSlot) && (
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {title && (
                <h1 className="text-sm font-semibold text-white sm:text-base">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>
              )}
            </div>
            {rightSlot && (
              <div className="flex items-center gap-2">{rightSlot}</div>
            )}
          </header>
        )}

        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
