// app/hub/DashboardClient.tsx
'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';

import { useUser, SignOutButton } from '@clerk/nextjs';

import XpotPageShell from '@/components/XpotPageShell';
import PremiumWalletModal from '@/components/PremiumWalletModal';
import HubLockOverlay from '@/components/HubLockOverlay';
import JackpotPanel from '@/components/JackpotPanel';
import BonusStrip from '@/components/BonusStrip';

import { REQUIRED_XPOT, XPOT_POOL_SIZE } from '@/lib/xpot';

import {
  BadgeCheck,
  CheckCircle2,
  Copy,
  Crown,
  ExternalLink,
  History,
  LogOut,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Stars,
  Ticket,
  Timer,
  Wallet,
  X,
  Zap,
} from 'lucide-react';

// ─────────────────────────────────────────────
// V2 Theme (different bg colors everywhere)
// ─────────────────────────────────────────────

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-teal-300 to-cyan-200 text-slate-950 font-semibold shadow-[0_18px_60px_rgba(34,211,238,0.25)] hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_ALT =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-violet-400 text-slate-950 font-semibold shadow-[0_18px_60px_rgba(167,139,250,0.22)] hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_GHOST =
  'inline-flex items-center justify-center rounded-full border border-white/10 bg-transparent text-slate-200 hover:bg-white/[0.05] transition';

const CARD =
  'rounded-[26px] border border-white/10 bg-[#070A16]/70 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset,0_22px_80px_rgba(0,0,0,0.55)]';

const CARD_SOFT =
  'rounded-[26px] border border-white/10 bg-[#090D1F]/55 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset,0_18px_70px_rgba(0,0,0,0.45)]';

const SUBCARD =
  'rounded-2xl border border-white/10 bg-[#060913]/75 px-4 py-3';

const ROW =
  'rounded-2xl border border-white/10 bg-[#060913]/60 px-4 py-3';

