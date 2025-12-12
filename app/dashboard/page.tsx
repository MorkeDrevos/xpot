// app/dashboard/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WalletReadyState } from '@solana/wallet-adapter-base';

import { useUser, SignOutButton } from '@clerk/nextjs';
import { REQUIRED_XPOT } from '../../lib/xpot';

import {
  ArrowRight,
  CheckCircle2,
  Copy,
  History,
  LogOut,
  ShieldCheck,
  Sparkles,
  Ticket,
  Wallet,
  X,
} from 'lucide-react';

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
  if (!addr || addr.length < 8) return addr;
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
  label: string;
  jackpotUsd: string;
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

const initialEntries: Entry[] = [];

// ─────────────────────────────────────────────
// Small UI helpers
// ─────────────────────────────────────────────

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 transition disabled:cursor-not-allowed disabled:opacity-40';

function StatusPill({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: 'slate' | 'emerald' | 'amber' | 'sky';
}) {
  const cls =
    tone === 'emerald'
      ? 'bg-emerald-500/10 text-emerald-300'
      : tone === 'amber'
      ? 'bg-amber-500/10 text-amber-200'
      : tone === 'sky'
      ? 'bg-sky-500/10 text-sky-200'
      : 'bg-slate-800/70 text-slate-200';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${cls}`}
    >
      {children}
    </span>
  );
}

// Debug logger for wallet state
function WalletDebug() {
  const { publicKey, connected, wallet } = useWallet();

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[XPOT] Wallet state changed:', {
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

export default function DashboardPage() {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  const [ticketClaimed, setTicketClaimed] = useState(false);
  const [todaysTicket, setTodaysTicket] = useState<Entry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const { publicKey, connected, disconnect } = useWallet();
  const [xpotBalance, setXpotBalance] = useState<number | null | 'error'>(null);

  const walletConnected = !!publicKey && connected;
  const currentWalletAddress = publicKey?.toBase58() ?? null;

  const [historyEntries, setHistoryEntries] = useState<Entry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [recentWinners, setRecentWinners] = useState<RecentWinner[]>([]);
  const [loadingWinners, setLoadingWinners] = useState(false);
  const [winnersError, setWinnersError] = useState<string | null>(null);

  const hasRequiredXpot =
    typeof xpotBalance === 'number' && xpotBalance >= REQUIRED_XPOT;

  // ─────────────────────────────────────────────
  // Clerk user (for avatar + handle)
  // ─────────────────────────────────────────────

  const { user, isLoaded: isUserLoaded } = useUser();
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
  const name = user?.fullName || handle || 'XPOT user';

  // ─────────────────────────────────────────────
  // Sync X identity into DB whenever user is loaded
  // ─────────────────────────────────────────────

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

  // ─────────────────────────────────────────────
  // Wire wallet → DB whenever it connects
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!isUserLoaded || !user) return;
    if (!publicKey || !connected) return;

    const address = publicKey.toBase58();

    (async () => {
      try {
        await fetch('/api/me/wallet-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        });
      } catch (e) {
        console.error('[XPOT] Failed to sync wallet', e);
      }
    })();
  }, [isUserLoaded, user, publicKey, connected]);

  // ─────────────────────────────────────────────
  // Load today's tickets from DB
  // ─────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function loadTickets() {
      try {
        const res = await fetch('/api/tickets/today');
        if (!res.ok) throw new Error('Failed to load tickets');

        const data = await res.json();
        if (!cancelled && Array.isArray(data.tickets)) {
          if (data.tickets.length > 0) setEntries(data.tickets);
        }
      } catch (err) {
        console.error('Failed to load tickets from DB', err);
        if (!cancelled) {
          setTicketsError((err as Error).message ?? 'Failed to load tickets');
        }
      } finally {
        if (!cancelled) setLoadingTickets(false);
      }
    }

    loadTickets();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─────────────────────────────────────────────
  // Sync "today's ticket" state with DB
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!currentWalletAddress) {
      setTicketClaimed(false);
      setTodaysTicket(null);
      return;
    }

    const myTicket = entries.find(
      t => t.walletAddress === currentWalletAddress && t.status === 'in-draw',
    );

    if (myTicket) {
      setTicketClaimed(true);
      setTodaysTicket(myTicket);
    } else {
      setTicketClaimed(false);
      setTodaysTicket(null);
    }
  }, [entries, currentWalletAddress]);

  // ─────────────────────────────────────────────
  // XPOT balance (via API route)
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!publicKey) {
      setXpotBalance(null);
      return;
    }

    let cancelled = false;
    setXpotBalance(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/xpot-balance?address=${publicKey.toBase58()}`,
        );
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data: { balance: number } = await res.json();
        if (cancelled) return;
        setXpotBalance(data.balance);
      } catch (err) {
        console.error('Error loading XPOT balance (via API)', err);
        if (!cancelled) setXpotBalance('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  // ─────────────────────────────────────────────
  // Load wallet-specific draw history
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
        const res = await fetch(
          `/api/tickets/history?wallet=${publicKey.toBase58()}`,
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
              jackpotUsd: `${
                (t.jackpotUsd ?? 10_000).toLocaleString?.() ?? '10,000'
              }`,
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
        const res = await fetch('/api/winners/recent?limit=5');
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
  // Ticket helpers
  // ─────────────────────────────────────────────

  async function handleCopy(entry: Entry) {
    try {
      await navigator.clipboard.writeText(entry.code);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  }

  async function handleClaimTicket() {
    if (!walletConnected || !publicKey) return;
    if (loadingTickets || claiming) return;

    setClaimError(null);
    setClaiming(true);

    const walletAddress = publicKey.toBase58();

    try {
      const res = await fetch('/api/tickets/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok || !data.ok) {
        const code = data.error as string | undefined;

        switch (code) {
          case 'NOT_ENOUGH_XPOT':
            setClaimError(
              `You need at least ${(
                data.required ?? REQUIRED_XPOT
              ).toLocaleString()} XPOT to get today’s ticket. Your wallet currently has ${Number(
                data.balance ?? 0,
              ).toLocaleString()} XPOT.`,
            );
            break;

          case 'NOT_ENOUGH_SOL':
            setClaimError(
              'Your wallet needs some SOL for network fees before you can get today’s ticket.',
            );
            break;

          case 'XPOT_CHECK_FAILED':
            setClaimError(
              'Could not verify your XPOT balance right now. Please try again in a moment.',
            );
            break;

          case 'MISSING_WALLET':
          case 'INVALID_BODY':
            setClaimError(
              'Something is wrong with your wallet address. Try reconnecting your wallet and trying again.',
            );
            break;

          default:
            setClaimError('Ticket request failed. Please try again.');
        }

        console.error('Claim failed', res.status, text);
        return;
      }

      const ticket: Entry = data.ticket;
      const tickets: Entry[] | undefined = data.tickets;

      if (Array.isArray(tickets) && tickets.length > 0) {
        setEntries(tickets);
      } else if (ticket) {
        setEntries(prev => {
          const others = prev.filter(t => t.id !== ticket.id);
          return [ticket, ...others];
        });
      }

      setTicketClaimed(true);
      setTodaysTicket(ticket);
      setClaimError(null);
    } catch (err) {
      console.error('Error calling /api/tickets/claim', err);
      setClaimError(
        'Unexpected error while getting your ticket. Please try again.',
      );
    } finally {
      setClaiming(false);
    }
  }

  // Derived
  const normalizedWallet = currentWalletAddress?.toLowerCase();
  const myTickets: Entry[] = useMemo(() => {
    if (!normalizedWallet) return [];
    return entries.filter(e => e.walletAddress?.toLowerCase() === normalizedWallet);
  }, [entries, normalizedWallet]);

  const winner = entries.find(e => e.status === 'won') || null;
  const iWonToday =
    !!winner &&
    !!normalizedWallet &&
    winner.walletAddress?.toLowerCase() === normalizedWallet;

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-[#02020a] text-slate-100">
      <WalletDebug />

      {/* GLOBAL NEBULA BACKGROUND (fixed, always visible) */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#02020a]" />
      <div
        className="
          pointer-events-none fixed inset-0 -z-10
          opacity-95
          bg-[radial-gradient(circle_at_10%_0%,rgba(37,99,235,0.45),transparent_60%),
              radial-gradient(circle_at_100%_30%,rgba(168,85,247,0.55),transparent_60%),
              radial-gradient(circle_at_100%_90%,rgba(236,72,153,0.45),transparent_65%),
              radial-gradient(circle_at_35%_85%,rgba(56,189,248,0.18),transparent_55%)]
        "
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.65)_72%,rgba(0,0,0,0.85)_100%)]" />
      <div
        className="
          pointer-events-none fixed inset-x-0 top-0 -z-10
          h-[260px] opacity-80 mix-blend-screen
          [background-image:
            radial-gradient(circle_at_12%_18%,rgba(248,250,252,0.95)_1.6px,transparent_0),
            radial-gradient(circle_at_72%_10%,rgba(226,232,240,0.85)_1.4px,transparent_0),
            radial-gradient(circle_at_55%_26%,rgba(148,163,184,0.75)_1.2px,transparent_0)
          ]
          [background-size:900px_260px,1200px_260px,1400px_260px]
          [background-position:-120px_-40px,260px_-30px,40px_10px]
        "
      />

      {/* Container */}
      <div className="relative z-10 mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-6">
        {/* Top header - same vibe as admin */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/img/xpot-logo-light.png"
                alt="XPOT"
                width={132}
                height={36}
                priority
              />
            </Link>

            <span className="rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
              Holder dashboard
            </span>

            <span className="hidden sm:inline-flex">
              <StatusPill tone="emerald">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse" />
                Live
              </StatusPill>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/70 px-4 py-2 text-xs text-slate-200 hover:bg-slate-900/70"
            >
              <Sparkles className="h-4 w-4" />
              Home
            </Link>

            <Link
              href="/dashboard/history"
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/70 px-4 py-2 text-xs text-slate-200 hover:bg-slate-900/70"
            >
              <History className="h-4 w-4" />
              History
            </Link>

            <div className="hidden sm:block">
              <WalletMultiButton className="!h-10 !rounded-full !px-4 !text-sm" />
            </div>

            <SignOutButton redirectUrl="/dashboard">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/70 px-4 py-2 text-xs text-slate-200 hover:bg-slate-900/70"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </SignOutButton>
          </div>
        </header>

        {/* Mobile wallet row */}
        <div className="mt-4 sm:hidden">
          <div className="rounded-[24px] border border-slate-900/70 bg-slate-950/60 px-4 py-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Wallet
              </p>
              <StatusPill tone="slate">
                <Wallet className="h-3.5 w-3.5" />
                {walletConnected ? 'Connected' : 'Not connected'}
              </StatusPill>
            </div>
            <div className="mt-3">
              <WalletMultiButton className="w-full !h-10 !rounded-full !text-sm" />
              <WalletStatusHint />
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* LEFT */}
          <div className="space-y-4">
            {/* Identity + eligibility band */}
            <section className="relative overflow-hidden rounded-[30px] border border-slate-900/70 bg-transparent shadow-[0_32px_110px_rgba(15,23,42,0.85)] backdrop-blur-xl">
              <div className="pointer-events-none absolute -inset-28 bg-[radial-gradient(circle_at_5%_0%,rgba(59,130,246,0.40),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(129,140,248,0.40),transparent_58%)] opacity-85" />

              <div className="relative z-10 px-5 py-5 sm:px-6 sm:py-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 overflow-hidden rounded-full border border-slate-700/70 bg-slate-900/70">
                      {avatar ? (
                        <Image
                          src={avatar}
                          alt={handle || 'X avatar'}
                          width={44}
                          height={44}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                          <X className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    <div className="leading-tight">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-50">
                          {name || 'XPOT user'}
                        </p>
                        <StatusPill tone="emerald">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          X identity linked
                        </StatusPill>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        {handle ? (
                          <a
                            href={`https://x.com/${handle}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 hover:text-emerald-300"
                          >
                            <X className="h-3.5 w-3.5" />
                            @{handle}
                            <ArrowRight className="h-3.5 w-3.5 opacity-60" />
                          </a>
                        ) : (
                          <span className="text-amber-300">
                            X handle not detected yet
                          </span>
                        )}

                        {currentWalletAddress && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="font-mono text-slate-200">
                              {shortWallet(currentWalletAddress)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <StatusPill tone={walletConnected ? 'sky' : 'slate'}>
                        <Wallet className="h-3.5 w-3.5" />
                        {walletConnected ? 'Wallet connected' : 'Wallet required'}
                      </StatusPill>

                      {walletConnected && typeof xpotBalance === 'number' && (
                        <StatusPill tone={hasRequiredXpot ? 'emerald' : 'amber'}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {hasRequiredXpot ? 'Eligible' : 'Not eligible'}
                        </StatusPill>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400">
                      XPOT checks eligibility only when you request today’s ticket.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      XPOT balance
                    </p>
                    <p className="mt-1 font-mono text-sm text-slate-100">
                      {xpotBalance === null
                        ? walletConnected
                          ? 'Checking…'
                          : '–'
                        : xpotBalance === 'error'
                        ? 'Unavailable'
                        : `${Math.floor(xpotBalance).toLocaleString()} XPOT`}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Minimum: {REQUIRED_XPOT.toLocaleString()} XPOT
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      Today’s status
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-100">
                      {ticketClaimed ? 'Ticket in draw' : 'Not entered yet'}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      One ticket per wallet per draw.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      Privacy
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-100">
                      Handle shown, wallet hidden
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Winners are revealed by X handle, not wallet.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Today’s ticket - premium action card */}
            <section className="relative overflow-hidden rounded-[30px] border border-slate-900/70 bg-transparent shadow-[0_32px_110px_rgba(15,23,42,0.85)] backdrop-blur-xl">
              <div className="pointer-events-none absolute -inset-28 bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.22),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(236,72,153,0.22),transparent_55%)] opacity-80" />

              <div className="relative z-10 space-y-4 px-5 py-5 sm:px-6 sm:py-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-50">
                      Today’s entry
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Your wallet must hold at least{' '}
                      <span className="font-semibold text-emerald-200">
                        {REQUIRED_XPOT.toLocaleString()} XPOT
                      </span>{' '}
                      at the exact moment you request the ticket.
                    </p>
                  </div>

                  <StatusPill tone={ticketClaimed ? 'emerald' : 'slate'}>
                    <Ticket className="h-3.5 w-3.5" />
                    {ticketClaimed ? 'Entered' : 'Not entered'}
                  </StatusPill>
                </div>

                {ticketsError && (
                  <p className="text-xs text-amber-300">{ticketsError}</p>
                )}

                {!ticketClaimed ? (
                  <div className="rounded-[24px] border border-slate-800/80 bg-slate-950/80 px-4 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-200">
                          Get your ticket for today’s draw.
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Your entry is issued by the backend and bound to your wallet.
                        </p>

                        {claiming && (
                          <p className="mt-2 text-[11px] text-emerald-300 animate-pulse">
                            Verifying wallet - Checking XPOT - Issuing ticket…
                          </p>
                        )}

                        {!walletConnected && (
                          <p className="mt-2 text-[11px] text-amber-300">
                            Connect your wallet to request the ticket.
                          </p>
                        )}

                        {claimError && (
                          <p className="mt-2 text-[11px] text-amber-300">
                            {claimError}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleClaimTicket}
                        disabled={!walletConnected || claiming || loadingTickets}
                        className={`${BTN_PRIMARY} px-7 py-3 text-sm`}
                      >
                        {claiming ? 'Generating…' : 'Get today’s ticket'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-emerald-500/30 bg-emerald-500/5 px-4 py-4 shadow-[0_0_30px_rgba(16,185,129,0.18)]">
                    <p className="text-sm font-semibold text-emerald-100">
                      ✅ Your ticket is in the draw.
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Keep your wallet self-custodied. Come back after the draw to see results.
                    </p>

                    {todaysTicket?.code && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                            Ticket code
                          </p>
                          <p className="mt-1 font-mono text-lg text-emerald-200">
                            {todaysTicket.code}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => todaysTicket && handleCopy(todaysTicket)}
                          className={`${BTN_UTILITY} px-4 py-2 text-xs`}
                        >
                          <Copy className="h-4 w-4" />
                          {copiedId === todaysTicket.id ? 'Copied' : 'Copy code'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t border-slate-800/80 pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Today’s result
                  </p>

                  {!walletConnected ? (
                    <p className="mt-2 text-sm text-slate-300">
                      Connect your wallet and request a ticket to join the draw.
                    </p>
                  ) : myTickets.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-300">
                      You haven’t entered today yet. Request the ticket above.
                    </p>
                  ) : winner ? (
                    iWonToday ? (
                      <div className="mt-3 rounded-2xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 shadow-[0_0_30px_rgba(16,185,129,0.35)]">
                        <p className="text-sm font-semibold text-emerald-100">
                          🎉 You hit today’s XPOT.
                        </p>
                        <p className="mt-1 text-xs text-emerald-50">
                          Winning ticket:{' '}
                          <span className="font-mono text-emerald-200">
                            {winner.code}
                          </span>
                        </p>
                        <p className="mt-2 text-[11px] text-emerald-100/90">
                          Claim flow will appear here once payouts are wired end-to-end.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3">
                        <p className="text-sm text-slate-200">
                          Today’s winning ticket is{' '}
                          <span className="font-mono text-emerald-300">
                            {winner.code}
                          </span>
                          .
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Winner handle + claim status will display here in the full version.
                        </p>
                      </div>
                    )
                  ) : (
                    <p className="mt-2 text-sm text-slate-300">
                      Your ticket is in the draw. The winning ticket will appear after draw execution.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Your tickets - ultra clean list */}
            <section className="rounded-[30px] border border-slate-900/70 bg-transparent px-5 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.85)] backdrop-blur-xl sm:px-6 sm:py-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Your tickets</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Tickets associated with your connected wallet.
                  </p>
                </div>

                {walletConnected ? (
                  <StatusPill tone="sky">
                    <Wallet className="h-3.5 w-3.5" />
                    {shortWallet(currentWalletAddress || '')}
                  </StatusPill>
                ) : (
                  <StatusPill tone="slate">
                    <Wallet className="h-3.5 w-3.5" />
                    Connect wallet
                  </StatusPill>
                )}
              </div>

              <div className="mt-4 border-t border-slate-800/80">
                {!walletConnected ? (
                  <p className="py-4 text-xs text-slate-500">
                    Connect your wallet to view your tickets.
                  </p>
                ) : myTickets.length === 0 ? (
                  <p className="py-4 text-xs text-slate-500">
                    No tickets found for this wallet today.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-800/70">
                    {myTickets.map(entry => (
                      <div key={entry.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm text-slate-100">
                              {entry.code}
                            </span>

                            {entry.status === 'in-draw' && (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-emerald-300">
                                In draw
                              </span>
                            )}
                            {entry.status === 'won' && (
                              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-amber-200">
                                Won
                              </span>
                            )}
                            {entry.status === 'claimed' && (
                              <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-sky-200">
                                Claimed
                              </span>
                            )}
                            {entry.status === 'expired' && (
                              <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-300">
                                Expired
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-500">
                            Created {formatDateTime(entry.createdAt)} - {entry.label}
                          </p>

                          <p className="text-[11px] text-slate-500">
                            Wallet <span className="font-mono text-slate-300">{shortWallet(entry.walletAddress)}</span>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(entry)}
                            className={`${BTN_UTILITY} px-4 py-2 text-xs`}
                          >
                            <Copy className="h-4 w-4" />
                            {copiedId === entry.id ? 'Copied' : 'Copy code'}
                          </button>

                          <button
                            type="button"
                            className={`${BTN_UTILITY} px-4 py-2 text-xs opacity-60`}
                            disabled
                          >
                            View entry tweet (soon)
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <div className="space-y-4 lg:max-w-[640px]">
            {/* Wallet cockpit card */}
            <section className="relative overflow-hidden rounded-[24px] border border-slate-900/70 bg-transparent px-5 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),transparent_55%),radial-gradient(circle_at_80%_120%,rgba(34,197,94,0.14),transparent_55%)] opacity-80" />

              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-white tracking-wide">
                      Wallet cockpit
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Connect, verify, then request today’s ticket.
                    </p>
                  </div>

                  <StatusPill tone={walletConnected ? 'emerald' : 'slate'}>
                    <Wallet className="h-3.5 w-3.5" />
                    {walletConnected ? 'Connected' : 'Disconnected'}
                  </StatusPill>
                </div>

                <div className="mt-4">
                  <WalletMultiButton className="w-full !h-11 !rounded-full !text-sm" />
                  <WalletStatusHint />
                </div>

                {publicKey && (
                  <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3 text-xs">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      Connected wallet
                    </p>
                    <p className="mt-1 break-all font-mono text-[11px] text-slate-200">
                      {publicKey.toBase58()}
                    </p>

                    <div className="mt-3 grid gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">XPOT balance</span>
                        <span className="font-mono text-slate-100">
                          {xpotBalance === null
                            ? 'Checking…'
                            : xpotBalance === 'error'
                            ? 'Unavailable'
                            : `${Math.floor(xpotBalance).toLocaleString()} XPOT`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Eligibility</span>
                        <span
                          className={`font-semibold ${
                            typeof xpotBalance === 'number'
                              ? hasRequiredXpot
                                ? 'text-emerald-300'
                                : 'text-amber-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {typeof xpotBalance === 'number'
                            ? hasRequiredXpot
                              ? 'Eligible'
                              : 'Not eligible'
                            : '—'}
                        </span>
                      </div>
                    </div>

                    {connected && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await disconnect();
                            window.location.reload();
                          } catch (err) {
                            console.error('Failed to disconnect wallet', err);
                          }
                        }}
                        className="mt-4 w-full rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-200 hover:bg-slate-900/60"
                      >
                        Disconnect wallet
                      </button>
                    )}
                  </div>
                )}

                <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3 text-[11px] text-slate-400">
                  XPOT uses X as identity. Wallet stays self-custodied. We only read public balance to verify eligibility.
                </div>
              </div>
            </section>

            {/* Recent winners - clean terminal vibe */}
            <section className="relative overflow-hidden rounded-[24px] border border-slate-900/70 bg-transparent px-5 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.14),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(236,72,153,0.12),transparent_55%)] opacity-80" />

              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-white tracking-wide">
                      Recent winners
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Latest payouts and handles (global).
                    </p>
                  </div>

                  <Link
                    href="/dashboard/history"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/60 px-4 py-2 text-xs text-slate-200 hover:bg-slate-900/70"
                  >
                    View history
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-4 border-t border-slate-800/80 pt-4">
                  {loadingWinners && (
                    <p className="text-xs text-slate-500">Loading records…</p>
                  )}

                  {winnersError && (
                    <p className="text-xs text-amber-300">{winnersError}</p>
                  )}

                  {!loadingWinners &&
                    !winnersError &&
                    recentWinners.length === 0 && (
                      <p className="rounded-2xl bg-slate-950/70 px-4 py-3 text-xs text-slate-500">
                        No completed draws yet. As soon as XPOT starts, winners will appear here.
                      </p>
                    )}

                  {!loadingWinners && recentWinners.length > 0 && (
                    <div className="space-y-2">
                      {recentWinners.map(w => (
                        <article
                          key={w.id}
                          className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                                {formatDate(w.drawDate)}
                              </p>
                              <p className="mt-1 font-mono text-sm text-slate-100">
                                {w.ticketCode}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-400">
                                Jackpot{' '}
                                <span className="font-semibold text-emerald-300">
                                  ${Number(w.jackpotUsd ?? 0).toLocaleString()}
                                </span>
                              </p>
                            </div>

                            <div className="text-right">
                              {w.handle ? (
                                <a
                                  href={`https://x.com/${w.handle}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-emerald-300 hover:text-emerald-200"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  @{w.handle}
                                </a>
                              ) : (
                                <p className="text-[11px] text-slate-500">
                                  Handle soon
                                </p>
                              )}
                              <p className="mt-1 text-[10px] text-slate-600">
                                {shortWallet(w.walletAddress)}
                              </p>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Draw history preview (wallet-specific) */}
            <section className="rounded-[24px] border border-slate-900/70 bg-transparent px-5 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white tracking-wide">
                    Your draw history
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Past entries for your connected wallet.
                  </p>
                </div>

                <Link
                  href="/dashboard/history"
                  className={`${BTN_UTILITY} px-4 py-2 text-xs`}
                >
                  <History className="h-4 w-4" />
                  Full history
                </Link>
              </div>

              <div className="mt-4 border-t border-slate-800/80 pt-4">
                {!publicKey && (
                  <p className="text-xs text-slate-500">
                    Connect your wallet to see your ticket history.
                  </p>
                )}

                {publicKey && (
                  <>
                    {loadingHistory && (
                      <p className="text-xs text-slate-500">Loading history…</p>
                    )}

                    {!loadingHistory && historyEntries.length === 0 && (
                      <p className="rounded-2xl bg-slate-950/70 px-4 py-3 text-xs text-slate-500">
                        No previous draws yet for this wallet.
                      </p>
                    )}

                    {!loadingHistory && historyEntries.length > 0 && (
                      <div className="space-y-2">
                        {historyEntries.slice(0, 5).map(entry => (
                          <article
                            key={entry.id}
                            className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                                  {formatDate(entry.createdAt)}
                                </p>
                                <p className="mt-1 font-mono text-sm text-slate-100">
                                  {entry.code}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                  {entry.label}
                                </p>
                              </div>

                              <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-200">
                                {entry.status.replace('-', ' ').toUpperCase()}
                              </span>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}

                    {historyError && (
                      <p className="mt-2 text-xs text-amber-300">{historyError}</p>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>
        </section>

        {/* Footer micro copy */}
        <section className="mt-6 grid gap-4 border-t border-slate-800/70 pt-5 text-[12px] text-slate-400 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Transparent by design
            </p>
            <p className="mt-1 leading-relaxed">
              Entries and payouts are verifiable. When TX links are live, you can audit everything.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              No ticket sales
            </p>
            <p className="mt-1 leading-relaxed">
              Tickets are free. Holding XPOT is what qualifies you for the daily pool.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              X-native identity
            </p>
            <p className="mt-1 leading-relaxed">
              Winners are revealed by handle, not wallet. Your custody stays yours.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
