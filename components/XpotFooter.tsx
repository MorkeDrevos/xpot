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
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-emerald-500 text-black font-semibold shadow-[0_18px_60px_rgba(16,185,129,0.22)] hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  const toneClass =
    tone === 'emerald'
      ? 'border-emerald-400/18 bg-emerald-500/8 text-emerald-100'
      : tone === 'amber'
      ? 'border-[rgba(var(--xpot-gold),0.28)] bg-[rgba(var(--xpot-gold),0.06)] text-[rgba(var(--xpot-gold-2),0.95)]'
      : tone === 'sky'
      ? 'border-sky-400/18 bg-sky-500/8 text-sky-100'
      : tone === 'violet'
      ? 'border-violet-400/18 bg-violet-500/8 text-violet-100'
      : 'border-white/10 bg-white/[0.035] text-slate-200';

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold',
        'shadow-[0_16px_70px_rgba(0,0,0,0.55)] backdrop-blur-md',
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
  tone?: 'slate' | 'ops';
  icon?: ReactNode;
}) {
  const base =
    'inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[12px] font-semibold transition';
  const cls =
    tone === 'ops'
      ? 'border-[rgba(var(--xpot-gold),0.25)] bg-[rgba(var(--xpot-gold),0.06)] text-slate-100 hover:bg-[rgba(var(--xpot-gold),0.09)]'
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
    <footer className="relative mt-10 overflow-x-clip">
      {/* Full-bleed footer band */}
      <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="xpot-footer-ambient absolute inset-0 opacity-[0.96]" />

          {/* vault highlight */}
          <div className="absolute inset-0 bg-[radial-gradient(70%_90%_at_50%_0%,rgba(255,255,255,0.06),transparent_62%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(70%_80%_at_12%_92%,rgba(16,185,129,0.09),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(70%_80%_at_88%_92%,rgba(139,92,246,0.09),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(70%_90%_at_50%_115%,rgba(var(--xpot-gold),0.08),transparent_60%)]" />

          {/* deep fade */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/50 to-black/75" />

          {/* rails */}
          <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
          <div className="absolute inset-x-0 top-[1px] h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.35),rgba(255,255,255,0.08),rgba(56,189,248,0.20),transparent)]" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
        </div>

        {/* Content (CONSTRAINED so it never feels “outside page”) */}
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="py-12 sm:py-14 lg:py-20">
            <div className="flex flex-col gap-7">
              {/* top row */}
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-[260px] flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-500">
                    XPOT protocol
                  </p>

                  <h3 className="mt-2 text-lg font-semibold text-slate-100">
                    A daily rewards primitive with handle-first identity.
                  </h3>

                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-200/90">
                    No tickets. Self custody for claims. Winners presented by @handle. Payout proof stays on-chain.
                    Designed to scale into a sponsor-ready rewards ecosystem.
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

                  <div className="mt-5 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-md">
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      <span className="font-mono text-slate-200">.bet</span> is our brand definition:
                      a commitment to outcomes you can verify. A bet on better systems, not a promise you cannot audit.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Link
                    href={ROUTE_HUB}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${BTN_GREEN} group px-6 py-3 text-sm`}
                  >
                    Enter hub
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>

                  <FooterLinkPill href={ROUTE_TERMS}>Terms</FooterLinkPill>
                  <FooterLinkPill href={ROUTE_PRIVACY}>Privacy</FooterLinkPill>

                  <FooterLinkPill
                    href={ROUTE_OPS}
                    tone="ops"
                    icon={<Lock className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />}
                  >
                    Ops
                  </FooterLinkPill>
                </div>
              </div>

              {/* bottom rail */}
              <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <span className="inline-flex items-center gap-2 text-[11px] text-slate-500">
                  <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    <span className="font-semibold text-slate-200">XPOT.bet</span> · Build · Engage · Transact
                    <span className="mx-2 text-slate-700">|</span>
                    UI is final. Wiring continues.
                  </span>
                </span>

                <span className="font-mono text-[11px] text-slate-600">build: cinematic-home</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Very subtle 20-30s ambient loop */}
      <style jsx global>{`
        .xpot-footer-ambient {
          background:
            radial-gradient(1100px 620px at 12% 18%, rgba(16, 185, 129, 0.16), transparent 62%),
            radial-gradient(1100px 620px at 88% 22%, rgba(139, 92, 246, 0.14), transparent 62%),
            radial-gradient(1200px 680px at 50% 110%, rgba(56, 189, 248, 0.10), transparent 66%),
            radial-gradient(900px 520px at 50% 0%, rgba(var(--xpot-gold), 0.10), transparent 62%),
            linear-gradient(180deg, rgba(2, 6, 23, 0.28), rgba(2, 6, 23, 0.94));
          filter: saturate(112%);
          transform: translateZ(0);
          animation: xpotFooterAmbient 28s ease-in-out infinite;
        }

        @keyframes xpotFooterAmbient {
          0% {
            transform: translate3d(0px, 0px, 0) scale(1);
          }
          33% {
            transform: translate3d(-14px, -10px, 0) scale(1.03);
          }
          66% {
            transform: translate3d(16px, 12px, 0) scale(1.02);
          }
          100% {
            transform: translate3d(0px, 0px, 0) scale(1);
          }
        }
      `}</style>
    </footer>
  );
}
