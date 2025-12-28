// app/hub/DashboardClient.tsx
'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

import { SignOutButton, useUser } from '@clerk/nextjs';

import BonusStrip from '@/components/BonusStrip';
import GoldAmount from '@/components/GoldAmount';
import HubLockOverlay from '@/components/HubLockOverlay';
import XpotPageShell from '@/components/XpotPageShell';
import { REQUIRED_XPOT, TOKEN_MINT } from '@/lib/xpot';

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
  'relative inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-slate-950 ' +
  'bg-[linear-gradient(90deg,rgba(251,191,36,0.95),rgba(56,189,248,0.90),rgba(236,72,153,0.88))] ' +
  'shadow-[0_30px_120px_rgba(0,0,0,0.55)] ring-1 ring-white/20 ' +
  'transition hover:brightness-[1.06] active:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] transition disabled:cursor-not-allowed disabled:opacity-40';

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

function formatCountdown(ms: number) {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

// ─────────────────────────────────────────────
// Madrid cutoff logic (22:00 Europe/Madrid)
// ─────────────────────────────────────────────

const MADRID_TZ = 'Europe/Madrid';
const MADRID_CUTOFF_HH = 22;
const MADRID_CUTOFF_MM = 0;

function getTzParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const pick = (type: string) => parts.find(p => p.type === type)?.value ?? '00';

  return {
    y: Number(pick('year')),
    m: Number(pick('month')),
    d: Number(pick('day')),
    hh: Number(pick('hour')),
    mm: Number(pick('minute')),
    ss: Number(pick('second')),
  };
}

function wallClockToUtcMs({
  y,
  m,
  d,
  hh,
  mm,
  ss,
  timeZone,
}: {
  y: number;
  m: number;
  d: number;
  hh: number;
  mm: number;
  ss: number;
  timeZone: string;
}) {
  let t = Date.UTC(y, m - 1, d, hh, mm, ss);

  for (let i = 0; i < 3; i++) {
    const got = getTzParts(new Date(t), timeZone);
    const wantTotal = (((y * 12 + m) * 31 + d) * 24 + hh) * 60 + mm;
    const gotTotal = (((got.y * 12 + got.m) * 31 + got.d) * 24 + got.hh) * 60 + got.mm;
    const diffMin = gotTotal - wantTotal;
    if (diffMin === 0) break;
    t -= diffMin * 60_000;
  }

  return t;
}

function nextMadridCutoffUtcMs(now = new Date()) {
  const madridNow = getTzParts(now, MADRID_TZ);
  const nowMin = madridNow.hh * 60 + madridNow.mm;
  const cutoffMin = MADRID_CUTOFF_HH * 60 + MADRID_CUTOFF_MM;

  const baseDate = nowMin < cutoffMin ? now : new Date(now.getTime() + 24 * 60 * 60_000);
  const madridTargetDay = getTzParts(baseDate, MADRID_TZ);

  return wallClockToUtcMs({
    y: madridTargetDay.y,
    m: madridTargetDay.m,
    d: madridTargetDay.d,
    hh: MADRID_CUTOFF_HH,
    mm: MADRID_CUTOFF_MM,
    ss: 0,
    timeZone: MADRID_TZ,
  });
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
      ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.12)]'
      : tone === 'amber'
      ? 'border-amber-400/20 bg-amber-500/[0.06] text-amber-200 shadow-[0_0_0_1px_rgba(251,191,36,0.10)]'
      : tone === 'sky'
      ? 'border-sky-400/25 bg-sky-500/10 text-sky-200 shadow-[0_0_0_1px_rgba(56,189,248,0.10)]'
      : 'border-white/10 bg-white/[0.03] text-slate-200 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]';

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

  return <p className="mt-2 text-xs text-slate-400">Use the wallet button in the top bar to connect.</p>;
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

/**
 * Reduced motion hook (safe with older Safari)
 */
function useReducedMotionPref() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const m = window.matchMedia('(prefers-reduced-motion: reduce)');

    const apply = (matches?: boolean | null) => {
      setReduced(Boolean(matches ?? m.matches));
    };

    const handler = (e: MediaQueryListEvent) => apply(e.matches);

    apply(m.matches);

    if (typeof m.addEventListener === 'function') {
      m.addEventListener('change', handler);
      return () => m.removeEventListener('change', handler);
    }

    // eslint-disable-next-line deprecation/deprecation
    m.addListener(handler);
    // eslint-disable-next-line deprecation/deprecation
    return () => m.removeListener(handler);
  }, []);

  return reduced;
}

// ─────────────────────────────────────────────
// HARD SCROLL-LOCK FIX (dashboard only)
// ─────────────────────────────────────────────

