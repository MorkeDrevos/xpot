// app/dashboard/history/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

import { format } from 'date-fns';

type EntryStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

type HistoryEntry = {
  id: string;
  code: string;
  status: EntryStatus;
  label: string;
  jackpotUsd: number;
  createdAt: string;
  walletAddress: string;
  drawDate: string | null;
};

function formatDate(date: string | Date) {
  const d = new Date(date);
  // 30.11.2025
  return d.toLocaleDateString('de-DE');
}

function shortWallet(addr: string) {
  if (!addr || addr.length < 8) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export default function HistoryPage() {
  const { publicKey } = useWallet();

  const [tickets, setTickets] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Grouped by date for nice sections
  const groupedByDate = tickets.reduce<Record<string, HistoryEntry[]>>(
    (acc, t) => {
      const key = t.drawDate
        ? format(new Date(t.drawDate), 'yyyy-MM-dd')
        : 'unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    },
    {}
  );

  useEffect(() => {
    if (!publicKey) {
      setTickets([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/tickets/history?wallet=${publicKey.toBase58()}`
        );
        if (!res.ok) throw new Error('Failed to load ticket history');

        const data = await res.json();
        if (cancelled) return;

        if (Array.isArray(data.tickets)) {
          setTickets(data.tickets);
        } else {
          setTickets([]);
        }
      } catch (err) {
        console.error('History load error', err);
        if (!cancelled) {
          setError(
            (err as Error).message ?? 'Could not load your ticket history.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  return (
    <main className="min-h-screen bg-black text-slate-50">
      <div className="mx-auto flex max-w-6xl gap-6 py-6 px-4">
        {/* Left nav (simple) */}
        <aside className="hidden w-56 border-r border-slate-900 pr-4 md:block">
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">XPOT</span>
            </Link>
          </div>

          <nav className="space-y-1 text-sm">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-full px-3 py-2 text-slate-300 hover:bg-slate-900/70"
            >
              <span className="text-lg">🏠</span>
              <span>Dashboard</span>
            </Link>

            <Link
              href="/dashboard/history"
              className="flex items-center gap-3 rounded-full px-3 py-2 font-medium bg-slate-900 text-slate-50"
            >
              <span className="text-lg">🎟️</span>
              <span>Draw history</span>
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <section className="flex-1">
          {/* Top bar */}
          <header className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Draw history
              </h1>
              <p className="text-[13px] text-slate-400">
                All tickets tied to your connected wallet.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <WalletMultiButton className="!h-9 !rounded-full !px-4 !text-sm" />
            </div>
          </header>

          {!publicKey && (
            <p className="mt-4 text-sm text-slate-400">
              Connect your wallet to see your personal draw history.
            </p>
          )}

          {publicKey && (
            <>
              {loading && (
                <p className="mt-4 text-sm text-slate-400">Loading history…</p>
              )}

              {error && (
                <p className="mt-4 text-sm text-amber-300">{error}</p>
              )}

              {!loading && !error && tickets.length === 0 && (
                <p className="mt-4 text-sm text-slate-400">
                  No tickets yet for this wallet. Once you start claiming
                  tickets, they will show up here.
                </p>
              )}

              {!loading &&
                !error &&
                Object.keys(groupedByDate)
                  .sort((a, b) => (a < b ? 1 : -1)) // newest date first
                  .map(dateKey => {
                    const group = groupedByDate[dateKey];
                    const displayDate =
                      dateKey === 'unknown'
                        ? 'Unknown date'
                        : formatDate(dateKey);

                    return (
                      <div key={dateKey} className="mt-6">
                        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-2">
                          {displayDate}
                        </h2>

                        <div className="space-y-2 border-l border-slate-800/80 pl-3">
                          {group.map(entry => (
                            <article
                              key={entry.id}
                              className="rounded-2xl border border-slate-900 bg-slate-950/70 px-4 pb-3 pt-2"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-mono text-sm text-slate-50">
                                    {entry.code}
                                  </span>
                                  <p className="mt-1 text-[11px] text-slate-500">
                                    Wallet:{' '}
                                    <span className="font-mono">
                                      {shortWallet(entry.walletAddress)}
                                    </span>
                                  </p>
                                </div>

                                <span className="text-[11px] text-slate-400">
                                  {entry.status}
                                </span>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    );
                  })}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
