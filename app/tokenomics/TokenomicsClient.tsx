'use client';

import Link from 'next/link';
import { useCallback, useMemo, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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

// ─────────────────────────────────────────────
// Gold helpers
// ─────────────────────────────────────────────
const GOLD_TEXT = 'text-[rgb(var(--xpot-gold-2))]';
const GOLD_BORDER = 'border-[rgba(var(--xpot-gold),0.35)]';
const GOLD_BG_WASH = 'bg-[rgba(var(--xpot-gold),0.06)]';
const GOLD_RING_SHADOW = 'shadow-[0_0_0_1px_rgba(var(--xpot-gold),0.10)]';

// ─────────────────────────────────────────────
// Buttons
// ─────────────────────────────────────────────
const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition ' +
  'border border-[rgba(var(--xpot-gold),0.35)] bg-[linear-gradient(180deg,rgba(var(--xpot-gold),0.18),rgba(var(--xpot-gold),0.08))] ' +
  'text-[rgb(var(--xpot-gold-2))] shadow-[0_18px_60px_rgba(0,0,0,0.45),0_0_0_1px_rgba(var(--xpot-gold),0.10)] ' +
  'hover:bg-[linear-gradient(180deg,rgba(var(--xpot-gold),0.22),rgba(var(--xpot-gold),0.10))] hover:brightness-[1.03] ' +
  'disabled:cursor-not-allowed disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] transition';

const CARD =
  'relative overflow-hidden rounded-[30px] border border-slate-900/70 bg-slate-950/45 shadow-[0_40px_140px_rgba(0,0,0,0.55)] backdrop-blur-xl';

// ─────────────────────────────────────────────
// Protocol constants
// ─────────────────────────────────────────────
const DISTRIBUTION_DAILY_XPOT = 1_000_000;
const DAYS_PER_YEAR = 365;
const TEN_YEARS_REQUIRED = DISTRIBUTION_DAILY_XPOT * DAYS_PER_YEAR * 10;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
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
    slate: 'border-slate-800/70 bg-slate-900/60 text-slate-200',
    emerald: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
    sky: 'border-sky-400/50 bg-sky-500/10 text-sky-100',
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

function formatMaybeNumber(n: unknown) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-US');
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function TokenomicsClient() {
  const prefersReducedMotion = useReducedMotion();

  // Supply math (no hooks causing prerender issues)
  const supply = 50_000_000_000;
  const DISTRIBUTION_RESERVE_PCT = 14;
  const DISTRIBUTION_RESERVE = supply * (DISTRIBUTION_RESERVE_PCT / 100);

  const yearsOfRunway = useCallback(
    (daily: number) => {
      if (!Number.isFinite(daily) || daily <= 0) return Infinity;
      return DISTRIBUTION_RESERVE / (daily * DAYS_PER_YEAR);
    },
    [DISTRIBUTION_RESERVE],
  );

  const runwayFixedYears = useMemo(
    () => yearsOfRunway(DISTRIBUTION_DAILY_XPOT),
    [yearsOfRunway],
  );

  return (
    <XpotPageShell>
      {/* Your existing JSX/UI goes here.
          This wrapper is now clean, client-safe, and build-safe. */}
    </XpotPageShell>
  );
}
