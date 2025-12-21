// app/tokenomics/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
  Hash,
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
const GOLD_TEXT_DIM = 'text-[rgba(var(--xpot-gold-2),0.85)]';
const GOLD_BORDER = 'border-[rgba(var(--xpot-gold),0.35)]';
const GOLD_BORDER_SOFT = 'border-[rgba(var(--xpot-gold),0.25)]';
const GOLD_BG_WASH = 'bg-[rgba(var(--xpot-gold),0.06)]';
const GOLD_BG_WASH_2 = 'bg-[rgba(var(--xpot-gold),0.08)]';
const GOLD_RING_SHADOW = 'shadow-[0_0_0_1px_rgba(var(--xpot-gold),0.10)]';
const GOLD_GLOW_SHADOW = 'shadow-[0_0_10px_rgba(var(--xpot-gold),0.85)]';

// ✅ Buttons (updated)
const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full xpot-btn-vault xpot-focus-gold font-semibold transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-40';

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

function Pill({ children, tone = 'slate' }: { children: ReactNode; tone?: PillTone }) {
  const map: Record<PillTone, string> = {
    slate: 'border-slate-800/70 bg-slate-900/60 text-slate-200 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]',
    emerald: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]',
    sky: 'border-sky-400/50 bg-sky-500/10 text-sky-100 shadow-[0_0_0_1px_rgba(56,189,248,0.16)]',
    // ✅ gold-token pill (no Tailwind amber)
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

function toneStroke(tone: PillTone) {
  if (tone === 'emerald') return 'rgba(16,185,129,0.78)';
  if (tone === 'sky') return 'rgba(56,189,248,0.78)';
  // ✅ gold tone stroke
  if (tone === 'amber') return 'rgba(var(--xpot-gold),0.78)';
  return 'rgba(148,163,184,0.68)'; // slate
}

function toneGlow(tone: PillTone) {
  if (tone === 'emerald') return 'rgba(16,185,129,0.22)';
  if (tone === 'sky') return 'rgba(56,189,248,0.20)';
  // ✅ gold tone glow
  if (tone === 'amber') return 'rgba(var(--xpot-gold),0.18)';
  return 'rgba(148,163,184,0.16)';
}

function toneRing(tone: PillTone) {
  if (tone === 'emerald') return 'rgba(16,185,129,0.22)';
  if (tone === 'sky') return 'rgba(56,189,248,0.20)';
  // ✅ gold tone ring
  if (tone === 'amber') return 'rgba(var(--xpot-gold),0.16)';
  return 'rgba(148,163,184,0.18)';
}

// /api/vaults exact schema
type ApiVaultTx = {
  signature: string;
  blockTime: number | null; // seconds
  err: unknown | null;
};

type ApiVaultEntry = {
  name: string;
  address: string; // wallet
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
            const ui = typeof v.balance?.uiAmount === 'number' ? v.balance.uiAmount : null;
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

                      <button
                        type="button"
                        onClick={() => copy(v.address)}
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300 hover:bg-white/[0.06] transition"
                        title="Copy wallet address"
                      >
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">XPOT balance</p>
                    <p className="mt-1 font-mono text-sm text-slate-100">{ui == null ? '—' : `${formatMaybeNumber(ui) ?? '—'} XPOT`}</p>
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
                            className={[
                              'group flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2 transition',
                              'border-slate-800/70 bg-slate-950/45 hover:bg-slate-950/60',
                            ].join(' ')}
                            title={tx.signature}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] text-slate-200 group-hover:text-white transition">{shortAddr(tx.signature)}</span>
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

              <circle cx={size / 2} cy={size / 2} r={r - 26} fill="rgba(2,2,10,0.55)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            </svg>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Selected</p>
                <p className="mt-2 text-sm font-semibold text-slate-100">{selected?.label ?? '—'}</p>
                <p className="mt-1 font-mono text-3xl font-semibold text-slate-100">{selected ? `${selected.pct}%` : '—'}</p>
                <p className="mt-1 text-[11px] text-slate-500">Select any slice or card</p>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 40px 120px rgba(0,0,0,0.55)` }} />
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
                  'scroll-mt-32 rounded-2xl border bg-slate-950/45 shadow-[0_18px_70px_rgba(0,0,0,0.35)] transition',
                  isSelected ? 'border-white/20 ring-1 ring-white/10' : 'border-slate-900/70',
                ].join(' ')}
                style={
                  isSelected
                    ? {
                        boxShadow: `0 0 0 1px rgba(255,255,255,0.10), 0 18px 70px rgba(0,0,0,0.35), 0 0 36px ${toneRing(a.tone)}`,
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
                    <span className="mt-[6px] h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: stroke, boxShadow: `0 0 14px ${glow}` }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-slate-100">{a.label}</p>
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[12px] text-slate-100">{a.pct}%</span>
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

                          {a.key === 'distribution' && (
                            <div className="mt-4 rounded-2xl border border-slate-800/70 bg-black/30 p-3">
                              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Distribution runway table</p>

                              <div className="mt-3 space-y-2">
                                {runwayTable.map(r => {
                                  const years = yearsOfRunway(r.daily);
                                  return (
                                    <div
                                      key={r.label}
                                      className={[
                                        'flex items-center justify-between rounded-xl px-3 py-2 text-xs',
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
                                Reserve size: {distributionReserve.toLocaleString('en-US')} XPOT (14% of supply). Daily distribution is fixed at{' '}
                                {fmtInt(DISTRIBUTION_DAILY_XPOT)} XPOT. Unused reserve stays in the reserve wallet and remains verifiable.
                              </p>
                            </div>
                          )}

                          <VaultGroupPanel title="Vaults (live)" groupKey={vaultGroupKey} data={vaultData} isLoading={vaultLoading} hadError={vaultError} />

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

export default function TokenomicsPage() {
  const supply = 50_000_000_000;

  const DISTRIBUTION_RESERVE_PCT = 14;
  const DISTRIBUTION_RESERVE = supply * (DISTRIBUTION_RESERVE_PCT / 100); // 7,000,000,000

  function yearsOfRunway(daily: number) {
    if (!Number.isFinite(daily) || daily <= 0) return Infinity;
    return DISTRIBUTION_RESERVE / (daily * DAYS_PER_YEAR);
  }

  const runwayFixedYears = useMemo(() => yearsOfRunway(DISTRIBUTION_DAILY_XPOT), []);
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
          'Credibility comes from structure: a long cliff and slow linear vesting. Builders earn upside by shipping, not by selling into early liquidity.',
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
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (!pendingScrollKey) return;
    if (openKey !== pendingScrollKey) return;

    window.requestAnimationFrame(() => {
      scrollToCard(pendingScrollKey);
      setPendingScrollKey(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openKey, pendingScrollKey]);

  const allocationRef = useRef<HTMLDivElement | null>(null);

  const openDistribution = () => {
    setSelectedKey('distribution');
    setOpenKeyRaw('distribution');
    setPendingScrollKey('distribution');

    window.requestAnimationFrame(() => {
      if (!cardRefs.current['distribution']) allocationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <XpotPageShell
      title="Tokenomics"
      subtitle="XPOT is built as a daily distribution protocol - transparent, repeatable and verifiable."
      topBarProps={{
        pillText: 'TOKENOMICS',
        sloganRight: 'Protocol-grade distribution',
      }}
    >
      <section className="mt-6">
        <div className={CARD}>
          <div
            className="
              pointer-events-none absolute -inset-48 opacity-85 blur-3xl
              bg-[radial-gradient(circle_at_15%_10%,rgba(16,185,129,0.22),transparent_55%),
                  radial-gradient(circle_at_85%_15%,rgba(56,189,248,0.22),transparent_55%),
                  radial-gradient(circle_at_80%_90%,rgba(var(--xpot-gold),0.16),transparent_60%)]
            "
          />

          <div className="relative z-10 p-6 lg:p-8">
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="space-y-5 lg:col-span-8">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="emerald">
                    <Sparkles className="h-3.5 w-3.5" />
                    Daily distribution
                  </Pill>
                  <Pill tone="sky">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verifiable by design
                  </Pill>
                  <Pill tone="amber">
                    <Lock className="h-3.5 w-3.5" />
                    Self-custody
                  </Pill>
                </div>

                <h1 className="text-balance text-3xl font-semibold leading-tight sm:text-4xl">
                  A distribution designed to outlast noise.<span className="text-emerald-300"> Rewards come first.</span>
                </h1>

                <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
                  Many reward systems are opaque and hard to verify. XPOT is the opposite: the rules are simple, the wallets are public, and outcomes
                  can be checked on-chain. Over time, this becomes infrastructure that communities, creators and sponsors can plug into with confidence.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <Link href={ROUTE_HUB} className={`${BTN_PRIMARY} px-5 py-2.5 text-sm`}>
                    Enter today&apos;s XPOT
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link href={ROUTE_TERMS} className={`${BTN_UTILITY} px-5 py-2.5 text-sm`}>
                    Terms
                  </Link>
                  <span className="text-[11px] text-slate-500">Allocation prioritises distribution, resilience and long-term execution.</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Total supply</p>
                    <p className="mt-2 font-mono text-lg font-semibold text-slate-100">{supply.toLocaleString('en-US')}</p>
                    <p className="mt-1 text-xs text-slate-500">Fixed supply, minted once</p>
                  </div>

                  <div className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Token controls</p>
                        <p className="mt-2 flex items-center gap-2 font-mono text-lg font-semibold leading-none text-slate-100">
                          <ShieldCheck className="h-4 w-4 text-sky-300" />
                          Authority revoked
                        </p>
                      </div>
                      <span className="rounded-full border border-sky-400/25 bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-200">
                        Locked
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl border border-slate-800/70 bg-black/25 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Mint</p>
                          <p className="mt-1 text-sm font-semibold text-slate-200">Revoked</p>
                        </div>
                        <div className="rounded-xl border border-slate-800/70 bg-black/25 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Freeze</p>
                          <p className="mt-1 text-sm font-semibold text-slate-200">Revoked</p>
                        </div>
                        <div className="rounded-xl border border-slate-800/70 bg-black/25 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Supply</p>
                          <p className="mt-1 text-sm font-semibold text-slate-200">Fixed</p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500">No further supply can be minted or frozen</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Rewards reserve</p>
                    <p className="mt-2 font-mono text-lg font-semibold text-emerald-200">{DISTRIBUTION_RESERVE.toLocaleString('en-US')} XPOT</p>
                    <p className="mt-1 text-xs text-slate-500">Designated reserve wallet</p>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block lg:col-span-4">
                <div className="h-full">
                  <div className="relative h-full rounded-[26px] border border-slate-900/70 bg-slate-950/55 p-5 shadow-[0_30px_110px_rgba(0,0,0,0.40)] backdrop-blur">
                    <div
                      className="
                        pointer-events-none absolute -inset-24 opacity-75 blur-3xl
                        bg-[radial-gradient(circle_at_20%_25%,rgba(56,189,248,0.16),transparent_55%),
                            radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.16),transparent_60%)]
                      "
                    />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Protocol snapshot</p>
                          <p className="mt-1 text-sm font-semibold text-slate-100">Proof-first economics</p>
                          <p className="mt-1 text-xs text-slate-500">Each block is one rule with its own proof target.</p>
                        </div>

                        <Pill tone="emerald">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verified
                        </Pill>
                      </div>

                      <div className="mt-5 grid gap-3">
                        <div className="rounded-2xl border border-slate-900/70 bg-black/25 p-4">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Rule</p>
                          <p className="mt-1 text-sm font-semibold text-slate-100">Daily distribution</p>
                          <p className="mt-2 font-mono text-2xl font-semibold text-slate-100">
                            {fmtInt(DISTRIBUTION_DAILY_XPOT)}
                            <span className="ml-2 text-sm font-semibold text-slate-500">/ day</span>
                          </p>
                          <p className="mt-1 text-xs text-slate-500">Proof: outcomes can be checked on-chain</p>
                        </div>

                        <div className="rounded-2xl border border-slate-900/70 bg-black/25 p-4">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Backing</p>
                          <p className="mt-1 text-sm font-semibold text-slate-100">Reserve coverage</p>
                          <p className="mt-2 font-mono text-2xl font-semibold text-emerald-200">
                            {runwayFixedYears.toFixed(2)}
                            <span className="ml-2 text-sm font-semibold text-slate-500">years</span>
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Proof: {DISTRIBUTION_RESERVE.toLocaleString('en-US')} XPOT ({runwayFixedDays.toLocaleString('en-US')} days) in the reserve
                            wallet
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-900/70 bg-black/25 p-4">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Constraint</p>
                          <p className="mt-1 text-sm font-semibold text-slate-100">10-year requirement</p>
                          <p className="mt-2 font-mono text-xl font-semibold text-slate-100">{TEN_YEARS_REQUIRED.toLocaleString('en-US')}</p>
                          <p className="mt-1 text-xs text-slate-500">Exact at 1,000,000/day</p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={openDistribution}
                          className="inline-flex items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/15 transition"
                        >
                          View reserve
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </button>

                        <Link href={ROUTE_HUB} className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.06] transition">
                          Enter today
                          <ArrowRight className="ml-2 h-4 w-4 text-slate-400" />
                        </Link>
                      </div>

                      <p className="mt-4 text-[11px] text-slate-600">
                        Built to feel calm and verifiable. If it cannot be proven on-chain, it should not exist.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* /Right */}
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
                runwayTable={runwayTable}
                yearsOfRunway={yearsOfRunway}
                distributionReserve={DISTRIBUTION_RESERVE}
                getCardRef={getCardRef}
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
                  Holding XPOT is the eligibility requirement to enter. The protocol is designed to feel calm and transparent, with clear rules and verifiable outcomes.
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
              The endgame is a protocol that communities and brands can plug into for daily distributions, with identity and verification built in from day one.
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
                Every distribution bucket can be mapped to wallets, ATAs and on-chain history. If it cannot be verified, it should not exist.
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
          <span className="font-mono text-slate-600">build: tokenomics-v18</span>
        </div>
      </footer>
    </XpotPageShell>
  );
}
