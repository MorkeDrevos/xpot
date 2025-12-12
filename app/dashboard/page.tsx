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
import { REQUIRED_XPOT } from '@/lib/xpot';
import XpotPageShell from '@/components/XpotPageShell';

import { History, LogOut } from 'lucide-react';

// ─────────────────────────────────────────────
// Formatting helpers
// ─────────────────────────────────────────────

function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB');
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

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 transition disabled:cursor-not-allowed disabled:opacity-40';

// Optional UX helper: show hint under wallet button
function WalletStatusHint() {
  const { wallets, connected } = useWallet();

  const anyDetected = wallets.some(
    w => w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable,
  );

  if (connected) return null;

  if (!anyDetected) {
    return <p className="mt-2 text-xs text-amber-300">No Solana wallet detected. Install Phantom or Jupiter to continue.</p>;
  }

  return <p className="mt-2 text-xs text-slate-500">Click “Select Wallet” and choose Phantom or Jupiter to connect.</p>;
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function DashboardPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  const [ticketClaimed, setTicketClaimed] = useState(false);
  const [todaysTicket, setTodaysTicket] = useState<Entry | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const { publicKey, connected } = useWallet();
  const [xpotBalance, setXpotBalance] = useState<number | null | 'error'>(null);

  const walletConnected = !!publicKey && connected;
  const currentWalletAddress = publicKey?.toBase58() ?? null;

  const [recentWinners, setRecentWinners] = useState<RecentWinner[]>([]);
  const [loadingWinners, setLoadingWinners] = useState(false);
  const [winnersError, setWinnersError] = useState<string | null>(null);

  const hasRequiredXpot = typeof xpotBalance === 'number' && xpotBalance >= REQUIRED_XPOT;

  // ─────────────────────────────────────────────
  // Clerk user (for avatar + handle)
  // ─────────────────────────────────────────────

  const { user, isLoaded: isUserLoaded } = useUser();
  const externalAccounts = (user?.externalAccounts || []) as any[];

  const xAccount =
    externalAccounts.find(acc => {
      const provider = String(acc.provider ?? '');
      return (
        provider === 'oauth_x' ||
        provider === 'oauth_twitter' ||
        provider === 'twitter' ||
        provider.toLowerCase().includes('twitter') ||
        provider.toLowerCase().includes('x')
      );
    }) || externalAccounts[0];

  const handle = xAccount?.username || xAccount?.screenName || null;

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
        const res = await fetch('/api/tickets/today', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load tickets');

        const data = await res.json();
        if (!cancelled && Array.isArray(data.tickets)) setEntries(data.tickets);
      } catch (err) {
        console.error('Failed to load tickets from DB', err);
        if (!cancelled) setTicketsError((err as Error).message ?? 'Failed to load tickets');
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

    const myTicket = entries.find(t => t.walletAddress === currentWalletAddress && t.status === 'in-draw');

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
        const res = await fetch(`/api/xpot-balance?address=${publicKey.toBase58()}`, { cache: 'no-store' });
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
  // Load recent winners (global)
  // ─────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setLoadingWinners(true);
    setWinnersError(null);

    (async () => {
      try {
        const res = await fetch('/api/winners/recent?limit=5', { cache: 'no-store' });
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
        if (!cancelled) setWinnersError((err as Error).message ?? 'Failed to load recent winners');
      } finally {
        if (!cancelled) setLoadingWinners(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
              `You need at least ${(data.required ?? REQUIRED_XPOT).toLocaleString()} XPOT to get today’s ticket.`,
            );
            break;
          case 'NOT_ENOUGH_SOL':
            setClaimError('Your wallet needs some SOL for network fees before you can get today’s ticket.');
            break;
          case 'XPOT_CHECK_FAILED':
            setClaimError('Could not verify your XPOT balance right now. Please try again in a moment.');
            break;
          default:
            setClaimError('Ticket request failed. Please try again.');
        }

        console.error('Claim failed', res.status, text);
        return;
      }

      const ticket: Entry = data.ticket;

      if (ticket) {
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
      setClaimError('Unexpected error while getting your ticket. Please try again.');
    } finally {
      setClaiming(false);
    }
  }

  const normalizedWallet = currentWalletAddress?.toLowerCase();
  const myTickets = useMemo(() => {
    if (!normalizedWallet) return [];
    return entries.filter(e => e.walletAddress?.toLowerCase() === normalizedWallet);
  }, [entries, normalizedWallet]);

  return (
    <XpotPageShell>
      {/* HEADER */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/img/xpot-logo-light.png" alt="XPOT" width={132} height={36} priority />
          </Link>

          <span className="rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
            Holder dashboard
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/history"
            className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/70 px-4 py-2 text-xs text-slate-200 hover:bg-slate-900/70"
          >
            <History className="h-4 w-4" />
            History
          </Link>

          <div className="flex flex-col items-end">
            <WalletMultiButton className="!h-10 !rounded-full !px-4 !text-sm" />
            <WalletStatusHint />
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

      {/* MAIN GRID */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* IDENTITY CARD */}
          <section className="rounded-[30px] border border-slate-900/70 bg-slate-950/60 px-5 py-5 backdrop-blur-xl">
            <p className="text-sm font-semibold text-slate-100">Connected identity</p>
            <p className="mt-1 text-xs text-slate-400">Wallet + X identity used for XPOT draws</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">XPOT balance</p>
                <p className="mt-1 font-mono text-sm text-slate-100">
                  {xpotBalance === null
                    ? 'Checking…'
                    : xpotBalance === 'error'
                    ? 'Unavailable'
                    : `${Math.floor(xpotBalance).toLocaleString()} XPOT`}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Eligibility</p>
                <p className="mt-1 font-semibold text-sm text-slate-100">
                  {typeof xpotBalance === 'number' ? (hasRequiredXpot ? 'Eligible' : 'Not eligible') : '—'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Wallet</p>
                <p className="mt-1 font-mono text-sm text-slate-100">
                  {currentWalletAddress ? shortWallet(currentWalletAddress) : 'Not connected'}
                </p>
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-500">
              X handle: <span className="font-mono text-slate-200">{handle ? `@${handle}` : 'not linked yet'}</span>
            </div>
          </section>

          {/* TODAY TICKET */}
          <section className="rounded-[30px] border border-slate-900/70 bg-slate-950/60 px-5 py-5 backdrop-blur-xl">
            <p className="text-sm font-semibold text-slate-100">Today’s XPOT</p>

            {ticketsError && <p className="mt-3 text-xs text-amber-300">{ticketsError}</p>}

            {!ticketClaimed ? (
              <>
                <button
                  type="button"
                  onClick={handleClaimTicket}
                  disabled={!walletConnected || claiming}
                  className={`${BTN_PRIMARY} mt-4 px-6 py-3 text-sm`}
                >
                  {claiming ? 'Generating…' : 'Get today’s ticket'}
                </button>
                {claimError && <p className="mt-3 text-xs text-amber-300">{claimError}</p>}
                <p className="mt-3 text-xs text-slate-500">
                  Requires at least <span className="font-semibold text-slate-200">{REQUIRED_XPOT.toLocaleString()} XPOT</span> in your wallet.
                </p>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm text-emerald-300">Your ticket is in the draw.</p>
                {todaysTicket && (
                  <div className="mt-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Ticket code</p>
                    <p className="mt-1 font-mono text-sm text-slate-100">{todaysTicket.code}</p>
                  </div>
                )}
              </>
            )}

            {myTickets.length > 1 && (
              <p className="mt-3 text-xs text-slate-500">
                You have <span className="font-semibold text-slate-200">{myTickets.length}</span> entries tied to this wallet today.
              </p>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          {/* RECENT WINNERS */}
          <section className="rounded-[30px] border border-slate-900/70 bg-slate-950/60 px-5 py-5 backdrop-blur-xl">
            <p className="text-sm font-semibold text-slate-100">Recent winners</p>

            <div className="mt-4 space-y-2">
              {loadingWinners && <p className="text-xs text-slate-500">Loading…</p>}
              {winnersError && <p className="text-xs text-amber-300">{winnersError}</p>}

              {!loadingWinners && !winnersError && recentWinners.length === 0 ? (
                <p className="text-xs text-slate-500">No completed draws yet.</p>
              ) : (
                recentWinners.map(w => (
                  <div key={w.id} className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3">
                    <p className="text-xs text-slate-400">{formatDate(w.drawDate)}</p>
                    <p className="mt-1 font-mono text-sm text-slate-100">{w.ticketCode}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {w.handle ? `@${w.handle}` : shortWallet(w.walletAddress)}
                    </p>
                  </div>
                ))
              )}
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
