// app/tokenomics/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Blocks,
  Crown,
  ExternalLink,
  Flame,
  Gift,
  Lock,
  PieChart,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';

import XpotPageShell from '@/components/XpotPageShell';

type PillTone = 'slate' | 'emerald' | 'amber' | 'sky';

const ROUTE_HUB = '/hub';
const ROUTE_TERMS = '/terms';

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 transition';

const CARD =
  'relative overflow-hidden rounded-[30px] border border-slate-900/70 bg-slate-950/45 shadow-[0_40px_140px_rgba(0,0,0,0.55)] backdrop-blur-xl';

const VAULT_POLL_MS = 20_000;

// ✅ Protocol rule (fixed)
const DISTRIBUTION_DAILY_XPOT = 1_000_000;
const DAYS_PER_YEAR = 365;

// Exact 10y requirement at 1M/day
const TEN_YEARS_REQUIRED = DISTRIBUTION_DAILY_XPOT * DAYS_PER_YEAR * 10; // 3,650,000,000

function Pill({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: PillTone;
}) {
  const map: Record<PillTone, string> = {
    slate:
      'border-slate-800/70 bg-slate-900/60 text-slate-200 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]',
    emerald:
      'border-emerald-400/40 bg-emerald-500/10 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]',
    amber:
      'border-amber-400/50 bg-amber-500/10 text-amber-200 shadow-[0_0_0_1px_rgba(245,158,11,0.16)]',
    sky: 'border-sky-400/50 bg-sky-500/10 text-sky-100 shadow-[0_0_0_1px_rgba(56,189,248,0.16)]',
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

function Money({ value, suffix }: { value: string; suffix?: string }) {
  return (
    <div className="font-mono text-2xl font-semibold text-slate-100 sm:text-3xl">
      {value}
      {suffix ? <span className="ml-2 text-sm text-slate-400">{suffix}</span> : null}
    </div>
  );
}

type Allocation = {
  key: string;
  label: string;
  pct: number;
  note: string;
  tone: PillTone;
  detail: string;
};

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
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return null;
  return v.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

function timeAgo(tsMs: number) {
  const now = Date.now();
  const diff = Math.max(0, now - tsMs);
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);

  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return `${s}s ago`;
}

// ─────────────────────────────────────────────
// /api/vaults exact schema
// ─────────────────────────────────────────────
type ApiVaultTx = {
  signature: string;
  blockTime: number | null; // seconds
  err: unknown | null;
};

type ApiVaultEntry = {
  name: string;
  address: string; // owner wallet
  ata: string; // XPOT ATA
  balance:
    | {
        amount: string;
        uiAmount: number;
        decimals: number;
      }
    | null;
  recentTx: ApiVaultTx[];
};

type ApiVaultResponse = {
  mint: string;
  fetchedAt: number;
  groups: Record<string, ApiVaultEntry[]>;
};

function useVaultGroups() {
  const [data, setData] = useState<ApiVaultResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hadError, setHadError] = useState(false);

  useEffect(() => {
    let timer: number | null = null;
    let aborted = false;
    const ctrl = new AbortController();

    async function fetchVaults() {
      try {
        setHadError(false);

        const res = await fetch('/api/vaults', {
          signal: ctrl.signal,
          cache: 'no-store',
        });

        if (!res.ok) throw new Error(`vaults http ${res.status}`);

        const json = (await res.json()) as ApiVaultResponse;
        if (aborted) return;

        setData(json);
      } catch (e) {
        if ((e as any)?.name === 'AbortError') return;
        console.error('[XPOT] vault fetch error:', e);
        if (aborted) return;
        setHadError(true);
      } finally {
        if (!aborted) setIsLoading(false);
      }
    }

    function onVis() {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'visible') fetchVaults();
    }

    fetchVaults();
    timer = window.setInterval(fetchVaults, VAULT_POLL_MS);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis);
    }

    return () => {
      aborted = true;
      ctrl.abort();
      if (timer !== null) window.clearInterval(timer);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return { data, isLoading, hadError };
}

