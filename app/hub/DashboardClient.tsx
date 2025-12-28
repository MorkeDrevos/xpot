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
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  CalendarClock,
  ArrowDownRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Small UI helpers (darker, no white borders)
// ─────────────────────────────────────────────

const BORDER_SOFT = 'border-slate-700/35';
const BORDER_SOFTER = 'border-slate-700/25';
const SURFACE = `border ${BORDER_SOFT} bg-slate-950/55`;
const SURFACE_INNER = `border ${BORDER_SOFTER} bg-slate-950/45`;

// Added a bit more purple/violet to the primary gradient
const BTN_PRIMARY =
  'relative inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-slate-950 ' +
  'bg-[linear-gradient(90deg,rgba(251,191,36,0.92),rgba(99,102,241,0.90),rgba(56,189,248,0.86),rgba(236,72,153,0.84))] ' +
  'shadow-[0_30px_120px_rgba(0,0,0,0.62)] ring-1 ring-violet-300/18 ' +
  'transition hover:brightness-[1.05] active:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/55';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-slate-700/45 bg-slate-950/45 text-slate-200 ' +
  'hover:bg-slate-900/45 transition disabled:cursor-not-allowed disabled:opacity-40 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/35';

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

// ─────────────────────────────────────────────
// Premium pills (darker, zero "white border" look)
// ─────────────────────────────────────────────

function StatusPill({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: 'slate' | 'emerald' | 'amber' | 'sky';
}) {
  const cls =
    tone === 'emerald'
      ? [
          'border-emerald-300/22',
          'bg-[linear-gradient(180deg,rgba(16,185,129,0.18),rgba(2,6,23,0.55))]',
          'text-emerald-50',
          'shadow-[0_0_0_1px_rgba(16,185,129,0.10),0_18px_70px_rgba(16,185,129,0.10)]',
        ].join(' ')
      : tone === 'amber'
      ? [
          // premium XPOT gold (fixes PENDING looking grey)
          'border-amber-300/28',
          'bg-[linear-gradient(180deg,rgba(251,191,36,0.22),rgba(120,53,15,0.18),rgba(2,6,23,0.60))]',
          'text-amber-50',
          'shadow-[0_0_0_1px_rgba(251,191,36,0.14),0_18px_80px_rgba(251,191,36,0.12)]',
        ].join(' ')
      : tone === 'sky'
      ? [
          'border-sky-200/22',
          'bg-[linear-gradient(180deg,rgba(56,189,248,0.18),rgba(2,6,23,0.55))]',
          'text-sky-50',
          'shadow-[0_0_0_1px_rgba(56,189,248,0.10),0_18px_70px_rgba(56,189,248,0.10)]',
        ].join(' ')
      : [
          'border-slate-600/35',
          'bg-[linear-gradient(180deg,rgba(148,163,184,0.10),rgba(2,6,23,0.60))]',
          'text-slate-50',
          'shadow-[0_0_0_1px_rgba(148,163,184,0.08)]',
        ].join(' ');

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-1',
        'text-[10px] font-semibold uppercase tracking-[0.18em]',
        'backdrop-blur-md',
        // key: keep icons/text bright, not muted
        '[&_svg]:text-current',
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
      <p className="mt-2 text-xs xpot-gold-text">No Solana wallet detected. Install Phantom or Solflare to continue.</p>
    );
  }

  return <p className="mt-2 text-xs text-slate-300/70">Use the wallet button in the top bar to connect.</p>;
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
// Luxe shell pieces (darker, no white strokes)
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
      ? 'ring-emerald-300/8'
      : accent === 'sky'
      ? 'ring-sky-300/8'
      : accent === 'neutral'
      ? 'ring-slate-500/10'
      : 'ring-violet-300/10';

  const glow =
    accent === 'gold'
      ? 'bg-[radial-gradient(circle_at_18%_18%,rgba(251,191,36,0.14),transparent_60%),radial-gradient(circle_at_85%_40%,rgba(99,102,241,0.10),transparent_64%),radial-gradient(circle_at_45%_100%,rgba(236,72,153,0.06),transparent_66%)]'
      : accent === 'emerald'
      ? 'bg-[radial-gradient(circle_at_18%_30%,rgba(16,185,129,0.12),transparent_60%),radial-gradient(circle_at_78%_18%,rgba(99,102,241,0.10),transparent_64%),radial-gradient(circle_at_50%_100%,rgba(236,72,153,0.05),transparent_66%)]'
      : accent === 'sky'
      ? 'bg-[radial-gradient(circle_at_20%_25%,rgba(56,189,248,0.12),transparent_60%),radial-gradient(circle_at_80%_35%,rgba(99,102,241,0.12),transparent_64%),radial-gradient(circle_at_45%_100%,rgba(236,72,153,0.06),transparent_66%)]'
      : 'bg-[radial-gradient(circle_at_18%_18%,rgba(99,102,241,0.14),transparent_60%),radial-gradient(circle_at_82%_35%,rgba(56,189,248,0.08),transparent_64%),radial-gradient(circle_at_45%_100%,rgba(236,72,153,0.06),transparent_66%)]';

  return (
    <div
      className={[
        `relative overflow-hidden rounded-[28px] border ${BORDER_SOFT} bg-slate-950/65 shadow-[0_40px_150px_rgba(0,0,0,0.70)] ring-1 backdrop-blur-xl`,
        ring,
        className,
      ].join(' ')}
    >
      <div className={['pointer-events-none absolute -inset-24 opacity-85 blur-3xl', glow].join(' ')} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(rgba(255,255,255,0.55)_1px,transparent_1px)] [background-size:18px_18px]" />
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
        {subtitle ? <p className="mt-1 text-xs text-slate-300/75">{subtitle}</p> : null}
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
    <div className={`flex items-center justify-between gap-3 rounded-2xl ${SURFACE_INNER} px-4 py-3`}>
      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-300/65">{label}</p>
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
            opacity: 0.28;
          }
          55% {
            opacity: 0.12;
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
            rgba(255, 255, 255, 0.08),
            rgba(99, 102, 241, 0.12),
            rgba(56, 189, 248, 0.10),
            rgba(16, 185, 129, 0.08),
            transparent
          );
          animation: xpotCeremonySweep 1.6s ease-in-out infinite;
          mix-blend-mode: screen;
          pointer-events: none;
        }
      `}</style>

      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`relative w-full max-w-md overflow-hidden rounded-[28px] border ${BORDER_SOFT} bg-slate-950/85 shadow-[0_40px_160px_rgba(0,0,0,0.80)] backdrop-blur-xl`}
      >
        <div className="xpot-ceremony-sweep absolute inset-0" />
        <div className="pointer-events-none absolute -inset-24 opacity-65 blur-3xl bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.18),transparent_62%),radial-gradient(circle_at_80%_35%,rgba(56,189,248,0.12),transparent_64%),radial-gradient(circle_at_50%_100%,rgba(251,191,36,0.08),transparent_66%)]" />

        <div className="relative p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-200/80">Entry issued</span>
            <StatusPill tone="emerald">
              <Radio className="h-3.5 w-3.5" />
              LIVE
            </StatusPill>
          </div>

          <div className="mt-4">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/14 bg-emerald-950/30 px-4 py-3">
              <Ticket className="h-5 w-5 text-emerald-100" />
              <span className="font-mono text-base text-slate-100">{code}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center">
            <div
              className="rounded-2xl border border-slate-700/35 bg-slate-950/45 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-100"
              style={{ animation: reduced ? 'none' : 'xpotStampIn 420ms ease-out both' }}
            >
              STAMPED IN
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-slate-200/75">
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
// Bonus: premium reminder download (ICS)
// ─────────────────────────────────────────────

function makeIcsForCutoff(nextCutoffUtcMs: number) {
  const start = new Date(nextCutoffUtcMs);
  const end = new Date(nextCutoffUtcMs + 15 * 60_000);

  const toIcs = (d: Date) => {
    // YYYYMMDDTHHMMSSZ
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const da = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    const ss = String(d.getUTCSeconds()).padStart(2, '0');
    return `${y}${m}${da}T${hh}${mm}${ss}Z`;
  };

  const uid = `xpot-cutoff-${toIcs(start)}@xpot`;
  const now = toIcs(new Date());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//XPOT//Dashboard//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcs(start)}`,
    `DTEND:${toIcs(end)}`,
    'SUMMARY:XPOT draw cutoff (22:00 Madrid)',
    'DESCRIPTION:Last call to claim today’s entry and verify wallet eligibility.',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

