// app/winners/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import XpotPageShell from '@/components/XpotPageShell';
import { Crown, ExternalLink, Trophy, X as XIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

type WinnerKind = 'MAIN' | 'BONUS';

type WinnerRow = {
  id: string;
  kind?: WinnerKind | string | null;

  drawDate?: string | null; // ISO or date-ish
  ticketCode?: string | null;

  jackpotUsd?: number | null;
  amountXpot?: number | null;

  walletAddress?: string | null;
  handle?: string | null;

  txUrl?: string | null;
  txSig?: string | null;
};

function shortWallet(addr: string) {
  if (!addr || addr.length < 10) return addr || '—';
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function formatDate(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('de-DE');
}

function formatUsd(v: any) {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function formatXpot(v: any) {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return '—';
  return `${n.toLocaleString()} XPOT`;
}

export default function WinnersPage() {
  const [rows, setRows] = useState<WinnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // If your API includes enough info to determine live state, wire it later.
  // For now we keep the top bar Live indicator off on this public page.
  const liveIsOpen = false;

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setError(null);
        setLoading(true);

        const res = await fetch('/api/winners/recent?limit=50', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load winners');

        const data = await res.json();
        const winners = Array.isArray(data?.winners) ? data.winners : [];

        if (!alive) return;

        setRows(
          winners.map((w: any) => ({
            id: String(w.id ?? crypto.randomUUID()),
            kind: w.kind ?? w.winnerKind ?? w.type ?? null,
            drawDate: w.drawDate ?? w.date ?? w.createdAt ?? null,
            ticketCode: w.ticketCode ?? w.code ?? null,
            jackpotUsd: w.jackpotUsd ?? null,
            amountXpot: w.amountXpot ?? w.amount ?? null,
            walletAddress: w.walletAddress ?? w.wallet ?? null,
            handle: w.handle ?? w.xHandle ?? null,
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

  const grouped = useMemo(() => {
    // basic grouping by day for premium scannability
    const map = new Map<string, WinnerRow[]>();
    for (const r of rows) {
      const key = r.drawDate ? formatDate(r.drawDate) : '—';
      map.set(key, [...(map.get(key) || []), r]);
    }
    return Array.from(map.entries());
  }, [rows]);

  return (
    <XpotPageShell
      title="Winners"
      subtitle="Past XPOT winners - public, auditable, handle-first."
      topBarProps={{
        pillText: 'THE X-POWERED REWARD PROTOCOL',
        liveIsOpen,
      }}
    >
      <section className="mt-6 space-y-6">
        {/* Hero / trust header */}
        <div className="rounded-[30px] border border-slate-900/70 bg-slate-950/60 px-6 py-6 backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-100">Past XPOT winners</p>
              <p className="mt-1 text-xs text-slate-400">
                Winners are revealed by X handle whenever available, never “anonymous” by default.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/hub"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-200 hover:bg-white/[0.06]"
              >
                Go to Hub
              </Link>

              <Link
                href="/hub/live"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-200 hover:bg-white/[0.06]"
              >
                Live view
              </Link>
            </div>
          </div>
        </div>

        {/* Winners list */}
        <div className="rounded-[30px] border border-slate-900/70 bg-slate-950/60 px-6 py-6 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-100">Winner log</p>
              <p className="mt-1 text-xs text-slate-400">
                A clean archive of completed draws and bonus drops.
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/70 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
              <Trophy className="h-4 w-4 text-amber-300" />
              Public record
            </span>
          </div>

          <div className="mt-5">
            {loading ? (
              <p className="text-sm text-slate-400">Loading winners…</p>
            ) : error ? (
              <p className="text-sm text-amber-300">{error}</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-slate-500">No winners yet.</p>
            ) : (
              <div className="space-y-6">
                {grouped.map(([dateKey, items]) => (
                  <section key={dateKey} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {dateKey}
                      </p>
                      <span className="text-xs text-slate-500">{items.length} entries</span>
                    </div>

                    <div className="space-y-2">
                      {items.map((w) => {
                        const kind = String(w.kind || '').toUpperCase();
                        const isMain = kind === 'MAIN';
                        const isBonus = kind === 'BONUS';

                        return (
                          <article
                            key={w.id}
                            className="rounded-2xl border border-slate-800/80 bg-black/40 px-4 py-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={[
                                      'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
                                      isMain
                                        ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
                                        : isBonus
                                        ? 'border-amber-400/20 bg-amber-500/10 text-amber-300'
                                        : 'border-white/10 bg-slate-800/60 text-slate-200',
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
                                    <span className="font-mono text-xs text-slate-200">
                                      {w.ticketCode}
                                    </span>
                                  ) : null}
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                  <span>
                                    {w.handle ? (
                                      <span className="inline-flex items-center gap-2">
                                        <XIcon className="h-4 w-4 text-slate-400" />
                                        <span className="font-mono text-slate-200">@{w.handle}</span>
                                      </span>
                                    ) : (
                                      <span className="font-mono">{shortWallet(w.walletAddress || '—')}</span>
                                    )}
                                  </span>

                                  <span className="text-slate-600">•</span>

                                  <span>
                                    {w.amountXpot != null ? formatXpot(w.amountXpot) : '—'}
                                    {w.jackpotUsd != null ? (
                                      <span className="text-slate-500"> ({formatUsd(w.jackpotUsd)})</span>
                                    ) : null}
                                  </span>
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-2">
                                {w.txUrl ? (
                                  <Link
                                    href={w.txUrl}
                                    target="_blank"
                                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-200 hover:bg-white/[0.06]"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Tx
                                  </Link>
                                ) : null}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-slate-800/70 pt-4 text-xs text-slate-500">
            Tip: we can later upgrade this page to show winner avatars (X), verified tx links, and a “Proof” drawer per win.
          </div>
        </div>
      </section>
    </XpotPageShell>
  );
}
