// components/XpotFooter.tsx
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Blocks,
  ExternalLink,
  Lock,
  ShieldCheck,
  Sparkles,
  Stars,
  Users,
} from 'lucide-react';

type PillTone = 'emerald' | 'amber' | 'sky' | 'violet' | 'slate';

const ROUTE_HUB = '/hub';
const ROUTE_OPS = '/ops';
const ROUTE_TERMS = '/terms';

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-black ' +
  'bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-500 ' +
  'shadow-[0_14px_40px_rgba(16,185,129,0.25),_0_8px_30px_rgba(0,0,0,0.55)] ' +
  'hover:brightness-110 active:brightness-105 transition ' +
  'disabled:cursor-not-allowed disabled:opacity-40';

const BTN_SECONDARY =
  'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[12px] font-semibold text-slate-200 ' +
  'shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur ' +
  'hover:bg-white/[0.06] hover:border-white/15 transition';

function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  const toneClass =
    tone === 'emerald'
      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200 shadow-[0_18px_50px_rgba(16,185,129,0.14)]'
      : tone === 'amber'
      ? 'border-amber-400/20 bg-amber-400/10 text-amber-200 shadow-[0_18px_50px_rgba(245,158,11,0.14)]'
      : tone === 'sky'
      ? 'border-sky-400/20 bg-sky-400/10 text-sky-200 shadow-[0_18px_50px_rgba(56,189,248,0.14)]'
      : tone === 'violet'
      ? 'border-violet-400/20 bg-violet-400/10 text-violet-200 shadow-[0_18px_50px_rgba(167,139,250,0.14)]'
      : 'border-slate-700/60 bg-slate-900/40 text-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.35)]';

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold',
        'backdrop-blur',
        toneClass,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

export default function XpotFooter() {
  return (
    <footer className="mt-12 w-full pb-12">
      {/* Full-bleed premium backdrop */}
      <div className="relative w-full overflow-hidden">
        {/* Background layers */}
        <div
          aria-hidden
          className={[
            'pointer-events-none absolute inset-0',
            // deep base
            'bg-slate-950',
            // aurora gradients
            'bg-[radial-gradient(900px_500px_at_12%_20%,rgba(16,185,129,0.16),transparent_55%),radial-gradient(900px_500px_at_88%_30%,rgba(56,189,248,0.12),transparent_55%),radial-gradient(900px_500px_at_55%_110%,rgba(167,139,250,0.12),transparent_60%)]',
          ].join(' ')}
        />

        {/* Subtle sheen line */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent"
        />

        {/* Soft bottom glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-[900px] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl"
        />

        {/* Content container (centered) */}
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mt-0 overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.03] shadow-[0_40px_140px_rgba(0,0,0,0.70)] backdrop-blur-xl">
            {/* Inner gradient frame */}
            <div className="relative p-6 sm:p-7">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),transparent_35%,rgba(0,0,0,0.22))]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-emerald-400/12 blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -right-40 -top-40 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl"
              />

              <div className="relative flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-xl">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-500">
                    XPOT protocol
                  </p>

                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    A minimal daily rewards primitive with handle-first identity and on-chain proof.
                    No tickets. Self custody for claims. Verifiable payouts.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Pill tone="emerald">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Self custody
                    </Pill>
                    <Pill tone="sky">
                      <Users className="h-3.5 w-3.5" />
                      @handle-first
                    </Pill>
                    <Pill tone="amber">
                      <Stars className="h-3.5 w-3.5" />
                      Proof
                    </Pill>
                    <Pill tone="violet">
                      <Blocks className="h-3.5 w-3.5" />
                      Composable
                    </Pill>
                  </div>

                  <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                    <span className="font-mono text-slate-400">.bet</span> is our brand definition: a commitment to
                    outcomes you can verify. A bet on better systems, not a promise you cannot audit.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link href={ROUTE_HUB} className={`${BTN_PRIMARY} group`}>
                    Enter hub
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>

                  <Link href={ROUTE_TERMS} className={BTN_SECONDARY}>
                    Terms
                    <ExternalLink className="h-4 w-4 text-slate-500" />
                  </Link>

                  <Link href={ROUTE_OPS} className={BTN_SECONDARY}>
                    <Lock className="h-4 w-4 text-amber-300" />
                    Ops
                    <ExternalLink className="h-4 w-4 text-slate-500" />
                  </Link>
                </div>
              </div>

              <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-slate-500">
                    <span className="font-semibold text-slate-300">XPOT.bet</span> · Build · Engage · Transact
                    <span className="mx-2 text-slate-700">|</span>
                    UI is final. Wiring continues.
                  </span>
                </span>

                <span className="font-mono text-slate-600">build: cinematic-home</span>
              </div>
            </div>
          </div>

          {/* Tiny bottom fade so the full-bleed feels intentional */}
          <div className="pointer-events-none h-10 w-full bg-gradient-to-b from-transparent to-slate-950/60" />
        </div>
      </div>
    </footer>
  );
}