function VaultGroupPanel({
  title,
  groupKey,
  data,
  isLoading,
  hadError,
}: {
  title: string;
  groupKey: string;
  data: ApiVaultResponse | null;
  isLoading: boolean;
  hadError: boolean;
}) {
  const entries = useMemo(() => {
    const g = data?.groups?.[groupKey];
    return Array.isArray(g) ? g : [];
  }, [data, groupKey]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-800/70 bg-black/30 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{title}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Live balances and recent owner wallet transactions (auditable).
            {typeof data?.fetchedAt === 'number' ? (
              <span className="ml-2 text-slate-600">Updated {timeAgo(data.fetchedAt)}</span>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="rounded-full border border-slate-700/70 bg-slate-950/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
              Loading
            </span>
          ) : hadError ? (
            <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
              API issue
            </span>
          ) : (
            <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
              Live
            </span>
          )}
        </div>
      </div>

      {!entries.length ? (
        <div className="mt-3 rounded-lg border border-slate-800/70 bg-slate-950/60 p-3">
          <p className="text-xs text-slate-400">
            No vaults found for <span className="font-mono text-slate-200">{groupKey}</span>.
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Add entries under <span className="font-mono text-slate-200">XPOT_VAULTS.{groupKey}</span> in{' '}
            <span className="font-mono text-slate-200">lib/xpotVaults.ts</span>.
          </p>
        </div>
      ) : (
        <div className="mt-3 grid gap-3">
          {entries.map(v => {
            const ui = typeof v.balance?.uiAmount === 'number' ? v.balance.uiAmount : null;
            const decimals = typeof v.balance?.decimals === 'number' ? v.balance.decimals : null;

            return (
              <div
                key={`${groupKey}:${v.address}`}
                className="rounded-xl border border-slate-800/70 bg-slate-950/60 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100">
                      {v.name}
                      <span className="ml-2 text-xs font-normal text-slate-500">{shortAddr(v.address)}</span>
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <a
                        href={`https://solscan.io/account/${v.address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-slate-300 transition"
                      >
                        Owner <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => copy(v.address)}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300 hover:bg-white/[0.06] transition"
                        title="Copy owner address"
                      >
                        Copy owner
                      </button>

                      <span className="text-slate-700">•</span>

                      <a
                        href={`https://solscan.io/account/${v.ata}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-slate-300 transition"
                      >
                        ATA <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => copy(v.ata)}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300 hover:bg-white/[0.06] transition"
                        title="Copy token account (ATA)"
                      >
                        Copy ATA
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">XPOT balance</p>
                    <p className="mt-1 font-mono text-sm text-slate-100">
                      {ui == null ? '—' : `${formatMaybeNumber(ui) ?? '—'} XPOT`}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-600">
                      {decimals != null ? `Decimals: ${decimals}` : null}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Recent transactions</p>

                  {v.recentTx?.length ? (
                    <div className="mt-2 space-y-2">
                      {v.recentTx.slice(0, 5).map(tx => {
                        const tsMs = typeof tx.blockTime === 'number' ? tx.blockTime * 1000 : null;
                        const hasErr = tx.err != null;

                        return (
                          <div
                            key={tx.signature}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/60 bg-black/25 px-2.5 py-2"
                          >
                            <div className="min-w-0">
                              <a
                                href={`https://solscan.io/tx/${tx.signature}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-[11px] text-slate-200 hover:text-white transition"
                                title={tx.signature}
                              >
                                {shortAddr(tx.signature)}
                              </a>

                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                                {tsMs != null ? (
                                  <span>{timeAgo(tsMs)}</span>
                                ) : (
                                  <span className="text-slate-700">—</span>
                                )}
                                {hasErr ? (
                                  <span className="rounded-full border border-amber-400/35 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                                    Error
                                  </span>
                                ) : (
                                  <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                                    OK
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-right text-[11px] text-slate-500">Owner wallet activity</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">No recent transactions available.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TokenomicsPage() {
  const supply = 50_000_000_000;
  const decimals = 6;

  // Locked allocation set (your locked-in numbers)
  const DISTRIBUTION_RESERVE_PCT = 14;
  const DISTRIBUTION_RESERVE = supply * (DISTRIBUTION_RESERVE_PCT / 100); // 7,000,000,000

  function yearsOfRunway(daily: number) {
    if (!Number.isFinite(daily) || daily <= 0) return Infinity;
    return DISTRIBUTION_RESERVE / (daily * DAYS_PER_YEAR);
  }

  // ✅ Fixed, explicit table centered on 1,000,000/day
  const runwayTable = useMemo(
    () => [
      { label: '500,000 XPOT / day', daily: 500_000 },
      { label: '750,000 XPOT / day', daily: 750_000 },
      { label: '1,000,000 XPOT / day (fixed)', daily: 1_000_000, highlight: true as const },
      { label: '1,250,000 XPOT / day', daily: 1_250_000 },
      { label: '1,500,000 XPOT / day', daily: 1_500_000 },
    ],
    [],
  );

  // ✅ Keep your order exactly (not sorted)
  const allocation = useMemo<Allocation[]>(
    () => [
      {
        key: 'distribution',
        label: 'Protocol distribution reserve',
        pct: 14,
        note:
          'Pre-allocated XPOT reserved for long-term distribution. Released gradually via daily XPOT and future modules.',
        detail: `Protocol rule: ${fmtInt(DISTRIBUTION_DAILY_XPOT)} XPOT per day. Exact 10-year requirement: ${TEN_YEARS_REQUIRED.toLocaleString(
          'en-US',
        )} XPOT. No minting - unused reserve remains locked and auditable.`,
        tone: 'emerald',
      },
      {
        key: 'liquidity',
        label: 'Liquidity and market ops',
        pct: 26,
        note: 'LP depth, market resilience and controlled expansion across venues and pairs.',
        detail:
          'Used to seed and defend liquidity, reduce fragility and keep price discovery healthy. The goal is stability and trust, not hype.',
        tone: 'sky',
      },
      {
        key: 'treasury',
        label: 'Treasury and runway',
        pct: 23,
        note: 'Operational runway for audits, infra, legal and long-horizon execution.',
        detail:
          'This is operational runway (not the daily distribution runway). It funds security, infrastructure, compliance and long-term execution without touching the distribution reserve.',
        tone: 'slate',
      },
      {
        key: 'team',
        label: 'Team and builders',
        pct: 9,
        note: 'Vested, long horizon. Builders stay aligned with holders and protocol health.',
        detail:
          'Credibility comes from structure: a long cliff and slow linear vesting. Builders earn upside by shipping, not by selling into early liquidity.',
        tone: 'amber',
      },
      {
        key: 'partners',
        label: 'Partners and creators',
        pct: 8,
        note: 'Creator-gated drops, sponsor pools and performance-based distribution with accountability.',
        detail:
          'Reserved for collaborations that measurably grow participation and sponsor demand. Distribution should be trackable and tied to outcomes.',
        tone: 'sky',
      },
      {
        key: 'community',
        label: 'Community incentives',
        pct: 7,
        note: 'Streak rewards, referral boosts and reputation-based unlocks that feel earned.',
        detail:
          'Built for delight over farming: targeted incentives for real users and real momentum. Surprise rewards beat extractive grind loops.',
        tone: 'emerald',
      },
      {
        key: 'strategic',
        label: 'Strategic reserve',
        pct: 13,
        note: 'Locked buffer for unknowns: future opportunities, integrations and defensive planning.',
        detail:
          'This stays locked by default. If unlocked, it should be governed, transparent and reported with public wallets and clear purpose.',
        tone: 'slate',
      },
    ],
    [],
  );

  // Live vault groups
  const { data: vaultData, isLoading: vaultLoading, hadError: vaultError } = useVaultGroups();

  // Allocation key -> /api/vaults group key
  const VAULT_GROUP_BY_ALLOC_KEY: Record<string, string> = {
    distribution: 'rewards',
    liquidity: 'liquidityOps',
    treasury: 'treasury',
    team: 'team',
    partners: 'partners',
    community: 'community',
    strategic: 'strategic',
  };

  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <XpotPageShell
      title="Tokenomics"
      subtitle="XPOT is designed as a reward protocol with compounding network effects, not a one-off game."
      topBarProps={{
        pillText: 'TOKENOMICS',
        sloganRight: 'Protocol-grade distribution',
      }}
    >
      {/* HERO */}
<section className="mt-6">
  <div className={CARD}>
    <div
      className="
        pointer-events-none absolute -inset-48 opacity-85 blur-3xl
        bg-[radial-gradient(circle_at_15%_10%,rgba(16,185,129,0.22),transparent_55%),
            radial-gradient(circle_at_85%_15%,rgba(56,189,248,0.22),transparent_55%),
            radial-gradient(circle_at_80%_90%,rgba(245,158,11,0.16),transparent_60%)]
      "
    />

    <div className="relative z-10 p-6 lg:p-8">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT */}
        <div className="space-y-5 lg:col-span-7">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="emerald">
              <Sparkles className="h-3.5 w-3.5" />
              Reward protocol
            </Pill>
            <Pill tone="sky">
              <ShieldCheck className="h-3.5 w-3.5" />
              Public by handle
            </Pill>
            <Pill tone="amber">
              <Lock className="h-3.5 w-3.5" />
              Self-custody
            </Pill>
          </div>

          <h1 className="text-balance text-3xl font-semibold leading-tight sm:text-4xl">
            A distribution designed to outlast hype.
            <span className="text-emerald-300"> Rewards come first.</span>
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
            Traditional lottery and casino models extract value and hide it behind black boxes. XPOT flips the equation:
            rewards are the primitive, identity is public by handle and payouts are verifiable on-chain. Over time, this
            becomes infrastructure for creators, communities and sponsors to run daily rewards without becoming a casino.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href={ROUTE_HUB} className={`${BTN_PRIMARY} px-5 py-2.5 text-sm`}>
              Enter today&apos;s XPOT
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href={ROUTE_TERMS} className={`${BTN_UTILITY} px-5 py-2.5 text-sm`}>
              Terms
            </Link>
            <span className="text-[11px] text-slate-500">
              Allocation prioritizes rewards, resilience and long-term execution.
            </span>
          </div>

          {/* QUICK METRICS - fills the “empty” feel */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Supply</p>
              <p className="mt-2 font-mono text-lg font-semibold text-slate-100">
                {supply.toLocaleString('en-US')}
              </p>
              <p className="mt-1 text-xs text-slate-500">XPOT</p>
            </div>

            <div className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Decimals</p>
              <p className="mt-2 font-mono text-lg font-semibold text-slate-100">{decimals}</p>
              <p className="mt-1 text-xs text-slate-500">SPL standard</p>
            </div>

            <div className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Modeled daily</p>
              <p className="mt-2 font-mono text-lg font-semibold text-emerald-200">
                {fmtInt(DAILY_XPOT_TARGET)}
              </p>
              <p className="mt-1 text-xs text-slate-500">XPOT / day</p>
            </div>
          </div>
        </div>

        {/* RIGHT - MOSAIC (no tall empty gaps) */}
        <div className="lg:col-span-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
            {/* Supply - full width */}
            <div className="sm:col-span-2 rounded-2xl border border-slate-900/70 bg-slate-950/60 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Current supply</p>
              <Money value={supply.toLocaleString('en-US')} suffix="XPOT" />
              <p className="mt-2 text-xs text-slate-500">
                Decimals: <span className="font-mono text-slate-200">{decimals}</span>
              </p>

              <div className="mt-4 rounded-2xl border border-slate-900/70 bg-slate-950/50 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Supply integrity</p>

                <div className="mt-3 grid gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Lock className="h-4 w-4 text-emerald-300" />
                    Fixed supply - 50B minted, supply locked
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <ShieldCheck className="h-4 w-4 text-sky-300" />
                    Minting disabled - mint authority revoked
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <BadgeCheck className="h-4 w-4 text-amber-200" />
                    Metadata finalized - verifiable in explorer
                  </div>
                </div>

                <p className="mt-3 text-[11px] text-slate-500">
                  Everything above should be verifiable on-chain via Solscan and SPL tooling.
                </p>
              </div>
            </div>

            {/* Core promise */}
            <div className="rounded-2xl border border-slate-900/70 bg-slate-950/60 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Core promise</p>
              <p className="mt-2 text-sm text-slate-200">Daily rewards that grow into an ecosystem</p>
              <div className="mt-3 grid gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <BadgeCheck className="h-4 w-4 text-emerald-300" />
                  On-chain payout verification
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Users className="h-4 w-4 text-sky-300" />
                  Public identity by X handle
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Blocks className="h-4 w-4 text-amber-200" />
                  Modules can plug in later
                </div>
              </div>
            </div>

            {/* North star */}
            <div className="rounded-2xl border border-slate-900/70 bg-slate-950/60 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">North star</p>
              <p className="mt-2 text-sm text-slate-200">Become the daily rewards layer for the internet</p>
              <p className="mt-2 text-xs text-slate-500">
                Disruption comes from transparency, repeatability and sponsor-friendly distribution.
              </p>

              <div className="mt-4 rounded-xl border border-slate-900/70 bg-slate-950/55 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Principle</p>
                <p className="mt-2 text-sm text-slate-200">Proof is the product.</p>
                <p className="mt-2 text-xs text-slate-500">
                  If it cannot be audited, it should not exist.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
      {/* DISTRIBUTION */}
      <section className="mt-8">
        <div className={CARD}>
          <div
            className="
              pointer-events-none absolute -inset-40 opacity-70 blur-3xl
              bg-[radial-gradient(circle_at_10%_30%,rgba(56,189,248,0.18),transparent_60%),
                  radial-gradient(circle_at_90%_70%,rgba(16,185,129,0.18),transparent_60%)]
            "
          />
          <div className="relative z-10 p-6 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-100">Distribution map</p>
                <p className="mt-1 text-xs text-slate-400">
                  Tap any row to expand details and live vaults.
                </p>
              </div>
              <Pill tone="sky">
                <PieChart className="h-3.5 w-3.5" />
                Distribution
              </Pill>
            </div>

            <div className="mt-6 space-y-3">
              {allocation.map(a => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setOpenKey(k => (k === a.key ? null : a.key))}
                  className="group w-full rounded-2xl border border-slate-900/70 bg-slate-950/55 px-4 py-4 text-left hover:bg-slate-950/70 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Pill tone={a.tone}>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                        {a.pct}%
                      </Pill>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-100">{a.label}</p>
                        <p className="mt-0.5 text-xs text-slate-500">Tap to expand</p>
                      </div>
                    </div>

                    <div className="w-full max-w-[260px]">
                      <div className="h-2 rounded-full bg-slate-900/70">
                        <motion.div
                          className="h-2 rounded-full bg-emerald-400/70"
                          initial={false}
                          animate={{ width: pctToBar(a.pct) }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {openKey === a.key && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 rounded-2xl border border-slate-900/70 bg-slate-950/50 p-4">
                          <p className="text-sm text-slate-200">{a.note}</p>
                          <p className="mt-2 text-xs text-slate-500">{a.detail}</p>

                          {a.key === 'distribution' && (
                            <div className="mt-4 rounded-xl border border-slate-800/70 bg-black/30 p-3">
                              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                                Distribution runway table
                              </p>

                              <div className="mt-3 space-y-2">
                                {runwayTable.map(r => {
                                  const years = yearsOfRunway(r.daily);
                                  return (
                                    <div
                                      key={r.label}
                                      className={[
                                        'flex items-center justify-between rounded-lg px-3 py-2 text-xs',
                                        r.highlight
                                          ? 'bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-400/30'
                                          : 'bg-slate-950/60 text-slate-300',
                                      ].join(' ')}
                                    >
                                      <span className="font-mono">{r.label}</span>
                                      <span className="font-semibold">{years.toFixed(2)} years</span>
                                    </div>
                                  );
                                })}
                              </div>

                              <p className="mt-3 text-[11px] text-slate-500">
                                Reserve size: {DISTRIBUTION_RESERVE.toLocaleString('en-US')} XPOT (14% of supply). Daily distribution is fixed at{' '}
                                {fmtInt(DISTRIBUTION_DAILY_XPOT)} XPOT. Minting disabled. Unused reserve remains locked.
                              </p>
                            </div>
                          )}

                          <VaultGroupPanel
                            title="Vaults (live)"
                            groupKey={VAULT_GROUP_BY_ALLOC_KEY[a.key] ?? a.key}
                            data={vaultData}
                            isLoading={vaultLoading}
                            hadError={vaultError}
                          />

                          <p className="mt-3 text-[11px] text-slate-600">
                            Implementation: dedicated vaults, timelocks and public wallets so allocations stay auditable.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* UTILITY + LONG-TERM */}
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className={CARD}>
          <div
            className="
              pointer-events-none absolute -inset-44 opacity-75 blur-3xl
              bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.18),transparent_60%),
                  radial-gradient(circle_at_90%_70%,rgba(16,185,129,0.16),transparent_60%)]
            "
          />
          <div className="relative z-10 p-6 lg:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">Utility map</p>
                <p className="mt-1 text-xs text-slate-400">Why hold XPOT when you could just watch?</p>
              </div>
              <Pill tone="emerald">
                <TrendingUp className="h-3.5 w-3.5" />
                Flywheel
              </Pill>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <Gift className="h-4 w-4 text-emerald-300" />
                  Eligibility
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Holding XPOT is the requirement to claim entry. No purchases, no ticket sales and no casino vibes.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <Crown className="h-4 w-4 text-amber-200" />
                  Status and reputation
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Your handle becomes a public identity. Wins, streaks and participation can build a profile that unlocks future
                  perks and sponsor drops.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <Flame className="h-4 w-4 text-sky-300" />
                  Sponsor-funded rewards
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Brands buy XPOT to fund bonus drops. Holders get value, sponsors get measurable attention and the protocol grows
                  without selling tickets.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Transparency edge
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Casinos win by opacity. XPOT wins by verifiability. Over time, that becomes a trust moat.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={CARD}>
          <div className="relative z-10 p-6 lg:p-8">
            <p className="text-sm font-semibold text-slate-100">Long-term: why this can disrupt</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              The endgame is not “a meme draw”. The endgame is a protocol that communities and brands plug into for daily rewards
              with identity and transparency baked in.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link href="/roadmap" className={`${BTN_UTILITY} px-5 py-2.5 text-sm`}>
                View roadmap
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <a
                href="https://solscan.io"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/70 px-5 py-2.5 text-sm text-slate-200 hover:bg-slate-900 transition"
              >
                Token explorer
                <ExternalLink className="h-4 w-4 text-slate-500" />
              </a>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Principle</p>
              <p className="mt-2 text-sm text-slate-200">Proof is the product.</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Every distribution bucket can be mapped to wallets, ATAs and on-chain history. If it cannot be audited, it should
                not exist.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-10 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-slate-400" />
            Tokenomics is premium-first: simple, verifiable and sponsor-friendly.
          </span>
          <span className="font-mono text-slate-600">build: tokenomics-v7</span>
        </div>
      </footer>
    </XpotPageShell>
  );
}
