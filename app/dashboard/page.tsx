// app/dashboard/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WalletReadyState } from '@solana/wallet-adapter-base';

import { REQUIRED_XPOT } from '@/lib/xpot';
import {
  useUser,
  SignOutButton,
  SignedIn,
  SignedOut,
  SignInButton,
} from '@clerk/nextjs';

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

// ─────────────────────────────────────────────
// Types & helpers
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

function shortWallet(addr: string) {
  if (!addr || addr.length < 8) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

// Debug logger for wallet state
function WalletDebug() {
  const { publicKey, connected, wallet } = useWallet();

  useEffect(() => {
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
    (w) =>
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

const initialEntries: Entry[] = [];

// ─────────────────────────────────────────────
// Dashboard (inner logic)
// ─────────────────────────────────────────────

function DashboardInner() {
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
  const winner = entries.find((e) => e.status === 'won');

  const [historyEntries, setHistoryEntries] = useState<Entry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const hasRequiredXpot =
    typeof xpotBalance === 'number' && xpotBalance >= REQUIRED_XPOT;

  // ─────────────────────────────────────────────
  // Clerk user (for avatar + handle)
  // ─────────────────────────────────────────────

  const { user } = useUser();

  const externalAccounts = (user?.externalAccounts || []) as any[];

  const xAccount =
    externalAccounts.find((acc) => {
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

  // ─────────────────────────────────────────────
  // Sync X identity into DB whenever user is loaded
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        await fetch('/api/me/sync-x', {
          method: 'POST',
        });
      } catch (e) {
        console.error('[XPOT] Failed to sync X identity', e);
      }
    })();
  }, [user]);

  // ─────────────────────────────────────────────
  // Wire wallet → DB whenever it connects
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
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
  }, [user, publicKey, connected]);

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
          if (data.tickets.length > 0) {
            setEntries(data.tickets);
          }
        }
      } catch (err) {
        console.error('Failed to load tickets from DB', err);
        if (!cancelled) {
          setTicketsError(
            (err as Error).message ?? 'Failed to load tickets',
          );
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
      (t) =>
        t.walletAddress === currentWalletAddress &&
        t.status === 'in-draw',
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
              jackpotUsd: `$${(t.jackpotUsd ?? 10_000).toLocaleString?.() ?? '10,000'}`,
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
        setEntries((prev) => {
          const others = prev.filter((t) => t.id !== ticket.id);
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

  const normalizedWallet = currentWalletAddress?.toLowerCase();
  const myTickets: Entry[] = normalizedWallet
    ? entries.filter(
        (e) => e.walletAddress?.toLowerCase() === normalizedWallet,
      )
    : [];

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-black text-slate-50">
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

      <div className="mx-auto flex max-w-6xl">
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
                className="flex items-center gap-3 rounded-full px-3 py-2 font-medium bg-slate-900 text-slate-50"
              >
                <span className="text-lg">🏠</span>
                <span>Dashboard</span>
              </Link>

              <Link
                href="/dashboard/history"
                className="flex w-full items-center gap-3 rounded-full px-3 py-2 text-slate-300 hover:bg-slate-900/70"
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

            {/* Main CTA */}
            <button
              type="button"
              onClick={handleClaimTicket}
              disabled={!walletConnected || claiming || loadingTickets}
              className={`btn-premium mt-3 w-full rounded-full py-2 text-sm font-semibold ${
                !walletConnected || claiming || loadingTickets
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-500 text-black toolbar-glow'
              }`}
            >
              {!walletConnected
                ? 'Connect wallet to get ticket'
                : claiming
                ? 'Processing...'
                : 'Get today’s ticket'}
            </button>
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
                    Dashboard
                  </h1>
                  <p className="text-[13px] text-slate-400">
                    One protocol. One identity. One daily XPOT draw.
                  </p>
                </div>
                <div className="hidden text-right text-[11px] text-slate-500 sm:block">
                  <p className="uppercase tracking-[0.16em] text-slate-400">
                    Next draw in
                  </p>
                  <p className="font-mono text-xs text-slate-200">
                    02:14:09
                  </p>
                </div>
              </div>
            </header>

            {/* Scroll content */}
            <div className="space-y-4 px-0">
              {/* Profile header */}
              <section className="flex items-center justify-between border-b border-slate-900 bg-gradient-to-r from-slate-950 via-slate-900/40 to-slate-950 px-4 pt-3 pb-2">
                <div className="inline-flex items-center gap-3 rounded-full bg-slate-950/80 px-3 py-2">
                  <div className="h-9 w-9 overflow-hidden rounded-full bg-slate-800">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={handle || 'X avatar'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                        @
                      </div>
                    )}
                  </div>

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

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="hidden h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-900 hover:text-slate-100 sm:flex"
                  >
                    ⋯
                  </button>

                  <SignOutButton redirectUrl="/dashboard">
                    <button
                      type="button"
                      className="h-8 rounded-full border border-slate-800 px-3 text-[11px] font-medium text-slate-400 hover:border-slate-600 hover:bg-slate-900 hover:text-slate-100"
                    >
                      Log out
                    </button>
                  </SignOutButton>
                </div>
              </section>

              {/* Today’s ticket */}
              {/* … all the rest of your JSX for tickets, results, history, etc.
                  Keep exactly as you pasted before – nothing else changes here. */}
              {/* I’m not repeating it to save space; you can keep your existing
                  JSX from “Today’s ticket” down to the end of the right sidebar. */}
            </div>
          </section>

          {/* Right sidebar – unchanged */}
          {/* … keep the rest of your existing right sidebar JSX here */}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Public page with Clerk gating
// ─────────────────────────────────────────────

export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-slate-200">
        <p className="text-sm text-slate-400">Loading your XPOT session…</p>
      </div>
    );
  }

  return (
    <>
      <SignedIn>
        <DashboardInner />
      </SignedIn>

      <SignedOut>
        <div className="flex min-h-screen flex-col items-center justify-center bg-black text-slate-50">
          <Image
            src="/img/xpot-logo-light.png"
            alt="XPOT"
            width={160}
            height={40}
            className="mb-6"
          />
          <p className="mb-3 text-sm text-slate-300">
            Connect with X to access your XPOT dashboard.
          </p>
          <SignInButton mode="redirect">
            <button className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-slate-100">
              Sign in with X
            </button>
          </SignInButton>
        </div>
      </SignedOut>
    </>
  );
}
