// app/tokenomics/TokenomicsClient.tsx
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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

// ✅ Gold helpers (same pattern as home page)
const GOLD_TEXT = 'text-[rgb(var(--xpot-gold-2))]';
const GOLD_BORDER = 'border-[rgba(var(--xpot-gold),0.35)]';
const GOLD_BG_WASH = 'bg-[rgba(var(--xpot-gold),0.06)]';
const GOLD_RING_SHADOW = 'shadow-[0_0_0_1px_rgba(var(--xpot-gold),0.10)]';

// ✅ Buttons (updated)
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

const VAULT_POLL_MS = 20_000;

// Protocol rule (fixed)
const DISTRIBUTION_DAILY_XPOT = 1_000_000;
const DAYS_PER_YEAR = 365;

// Exact 10y requirement at 1M/day
const TEN_YEARS_REQUIRED = DISTRIBUTION_DAILY_XPOT * DAYS_PER_YEAR * 10; // 3,650,000,000

// ─────────────────────────────────────────────
// ✅ Team vesting (Streamflow) - on-chain proof targets
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

// Safer tone colors (amber has fallback if CSS var is missing/invalid)
function toneStroke(tone: PillTone) {
  if (tone === 'emerald') return 'rgba(16,185,129,0.78)';
  if (tone === 'sky') return 'rgba(56,189,248,0.78)';
  if (tone === 'amber') return 'rgba(250,204,21,0.78)'; // fallback gold
  return 'rgba(148,163,184,0.68)'; // slate
}

function toneGlow(tone: PillTone) {
  if (tone === 'emerald') return 'rgba(16,185,129,0.22)';
  if (tone === 'sky') return 'rgba(56,189,248,0.20)';
  if (tone === 'amber') return 'rgba(250,204,21,0.18)';
  return 'rgba(148,163,184,0.16)';
}

function toneRing(tone: PillTone) {
  if (tone === 'emerald') return 'rgba(16,185,129,0.22)';
  if (tone === 'sky') return 'rgba(56,189,248,0.20)';
  if (tone === 'amber') return 'rgba(250,204,21,0.16)';
  return 'rgba(148,163,184,0.18)';
}

// ─────────────────────────────────────────────
// ✅ Silent copy (no UI feedback)
// ─────────────────────────────────────────────
function SilentCopyButton({ text, className, title }: { text: string; className?: string; title?: string }) {
  async function copyNow() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // silent by design
    }
  }

  return (
    <button
      type="button"
      onClick={copyNow}
      className={
        className ??
        'inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300 hover:bg-white/[0.06] transition'
      }
      title={title ?? 'Copy'}
      aria-label={title ?? 'Copy'}
    >
      <Copy className="h-3.5 w-3.5 text-slate-400" />
      Copy
    </button>
  );
}

