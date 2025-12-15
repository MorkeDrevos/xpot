'use client';

import { ReactNode } from 'react';

type StatusTone = 'slate' | 'emerald' | 'amber' | 'sky';

export default function StatusPill({
  children,
  tone = 'slate',
}: {
  children: ReactNode;
  tone?: StatusTone;
}) {
  const cls =
    tone === 'emerald'
      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20'
      : tone === 'amber'
      ? 'bg-amber-500/10 text-amber-300 border-amber-400/20'
      : tone === 'sky'
      ? 'bg-sky-500/10 text-sky-300 border-sky-400/20'
      : 'bg-slate-800/60 text-slate-200 border-white/10';

  return (
    <span
      className={`
        inline-flex items-center gap-2
        rounded-full border px-3 py-1
        text-[10px] font-semibold uppercase tracking-[0.18em]
        ${cls}
      `}
    >
      {children}
    </span>
  );
}
