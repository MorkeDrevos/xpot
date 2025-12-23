// app/hub/DashboardClient.tsx
'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';

import { useUser, SignOutButton } from '@clerk/nextjs';
import GoldAmount from '@/components/GoldAmount';

import XpotPageShell from '@/components/XpotPageShell';
import PremiumWalletModal from '@/components/PremiumWalletModal';
import HubLockOverlay from '@/components/HubLockOverlay';
import BonusStrip from '@/components/BonusStrip';
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
  Radio,
  Volume2,
  VolumeX,
  Flame,
  Target,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Small UI helpers
// ─────────────────────────────────────────────

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full xpot-btn-vault xpot-focus-gold font-semibold transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 transition disabled:cursor-not-allowed disabled:opacity-40';

const CARD =
  'rounded-[28px] border border-slate-800/70 bg-slate-950/60 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]';

const SUBCARD =
  'rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3';

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
      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.14)]'
      : tone === 'amber'
      ? 'xpot-pill-gold border shadow-[0_0_0_1px_rgba(255,255,255,0.03)] bg-white/[0.02]'
      : tone === 'sky'
      ? 'border-sky-400/30 bg-sky-500/10 text-sky-200 shadow-[0_0_0_1px_rgba(56,189,248,0.12)]'
      : 'border-white/10 bg-slate-800/70 text-slate-200 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]';

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
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
      <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function WalletStatusHint() {
  const { wallets, connected } = useWallet();

  const anyDetected = wallets.some(
    w => w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable,
  );

  if (connected) return null;

  if (!anyDetected) {
    return (
      <p className="mt-2 text-xs xpot-gold-text">
        No Solana wallet detected. Install Phantom or Solflare to continue.
      </p>
    );
  }

  return <p className="mt-2 text-xs text-slate-500">Click “Select Wallet” and choose a wallet to connect.</p>;
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

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(Boolean(m.matches));
    apply();
    m.addEventListener?.('change', apply);
    return () => m.removeEventListener?.('change', apply);
  }, []);
  return reduced;
}

// ─────────────────────────────────────────────
// Bonus hook (same endpoint as homepage)
// ─────────────────────────────────────────────

type BonusUpcoming = {
  id: string;
  amountXpot: number;
  scheduledAt: string;
  status?: 'UPCOMING' | 'CLAIMED' | 'CANCELLED';
  label?: string;
};

function useBonusUpcoming() {
  const [bonus, setBonus] = useState<BonusUpcoming | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function probe() {
      try {
        const r = await fetch('/api/bonus/upcoming', { cache: 'no-store' });
        if (!alive) return;

        if (!r.ok) {
          setBonus(null);
          setLoading(false);
          return;
        }

        const data = (await r.json().catch(() => null)) as any;
        const b = data?.bonus ?? null;

        if (b?.scheduledAt) setBonus(b as BonusUpcoming);
        else setBonus(null);

        setLoading(false);
      } catch {
        if (!alive) return;
        setBonus(null);
        setLoading(false);
      }
    }

    probe();
    const t = window.setInterval(probe, 15_000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);

  return { bonus, loading, active: Boolean(bonus?.scheduledAt) };
}

// ─────────────────────────────────────────────
// Entry ceremony (2s shimmer + stamp + optional chime)
// ─────────────────────────────────────────────

function playChime() {
  try {
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as any;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();

    o.type = 'sine';
    o.frequency.value = 880;

    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

    o.connect(g);
    g.connect(ctx.destination);
    o.start();

    setTimeout(() => {
      o.stop();
      ctx.close?.();
    }, 300);
  } catch {
    // ignore
  }
}

