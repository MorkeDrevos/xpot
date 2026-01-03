// components/home/ui.tsx
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export const GOLD_TEXT = 'text-[rgb(var(--xpot-gold-2))]';
export const GOLD_TEXT_DIM = 'text-[rgba(var(--xpot-gold-2),0.85)]';
export const GOLD_BORDER = 'border-[rgba(var(--xpot-gold),0.35)]';
export const GOLD_BORDER_SOFT = 'border-[rgba(var(--xpot-gold),0.25)]';
export const GOLD_BG_WASH = 'bg-[rgba(var(--xpot-gold),0.06)]';
export const GOLD_BG_WASH_2 = 'bg-[rgba(var(--xpot-gold),0.08)]';
export const GOLD_RING_SHADOW = 'shadow-[0_0_0_1px_rgba(var(--xpot-gold),0.10)]';
export const GOLD_GLOW_SHADOW = 'shadow-[0_0_10px_rgba(var(--xpot-gold),0.85)]';

export function Pill({
  children,
  tone = 'slate',
}: {
  children: ReactNode;
  tone?: 'slate' | 'emerald' | 'amber' | 'sky' | 'violet';
}) {
  const map: Record<string, string> = {
    slate:
      'border-slate-700/70 bg-slate-900/70 text-slate-300 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]',
    emerald:
      'border-emerald-400/40 bg-emerald-500/10 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]',
    amber: `${GOLD_BORDER} ${GOLD_BG_WASH} ${GOLD_TEXT} ${GOLD_RING_SHADOW}`,
    sky: 'border-sky-400/50 bg-sky-500/10 text-sky-100 shadow-[0_0_0_1px_rgba(56,189,248,0.16)]',
    violet:
      'border-violet-400/45 bg-violet-500/10 text-violet-200 shadow-[0_0_0_1px_rgba(139,92,246,0.16)]',
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 leading-none text-[10px] font-semibold uppercase tracking-[0.18em] ${map[tone]}`}
    >
      {children}
    </span>
  );
}

export function PremiumCard({
  children,
  className = '',
  halo = true,
  sheen = false,
}: {
  children: ReactNode;
  className?: string;
  halo?: boolean;
  sheen?: boolean;
}) {
  return (
    <section
      className={[
        'relative overflow-hidden rounded-[32px]',
        'bg-white/[0.03] backdrop-blur-xl',
        'shadow-[0_40px_140px_rgba(0,0,0,0.55)]',
        'ring-1 ring-white/[0.06]',
        sheen ? 'xpot-sheen' : '',
        className,
      ].join(' ')}
    >
      {halo && (
        <div
          className="
            pointer-events-none absolute -inset-28
            bg-[radial-gradient(circle_at_8%_0%,rgba(16,185,129,0.22),transparent_58%),
                radial-gradient(circle_at_92%_8%,rgba(139,92,246,0.18),transparent_60%),
                radial-gradient(circle_at_100%_100%,rgba(56,189,248,0.14),transparent_60%),
                radial-gradient(circle_at_50%_-10%,rgba(var(--xpot-gold),0.10),transparent_62%)]
            opacity-90
          "
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)]" />
      <div className="relative z-10">{children}</div>
    </section>
  );
}

export function MiniStat({
  label,
  value,
  tone = 'slate',
}: {
  label: string;
  value: ReactNode;
  tone?: 'slate' | 'emerald' | 'sky' | 'amber' | 'violet';
}) {
  const toneCls =
    tone === 'emerald'
      ? 'text-emerald-200'
      : tone === 'sky'
      ? 'text-sky-200'
      : tone === 'amber'
      ? `text-[rgb(var(--xpot-gold-2))]`
      : tone === 'violet'
      ? 'text-violet-200'
      : 'text-slate-200';

  return (
    <div className="rounded-2xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/[0.05]">
      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <div className={`mt-1 font-mono text-sm ${toneCls}`}>{value}</div>
    </div>
  );
}

export function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="grid gap-3">
      {items.map((it, idx) => {
        const isOpen = open === idx;

        return (
          <div key={it.q} className="overflow-hidden rounded-[22px] bg-white/[0.03] ring-1 ring-white/[0.06]">
            <button
              type="button"
              onClick={() => setOpen(v => (v === idx ? null : idx))}
              className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold text-slate-100">{it.q}</span>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 text-sm leading-relaxed text-slate-300">{it.a}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export function TinyTooltip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const anchorRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({ left: r.left + r.width / 2, top: r.bottom + 10 });
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  return (
    <span className="relative inline-flex items-center">
      <span
        ref={anchorRef}
        className="group inline-flex items-center"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </span>

      {open && pos
        ? createPortal(
            <div
              className="
                fixed z-[9999]
                -translate-x-1/2
                rounded-2xl border border-white/10 bg-black/85 px-3 py-2
                text-[11px] leading-relaxed text-slate-200
                shadow-[0_30px_100px_rgba(0,0,0,0.65)]
              "
              style={{ left: pos.left, top: pos.top }}
              role="tooltip"
            >
              {label}
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}

export function shortenAddress(addr: string, left = 6, right = 6) {
  if (!addr) return '';
  if (addr.length <= left + right + 3) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}
