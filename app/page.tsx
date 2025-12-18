// app/page.tsx
'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Lock,
  ShieldCheck,
  Sparkles,
  Stars,
  Users,
  Zap,
} from 'lucide-react';

import JackpotPanel from '@/components/JackpotPanel';
import BonusStrip from '@/components/BonusStrip';
import XpotPageShell from '@/components/XpotPageShell';

const ROUTE_HUB = '/hub';
const ROUTE_OPS = '/ops';
const ROUTE_TERMS = '/terms';

const XPOT_CA =
  process.env.NEXT_PUBLIC_XPOT_MINT ||
  process.env.NEXT_PUBLIC_XPOT_CA ||
  'FYeJCZvfzwUcFLq7mr82zJFu8qvoJ3kQB3W1kd1Ejko1';

const SOLANA_CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || '';

const SAMPLE_HANDLES = [
  'DeWala_222222',
  'CryptoNox',
  'XPOTMaxi',
  'ChartHermit',
  'SolanaSignals',
  'LoopMode',
  'BlockByBlock',
  'FlowStateTrader',
  'HypeEngineer',
  'LatencyLord',
  'AlphaSmith',
  'CandleChaser',
];

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_GREEN =
  'inline-flex items-center justify-center rounded-full bg-emerald-400 text-slate-950 font-semibold shadow-[0_18px_60px_rgba(16,185,129,0.45)] hover:bg-emerald-300 transition';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 transition';

function Pill({
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
    amber:
      'border-amber-400/50 bg-amber-500/10 text-amber-200 shadow-[0_0_0_1px_rgba(245,158,11,0.16)]',
    sky: 'border-sky-400/50 bg-sky-500/10 text-sky-100 shadow-[0_0_0_1px_rgba(56,189,248,0.16)]',
    violet:
      'border-violet-400/45 bg-violet-500/10 text-violet-200 shadow-[0_0_0_1px_rgba(139,92,246,0.16)]',
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${map[tone]}`}
    >
      {children}
    </span>
  );
}

function PremiumShell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        'relative overflow-hidden rounded-[36px] border border-slate-900/70',
        'bg-slate-950/45 shadow-[0_40px_140px_rgba(0,0,0,0.65)] backdrop-blur-xl',
        className,
      ].join(' ')}
    >
      <div
        className="
          pointer-events-none absolute -inset-40 opacity-85 blur-3xl
          bg-[radial-gradient(circle_at_12%_10%,rgba(16,185,129,0.18),transparent_55%),
              radial-gradient(circle_at_86%_18%,rgba(139,92,246,0.20),transparent_58%),
              radial-gradient(circle_at_78%_92%,rgba(56,189,248,0.14),transparent_60%)]
        "
      />
      <div className="relative z-10">{children}</div>
    </section>
  );
}

function shortenAddress(addr: string, left = 6, right = 6) {
  if (!addr) return '';
  if (addr.length <= left + right + 3) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}

function getSolscanTokenUrl(mint: string) {
  const base = `https://solscan.io/token/${mint}`;
  if (!SOLANA_CLUSTER) return base;
  if (SOLANA_CLUSTER === 'devnet') return `${base}?cluster=devnet`;
  return base;
}

function RoyalContractBar({ mint }: { mint: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(mint);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className="
          relative inline-flex items-center gap-3
          rounded-full border border-emerald-400/25 bg-slate-950/60
          px-3.5 py-2
          shadow-[0_18px_70px_rgba(16,185,129,0.12)]
          backdrop-blur-md
        "
        title={mint}
      >
        <div
          className="
            pointer-events-none absolute -inset-10 rounded-full opacity-60 blur-2xl
            bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.22),transparent_60%),
                radial-gradient(circle_at_80%_30%,rgba(245,158,11,0.10),transparent_55%)]
          "
        />

        <span className="relative z-10 inline-flex items-center gap-2">
          <span
            className="
              inline-flex h-7 w-7 items-center justify-center rounded-full
              border border-emerald-400/20 bg-emerald-500/10
              shadow-[0_0_18px_rgba(16,185,129,0.20)]
            "
          >
            <ShieldCheck className="h-4 w-4 text-emerald-200" />
          </span>

          <span className="flex flex-col leading-tight">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200/90">
              Official CA
            </span>
            <span className="font-mono text-[12px] text-slate-100/90">
              {shortenAddress(mint, 6, 6)}
            </span>
          </span>
        </span>

        <span className="relative z-10 h-6 w-px bg-white/10" />

        <button
          type="button"
          onClick={onCopy}
          className="
            relative z-10 inline-flex items-center gap-2
            rounded-full border border-white/10 bg-white/[0.03]
            px-3 py-1.5 text-[11px] text-slate-200
            hover:bg-white/[0.06] transition
          "
          title="Copy official contract address"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-300" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-slate-300" />
              Copy
            </>
          )}
        </button>
      </div>

      <Link
        href={getSolscanTokenUrl(mint)}
        target="_blank"
        className="
          inline-flex items-center gap-2 rounded-full
          border border-slate-800/80 bg-slate-950/60
          px-3.5 py-2 text-[11px] text-slate-200
          hover:bg-slate-900/60 transition
        "
        title="Open in Solscan"
      >
        Explorer
        <ExternalLink className="h-4 w-4 text-slate-400" />
      </Link>
    </div>
  );
}

