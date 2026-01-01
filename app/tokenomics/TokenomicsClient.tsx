// app/tokenomics/TokenomicsClient.tsx
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
import { XPOT_MINT_ACCOUNT, streamflowDashboardUrl, streamflowContractUrl } from '@/lib/xpot';

type PillTone = 'slate' | 'emerald' | 'amber' | 'sky';

const ROUTE_HUB = '/hub';
const ROUTE_TERMS = '/terms';

// Gold helpers
const GOLD_TEXT = 'text-[rgb(var(--xpot-gold-2))]';
const GOLD_BORDER = 'border-[rgba(var(--xpot-gold),0.35)]';
const GOLD_BG_WASH = 'bg-[rgba(var(--xpot-gold),0.06)]';
const GOLD_RING_SHADOW = 'shadow-[0_0_0_1px_rgba(var(--xpot-gold),0.10)]';

// Buttons
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

// Solscan proof targets for token controls
const SOLSCAN_TOKEN_METADATA_URL = `https://solscan.io/token/${XPOT_MINT_ACCOUNT}#metadata`;

// All three authorities are revoked (Solscan metadata shows NULL).
const MINT_AUTHORITY_REVOKE_TX =
  '2Hx9hmGcMJuXo9PPuUpMLf5JCXFHjp4TvtsntikBXTrTg4P6gQtzHbhRGid8YSSYLSGq8Vk5mbwY8bpwNrRfuLvM';
const FREEZE_AUTHORITY_REVOKE_TX: string | null = null;
const UPDATE_AUTHORITY_REVOKE_TX: string | null = null;

// Rewards reserve wallet
const REWARDS_RESERVE_WALLET = '8FfoRtXDj1Q1Y2DbY2b8Rp5bLBLLstd6fYe2GcDTMg9o';

// Streamflow reserve proof
const RESERVE_STREAMFLOW_CONTRACT: string | null = null;

function solscanAccountUrl(account: string) {
  return `https://solscan.io/account/${account}`;
}
function solscanTxUrl(sig: string) {
  return `https://solscan.io/tx/${sig}`;
}

// Team vesting (12 months) - Streamflow escrow contract
const TEAM_VESTING = {
  contractAccount: 'BYUYCGu1mH2B33QU2mzF2AZDvxgxLoboiJbDVJYvGWkR',
  senderWallet: 'G17RehqUAgMcAxcnLUZyf6WzuPqsM82q9SC1aSkBUR7w',
  recipientWallet: '3DSuZP8d8a9f5CftdJvmJA1wxgzgxKULLDwZeRKC2Vh',
};