const HERO =
  'relative overflow-hidden rounded-[32px] border border-white/10 bg-[#050713]/60 shadow-[0_40px_140px_rgba(0,0,0,0.65)]';

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
  tone?: 'slate' | 'teal' | 'violet' | 'amber';
}) {
  const cls =
    tone === 'teal'
      ? 'border border-cyan-300/20 bg-cyan-300/10 text-cyan-200'
      : tone === 'violet'
      ? 'border border-violet-300/20 bg-violet-300/10 text-violet-200'
      : tone === 'amber'
      ? 'border border-amber-300/20 bg-amber-300/10 text-amber-200'
      : 'border border-white/10 bg-white/[0.03] text-slate-200';

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
      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
    </div>
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
      <p className="mt-2 text-xs text-amber-300">
        No Solana wallet detected. Install Phantom or Solflare to continue.
      </p>
    );
  }

  return (
    <p className="mt-2 text-xs text-slate-400">
      Click “Select Wallet” and choose a wallet to connect.
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

type BonusLive = {
  id?: string;
  amountXpot?: number;
  scheduledAt?: string;
  status?: string;
};

// ─────────────────────────────────────────────
// Page (CLIENT)
// ─────────────────────────────────────────────

export default function DashboardClient() {
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  const [ticketClaimed, setTicketClaimed] = useState(false);
  const [todaysTicket, setTodaysTicket] = useState<Entry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const { publicKey, connected } = useWallet();
  const walletConnected = !!publicKey && connected;
  const currentWalletAddress = publicKey?.toBase58() ?? null;

  const [xpotBalance, setXpotBalance] = useState<number | null | 'error'>(null);
  const hasRequiredXpot =
    typeof xpotBalance === 'number' && xpotBalance >= REQUIRED_XPOT;

  const [historyEntries, setHistoryEntries] = useState<Entry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [recentWinners, setRecentWinners] = useState<RecentWinner[]>([]);
  const [loadingWinners, setLoadingWinners] = useState(false);
  const [winnersError, setWinnersError] = useState<string | null>(null);

  const [bonusLive, setBonusLive] = useState<BonusLive | null>(null);
  const [bonusError, setBonusError] = useState<string | null>(null);
  const [bonusCountdown, setBonusCountdown] = useState<string>('00:00:00');

  const [mainJackpotUsd, setMainJackpotUsd] = useState<number | null>(null);

  const [countdown, setCountdown] = useState('00:00:00');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [syncPulse, setSyncPulse] = useState(0);
  const [manualBusy, setManualBusy] = useState(false);
  const refreshingRef = useRef(false);

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

  const isAuthedEnough = isSignedIn && !!handle;
  const showLock = isUserLoaded ? !isAuthedEnough : true;

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

  useEffect(() => {
    const tick = () => {
      const ms = endOfLocalDayMs() - Date.now();
      setCountdown(formatCountdown(ms));
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const tick = () => {
      const iso = bonusLive?.scheduledAt;
      if (!iso) {
        setBonusCountdown('00:00:00');
        return;
      }
      const target = new Date(iso).getTime();
      const ms = target - Date.now();
      setBonusCountdown(formatCountdown(ms));
    };

    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [bonusLive?.scheduledAt]);

  const fetchTicketsToday = useCallback(async () => {
    const res = await fetch('/api/tickets/today', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load tickets');
    const data = await res.json();
    const list: Entry[] = Array.isArray(data.tickets) ? data.tickets : [];
    return list;
  }, []);

  const fetchXpotBalance = useCallback(async (address: string) => {
    const res = await fetch(`/api/xpot-balance?address=${address}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data: { balance: number } = await res.json();
    return data.balance;
  }, []);

  const fetchHistory = useCallback(async (address: string) => {
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
  }, []);

  const fetchRecentWinners = useCallback(async () => {
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
  }, []);

  const fetchBonusLive = useCallback(async () => {
    try {
      const res = await fetch('/api/bonus/live', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load bonus');
      const data = await res.json();

      const raw =
        (data && (data.bonus || data.next || data.item)) ??
        (Array.isArray(data?.bonuses) ? data.bonuses[0] : null) ??
        data ??
        null;

      if (!raw) return null;

      const next: BonusLive = {
        id: raw.id,
        amountXpot: Number(raw.amountXpot ?? raw.amount ?? 0) || 0,
        scheduledAt: raw.scheduledAt ?? raw.time ?? null,
        status: raw.status ?? raw.state ?? null,
      };

      return next;
    } catch (e) {
      console.warn('[XPOT] bonus live fetch failed (non-blocking)', e);
      return null;
    }
  }, []);

  const refreshAll = useCallback(
    async (reason: 'initial' | 'poll' | 'manual' = 'poll') => {
      if (!isAuthedEnough) return;
      if (refreshingRef.current) return;

      refreshingRef.current = true;

      const addr = publicKey?.toBase58() ?? null;

      try {
        if (reason === 'initial') {
          setLoadingTickets(true);
          setTicketsError(null);
        }
        const nextTickets = await fetchTicketsToday();
        setEntries(nextTickets);

        if (reason === 'initial') {
          setLoadingWinners(true);
          setWinnersError(null);
        }
        const nextWinners = await fetchRecentWinners();
        setRecentWinners(nextWinners);

        try {
          setBonusError(null);
          const nextBonus = await fetchBonusLive();
          setBonusLive(nextBonus);
        } catch (e) {
          console.warn('[XPOT] bonus live error', e);
          setBonusError('Bonus feed unavailable');
        }

        if (addr) {
          try {
            setXpotBalance(null);
            const b = await fetchXpotBalance(addr);
            setXpotBalance(b);
          } catch (e) {
            console.error('Error loading XPOT balance (via API)', e);
            setXpotBalance('error');
          }

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
    },
    [
      isAuthedEnough,
      publicKey,
      fetchTicketsToday,
      fetchRecentWinners,
      fetchXpotBalance,
      fetchHistory,
      fetchBonusLive,
    ],
  );

  useEffect(() => {
    if (!isAuthedEnough) {
      setEntries([]);
      setLoadingTickets(false);
      setTicketsError(null);

      setRecentWinners([]);
      setLoadingWinners(false);
      setWinnersError(null);

      setHistoryEntries([]);
      setHistoryError(null);
      setLoadingHistory(false);

      setXpotBalance(null);

      setBonusLive(null);
      setBonusError(null);
      return;
    }

    let cancelled = false;

    (async () => {
      await refreshAll('initial');
    })();

    const interval = setInterval(() => {
      if (cancelled) return;
      refreshAll('poll');
    }, 8000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthedEnough, refreshAll]);

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

      refreshAll('manual');
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

  const ritual = useMemo(() => {
    const xOk = !!handle;
    const wOk = walletConnected;
    const eligibleOk =
      !!walletConnected && typeof xpotBalance === 'number' && hasRequiredXpot;
    const entryOk = !!walletConnected && ticketClaimed;

    return [
      { key: 'x', label: 'X linked', ok: xOk },
      { key: 'w', label: 'Wallet connected', ok: wOk },
      { key: 'e', label: `Eligible (>= ${REQUIRED_XPOT.toLocaleString()} XPOT)`, ok: eligibleOk },
      { key: 't', label: 'Entry claimed', ok: entryOk },
    ];
  }, [handle, walletConnected, xpotBalance, hasRequiredXpot, ticketClaimed]);

  const ritualDone = ritual.filter(r => r.ok).length;

  const bonusAmount =
    typeof bonusLive?.amountXpot === 'number' ? bonusLive?.amountXpot : null;

  async function handleManualRefresh() {
    if (manualBusy) return;
    setManualBusy(true);
    try {
      await refreshAll('manual');
    } finally {
      setTimeout(() => setManualBusy(false), 700);
    }
  }

  return (
    <>
      <PremiumWalletModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />

      <HubLockOverlay
        open={showLock}
        reason={
          !isSignedIn
            ? 'Sign in with X to access the Holder Dashboard.'
            : 'Your account is signed in, but X is not linked. Link X to continue.'
        }
        showLinkX={isSignedIn && !handle}
      />

      <div
        className={
          showLock ? 'pointer-events-none select-none blur-[2px] opacity-95' : ''
        }
      >
        {/* Outer vibe wrapper - changes bg feel without touching globals */}
        <div className="relative">
          <div
            className="
              pointer-events-none absolute inset-0 -z-10
              bg-[radial-gradient(1100px_640px_at_18%_-10%,rgba(34,211,238,0.16),transparent_60%),
                  radial-gradient(900px_520px_at_82%_0%,rgba(167,139,250,0.14),transparent_60%),
                  radial-gradient(900px_520px_at_50%_120%,rgba(45,212,191,0.08),transparent_55%)]
            "
          />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#050713] via-[#04050C] to-[#020309]" />

          <XpotPageShell
            topBarProps={{
              pillText: 'HOLDER DASHBOARD',
              rightSlot: (
                <div className="flex items-center gap-3">
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

                  <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                    <button
                      type="button"
                      onClick={() => setWalletModalOpen(true)}
                      className="text-left leading-tight hover:opacity-90"
                    >
                      <div className="text-[28px] font-medium text-slate-100">
                        Select Wallet
                      </div>
                      <div className="text-[28px] font-medium text-slate-100">
                        Change wallet
                      </div>
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
                    <Link
                      href="/sign-in?redirect_url=/hub"
                      className={`${BTN_UTILITY} h-10 px-4 text-xs`}
                    >
                      <span>Sign in</span>
                    </Link>
                  )}
                </div>
              ),
            }}
          >
            {/* HERO / COMMAND DECK */}
            <section className="mt-6">
              <div className={HERO}>
                <div
                  className="
                    pointer-events-none absolute -inset-48 opacity-80 blur-3xl
                    bg-[radial-gradient(circle_at_12%_10%,rgba(34,211,238,0.18),transparent_56%),
                        radial-gradient(circle_at_88%_18%,rgba(167,139,250,0.18),transparent_58%),
                        radial-gradient(circle_at_70%_92%,rgba(45,212,191,0.10),transparent_60%)]
                  "
                />

                <div className="relative z-10 grid gap-5 p-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:p-6">
                  {/* Left */}
                  <div className={CARD_SOFT}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                          <Crown className="h-3.5 w-3.5 text-amber-200" />
                          Daily command deck
                        </div>

                        <h1 className="mt-3 text-balance text-2xl font-semibold text-slate-50 sm:text-3xl">
                          Welcome back{handle ? `, @${handle.replace(/^@/, '')}` : ''}.
                        </h1>
                        <p className="mt-2 text-sm text-slate-300">
                          Claim your entry then return for the draw. XPOT is built to feel
                          like a ritual, not a one-off click.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleManualRefresh}
                        className={`${BTN_GHOST} h-10 px-4 text-xs`}
                        disabled={manualBusy}
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        {manualBusy ? 'Syncing…' : 'Refresh'}
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className={SUBCARD}>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                          Main draw
                        </p>
                        <p className="mt-1 font-mono text-lg text-slate-50">
                          {countdown}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          until daily selection
                        </p>
                      </div>

                      <div className={SUBCARD}>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                          Bonus
                        </p>
                        <p className="mt-1 font-mono text-lg text-slate-50">
                          {bonusLive?.scheduledAt ? bonusCountdown : '—'}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          until next drop
                        </p>
                      </div>

                      <div className={SUBCARD}>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                          Checklist
                        </p>
                        <p className="mt-1 font-mono text-lg text-slate-50">
                          {ritualDone}/4
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          keep it green
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-cyan-200" />
                          <p className="text-xs font-semibold text-slate-100">
                            Daily checklist
                          </p>
                        </div>
                        <StatusPill tone={ritualDone === 4 ? 'teal' : 'amber'}>
                          <Stars className="h-3.5 w-3.5" />
                          {ritualDone}/4
                        </StatusPill>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {ritual.map(step => (
                          <div
                            key={step.key}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#060913]/55 px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-100">
                                {step.label}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-400">
                                {step.ok ? 'Complete' : 'Pending'}
                              </p>
                            </div>
                            <StatusPill tone={step.ok ? 'teal' : 'amber'}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {step.ok ? 'OK' : 'Fix'}
                            </StatusPill>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-200/80" />
                          {lastSyncedAt ? (
                            <span key={syncPulse}>
                              Synced {new Date(lastSyncedAt).toLocaleTimeString('de-DE')}
                            </span>
                          ) : (
                            'Syncing…'
                          )}
                        </span>

                        <span className="inline-flex items-center gap-2">
                          <X className="h-4 w-4" />
                          Public identity: @{(handle || 'x').replace(/^@/, '')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right pots */}
                  <div className="space-y-4">
                    <div className={CARD}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-100">
                            Today’s main pot
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Live USD estimate tracks Jupiter pricing.
                          </p>
                        </div>
                        <StatusPill tone="teal">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Live
                        </StatusPill>
                      </div>

                      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                            Main pot
                          </div>
                          <div className="font-mono text-sm text-slate-100">
                            {Number(XPOT_POOL_SIZE ?? 0).toLocaleString()} XPOT
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                          Draw in <span className="font-mono text-slate-100">{countdown}</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <JackpotPanel
                          variant="embedded"
                          onJackpotUsdChange={setMainJackpotUsd}
                        />
                      </div>

                      <div className="mt-3 text-[11px] text-slate-400">
                        {typeof mainJackpotUsd === 'number' ? (
                          <>
                            Estimated value:{' '}
                            <span className="font-semibold text-slate-100">
                              {mainJackpotUsd.toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </>
                        ) : (
                          'Estimating value…'
                        )}
                      </div>
                    </div>

                    <div className={CARD}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-100">
                            Bonus XPOT
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Scheduled bonuses can drop anytime.
                          </p>
                        </div>
                        <StatusPill tone={bonusLive?.scheduledAt ? 'amber' : 'slate'}>
                          <Sparkles className="h-3.5 w-3.5" />
                          {bonusLive?.scheduledAt ? 'Scheduled' : 'Idle'}
                        </StatusPill>
                      </div>

                      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                            Next bonus
                          </div>
                          <div className="font-mono text-sm text-slate-100">
                            {typeof bonusAmount === 'number' && bonusAmount > 0
                              ? `${Math.floor(bonusAmount).toLocaleString()} XPOT`
                              : '—'}
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-2">
                            <Timer className="h-4 w-4 text-amber-200" />
                            <span className="font-mono text-slate-100">
                              {bonusLive?.scheduledAt ? bonusCountdown : '—'}
                            </span>
                          </span>

                          {bonusLive?.scheduledAt && (
                            <span className="text-[11px] text-slate-400">
                              {new Date(bonusLive.scheduledAt).toLocaleString('de-DE')}
                            </span>
                          )}
                        </div>

                        {bonusError && (
                          <p className="mt-2 text-xs text-amber-300">{bonusError}</p>
                        )}
                      </div>

                      <div className="mt-3">
                        <BonusStrip />
                      </div>

                      <p className="mt-2 text-[11px] text-slate-400">
                        Bonus payouts are on-chain. Winner identity is shown by handle.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* MAIN GRID (keeps all your existing sections and logic) */}
            <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              {/* LEFT COLUMN */}
              <div className="space-y-4">
                <section className={CARD}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        Connected identity
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Wallet and X identity used for XPOT draws
                      </p>
                    </div>

                    <StatusPill tone={handle ? 'teal' : 'amber'}>
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
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                        Eligibility
                      </p>
                      <div className="mt-1">
                        {typeof xpotBalance === 'number' ? (
                          hasRequiredXpot ? (
                            <StatusPill tone="teal">
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
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                        Wallet
                      </p>
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
                        className="h-9 w-9 rounded-full border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200">
                        <X className="h-4 w-4" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">
                        {name}
                      </p>
                      <p className="text-xs text-slate-400">
                        Holding requirement: {REQUIRED_XPOT.toLocaleString()} XPOT
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <Timer className="h-4 w-4 text-slate-400" />
                      Next draw in <span className="font-mono text-slate-100">{countdown}</span>
                    </span>

                    <span className="inline-flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-200/80" />
                      {lastSyncedAt ? (
                        <span key={syncPulse}>
                          Synced {new Date(lastSyncedAt).toLocaleTimeString('de-DE')}
                        </span>
                      ) : (
                        'Syncing…'
                      )}
                    </span>
                  </div>
                </section>

                {/* TODAY TICKET */}
                <section className={CARD}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        Today’s XPOT
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Claim a free entry if your wallet holds the minimum XPOT.
                      </p>
                    </div>

                    <StatusPill tone={ticketClaimed ? 'teal' : 'slate'}>
                      <Ticket className="h-3.5 w-3.5" />
                      {ticketClaimed ? 'Entry active' : 'Not claimed'}
                    </StatusPill>
                  </div>

                  {!walletConnected && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-300">
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

                      {claimError && (
                        <p className="mt-3 text-xs text-amber-300">{claimError}</p>
                      )}

                      {typeof xpotBalance === 'number' && !hasRequiredXpot && (
                        <p className="mt-3 text-xs text-slate-400">
                          Your wallet is below the minimum. You need{' '}
                          <span className="font-semibold text-slate-100">
                            {REQUIRED_XPOT.toLocaleString()} XPOT
                          </span>{' '}
                          to claim today’s entry.
                        </p>
                      )}
                    </>
                  )}

                  {walletConnected && ticketClaimed && todaysTicket && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                        Your ticket code
                      </p>

                      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                        <p className="font-mono text-base text-slate-100">
                          {todaysTicket.code}
                        </p>

                        <button
                          type="button"
                          onClick={() => handleCopyCode(todaysTicket)}
                          className={`${BTN_UTILITY} px-4 py-2 text-xs`}
                        >
                          <Copy className="h-4 w-4" />
                          {copiedId === todaysTicket.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>

                      <p className="mt-2 text-xs text-slate-400">
                        Status:{' '}
                        <span className="font-semibold text-slate-100">IN DRAW</span>
                        {' · '}Issued {formatDateTime(todaysTicket.createdAt)}
                      </p>
                    </div>
                  )}

                  {walletConnected && ticketClaimed && !todaysTicket && (
                    <p className="mt-4 text-xs text-slate-400">
                      Your wallet has an entry today, but it hasn’t loaded yet. Refresh the page.
                    </p>
                  )}

                  {iWonToday && (
                    <div className="mt-4 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-200">
                      You won today’s XPOT. Check your wallet and the winners feed.
                    </div>
                  )}
                </section>

                {/* TODAY ENTRIES */}
                {walletConnected && (
                  <section className={CARD}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">
                          Your entries today
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Entries tied to your connected wallet.
                        </p>
                      </div>
                      <StatusPill tone="violet">
                        <Wallet className="h-3.5 w-3.5" />
                        {myTickets.length}
                      </StatusPill>
                    </div>

                    <div className="mt-4 space-y-2">
                      {loadingTickets ? (
                        <p className="text-xs text-slate-400">Loading…</p>
                      ) : ticketsError ? (
                        <p className="text-xs text-amber-300">{ticketsError}</p>
                      ) : myTickets.length === 0 ? (
                        <p className="text-xs text-slate-400">No entries yet.</p>
                      ) : (
                        myTickets.map(t => (
                          <div key={t.id} className={ROW}>
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-mono text-sm text-slate-100">
                                {t.code}
                              </p>
                              <StatusPill
                                tone={
                                  t.status === 'in-draw'
                                    ? 'teal'
                                    : t.status === 'won'
                                    ? 'violet'
                                    : 'slate'
                                }
                              >
                                {t.status.replace('-', ' ')}
                              </StatusPill>
                            </div>
                            <p className="mt-1 text-xs text-slate-400">
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
                <section className={CARD}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        Recent winners
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Latest completed draws across all holders.
                      </p>
                    </div>
                    <StatusPill tone="teal">
                      <Sparkles className="h-3.5 w-3.5" />
                      Live
                    </StatusPill>
                  </div>

                  <div className="mt-4 space-y-2">
                    {loadingWinners ? (
                      <p className="text-xs text-slate-400">Loading…</p>
                    ) : winnersError ? (
                      <p className="text-xs text-amber-300">{winnersError}</p>
                    ) : recentWinners.length === 0 ? (
                      <p className="text-xs text-slate-400">
                        No completed draws yet.
                      </p>
                    ) : (
                      recentWinners.map(w => {
                        const h = w.handle ? w.handle.replace(/^@/, '') : null;
                        return (
                          <div key={w.id} className={ROW}>
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs text-slate-400">
                                {formatDate(w.drawDate)}
                              </p>
                              {h ? (
                                <StatusPill tone="violet">
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
                                <p className="truncate font-mono text-sm text-slate-100">
                                  {w.ticketCode}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {h ? `@${h}` : shortWallet(w.walletAddress)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <Link href="/hub/winners" className={`${BTN_UTILITY} h-9 px-4 text-xs`}>
                      View winners
                      <ExternalLink className="ml-2 h-4 w-4 text-slate-400" />
                    </Link>

                    <p className="text-[11px] text-slate-400">
                      Winners are shown by handle when available.
                    </p>
                  </div>
                </section>

                <section className={CARD}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        Your draw history
                      </p>
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
                      <p className="text-xs text-slate-400">
                        Connect your wallet to view history.
                      </p>
                    ) : loadingHistory ? (
                      <p className="text-xs text-slate-400">Loading…</p>
                    ) : historyError ? (
                      <p className="text-xs text-amber-300">{historyError}</p>
                    ) : historyEntries.length === 0 ? (
                      <p className="text-xs text-slate-400">No history yet.</p>
                    ) : (
                      historyEntries.slice(0, 5).map(t => (
                        <div key={t.id} className={ROW}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-mono text-sm text-slate-100">
                              {t.code}
                            </p>
                            <StatusPill
                              tone={
                                t.status === 'won'
                                  ? 'violet'
                                  : t.status === 'claimed'
                                  ? 'teal'
                                  : t.status === 'in-draw'
                                  ? 'teal'
                                  : 'slate'
                              }
                            >
                              {t.status.replace('-', ' ')}
                            </StatusPill>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDateTime(t.createdAt)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </section>

            <footer className="mt-8 border-t border-white/10 pt-4 text-xs text-slate-400">
              <span className="inline-flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-slate-300" />
                XPOT is in Pre-Launch Mode. UI is final, wiring continues.
              </span>
            </footer>
          </XpotPageShell>
        </div>
      </div>
    </>
  );
}