function HandleTicker({ handles }: { handles: string[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-slate-900/70 bg-slate-950/55 px-2 py-2 shadow-[0_18px_60px_rgba(15,23,42,0.65)]">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#02020a] via-[#02020a]/80 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#02020a] via-[#02020a]/80 to-transparent" />

      <motion.div
        className="flex gap-2 pr-10"
        animate={reduceMotion ? undefined : { x: ['0%', '-50%'] }}
        transition={reduceMotion ? undefined : { duration: 34, ease: 'linear', repeat: Infinity }}
      >
        {[0, 1].map(loop => (
          <div key={loop} className="flex gap-2">
            {handles.map(handle => {
              const clean = handle.replace(/^@/, '');
              const initial = clean.charAt(0).toUpperCase();

              return (
                <div
                  key={`${loop}-${handle}`}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-800/70 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-100/90 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]"
                >
                  <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-slate-100">
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                    {initial}
                  </span>
                  <span className="font-mono text-[11px] opacity-80">@{clean}</span>
                </div>
              );
            })}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function HomePage() {
  const marquee = useMemo(() => [...SAMPLE_HANDLES], []);
  const [mint, setMint] = useState(XPOT_CA);

  useEffect(() => setMint(XPOT_CA), []);

  const runwayTooltip =
    "Funded for 10+ years of daily XPOT rewards.\nSeeded from the XPOT Rewards Reserve at launch: 1,000,000 XPOT/day baseline for 10+ years.\nPaid in XPOT, on-chain, and auditable.";

  return (
    <XpotPageShell>
      {/* HERO - calm, premium, simple */}
      <section className="mt-6">
        <PremiumShell>
          <div className="px-6 py-8 lg:px-10 lg:py-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
              {/* Left: brand statement */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="sky">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
                    Identity: @handle
                  </Pill>
                  <Pill tone="emerald">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                    Paid on-chain
                  </Pill>
                  <Pill tone="violet">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_10px_rgba(167,139,250,0.9)]" />
                    Protocol layer
                  </Pill>
                </div>

                <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.04] sm:text-5xl">
                  One protocol. One identity.
                  <span className="text-emerald-300"> One daily XPOT draw.</span>
                </h1>

                <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
                  Hold XPOT, connect X and claim your entry. One winner daily, paid on-chain in XPOT.
                  Built to scale into sponsor pools, creator drops and community rewards.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link href={ROUTE_HUB} className={`${BTN_GREEN} group px-6 py-3 text-sm`}>
                    Enter today&apos;s XPOT
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>

                  <Link href={ROUTE_TERMS} className={`${BTN_UTILITY} px-5 py-3 text-sm`}>
                    Terms
                  </Link>

                  <Link
                    href={ROUTE_OPS}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/70 px-5 py-3 text-sm text-slate-200 hover:bg-slate-900 transition"
                  >
                    <Lock className="h-4 w-4 text-amber-200" />
                    Operations Center
                  </Link>
                </div>

                <p className="mt-3 text-[11px] text-slate-500">
                  Winners revealed by <span className="font-semibold text-slate-200">X handle</span>, never by wallet.
                </p>

                <div className="mt-6">
                  <RoyalContractBar mint={mint} />
                </div>
              </div>

              {/* Right: Bonus strip (compact) */}
              <div className="min-w-0">
                <div className="rounded-[30px] border border-slate-900/70 bg-slate-950/40 p-5 shadow-[0_30px_110px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                      Entry mechanics
                    </p>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
                      same entry
                    </span>
                  </div>

                  <div className="mt-4 rounded-[26px] border border-emerald-400/20 bg-slate-950/55 p-3 shadow-[0_22px_90px_rgba(16,185,129,0.10)]">
                    <div className="mb-2 flex items-center justify-between px-2">
                      <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200/80">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inset-0 rounded-full bg-emerald-400/70 animate-ping" />
                          <span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                        </span>
                        Bonus XPOT
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">live schedule</span>
                    </div>

                    <BonusStrip variant="home" />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-900/70 bg-slate-950/65 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Qualification</p>
                      <p className="mt-1 text-sm font-semibold text-slate-100">Hold XPOT</p>
                    </div>

                    <div className="rounded-2xl border border-slate-900/70 bg-slate-950/65 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Identity</p>
                      <p className="mt-1 text-sm font-semibold text-slate-100">@handle</p>
                    </div>

                    <div className="rounded-2xl border border-slate-900/70 bg-slate-950/65 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Proof</p>
                      <p className="mt-1 text-sm font-semibold text-slate-100">On-chain</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Wide flagship panel */}
            <div className="mt-8 rounded-[34px] border border-slate-900/70 bg-slate-950/40 p-5 shadow-[0_40px_140px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Live XPOT engine</p>
                  <p className="mt-1 text-xs text-slate-400">Pool value, momentum and observed range (via Jupiter).</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="emerald">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                    10+ year runway
                  </Pill>
                  <Pill tone="sky">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.9)] animate-pulse" />
                    Live
                  </Pill>
                </div>
              </div>

              <div className="mt-4">
                <JackpotPanel
                  variant="embedded"
                  layout="wide"
                  badgeLabel="10+ year runway"
                  badgeTooltip={runwayTooltip}
                />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Link href={ROUTE_HUB} className={`${BTN_PRIMARY} px-5 py-2.5 text-sm`}>
                  Enter now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <span className="text-[11px] text-slate-500">Entries happen in the hub. This page stays calm and premium.</span>
              </div>
            </div>

            {/* Quiet social proof strip */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-600">Live entries</p>
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-700">handles only</p>
              </div>
              <HandleTicker handles={marquee} />
              <p className="mt-2 text-[11px] text-slate-500">Wallets stay self-custody. Identity is by handle.</p>
            </div>

            {/* Three premium value cards */}
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              <div className="rounded-[28px] border border-slate-900/70 bg-slate-950/45 p-6 shadow-[0_26px_90px_rgba(0,0,0,0.40)]">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-950/30">
                    <ShieldCheck className="h-5 w-5 text-emerald-200" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Qualification</p>
                    <p className="text-xs text-slate-400">No purchases. No tickets.</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  Holding XPOT is the requirement to enter. Simple surface area, clean rules.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-900/70 bg-slate-950/45 p-6 shadow-[0_26px_90px_rgba(0,0,0,0.40)]">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-500/25 bg-sky-950/25">
                    <Users className="h-5 w-5 text-sky-200" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Identity</p>
                    <p className="text-xs text-slate-400">Public by handle.</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  Winners are announced by X handle. Wallet stays self-custody and private by default.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-900/70 bg-slate-950/45 p-6 shadow-[0_26px_90px_rgba(0,0,0,0.40)]">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-950/20">
                    <Stars className="h-5 w-5 text-amber-200" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Proof</p>
                    <p className="text-xs text-slate-400">On-chain outcomes.</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  Payouts are verifiable in an explorer. Proof is the product.
                </p>
              </div>
            </div>
          </div>
        </PremiumShell>
      </section>

      {/* Footer */}
      <footer className="mt-8 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-slate-400" />
            Pre-Launch Mode. UI is final, wiring continues.
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={ROUTE_OPS}
              className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/70 px-3 py-1.5 text-[11px] text-slate-300 hover:bg-slate-900 transition"
            >
              <Lock className="h-3.5 w-3.5 text-amber-200" />
              Ops
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            </Link>

            <span className="font-mono text-slate-600">build: premium-home-v2</span>
          </div>
        </div>
      </footer>
    </XpotPageShell>
  );
}