// Partners vesting (8 months) - Streamflow escrow contract
const PARTNERS_VESTING = {
  contractAccount: 'EqszkWnNNQDVQvLgu5kH4tSQNQ6jgYswU5dioXkVbLK1',
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
  if (tone === 'amber') return 'rgba(250,204,21,0.78)';
  return 'rgba(148,163,184,0.68)';
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

// Silent copy (no UI feedback)
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

function ProofLinkPill({
  href,
  label,
  tone = 'slate',
}: {
  href: string;
  label: string;
  tone?: 'slate' | 'emerald' | 'sky' | 'gold';
}) {
  const cls =
    tone === 'emerald'
      ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15'
      : tone === 'sky'
        ? 'border-sky-400/25 bg-sky-500/10 text-sky-200 hover:bg-sky-500/15'
        : tone === 'gold'
          ? 'border-[rgba(var(--xpot-gold),0.32)] bg-[rgba(var(--xpot-gold),0.10)] text-[rgb(var(--xpot-gold-2))] hover:bg-[rgba(var(--xpot-gold),0.14)]'
          : 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]';

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${cls}`}
    >
      {label}
      <ExternalLink className="h-3.5 w-3.5 opacity-70" />
    </a>
  );
}

// Smaller, aligned gold amount line
function GoldAmountLine({
  amount,
  suffix = 'XPOT',
  className,
}: {
  amount: string;
  suffix?: string;
  className?: string;
}) {
  return (
    <p className={className ?? ''}>
      <span className="inline-flex items-baseline gap-2 font-mono leading-none">
        <span className="text-[15px] sm:text-base font-semibold text-[rgb(var(--xpot-gold-2))]">{amount}</span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{suffix}</span>
      </span>
    </p>
  );
}

type VestRow = { m: number; monthly: number; cumulative: number; pct: number };

function buildLinearRows(totalTokens: number, months: number) {
  const safeMonths = Math.max(1, Math.floor(months));
  const perMonth = totalTokens / safeMonths;

  const out: VestRow[] = [];
  let cum = 0;
  for (let i = 1; i <= safeMonths; i++) {
    cum += perMonth;
    out.push({
      m: i,
      monthly: perMonth,
      cumulative: cum,
      pct: totalTokens > 0 ? (cum / totalTokens) * 100 : 0,
    });
  }

  return { perMonth, rows: out };
}

// Shared vesting chart + schedule (Team + Partners)
function LinearVestingChartAndSchedule({
  months,
  totalTokens,
  tone = 'gold',
}: {
  months: number;
  totalTokens: number;
  tone?: 'gold' | 'sky';
}) {
  const { perMonth, rows } = useMemo(() => buildLinearRows(totalTokens, months), [totalTokens, months]);

  const maxMonthly = perMonth || 1;
  const w = 560;
  const h = 170;
  const pad = 18;
  const barW = (w - pad * 2) / Math.max(1, months);

  const points = rows
    .map((r, idx) => {
      const x = pad + barW * idx + barW / 2;
      const y = pad + (1 - r.pct / 100) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const barGradientId = tone === 'sky' ? 'vestBarsSky' : 'vestBarsGold';

  return (
    <div className="mt-3 grid gap-3 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Monthly unlock</p>
            <GoldAmountLine amount={fmtInt(perMonth)} />
          </div>

          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Total vested</p>
            <p className="mt-1 font-mono text-[12px] font-semibold text-slate-100 leading-none">{fmtInt(totalTokens)} XPOT</p>
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-800/70 bg-black/25">
          <div className="w-full overflow-x-auto">
            <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
              <defs>
                <linearGradient id={barGradientId} x1="0" y1="0" x2="1" y2="0">
                  {tone === 'sky' ? (
                    <>
                      <stop offset="0%" stopColor="rgba(56,189,248,0.85)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.10)" />
                    </>
                  ) : (
                    <>
                      <stop offset="0%" stopColor="rgba(var(--xpot-gold),0.85)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.10)" />
                    </>
                  )}
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
                return (
                  <rect key={r.m} x={x} y={y} width={bw} height={barH} rx="8" fill={`url(#${barGradientId})`} opacity="0.9" />
                );
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

        <p className="mt-3 text-[11px] text-slate-600">Bars = monthly unlock. Line = cumulative vested %. Verify via Streamflow above.</p>
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
          <p className="mt-1 text-[11px] text-slate-500">
            1/{Math.max(1, Math.floor(months))} unlocks monthly, equal amounts.
          </p>
        </div>
      </div>
    </div>
  );
}

// Reserve Streamflow proof panel
function ReserveStreamflowPanel() {
  const dashboard = streamflowDashboardUrl(XPOT_MINT_ACCOUNT);
  const contractUrl = RESERVE_STREAMFLOW_CONTRACT ? streamflowContractUrl(RESERVE_STREAMFLOW_CONTRACT) : dashboard;

  return (
    <div className="mt-4 rounded-2xl border border-slate-800/70 bg-black/30 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Reserve lock proof</p>
          <p className="mt-1 text-[11px] text-slate-500">Streamflow is the canonical proof page for the reserve schedule.</p>
        </div>

        <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
          Streamflow
        </span>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">On-chain schedule</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">Token dashboard (public)</p>
            <p className="mt-1 text-xs text-slate-500">View the reserve contracts and unlock schedule on Streamflow.</p>
          </div>

          <a
            href={contractUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/15 transition"
          >
            View on Streamflow <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </div>

        {RESERVE_STREAMFLOW_CONTRACT ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Contract (escrow)</p>
              <p className="mt-1 font-mono text-xs text-slate-200">{RESERVE_STREAMFLOW_CONTRACT}</p>
            </div>
            <SilentCopyButton text={RESERVE_STREAMFLOW_CONTRACT} title="Copy address" />
          </div>
        ) : (
          <p className="mt-3 text-[11px] text-slate-600">Tip: paste the reserve contract address to show it here with Copy.</p>
        )}
      </div>
    </div>
  );
}