function downloadTextFile(filename: string, content: string, mime = 'text/plain') {
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    // ignore
  }
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
  // scroll unlock on mount + on unmount (dashboard only)
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

  // scope: account vs connected-wallet only
  const [entriesScope, setEntriesScope] = useState<'account' | 'wallet'>('account');

  // RIGHT monitor: CLOSED by default on arrival
  const [monitorOpen, setMonitorOpen] = useState(false);

  // one-time purple flash key (forces re-mount to replay animation)
  const [monitorFlashKey, setMonitorFlashKey] = useState(0);

  // refs for clean "jump" actions
  const entriesSectionRef = useRef<HTMLDivElement | null>(null);
  const claimSectionRef = useRef<HTMLDivElement | null>(null);

  // Highlight pulse on the entries card after auto-scroll (premium "confirmation")
  const [entriesHighlightPulse, setEntriesHighlightPulse] = useState(0);
  const reducedMotion = useReducedMotionPref();

  // Scroll behavior: your previous scroll landed too high.
  // Fix: use an offset scroll (accounts for sticky top bar) + a "block: start" feel without cutting the header.
  const SCROLL_OFFSET_PX = 120;

  const scrollToRef = useCallback(
    (ref: React.RefObject<HTMLElement>, opts?: { offsetPx?: number; highlight?: boolean }) => {
      const el = ref.current;
      if (!el) return;

      const offsetPx = opts?.offsetPx ?? SCROLL_OFFSET_PX;
      const highlight = opts?.highlight ?? false;

      // Measure and scroll with offset (more reliable than scrollIntoView for sticky headers)
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY - offsetPx;

      window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'auto' : 'smooth' });

      if (highlight) {
        // Pulse the card shortly after scroll starts/ends
        window.setTimeout(() => setEntriesHighlightPulse(p => p + 1), reducedMotion ? 0 : 220);
      }
    },
    [reducedMotion],
  );

  // Set scope + auto-jump to the "Your entries today" section so the user sees the change
  const setScopeAndJump = useCallback(
    (scope: 'account' | 'wallet') => {
      setEntriesScope(scope);
      // Wait a tick so React can commit state and the UI is in sync when scrolling
      window.setTimeout(() => {
        scrollToRef(entriesSectionRef as any, { offsetPx: 132, highlight: true });
      }, 60);
    },
    [scrollToRef],
  );

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

  // Initial load + polling
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

  // Wallet change / disconnect: force a manual refresh immediately
  // This makes the dashboard feel "truthy" as you rotate wallets.
  const prevWalletAddrRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isAuthedEnough) return;

    const prev = prevWalletAddrRef.current;
    const next = currentWalletAddress;

    if (prev === next) return;

    prevWalletAddrRef.current = next;

    // reset wallet-scoped UI quickly
    setTicketClaimed(false);
    setTodaysTicket(null);
    setClaimError(null);
    setCopiedId(null);

    // If switching away from wallet mode and no wallet is connected, keep the scope on account
    if (!next && entriesScope === 'wallet') setEntriesScope('account');

    // Force refresh so balance/history/tickets reconcile instantly
    window.setTimeout(() => {
      refreshAll('manual');
    }, 120);
  }, [currentWalletAddress, isAuthedEnough, refreshAll, entriesScope]);

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

      // After a successful claim, bring them to the entries card and highlight it
      window.setTimeout(() => {
        scrollToRef(entriesSectionRef as any, { offsetPx: 132, highlight: true });
      }, 240);
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

  // Account-wide grouping (today)
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

  // unlock scroll if lock overlay shows/hides or ceremony shows/hides
  useEffect(() => {
    if (!showLock && !showCeremony) unlockScroll();
  }, [showLock, showCeremony]);

  // Only auto-close on very small screens (never auto-open)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 640px)');
    const apply = () => {
      if (mq.matches) setMonitorOpen(false);
    };
    apply();
    const handler = () => apply();
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', handler);
    // eslint-disable-next-line deprecation/deprecation
    else mq.addListener(handler);
    return () => {
      if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', handler);
      // eslint-disable-next-line deprecation/deprecation
      else mq.removeListener(handler);
    };
  }, []);

  const cutoffUtcMs = useMemo(() => nextMadridCutoffUtcMs(new Date()), [syncPulse, countdown]);

  // Auto-stop highlight after a short premium pulse
  const entriesGlowActive = useMemo(() => {
    // key-based animation trigger; actual timing is in CSS (650ms)
    return entriesHighlightPulse > 0;
  }, [entriesHighlightPulse]);

  return (
    <>
      <style jsx global>{`
        .xpot-luxe-border {
          background: linear-gradient(90deg, rgba(148, 163, 184, 0), rgba(148, 163, 184, 0.10), rgba(148, 163, 184, 0)) 0
              0 / 200% 1px no-repeat,
            linear-gradient(180deg, rgba(148, 163, 184, 0), rgba(148, 163, 184, 0.08), rgba(148, 163, 184, 0)) 0 0 /
              1px 200% no-repeat;
          mask-image: radial-gradient(circle at 22% 18%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0.22) 55%, rgba(0, 0, 0, 0) 78%);
          opacity: 0.55;
          animation: xpotLuxeBorder 12s ease-in-out infinite;
        }
        @keyframes xpotLuxeBorder {
          0% {
            background-position: 0% 0%, 0% 0%;
            opacity: 0.45;
          }
          50% {
            background-position: 100% 0%, 0% 100%;
            opacity: 0.65;
          }
          100% {
            background-position: 0% 0%, 0% 0%;
            opacity: 0.45;
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
            opacity: 0.20;
          }
          55% {
            opacity: 0.08;
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
            rgba(255, 255, 255, 0.06),
            rgba(99, 102, 241, 0.12),
            rgba(56, 189, 248, 0.08),
            rgba(251, 191, 36, 0.08),
            transparent
          );
          animation: xpotSweep 3.2s ease-in-out infinite;
          mix-blend-mode: screen;
          pointer-events: none;
        }

        /* Sticky monitor: now loud-premium, easier to spot */
        /* ----------------------------
   Entries monitor: premium purple treatment
   - no "breathing" (disable animations)
   - one-time soft flash on open
----------------------------- */

/* hard stop any animation inside monitor (prevents "breathing") */
.xpot-monitor-shell,
.xpot-monitor-shell * {
  animation: none !important;
}

/* premium purple border + glow */
.xpot-monitor-shell {
  border: 1px solid rgba(139, 92, 246, 0.32) !important; /* violet */
  background: rgba(2, 6, 23, 0.86) !important;
  box-shadow:
    0 40px 160px rgba(0, 0, 0, 0.78),
    0 0 0 1px rgba(139, 92, 246, 0.10),
    0 18px 80px rgba(99, 102, 241, 0.18); /* indigo/violet glow */
  backdrop-filter: blur(18px);
}

/* subtle gradient ring overlay */
.xpot-monitor-ring {
  pointer-events: none;
  position: absolute;
  inset: 0;
  border-radius: 22px;
  padding: 1px;
  background: linear-gradient(
    90deg,
    rgba(99, 102, 241, 0.35),
    rgba(139, 92, 246, 0.28),
    rgba(236, 72, 153, 0.18)
  );
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.9;
}

/* one-time flash */
@keyframes xpotMonitorFlash {
  0% {
    box-shadow:
      0 40px 160px rgba(0, 0, 0, 0.78),
      0 0 0 1px rgba(139, 92, 246, 0.14),
      0 0 0 rgba(99, 102, 241, 0.0);
    transform: translateY(0px);
  }
  30% {
    box-shadow:
      0 40px 160px rgba(0, 0, 0, 0.78),
      0 0 0 1px rgba(139, 92, 246, 0.22),
      0 0 80px rgba(99, 102, 241, 0.30);
    transform: translateY(-1px);
  }
  100% {
    box-shadow:
      0 40px 160px rgba(0, 0, 0, 0.78),
      0 0 0 1px rgba(139, 92, 246, 0.10),
      0 18px 80px rgba(99, 102, 241, 0.18);
    transform: translateY(0px);
  }
}

/* applied only when open */
.xpot-monitor-flash {
  animation: xpotMonitorFlash 650ms ease-out 1 !important;
}

        /* Entries-card confirmation pulse (650ms violet glow) */
        @keyframes xpotEntriesPulse {
          0% {
            box-shadow: 0 0 0 rgba(99, 102, 241, 0);
            transform: translateY(0px);
          }
          35% {
            box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.22), 0 28px 120px rgba(99, 102, 241, 0.20),
              0 18px 90px rgba(56, 189, 248, 0.10);
            transform: translateY(-1px);
          }
          100% {
            box-shadow: 0 0 0 rgba(99, 102, 241, 0);
            transform: translateY(0px);
          }
        }
        .xpot-entries-pulse {
          animation: xpotEntriesPulse 650ms ease-out both;
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
                <div
                  className={`hidden items-center gap-2 rounded-full border ${BORDER_SOFT} bg-slate-950/45 px-3 py-2 sm:inline-flex`}
                >
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatar}
                      alt={name}
                      className={`h-6 w-6 rounded-full border ${BORDER_SOFT} object-cover`}
                    />
                  ) : (
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border ${BORDER_SOFT} bg-slate-950/45 text-[11px] font-semibold text-slate-100`}
                    >
                      {initialFromHandle(handle)}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-slate-100">
                    @{(handle || 'x').replace(/^@/, '')}
                  </span>
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
            <div
              className={`relative overflow-hidden rounded-[32px] ${SURFACE} shadow-[0_55px_190px_rgba(0,0,0,0.75)] ring-1 ring-slate-700/25 backdrop-blur-2xl`}
            >
              <div className="xpot-hero-sweep absolute inset-0" />
              <div className="pointer-events-none absolute -inset-28 opacity-90 blur-3xl bg-[radial-gradient(circle_at_18%_22%,rgba(56,189,248,0.12),transparent_62%),radial-gradient(circle_at_72%_28%,rgba(99,102,241,0.14),transparent_64%),radial-gradient(circle_at_40%_100%,rgba(251,191,36,0.08),transparent_70%),radial-gradient(circle_at_90%_85%,rgba(236,72,153,0.06),transparent_70%)]" />
              <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(rgba(255,255,255,0.50)_1px,transparent_1px)] [background-size:22px_22px]" />
              <div className="pointer-events-none absolute inset-0 xpot-luxe-border" />

              <div className="relative p-6 sm:p-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatar}
                        alt={name}
                        className={`h-12 w-12 rounded-full border ${BORDER_SOFT} object-cover shadow-[0_24px_70px_rgba(0,0,0,0.55)]`}
                        style={{ animation: 'xpotFloat 6s ease-in-out infinite' }}
                      />
                    ) : (
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full border ${BORDER_SOFT} bg-slate-950/45 text-sm font-semibold text-slate-100`}
                        style={{ animation: 'xpotFloat 6s ease-in-out infinite' }}
                      >
                        {initialFromHandle(handle)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-200/65">
                        {greeting}
                      </p>
                      <p className="mt-1 truncate text-xl font-semibold text-slate-100">
                        {handle ? `@${handle.replace(/^@/, '')}` : name}
                      </p>

                      <p className="mt-1 text-xs text-slate-200/65">
                        Your XPOT account can link multiple wallets. Tickets are issued per wallet and grouped below.
                      </p>

                      <WalletStatusHint />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:w-[560px]">
                    <div className={`rounded-2xl ${SURFACE_INNER} px-4 py-3`}>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-200/65">Next draw in</p>
                      <p className="mt-1 font-mono text-lg text-slate-100">{countdown}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-300/55">
                        22:00 Madrid cutoff
                      </p>
                    </div>

                    <div className={`rounded-2xl ${SURFACE_INNER} px-4 py-3`}>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-200/65">Cabin sync</p>
                      <p className="mt-1 text-sm font-semibold text-slate-100">
                        {lastSyncedAt ? (
                          <span key={syncPulse} className="inline-flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/80" />
                            {new Date(lastSyncedAt).toLocaleTimeString('de-DE')}
                          </span>
                        ) : (
                          'Syncing…'
                        )}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-300/55">
                        Auto refresh active
                      </p>
                    </div>

                    <div className={`rounded-2xl ${SURFACE_INNER} px-4 py-3`}>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-200/65">Status</p>
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
                  <div className={`flex items-center justify-between gap-3 rounded-2xl ${SURFACE_INNER} px-4 py-3`}>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-200/65">Eligibility</p>
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
                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-200/65">Minimum</p>
                      <p className="mt-1 text-xs text-slate-100">
                        <GoldAmount value={REQUIRED_XPOT.toLocaleString()} suffix="XPOT" size="sm" />
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className={`rounded-2xl ${SURFACE_INNER} px-4 py-3`}>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-200/65">Account entries today</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusPill tone="sky">
                        <Ticket className="h-3.5 w-3.5" />
                        {accountTicketsCount} ticket{accountTicketsCount === 1 ? '' : 's'}
                      </StatusPill>
                      <StatusPill tone="slate">
                        <Wallet className="h-3.5 w-3.5" />
                        {walletsEnteredCount} wallet{walletsEnteredCount === 1 ? '' : 's'}
                      </StatusPill>
                    </div>
                    <p className="mt-2 text-xs text-slate-200/65">Each eligible wallet can claim one entry per day.</p>
                  </div>

                  <div className={`rounded-2xl ${SURFACE_INNER} px-4 py-3`}>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-200/65">One-tap</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => scrollToRef(entriesSectionRef as any, { offsetPx: 132, highlight: true })}
                        className={`${BTN_UTILITY} h-9 px-4 text-xs`}
                      >
                        <ArrowDownRight className="mr-2 h-4 w-4" />
                        Entries
                      </button>

                      <button
                        type="button"
                        onClick={() => scrollToRef(claimSectionRef as any, { offsetPx: 132 })}
                        className={`${BTN_UTILITY} h-9 px-4 text-xs`}
                      >
                        <ArrowDownRight className="mr-2 h-4 w-4" />
                        Claim
                      </button>

                      <button
                        type="button"
                        onClick={() => refreshAll('manual')}
                        className={`${BTN_UTILITY} h-9 px-4 text-xs`}
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Refresh
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const ics = makeIcsForCutoff(cutoffUtcMs);
                          downloadTextFile('xpot-draw-cutoff.ics', ics, 'text/calendar');
                        }}
                        className={`${BTN_UTILITY} h-9 px-4 text-xs`}
                        title="Adds a calendar reminder for the draw cutoff"
                      >
                        <CalendarClock className="mr-2 h-4 w-4" />
                        Reminder
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-200/65">No clutter. The monitor stays on the right.</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-xs text-slate-200/65">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-300/75" />
                    Ticket allocation is wallet-level.
                  </div>

                  {currentWalletAddress ? (
                    <button
                      type="button"
                      onClick={() => safeCopy(currentWalletAddress)}
                      className={`${BTN_UTILITY} h-9 px-4 text-xs`}
                      title="Copy connected wallet address"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy wallet
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {/* MAIN GRID */}
          <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            {/* LEFT */}
            <div className="space-y-6">
              <div ref={claimSectionRef as any}>
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
                    <div className={`mt-4 rounded-2xl ${SURFACE_INNER} px-4 py-3 text-xs text-slate-200/65`}>
                      Connect your wallet using the top bar to check eligibility and claim today’s entry.
                    </div>
                  )}

                  {walletConnected && !ticketClaimed && (
                    <>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className={`rounded-2xl ${SURFACE_INNER} px-4 py-3`}>
                          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-200/65">Requirement</p>
                          <p className="mt-1 text-sm font-semibold text-slate-100">
                            <GoldAmount value={REQUIRED_XPOT.toLocaleString()} suffix="XPOT" size="sm" />
                          </p>
                          <p className="mt-1 text-xs text-slate-200/65">Held in the wallet you connect.</p>
                        </div>

                        <div className={`rounded-2xl ${SURFACE_INNER} px-4 py-3`}>
                          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-200/65">Your status</p>
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
                          <p className="mt-2 text-xs text-slate-200/65">Eligibility is checked on refresh.</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          onClick={handleClaimTicket}
                          disabled={!walletConnected || !hasRequiredXpot || claiming}
                          className={`${BTN_PRIMARY}`}
                        >
                          {claiming ? 'Generating…' : 'Claim today’s entry'}
                        </button>

                        <div className="text-xs text-slate-200/65">Draw locks at 22:00 Madrid.</div>
                      </div>

                      {claimError && <p className="mt-3 text-xs xpot-gold-text">{claimError}</p>}

                      {typeof xpotBalance === 'number' && !hasRequiredXpot && (
                        <p className="mt-3 text-xs text-slate-200/65">
                          Your wallet is below the minimum. You need{' '}
                          <span className="font-semibold text-slate-100">{REQUIRED_XPOT.toLocaleString()} XPOT</span> to
                          claim today’s entry.
                        </p>
                      )}
                    </>
                  )}

                  {walletConnected && ticketClaimed && todaysTicket && (
                    <div className={`mt-4 rounded-[24px] ${SURFACE_INNER} p-4`}>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-200/65">Your ticket code</p>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                        <div
                          className={`inline-flex items-center gap-3 rounded-2xl border ${BORDER_SOFTER} bg-slate-950/55 px-4 py-3`}
                        >
                          <Ticket className="h-5 w-5 text-amber-100" />
                          <p className="font-mono text-base text-slate-100">{todaysTicket.code}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyCode(todaysTicket)}
                          className={`inline-flex items-center gap-2 rounded-full border ${BORDER_SOFT} bg-slate-950/45 px-4 py-2 text-xs text-slate-100 hover:bg-slate-900/45`}
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

                      <div className="mt-3">
                        <TinyRow label="Wallet" value={shortWallet(todaysTicket.walletAddress)} mono />
                      </div>
                    </div>
                  )}

                  {walletConnected && ticketClaimed && !todaysTicket && (
                    <p className="mt-4 text-xs text-slate-200/65">
                      Your wallet has an entry today, but it hasn’t loaded yet. Refresh the page.
                    </p>
                  )}

                  {iWonToday && (
                    <div className="mt-4 rounded-2xl border border-emerald-300/18 bg-emerald-950/35 px-4 py-3 text-sm text-emerald-100">
                      You won today’s XPOT. Check your wallet and the winners feed.
                    </div>
                  )}
                </LuxeCard>
              </div>

              <div ref={entriesSectionRef as any}>
                <LuxeCard
                  accent="sky"
                  className={[
                    // Pulse only when triggered (keyed by entriesHighlightPulse)
                    entriesHighlightPulse ? 'xpot-entries-pulse' : '',
                  ].join(' ')}
                  key={`entries-card-${entriesHighlightPulse}`}
                >
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
                      <p className="text-xs text-slate-200/65">Loading…</p>
                    ) : ticketsError ? (
                      <p className="text-xs xpot-gold-text">{ticketsError}</p>
                    ) : entriesScope === 'wallet' ? (
                      !walletConnected ? (
                        <p className="text-xs text-slate-200/65">Connect a wallet to view wallet-only entries.</p>
                      ) : myTickets.length === 0 ? (
                        <p className="text-xs text-slate-200/65">No entries for this wallet yet.</p>
                      ) : (
                        myTickets.map(t => (
                          <div key={t.id} className={`rounded-2xl ${SURFACE_INNER} px-4 py-3`}>
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
                            <p className="mt-1 text-xs text-slate-200/65">Issued {formatDateTime(t.createdAt)}</p>
                          </div>
                        ))
                      )
                    ) : accountGroups.length === 0 ? (
                      <p className="text-xs text-slate-200/65">No entries yet today.</p>
                    ) : (
                      accountGroups.map(group => {
                        const isCurrent = !!normalizedWallet && group.walletLower === normalizedWallet;
                        return (
                          <div key={group.walletLower} className={`rounded-[24px] ${SURFACE_INNER} p-4`}>
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
                                  className={`rounded-2xl border ${BORDER_SOFTER} bg-slate-950/55 px-4 py-3`}
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
                                  <p className="mt-1 text-xs text-slate-200/65">Issued {formatDateTime(t.createdAt)}</p>

                                  <div className="mt-2 flex items-center justify-between gap-2">
                                    <span className="text-[10px] uppercase tracking-[0.18em] text-slate-200/55">
                                      Wallet
                                    </span>
                                    <span className="font-mono text-xs text-slate-100">
                                      {shortWallet(t.walletAddress)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className={`mt-4 rounded-2xl ${SURFACE_INNER} px-4 py-3 text-xs text-slate-200/65`}>
                    Tip: Connect another wallet and claim again to increase your ticket count for today.
                  </div>
                </LuxeCard>
              </div>
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

                <div className={`mt-4 rounded-[24px] ${SURFACE_INNER} p-4`}>
                  <p className="text-xs font-semibold text-slate-100">{mission.title}</p>
                  <p className="mt-1 text-xs text-slate-200/65">{mission.desc}</p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className={`rounded-2xl ${SURFACE_INNER} px-4 py-3`}>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-200/65">Daily streak</p>
                    <div className="mt-2">
                      <StatusPill tone={streak.todayDone ? 'emerald' : 'amber'}>
                        <Flame className="h-3.5 w-3.5" />
                        {streak.todayDone ? 'Today done' : 'Pending'}
                      </StatusPill>
                    </div>
                    <p className="mt-2 text-xs text-slate-200/65">
                      <span className="font-semibold text-slate-100">{Math.max(0, streak.days)}</span> day streak
                    </p>
                  </div>

                  <div className={`rounded-2xl ${SURFACE_INNER} px-4 py-3`}>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-200/65">Reset logic</p>
                    <p className="mt-2 text-sm font-semibold text-slate-100">UTC day rule</p>
                    <p className="mt-1 text-xs text-slate-200/65">Streak updates after you claim today’s entry.</p>
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
                  <div className="mt-4 rounded-[24px] border border-emerald-300/14 bg-emerald-950/28 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-100/85">
                        Scheduled
                      </span>
                      <span className="text-[11px] font-mono text-emerald-100/90">
                        {new Date(upcomingBonus.scheduledAt).toLocaleString('de-DE')}
                      </span>
                    </div>
                    <BonusStrip variant="home" />
                  </div>
                ) : (
                  <div className={`mt-4 rounded-2xl ${SURFACE_INNER} px-4 py-3 text-xs text-slate-200/65`}>
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
                    <p className="text-xs text-slate-200/65">Loading…</p>
                  ) : winnersError ? (
                    <p className="text-xs xpot-gold-text">{winnersError}</p>
                  ) : recentWinners.length === 0 ? (
                    <p className="text-xs text-slate-200/65">No completed draws yet.</p>
                  ) : (
                    recentWinners.map(w => {
                      const h = w.handle ? w.handle.replace(/^@/, '') : null;
                      return (
                        <div key={w.id} className={`rounded-2xl ${SURFACE_INNER} px-4 py-3`}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-slate-200/65">{formatDate(w.drawDate)}</p>
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
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-full border ${BORDER_SOFT} bg-slate-950/45 text-sm font-semibold text-slate-100`}
                            >
                              {initialFromHandle(h)}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-mono text-sm text-slate-100">{w.ticketCode}</p>
                              <p className="mt-1 text-xs text-slate-200/65">
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
                    <p className="text-xs text-slate-200/65">Connect your wallet in the top bar to view history.</p>
                  ) : loadingHistory ? (
                    <p className="text-xs text-slate-200/65">Loading…</p>
                  ) : historyError ? (
                    <p className="text-xs xpot-gold-text">{historyError}</p>
                  ) : historyEntries.length === 0 ? (
                    <p className="text-xs text-slate-200/65">No history yet.</p>
                  ) : (
                    historyEntries.slice(0, 5).map(t => (
                      <div key={t.id} className={`rounded-2xl ${SURFACE_INNER} px-4 py-3`}>
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
                        <p className="mt-1 text-xs text-slate-200/65">{formatDateTime(t.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              </LuxeCard>
            </div>
          </section>

          {/* Global footer (structured like a site footer) */}
          <footer className={`mt-10 border-t ${BORDER_SOFT} pt-8 pb-6`}>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200/70">
                  <Sparkles className="h-4 w-4 text-violet-200/70" />
                  XPOT
                </div>
                <p className="mt-3 text-sm text-slate-100">Holder Dashboard</p>
                <p className="mt-2 text-xs text-slate-200/60">
                  Pre-Launch mode. UI is final and wiring is live. Draw cutoff is 22:00 Madrid.
                </p>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-violet-300/14 bg-slate-950/45 px-3 py-2 text-xs text-slate-200/70">
                  <ShieldCheck className="h-4 w-4 text-violet-200/70" />
                  Wallet connection enables eligibility verification.
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200/60">Navigation</p>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  <Link href="/hub" className="text-slate-100 hover:text-white">
                    Dashboard
                  </Link>
                  <Link href="/hub/history" className="text-slate-100 hover:text-white">
                    History
                  </Link>
                  <Link href="/" className="text-slate-100 hover:text-white">
                    Home
                  </Link>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200/60">Tools</p>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => refreshAll('manual')}
                    className="inline-flex items-center gap-2 text-left text-slate-100 hover:text-white"
                  >
                    <RefreshCcw className="h-4 w-4 text-slate-200/70" />
                    Manual refresh
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const ics = makeIcsForCutoff(nextMadridCutoffUtcMs(new Date()));
                      downloadTextFile('xpot-draw-cutoff.ics', ics, 'text/calendar');
                    }}
                    className="inline-flex items-center gap-2 text-left text-slate-100 hover:text-white"
                  >
                    <CalendarClock className="h-4 w-4 text-slate-200/70" />
                    Download cutoff reminder
                  </button>

                  <a
                    href="https://solscan.io"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-slate-100 hover:text-white"
                  >
                    <ExternalLink className="h-4 w-4 text-slate-200/70" />
                    Solscan
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-slate-700/25 pt-4 sm:flex-row sm:items-center">
              <p className="text-xs text-slate-200/55">© {new Date().getFullYear()} XPOT. All rights reserved.</p>
              <p className="text-xs text-slate-200/55">
                Ticket allocation is per-wallet. One XPOT account may link multiple wallets.
              </p>
            </div>
          </footer>

          {/* RIGHT-SIDE STICKY ENTRIES MONITOR (closed by default, now premium and visible) */}
          <div className="fixed bottom-5 left-4 right-4 z-[60] sm:left-auto sm:right-6 sm:w-[380px]">
            <div className="xpot-monitor-shell xpot-monitor-beacon relative overflow-hidden rounded-[22px]">
              <div className="pointer-events-none absolute -inset-20 opacity-75 blur-3xl bg-[radial-gradient(circle_at_12%_20%,rgba(251,191,36,0.16),transparent_58%),radial-gradient(circle_at_62%_20%,rgba(99,102,241,0.18),transparent_58%),radial-gradient(circle_at_85%_40%,rgba(56,189,248,0.14),transparent_62%),radial-gradient(circle_at_60%_110%,rgba(236,72,153,0.10),transparent_68%)]" />
              <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:18px_18px]" />

              <div className="relative p-4">
                {/* Visible "handle" row */}
<div className="flex items-center gap-2">
  <button
    type="button"
    onClick={() => scrollToRef(entriesSectionRef as any, { offsetPx: 132, highlight: true })}
    className={`${BTN_UTILITY} h-9 px-3 text-xs`}
    title="Jump to entries"
  >
    <ArrowDownRight className="h-4 w-4" />
  </button>

  <button
    type="button"
    onClick={() =>
      setMonitorOpen(v => {
        const next = !v;
        if (next) setMonitorFlashKey(k => k + 1); // one-time purple flash when opening
        return next;
      })
    }
    className={`${BTN_UTILITY} h-9 px-3 text-xs`}
    title="Expand/Collapse"
  >
    {monitorOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
  </button>
</div>

                {monitorOpen ? (
                  <>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusPill tone="sky">
                        <Ticket className="h-3.5 w-3.5" />
                        {entriesScope === 'wallet' ? myTickets.length : accountTicketsCount}
                      </StatusPill>
                      <StatusPill tone="slate">
                        <Wallet className="h-3.5 w-3.5" />
                        {walletsEnteredCount}
                      </StatusPill>
                      {walletConnected ? (
                        <StatusPill tone="emerald">
                          <Wallet className="h-3.5 w-3.5" />
                          Wallet linked
                        </StatusPill>
                      ) : (
                        <StatusPill tone="amber">
                          <Wallet className="h-3.5 w-3.5" />
                          Not linked
                        </StatusPill>
                      )}
                    </div>

                    <div className={`mt-3 inline-flex w-full rounded-full border ${BORDER_SOFT} bg-slate-950/45 p-1`}>
                      <button
                        type="button"
                        onClick={() => setScopeAndJump('account')}
                        className={[
                          'flex-1 rounded-full px-4 py-2 text-xs font-semibold transition',
                          entriesScope === 'account'
                            ? 'bg-[linear-gradient(90deg,rgba(99,102,241,0.35),rgba(56,189,248,0.18))] text-slate-100 shadow-[0_18px_70px_rgba(99,102,241,0.18)]'
                            : 'text-slate-200/75 hover:text-slate-100',
                        ].join(' ')}
                      >
                        Account
                      </button>
                      <button
                        type="button"
                        onClick={() => setScopeAndJump('wallet')}
                        disabled={!walletConnected}
                        className={[
                          'flex-1 rounded-full px-4 py-2 text-xs font-semibold transition disabled:opacity-50',
                          entriesScope === 'wallet'
                            ? 'bg-[linear-gradient(90deg,rgba(251,191,36,0.18),rgba(99,102,241,0.32))] text-slate-100 shadow-[0_18px_70px_rgba(251,191,36,0.12)]'
                            : 'text-slate-200/75 hover:text-slate-100',
                        ].join(' ')}
                        title={!walletConnected ? 'Connect a wallet to filter' : 'Show only the connected wallet'}
                      >
                        This wallet
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => scrollToRef(entriesSectionRef as any, { offsetPx: 132, highlight: true })}
                        className={`${BTN_UTILITY} h-9 px-4 text-xs`}
                      >
                        <ArrowDownRight className="mr-2 h-4 w-4" />
                        View entries
                      </button>

                      <button
                        type="button"
                        onClick={() => scrollToRef(claimSectionRef as any, { offsetPx: 132 })}
                        className={`${BTN_UTILITY} h-9 px-4 text-xs`}
                      >
                        <ArrowDownRight className="mr-2 h-4 w-4" />
                        Jump to claim
                      </button>

                      <button
                        type="button"
                        onClick={() => refreshAll('manual')}
                        className={`${BTN_UTILITY} h-9 px-4 text-xs`}
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Refresh
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-200/60">Auto refresh: on</p>
                      <p className="text-[10px] text-slate-200/60">
                        {lastSyncedAt ? `Last sync ${new Date(lastSyncedAt).toLocaleTimeString('de-DE')}` : 'Syncing…'}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-200/60">
                      Tap arrow to open. Tap ↘ to jump.
                    </p>
                    <div className="inline-flex items-center gap-2">
                      <StatusPill tone="sky">
                        <Ticket className="h-3.5 w-3.5" />
                        {entriesScope === 'wallet' ? myTickets.length : accountTicketsCount}
                      </StatusPill>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </XpotPageShell>
      </div>
    </>
  );
}
