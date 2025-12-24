// app/tokenomics/TokenomicsClient.tsx
'use client';

import Link from 'next/link';
import { useCallback, useMemo, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Crown,
  ExternalLink,
  Flame,
  Gift,
  Lock,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  ListChecks,
  Copy,
  Wallet,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

import XpotPageShell from '@/components/XpotPageShell';

type PillTone = 'slate' | 'emerald' | 'amber' | 'sky';

const ROUTE_HUB = '/hub';
const ROUTE_TERMS = '/terms';

// ✅ Gold helpers
const GOLD_TEXT = 'text-[rgb(var(--xpot-gold-2))]';
const GOLD_BORDER = 'border-[rgba(var(--xpot-gold),0.35)]';
const GOLD_BG_WASH = 'bg-[rgba(var(--xpot-gold),0.06)]';
const GOLD_RING_SHADOW = 'shadow-[0_0_0_1px_rgba(var(--xpot-gold),0.10)]';

// ✅ Buttons
const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition ' +
  'border border-[rgba(var(--xpot-gold),0.35)] bg-[linear-gradient(180deg,rgba(var(--xpot-gold),0.18),rgba(var(--xpot-gold),0.08))] ' +
  'text-[rgb(var(--xpot-gold-2))] shadow-[0_18px_60px_rgba(0,0,0,0.45),0_0_0_1px_rgba(var(--xpot-gold),0.10)] ' +
  'hover:bg-[linear-gradient(180deg,rgba(var(--xpot-gold),0.22),rgba(var(--xpot-gold),0.10))] hover:brightness-[1.03] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--xpot-gold),0.35)] focus-visible:ring-offset-2 focus-visible:ring-offset-black ' +
  'disabled:cursor-not-allowed disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] transition';

const CARD =
  'relative overflow-hidden rounded-[30px] border border-slate-900/70 bg-slate-950/45 shadow-[0_40px_140px_rgba(0,0,0,0.55)] backdrop-blur-xl';

// Protocol constants
const DISTRIBUTION_DAILY_XPOT = 1_000_000;
const DAYS_PER_YEAR = 365;
const TEN_YEARS_REQUIRED = DISTRIBUTION_DAILY_XPOT * DAYS_PER_YEAR * 10; // 3,650,000,000

function getStreamflowContractUrl(contractAccount: string) {
  return `https://app.streamflow.finance/contract/solana/${contractAccount}`;
}

const TEAM_VESTING = {
  contractAccount: 'BYUYCGu1mH2B33QU2mzF2AZDvqxgLoboJbDDVJYvGWkR',
  senderWallet: 'G17RehqUAgMcAxcnLUZyf6WzuPqsM82q9SC1aSkBUR7w',
  recipientWallet: '3DSuZP8d8a9f5CftdJvmJA1wxgzgxKULLDwZeRKC2Vh',
};

function Pill({ children, tone = 'slate' }: { children: ReactNode; tone?: PillTone }) {
  const map: Record<PillTone, string> = {
    slate: 'border-slate-800/70 bg-slate-900/60 text-slate-200 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]',
    emerald: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]',
    sky: 'border-sky-400/50 bg-sky-500/10 text-sky-100 shadow-[0_0_0_1px_rgba(56,189,248,0.16)]',
    amber: `${GOLD_BORDER} ${GOLD_BG_WASH} ${GOLD_TEXT} ${GOLD_RING_SHADOW}`,
  };

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
        map[tone],
      ].join(' ')}
    >
      {children}
    </span>
  );
}

function pctToBar(pct: number) {
  const clamped = Math.max(0, Math.min(100, pct));
  return `${clamped}%`;
}

function fmtInt(n: number) {
  return Math.round(n).toLocaleString('en-US');
}

function shortAddr(a: string) {
  if (!a) return a;
  if (a.length <= 10) return a;
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

export default function TokenomicsClient() {
  useReducedMotion(); // keep hook if you later paste motion-based JSX

  // Supply math
  const supply = 50_000_000_000;

  const DISTRIBUTION_RESERVE_PCT = 14;
  const DISTRIBUTION_RESERVE = supply * (DISTRIBUTION_RESERVE_PCT / 100);

  const TEAM_PCT = 9;
  const TEAM_TOTAL_TOKENS = supply * (TEAM_PCT / 100);

  const yearsOfRunway = useCallback(
    (daily: number) => {
      if (!Number.isFinite(daily) || daily <= 0) return Infinity;
      return DISTRIBUTION_RESERVE / (daily * DAYS_PER_YEAR);
    },
    [DISTRIBUTION_RESERVE],
  );

  const runwayFixedYears = useMemo(() => yearsOfRunway(DISTRIBUTION_DAILY_XPOT), [yearsOfRunway]);
  const runwayFixedDays = useMemo(
    () => Math.floor(DISTRIBUTION_RESERVE / DISTRIBUTION_DAILY_XPOT),
    [DISTRIBUTION_RESERVE],
  );

  return (
    <XpotPageShell
      title="Tokenomics"
      subtitle="XPOT is built as a daily distribution protocol - transparent, repeatable and verifiable."
      topBarProps={{
        pillText: 'TOKENOMICS',
        sloganRight: 'Protocol-grade distribution',
      }}
    >
      {/* ✅ Minimal safe content so the file compiles right now.
          Replace everything inside this with your full tokenomics JSX when ready. */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="mt-6 rounded-[26px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-100">TokenomicsClient is live</p>
              <p className="mt-1 text-xs text-slate-400">
                This component now compiles. Paste your full Tokenomics page JSX back inside this <code className="font-mono">XpotPageShell</code>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href={ROUTE_HUB} className={BTN_PRIMARY}>
                Enter today <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href={ROUTE_TERMS} className={`${BTN_UTILITY} px-5 py-2.5 text-sm`}>
                Terms
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Total supply</p>
              <p className="mt-2 font-mono text-lg font-semibold text-slate-100">{supply.toLocaleString('en-US')}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Rewards reserve</p>
              <p className="mt-2 font-mono text-lg font-semibold text-emerald-200">
                {DISTRIBUTION_RESERVE.toLocaleString('en-US')} XPOT
              </p>
              <p className="mt-1 text-xs text-slate-500">{runwayFixedYears.toFixed(2)} years ({runwayFixedDays.toLocaleString('en-US')} days)</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">10-year requirement</p>
              <p className="mt-2 font-mono text-lg font-semibold text-slate-100">{TEN_YEARS_REQUIRED.toLocaleString('en-US')}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Pill tone="emerald">
              <Sparkles className="h-3.5 w-3.5" /> Daily distribution
            </Pill>
            <Pill tone="sky">
              <ShieldCheck className="h-3.5 w-3.5" /> Verifiable
            </Pill>
            <Pill tone="amber">
              <Lock className="h-3.5 w-3.5" /> Self-custody
            </Pill>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            Team vesting contract: <span className="font-mono text-slate-300">{shortAddr(TEAM_VESTING.contractAccount)}</span>{' '}
            <a className="ml-2 inline-flex items-center gap-1 hover:text-slate-300" href={getStreamflowContractUrl(TEAM_VESTING.contractAccount)} target="_blank" rel="noreferrer">
              Streamflow <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>
    </XpotPageShell>
  );
}
