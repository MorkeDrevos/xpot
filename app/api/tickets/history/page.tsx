'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

const endpoint = 'https://api.mainnet-beta.solana.com';

type HistoryTicket = {
  id: string;
  code: string;
  status: 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';
  label: string;
  jackpotUsd: number;
  createdAt: string;
  walletAddress: string;
  drawDate: string | null;
};

function shortWallet(addr: string) {
  if (!addr || addr.length < 8) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export default function HistoryPage() {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <HistoryInner />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

function HistoryInner() {
  const username = 'your_handle';
  const { publicKey, connected } = useWallet();

  const [solBalance, setSolBalance] = useState<number | null | 'error'>(null);
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<HistoryTicket[]>([]);
  const [error, setError] = useState<string | null>(null);

  const walletConnected = !!publicKey && connected;
  const currentWalletAddress = publicKey?.toBase58() ?? null;

  // SOL balance (same as dashboard)
  useEffect(() => {
    if (!publicKey) {
      setSolBalance(null);
      return;
    }

    let cancelled = false;
    setSolBalance(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/sol-balance?address=${publicKey.toBase58()}`
        );
        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data: { lamports: number } = await res.json();
        if (cancelled) return;
        setSolBalance(data.lamports / LAMPORTS_PER_SOL);
      } catch (err) {
        console.error('Error loading SOL balance (history)', err);
        if (!cancelled) setSolBalance('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  // Load history for this wallet
  useEffect(() => {
    if (!currentWalletAddress) {
      setTickets([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/tickets/history?walletAddress=${currentWalletAddress}`
        );
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        if (Array.isArray(data.tickets)) {
          setTickets(data.tickets);
        } else {
          setTickets([]);
        }
      } catch (err) {
        console.error('Error loading ticket history', err);
        if (!cancelled)
          setError((err as Error).message ?? 'Failed to load history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentWalletAddress]);

  // Group by draw date (YYYY-MM-DD)
  const grouped = tickets.reduce<Record<string, HistoryTicket[]>>(
    (acc, t) => {
      const key = t.drawDate
        ? t.drawDate.slice(0, 10)
        : new Date(t.createdAt).toISOString().slice(0, 10);
      acc[key] = acc[key] || [];
      acc[key].push(t);
      return acc;
    },
    {}
  );

  const orderedDates = Object.keys(grouped).sort((a, b) =>
    a < b ? 1 : -1
  );

  return (
    <main className="min-h-screen bg-black text-slate-50 relative">
      <div className="mx-auto flex max-w-6xl">
        {/* Left nav */}
        <aside className="hidden min-h-screen w-56 border-r border-slate-900 px-3 py-4 md:flex flex-col justify-between">
          <div className="space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-2 px-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-lg">
                💎
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-tight">
                  XPOT
                </span>
                <span className="text-[11px] text-slate-500">
                  Daily crypto jackpot
                </span>
              </div>
            </div>

            {/* Nav */}
            <nav className="space-y-1 text-sm">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-full px-3 py-2 text-slate-300 hover:bg-slate-900/70"
              >
                <span className="text-lg">🏠</span>
                <span>Dashboard</span>
              </Link>
              <Link
                href="/history"
                className="flex items-center gap-3 rounded-full px-3 py-2 font-medium bg-slate-900 text-slate-50"
              >
                <span className="text-lg">🎟️</span>
                <span>Draw history</span>
              </Link>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-full px-3 py-2 text-slate-300 hover:bg-slate-900/70"
              >
                <span className="text-lg">⚙️</span>
                <span>Settings</span>
              </button>
            </nav>
          </div>

          {/* Mini account chip (same style) */}
          <div className="relative">
            <div className="mb-2 flex items-center justify-between rounded-2xl bg-slate-900/70 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs">
                  @
                </div>
                <div className="leading-tight">
                  <p className="flex items-center gap-1 text-xs font-semibold text-slate-50">
                    XPOT user
                  </p>
                  <p className="text-[11px] text-slate-500">@{username}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main shell */}
        <div className="flex flex-1 gap-6 rounded-[28px] border border-slate-800/70 bg-[#020617] shadow-[0_30px_100px_rgba(0,0,0,0.9)] overflow-hidden">
          {/* Center column */}
          <section className="min-h-screen flex-1">
            {/* Sticky header */}
            <header className="sticky top-0 z-10 border-b border-slate-900 bg-black/70 px-4 py-3 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Draw history
                  </h1>
                  <p className="text-[13px] text-slate-400">
                    All XPOT tickets you’ve claimed, grouped by draw day.
                  </p>
                </div>
              </div>
            </header>

            <div className="space-y-4 px-4 pb-10 pt-3">
              {!walletConnected && (
                <article className="premium-card px-4 py-4">
                  <p className="text-sm text-slate-200">
                    Connect your wallet to see your draw history.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    History is based on your wallet address.
                  </p>
                </article>
              )}

              {walletConnected && (
                <>
                  <article className="premium-card px-4 py-4">
                    <p className="text-xs text-slate-400">
                      Wallet:{' '}
                      <span className="font-mono text-slate-200">
                        {shortWallet(currentWalletAddress!)}
                      </span>
                    </p>
                    {loading && (
                      <p className="mt-2 text-xs text-slate-400">
                        Loading your tickets…
                      </p>
                    )}
                    {error && (
                      <p className="mt-2 text-xs text-amber-300">{error}</p>
                    )}
                    {!loading && !error && tickets.length === 0 && (
                      <p className="mt-2 text-xs text-slate-400">
                        No tickets found yet. Claim your first ticket on the
                        dashboard.
                      </p>
                    )}
                  </article>

                  {orderedDates.map(date => (
                    <section key={date} className="premium-card px-4 py-4">
                      <h2 className="text-sm font-semibold text-slate-100">
                        Draw day: {date}
                      </h2>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Tickets for this day’s jackpot draw.
                      </p>

                      <div className="mt-3 space-y-2 border-l border-slate-800/80 pl-3">
                        {grouped[date].map(ticket => (
                          <article
                            key={ticket.id}
                            className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 pb-3 pt-2"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-sm text-slate-50">
                                    {ticket.code}
                                  </span>

                                  {ticket.status === 'in-draw' && (
                                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                                      In draw
                                    </span>
                                  )}
                                  {ticket.status === 'won' && (
                                    <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                                      Winner
                                    </span>
                                  )}
                                  {ticket.status === 'claimed' && (
                                    <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-300">
                                      Claimed
                                    </span>
                                  )}
                                  {ticket.status === 'expired' && (
                                    <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                                      Expired
                                    </span>
                                  )}
                                  {ticket.status === 'not-picked' && (
                                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                                      Not picked
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1 text-xs text-slate-400">
                                  {ticket.label}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                  Created:{' '}
                                  {new Date(ticket.createdAt).toLocaleString()}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                  Wallet:{' '}
                                  <span className="font-mono">
                                    {shortWallet(ticket.walletAddress)}
                                  </span>
                                </p>
                              </div>

                              <div className="text-right text-[11px] text-slate-400">
                                <p>
                                  Jackpot: $
                                  {ticket.jackpotUsd.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </>
              )}
            </div>
          </section>

          {/* Right sidebar (wallet) */}
          <aside className="hidden w-80 flex-col gap-4 bg-slate-950/40 px-4 py-4 lg:flex">
            <div className="premium-card p-4">
              <h3 className="text-sm font-semibold">Wallet</h3>
              <p className="mt-1 text-xs text-slate-400">
                Connect wallet to see your draw history.
              </p>
              <div className="mt-3">
                <WalletMultiButton className="w-full !rounded-full !h-9 !text-sm" />
              </div>

              {publicKey && (
                <div className="mt-3 text-xs text-slate-300">
                  <p className="break-all">
                    Wallet:{' '}
                    <span className="font-mono">{publicKey.toBase58()}</span>
                  </p>
                  <p className="mt-1">
                    SOL balance:{' '}
                    {solBalance === null && publicKey
                      ? 'Loading...'
                      : solBalance === 'error'
                      ? 'Unavailable'
                      : typeof solBalance === 'number'
                      ? `${solBalance.toFixed(4)} SOL`
                      : '-'}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
