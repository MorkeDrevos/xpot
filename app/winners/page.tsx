// app/winners/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import XpotPageShell from '@/components/XpotPageShell';
import { Crown, ExternalLink, Trophy, X as XIcon, ChevronDown, Search, BadgeCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

type WinnerKind = 'MAIN' | 'BONUS';

type WinnerRow = {
  id: string;
  kind?: WinnerKind | string | null;

  drawDate?: string | null; // ISO or date-ish
  ticketCode?: string | null;

  jackpotUsd?: number | null; // USD value (optional)
  amountXpot?: number | null; // XPOT amount

  walletAddress?: string | null;
  handle?: string | null;

  // proof
  txUrl?: string | null;
  txSig?: string | null;

  // payout state (may not be returned by public endpoint)
  isPaidOut?: boolean | null;
};

function shortWallet(addr: string) {
  if (!addr || addr.length < 10) return addr || '—';
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function formatDate(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB'); // consistent with ops
}

function formatUsd(v: any) {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function formatXpot(v: any) {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return '—';
  return `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} XPOT`;
}

function normalizeHandle(h: string | null | undefined) {
  const s = String(h ?? '').trim();
  if (!s) return null;
  return s.startsWith('@') ? s.slice(1) : s;
}

/**
 * Accepts:
 * - full solscan url
 * - "/tx/<sig>"
 * - "tx/<sig>"
 * - bare signature
 * - empty / placeholders
 *
 * Returns a real https solscan tx URL or null.
 */
function normalizeTxUrl(txUrl?: string | null, txSig?: string | null) {
  const rawUrl = String(txUrl ?? '').trim();
  const rawSig = String(txSig ?? '').trim();

  const bad = (s: string) =>
    !s ||
    s === '—' ||
    s.toLowerCase().includes('dev_completed') ||
    s.toLowerCase().includes('placeholder');

  // Prefer txUrl if it looks usable
  if (rawUrl && !bad(rawUrl)) {
    // already a full url
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

    // handle "/tx/<sig>" or "tx/<sig>"
    const m = rawUrl.match(/\/?tx\/([1-9A-HJ-NP-Za-km-z]{20,})/);
    if (m?.[1]) return `https://solscan.io/tx/${m[1]}`;
  }

  // Fallback to txSig
  if (rawSig && !bad(rawSig)) {
    // if they accidentally store a full url in txSig
    if (/^https?:\/\//i.test(rawSig)) return rawSig;

    // if they store "/tx/<sig>" in txSig
    const m = rawSig.match(/\/?tx\/([1-9A-HJ-NP-Za-km-z]{20,})/);
    if (m?.[1]) return `https://solscan.io/tx/${m[1]}`;

    // bare signature
    if (/^[1-9A-HJ-NP-Za-km-z]{20,}$/.test(rawSig)) return `https://solscan.io/tx/${rawSig}`;
  }

  return null;
}

function Badge({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: 'slate' | 'emerald' | 'gold' | 'sky' | 'rose';
}) {
  const cls =
    tone === 'emerald'
      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
      : tone === 'gold'
      ? 'xpot-pill-gold border bg-[rgba(var(--xpot-gold),0.10)] text-[rgb(var(--xpot-gold-2))]'
      : tone === 'sky'
      ? 'border-sky-400/40 bg-sky-500/10 text-sky-100'
      : tone === 'rose'
      ? 'border-rose-400/40 bg-rose-500/10 text-rose-100'
      : 'border-slate-700/70 bg-slate-900/70 text-slate-300';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${cls}`}
    >
      {children}
    </span>
  );
}

function XpotPill({ amount }: { amount: number | null | undefined }) {
  const value = formatXpot(amount);
  const parts = value.split(' ');
  const unit = parts.pop();
  const amountStr = parts.join(' ');

  return (
    <span className="inline-flex items-baseline rounded-full border border-slate-700/80 bg-slate-950/80 px-4 py-1.5 text-sm font-semibold text-slate-100 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]">
      <span className="font-mono tracking-[0.14em] text-[0.9em]">{amountStr}</span>
      <span className="ml-2 text-[0.68em] uppercase tracking-[0.24em] text-slate-400">{unit}</span>
    </span>
  );
}

export default function WinnersPage() {
  const [rows, setRows] = useState<WinnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // polish controls
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'ALL' | 'MAIN' | 'BONUS'>('ALL');
  const [showTxOnly, setShowTxOnly] = useState(false);

  // pagination-lite
  const [visibleDays, setVisibleDays] = useState(7);

  // Public page - keep topbar live pill off for now
  const liveIsOpen = false;

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setError(null);
        setLoading(true);

        const res = await fetch('/api/winners/recent?limit=80', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load winners');

        const data = await res.json();
        const winners = Array.isArray(data?.winners) ? data.winners : [];

        if (!alive) return;

        setRows(
          winners.map((w: any) => {
            // normalize fields coming from different endpoints/envs
            const id = String(w.id ?? crypto.randomUUID());
            const kind = w.kind ?? w.winnerKind ?? w.type ?? null;
            const drawDate = w.drawDate ?? w.date ?? w.createdAt ?? null;
            const ticketCode = w.ticketCode ?? w.code ?? null;

            const jackpotUsd =
              w.jackpotUsd ??
              w.payoutUsd ?? // sometimes same value is used
              null;

            const amountXpot =
              w.amountXpot ??
              w.amount ??
              w.xpot ??
              null;

            const walletAddress =
              w.walletAddress ??
              w.wallet ??
              w.walletOwner ??
              null;

            const handle =
              normalizeHandle(w.handle ?? w.xHandle ?? w.username ?? null);

            const txUrl = w.txUrl ?? w.txLink ?? w.solscanUrl ?? w.proofUrl ?? null;
            const txSig = w.txSig ?? w.signature ?? w.txSignature ?? null;

            const isPaidOut =
              typeof w.isPaidOut === 'boolean'
                ? w.isPaidOut
                : typeof w.paid === 'boolean'
                ? w.paid
                : typeof w.isPaid === 'boolean'
                ? w.isPaid
                : null;

            return {
              id,
              kind,
              drawDate,
              ticketCode,
              jackpotUsd,
              amountXpot,
              walletAddress,
              handle,
              txUrl,
              txSig,
              isPaidOut,
            } as WinnerRow;
          }),
        );
      } catch (e) {
        if (!alive) return;
        setError((e as Error)?.message || 'Failed to load winners.');
        setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter(r => {
      const kind = String(r.kind || '').toUpperCase();
      const isMain = kind === 'MAIN';
      const isBonus = kind === 'BONUS';

      const proof = normalizeTxUrl(r.txUrl, r.txSig);

      if (kindFilter === 'MAIN' && !isMain) return false;
      if (kindFilter === 'BONUS' && !isBonus) return false;
      if (showTxOnly && !proof) return false;

      if (!q) return true;

      const hay = [
        r.handle ? `@${r.handle}` : '',
        r.walletAddress || '',
        r.ticketCode || '',
        r.txSig || '',
        r.txUrl || '',
      ]
        .join(' ')
        .toLowerCase();

      return hay.includes(q);
    });
  }, [rows, query, kindFilter, showTxOnly]);

  const grouped = useMemo(() => {
    // group by day
    const map = new Map<string, WinnerRow[]>();
    for (const r of filteredRows) {
      const key = r.drawDate ? formatDate(r.drawDate) : '—';
      map.set(key, [...(map.get(key) || []), r]);
    }

    // keep insertion order from API (most recent first), but ensure stable array
    return Array.from(map.entries());
  }, [filteredRows]);

  const visibleGrouped = useMemo(() => grouped.slice(0, visibleDays), [grouped, visibleDays]);

  const totals = useMemo(() => {
    const main = filteredRows.filter(r => String(r.kind || '').toUpperCase() === 'MAIN').length;
    const bonus = filteredRows.filter(r => String(r.kind || '').toUpperCase() === 'BONUS').length;
    return { main, bonus, total: filteredRows.length };
  }, [filteredRows]);

  return (
    <XpotPageShell
      title="Winners"
      subtitle="Public archive - handle-first, auditable and clean."
      topBarProps={{
        pillText: 'THE X-POWERED REWARD PROTOCOL',
        liveIsOpen,
      }}
      pageTag="hub"
    >
      <section className="mt-6 space-y-6">
        {/* Trust + actions */}
        <section className="xpot-panel px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="gold">
                  <Trophy className="h-3.5 w-3.5" />
                  Public record
                </Badge>
                <Badge tone="slate">{totals.total} entries</Badge>
                <Badge tone="emerald">
                  <Crown className="h-3.5 w-3.5" />
                  {totals.main} main
                </Badge>
                <Badge tone="sky">
                  <Trophy className="h-3.5 w-3.5" />
                  {totals.bonus} bonus
                </Badge>
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-100">Past XPOT winners</p>
              <p className="mt-1 text-xs text-slate-400">
                Winners are shown by X handle whenever available. If no handle exists, we show the wallet short form - never “anonymous” by default.
              </p>

              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                {/* Search */}
                <div className="xpot-card px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Search</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Search className="h-4 w-4 text-slate-500" />
                    <input
                      className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
                      placeholder="@handle, wallet, ticket, tx..."
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                    />
                    {query ? (
                      <button
                        type="button"
                        className="rounded-full border border-slate-700/70 bg-slate-950/60 px-3 py-1 text-[11px] text-slate-300 hover:bg-slate-900/60"
                        onClick={() => setQuery('')}
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Quick routes */}
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Link href="/hub" className="xpot-btn h-10 px-5 text-[12px]">
                    Go to Hub
                  </Link>
                  <Link href="/hub/live" className="xpot-btn h-10 px-5 text-[12px]">
                    Live view
                  </Link>
                </div>
              </div>

              {/* Filters */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {(['ALL', 'MAIN', 'BONUS'] as const).map(k => {
                  const active = kindFilter === k;
                  const cls = active
                    ? 'xpot-pill-gold border-[rgba(var(--xpot-gold),0.40)] bg-[rgba(var(--xpot-gold),0.10)] text-[rgb(var(--xpot-gold-2))]'
                    : 'border-slate-800/80 bg-slate-950/60 text-slate-300 hover:bg-slate-900/50';

                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKindFilter(k)}
                      className={`rounded-full border px-4 py-2 text-xs transition ${cls}`}
                    >
                      {k === 'ALL' ? 'All wins' : k === 'MAIN' ? 'Main XPOT' : 'Bonus XPOT'}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setShowTxOnly(v => !v)}
                  className={`rounded-full border px-4 py-2 text-xs transition ${
                    showTxOnly
                      ? 'border-sky-400/50 bg-sky-500/10 text-sky-100'
                      : 'border-slate-800/80 bg-slate-950/60 text-slate-300 hover:bg-slate-900/50'
                  }`}
                >
                  TX only
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Winner log */}
        <section className="xpot-card-primary" data-glow="magenta">
          <div className="xpot-nebula-halo" />
          <div className="relative z-10 px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-100">Winner log</p>
                <p className="mt-1 text-xs text-slate-400">
                  Completed draws and bonus drops. Link out to the TX whenever available.
                </p>
              </div>

              <Badge tone="slate">
                <Trophy className="h-3.5 w-3.5 text-slate-300" />
                Archive
              </Badge>
            </div>

            <div className="mt-5 xpot-divider" />

            <div className="mt-5">
              {loading ? (
                <div className="xpot-card px-4 py-4 text-sm text-slate-400">Loading winners…</div>
              ) : error ? (
                <div className="xpot-card px-4 py-4 text-sm text-amber-300">{error}</div>
              ) : filteredRows.length === 0 ? (
                <div className="xpot-card px-4 py-4 text-sm text-slate-500">No winners yet.</div>
              ) : (
                <div className="space-y-6">
                  {visibleGrouped.map(([dateKey, items]) => (
                    <section key={dateKey} className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                          {dateKey}
                        </p>
                        <span className="text-xs text-slate-500">{items.length} entries</span>
                      </div>

                      <div className="space-y-2">
                        {items.map(w => {
                          const kind = String(w.kind || '').toUpperCase();
                          const isMain = kind === 'MAIN';
                          const isBonus = kind === 'BONUS';

                          const proof = normalizeTxUrl(w.txUrl, w.txSig);

                          // If API does not expose isPaidOut, infer paid from proof
                          const paid = typeof w.isPaidOut === 'boolean' ? w.isPaidOut : !!proof;

                          return (
                            <article key={w.id} className="xpot-card px-4 py-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={[
                                        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
                                        isMain
                                          ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                                          : isBonus
                                          ? 'xpot-pill-gold border bg-[rgba(var(--xpot-gold),0.10)] text-[rgb(var(--xpot-gold-2))]'
                                          : 'border-slate-700/70 bg-slate-900/60 text-slate-200',
                                      ].join(' ')}
                                    >
                                      {isMain ? (
                                        <>
                                          <Crown className="h-3.5 w-3.5" />
                                          Main XPOT
                                        </>
                                      ) : isBonus ? (
                                        <>
                                          <Trophy className="h-3.5 w-3.5" />
                                          Bonus XPOT
                                        </>
                                      ) : (
                                        <>Winner</>
                                      )}
                                    </span>

                                    {w.ticketCode ? (
                                      <span className="font-mono text-xs text-slate-200">{w.ticketCode}</span>
                                    ) : null}

                                    <span className="text-slate-700">•</span>

                                    {paid ? (
                                      <Badge tone="emerald">
                                        <BadgeCheck className="h-3.5 w-3.5" />
                                        Paid
                                      </Badge>
                                    ) : (
                                      <Badge tone="rose">
                                        <span className="h-2 w-2 rounded-full bg-rose-400/80" />
                                        Unpaid
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                    <span className="inline-flex items-center gap-2">
                                      <XIcon className="h-4 w-4 text-slate-500" />
                                      {w.handle ? (
                                        <span className="font-mono text-slate-200">@{w.handle}</span>
                                      ) : (
                                        <span className="font-mono text-slate-300">
                                          {shortWallet(w.walletAddress || '—')}
                                        </span>
                                      )}
                                    </span>

                                    <span className="text-slate-700">•</span>

                                    <div className="flex flex-wrap items-center gap-2">
                                      <XpotPill amount={w.amountXpot ?? 0} />
                                      {w.jackpotUsd != null ? (
                                        <span className="text-xs text-slate-500">({formatUsd(w.jackpotUsd)})</span>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                  {proof ? (
                                    <Link
                                      href={proof}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="xpot-btn h-10 px-5 text-[12px]"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      Tx
                                    </Link>
                                  ) : (
                                    <span className="rounded-full border border-slate-800/70 bg-slate-950/50 px-4 py-2 text-[11px] text-slate-500">
                                      No TX
                                    </span>
                                  )}
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))}

                  {grouped.length > visibleDays && (
                    <div className="pt-1">
                      <button
                        type="button"
                        className="xpot-btn h-11 w-full text-sm"
                        onClick={() => setVisibleDays(v => Math.min(v + 7, grouped.length))}
                      >
                        <span className="inline-flex items-center gap-2">
                          <ChevronDown className="h-4 w-4" />
                          Load more days
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 xpot-divider" />

            <div className="mt-4 text-xs text-slate-500">
              Next upgrade: winner avatar (X), verified TX, and a compact “Proof” drawer per win.
            </div>
          </div>
        </section>
      </section>
    </XpotPageShell>
  );
}
