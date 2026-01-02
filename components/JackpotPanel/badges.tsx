'use client';

import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { TooltipBubble, useAnchoredTooltip } from './tooltip';

export function UsdEstimateBadge({ compact }: { compact?: boolean }) {
  const t = useAnchoredTooltip<HTMLButtonElement>();

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => t.setOpen(true)}
      onMouseLeave={() => t.setOpen(false)}
    >
      <button
        ref={t.ref}
        type="button"
        aria-label="USD estimate info"
        className={
          compact
            ? 'inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-700/60 bg-black/25 text-slate-300 hover:text-white hover:border-slate-500/70 transition shadow-[0_10px_20px_rgba(0,0,0,0.25)]'
            : 'inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-black/25 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200 hover:bg-slate-900/40 transition'
        }
      >
        <Info className={compact ? 'h-4 w-4 opacity-95' : 'h-4 w-4 opacity-90'} />
        {!compact && <span>USD estimate</span>}
      </button>

      <TooltipBubble open={t.open} rect={t.rect} width={380}>
        <div className="px-4 py-3 text-[12px] leading-snug text-slate-100">
          <p className="text-slate-100">
            Current USD value of today&apos;s XPOT, based on the live XPOT price from DexScreener.
          </p>
          <p className="mt-2 text-slate-400">
            Winner is paid in <span className="font-semibold text-[#7CC8FF]">XPOT</span>, not USD.
          </p>
        </div>
      </TooltipBubble>
    </div>
  );
}

export function RunwayBadge({ label, tooltip }: { label: string; tooltip?: string }) {
  const t = useAnchoredTooltip<HTMLDivElement>();
  if (!label) return null;

  return (
    <div
      ref={t.ref}
      className="relative inline-flex items-center justify-center gap-2"
      onMouseEnter={() => t.setOpen(true)}
      onMouseLeave={() => t.setOpen(false)}
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-1.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-100 max-w-[92vw] cursor-default select-none">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.45)]" />
        <span className="truncate">{label}</span>
      </span>

      {!!tooltip && (
        <>
          <button
            type="button"
            aria-label="More info"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700/80 bg-black/25 text-slate-200 hover:bg-slate-900/50 hover:text-white transition"
          >
            <Info className="h-4 w-4 opacity-90" />
          </button>

          <TooltipBubble open={t.open} rect={t.rect} width={340}>
            <div className="px-4 py-3 text-[12px] leading-snug text-slate-100 whitespace-pre-line select-none">
              {tooltip as ReactNode}
            </div>
          </TooltipBubble>
        </>
      )}
    </div>
  );
}
