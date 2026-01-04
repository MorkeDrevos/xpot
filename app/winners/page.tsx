// app/winners/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import XpotPageShell from '@/components/XpotPageShell';
import GoldAmount from '@/components/GoldAmount';

import {
  Crown,
  ExternalLink,
  Trophy,
  X as XIcon,
  ChevronDown,
  Search,
  BadgeCheck,
  XCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

type WinnerKind = 'MAIN' | 'BONUS';

type WinnerRow = {
  id: string;
  kind?: WinnerKind | string | null;

  drawDate?: string | null;
  ticketCode?: string | null;

  amountXpot?: number | null;

  walletAddress?: string | null;

  handle?: string | null;
  name?: string | null;
  avatarUrl?: string | null;

  isPaidOut?: boolean | null;

  txUrl?: string | null;
  txSig?: string | null;

  label?: string | null;
};

function shortWallet(addr: string) {
  if (!addr || addr.length < 10) return addr || '—';
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function formatDate(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB');
}

function normalizeHandle(h: string | null | undefined) {
  const s = String(h ?? '').trim();
  if (!s) return null;
  const clean = s.replace(/^@+/, '');
  if (!clean) return null;
  return `@${clean}`;
}

function toXProfileUrl(handle: string | null | undefined) {
  const h = normalizeHandle(handle);
  if (!h) return null;
  const raw = h.replace(/^@/, '');
  return `https://x.com/${encodeURIComponent(raw)}`;
}

function isValidHttpUrl(u: string | null | undefined) {
  if (!u) return false;
  return /^https?:\/\/.+/i.test(u);
}

function Badge({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: 'slate' | 'emerald' | 'gold' | 'sky' | 'danger';
}) {
  const cls =
    tone === 'emerald'
      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
      : tone === 'gold'
      ? 'xpot-pill-gold border bg-[rgba(var(--xpot-gold),0.10)] text-[rgb(var(--xpot-gold-2))]'
      : tone === 'sky'
      ? 'border-sky-400/40 bg-sky-500/10 text-sky-100'
      : tone === 'danger'
      ? 'border-rose-400/40 bg-rose-500/10 text-rose-200'
      : 'border-slate-700/70 bg-slate-900/70 text-slate-300';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${cls}`}
    >
      {children}
    </span>
  );
}

function WinnerIdentity({
  avatarUrl,
  name,
  handle,
  walletAddress,
}: {
  avatarUrl?: string | null;
  name?: string | null;
  handle?: string | null;
  walletAddress?: string | null;
}) {
  const h = normalizeHandle(handle);
  const xUrl = toXProfileUrl(h);

  const title = name && name.trim() ? name.trim() : h ?? shortWallet(walletAddress || '—');
  const subtitle = h ?? shortWallet(walletAddress || '—');

  const content = (
    <div className="flex items-center gap-3">
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/10 bg-slate-900/60 ring-1 ring-white/[0.06]">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={subtitle} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] text-slate-400">
            <XIcon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-100">{title}</div>
        <div className="truncate font-mono text-xs text-slate-400">{subtitle}</div>
      </div>
    </div>
  );

  if (!xUrl) return content;

  return (
    <a
      href={xUrl}
      target="_blank"
      rel="noreferrer"
      className="group block rounded-xl outline-none transition hover:bg-white/[0.03] focus-visible:ring-2 focus-visible:ring-[rgba(var(--xpot-gold),0.35)]"
      title="Open X profile"
    >
      <div className="-m-2 p-2">{content}</div>
    </a>
  );
}

function fmtInt(n: number) {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export default function WinnersPage() {
  const [rows, setRows] = useState<WinnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'ALL' | 'MAIN' | 'BONUS'>('ALL');
  const [showTxOnly, setShowTxOnly] = useState(false);

  const [visibleDays, setVisibleDays] = useState(7);

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
          winners.map((w: any) => ({
            id: String(w.id ?? crypto.randomUUID()),
            kind: w.kind ?? w.winnerKind ?? w.type ?? null,
            label: w.label ?? null,
            drawDate: w.drawDate ?? w.date ?? w.createdAt ?? null,
            ticketCode: w.ticketCode ?? w.code ?? null,

            amountXpot: w.amountXpot ?? w.amount ?? null,

            walletAddress: w.walletAddress ?? w.wallet ?? null,

            handle: w.handle ?? w.xHandle ?? null,
            name: w.name ?? w.xName ?? null,
            avatarUrl: w.avatarUrl ?? w.xAvatarUrl ?? null,

            isPaidOut: typeof w.isPaidOut === 'boolean' ? w.isPaidOut : null,
            txUrl: w.txUrl ?? w.txLink ?? null,
            txSig: w.txSig ?? w.signature ?? null,
          })),
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

      if (kindFilter === 'MAIN' && !isMain) return false;
      if (kindFilter === 'BONUS' && !isBonus) return false;
      if (showTxOnly && !isValidHttpUrl(r.txUrl)) return false;

      if (!q) return true;

      const hay = [
        r.name || '',
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
    const map = new Map<string, WinnerRow[]>();
    for (const r of filteredRows) {
      const key = r.drawDate ? formatDate(r.drawDate) : '—';
      map.set(key, [...(map.get(key) || []), r]);
    }
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
        {/* Controls */}
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
                Winners are shown by X identity whenever available. If no X identity exists, we show the wallet short form.
              </p>

              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="xpot-card px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Search</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Search className="h-4 w-4 text-slate-500" />
                    <input
                      className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
                      placeholder="@handle, name, wallet, ticket, tx..."
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

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Link href="/hub" className="xpot-btn h-10 px-5 text-[12px]">
                    Go to Hub
                  </Link>
                  <Link href="/hub/live" className="xpot-btn h-10 px-5 text-[12px]">
                    Live view
                  </Link>
                </div>
              </div>

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

                          const hasTx = isValidHttpUrl(w.txUrl);
                          const paid = w.isPaidOut === true || hasTx;

                          const amountText =
                            typeof w.amountXpot === 'number' && Number.isFinite(w.amountXpot)
                              ? fmtInt(Math.round(w.amountXpot))
                              : '—';

                          return (
                            <article key={w.id} className="xpot-card px-4 py-4">
                              {/* Top badges row */}
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
                                  <Badge tone="danger">
                                    <XCircle className="h-3.5 w-3.5" />
                                    Unpaid
                                  </Badge>
                                )}
                              </div>

                              {/* Main row: Identity | Amount(hero) | TX */}
                              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                                <WinnerIdentity
                                  avatarUrl={w.avatarUrl}
                                  name={w.name}
                                  handle={w.handle}
                                  walletAddress={w.walletAddress}
                                />

                                {/* Amount - hero */}
                                <div className="flex justify-start sm:justify-center">
                                  <GoldAmount value={amountText} suffix="XPOT" size="lg" />
                                </div>

                                {/* TX button */}
                                <div className="flex justify-start sm:justify-end">
                                  {hasTx && w.txUrl ? (
                                    <Link
                                      href={w.txUrl}
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
              Next upgrade: verified TX and a compact “Proof” drawer per win.
            </div>
          </div>
        </section>
      </section>
    </XpotPageShell>
  );
}
