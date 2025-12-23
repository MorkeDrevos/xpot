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

const BTN_GREEN =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  const toneClass =
    tone === 'emerald'
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
      : tone === 'amber'
      ? 'border-amber-500/25 bg-amber-500/10 text-amber-200'
      : tone === 'sky'
      ? 'border-sky-500/25 bg-sky-500/10 text-sky-200'
      : tone === 'violet'
      ? 'border-violet-500/25 bg-violet-500/10 text-violet-200'
      : 'border-slate-700/60 bg-slate-900/40 text-slate-200';

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold',
        'shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur',
        toneClass,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

export default function XpotFooter() {
  return (
    <footer className="mt-10">
      {/* Full-bleed slab (edge-to-edge like hero) */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        {/* Ambient background */}
        <div className="relative overflow-hidden border-t border-white/5 bg-slate-950">
          {/* subtle top fade so it blends into page */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent" />

          {/* animated gradient haze (very subtle) */}
          <div className="xpot-footer-ambient pointer-events-none absolute inset-0 opacity-[0.22]" />

          {/* secondary soft glow spots */}
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-[70px]" />
          <div className="pointer-events-none absolute right-[-120px] top-24 h-80 w-80 rounded-full bg-violet-500/10 blur-[80px]" />
          <div className="pointer-events-none absolute left-1/2 top-36 h-64 w-64 -translate-x-1/2 rounded-full bg-sky-500/8 blur-[90px]" />

          {/* Content container (keeps your site max width) */}
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            {/* Taller on desktop */}
            <div className="py-10 sm:py-12 lg:py-14">
              <div className="overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/35 p-6 sm:p-7 lg:p-8 shadow-[0_40px_140px_rgba(0,0,0,0.65)] backdrop-blur-xl">
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="max-w-xl">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-500">
                      XPOT protocol
                    </p>

                    <p className="mt-2 text-sm text-slate-300">
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
                      <span className="font-mono text-slate-400">.bet</span> is our brand definition: a commitment to outcomes
                      you can verify. A bet on better systems, not a promise you cannot audit.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={ROUTE_HUB} className={`${BTN_GREEN} group px-5 py-2.5 text-sm`}>
                      Enter hub
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>

                    <Link
                      href={ROUTE_TERMS}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/70 px-4 py-2.5 text-[12px] font-semibold text-slate-200 hover:bg-slate-900 transition"
                    >
                      Terms
                      <ExternalLink className="h-4 w-4 text-slate-500" />
                    </Link>

                    <Link
                      href={ROUTE_OPS}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/70 px-4 py-2.5 text-[12px] font-semibold text-slate-200 hover:bg-slate-900 transition"
                    >
                      <Lock className="h-4 w-4 text-amber-300" />
                      Ops
                      <ExternalLink className="h-4 w-4 text-slate-500" />
                    </Link>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-[11px] text-slate-500">
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

              {/* bottom breathing room inside the full-bleed slab */}
              <div className="h-4 lg:h-6" />
            </div>
          </div>

          {/* subtle bottom fade */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent" />
        </div>
      </div>

      <style jsx global>{`
        .xpot-footer-ambient {
          background: radial-gradient(900px 360px at 12% 28%, rgba(16, 185, 129, 0.16), transparent 60%),
            radial-gradient(900px 360px at 85% 22%, rgba(139, 92, 246, 0.14), transparent 60%),
            radial-gradient(900px 420px at 55% 78%, rgba(56, 189, 248, 0.10), transparent 62%),
            linear-gradient(120deg, rgba(15, 23, 42, 0.55), rgba(2, 6, 23, 0.55));
          background-size: 180% 180%;
          animation: xpotFooterAmbient 30s ease-in-out infinite;
          filter: saturate(1.05);
        }

        @keyframes xpotFooterAmbient {
          0% {
            transform: translate3d(0, 0, 0);
            background-position: 0% 30%;
          }
          50% {
            transform: translate3d(0, -6px, 0);
            background-position: 100% 70%;
          }
          100% {
            transform: translate3d(0, 0, 0);
            background-position: 0% 30%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .xpot-footer-ambient {
            animation: none;
          }
        }
      `}</style>
    </footer>
  );
}
