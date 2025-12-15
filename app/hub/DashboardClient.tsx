// app/hub/DashboardClient.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';

import { useUser, SignOutButton } from '@clerk/nextjs';

import XpotPageShell from '@/components/XpotPageShell';
import PremiumWalletModal from '@/components/PremiumWalletModal';
import HubLockOverlay from '@/components/HubLockOverlay';
import { REQUIRED_XPOT } from '@/lib/xpot';

import {
  CheckCircle2,
  Copy,
  History,
  LogOut,
  Sparkles,
  Ticket,
  Wallet,
  X,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Small UI helpers
// ─────────────────────────────────────────────

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 transition disabled:cursor-not-allowed disabled:opacity-40';

const CARD =
  'rounded-[30px] border border-slate-900/70 bg-slate-950/60 px-5 py-5 backdrop-blur-xl';

const SUBCARD = 'rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3';

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

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

function endOfLocalDayMs() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

function formatCountdown(ms: number) {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

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
      className={[
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
        cls,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

function TinyMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className={SUBCARD}>
      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-sm text-slate-100">{value}</p>
    </div>
  );
}

function SoftKicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold tracking-wide text-slate-200">
      {children}
    </span>
  );
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
        No Solana wallet detected. Install Phantom or Solflare to continue.
      </p>
    );
  }

  return (
    <p className="mt-2 text-xs text-slate-500">
      Click “Activate wallet” and choose a wallet to connect.
    </p>
  );
}