function EntryCeremony({
  open,
  code,
  onClose,
  soundEnabled,
}: {
  open: boolean;
  code: string;
  onClose: () => void;
  soundEnabled: boolean;
}) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    if (!reduced && soundEnabled) playChime();
    const t = window.setTimeout(onClose, 2000);
    return () => window.clearTimeout(t);
  }, [open, onClose, soundEnabled, reduced]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-5">
      <style jsx global>{`
        @keyframes xpotCeremonySweep {
          0% { transform: translateX(-140%) rotate(12deg); opacity: 0.0; }
          10% { opacity: 0.35; }
          55% { opacity: 0.14; }
          100% { transform: translateX(160%) rotate(12deg); opacity: 0.0; }
        }
        @keyframes xpotStampIn {
          0% { transform: scale(1.2) rotate(-6deg); opacity: 0; filter: blur(2px); }
          55% { transform: scale(0.98) rotate(2deg); opacity: 1; filter: blur(0px); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .xpot-ceremony-sweep::before{
          content:"";
          position:absolute;
          top:-55%;
          left:-60%;
          width:55%;
          height:240%;
          opacity:0;
          transform: rotate(12deg);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), rgba(56,189,248,0.12), rgba(16,185,129,0.10), transparent);
          animation: xpotCeremonySweep 1.6s ease-in-out infinite;
          mix-blend-mode: screen;
          pointer-events:none;
        }
      `}</style>

      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 shadow-[0_40px_140px_rgba(0,0,0,0.75)] backdrop-blur-xl">
        <div className="xpot-ceremony-sweep absolute inset-0" />
        <div className="pointer-events-none absolute -inset-24 opacity-70 blur-3xl bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.22),transparent_60%),radial-gradient(circle_at_80%_35%,rgba(56,189,248,0.14),transparent_62%),radial-gradient(circle_at_50%_100%,rgba(255,215,0,0.08),transparent_62%)]" />

        <div className="relative p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">Entry issued</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/18 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
              <Radio className="h-3.5 w-3.5" />
              LIVE
            </span>
          </div>

          <div className="mt-4">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/18 bg-emerald-950/25 px-4 py-3">
              <Ticket className="h-5 w-5 text-emerald-200" />
              <span className="font-mono text-base text-slate-100">{code}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center">
            <div
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200"
              style={{ animation: reduced ? 'none' : 'xpotStampIn 420ms ease-out both' }}
            >
              STAMPED IN
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            Your daily entry is live. Come back after draw time for proof.
          </p>
        </div>
      </div>
    </div>
  );
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

