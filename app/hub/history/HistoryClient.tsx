// app/hub/history/HistoryClient.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WalletReadyState } from '@solana/wallet-adapter-base';

import { useUser, SignOutButton } from '@clerk/nextjs';

import XpotPageShell from '@/components/XpotPageShell';
import { History, LogOut, ArrowLeft, Trophy, Ticket, X } from 'lucide-react';

// ─────────────────────────────────────────────
// Formatting helpers
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

function shortWallet(addr: string) {
  if (!addr || addr.length < 10) return addr || '—';
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type EntryStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

type Entry = {
  id: string;
  code: string;
  status: EntryStatus;
  label?: string | null;
  jackpotUsd?: string | number | null;
  createdAt: string;
  walletAddress: string;
};

type RecentWinner = {
  id: string;
  drawDate: string;
  ticketCode: string;
  jackpotUsd: number;
  walletAddress: string;
  handle?: string | null;
};

// ─────────────────────────────────────────────
// Small UI helpers
// ─────────────────────────────────────────────

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 transition disabled:cursor-not-allowed disabled:opacity-40';

function StatusPill({ status }: { status: EntryStatus }) {
  const tone =
    status === 'won' || status === 'claimed'
      ? 'bg-emerald-500/10 text-emerald-300'
      : status === 'in-draw'
      ? 'bg-sky-500/10 text-sky-200'
      : status === 'expired'
      ? 'bg-amber-500/10 xpot-gold-text'
      : 'bg-slate-800/70 text-slate-200';

  const label = status.replace('-', ' ').toUpperCase();

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${tone}`}
    >
      {label}
    </span>
  );
}

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
      <p className="mt-2 text-xs xpot-gold-text">
        No Solana wallet detected. Install Phantom, Solflare or Backpack to continue.
      </p>
    );
  }

  // Wallet detected but not connected → show nothing
  return null;
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function HistoryClient() {
  const { publicKey, connected } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? null;

  const { user, isLoaded: isUserLoaded } = useUser();

  // Resolve X identity (same approach as dashboard)
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

  const handle = xAccount?.username || xAccount?.screenName || null;
  const avatar = xAccount?.imageUrl || user?.imageUrl || null;

  const [historyEntries, setHistoryEntries] = useState<Entry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [recentWinners, setRecentWinners] = useState<RecentWinner[]>([]);
  const [winnersError, setWinnersError] = useState<string | null>(null);
  const [loadingWinners, setLoadingWinners] = useState(false);

  // Keep X identity synced (same as dashboard)
  useEffect(() => {
    if (!isUserLoaded || !user) return;

    (async () => {
      try {
        await fetch('/api/me/sync-x', { method: 'POST' });
      } catch (e) {
        console.error('[XPOT] Failed to sync X identity', e);
      }
    })();
  }, [isUserLoaded, user]);

  // Load wallet-specific history
  useEffect(() => {
    if (!walletAddress) {
      setHistoryEntries([]);
      setHistoryError(null);
      return;
    }

    let cancelled = false;
    setLoadingHistory(true);
    setHistoryError(null);

    (async () => {
      try {
        const res = await fetch(`/api/tickets/history?wallet=${walletAddress}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Failed to load history');

        const data = await res.json();
        if (cancelled) return;

        if (Array.isArray(data.tickets)) {
          setHistoryEntries(
            data.tickets.map((t: any) => ({
              id: t.id,
              code: t.code,
              status: (t.status as EntryStatus) ?? 'not-picked',
              label: t.label ?? null,
              jackpotUsd:
                t.jackpotUsd ??
                (typeof t.jackpotUsd === 'number'
                  ? t.jackpotUsd
                  : t.jackpotUsd ?? null),
              createdAt: t.createdAt,
              walletAddress: t.walletAddress,
            })),
          );
        } else {
          setHistoryEntries([]);
        }
      } catch (err) {
        console.error('Failed to load history', err);
        if (!cancelled) {
          setHistoryError((err as Error).message ?? 'Failed to load history');
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  // Load recent winners (global)
  useEffect(() => {
    let cancelled = false;
    setLoadingWinners(true);
    setWinnersError(null);

    (async () => {
      try {
        const res = await fetch('/api/winners/recent?limit=12', { cache: 'no-store' });
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
          setWinnersError((err as Error).message ?? 'Failed to load recent winners');
        }
      } finally {
        if (!cancelled) setLoadingWinners(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedWallet = walletAddress?.toLowerCase() ?? null;
  const myHistory = useMemo(() => {
    if (!normalizedWallet) return [];
    return historyEntries.filter(e => e.walletAddress?.toLowerCase() === normalizedWallet);
  }, [historyEntries, normalizedWallet]);

  return (
    <XpotPageShell title="History" subtitle="Recent XPOT winners and your past entries">

      <WalletStatusHint />

      {/* Identity strip */}
      <section className="mt-6 rounded-[30px] border border-slate-900/70 bg-slate-950/60 px-5 py-5 backdrop-blur-xl">
        <p className="text-sm font-semibold text-slate-100">Your identity</p>
        <p className="mt-1 text-xs text-slate-400">
          History is tied to your connected wallet. Your public identity is your X handle.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Wallet</p>
            <p className="mt-1 font-mono text-sm text-slate-100">
              {walletAddress ? shortWallet(walletAddress) : 'Not connected'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">X handle</p>
            <p className="mt-1 text-sm text-slate-100">
              {handle ? (
                <span className="inline-flex items-center gap-2">
                  <X className="h-4 w-4 text-slate-400" />
                  <span className="font-mono">@{handle}</span>
                </span>
              ) : (
                <span className="text-slate-500">Not linked yet</span>
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Profile</p>
            <div className="mt-1 flex items-center gap-2">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt="avatar"
                  className="h-7 w-7 rounded-full border border-slate-700/70"
                />
              ) : (
                <div className="h-7 w-7 rounded-full border border-slate-700/70 bg-slate-900/70" />
              )}
              <span className="text-sm text-slate-100">
                {user?.fullName || (handle ? `@${handle}` : 'XPOT user')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main grid */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Left: Your history */}
        <div className="space-y-4">
          <section className="rounded-[30px] border border-slate-900/70 bg-slate-950/60 px-5 py-5 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">Your past entries</p>
                <p className="mt-1 text-xs text-slate-400">Entries linked to your connected wallet.</p>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/70 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                <Ticket className="h-4 w-4" />
                Wallet history
              </span>
            </div>

            <div className="mt-4">
              {!connected && (
                <p className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3 text-xs text-slate-500">
                  Connect your wallet to see your entry history.
                </p>
              )}

              {connected && loadingHistory && <p className="text-xs text-slate-500">Loading history…</p>}

              {connected && historyError && <p className="text-xs xpot-gold-text">{historyError}</p>}

              {connected && !loadingHistory && !historyError && myHistory.length === 0 && (
                <p className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3 text-xs text-slate-500">
                  No past entries found for this wallet yet.
                </p>
              )}

              {connected && !loadingHistory && !historyError && myHistory.length > 0 && (
                <div className="mt-2 divide-y divide-slate-800/70 border-t border-slate-800/80">
                  {myHistory.map(e => (
                    <article key={e.id} className="flex flex-col gap-2 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-[12px] text-slate-100">{e.code}</p>
                        <StatusPill status={e.status} />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                        <span className="font-mono">{formatDateTime(e.createdAt)}</span>
                        <span className="font-mono">{shortWallet(e.walletAddress)}</span>
                      </div>

                      {e.label ? (
                        <p className="text-[11px] text-slate-500">
                          Label: <span className="text-slate-300">{e.label}</span>
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right: Recent winners */}
        <div className="space-y-4">
          <section className="rounded-[30px] border border-slate-900/70 bg-slate-950/60 px-5 py-5 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">Recent winners</p>
                <p className="mt-1 text-xs text-slate-400">
                  Latest completed draws (public identity by X handle).
                </p>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/70 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                <Trophy className="h-4 w-4" />
                Global log
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {loadingWinners && <p className="text-xs text-slate-500">Loading winners…</p>}
              {winnersError && <p className="text-xs xpot-gold-text">{winnersError}</p>}

              {!loadingWinners && !winnersError && recentWinners.length === 0 && (
                <p className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3 text-xs text-slate-500">
                  No completed draws yet.
                </p>
              )}

              {!loadingWinners && !winnersError && recentWinners.length > 0 &&
                recentWinners.map(w => (
                  <div
                    key={w.id}
                    className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-400">{formatDate(w.drawDate)}</p>
                      <p className="text-xs text-slate-400">
                        {w.handle ? (
                          <span className="font-mono text-slate-200">@{w.handle}</span>
                        ) : (
                          <span className="font-mono text-slate-500">{shortWallet(w.walletAddress)}</span>
                        )}
                      </p>
                    </div>

                    <p className="mt-1 font-mono text-sm text-slate-100">{w.ticketCode}</p>
                  </div>
                ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-800/70 pt-3 text-xs text-slate-500">
              <span>Tip: history is wallet-bound, winners are handle-first.</span>
              <Link href="/dashboard" className="text-slate-300 hover:text-white">
                Back to dashboard
              </Link>
            </div>
          </section>
        </div>
      </section>

      <footer className="mt-8 border-t border-slate-800/70 pt-4 text-xs text-slate-500">
        XPOT is in Pre-Launch Mode. UI is final, wiring continues.
      </footer>
    </XpotPageShell>
  );
}