// Partners vesting panel (8 months)
function PartnersVestingPanel({ totalPartnersTokens }: { totalPartnersTokens: number }) {
  const vestUrl = streamflowContractUrl(PARTNERS_VESTING.contractAccount);

  return (
    <div className="mt-4 rounded-2xl border border-slate-800/70 bg-black/30 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Partners vesting</p>
          <p className="mt-1 text-[11px] text-slate-500">Vesting is live on-chain via Streamflow (8 months). Public proof link below.</p>
        </div>

        <span className="rounded-full border border-sky-400/25 bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-200">
          8M vesting
        </span>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">On-chain vesting</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">Streamflow contract (public)</p>
            <p className="mt-1 text-xs text-slate-500">Tokens sit in escrow and vest to the payout side over the schedule.</p>
          </div>

          <a
            href={vestUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-sky-400/25 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/15 transition"
          >
            View on Streamflow <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Contract (escrow)</p>
            <p className="mt-1 font-mono text-xs text-slate-200">{PARTNERS_VESTING.contractAccount}</p>
          </div>
          <SilentCopyButton text={PARTNERS_VESTING.contractAccount} title="Copy address" />
        </div>

        <p className="mt-3 text-[11px] text-slate-600">Design intent: vesting stays public, simple and verifiable.</p>
      </div>

      <LinearVestingChartAndSchedule months={8} totalTokens={totalPartnersTokens} tone="sky" />
    </div>
  );
}

// Team vesting (12 months)
function TeamVestingPanel({ totalTeamTokens }: { totalTeamTokens: number }) {
  const streamflowUrl = streamflowContractUrl(TEAM_VESTING.contractAccount);

  return (
    <div className="mt-4 rounded-2xl border border-slate-800/70 bg-black/30 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Team vesting schedule</p>
          <p className="mt-1 text-[11px] text-slate-500">12 months, monthly equal unlocks. Verifiable on-chain.</p>
        </div>
        <span className="rounded-full border border-[rgba(var(--xpot-gold),0.30)] bg-[rgba(var(--xpot-gold),0.08)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--xpot-gold-2))]">
          12M linear
        </span>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">On-chain vesting</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">Streamflow contract (public)</p>
            <p className="mt-1 text-xs text-slate-500">Tokens are held by the vesting contract (escrow) and unlock monthly to the payout wallet.</p>
          </div>

          <a
            href={streamflowUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/15 transition"
          >
            View on Streamflow <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </div>

        <div className="mt-4 grid gap-2">
          {[
            { k: 'Sender (team wallet)', v: TEAM_VESTING.senderWallet },
            { k: 'Recipient (payout wallet)', v: TEAM_VESTING.recipientWallet },
            { k: 'Contract (escrow)', v: TEAM_VESTING.contractAccount },
          ].map(row => (
            <div key={row.k} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{row.k}</p>
                <p className="mt-1 font-mono text-xs text-slate-200">{row.v}</p>
              </div>

              <SilentCopyButton text={row.v} title="Copy address" />
            </div>
          ))}
        </div>

        <p className="mt-3 text-[11px] text-slate-600">
          Note: the team wallet will look lower after vesting creation because tokens moved into escrow. That is expected.
        </p>
      </div>

      <LinearVestingChartAndSchedule months={12} totalTokens={totalTeamTokens} tone="gold" />
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
        uiAmount: number | null;
        uiAmountString?: string;
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

function sumGroupUiAmounts(groups: ApiVaultResponse['groups'] | undefined, keys: string[]) {
  if (!groups) return null;
  let sum = 0;
  let foundAny = false;

  for (const k of keys) {
    const arr = groups[k];
    if (!Array.isArray(arr)) continue;
    for (const v of arr) {
      const b = v?.balance;
      const s = formatVaultBalance(b);
      const n = s != null ? Number(s) : NaN;
      if (Number.isFinite(n)) {
        sum += n;
        foundAny = true;
      }
    }
  }

  return foundAny ? sum : null;
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
                        href={solscanAccountUrl(v.address)}
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
                            href={solscanTxUrl(tx.signature)}
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
  getCardRef,
  teamTotalTokens,
  partnersTotalTokens,
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

  getCardRef: (key: string) => (el: HTMLDivElement | null) => void;

  teamTotalTokens: number;
  partnersTotalTokens: number;
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
      <div
        className="
          pointer-events-none absolute -inset-24 opacity-80 blur-3xl
          bg-[radial-gradient(circle_at_18%_20%,rgba(56,189,248,0.16),transparent_60%),
              radial-gradient(circle_at_82%_78%,rgba(16,185,129,0.16),transparent_60%),
              radial-gradient(circle_at_60%_0%,rgba(var(--xpot-gold),0.12),transparent_55%)]
        "
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Allocation overview</p>
          <p className="mt-1 text-xs text-slate-500">Select a slice, then expand the matching card for details and vaults.</p>
        </div>
      </div>

      <div className="relative z-10 mt-5 grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)] lg:items-start">
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
              <defs>
                <filter id="xpotGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(15,23,42,0.85)" strokeWidth="22" />

              <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                {segments.map(seg => {
                  const isActive = seg.key === (selected?.key ?? null);
                  const stroke = toneStroke(seg.tone);

                  return (
                    <motion.circle
                      key={seg.key}
                      cx={size / 2}
                      cy={size / 2}
                      r={r}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={isActive ? 24 : 22}
                      strokeLinecap="round"
                      strokeDasharray={seg.dasharray}
                      strokeDashoffset={seg.dashoffset}
                      style={{ cursor: 'pointer', filter: isActive ? 'url(#xpotGlow)' : undefined }}
                      initial={false}
                      animate={reduceMotion ? {} : { opacity: isActive ? 1 : 0.7 }}
                      onClick={() => onSelect(seg.key)}
                      onMouseEnter={() => onSelect(seg.key)}
                    />
                  );
                })}
              </g>

              <circle
                cx={size / 2}
                cy={size / 2}
                r={r - 26}
                fill="rgba(2,2,10,0.55)"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
            </svg>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Selected</p>
                <p className="mt-2 text-sm font-semibold text-slate-100">{selected?.label ?? '—'}</p>
                <p className="mt-1 font-mono text-3xl font-semibold text-slate-100">{selected ? `${selected.pct}%` : '—'}</p>
                <p className="mt-1 text-[11px] text-slate-500">Select any slice or card</p>
              </div>
            </div>

            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 40px 120px rgba(0,0,0,0.55)` }}
            />
            <div
              className="pointer-events-none absolute -inset-7 rounded-full opacity-70 blur-2xl"
              style={{ background: `radial-gradient(circle at 50% 50%, ${toneGlow(selected?.tone ?? 'slate')}, transparent 60%)` }}
            />
          </div>
        </div>

        <div className="grid gap-3">
          {items.map(a => {
            const active = openKey === a.key;
            const isSelected = selected?.key === a.key;
            const vaultGroupKey = vaultGroupByAllocKey[a.key] ?? a.key;

            const stroke = toneStroke(a.tone);
            const glow = toneGlow(a.tone);

            return (
              <div
                key={a.key}
                ref={getCardRef(a.key)}
                className={[
                  'scroll-mt-[200px] rounded-2xl border bg-slate-950/45 shadow-[0_18px_70px_rgba(0,0,0,0.35)] transition',
                  isSelected ? 'border-white/20 ring-1 ring-white/10' : 'border-slate-900/70',
                ].join(' ')}
                style={
                  isSelected
                    ? {
                        boxShadow: `0 0 0 1px rgba(255,255,255,0.10), 0 18px 70px rgba(0,0,0,0.35), 0 0 36px ${toneRing(
                          a.tone,
                        )}`,
                      }
                    : undefined
                }
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelect(a.key);
                    const willOpen = openKey !== a.key;

                    setOpenKey(k => (k === a.key ? null : a.key));
                    setPendingScrollKey(willOpen ? a.key : null);
                  }}
                  className="group w-full rounded-2xl px-4 py-3 text-left hover:bg-slate-950/65 transition outline-none"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-[6px] h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: stroke, boxShadow: `0 0 14px ${glow}` }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-slate-100">{a.label}</p>
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[12px] text-slate-100">
                          {a.pct}%
                        </span>
                      </div>

                      <p className="mt-0.5 text-[11px] text-slate-500">{a.note}</p>

                      <div className="mt-3 h-2 rounded-full bg-slate-900/70">
                        <motion.div
                          className="h-2 rounded-full"
                          initial={false}
                          animate={{ width: pctToBar(a.pct) }}
                          transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' }}
                          style={{
                            background: `linear-gradient(90deg, ${stroke}, rgba(255,255,255,0.08))`,
                            boxShadow: active ? `0 0 16px ${glow}` : undefined,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-[11px] text-slate-600">{active ? 'Tap to collapse' : 'Tap to expand'}</p>
                    </div>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {active && (
                    <motion.div
                      key="content"
                      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                      transition={reduceMotion ? { duration: 0 } : { duration: 0.16, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        <div className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
                          <p className="text-sm text-slate-200">{a.note}</p>
                          <p className="mt-2 text-xs text-slate-500">{a.detail}</p>

                          {a.key === 'distribution' && <ReserveStreamflowPanel />}
                          {a.key === 'team' && <TeamVestingPanel totalTeamTokens={teamTotalTokens} />}
                          {a.key === 'partners' && <PartnersVestingPanel totalPartnersTokens={partnersTotalTokens} />}

                          <VaultGroupPanel
                            title="Vaults (live)"
                            groupKey={vaultGroupKey}
                            data={vaultData}
                            isLoading={vaultLoading}
                            hadError={vaultError}
                          />

                          <p className="mt-3 text-[11px] text-slate-600">
                            Design intent: dedicated vaults, timelocks and public wallets so this stays verifiable over time.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Next.js requirement:
 * `useSearchParams()` must be wrapped in a Suspense boundary.
 */
function TokenomicsPageInner() {
  const searchParams = useSearchParams();
  const supply = 50_000_000_000;

  const DISTRIBUTION_RESERVE_PCT = 14;
  const DISTRIBUTION_RESERVE = supply * (DISTRIBUTION_RESERVE_PCT / 100);

  const TEAM_PCT = 9;
  const TEAM_TOTAL_TOKENS = supply * (TEAM_PCT / 100);

  const PARTNERS_PCT = 8;
  const PARTNERS_TOTAL_TOKENS = supply * (PARTNERS_PCT / 100);

  const yearsOfRunway = useCallback(
    (daily: number) => {
      if (!Number.isFinite(daily) || daily <= 0) return Infinity;
      return DISTRIBUTION_RESERVE / (daily * DAYS_PER_YEAR);
    },
    [DISTRIBUTION_RESERVE],
  );

  const runwayFixedYears = useMemo(() => yearsOfRunway(DISTRIBUTION_DAILY_XPOT), [yearsOfRunway]);
  const runwayFixedDays = useMemo(() => Math.floor(DISTRIBUTION_RESERVE / DISTRIBUTION_DAILY_XPOT), [DISTRIBUTION_RESERVE]);

  const allocation = useMemo<Allocation[]>(
    () => [
      {
        key: 'distribution',
        label: 'Protocol distribution reserve',
        pct: 14,
        note: 'Pre-allocated XPOT reserved for long-term daily distribution.',
        detail: `Protocol rule: ${fmtInt(DISTRIBUTION_DAILY_XPOT)} XPOT per day (fixed). No minting - unused reserve stays in the reserve wallet and remains verifiable.`,
        tone: 'emerald',
      },
      {
        key: 'treasury',
        label: 'Treasury and runway',
        pct: 23,
        note: 'Operational runway for audits, infrastructure, legal and long-horizon execution.',
        detail: 'This is operational runway (separate from the daily distribution reserve). It funds security, infrastructure and long-term execution without touching distribution.',
        tone: 'slate',
      },
      {
        key: 'liquidity',
        label: 'Liquidity and market ops',
        pct: 26,
        note: 'LP depth, market resilience and controlled expansion.',
        detail: 'Used to seed and support liquidity, reduce fragility and keep price discovery healthy. The goal is stability and trust, not noise.',
        tone: 'sky',
      },
      {
        key: 'strategic',
        label: 'Strategic reserve',
        pct: 13,
        note: 'Buffer for unknowns and future opportunities.',
        detail: 'This stays untouched by default. If it ever moves, it should be deliberate, transparent and reported with public wallets and a clear purpose.',
        tone: 'slate',
      },
      {
        key: 'team',
        label: 'Team and builders',
        pct: 9,
        note: 'Vested on-chain. Builders stay aligned with holders.',
        detail:
          `Vesting is live on-chain via Streamflow: 12 months, monthly equal unlocks. ` +
          `Vesting escrow: ${shortAddr(TEAM_VESTING.contractAccount)}. ` +
          `Open the expanded panel for proof link.`,
        tone: 'amber',
      },
      {
        key: 'partners',
        label: 'Partners and creators',
        pct: 8,
        note: 'Vested allocation for sponsor pools and creator programs.',
        detail:
          `Partners allocation is vested on-chain via Streamflow (8 months). ` +
          `Vesting escrow: ${shortAddr(PARTNERS_VESTING.contractAccount)}. ` +
          `Open the expanded panel for proof link.`,
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

  // Deep-link support from home page: /tokenomics?tab=rewards&focus=reserve
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

  // Reserve pill must link to Streamflow (canonical proof)
  const reserveProofHref = RESERVE_STREAMFLOW_CONTRACT
    ? streamflowContractUrl(RESERVE_STREAMFLOW_CONTRACT)
    : streamflowDashboardUrl(XPOT_MINT_ACCOUNT);

  const proofCards = (
    <div className="mt-7 grid gap-3 lg:grid-cols-3">
      <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Reserve coverage</p>
            <p className="mt-2 font-mono text-3xl font-semibold text-emerald-200">
              {Number.isFinite(runwayFixedYears) ? runwayFixedYears.toFixed(2) : '—'}{' '}
              <span className="text-base font-semibold text-slate-500">years</span>
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {fmtInt(DISTRIBUTION_DAILY_XPOT)} XPOT / day - {runwayFixedDays.toLocaleString('en-US')} days coverage
            </p>
          </div>
          <Pill tone="emerald">
            <Sparkles className="h-3.5 w-3.5" />
            Focus
          </Pill>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ProofLinkPill href={reserveProofHref} label="Locked reserve (19.18y)" tone="emerald" />
          <ProofLinkPill href={solscanAccountUrl(REWARDS_RESERVE_WALLET)} label="Wallet (Solscan)" tone="slate" />
          <SilentCopyButton text={REWARDS_RESERVE_WALLET} title="Copy reserve wallet" />
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Protocol rule</p>
          <p className="mt-1 text-xs text-slate-300">Daily distribution is fixed. Reserve is time-locked and verifiable on Streamflow.</p>
        </div>
      </div>

      <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Token controls</p>
            <p className="mt-2 text-sm font-semibold text-slate-100">Authorities revoked</p>
          </div>
          <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
            Locked
          </span>
        </div>

        <div className="mt-4 grid gap-2">
          {[
            {
              k: 'Mint authority',
              note: 'Mint authority is NULL. Token supply is fixed.',
              href: MINT_AUTHORITY_REVOKE_TX ? solscanTxUrl(MINT_AUTHORITY_REVOKE_TX) : SOLSCAN_TOKEN_METADATA_URL,
              linkLabel: 'Proof (Solscan)',
            },
            {
              k: 'Freeze authority',
              note: 'Freeze authority is NULL. No accounts can be frozen.',
              href: FREEZE_AUTHORITY_REVOKE_TX ? solscanTxUrl(FREEZE_AUTHORITY_REVOKE_TX) : SOLSCAN_TOKEN_METADATA_URL,
              linkLabel: 'Proof (Solscan)',
            },
            {
              k: 'Update authority',
              note: 'Update authority is NULL. Metadata is locked.',
              href: UPDATE_AUTHORITY_REVOKE_TX ? solscanTxUrl(UPDATE_AUTHORITY_REVOKE_TX) : SOLSCAN_TOKEN_METADATA_URL,
              linkLabel: 'Proof (Solscan)',
            },
          ].map(row => (
            <div key={row.k} className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{row.k}</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-200">Revoked</p>
                </div>

                <a
                  href={row.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/15 transition"
                >
                  {row.linkLabel}
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                </a>
              </div>

              <p className="mt-2 text-[11px] text-slate-600">{row.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Total supply</p>
            <p className="mt-2 font-mono text-xl font-semibold text-slate-100">{supply.toLocaleString('en-US')}</p>
            <p className="mt-1 text-xs text-slate-500">Fixed supply, minted once</p>
          </div>
          <Pill tone="sky">
            <ShieldCheck className="h-3.5 w-3.5" />
            Fixed
          </Pill>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ProofLinkPill href={solscanAccountUrl(XPOT_MINT_ACCOUNT)} label="Mint account (Solscan)" tone="slate" />
          <SilentCopyButton text={XPOT_MINT_ACCOUNT} title="Copy mint account" />
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Design</p>
          <p className="mt-1 text-xs text-slate-300">If it cannot be proven on-chain, it should not exist.</p>
        </div>
      </div>
    </div>
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
      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        <div className="relative overflow-hidden border-b border-white/5 bg-[linear-gradient(180deg,rgba(10,7,4,0.96),rgba(0,0,0,0.94))]">
          <div
            className="
              pointer-events-none absolute inset-0
              bg-[radial-gradient(circle_at_18%_22%,rgba(var(--xpot-gold),0.18),transparent_62%),
                  radial-gradient(circle_at_78%_34%,rgba(56,189,248,0.10),transparent_66%),
                  radial-gradient(circle_at_20%_85%,rgba(16,185,129,0.10),transparent_60%),
                  linear-gradient(180deg,rgba(0,0,0,0.10),rgba(0,0,0,0.78))]
            "
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/10" />

          <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6">
            <div className="pt-8 sm:pt-10 pb-8 sm:pb-10">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="emerald">
                    <Sparkles className="h-3.5 w-3.5" />
                    Daily distribution
                  </Pill>
                  <Pill tone="sky">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    On-chain proof
                  </Pill>
                  <Pill tone="amber">
                    <Lock className="h-3.5 w-3.5" />
                    Fixed supply
                  </Pill>
                </div>

                <h1 className="mt-5 text-balance text-3xl font-semibold leading-tight sm:text-4xl">
                  A distribution designed to outlast noise.<span className="text-emerald-300"> Rewards come first.</span>
                </h1>

                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  XPOT is built around simple rules, public wallets and verifiable outcomes. If it cannot be proven on-chain, it should not exist.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link href={ROUTE_HUB} className={`${BTN_PRIMARY} px-5 py-2.5 text-sm`}>
                    Enter today&apos;s XPOT
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>

                  <Link href={ROUTE_TERMS} target="_blank" rel="noopener noreferrer" className={`${BTN_UTILITY} px-5 py-2.5 text-sm`}>
                    Terms
                  </Link>

                  <button
                    type="button"
                    onClick={openDistribution}
                    className="inline-flex items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/15 transition"
                  >
                    View reserve
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                    Proof targets: mint account, authority status, reserve lock, vesting contracts
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    Coverage focus:{' '}
                    <span className="font-mono text-emerald-200">{Number.isFinite(runwayFixedYears) ? runwayFixedYears.toFixed(2) : '—'} years</span>
                  </span>
                </div>
              </div>

              {proofCards}

              <div className="mt-8 h-px w-full bg-white/10" />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8" ref={allocationRef}>
        <div className={CARD}>
          <div
            className="
              pointer-events-none absolute -inset-44 opacity-75 blur-3xl
              bg-[radial-gradient(circle_at_10%_30%,rgba(56,189,248,0.16),transparent_60%),
                  radial-gradient(circle_at_90%_70%,rgba(16,185,129,0.16),transparent_60%),
                  radial-gradient(circle_at_60%_0%,rgba(var(--xpot-gold),0.12),transparent_55%)]
            "
          />
          <div className="relative z-10 p-6 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-100">Distribution map</p>
                <p className="mt-1 text-xs text-slate-400">Select a slice, then expand the matching card for the full breakdown and live vaults.</p>
              </div>
            </div>

            <div className="mt-6">
              <DonutAllocation
                items={sortedAllocation}
                selectedKey={selectedKey}
                onSelect={setSelectedKey}
                openKey={openKey}
                setOpenKey={setOpenKey}
                setPendingScrollKey={setPendingScrollKey}
                vaultData={vaultData}
                vaultLoading={vaultLoading}
                vaultError={vaultError}
                vaultGroupByAllocKey={VAULT_GROUP_BY_ALLOC_KEY}
                getCardRef={getCardRef}
                teamTotalTokens={TEAM_TOTAL_TOKENS}
                partnersTotalTokens={PARTNERS_TOTAL_TOKENS}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className={CARD}>
          <div
            className="
              pointer-events-none absolute -inset-44 opacity-75 blur-3xl
              bg-[radial-gradient(circle_at_20%_20%,rgba(var(--xpot-gold),0.18),transparent_60%),
                  radial-gradient(circle_at_90%_70%,rgba(16,185,129,0.16),transparent_60%)]
            "
          />
          <div className="relative z-10 p-6 lg:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">Utility map</p>
                <p className="mt-1 text-xs text-slate-400">Why hold XPOT, not just observe?</p>
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
                  Holding XPOT is the eligibility requirement to enter. The protocol is designed to feel calm and transparent with clear rules and verifiable outcomes.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <Crown className={`h-4 w-4 ${GOLD_TEXT}`} />
                  Status and reputation
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Your handle becomes a public identity. Participation history and recognisable moments can build a profile that unlocks future perks and sponsor drops.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <Flame className="h-4 w-4 text-sky-300" />
                  Sponsor-funded rewards
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Brands can acquire XPOT to fund bonus distributions. Holders receive value, sponsors get measurable attention and the system scales without pay-to-enter mechanics.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Verifiability edge
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Opaque systems rely on trust you cannot verify. XPOT is built around verification - on-chain history, public wallets and simple rules you can check.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={CARD}>
          <div className="relative z-10 p-6 lg:p-8">
            <p className="text-sm font-semibold text-slate-100">Long-term: why this can matter</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              The endgame is a protocol that communities and brands can plug into for daily distributions with identity and verification built in from day one.
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
                Every distribution bucket can be mapped to wallets and on-chain history. If it cannot be verified, it should not exist.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-10 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-slate-400" />
            Tokenomics is built to be clear, verifiable and sponsor-friendly.
          </span>
          <span className="font-mono text-slate-600">build: tokenomics-v31</span>
        </div>
      </footer>
    </XpotPageShell>
  );
}

function TokenomicsFallback() {
  return (
    <XpotPageShell
      title="Tokenomics"
      subtitle="Loading tokenomics..."
      topBarProps={{ pillText: 'TOKENOMICS', sloganRight: 'Protocol-grade distribution' }}
    >
      <div className="mt-6 rounded-[26px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
        <p className="text-xs text-slate-400">Loading...</p>
      </div>
    </XpotPageShell>
  );
}

export default function TokenomicsPage() {
  return (
    <Suspense fallback={<TokenomicsFallback />}>
      <TokenomicsPageInner />
    </Suspense>
  );
}
