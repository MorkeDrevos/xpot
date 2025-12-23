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
      ? 'border-slate-800/80 bg-slate-950/55 text-slate-200 hover:bg-slate-900/70'
      : 'border-slate-800/70 bg-slate-950/45 text-slate-200 hover:bg-slate-900/60';

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
    <footer className="relative mt-10 pb-10">
      {/* Full-bleed ambient band (edge-to-edge like hero) */}
      <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        {/* Ambient animated gradient */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="xpot-footer-ambient absolute inset-0 opacity-[0.9]" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(255,255,255,0.06),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_30%_100%,rgba(16,185,129,0.08),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_70%_100%,rgba(139,92,246,0.08),transparent_55%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/55 to-black/70" />
        </div>

        {/* Content container */}
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          {/* Taller on desktop */}
          <div className="py-12 sm:py-14 lg:py-16">
            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/35 p-6 sm:p-7 lg:p-8 shadow-[0_40px_140px_rgba(0,0,0,0.70)] backdrop-blur-xl">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-xl">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-500">
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
                    <span className="font-mono text-slate-300">.bet</span> is our brand definition: a commitment to outcomes
                    you can verify. A bet on better systems, not a promise you cannot audit.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Hub is internal, but you asked: open all links in new window */}
                  <Link
                    href={ROUTE_HUB}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${BTN_GREEN} group px-5 py-2.5 text-sm`}
                  >
                    Enter hub
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>

                  <FooterLinkPill href={ROUTE_TERMS}>Terms</FooterLinkPill>
                  <FooterLinkPill href={ROUTE_PRIVACY}>Privacy</FooterLinkPill>

                  <FooterLinkPill
                    href={ROUTE_OPS}
                    tone="ops"
                    icon={<Lock className="h-4 w-4 text-amber-300" />}
                  >
                    Ops
                  </FooterLinkPill>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-[11px] text-slate-500">
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

      {/* Very subtle 20-30s ambient loop */}
      <style jsx global>{`
        .xpot-footer-ambient {
          background:
            radial-gradient(900px 520px at 15% 35%, rgba(16, 185, 129, 0.16), transparent 60%),
            radial-gradient(900px 520px at 85% 30%, rgba(139, 92, 246, 0.14), transparent 60%),
            radial-gradient(1000px 560px at 50% 95%, rgba(56, 189, 248, 0.10), transparent 62%),
            linear-gradient(180deg, rgba(2, 6, 23, 0.55), rgba(2, 6, 23, 0.92));
          filter: saturate(115%);
          transform: translateZ(0);
          animation: xpotFooterAmbient 26s ease-in-out infinite;
        }

        @keyframes xpotFooterAmbient {
          0% {
            transform: translate3d(0px, 0px, 0) scale(1);
          }
          33% {
            transform: translate3d(-14px, -10px, 0) scale(1.03);
          }
          66% {
            transform: translate3d(16px, 10px, 0) scale(1.02);
          }
          100% {
            transform: translate3d(0px, 0px, 0) scale(1);
          }
        }
      `}</style>
    </footer>
  );
}