async function safeCopy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function initialFromHandle(h?: string | null) {
  const s = (h || '').replace(/^@/, '').trim();
  return s ? s[0].toUpperCase() : 'X';
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type EntryStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

type Entry = {
  id: string;
  code: string;
  status: EntryStatus;
  label?: string;
  jackpotUsd?: string | number;
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
// Page (CLIENT)
// ─────────────────────────────────────────────

export default function DashboardClient() {
  // Premium wallet modal
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  // Today entries (global)
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  // Claim state
  const [ticketClaimed, setTicketClaimed] = useState(false);
  const [todaysTicket, setTodaysTicket] = useState<Entry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Wallet
  const { publicKey, connected } = useWallet();
  const walletConnected = !!publicKey && connected;
  const currentWalletAddress = publicKey?.toBase58() ?? null;

  // XPOT balance
  const [xpotBalance, setXpotBalance] = useState<number | null | 'error'>(null);
  const hasRequiredXpot =
    typeof xpotBalance === 'number' && xpotBalance >= REQUIRED_XPOT;

  // History (wallet specific)
  const [historyEntries, setHistoryEntries] = useState<Entry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Recent winners (global)
  const [recentWinners, setRecentWinners] = useState<RecentWinner[]>([]);
  const [loadingWinners, setLoadingWinners] = useState(false);
  const [winnersError, setWinnersError] = useState<string | null>(null);

  // Clerk user (X identity)
  const { user, isLoaded: isUserLoaded } = useUser();
  const isSignedIn = !!user;

  const externalAccounts = (user?.externalAccounts || []) as any[];

  const xAccount =
    externalAccounts.find(acc => {
      const provider = (acc.provider ?? '') as string;
      const p = provider.toLowerCase();
      return (
        provider === 'oauth_x' ||
        provider === 'oauth_twitter' ||
        provider === 'twitter' ||
        p.includes('twitter') ||
        p === 'x' ||
        p.includes('oauth_x')
      );
    }) || null;

  const handle = xAccount?.username || xAccount?.screenName || null;
  const avatar = xAccount?.imageUrl || user?.imageUrl || null;
  const name = user?.fullName || handle || 'XPOT user';

  // Authed enough = logged in AND X is linked
  const isAuthedEnough = isSignedIn && !!handle;

  // Lock overlay ON when missing auth/X
  const showLock = isUserLoaded ? !isAuthedEnough : true;

  // Premium live feel: last sync timestamp + tiny pulse when something updates
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [syncPulse, setSyncPulse] = useState(0);

  // Countdown to local day end (pre-launch friendly)
  const [countdown, setCountdown] = useState('00:00:00');

  // Prevent overlapping refreshes
  const refreshingRef = useRef(false);

  // ─────────────────────────────────────────────
  // Sync X identity into DB whenever user is loaded
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!isUserLoaded || !user) return;
    if (!handle) return;

    (async () => {
      try {
        await fetch('/api/me/sync-x', { method: 'POST' });
      } catch (e) {
        console.error('[XPOT] Failed to sync X identity', e);
      }
    })();
  }, [isUserLoaded, user, handle]);

  // ─────────────────────────────────────────────
  // Wire wallet → DB whenever it connects
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthedEnough) return;
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
  }, [isAuthedEnough, publicKey, connected]);

  // ─────────────────────────────────────────────
  // Live countdown (quiet luxury)
  // ─────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const ms = endOfLocalDayMs() - Date.now();
      setCountdown(formatCountdown(ms));
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, []);

  // ─────────────────────────────────────────────
  // Fetch helpers (re-used for premium live refresh)
  // ─────────────────────────────────────────────

  async function fetchTicketsToday() {
    const res = await fetch('/api/tickets/today', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load tickets');
    const data = await res.json();
    const list: Entry[] = Array.isArray(data.tickets) ? data.tickets : [];
    return list;
  }

  async function fetchXpotBalance(address: string) {
    const res = await fetch(`/api/xpot-balance?address=${address}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data: { balance: number } = await res.json();
    return data.balance;
  }

  async function fetchHistory(address: string) {
    const res = await fetch(`/api/tickets/history?wallet=${address}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to load history');
    const data = await res.json();
    const tickets: Entry[] = Array.isArray(data.tickets)
      ? data.tickets.map((t: any) => ({
          id: t.id,
          code: t.code,
          status: t.status as EntryStatus,
          label: t.label ?? '',
          jackpotUsd: t.jackpotUsd ?? 0,
          createdAt: t.createdAt,
          walletAddress: t.walletAddress,
        }))
      : [];
    return tickets;
  }

  async function fetchRecentWinners() {
    const res = await fetch('/api/winners/recent?limit=5', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load recent winners');
    const data = await res.json();
    const winners: RecentWinner[] = Array.isArray(data.winners)
      ? data.winners.map((w: any) => ({
          id: w.id,
          drawDate: w.drawDate,
          ticketCode: w.ticketCode,
          jackpotUsd: w.jackpotUsd ?? 0,
          walletAddress: w.walletAddress,
          handle: w.handle ?? null,
        }))
      : [];
    return winners;
  }

  async function refreshAll(reason: 'initial' | 'poll' | 'manual' = 'poll') {
    if (!isAuthedEnough) return;
    if (refreshingRef.current) return;

    refreshingRef.current = true;

    const addr = publicKey?.toBase58() ?? null;

    try {
      // Tickets (global)
      if (reason === 'initial') {
        setLoadingTickets(true);
        setTicketsError(null);
      }
      const nextTickets = await fetchTicketsToday();
      setEntries(nextTickets);

      // Winners (global)
      if (reason === 'initial') {
        setLoadingWinners(true);
        setWinnersError(null);
      }
      const nextWinners = await fetchRecentWinners();
      setRecentWinners(nextWinners);

      // Wallet-specific (only when wallet is present)
      if (addr) {
        // Balance
        try {
          setXpotBalance(null);
          const b = await fetchXpotBalance(addr);
          setXpotBalance(b);
        } catch (e) {
          console.error('Error loading XPOT balance (via API)', e);
          setXpotBalance('error');
        }

        // History
        try {
          if (reason === 'initial') setLoadingHistory(true);
          setHistoryError(null);
          const h = await fetchHistory(addr);
          setHistoryEntries(h);
        } catch (e) {
          console.error('Failed to load history', e);
          setHistoryError((e as Error).message ?? 'Failed to load history');
          setHistoryEntries([]);
        } finally {
          setLoadingHistory(false);
        }
      } else {
        setXpotBalance(null);
        setHistoryEntries([]);
        setHistoryError(null);
        setLoadingHistory(false);
      }

      setLastSyncedAt(Date.now());
      setSyncPulse(p => p + 1);
    } catch (e) {
      console.error('[XPOT] refreshAll error', e);
      setTicketsError((e as Error).message ?? 'Failed to load tickets');
      setWinnersError((e as Error).message ?? 'Failed to load recent winners');
    } finally {
      setLoadingTickets(false);
      setLoadingWinners(false);
      refreshingRef.current = false;
    }
  }

  // ─────────────────────────────────────────────
  // Initial load + premium polling
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthedEnough) {
      setEntries([]);
      setRecentWinners([]);
      setHistoryEntries([]);
      setXpotBalance(null);
      setLoadingTickets(false);
      setTicketsError(null);
      setLoadingWinners(false);
      setWinnersError(null);
      setLoadingHistory(false);
      setHistoryError(null);
      setLastSyncedAt(null);
      return;
    }

    refreshAll('initial');
    // Quiet luxury updates - not frantic, but always alive
    const t = setInterval(() => refreshAll('poll'), 20000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthedEnough, publicKey?.toBase58()]);

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
  // Ticket actions
  // ─────────────────────────────────────────────

  async function handleCopyCode(entry: Entry) {
    const ok = await safeCopy(entry.code);
    if (!ok) return;
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function handleClaimTicket() {
    if (!isAuthedEnough) return;
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
              `You need at least ${(data.required ?? REQUIRED_XPOT).toLocaleString()} XPOT to get today’s ticket. Your wallet currently has ${Number(
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

      // Premium feel: sync immediately after claim
      refreshAll('manual');
    } catch (err) {
      console.error('Error calling /api/tickets/claim', err);
      setClaimError('Unexpected error while getting your ticket. Please try again.');
    } finally {
      setClaiming(false);
    }
  }

  // Derived helpers
  const normalizedWallet = currentWalletAddress?.toLowerCase();
  const myTickets: Entry[] = useMemo(() => {
    if (!normalizedWallet) return [];
    return entries.filter(
      e => e.walletAddress?.toLowerCase() === normalizedWallet,
    );
  }, [entries, normalizedWallet]);

  const winner = entries.find(e => e.status === 'won') || null;
  const iWonToday =
    !!winner &&
    !!normalizedWallet &&
    winner.walletAddress?.toLowerCase() === normalizedWallet;

  const topStatusLabel = !walletConnected
    ? 'Activate wallet'
    : ticketClaimed
    ? 'Entry secured'
    : 'Wallet linked';

  const topStatusSub = !walletConnected
    ? 'Required to enter today’s XPOT'
    : ticketClaimed
    ? 'You’re in today’s draw'
    : currentWalletAddress
    ? shortWallet(currentWalletAddress)
    : 'Connected';

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <>
      <PremiumWalletModal open={walletModalOpen} onClose={() => setWalletModalOpen(false)} />

      {/* IMPORTANT: overlay is NOT inside the blurred container */}
      <HubLockOverlay
        open={showLock}
        reason={
          !isSignedIn
            ? 'Sign in with X to access the Holder Dashboard.'
            : 'Your account is signed in, but X is not linked. Link X to continue.'
        }
        showLinkX={isSignedIn && !handle}
      />

      {/* Hub behind overlay only */}
      <div className={showLock ? 'pointer-events-none select-none blur-[2px] opacity-95' : ''}>
        <XpotPageShell
          topBarProps={{
            pillText: 'HOLDER DASHBOARD',
            rightSlot: (
              <div className="flex items-center gap-3">
                {/* Identity chip */}
                <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 sm:inline-flex">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatar}
                      alt={name}
                      className="h-6 w-6 rounded-full border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[11px] font-semibold text-slate-200">
                      {initialFromHandle(handle)}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-slate-200">
                    @{(handle || 'x').replace(/^@/, '')}
                  </span>
                </div>

                <Link href="/hub/history" className={`${BTN_UTILITY} h-10 px-4 text-xs`}>
                  <History className="mr-2 h-4 w-4" />
                  <span className="ml-1">History</span>
                </Link>

                {/* Ritual wallet CTA */}
                <div className="rounded-full border border-slate-700/80 bg-slate-950/50 px-4 py-2">
                  <button
                    type="button"
                    onClick={() => setWalletModalOpen(true)}
                    className="text-left leading-tight hover:opacity-95"
                  >
                    <div className="text-sm font-semibold tracking-wide text-slate-100">
                      {topStatusLabel}
                    </div>
                    <div className="text-[11px] text-slate-400">{topStatusSub}</div>
                  </button>
                  <WalletStatusHint />
                </div>

                {isSignedIn ? (
                  <SignOutButton redirectUrl="/">
                    <button className={`${BTN_UTILITY} h-10 px-4 text-xs`}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span className="ml-1">Log out</span>
                    </button>
                  </SignOutButton>
                ) : (
                  <Link href="/sign-in?redirect_url=/hub" className={`${BTN_UTILITY} h-10 px-4 text-xs`}>
                    <span>Sign in</span>
                  </Link>
                )}
              </div>
            ),
          }}
        >
          {/* HERO STRIP - cinematic identity moment */}
          <section className="mt-6">
            <div
              className={[
                'rounded-[34px] border border-white/10 bg-[radial-gradient(800px_circle_at_20%_20%,rgba(56,189,248,0.10),transparent_55%),radial-gradient(900px_circle_at_80%_50%,rgba(245,158,11,0.10),transparent_60%)]',
                'px-5 py-5 backdrop-blur-xl',
                'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),0_0_26px_rgba(56,189,248,0.10)]',
              ].join(' ')}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Left: Identity */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full blur-md opacity-60 bg-white/10" />
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatar}
                        alt={name}
                        className="relative h-12 w-12 rounded-full border border-white/10 object-cover shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                      />
                    ) : (
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-lg font-semibold text-slate-100">
                        {initialFromHandle(handle)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold text-slate-100">
                        {(name || 'XPOT user').toString()}
                      </p>
                      <SoftKicker>
                        <X className="h-4 w-4 opacity-90" />
                        @{(handle || '').replace(/^@/, '')}
                      </SoftKicker>
                      {ticketClaimed ? (
                        <StatusPill tone="emerald">
                          <Ticket className="h-3.5 w-3.5" />
                          Entry active
                        </StatusPill>
                      ) : walletConnected ? (
                        <StatusPill tone="sky">
                          <Wallet className="h-3.5 w-3.5" />
                          Wallet linked
                        </StatusPill>
                      ) : (
                        <StatusPill tone="amber">
                          <Wallet className="h-3.5 w-3.5" />
                          Connect wallet
                        </StatusPill>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      The X-powered reward protocol. Your identity and wallet lock your daily entry.
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-slate-500">
                        Holding requirement: <span className="font-semibold text-slate-200">{REQUIRED_XPOT.toLocaleString()} XPOT</span>
                      </span>
                      <span className="text-[11px] text-slate-600">·</span>
                      <span
                        key={syncPulse}
                        className="text-[11px] text-slate-500"
                      >
                        {lastSyncedAt ? (
                          <>
                            Synced <span className="text-slate-200">{new Date(lastSyncedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                          </>
                        ) : (
                          'Syncing…'
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Daily hooks */}
                <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-[520px]">
                  <div className={SUBCARD}>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Today closes in</p>
                    <p className="mt-1 font-mono text-sm text-slate-100">{countdown}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {ticketClaimed ? 'Entry locked' : 'Claim before close'}
                    </p>
                  </div>

                  <TinyMeta
                    label="XPOT balance"
                    value={
                      xpotBalance === null
                        ? 'Checking…'
                        : xpotBalance === 'error'
                        ? 'Unavailable'
                        : `${Math.floor(xpotBalance).toLocaleString()} XPOT`
                    }
                  />

                  <div className={SUBCARD}>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Eligibility</p>
                    <div className="mt-1">
                      {typeof xpotBalance === 'number' ? (
                        hasRequiredXpot ? (
                          <StatusPill tone="emerald">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Eligible
                          </StatusPill>
                        ) : (
                          <StatusPill tone="amber">
                            <Sparkles className="h-3.5 w-3.5" />
                            Not eligible
                          </StatusPill>
                        )
                      ) : (
                        <StatusPill tone="slate">—</StatusPill>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => refreshAll('manual')}
                      className="mt-2 inline-flex text-[11px] font-semibold text-slate-300 hover:text-white"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* MAIN GRID */}
          <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            {/* LEFT COLUMN */}
            <div className="space-y-4">
              {/* IDENTITY CARD */}
              <section className={CARD}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Connected identity</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Wallet and X identity used for XPOT draws
                    </p>
                  </div>

                  <StatusPill tone={handle ? 'emerald' : 'amber'}>
                    <X className="h-3.5 w-3.5" />
                    {handle ? `@${handle}` : 'X not linked'}
                  </StatusPill>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <TinyMeta
                    label="XPOT balance"
                    value={
                      xpotBalance === null
                        ? 'Checking…'
                        : xpotBalance === 'error'
                        ? 'Unavailable'
                        : `${Math.floor(xpotBalance).toLocaleString()} XPOT`
                    }
                  />

                  <div className={SUBCARD}>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Eligibility</p>
                    <div className="mt-1">
                      {typeof xpotBalance === 'number' ? (
                        hasRequiredXpot ? (
                          <StatusPill tone="emerald">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Eligible
                          </StatusPill>
                        ) : (
                          <StatusPill tone="amber">
                            <Sparkles className="h-3.5 w-3.5" />
                            Not eligible
                          </StatusPill>
                        )
                      ) : (
                        <StatusPill tone="slate">—</StatusPill>
                      )}
                    </div>
                  </div>

                  <div className={SUBCARD}>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Wallet</p>
                    <p className="mt-1 font-mono text-sm text-slate-100">
                      {currentWalletAddress ? shortWallet(currentWalletAddress) : 'Not connected'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatar}
                      alt={name}
                      className="h-9 w-9 rounded-full border border-slate-800 object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-300">
                      <X className="h-4 w-4" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">{name}</p>
                    <p className="text-xs text-slate-500">
                      Holding requirement: {REQUIRED_XPOT.toLocaleString()} XPOT
                    </p>
                  </div>
                </div>
              </section>

              {/* TODAY TICKET */}
              <section className={CARD}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Today’s XPOT</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Claim a free entry if your wallet holds the minimum XPOT.
                    </p>
                  </div>

                  <StatusPill tone={ticketClaimed ? 'emerald' : 'slate'}>
                    <Ticket className="h-3.5 w-3.5" />
                    {ticketClaimed ? 'Entry active' : 'Not claimed'}
                  </StatusPill>
                </div>

                {!walletConnected && (
                  <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3 text-xs text-slate-400">
                    Activate your wallet to check eligibility and claim today’s entry.
                  </div>
                )}

                {walletConnected && !ticketClaimed && (
                  <>
                    <button
                      type="button"
                      onClick={handleClaimTicket}
                      disabled={!walletConnected || claiming}
                      className={`${BTN_PRIMARY} mt-4 px-6 py-3 text-sm`}
                    >
                      {claiming ? 'Generating…' : 'Claim today’s entry'}
                    </button>

                    {claimError && <p className="mt-3 text-xs text-amber-300">{claimError}</p>}

                    {typeof xpotBalance === 'number' && !hasRequiredXpot && (
                      <p className="mt-3 text-xs text-slate-500">
                        Your wallet is below the minimum. You need{' '}
                        <span className="font-semibold text-slate-200">
                          {REQUIRED_XPOT.toLocaleString()} XPOT
                        </span>{' '}
                        to claim today’s entry.
                      </p>
                    )}
                  </>
                )}

                {walletConnected && ticketClaimed && todaysTicket && (
                  <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Your ticket code</p>

                    <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                      <p className="font-mono text-base text-slate-100">{todaysTicket.code}</p>

                      <button
                        type="button"
                        onClick={() => handleCopyCode(todaysTicket)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/70 px-4 py-2 text-xs text-slate-200 hover:bg-slate-900/70"
                      >
                        <Copy className="h-4 w-4" />
                        {copiedId === todaysTicket.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Status:{' '}
                      <span className="font-semibold text-slate-200">IN DRAW</span>
                      {' · '}Issued {formatDateTime(todaysTicket.createdAt)}
                    </p>
                  </div>
                )}

                {walletConnected && ticketClaimed && !todaysTicket && (
                  <p className="mt-4 text-xs text-slate-500">
                    Your wallet has an entry today, but it hasn’t loaded yet. Refresh the page.
                  </p>
                )}

                {iWonToday && (
                  <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    You won today’s XPOT. Check your wallet and the winners feed.
                  </div>
                )}
              </section>

              {/* TODAY ENTRIES (your wallet only) */}
              {walletConnected && (
                <section className={CARD}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">Your entries today</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Entries tied to your connected wallet.
                      </p>
                    </div>
                    <StatusPill tone="sky">
                      <Wallet className="h-3.5 w-3.5" />
                      {myTickets.length}
                    </StatusPill>
                  </div>

                  <div className="mt-4 space-y-2">
                    {loadingTickets ? (
                      <p className="text-xs text-slate-500">Loading…</p>
                    ) : ticketsError ? (
                      <p className="text-xs text-amber-300">{ticketsError}</p>
                    ) : myTickets.length === 0 ? (
                      <p className="text-xs text-slate-500">No entries yet.</p>
                    ) : (
                      myTickets.map(t => (
                        <div
                          key={t.id}
                          className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-mono text-sm text-slate-100">{t.code}</p>
                            <StatusPill
                              tone={
                                t.status === 'in-draw'
                                  ? 'emerald'
                                  : t.status === 'won'
                                  ? 'sky'
                                  : 'slate'
                              }
                            >
                              {t.status.replace('-', ' ')}
                            </StatusPill>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            Issued {formatDateTime(t.createdAt)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-4">
              {/* RECENT WINNERS */}
              <section className={CARD}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Recent winners</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Latest completed draws across all holders.
                    </p>
                  </div>
                  <StatusPill tone="emerald">
                    <Sparkles className="h-3.5 w-3.5" />
                    Live
                  </StatusPill>
                </div>

                <div className="mt-4 space-y-2">
                  {loadingWinners ? (
                    <p className="text-xs text-slate-500">Loading…</p>
                  ) : winnersError ? (
                    <p className="text-xs text-amber-300">{winnersError}</p>
                  ) : recentWinners.length === 0 ? (
                    <p className="text-xs text-slate-500">No completed draws yet.</p>
                  ) : (
                    recentWinners.map(w => {
                      const h = w.handle ? w.handle.replace(/^@/, '') : null;
                      return (
                        <div
                          key={w.id}
                          className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-slate-400">{formatDate(w.drawDate)}</p>
                            {h ? (
                              <StatusPill tone="sky">
                                <X className="h-3.5 w-3.5" />
                                @{h}
                              </StatusPill>
                            ) : (
                              <StatusPill tone="slate">wallet</StatusPill>
                            )}
                          </div>

                          <div className="mt-2 flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-slate-100">
                              {initialFromHandle(h)}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-mono text-sm text-slate-100">{w.ticketCode}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {h ? `@${h}` : shortWallet(w.walletAddress)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* WALLET HISTORY (quick view) */}
              <section className={CARD}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Your draw history</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Past entries for this wallet (wins, not-picked, expired).
                    </p>
                  </div>

                  <Link href="/hub/history" className={`${BTN_UTILITY} h-9 px-4 text-xs`}>
                    View all
                  </Link>
                </div>

                <div className="mt-4 space-y-2">
                  {!walletConnected ? (
                    <p className="text-xs text-slate-500">Connect your wallet to view history.</p>
                  ) : loadingHistory ? (
                    <p className="text-xs text-slate-500">Loading…</p>
                  ) : historyError ? (
                    <p className="text-xs text-amber-300">{historyError}</p>
                  ) : historyEntries.length === 0 ? (
                    <p className="text-xs text-slate-500">No history yet.</p>
                  ) : (
                    historyEntries.slice(0, 5).map(t => (
                      <div
                        key={t.id}
                        className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-mono text-sm text-slate-100">{t.code}</p>
                          <StatusPill
                            tone={
                              t.status === 'won'
                                ? 'sky'
                                : t.status === 'claimed'
                                ? 'emerald'
                                : t.status === 'in-draw'
                                ? 'emerald'
                                : 'slate'
                            }
                          >
                            {t.status.replace('-', ' ')}
                          </StatusPill>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{formatDateTime(t.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="mt-8 border-t border-slate-800/70 pt-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-slate-400" />
              XPOT is in Pre-Launch Mode. UI is final, wiring continues.
            </span>
          </footer>
        </XpotPageShell>
      </div>
    </>
  );
}
