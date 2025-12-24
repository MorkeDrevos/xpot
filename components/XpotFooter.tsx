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
const ROUTE_PRIVACY = '/privacy';

const BTN_GREEN =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-emerald-500 text-black font-semibold shadow-[0_18px_60px_rgba(16,185,129,0.25)] hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const GOLD_TEXT = 'text-[rgb(var(--xpot-gold-2))]';
const GOLD_BORDER_SOFT = 'border-[rgba(var(--xpot-gold),0.22)]';
const GOLD_WASH = 'bg-[rgba(var(--xpot-gold),0.06)]';
const GOLD_RING = 'shadow-[0_0_0_1px_rgba(var(--xpot-gold),0.10)]';

function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  const toneClass =
    tone === 'emerald'
      ? 'border-emerald-400/20 bg-emerald-500/8 text-emerald-100'
      : tone === 'amber'
      ? `${GOLD_BORDER_SOFT} ${GOLD_WASH} ${GOLD_TEXT} ${GOLD_RING}`
      : tone === 'sky'
      ? 'border-sky-400/20 bg-sky-500/8 text-sky-100'
      : tone === 'violet'
      ? 'border-violet-400/20 bg-violet-500/8 text-violet-100'
      : 'border-white/10 bg-white/[0.04] text-slate-200';

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold',
        'shadow-[0_12px_60px_rgba(0,0,0,0.45)] backdrop-blur-md',
        toneClass,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

function FooterLinkPill({
  href,
  children,
  tone = 'slate',
  icon,
}: {
  href: string;
  children: ReactNode;
  tone?: 'slate' | 'ops' | 'gold';
  icon?: ReactNode;
}) {
  const base =
    'inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[12px] font-semibold transition';
  const cls =
    tone === 'ops'
      ? 'border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.06]'
      : tone === 'gold'
      ? `${GOLD_BORDER_SOFT} ${GOLD_WASH} ${GOLD_TEXT} hover:brightness-[1.07] ${GOLD_RING}`
      : 'border-white/10 bg-white/[0.03] text-slate-100 hover:bg-white/[0.05]';

  return (
    <Link href={href} target="_blank" rel="noopener noreferrer" className={`${base} ${cls}`}>
      {icon}
      {children}
      <ExternalLink className="h-4 w-4 text-slate-500" />
    </Link>
  );
}

export default function XpotFooter() {
  return (
    <footer className="relative mt-10 w-full overflow-x-clip">
      {/* Full-bleed band (no w-screen trick) */}
      <div className="relative">
        {/* Background layer spans the full viewport width */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full overflow-hidden">
          <div className="xpot-footer-ambient absolute inset-0 opacity-[0.95]" />

          {/* gold crown line */}
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.55),rgba(255,255,255,0.10),rgba(56,189,248,0.22),transparent)]" />

          {/* soft glows */}
          <div className="absolute inset-0 bg-[radial-gradient(70%_90%_at_50%_0%,rgba(255,255,255,0.06),transparent_62%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(70%_80%_at_10%_95%,rgba(16,185,129,0.09),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(70%_80%_at_90%_95%,rgba(139,92,246,0.09),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_90%_at_50%_110%,rgba(var(--xpot-gold),0.10),transparent_62%)]" />

          {/* depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/50 to-black/75" />

          {/* glass rails */}
          <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
        </div>

        {/* Content container (always inside page padding) */}
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="py-12 sm:py-14 lg:py-20">
            <div className="flex flex-col gap-7">
              {/* top row */}
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="min-w-[260px] flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-500">
                    XPOT protocol
                  </p>

                  <p className="mt-2 text-sm text-slate-200/90">
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

                  <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
                    <span className="font-mono text-slate-200">.bet</span> is our brand definition: a commitment
                    to outcomes you can verify. A bet on better systems, not a promise you cannot audit.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={ROUTE_HUB}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${BTN_GREEN} group px-5 py-2.5 text-sm`}
                  >
                    Enter hub
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>

                  <FooterLinkPill href={ROUTE_TERMS} tone="gold">
                    Terms
                  </FooterLinkPill>
                  <FooterLinkPill href={ROUTE_PRIVACY} tone="gold">
                    Privacy
                  </FooterLinkPill>

                  <FooterLinkPill
                    href={ROUTE_OPS}
                    tone="ops"
                    icon={<Lock className="h-4 w-4 text-amber-300" />}
                  >
                    Ops
                  </FooterLinkPill>
                </div>
              </div>

              {/* bottom rail */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-slate-500">
                    <span className="font-semibold text-slate-200">XPOT.bet</span> · Build · Engage · Transact
                    <span className="mx-2 text-slate-700">|</span>
                    UI is final. Wiring continues.
                  </span>
                </span>

                <span className="font-mono text-slate-600">build: cinematic-home</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Very subtle ambient loop */}
      <style jsx global>{`
        .xpot-footer-ambient {
          background:
            radial-gradient(1100px 620px at 12% 20%, rgba(16, 185, 129, 0.16), transparent 62%),
            radial-gradient(1100px 620px at 88% 25%, rgba(139, 92, 246, 0.14), transparent 62%),
            radial-gradient(1200px 680px at 50% 105%, rgba(56, 189, 248, 0.10), transparent 66%),
            radial-gradient(900px 520px at 55% 10%, rgba(var(--xpot-gold), 0.10), transparent 62%),
            linear-gradient(180deg, rgba(2, 6, 23, 0.30), rgba(2, 6, 23, 0.92));
          filter: saturate(112%);
          transform: translateZ(0);
          animation: xpotFooterAmbient 26s ease-in-out infinite;
        }

        @keyframes xpotFooterAmbient {
          0% {
            transform: translate3d(0px, 0px, 0) scale(1);
          }
          33% {
            transform: translate3d(-16px, -10px, 0) scale(1.03);
          }
          66% {
            transform: translate3d(18px, 12px, 0) scale(1.02);
          }
          100% {
            transform: translate3d(0px, 0px, 0) scale(1);
          }
        }
      `}</style>
    </footer>
  );
}
