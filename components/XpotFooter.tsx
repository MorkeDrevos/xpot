// components/XpotFooter.tsx
'use client';

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

function Pill({
  tone,
  children,
}: {
  tone: PillTone;
  children: React.ReactNode;
}) {
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
    <footer className="mt-10 pb-10">
      <div className="overflow-hidden rounded-[28px] border border-slate-900/70 bg-slate-950/45 p-6 shadow-[0_30px_110px_rgba(0,0,0,0.55)] backdrop-blur-xl">
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
            UI is final. Wiring continues.
          </span>
          <span className="font-mono text-slate-600">build: cinematic-home</span>
        </div>
      </div>
    </footer>
  );
}