type Mission = { title: string; desc: string; ymd?: string };
type Streak = { days: number; todayDone: boolean; lastDoneYmd?: string | null };

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

  const [showCeremony, setShowCeremony] = useState(false);
  const [ceremonyCode, setCeremonyCode] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const { publicKey, connected } = useWallet();
  const walletConnected = !!publicKey && connected;
  const currentWalletAddress = publicKey?.toBase58() ?? null;

  const [xpotBalance, setXpotBalance] = useState<number | null | 'error'>(null);
  const hasRequiredXpot = typeof xpotBalance === 'number' && xpotBalance >= REQUIRED_XPOT;

  const [historyEntries, setHistoryEntries] = useState<Entry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [recentWinners, setRecentWinners] = useState<RecentWinner[]>([]);
  const [loadingWinners, setLoadingWinners] = useState(false);
  const [winnersError, setWinnersError] = useState<string | null>(null);

  const [countdown, setCountdown] = useState('00:00:00');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [syncPulse, setSyncPulse] = useState(0);
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

  const { bonus: upcomingBonus, active: bonusActive } = useBonusUpcoming();

  // DB-driven streak + mission
  const [streak, setStreak] = useState<Streak>({ days: 0, todayDone: false });
  const [mission, setMission] = useState<Mission>({
    title: 'Loading…',
    desc: 'Preparing today’s mission.',
  });

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
  // Countdown ticker
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
  // Hub boot: preferences + streak + mission (Prisma)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthedEnough) return;

    let alive = true;

    (async () => {
      try {
        const pr = await fetch('/api/me/preferences', { cache: 'no-store' });
        if (alive && pr.ok) {
          const pj = (await pr.json().catch(() => null)) as any;
          const se = pj?.preferences?.soundEnabled;
          if (typeof se === 'boolean') setSoundEnabled(se);
        }

        const sr = await fetch('/api/hub/streak', { cache: 'no-store' });
        if (alive && sr.ok) {
          const sj = (await sr.json().catch(() => null)) as any;
          if (sj?.streak) setStreak(sj.streak as Streak);
        }

        const mr = await fetch(`/api/hub/mission/today?seed=${encodeURIComponent(handle || '')}`, {
          cache: 'no-store',
        });
        if (alive && mr.ok) {
          const mj = (await mr.json().catch(() => null)) as any;
          if (mj?.mission?.title) setMission(mj.mission as Mission);
        }
      } catch (e) {
        console.error('[hub boot] failed', e);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isAuthedEnough, handle]);

  // ─────────────────────────────────────────────
  // Fetch helpers
  // ─────────────────────────────────────────────
  const fetchTicketsToday = useCallback(async () => {
    const res = await fetch('/api/tickets/today', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load tickets');
    const data = await res.json();
    const list: Entry[] = Array.isArray(data.tickets) ? data.tickets : [];
    return list;
  }, []);

  const fetchXpotBalance = useCallback(async (address: string) => {
    const res = await fetch(`/api/xpot-balance?address=${address}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data: { balance: number } = await res.json();
    return data.balance;
  }, []);

  const fetchHistory = useCallback(async (address: string) => {
    const res = await fetch(`/api/tickets/history?wallet=${address}`, { cache: 'no-store' });
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
    [isAuthedEnough, publicKey, fetchTicketsToday, fetchRecentWinners, fetchXpotBalance, fetchHistory],
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

  // Sync "today's ticket" state with DB
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

  async function handleCopyCode(entry: Entry) {
    const ok = await safeCopy(entry.code);
    if (!ok) return;
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function markStreakDone() {
    try {
      const r = await fetch('/api/hub/streak', { method: 'POST' });
      if (!r.ok) return;
      const j = (await r.json().catch(() => null)) as any;
      if (j?.streak) setStreak(j.streak as Streak);
    } catch {
      // ignore
    }
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
            setClaimError('Your wallet needs some SOL for network fees before you can get today’s ticket.');
            break;
          case 'XPOT_CHECK_FAILED':
            setClaimError('Could not verify your XPOT balance right now. Please try again in a moment.');
            break;
          case 'MISSING_WALLET':
          case 'INVALID_BODY':
            setClaimError('Something is wrong with your wallet address. Try reconnecting your wallet and trying again.');
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

      setCeremonyCode(ticket?.code || '');
      setShowCeremony(true);

      await markStreakDone();

      refreshAll('manual');
    } catch (err) {
      console.error('Error calling /api/tickets/claim', err);
      setClaimError('Unexpected error while getting your ticket. Please try again.');
    } finally {
      setClaiming(false);
    }
  }

  const normalizedWallet = currentWalletAddress?.toLowerCase();
  const myTickets: Entry[] = useMemo(() => {
    if (!normalizedWallet) return [];
    return entries.filter(e => e.walletAddress?.toLowerCase() === normalizedWallet);
  }, [entries, normalizedWallet]);

  const winner = entries.find(e => e.status === 'won') || null;
  const iWonToday = !!winner && !!normalizedWallet && winner.walletAddress?.toLowerCase() === normalizedWallet;

  async function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);

    try {
      await fetch('/api/me/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soundEnabled: next }),
      });
    } catch {
      // ignore
    }

    if (next) playChime();
  }

  return (
    <>
      <PremiumWalletModal open={walletModalOpen} onClose={() => setWalletModalOpen(false)} />

      <EntryCeremony
        open={showCeremony}
        code={ceremonyCode}
        soundEnabled={soundEnabled}
        onClose={() => setShowCeremony(false)}
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

      <div className={showLock ? 'pointer-events-none select-none blur-[2px] opacity-95' : ''}>
        <XpotPageShell
          topBarProps={{
            pillText: 'HOLDER DASHBOARD',
            rightSlot: (
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 sm:inline-flex">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt={name} className="h-6 w-6 rounded-full border border-white/10 object-cover" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[11px] font-semibold text-slate-200">
                      {initialFromHandle(handle)}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-slate-200">@{(handle || 'x').replace(/^@/, '')}</span>
                </div>

                <button
                  type="button"
                  onClick={toggleSound}
                  className={`${BTN_UTILITY} h-10 px-4 text-xs`}
                  title={soundEnabled ? 'Sound on' : 'Sound off'}
                >
                  {soundEnabled ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}
                  {soundEnabled ? 'Sound' : 'Muted'}
                </button>

                <Link href="/hub/history" className={`${BTN_UTILITY} h-10 px-4 text-xs`}>
                  <History className="mr-2 h-4 w-4" />
                  <span className="ml-1">History</span>
                </Link>

                <div className="rounded-full border border-slate-700/80 bg-slate-950/50 px-4 py-2">
                  <button
                    type="button"
                    onClick={() => setWalletModalOpen(true)}
                    className="text-left leading-tight hover:opacity-90"
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Wallet bay</div>
                    <div className="text-[13px] font-semibold text-slate-100">
                      {walletConnected ? 'Change wallet' : 'Select wallet'}
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
                  <Link href="/sign-in?redirect_url=/hub" className={`${BTN_UTILITY} h-10 px-4 text-xs`}>
                    <span>Sign in</span>
                  </Link>
                )}
              </div>
            ),
          }}
        >
          {/* TOP RITUAL STRIP */}
          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            {/* Mission */}
            <section className={CARD}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Today’s mission</p>
                  <p className="mt-1 text-xs text-slate-400">DB-driven and changes daily.</p>
                </div>
                <StatusPill tone="sky">
                  <Target className="h-3.5 w-3.5" />
                  Daily
                </StatusPill>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3">
                <p className="text-xs font-semibold text-slate-100">{mission.title}</p>
                <p className="mt-1 text-xs text-slate-500">{mission.desc}</p>
              </div>

              <p className="mt-3 text-[11px] text-slate-500">Later: this becomes truly personalized per holder.</p>
            </section>

            {/* Streak */}
            <section className={CARD}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Daily streak</p>
                  <p className="mt-1 text-xs text-slate-400">Healthy consistency - not a casino loop.</p>
                </div>
                <StatusPill tone={streak.todayDone ? 'emerald' : 'amber'}>
                  <Flame className="h-3.5 w-3.5" />
                  {streak.todayDone ? 'Today done' : 'Pending'}
                </StatusPill>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <TinyMeta label="Streak days" value={`${Math.max(0, streak.days)}`} />
                <TinyMeta label="Reset logic" value="UTC day rule" />
              </div>

              <p className="mt-3 text-[11px] text-slate-500">
                Streak increments when you claim today’s entry.
              </p>
            </section>

            {/* Bonus XPOT */}
            <section className={CARD}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Bonus XPOT</p>
                  <p className="mt-1 text-xs text-slate-400">Shows automatically when a bonus drop is scheduled.</p>
                </div>
                {bonusActive ? (
                  <StatusPill tone="emerald">
                    <Sparkles className="h-3.5 w-3.5" />
                    Active
                  </StatusPill>
                ) : (
                  <StatusPill tone="slate">None</StatusPill>
                )}
              </div>

              {bonusActive && upcomingBonus ? (
                <div className="mt-4 rounded-[22px] border border-emerald-400/18 bg-emerald-950/20 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200/80">
                      Scheduled
                    </span>
                    <span className="text-[11px] font-mono text-emerald-100/90">
                      {new Date(upcomingBonus.scheduledAt).toLocaleString('de-DE')}
                    </span>
                  </div>
                  <BonusStrip variant="home" />
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3 text-xs text-slate-500">
                  No bonus scheduled right now.
                </div>
              )}
            </section>
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
                    <p className="mt-1 text-xs text-slate-400">Wallet and X identity used for XPOT draws</p>
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
                    <img src={avatar} alt={name} className="h-9 w-9 rounded-full border border-slate-800 object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-300">
                      <X className="h-4 w-4" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">{name}</p>
                    <p className="text-xs text-slate-500">
                      Holding requirement: <GoldAmount value={REQUIRED_XPOT.toLocaleString()} suffix="XPOT" size="sm" />
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Next draw in <span className="font-mono text-slate-200">{countdown}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {lastSyncedAt ? (
                      <span key={syncPulse} className="inline-flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                        Synced {new Date(lastSyncedAt).toLocaleTimeString('de-DE')}
                      </span>
                    ) : (
                      'Syncing…'
                    )}
                  </div>
                </div>
              </section>

              {/* TODAY TICKET */}
              <section className={CARD}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Today’s XPOT</p>
                    <p className="mt-1 text-xs text-slate-400">Claim a free entry if your wallet holds the minimum XPOT.</p>
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

                    {claimError && <p className="mt-3 text-xs xpot-gold-text">{claimError}</p>}

                    {typeof xpotBalance === 'number' && !hasRequiredXpot && (
                      <p className="mt-3 text-xs text-slate-500">
                        Your wallet is below the minimum. You need{' '}
                        <span className="font-semibold text-slate-200">{REQUIRED_XPOT.toLocaleString()} XPOT</span> to claim today’s entry.
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
                      Status: <span className="font-semibold text-slate-200">IN DRAW</span>
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
                      <p className="mt-1 text-xs text-slate-400">Entries tied to your connected wallet.</p>
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
                      <p className="text-xs xpot-gold-text">{ticketsError}</p>
                    ) : myTickets.length === 0 ? (
                      <p className="text-xs text-slate-500">No entries yet.</p>
                    ) : (
                      myTickets.map(t => (
                        <div key={t.id} className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-mono text-sm text-slate-100">{t.code}</p>
                            <StatusPill tone={t.status === 'in-draw' ? 'emerald' : t.status === 'won' ? 'sky' : 'slate'}>
                              {t.status.replace('-', ' ')}
                            </StatusPill>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">Issued {formatDateTime(t.createdAt)}</p>
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
                    <p className="mt-1 text-xs text-slate-400">Latest completed draws across all holders.</p>
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
                    <p className="text-xs xpot-gold-text">{winnersError}</p>
                  ) : recentWinners.length === 0 ? (
                    <p className="text-xs text-slate-500">No completed draws yet.</p>
                  ) : (
                    recentWinners.map(w => {
                      const h = w.handle ? w.handle.replace(/^@/, '') : null;
                      return (
                        <div key={w.id} className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3">
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
                              <p className="mt-1 text-xs text-slate-500">{h ? `@${h}` : shortWallet(w.walletAddress)}</p>
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
                    <p className="mt-1 text-xs text-slate-400">Past entries for this wallet (wins, not-picked, expired).</p>
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
                    <p className="text-xs xpot-gold-text">{historyError}</p>
                  ) : historyEntries.length === 0 ? (
                    <p className="text-xs text-slate-500">No history yet.</p>
                  ) : (
                    historyEntries.slice(0, 5).map(t => (
                      <div key={t.id} className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3">
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

          <footer className="mt-8 border-t border-slate-800/70 pt-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-slate-400" />
              XPOT is in Pre-Launch Mode. UI is final and wiring is live.
            </span>
          </footer>
        </XpotPageShell>
      </div>
    </>
  );
}
