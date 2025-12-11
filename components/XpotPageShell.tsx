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
    <div className="min-h-screen bg-[#020617] text-slate-50 relative">
      {/* ─────────────────────────────────────────────
          Background galaxy halos
      ───────────────────────────────────────────── */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-70"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(56,189,248,0.16), transparent 55%),
            radial-gradient(circle at 80% 80%, rgba(52,211,153,0.16), transparent 55%),
            radial-gradient(circle at 50% 120%, rgba(14,165,233,0.14), transparent 70%)
          `,
        }}
      />

      {/* ─────────────────────────────────────────────
          Main width container (same as admin)
      ───────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-6">

        {/* ─────────────────────────────────────────
            Page heading block (if provided)
        ───────────────────────────────────────── */}
        {(title || subtitle || rightSlot) && (
          <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {title && (
                <h1 className="text-2xl font-semibold tracking-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-sm text-slate-400">{subtitle}</p>
              )}
            </div>

            {rightSlot && (
              <div className="flex-shrink-0">{rightSlot}</div>
            )}
          </header>
        )}

        {/* ─────────────────────────────────────────
            Slot for page content
        ───────────────────────────────────────── */}
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

export default XpotPageShell;
