// app/dashboard/history/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useUser, SignOutButton } from '@clerk/nextjs';
import XpotPageShell from '@/components/XpotPageShell';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString('de-DE');
}

function formatDateTime(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type EntryStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

type Entry = {
  id: string;
  code: string;
  status: EntryStatus;
  label: string;
  jackpotUsd: string;
  createdAt: string;
  walletAddress: string;
  drawDate?: string | null;
};

type RecentWinner = {
  id: string;
  drawDate: string;
  ticketCode: string;
  jackpotUsd: number;
  walletAddress: string;
  handle?: string | null;
};

function shortWallet(addr: string) {
  if (!addr || addr.length < 8) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

// Debug logger for wallet state
function WalletDebug() {
  const { publicKey, connected, wallet } = useWallet();

  useEffect(() => {
    console.log('[XPOT] Wallet state changed (history):', {
      connected,
      publicKey: publicKey?.toBase58() ?? null,
      walletName: wallet?.adapter?.name ?? null,
    });
  }, [connected, publicKey, wallet]);

  return null;
}

// Optional UX helper: show hint under wallet button
function WalletStatusHint() {
  const { wallets, connected } = useWallet();

  const anyDetected = wallets.some(
    w =>
      w.readyState === WalletReadyState.Installed ||
      w.readyState === WalletReadyState.Loadable,
  );

  if (connected) return null;

  if (!anyDetected) {
    return (
      <p className="mt-2 text-xs text-amber-300">
        No Solana wallet detected. Install Phantom or Jupiter to continue.
      </p>
    );
  }

  return (
    <p className="mt-2 text-xs text-slate-500">
      Click “Select Wallet” and choose Phantom or Jupiter to connect.
    </p>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function HistoryPage() {
  const { publicKey, connected } = useWallet();
  const { user, isLoaded: isUserLoaded } = useUser();

  const [historyEntries, setHistoryEntries] = useState<Entry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [recentWinners, setRecentWinners] = useState<RecentWinner[]>([]);
  const [loadingWinners, setLoadingWinners] = useState(false);
  const [winnersError, setWinnersError] = useState<string | null>(null);

  const externalAccounts = (user?.externalAccounts || []) as any[];

  const xAccount =
    externalAccounts.find(acc => {
      const provider = (acc.provider ?? '') as string;
      return (
        provider === 'oauth_x' ||
        provider === 'oauth_twitter' ||
        provider === 'twitter' ||
        provider.toLowerCase().includes('twitter') ||
        provider.toLowerCase().includes('x')
      );
    }) || externalAccounts[0];

  const handle =
    xAccount?.username ||
    xAccount?.screenName ||
    null;

  const avatar = xAccount?.imageUrl || user?.imageUrl || null;
  const name = user?.fullName || handle || 'XPOT user';

  const currentWalletAddress = publicKey?.toBase58() ?? null;

  // ─────────────────────────────────────────────
  // Load wallet-specific history
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!publicKey) {
      setHistoryEntries([]);
      setHistoryError(null);
      return;
    }

    let cancelled = false;
    setLoadingHistory(true);
    setHistoryError(null);

    (async () => {
      try {
        // API can ignore limit; this is just a hint
        const res = await fetch(
          `/api/tickets/history?wallet=${publicKey.toBase58()}&limit=50`,
        );
        if (!res.ok) throw new Error('Failed to load history');

        const data = await res.json();
        if (cancelled) return;

        if (Array.isArray(data.tickets)) {
          setHistoryEntries(
            data.tickets.map((t: any) => ({
              id: t.id,
              code: t.code,
              status: t.status as EntryStatus,
              label: t.label,
              jackpotUsd: `$${(t.jackpotUsd ?? 10_000).toLocaleString?.() ?? '10,000'}`,
              createdAt: t.createdAt,
              walletAddress: t.walletAddress,
              drawDate: t.drawDate ?? null,
            })),
          );
        } else {
          setHistoryEntries([]);
        }
      } catch (err) {
        console.error('Failed to load history', err);
        if (!cancelled) {
          setHistoryError(
            (err as Error).message ?? 'Failed to load history',
          );
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  // ─────────────────────────────────────────────
  // Load recent winners (global)
  // ─────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setLoadingWinners(true);
    setWinnersError(null);

    (async () => {
      try {
        const res = await fetch('/api/winners/recent?limit=20');
        if (!res.ok) throw new Error('Failed to load recent winners');

        const data = await res.json();
        if (cancelled) return;

        if (Array.isArray(data.winners)) {
          setRecentWinners(
            data.winners.map((w: any) => ({
              id: w.id,
              drawDate: w.drawDate,
              ticketCode: w.ticketCode,
              jackpotUsd: w.jackpotUsd ?? 0,
              walletAddress: w.walletAddress,
              handle: w.handle ?? null,
            })),
          );
        } else {
          setRecentWinners([]);
        }
      } catch (err) {
        console.error('Failed to load recent winners', err);
        if (!cancelled) {
          setWinnersError(
            (err as Error).message ?? 'Failed to load recent winners',
          );
        }
      } finally {
        if (!cancelled) setLoadingWinners(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <XpotPageShell>
      <WalletDebug />

      {/* Mobile top bar */}
      <header className="flex items-center justify-between px-4 py-3 md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/img/xpot-logo-light.png"
            alt="XPOT"
            width={110}
            height={30}
            priority
          />
        </Link>

        <WalletMultiButton className="!h-8 !rounded-full !px-3 !text-xs" />
      </header>

      <div className="mx-auto flex w-full max-w-6xl">
        {/* Left nav */}
        <aside className="hidden min-h-screen w-56 border-r border-slate-900 px-3 pt-0 pb-4 md:flex flex-col">
          <div className="space-y-5">
            {/* Logo */}
            <div className="pt-3 px-1">
              <Link href="/" className="inline-flex flex-col gap-1">
                <Image
                  src="/img/xpot-logo-light.png"
                  alt="XPOT"
                  width={120}
                  height={32}
                  priority
                />
              </Link>
            </div>

            <SignOutButton redirectUrl="/dashboard">
              <button className="text-xs text-slate-400 hover:text-white">
                Log out
              </button>
            </SignOutButton>

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
                href="/dashboard/history"
                className="flex w-full items-center gap-3 rounded-full px-3 py-2 font-medium bg-slate-900 text-slate-50"
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

          <div className="mt-auto text-xs text-slate-500" />
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
                    Your previous XPOT entries and outcomes across all draws.
                  </p>
                </div>
              </div>
            </header>

            {/* Scroll content */}
            <div className="space-y-4 px-0">
              {/* Profile header */}
              <section className="flex items-center justify-between border-b border-slate-900 bg-gradient-to-r from-slate-950 via-slate-900/40 to-slate-950 px-4 pt-3 pb-2">
                {/* Left: identity pill */}
                <div className="inline-flex items-center gap-3 rounded-full bg-slate-950/80 px-3 py-2">
                  {/* Avatar */}
                  <div className="h-9 w-9 overflow-hidden rounded-full bg-slate-800">
                    {avatar ? (
                      <Image
                        src={avatar}
                        alt={handle || 'X avatar'}
                        width={36}
                        height={36}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                        @
                      </div>
                    )}
                  </div>

                  {/* Name + handle */}
                  <div className="flex flex-col leading-tight">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-50">
                        {name || 'XPOT user'}
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        X identity
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      {handle && (
                        <a
                          href={`https://x.com/${handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-emerald-300"
                        >
                          @{handle}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: wallet snippet */}
                <div className="hidden items-center gap-2 text-[11px] text-slate-500 sm:flex">
                  {currentWalletAddress ? (
                    <>
                      <span>Current wallet</span>
                      <span className="font-mono text-slate-200">
                        {shortWallet(currentWalletAddress)}
                      </span>
                    </>
                  ) : (
                    <span>Connect a wallet to view your history.</span>
                  )}
                </div>
              </section>

              {/* Your ticket history */}
              <section className="px-4 pb-8 pt-3">
                <h2 className="text-sm font-semibold text-slate-200">
                  Your tickets across all draws
                </h2>
                <p className="text-xs text-slate-500">
                  Each row is a ticket you&apos;ve had in a previous XPOT
                  draw, tied to your currently connected wallet.
                </p>

                {!publicKey && (
                  <p className="mt-3 text-xs text-slate-500">
                    Connect a wallet on the right to load your full ticket
                    history.
                  </p>
                )}

                {publicKey && (
                  <div className="mt-4 space-y-2 border-l border-slate-800/80 pl-3">
                    {loadingHistory && (
                      <p className="text-xs text-slate-500">
                        Loading ticket history…
                      </p>
                    )}

                    {!loadingHistory &&
                      historyEntries.length === 0 && (
                        <p className="text-xs text-slate-500">
                          No previous draws yet for this wallet.
                        </p>
                      )}

                    {historyEntries.map(entry => {
                      const statusLabel =
                        entry.status === 'won'
                          ? 'Winner'
                          : entry.status === 'claimed'
                          ? 'Claimed'
                          : entry.status === 'expired'
                          ? 'Expired'
                          : entry.status === 'in-draw'
                          ? 'In draw'
                          : 'Not picked';

                      const statusClass =
                        entry.status === 'won'
                          ? 'bg-amber-400/15 text-amber-200 border-amber-400/40'
                          : entry.status === 'claimed'
                          ? 'bg-sky-500/10 text-sky-200 border-sky-500/40'
                          : entry.status === 'expired'
                          ? 'bg-slate-700/40 text-slate-200 border-slate-500/60'
                          : entry.status === 'in-draw'
                          ? 'bg-emerald-500/10 text-emerald-200 border-emerald-400/40'
                          : 'bg-slate-800/60 text-slate-200 border-slate-600/70';

                      return (
                        <article
                          key={entry.id}
                          className="rounded-2xl border border-slate-900 bg-slate-950/70 px-4 pb-3 pt-3"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm text-slate-50">
                                  {entry.code}
                                </span>
                                <span
                                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClass}`}
                                >
                                  {statusLabel}
                                </span>
                              </div>

                              <p className="mt-1 text-xs text-slate-400">
                                {entry.label}
                              </p>

                              <p className="mt-1 text-[11px] text-slate-500">
                                Draw date:{' '}
                                {entry.drawDate
                                  ? formatDate(entry.drawDate)
                                  : formatDate(entry.createdAt)}
                              </p>

                              <p className="mt-0.5 text-[11px] text-slate-500">
                                Ticket created:{' '}
                                {formatDateTime(entry.createdAt)}
                              </p>

                              <p className="mt-0.5 text-[11px] text-slate-500">
                                Wallet:{' '}
                                <span className="font-mono">
                                  {shortWallet(entry.walletAddress)}
                                </span>
                              </p>
                            </div>

                            <div className="text-right text-[11px] text-slate-400">
                              <p>Jackpot at draw:</p>
                              <p className="font-semibold text-emerald-300">
                                {entry.jackpotUsd}
                              </p>
                            </div>
                          </div>
                        </article>
                      );
                    })}

                    {historyError && (
                      <p className="mt-2 text-[11px] text-amber-300">
                        {historyError}
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* Recent winners panel */}
              <section className="px-4 pb-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-200">
                    Recent XPOT winners
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Global winner feed (not just your wallet).
                  </p>
                </div>

                <div className="mt-3 rounded-2xl border border-slate-900 bg-slate-950/60 px-4 py-3">
                  {loadingWinners && (
                    <p className="text-[11px] text-slate-500">
                      Loading recent winners…
                    </p>
                  )}

                  {winnersError && (
                    <p className="text-[11px] text-amber-300">
                      {winnersError}
                    </p>
                  )}

                  {!loadingWinners &&
                    !winnersError &&
                    recentWinners.length === 0 && (
                      <p className="text-[11px] text-slate-500">
                        No completed draws yet. Once XPOT starts, the full
                        winner feed appears here.
                      </p>
                    )}

                  {!loadingWinners && recentWinners.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {recentWinners.map(w => (
                        <article
                          key={w.id}
                          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-3 py-2"
                        >
                          <div>
                            <p className="text-[11px] text-slate-400">
                              {formatDate(w.drawDate)}
                            </p>
                            <p className="mt-0.5 text-sm font-mono text-slate-50">
                              {w.ticketCode}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              Jackpot:{' '}
                              <span className="font-semibold text-emerald-300">
                                $
                                {Number(
                                  w.jackpotUsd ?? 0,
                                ).toLocaleString()}
                              </span>
                            </p>
                          </div>
                          <div className="text-right">
                            {w.handle ? (
                              <a
                                href={`https://x.com/${w.handle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-emerald-300 hover:text-emerald-200"
                              >
                                @{w.handle}
                              </a>
                            ) : (
                              <p className="text-[11px] text-slate-500">
                                X handle soon
                              </p>
                            )}
                            <p className="mt-0.5 text-[10px] text-slate-600">
                              Wallet:{' '}
                              <span className="font-mono">
                                {shortWallet(w.walletAddress)}
                              </span>
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </section>

          {/* Right sidebar */}
          <aside className="hidden w-80 flex-col gap-4 bg-slate-950/40 px-4 py-4 lg:flex">
            {/* Wallet card */}
            <div className="premium-card p-4">
              <h3 className="text-sm font-semibold">Wallet</h3>
              <p className="mt-1 text-xs text-slate-400">
                Connect a wallet to view your XPOT ticket history.
              </p>

              <div className="mt-3">
                <WalletMultiButton className="w-full !rounded-full !h-9 !text-sm" />
                <WalletStatusHint />
              </div>

              {publicKey && (
                <div className="mt-3 text-xs text-slate-300">
                  <p className="break-all">
                    Wallet:{' '}
                    <span className="font-mono">
                      {publicKey.toBase58()}
                    </span>
                  </p>
                </div>
              )}

              {!publicKey && (
                <p className="mt-2 text-[11px] text-slate-500">
                  Phantom and other Solana wallets work here.
                </p>
              )}

              <p className="mt-3 text-[11px] text-slate-500">
                XPOT never takes custody of your funds. History is derived
                from your on-chain entries.
              </p>
            </div>

            {/* Mini legend */}
            <div className="premium-card p-4">
              <h3 className="text-sm font-semibold">Status legend</h3>
              <ul className="mt-2 text-[11px] text-slate-400 space-y-1">
                <li>• In draw – ticket was live for that daily XPOT.</li>
                <li>• Winner – your ticket hit that day’s XPOT.</li>
                <li>• Claimed – you already collected the XPOT.</li>
                <li>• Expired – XPOT rolled into a future draw.</li>
                <li>• Not picked – you had a ticket, but didn&apos;t win.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </XpotPageShell>
  );
}