function unlockScroll() {
  try {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────
// Luxe shell pieces
// ─────────────────────────────────────────────

function LuxeCard({
  children,
  className = '',
  accent = 'violet',
}: {
  children: React.ReactNode;
  className?: string;
  accent?: 'violet' | 'gold' | 'emerald' | 'sky' | 'neutral';
}) {
  const ring =
    accent === 'gold'
      ? 'ring-amber-300/10'
      : accent === 'emerald'
      ? 'ring-emerald-400/10'
      : accent === 'sky'
      ? 'ring-sky-400/10'
      : accent === 'neutral'
      ? 'ring-white/10'
      : 'ring-violet-400/10';

  const glow =
    accent === 'gold'
      ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.18),transparent_55%),radial-gradient(circle_at_85%_40%,rgba(56,189,248,0.10),transparent_60%),radial-gradient(circle_at_40%_100%,rgba(236,72,153,0.08),transparent_62%)]'
      : accent === 'emerald'
      ? 'bg-[radial-gradient(circle_at_18%_30%,rgba(16,185,129,0.18),transparent_55%),radial-gradient(circle_at_78%_18%,rgba(56,189,248,0.10),transparent_58%),radial-gradient(circle_at_50%_100%,rgba(236,72,153,0.06),transparent_62%)]'
      : accent === 'sky'
      ? 'bg-[radial-gradient(circle_at_20%_25%,rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_80%_35%,rgba(99,102,241,0.10),transparent_60%),radial-gradient(circle_at_45%_100%,rgba(236,72,153,0.06),transparent_62%)]'
      : 'bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.18),transparent_55%),radial-gradient(circle_at_80%_35%,rgba(56,189,248,0.10),transparent_60%),radial-gradient(circle_at_45%_100%,rgba(236,72,153,0.06),transparent_62%)]';

  return (
    <div
      className={[
        'relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/40 shadow-[0_40px_140px_rgba(0,0,0,0.55)] ring-1 backdrop-blur-xl',
        ring,
        className,
      ].join(' ')}
    >
      <div className={['pointer-events-none absolute -inset-24 opacity-80 blur-3xl', glow].join(' ')} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.10] [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="pointer-events-none absolute inset-0 xpot-luxe-border" />
      <div className="relative p-5">{children}</div>
    </div>
  );
}

function LuxeTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-100">{title}</p>
        {subtitle ? <p className="mt-1 text-xs text-slate-300/70">{subtitle}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function TinyRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400/80">{label}</p>
      <div className={mono ? 'font-mono text-sm text-slate-100' : 'text-sm font-semibold text-slate-100'}>
        {value}
      </div>
    </div>
  );
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
  const reduced = useReducedMotionPref();

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
          0% {
            transform: translateX(-140%) rotate(12deg);
            opacity: 0;
          }
          10% {
            opacity: 0.35;
          }
          55% {
            opacity: 0.14;
          }
          100% {
            transform: translateX(160%) rotate(12deg);
            opacity: 0;
          }
        }
        @keyframes xpotStampIn {
          0% {
            transform: scale(1.2) rotate(-6deg);
            opacity: 0;
            filter: blur(2px);
          }
          55% {
            transform: scale(0.98) rotate(2deg);
            opacity: 1;
            filter: blur(0px);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        .xpot-ceremony-sweep::before {
          content: '';
          position: absolute;
          top: -55%;
          left: -60%;
          width: 55%;
          height: 240%;
          opacity: 0;
          transform: rotate(12deg);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.12),
            rgba(56, 189, 248, 0.12),
            rgba(16, 185, 129, 0.1),
            transparent
          );
          animation: xpotCeremonySweep 1.6s ease-in-out infinite;
          mix-blend-mode: screen;
          pointer-events: none;
        }
      `}</style>

      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 shadow-[0_40px_140px_rgba(0,0,0,0.75)] backdrop-blur-xl">
        <div className="xpot-ceremony-sweep absolute inset-0" />
        <div className="pointer-events-none absolute -inset-24 opacity-70 blur-3xl bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.22),transparent_60%),radial-gradient(circle_at_80%_35%,rgba(56,189,248,0.14),transparent_62%),radial-gradient(circle_at_50%_100%,rgba(251,191,36,0.10),transparent_62%)]" />

        <div className="relative p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-300/80">
              Entry issued
            </span>
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

          <p className="mt-4 text-center text-xs text-slate-300/70">
            Your daily entry is live. Come back after draw time for proof.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Types + defensive normalizers
// ─────────────────────────────────────────────

type EntryStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';
type XpotBalanceState = number | 'error' | null;

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

function normalizeStatus(s: any): EntryStatus {
  const v = typeof s === 'string' ? s : '';
  const lower = v.toLowerCase();

  if (lower === 'in-draw' || lower === 'in_draw' || lower === 'open') return 'in-draw';
  if (lower === 'won' || lower === 'winner') return 'won';
  if (lower === 'claimed') return 'claimed';
  if (lower === 'expired') return 'expired';
  if (lower === 'not-picked' || lower === 'not_picked' || lower === 'lost') return 'not-picked';

  return 'in-draw';
}

function normalizeEntry(raw: any): Entry | null {
  if (!raw || typeof raw !== 'object') return null;

  const id = typeof raw.id === 'string' ? raw.id : '';
  const code = typeof raw.code === 'string' ? raw.code : '';
  const walletAddress = typeof raw.walletAddress === 'string' ? raw.walletAddress : '';

  const createdAt =
    typeof raw.createdAt === 'string'
      ? raw.createdAt
      : typeof raw.created_at === 'string'
      ? raw.created_at
      : new Date().toISOString();

  if (!id || !code || !walletAddress) return null;

  return {
    id,
    code,
    status: normalizeStatus(raw.status),
    label: typeof raw.label === 'string' ? raw.label : '',
    jackpotUsd: raw.jackpotUsd ?? raw.jackpot_usd ?? 0,
    createdAt,
    walletAddress,
  };
}

function safeStatusLabel(status: any) {
  return String(status ?? '').replace(/_/g, '-').replace('-', ' ');
}

// ─────────────────────────────────────────────
// Page (CLIENT) - NO provider wrapper here
// Providers live in app/providers.tsx
// ─────────────────────────────────────────────

export default function DashboardClient() {
  return <DashboardInner />;
}

// ─────────────────────────────────────────────
// Inner page
// ─────────────────────────────────────────────

function DashboardInner() {
  // ✅ scroll unlock on mount + on unmount (dashboard only)
  useEffect(() => {
    unlockScroll();
    return () => unlockScroll();
  }, []);

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

  const [xpotBalance, setXpotBalance] = useState<XpotBalanceState>(null);
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

  const [streak, setStreak] = useState<Streak>({ days: 0, todayDone: false });
  const [mission, setMission] = useState<Mission>({
    title: 'Loading…',
    desc: 'Preparing today’s mission.',
  });

  // ✅ NEW: toggle between account-wide vs connected-wallet-only display
  const [entriesScope, setEntriesScope] = useState<'account' | 'wallet'>('account');

  // Validate mint once (no side effects, just avoids crashes if TOKEN_MINT is wrong)
  useMemo(() => {
    try {
      // eslint-disable-next-line no-new
      new PublicKey(TOKEN_MINT);
    } catch {
      // ignore
    }
  }, []);

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
    const tick = () => {
      const cutoffUtc = nextMadridCutoffUtcMs(new Date());
      const ms = cutoffUtc - Date.now();
      setCountdown(formatCountdown(ms));
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, []);

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

  const fetchTicketsToday = useCallback(async () => {
    const res = await fetch('/api/tickets/today', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load tickets');
    const data = await res.json().catch(() => ({} as any));
    const raw: any[] = Array.isArray((data as any).tickets) ? (data as any).tickets : [];
    return raw.map(normalizeEntry).filter(Boolean) as Entry[];
  }, []);

  const fetchXpotBalance = useCallback(async (address: string): Promise<number | null> => {
    try {
      const res = await fetch(`/api/xpot-balance?address=${encodeURIComponent(address)}`, { cache: 'no-store' });
      if (!res.ok) return null;
      const json = await res.json().catch(() => null);
      return json && typeof json.balance === 'number' ? json.balance : null;
    } catch {
      return null;
    }
  }, []);

  const fetchHistory = useCallback(async (address: string) => {
    const res = await fetch(`/api/tickets/history?wallet=${encodeURIComponent(address)}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load history');
    const data = await res.json().catch(() => ({} as any));
    const raw: any[] = Array.isArray((data as any).tickets) ? (data as any).tickets : [];
    return raw.map(normalizeEntry).filter(Boolean) as Entry[];
  }, []);

  const fetchRecentWinners = useCallback(async () => {
    const res = await fetch('/api/winners/recent?limit=5', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load recent winners');
    const data = await res.json().catch(() => ({} as any));

    const winners: RecentWinner[] = Array.isArray((data as any).winners)
      ? (data as any).winners.map((w: any) => ({
          id: String(w?.id ?? ''),
          drawDate: String(w?.drawDate ?? ''),
          ticketCode: String(w?.ticketCode ?? ''),
          jackpotUsd: Number(w?.jackpotUsd ?? 0),
          walletAddress: String(w?.walletAddress ?? ''),
          handle: w?.handle ?? null,
        }))
      : [];

    return winners.filter(w => w.id && w.ticketCode);
  }, []);

  const lastBalanceFetchAtRef = useRef<number>(0);
  const BALANCE_MIN_INTERVAL_MS = 30_000;

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
          setLoadingWinners(true);
          setWinnersError(null);
        }

        const [nextTickets, nextWinners] = await Promise.all([fetchTicketsToday(), fetchRecentWinners()]);
        setEntries(nextTickets);
        setRecentWinners(nextWinners);

        if (walletConnected && addr) {
          const now = Date.now();
          const shouldFetchBalance = reason !== 'poll' || now - lastBalanceFetchAtRef.current > BALANCE_MIN_INTERVAL_MS;

          if (shouldFetchBalance) {
            try {
              setXpotBalance(null);
              const b = await fetchXpotBalance(addr);
              if (typeof b === 'number') setXpotBalance(b);
              else setXpotBalance('error');
              lastBalanceFetchAtRef.current = now;
            } catch (e) {
              console.error('[XPOT] balance fetch failed', e);
              setXpotBalance('error');
              lastBalanceFetchAtRef.current = now;
            }
          }

          try {
            if (reason === 'initial') setLoadingHistory(true);
            setHistoryError(null);
            const h = await fetchHistory(addr);
            setHistoryEntries(h);
          } catch (e) {
            console.error('[XPOT] history fetch failed', e);
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
          lastBalanceFetchAtRef.current = 0;
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
    [isAuthedEnough, publicKey, walletConnected, fetchTicketsToday, fetchRecentWinners, fetchXpotBalance, fetchHistory],
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

  useEffect(() => {
    if (!currentWalletAddress) {
      setTicketClaimed(false);
      setTodaysTicket(null);
      return;
    }

    const myTicket = entries.find(
      t => t.walletAddress === currentWalletAddress && normalizeStatus(t.status) === 'in-draw',
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
          case 'NOT_ENOUGH_XPOT': {
            const required = typeof data.required === 'number' ? data.required : REQUIRED_XPOT;
            const bal = typeof data.balance === 'number' ? data.balance : null;

            setClaimError(
              bal === null
                ? `You need at least ${required.toLocaleString()} XPOT to claim today’s entry. We could not read your wallet balance right now.`
                : `You need at least ${required.toLocaleString()} XPOT to claim today’s entry. Your wallet currently has ${bal.toLocaleString()} XPOT.`,
            );
            break;
          }
          case 'XPOT_CHECK_FAILED':
            setClaimError('We could not verify your XPOT balance right now. Please try again in a moment.');
            break;
          case 'NO_OPEN_DRAW':
            setClaimError('Today’s draw is not open yet. Please refresh and try again in a moment.');
            break;
          case 'MISSING_WALLET':
          case 'INVALID_BODY':
            setClaimError('We could not read your wallet address. Please reconnect your wallet and try again.');
            break;
          default:
            setClaimError('Entry request failed. Please try again.');
        }

        console.error('Claim failed', res.status, text);
        return;
      }

      const ticket = normalizeEntry(data.ticket) || null;
      const ticketsRaw: any[] = Array.isArray(data.tickets) ? data.tickets : [];
      const tickets = ticketsRaw.map(normalizeEntry).filter(Boolean) as Entry[];

      if (tickets.length > 0) {
        setEntries(tickets);
      } else if (ticket) {
        setEntries(prev => {
          const others = prev.filter(t => t.id !== ticket.id);
          return [ticket, ...others];
        });
      } else {
        await refreshAll('manual');
        return;
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

  // Wallet-only tickets (used by history + wallet-specific display)
  const myTickets: Entry[] = useMemo(() => {
    if (!normalizedWallet) return [];
    return entries
      .filter(e => e.walletAddress?.toLowerCase() === normalizedWallet)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [entries, normalizedWallet]);

  // ✅ NEW: account-wide grouping (today)
  const accountGroups = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of entries) {
      const w = (e.walletAddress || '').toLowerCase();
      if (!w) continue;
      if (!map.has(w)) map.set(w, []);
      map.get(w)!.push(e);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      map.set(k, arr);
    }
    const wallets = Array.from(map.keys());

    // Sort: connected wallet first, then by ticket count desc
    wallets.sort((a, b) => {
      const aIsCur = normalizedWallet && a === normalizedWallet ? 1 : 0;
      const bIsCur = normalizedWallet && b === normalizedWallet ? 1 : 0;
      if (aIsCur !== bIsCur) return bIsCur - aIsCur;
      return (map.get(b)?.length ?? 0) - (map.get(a)?.length ?? 0);
    });

    return wallets.map(w => ({
      walletLower: w,
      walletAddress: map.get(w)?.[0]?.walletAddress ?? w,
      tickets: map.get(w) ?? [],
    }));
  }, [entries, normalizedWallet]);

  const accountTicketsCount = entries.length;
  const walletsEnteredCount = accountGroups.length;

  const winner = entries.find(e => normalizeStatus(e.status) === 'won') || null;
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

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // ✅ unlock scroll if lock overlay shows/hides or ceremony shows/hides
  useEffect(() => {
    if (!showLock && !showCeremony) unlockScroll();
  }, [showLock, showCeremony]);

  return (
    <>
      <style jsx global>{`
        .xpot-luxe-border {
          background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0)) 0
              0 / 200% 1px no-repeat,
            linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0)) 0 0 /
              1px 200% no-repeat;
          mask-image: radial-gradient(circle at 22% 18%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0.2) 55%, rgba(0, 0, 0, 0)
            78%);
          opacity: 0.9;
          animation: xpotLuxeBorder 10s ease-in-out infinite;
        }
        @keyframes xpotLuxeBorder {
          0% {
            background-position: 0% 0%, 0% 0%;
            opacity: 0.65;
          }
          50% {
            background-position: 100% 0%, 0% 100%;
            opacity: 0.95;
          }
          100% {
            background-position: 0% 0%, 0% 0%;
            opacity: 0.65;
          }
        }
        @keyframes xpotFloat {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3px);
          }
          100% {
            transform: translateY(0px);
          }
        }
        @keyframes xpotSweep {
          0% {
            transform: translateX(-140%) rotate(10deg);
            opacity: 0;
          }
          12% {
            opacity: 0.26;
          }
          55% {
            opacity: 0.1;
          }
          100% {
            transform: translateX(160%) rotate(10deg);
            opacity: 0;
          }
        }
        .xpot-hero-sweep::before {
          content: '';
          position: absolute;
          top: -55%;
          left: -60%;
          width: 55%;
          height: 240%;
          opacity: 0;
          transform: rotate(10deg);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            rgba(56, 189, 248, 0.1),
            rgba(251, 191, 36, 0.1),
            transparent
          );
          animation: xpotSweep 2.8s ease-in-out infinite;
          mix-blend-mode: screen;
          pointer-events: none;
        }
        @keyframes xpotBtnSheen {
          0% {
            transform: translateX(-140%) rotate(12deg);
            opacity: 0;
          }
          12% {
            opacity: 0.22;
          }
          60% {
            opacity: 0.1;
          }
          100% {
            transform: translateX(160%) rotate(12deg);
            opacity: 0;
          }
        }
        .xpot-btn-sheen::before {
          content: '';
          position: absolute;
          top: -70%;
          left: -60%;
          width: 55%;
          height: 260%;
          transform: rotate(12deg);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.22),
            rgba(255, 255, 255, 0.08),
            transparent
          );
          animation: xpotBtnSheen 3.8s ease-in-out infinite;
          mix-blend-mode: overlay;
          pointer-events: none;
        }
      `}</style>

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
          {/* HERO */}
          <section className="mt-6">
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/35 shadow-[0_50px_160px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-2xl">
              <div className="xpot-hero-sweep absolute inset-0" />
              <div className="pointer-events-none absolute -inset-28 opacity-90 blur-3xl bg-[radial-gradient(circle_at_18%_22%,rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_72%_28%,rgba(99,102,241,0.14),transparent_58%),radial-gradient(circle_at_40%_100%,rgba(251,191,36,0.10),transparent_65%),radial-gradient(circle_at_90%_85%,rgba(236,72,153,0.08),transparent_62%)]" />
              <div className="pointer-events-none absolute inset-0 opacity-[0.09] [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:22px_22px]" />

              <div className="relative p-6 sm:p-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatar}
                        alt={name}
                        className="h-12 w-12 rounded-full border border-white/10 object-cover shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
                        style={{ animation: 'xpotFloat 6s ease-in-out infinite' }}
                      />
                    ) : (
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-slate-100"
                        style={{ animation: 'xpotFloat 6s ease-in-out infinite' }}
                      >
                        {initialFromHandle(handle)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300/70">
                        {greeting}
                      </p>
                      <p className="mt-1 truncate text-xl font-semibold text-slate-100">
                        {handle ? `@${handle.replace(/^@/, '')}` : name}
                      </p>

                      {/* ✅ clearer explanation */}
                      <p className="mt-1 text-xs text-slate-300/70">
                        Your XPOT account can link multiple wallets. Tickets are issued per wallet and shown below by wallet.
                      </p>

                      <WalletStatusHint />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:w-[560px]">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300/70">Next draw in</p>
                      <p className="mt-1 font-mono text-lg text-slate-100">{countdown}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-400/70">
                        22:00 Madrid cutoff
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300/70">Cabin sync</p>
                      <p className="mt-1 text-sm font-semibold text-slate-100">
                        {lastSyncedAt ? (
                          <span key={syncPulse} className="inline-flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                            {new Date(lastSyncedAt).toLocaleTimeString('de-DE')}
                          </span>
                        ) : (
                          'Syncing…'
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300/70">Status</p>
                      <div className="mt-2 flex items-center gap-2">
                        <StatusPill tone={ticketClaimed ? 'emerald' : 'amber'}>
                          <Radio className="h-3.5 w-3.5" />
                          {ticketClaimed ? 'Entry live' : 'Pending'}
                        </StatusPill>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-3">
                  <TinyRow
                    label="Connected wallet"
                    value={currentWalletAddress ? shortWallet(currentWalletAddress) : 'Not connected'}
                    mono
                  />
                  <TinyRow
                    label="XPOT balance"
                    value={
                      xpotBalance === null
                        ? 'Checking…'
                        : xpotBalance === 'error'
                        ? 'Unavailable'
                        : `${Math.floor(xpotBalance).toLocaleString()} XPOT`
                    }
                  />
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300/70">Eligibility</p>
                      <div className="mt-2">
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
                          <StatusPill tone="slate">-</StatusPill>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300/70">Minimum</p>
                      <p className="mt-1 text-xs text-slate-100">
                        <GoldAmount value={REQUIRED_XPOT.toLocaleString()} suffix="XPOT" size="sm" />
                      </p>
                    </div>
                  </div>
                </div>

                {/* ✅ NEW: account-wide quick stats (premium + obvious) */}
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300/70">Account entries today</p>
                    <div className="mt-2 flex items-center gap-2">
                      <StatusPill tone="sky">
                        <Ticket className="h-3.5 w-3.5" />
                        {accountTicketsCount} ticket{accountTicketsCount === 1 ? '' : 's'}
                      </StatusPill>
                      <StatusPill tone="slate">
                        <Wallet className="h-3.5 w-3.5" />
                        {walletsEnteredCount} wallet{walletsEnteredCount === 1 ? '' : 's'}
                      </StatusPill>
                    </div>
                    <p className="mt-2 text-xs text-slate-300/70">
                      Each connected wallet can claim its own entry when eligible.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300/70">View mode</p>
                    <div className="mt-2 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
                      <button
                        type="button"
                        onClick={() => setEntriesScope('account')}
                        className={[
                          'rounded-full px-4 py-2 text-xs font-semibold transition',
                          entriesScope === 'account'
                            ? 'bg-white/[0.08] text-slate-100'
                            : 'text-slate-300/70 hover:text-slate-200',
                        ].join(' ')}
                      >
                        Account
                      </button>
                      <button
                        type="button"
                        onClick={() => setEntriesScope('wallet')}
                        disabled={!walletConnected}
                        className={[
                          'rounded-full px-4 py-2 text-xs font-semibold transition disabled:opacity-50',
                          entriesScope === 'wallet'
                            ? 'bg-white/[0.08] text-slate-100'
                            : 'text-slate-300/70 hover:text-slate-200',
                        ].join(' ')}
                        title={!walletConnected ? 'Connect a wallet to filter' : 'Show only the connected wallet'}
                      >
                        This wallet
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-300/70">
                      Account shows all tickets. Wallet shows only the connected wallet.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-xs text-slate-300/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400/80" />
                    Ticket allocation is wallet-level.
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
                </div>
              </div>
            </div>
          </section>

          {/* MAIN GRID */}
          <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            {/* LEFT */}
            <div className="space-y-6">
              <LuxeCard accent="gold">
                <LuxeTitle
                  title="Today’s XPOT"
                  subtitle="Claim a free entry when your connected wallet meets the minimum."
                  right={
                    <StatusPill tone={ticketClaimed ? 'emerald' : 'slate'}>
                      <Ticket className="h-3.5 w-3.5" />
                      {ticketClaimed ? 'Entry active' : 'Not claimed'}
                    </StatusPill>
                  }
                />

                {!walletConnected && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-300/70">
                    Connect your wallet using the top bar to check eligibility and claim today’s entry.
                  </div>
                )}

                {walletConnected && !ticketClaimed && (
                  <>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300/70">Requirement</p>
                        <p className="mt-1 text-sm font-semibold text-slate-100">
                          <GoldAmount value={REQUIRED_XPOT.toLocaleString()} suffix="XPOT" size="sm" />
                        </p>
                        <p className="mt-1 text-xs text-slate-300/70">Held in the wallet you connect.</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300/70">Your status</p>
                        <div className="mt-2">
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
                            <StatusPill tone="slate">-</StatusPill>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-slate-300/70">Eligibility is checked on refresh.</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        onClick={handleClaimTicket}
                        disabled={!walletConnected || !hasRequiredXpot || claiming}
                        className={`${BTN_PRIMARY} xpot-btn-sheen`}
                      >
                        {claiming ? 'Generating…' : 'Claim today’s entry'}
                      </button>

                      <div className="text-xs text-slate-300/70">Draw locks at 22:00 Madrid. Come back for proof.</div>
                    </div>

                    {claimError && <p className="mt-3 text-xs xpot-gold-text">{claimError}</p>}

                    {typeof xpotBalance === 'number' && !hasRequiredXpot && (
                      <p className="mt-3 text-xs text-slate-300/70">
                        Your wallet is below the minimum. You need{' '}
                        <span className="font-semibold text-slate-100">{REQUIRED_XPOT.toLocaleString()} XPOT</span> to
                        claim today’s entry.
                      </p>
                    )}
                  </>
                )}

                {walletConnected && ticketClaimed && todaysTicket && (
                  <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-300/70">Your ticket code</p>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
                        <Ticket className="h-5 w-5 text-amber-200" />
                        <p className="font-mono text-base text-slate-100">{todaysTicket.code}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyCode(todaysTicket)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-200 hover:bg-white/[0.06]"
                      >
                        <Copy className="h-4 w-4" />
                        {copiedId === todaysTicket.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <TinyRow label="Status" value={<span className="font-semibold text-slate-100">IN DRAW</span>} />
                      <TinyRow
                        label="Issued"
                        value={<span className="text-slate-100">{formatDateTime(todaysTicket.createdAt)}</span>}
                      />
                    </div>

                    {/* ✅ NEW: show which wallet issued it */}
                    <div className="mt-3">
                      <TinyRow label="Wallet" value={shortWallet(todaysTicket.walletAddress)} mono />
                    </div>
                  </div>
                )}

                {walletConnected && ticketClaimed && !todaysTicket && (
                  <p className="mt-4 text-xs text-slate-300/70">
                    Your wallet has an entry today, but it hasn’t loaded yet. Refresh the page.
                  </p>
                )}

                {iWonToday && (
                  <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    You won today’s XPOT. Check your wallet and the winners feed.
                  </div>
                )}
              </LuxeCard>

              {/* ✅ REPLACED: wallet-only box -> premium account-wide box with grouping + wallet filter */}
              <LuxeCard accent="sky">
                <LuxeTitle
                  title={entriesScope === 'wallet' ? 'Your entries today (this wallet)' : 'Your entries today (account)'}
                  subtitle={
                    entriesScope === 'wallet'
                      ? 'Only tickets issued by the currently connected wallet.'
                      : 'All tickets issued under your XPOT account, grouped by wallet.'
                  }
                  right={
                    <StatusPill tone="sky">
                      <Ticket className="h-3.5 w-3.5" />
                      {entriesScope === 'wallet' ? myTickets.length : accountTicketsCount}
                    </StatusPill>
                  }
                />

                <div className="mt-4 space-y-2">
                  {loadingTickets ? (
                    <p className="text-xs text-slate-300/70">Loading…</p>
                  ) : ticketsError ? (
                    <p className="text-xs xpot-gold-text">{ticketsError}</p>
                  ) : entriesScope === 'wallet' ? (
                    !walletConnected ? (
                      <p className="text-xs text-slate-300/70">Connect a wallet to view wallet-only entries.</p>
                    ) : myTickets.length === 0 ? (
                      <p className="text-xs text-slate-300/70">No entries for this wallet yet.</p>
                    ) : (
                      myTickets.map(t => (
                        <div key={t.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-mono text-sm text-slate-100">{t.code}</p>
                            <StatusPill
                              tone={
                                normalizeStatus(t.status) === 'in-draw'
                                  ? 'emerald'
                                  : normalizeStatus(t.status) === 'won'
                                  ? 'sky'
                                  : 'slate'
                              }
                            >
                              {safeStatusLabel(t.status)}
                            </StatusPill>
                          </div>
                          <p className="mt-1 text-xs text-slate-300/70">Issued {formatDateTime(t.createdAt)}</p>
                        </div>
                      ))
                    )
                  ) : accountGroups.length === 0 ? (
                    <p className="text-xs text-slate-300/70">No entries yet today.</p>
                  ) : (
                    accountGroups.map(group => {
                      const isCurrent = !!normalizedWallet && group.walletLower === normalizedWallet;
                      return (
                        <div key={group.walletLower} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <StatusPill tone={isCurrent ? 'emerald' : 'slate'}>
                                <Wallet className="h-3.5 w-3.5" />
                                {shortWallet(group.walletAddress)}
                              </StatusPill>
                              {isCurrent ? (
                                <StatusPill tone="emerald">
                                  <Radio className="h-3.5 w-3.5" />
                                  Connected
                                </StatusPill>
                              ) : null}
                            </div>

                            <StatusPill tone="sky">
                              <Ticket className="h-3.5 w-3.5" />
                              {group.tickets.length}
                            </StatusPill>
                          </div>

                          <div className="mt-3 space-y-2">
                            {group.tickets.map(t => (
                              <div
                                key={t.id}
                                className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <p className="truncate font-mono text-sm text-slate-100">{t.code}</p>
                                  <StatusPill
                                    tone={
                                      normalizeStatus(t.status) === 'in-draw'
                                        ? 'emerald'
                                        : normalizeStatus(t.status) === 'won'
                                        ? 'sky'
                                        : 'slate'
                                    }
                                  >
                                    {safeStatusLabel(t.status)}
                                  </StatusPill>
                                </div>
                                <p className="mt-1 text-xs text-slate-300/70">Issued {formatDateTime(t.createdAt)}</p>

                                <div className="mt-2 flex items-center justify-between gap-2">
                                  <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400/80">
                                    Wallet
                                  </span>
                                  <span className="font-mono text-xs text-slate-200">{shortWallet(t.walletAddress)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* quick CTA to teach behaviour */}
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-300/70">
                  Tip: Connect another wallet and claim again to increase your ticket count for today.
                </div>
              </LuxeCard>
            </div>

            {/* RIGHT */}
            <div className="space-y-6">
              <LuxeCard accent="violet">
                <LuxeTitle
                  title="Today’s mission"
                  subtitle="A calm daily nudge, not a casino loop."
                  right={
                    <StatusPill tone="sky">
                      <Target className="h-3.5 w-3.5" />
                      Daily
                    </StatusPill>
                  }
                />

                <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-semibold text-slate-100">{mission.title}</p>
                  <p className="mt-1 text-xs text-slate-300/70">{mission.desc}</p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300/70">Daily streak</p>
                    <div className="mt-2">
                      <StatusPill tone={streak.todayDone ? 'emerald' : 'amber'}>
                        <Flame className="h-3.5 w-3.5" />
                        {streak.todayDone ? 'Today done' : 'Pending'}
                      </StatusPill>
                    </div>
                    <p className="mt-2 text-xs text-slate-300/70">
                      <span className="font-semibold text-slate-100">{Math.max(0, streak.days)}</span> day streak
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300/70">Reset logic</p>
                    <p className="mt-2 text-sm font-semibold text-slate-100">UTC day rule</p>
                    <p className="mt-1 text-xs text-slate-300/70">Streak updates after you claim today’s entry.</p>
                  </div>
                </div>
              </LuxeCard>

              <LuxeCard accent="emerald">
                <LuxeTitle
                  title="Bonus XPOT"
                  subtitle="Shows automatically when a bonus drop is scheduled."
                  right={
                    bonusActive ? (
                      <StatusPill tone="emerald">
                        <Sparkles className="h-3.5 w-3.5" />
                        Active
                      </StatusPill>
                    ) : (
                      <StatusPill tone="slate">None</StatusPill>
                    )
                  }
                />

                {bonusActive && upcomingBonus ? (
                  <div className="mt-4 rounded-[24px] border border-emerald-400/18 bg-emerald-950/20 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
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
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-300/70">
                    No bonus scheduled right now.
                  </div>
                )}
              </LuxeCard>

              <LuxeCard accent="sky">
                <LuxeTitle
                  title="Recent winners"
                  subtitle="Latest completed draws across all holders."
                  right={
                    <StatusPill tone="emerald">
                      <Sparkles className="h-3.5 w-3.5" />
                      Live
                    </StatusPill>
                  }
                />

                <div className="mt-4 space-y-2">
                  {loadingWinners ? (
                    <p className="text-xs text-slate-300/70">Loading…</p>
                  ) : winnersError ? (
                    <p className="text-xs xpot-gold-text">{winnersError}</p>
                  ) : recentWinners.length === 0 ? (
                    <p className="text-xs text-slate-300/70">No completed draws yet.</p>
                  ) : (
                    recentWinners.map(w => {
                      const h = w.handle ? w.handle.replace(/^@/, '') : null;
                      return (
                        <div key={w.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-slate-300/70">{formatDate(w.drawDate)}</p>
                            {h ? (
                              <StatusPill tone="sky">
                                <X className="h-3.5 w-3.5" />
                                @{h}
                              </StatusPill>
                            ) : (
                              <StatusPill tone="slate">wallet</StatusPill>
                            )}
                          </div>

                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-slate-100">
                              {initialFromHandle(h)}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-mono text-sm text-slate-100">{w.ticketCode}</p>
                              <p className="mt-1 text-xs text-slate-300/70">
                                {h ? `@${h}` : shortWallet(w.walletAddress)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </LuxeCard>

              <LuxeCard accent="neutral">
                <LuxeTitle
                  title="Your draw history"
                  subtitle="Past entries for this wallet (wins, not-picked, expired)."
                  right={
                    <Link href="/hub/history" className={`${BTN_UTILITY} h-9 px-4 text-xs`}>
                      View all
                    </Link>
                  }
                />

                <div className="mt-4 space-y-2">
                  {!walletConnected ? (
                    <p className="text-xs text-slate-300/70">Connect your wallet in the top bar to view history.</p>
                  ) : loadingHistory ? (
                    <p className="text-xs text-slate-300/70">Loading…</p>
                  ) : historyError ? (
                    <p className="text-xs xpot-gold-text">{historyError}</p>
                  ) : historyEntries.length === 0 ? (
                    <p className="text-xs text-slate-300/70">No history yet.</p>
                  ) : (
                    historyEntries.slice(0, 5).map(t => (
                      <div key={t.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-mono text-sm text-slate-100">{t.code}</p>
                          <StatusPill
                            tone={
                              normalizeStatus(t.status) === 'won'
                                ? 'sky'
                                : normalizeStatus(t.status) === 'claimed'
                                ? 'emerald'
                                : normalizeStatus(t.status) === 'in-draw'
                                ? 'emerald'
                                : 'slate'
                            }
                          >
                            {safeStatusLabel(t.status)}
                          </StatusPill>
                        </div>
                        <p className="mt-1 text-xs text-slate-300/70">{formatDateTime(t.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              </LuxeCard>
            </div>
          </section>

          <footer className="mt-8 border-t border-white/10 pt-4 text-xs text-slate-300/60">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-slate-300/70" />
              XPOT is in Pre-Launch Mode. UI is final and wiring is live.
            </span>
          </footer>
        </XpotPageShell>
      </div>
    </>
  );
}