// ─────────────────────────────────────────────
// Team vesting (12 months, monthly equal amounts)
// + ✅ on-chain Streamflow proof panel
// ─────────────────────────────────────────────
function TeamVestingPanel({ totalTeamTokens }: { totalTeamTokens: number }) {
  const months = 12;
  const perMonth = totalTeamTokens / months;

  const rows = useMemo(() => {
    const out: { m: number; monthly: number; cumulative: number; pct: number }[] = [];
    let cum = 0;
    for (let i = 1; i <= months; i++) {
      cum += perMonth;
      out.push({
        m: i,
        monthly: perMonth,
        cumulative: cum,
        pct: (cum / totalTeamTokens) * 100,
      });
    }
    return out;
  }, [perMonth, totalTeamTokens]);

  const maxMonthly = perMonth || 1;
  const w = 560;
  const h = 170;
  const pad = 18;
  const barW = (w - pad * 2) / months;

  const points = rows
    .map((r, idx) => {
      const x = pad + barW * idx + barW / 2;
      const y = pad + (1 - r.pct / 100) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const streamflowUrl = getStreamflowContractUrl(TEAM_VESTING.contractAccount);

  return (
    <div className="mt-4 rounded-2xl border border-slate-800/70 bg-black/30 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Team vesting schedule</p>
          <p className="mt-1 text-[11px] text-slate-500">
            12 months, monthly equal unlocks. Schedule math below matches the on-chain vesting behaviour.
          </p>
        </div>
        <span className="rounded-full border border-[rgba(var(--xpot-gold),0.30)] bg-[rgba(var(--xpot-gold),0.08)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--xpot-gold-2))]">
          12M linear
        </span>
      </div>

      {/* ✅ On-chain proof block */}
      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">On-chain vesting</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">Streamflow contract (public)</p>
            <p className="mt-1 text-xs text-slate-500">
              Tokens are held by the vesting contract (escrow) and unlock monthly to the payout wallet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={streamflowUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/15 transition"
            >
              View on Streamflow <ExternalLink className="ml-2 h-4 w-4" />
            </a>

            <a
              href={`https://solscan.io/account/${TEAM_VESTING.contractAccount}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.06] transition"
            >
              Contract on Solscan <ExternalLink className="ml-2 h-4 w-4 text-slate-400" />
            </a>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {[
            { k: 'Sender (team wallet)', v: TEAM_VESTING.senderWallet },
            { k: 'Recipient (payout wallet)', v: TEAM_VESTING.recipientWallet },
            { k: 'Contract (escrow)', v: TEAM_VESTING.contractAccount },
          ].map(row => (
            <div
              key={row.k}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{row.k}</p>
                <p className="mt-1 font-mono text-xs text-slate-200">{row.v}</p>
              </div>

              <SilentCopyButton text={row.v} title="Copy address" />
            </div>
          ))}
        </div>

        <p className="mt-3 text-[11px] text-slate-600">
          Important: the “Team” wallet balance will look lower after vesting creation because the tokens moved into escrow. That is expected.
        </p>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Monthly unlock</p>
              <p className="mt-1 font-mono text-lg font-semibold text-[rgb(var(--xpot-gold-2))]">
                {fmtInt(perMonth)} <span className="text-xs text-slate-500">XPOT</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Total vested</p>
              <p className="mt-1 font-mono text-sm font-semibold text-slate-100">{fmtInt(totalTeamTokens)} XPOT</p>
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-800/70 bg-black/25">
            <div className="w-full overflow-x-auto">
              <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
                <defs>
                  <linearGradient id="teamBars" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(var(--xpot-gold),0.85)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.10)" />
                  </linearGradient>
                </defs>

                <rect x="0" y="0" width={w} height={h} fill="rgba(2,2,10,0.35)" />

                {[0.25, 0.5, 0.75].map(p => (
                  <line
                    key={p}
                    x1={pad}
                    x2={w - pad}
                    y1={pad + p * (h - pad * 2)}
                    y2={pad + p * (h - pad * 2)}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="1"
                  />
                ))}

                {rows.map(r => {
                  const x = pad + barW * (r.m - 1) + 5;
                  const barH = (r.monthly / maxMonthly) * (h - pad * 2);
                  const y = h - pad - barH;
                  const bw = Math.max(6, barW - 10);
                  return <rect key={r.m} x={x} y={y} width={bw} height={barH} rx="8" fill="url(#teamBars)" opacity="0.9" />;
                })}

                <polyline points={points} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />

                {rows.map(r => {
                  const idx = r.m - 1;
                  const x = pad + barW * idx + barW / 2;
                  const y = pad + (1 - r.pct / 100) * (h - pad * 2);
                  return <circle key={r.m} cx={x} cy={y} r="3.2" fill="rgba(255,255,255,0.70)" />;
                })}
              </svg>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-600">
            Bars = monthly unlock. Line = cumulative vested %. Your actual vesting is verifiable via the Streamflow and Solscan buttons above.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Schedule</p>

          <div className="mt-3 grid gap-2">
            {rows.map(r => (
              <div key={r.m} className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-black/25 px-3 py-2 text-xs">
                <span className="font-mono text-slate-300">Month {r.m}</span>
                <span className="font-mono text-slate-200">{fmtInt(r.monthly)} XPOT</span>
                <span className="text-slate-500">{r.pct.toFixed(0)}%</span>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-2xl border border-slate-800/70 bg-black/25 p-3">
            <p className="text-xs text-slate-300">Simple rule: no cliffs, no tricks.</p>
            <p className="mt-1 text-[11px] text-slate-500">1/12 unlocks monthly, equal amounts.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// /api/vaults exact schema (expanded - uiAmount is often null)
type ApiVaultTx = {
  signature: string;
  blockTime: number | null; // seconds
  err: unknown | null;
};

type ApiVaultEntry = {
  name: string;
  address: string; // wallet
  ata: string; // XPOT ATA (we intentionally don't show this in UI)
  balance:
    | {
        amount: string; // raw integer in string
        uiAmount: number | null; // Solana often returns null for large balances
        uiAmountString?: string; // use this when uiAmount is null
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

function formatRawAmount(amountStr: string, decimals: number) {
  try {
    const raw = BigInt(amountStr || '0');
    const d = Math.max(0, Math.min(18, Number.isFinite(decimals) ? decimals : 0));
    if (d === 0) return raw.toString();

    const base = BigInt(10) ** BigInt(d);
    const whole = raw / base;
    const frac = raw % base;

    const fracPadded = frac.toString().padStart(d, '0');
    const fracTrimmed = fracPadded.replace(/0+$/, '');

    if (!fracTrimmed) return whole.toString();
    return `${whole.toString()}.${fracTrimmed}`;
  } catch {
    return null;
  }
}

function formatVaultBalance(b: ApiVaultEntry['balance']) {
  if (!b) return null;

  if (typeof b.uiAmount === 'number' && Number.isFinite(b.uiAmount)) {
    return formatMaybeNumber(b.uiAmount) ?? null;
  }

  if (typeof b.uiAmountString === 'string' && b.uiAmountString.trim().length) {
    return b.uiAmountString;
  }

  if (typeof b.amount === 'string' && typeof b.decimals === 'number') {
    return formatRawAmount(b.amount, b.decimals);
  }

  return null;
}

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

  return (
    <div className="mt-4 rounded-2xl border border-slate-800/70 bg-black/30 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{title}</p>
          <p className="mt-1 text-[11px] text-slate-500">Live balances plus latest on-chain transactions for this vault.</p>
        </div>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="rounded-full border border-slate-700/70 bg-slate-950/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
              Loading
            </span>
          ) : hadError ? (
            <span className="rounded-full border border-[rgba(var(--xpot-gold),0.30)] bg-[rgba(var(--xpot-gold),0.08)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--xpot-gold-2))]">
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
        <div className="mt-3 rounded-xl border border-slate-800/70 bg-slate-950/60 p-3">
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
            const balanceText = formatVaultBalance(v.balance);
            const decimals = typeof v.balance?.decimals === 'number' ? v.balance.decimals : null;

            return (
              <div key={`${groupKey}:${v.address}`} className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100">
                      {v.name}
                      <span className="ml-2 text-xs font-normal text-slate-500">{shortAddr(v.address)}</span>
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                        <Wallet className="h-3.5 w-3.5 text-slate-400" />
                        Wallet
                      </span>

                      <a
                        href={`https://solscan.io/account/${v.address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-slate-300 transition"
                      >
                        View <ExternalLink className="h-3.5 w-3.5" />
                      </a>

                      <SilentCopyButton
                        text={v.address}
                        title="Copy wallet address"
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300 hover:bg-white/[0.06] transition"
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">XPOT balance</p>
                    <p className="mt-1 font-mono text-sm text-slate-100">{balanceText ? `${balanceText} XPOT` : '—'}</p>
                    <p className="mt-1 text-[11px] text-slate-600">{decimals != null ? `Decimals: ${decimals}` : null}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-800/60 bg-black/25 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                        <ListChecks className="h-4 w-4 text-slate-300" />
                      </span>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Transactions</p>
                        <p className="text-[11px] text-slate-500">Most recent on-chain signatures (Solscan)</p>
                      </div>
                    </div>

                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                      TX
                    </span>
                  </div>

                  {v.recentTx?.length ? (
                    <div className="mt-3 grid gap-2">
                      {v.recentTx.slice(0, 3).map(tx => {
                        const tsMs = typeof tx.blockTime === 'number' ? tx.blockTime * 1000 : null;
                        const hasErr = tx.err != null;

                        return (
                          <a
                            key={tx.signature}
                            href={`https://solscan.io/tx/${tx.signature}`}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/70 bg-slate-950/45 px-3 py-2 transition hover:bg-slate-950/60"
                            title={tx.signature}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] text-slate-200 group-hover:text-white transition">
                                  {shortAddr(tx.signature)}
                                </span>
                                <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 transition" />
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                                  {tsMs != null ? timeAgo(tsMs) : '—'}
                                </span>

                                {hasErr ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(var(--xpot-gold),0.30)] bg-[rgba(var(--xpot-gold),0.08)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--xpot-gold-2))]">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Error
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    OK
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-right text-[11px] text-slate-500">
                              Opens on Solscan
                              <div className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-slate-600">Signature</div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">No recent transactions available.</p>
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

function getStickyOffsetPx() {
  if (typeof window === 'undefined') return 240;
  const root = document.documentElement;
  const css = getComputedStyle(root);

  const banner = parseFloat(css.getPropertyValue('--xpot-banner-h')) || 0;
  const topbar = parseFloat(css.getPropertyValue('--xpot-topbar-h')) || 0;

  const pad = 18;
  return Math.max(0, Math.round(banner + topbar + pad));
}

function DonutAllocation({
  items,
  selectedKey,
  onSelect,
  openKey,
  setOpenKey,
  setPendingScrollKey,
  vaultData,
  vaultLoading,
  vaultError,
  vaultGroupByAllocKey,
  runwayTable,
  yearsOfRunway,
  distributionReserve,
  getCardRef,
  teamTotalTokens,
}: {
  items: Allocation[];
  selectedKey: string | null;
  onSelect: (key: string) => void;

  openKey: string | null;
  setOpenKey: (fn: (k: string | null) => string | null) => void;
  setPendingScrollKey: (key: string | null) => void;

  vaultData: ApiVaultResponse | null;
  vaultLoading: boolean;
  vaultError: boolean;
  vaultGroupByAllocKey: Record<string, string>;

  runwayTable: { label: string; daily: number; highlight?: true }[];
  yearsOfRunway: (daily: number) => number;
  distributionReserve: number;

  getCardRef: (key: string) => (el: HTMLDivElement | null) => void;

  teamTotalTokens: number;
}) {
  const reduceMotion = useReducedMotion();

  const size = 380;
  const r = 148;
  const c = 2 * Math.PI * r;

  const segments = useMemo(() => {
    const total = items.reduce((sum, it) => sum + (Number.isFinite(it.pct) ? it.pct : 0), 0) || 100;
    let acc = 0;
    return items.map(it => {
      const pct = Math.max(0, it.pct);
      const len = (pct / total) * c;
      const offset = (acc / total) * c;
      acc += pct;

      return {
        key: it.key,
        pct: it.pct,
        tone: it.tone,
        dasharray: `${len} ${Math.max(0, c - len)}`,
        dashoffset: `${-offset}`,
      };
    });
  }, [items, c]);

  const selected = useMemo(() => items.find(i => i.key === selectedKey) ?? items[0] ?? null, [items, selectedKey]);

  return (
    <div className="relative rounded-[26px] border border-slate-900/70 bg-slate-950/55 p-5 shadow-[0_30px_110px_rgba(0,0,0,0.45)] backdrop-blur">
      {/* ... unchanged ... */}
      {/* (Rest of your JSX is unchanged from what you pasted) */}
    </div>
  );
}

export default function TokenomicsClient() {
  const searchParams = useSearchParams();
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
  const runwayFixedDays = useMemo(() => Math.floor(DISTRIBUTION_RESERVE / DISTRIBUTION_DAILY_XPOT), [DISTRIBUTION_RESERVE]);

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

  const allocation = useMemo<Allocation[]>(
    () => [
      {
        key: 'distribution',
        label: 'Protocol distribution reserve',
        pct: 14,
        note: 'Pre-allocated XPOT reserved for long-term distribution.',
        detail: `Protocol rule: ${fmtInt(DISTRIBUTION_DAILY_XPOT)} XPOT per day. Exact 10-year requirement: ${TEN_YEARS_REQUIRED.toLocaleString(
          'en-US',
        )} XPOT. No minting - unused reserve stays in the reserve wallet and remains verifiable.`,
        tone: 'emerald',
      },
      {
        key: 'treasury',
        label: 'Treasury and runway',
        pct: 23,
        note: 'Operational runway for audits, infrastructure, legal and long-horizon execution.',
        detail:
          'This is operational runway (separate from the daily distribution reserve). It funds security, infrastructure and long-term execution without touching distribution.',
        tone: 'slate',
      },
      {
        key: 'liquidity',
        label: 'Liquidity and market ops',
        pct: 26,
        note: 'LP depth, market resilience and controlled expansion.',
        detail:
          'Used to seed and support liquidity, reduce fragility and keep price discovery healthy. The goal is stability and trust, not noise.',
        tone: 'sky',
      },
      {
        key: 'strategic',
        label: 'Strategic reserve',
        pct: 13,
        note: 'Buffer for unknowns and future opportunities.',
        detail:
          'This stays untouched by default. If it ever moves, it should be deliberate, transparent and reported with public wallets and a clear purpose.',
        tone: 'slate',
      },
      {
        key: 'team',
        label: 'Team and builders',
        pct: 9,
        note: 'Vested, long horizon. Builders stay aligned with holders.',
        detail:
          `Vesting is live on-chain via Streamflow: 12 months, monthly equal unlocks. ` +
          `Contract (escrow): ${shortAddr(TEAM_VESTING.contractAccount)}. ` +
          `Sender: ${shortAddr(TEAM_VESTING.senderWallet)}. ` +
          `Recipient (payout): ${shortAddr(TEAM_VESTING.recipientWallet)}. ` +
          `Open the expanded panel for the proof links.`,
        tone: 'amber',
      },
      {
        key: 'partners',
        label: 'Partners and creators',
        pct: 8,
        note: 'Creator-gated drops, sponsor pools and performance-based distribution.',
        detail:
          'Reserved for collaborations that measurably grow participation and sponsor demand. Distribution should be trackable and tied to outcomes.',
        tone: 'sky',
      },
      {
        key: 'community',
        label: 'Community incentives',
        pct: 7,
        note: 'Streak rewards, referral boosts and reputation-based unlocks.',
        detail: 'Built for real users, not extraction. Incentives should reward participation, consistency and constructive momentum.',
        tone: 'emerald',
      },
    ],
    [],
  );

  const sortedAllocation = useMemo(() => {
    const order = ['distribution', 'treasury', 'liquidity', 'strategic', 'team', 'partners', 'community'];
    const idx = new Map(order.map((k, i) => [k, i]));
    return [...allocation].sort((a, b) => (idx.get(a.key) ?? 999) - (idx.get(b.key) ?? 999));
  }, [allocation]);

  const { data: vaultData, isLoading: vaultLoading, hadError: vaultError } = useVaultGroups();

  const VAULT_GROUP_BY_ALLOC_KEY: Record<string, string> = {
    distribution: 'rewards',
    liquidity: 'liquidityOps',
    treasury: 'treasury',
    team: 'team',
    partners: 'partners',
    community: 'community',
    strategic: 'strategic',
  };

  const [openKey, setOpenKeyRaw] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(sortedAllocation[0]?.key ?? null);
  const [pendingScrollKey, setPendingScrollKey] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedKey && sortedAllocation[0]?.key) setSelectedKey(sortedAllocation[0].key);
    if (selectedKey && !sortedAllocation.find(x => x.key === selectedKey)) setSelectedKey(sortedAllocation[0]?.key ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedAllocation]);

  const setOpenKey = (fn: (k: string | null) => string | null) => {
    setOpenKeyRaw(prev => fn(prev));
  };

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const getCardRef = (key: string) => (el: HTMLDivElement | null) => {
    cardRefs.current[key] = el;
  };

  const scrollToCard = (key: string) => {
    const el = cardRefs.current[key];
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const offset = getStickyOffsetPx();
    const targetTop = window.scrollY + rect.top - offset;

    window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
  };

  useEffect(() => {
    if (!pendingScrollKey) return;
    if (openKey !== pendingScrollKey) return;

    const r1 = window.requestAnimationFrame(() => {
      const r2 = window.requestAnimationFrame(() => {
        const t = window.setTimeout(() => {
          scrollToCard(pendingScrollKey);
          setPendingScrollKey(null);
        }, 60);
        return () => window.clearTimeout(t);
      });
      return () => window.cancelAnimationFrame(r2);
    });

    return () => window.cancelAnimationFrame(r1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openKey, pendingScrollKey]);

  const allocationRef = useRef<HTMLDivElement | null>(null);

  const openDistribution = useCallback(() => {
    setSelectedKey('distribution');
    setOpenKeyRaw('distribution');
    setPendingScrollKey('distribution');

    window.requestAnimationFrame(() => {
      const el = allocationRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const top = window.scrollY + rect.top - getStickyOffsetPx();
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
  }, []);

  // ✅ Deep-link support from home page: /tokenomics?tab=rewards&focus=reserve
  const didAutoFocusRef = useRef(false);
  useEffect(() => {
    if (didAutoFocusRef.current) return;

    const focus = searchParams.get('focus');
    const tab = searchParams.get('tab');

    if (focus === 'reserve' || tab === 'rewards') {
      didAutoFocusRef.current = true;

      const t = window.setTimeout(() => openDistribution(), 120);
      return () => window.clearTimeout(t);
    }
  }, [searchParams, openDistribution]);

  return (
    <XpotPageShell
      title="Tokenomics"
      subtitle="XPOT is built as a daily distribution protocol - transparent, repeatable and verifiable."
      topBarProps={{
        pillText: 'TOKENOMICS',
        sloganRight: 'Protocol-grade distribution',
      }}
    >
      {/* ... your full page JSX exactly as you pasted ... */}
    </XpotPageShell>
  );
}
