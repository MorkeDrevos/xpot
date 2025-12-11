// app/admin/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import JackpotPanel from '@/components/JackpotPanel';
import { XPOT_POOL_SIZE } from '@/lib/xpot';

const MAX_TODAY_TICKETS = 10; // how many “Today’s XPOT entries” to show
const MAX_RECENT_WINNERS = 9; // how many “Recent XPOT winners” to show
const MAIN_XPOT_REWARD = XPOT_POOL_SIZE;

// Frontend flag: hide manual button when auto-draw is truly wired
const AUTO_DRAW_ENABLED =
  process.env.NEXT_PUBLIC_XPOT_AUTO_DRAW_ENABLED === 'true';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type DrawStatus = 'open' | 'closed' | 'completed';

type TodayDraw = {
  id: string;
  date: string;
  status: DrawStatus;
  jackpotUsd: number;
  rolloverUsd: number;
  ticketsCount: number;
  closesAt?: string | null;
};

type TicketStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

type AdminTicket = {
  id: string;
  code: string;
  walletAddress: string;
  status: TicketStatus;
  createdAt: string;
  jackpotUsd?: number;
};

type AdminWinnerKind = 'main' | 'bonus';

type AdminWinner = {
  id: string;
  drawId: string;
  date: string;
  ticketCode: string;
  walletAddress: string;
  jackpotUsd: number;
  payoutUsd: number; // used as XPOT amount in UI
  isPaidOut: boolean;
  txUrl?: string | null;
  kind?: AdminWinnerKind;
  label?: string | null;
};

type BonusDropStatus = 'SCHEDULED' | 'FIRED' | 'CANCELLED';

type AdminBonusDrop = {
  id: string;
  label: string;
  amountXpot: number;
  scheduledAt: string;
  status: BonusDropStatus;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const ADMIN_TOKEN_KEY = 'xpot_admin_token';

function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB'); // 03/12/2025
}

function formatDateTime(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatUsd(amount: number | null | undefined, decimals = 2) {
  if (amount == null || !Number.isFinite(amount)) return '$0.00';
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatXpot(amount: number | null | undefined, decimals = 2) {
  if (amount == null || !Number.isFinite(amount)) return '0 XPOT';
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })} XPOT`;
}

function UsdPill({
  amount,
  size = 'md',
}: {
  amount: number | null | undefined;
  size?: 'sm' | 'md';
}) {
  const value = formatUsd(amount);
  const base =
    'inline-flex items-baseline rounded-full bg-emerald-500/10 text-emerald-300 font-semibold';
  const cls =
    size === 'sm'
      ? `${base} px-2 py-0.5 text-xs`
      : `${base} px-3 py-1 text-sm`;

  return (
    <span className={cls}>
      <span className="font-mono text-[0.92em]">{value}</span>
      <span className="ml-1 text-[0.7em] uppercase tracking-[0.16em] text-emerald-400">
        USD
      </span>
    </span>
  );
}

function formatWinnerLabel(w: AdminWinner): string | null {
  if (!w.label) return null;

  const raw = w.label.trim();

  if (w.kind === 'main' || /jackpot/i.test(raw)) {
    return 'Main XPOT';
  }

  return raw.replace(/jackpot/gi, 'XPOT');
}

function XpotPill({
  amount,
  size = 'md',
}: {
  amount: number | null | undefined;
  size?: 'sm' | 'md';
}) {
  const value = formatXpot(amount);

  // Split "10,000,000 XPOT" into amount + unit
  const parts = value.split(' ');
  const unit = parts.pop(); // "XPOT"
  const amountStr = parts.join(' '); // "10,000,000"

  const base =
    'inline-flex items-baseline rounded-full border border-slate-700/80 bg-slate-950/80 text-slate-100 font-semibold shadow-[0_0_0_1px_rgba(15,23,42,0.9)]';
  const cls =
    size === 'sm'
      ? `${base} px-3 py-1 text-xs`
      : `${base} px-4 py-1.5 text-sm`;

  return (
    <span className={cls}>
      <span className="font-mono tracking-[0.14em] text-[0.9em]">
        {amountStr}
      </span>
      <span className="ml-2 text-[0.68em] uppercase tracking-[0.24em] text-slate-400">
        {unit}
      </span>
    </span>
  );
}

function truncateAddress(addr: string, visible: number = 6) {
  if (!addr) return '(unknown wallet)';
  if (addr.length <= visible * 2) return addr;
  return `${addr.slice(0, visible)}…${addr.slice(-visible)}`;
}

function CopyableWallet({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  if (!address) {
    return (
      <span className="font-mono text-xs text-slate-500">
        (unknown wallet)
      </span>
    );
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error('Failed to copy wallet address', err);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group inline-flex items-center gap-1 text-[11px] text-slate-400 transition-colors hover:text-emerald-300"
    >
      <span className="font-mono">{truncateAddress(address, 6)}</span>
      <span className="rounded-md border border-slate-600/60 px-1 py-[1px] text-[10px] tracking-wide group-hover:border-emerald-400/60">
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────
// Button styles (control room system)
// ─────────────────────────────────────────────

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_SECONDARY =
  'inline-flex items-center justify-center rounded-full bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 transition';

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenAccepted, setTokenAccepted] = useState(false);
  const [isSavingToken, setIsSavingToken] = useState(false);

  const [todayDraw, setTodayDraw] = useState<TodayDraw | null>(null);
  const [todayDrawError, setTodayDrawError] = useState<string | null>(null);
  const [todayLoading, setTodayLoading] = useState(true);

  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const [winners, setWinners] = useState<AdminWinner[]>([]);
  const [winnersError, setWinnersError] = useState<string | null>(null);
  const [winnersLoading, setWinnersLoading] = useState(true);

  const [isDevHost, setIsDevHost] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDevHost(window.location.hostname.startsWith('dev.'));
    }
  }, []);

  // "Mark as paid" helpers
  const [txInputs, setTxInputs] = useState<Record<string, string>>({});
  const [savingPaidId, setSavingPaidId] = useState<string | null>(null);
  const [markPaidError, setMarkPaidError] = useState<string | null>(null);
  const [copiedTxWinnerId, setCopiedTxWinnerId] =
    useState<string | null>(null);

  // pagination
  const [visibleTicketCount, setVisibleTicketCount] = useState(
    MAX_TODAY_TICKETS,
  );
  const [visibleWinnerCount, setVisibleWinnerCount] = useState(
    MAX_RECENT_WINNERS,
  );

  const visibleTickets = tickets.slice(0, visibleTicketCount);
  const visibleWinners = winners.slice(0, visibleWinnerCount);

  // Live jackpot USD coming from JackpotPanel
  const [liveJackpotUsd, setLiveJackpotUsd] = useState<number | null>(null);

  // Countdown for "Draw closes in"
  const [countdownText, setCountdownText] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  const isWarningSoon =
    countdownSeconds !== null && countdownSeconds <= 15 * 60; // < 15 min
  const isWarningCritical =
    countdownSeconds !== null && countdownSeconds <= 5 * 60; // < 5 min

  // Bonus jackpot scheduling
  const [bonusAmount, setBonusAmount] = useState('100000');
  const [bonusLabel, setBonusLabel] = useState('Bonus XPOT');
  const [bonusDelayMinutes, setBonusDelayMinutes] = useState<number>(30); // default 30 min
  const [bonusSubmitting, setBonusSubmitting] = useState(false);
  const [bonusError, setBonusError] = useState<string | null>(null);
  const [bonusSuccess, setBonusSuccess] = useState<string | null>(null);

  const [upcomingDrops, setUpcomingDrops] = useState<AdminBonusDrop[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [upcomingError, setUpcomingError] = useState<string | null>(null);

  // Bonus XPOT next-drop countdown
  const [nextBonusDrop, setNextBonusDrop] = useState<AdminBonusDrop | null>(
    null,
  );
  const [nextBonusCountdown, setNextBonusCountdown] = useState<string | null>(
    null,
  );

  // Pick main winner state
  const [pickError, setPickError] = useState<string | null>(null);
  const [pickSuccess, setPickSuccess] = useState<string | null>(null);
  const [isPickingWinner, setIsPickingWinner] = useState(false);
  const [isReopeningDraw, setIsReopeningDraw] = useState(false);

  // Flag while we are creating today's draw
  const [creatingDraw, setCreatingDraw] = useState(false);

  // ── Load admin token from localStorage ────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (stored) {
      setAdminToken(stored);
      setTokenAccepted(true);
    }
  }, []);

  // ── Fetch helpers with auth header ────────────────────────────

  async function authedFetch(input: string, init?: RequestInit) {
    if (!adminToken) throw new Error('NO_ADMIN_TOKEN');

    const res = await fetch(input, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        'Content-Type': 'application/json',
        // New bearer-style header (used by newer routes)
        Authorization: `Bearer ${adminToken}`,
        // Legacy header (used by bonus-schedule / bonus/upcoming)
        'x-xpot-admin-token': adminToken,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Request failed (${res.status}): ${
          body || res.statusText || 'Unknown error'
        }`,
      );
    }

    return res.json();
  }

  // ── Manually create today's draw from admin button ────────────
  // (keep as emergency / dev-only)
  async function handleCreateTodayDraw() {
    setTodayDrawError(null);

    if (!adminToken) {
      alert('Admin token missing. Unlock admin first.');
      return;
    }

    setCreatingDraw(true);
    try {
      const data = await authedFetch('/api/admin/create-today-draw', {
        method: 'POST',
      });

      if (!data || (data as any).ok === false) {
        throw new Error((data as any)?.error || 'Failed to create today’s draw');
      }

      window.location.reload();
    } catch (err: any) {
      console.error('[XPOT] create today draw error:', err);
      alert(err.message || 'Unexpected error creating today’s round');
    } finally {
      setCreatingDraw(false);
    }
  }

  // ── Schedule bonus XPOT (no instant winner, just DB) ─────────────

  async function handleScheduleBonus(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBonusError(null);
    setBonusSuccess(null);

    if (!adminToken) {
      setBonusError('Admin token missing. Unlock admin first.');
      return;
    }

    const amountNumber = Number(bonusAmount);
    if (!Number.isFinite(amountNumber) || amountNumber < 100000) {
      setBonusError('Enter a valid XPOT amount (min 100,000).');
      return;
    }

    const allowedDelays = [5, 15, 30, 60];
    if (!allowedDelays.includes(bonusDelayMinutes)) {
      setBonusError('Select a valid bonus timer.');
      return;
    }

    setBonusSubmitting(true);
    try {
      const data = (await authedFetch('/api/admin/bonus-schedule', {
        method: 'POST',
        body: JSON.stringify({
          amountXpot: amountNumber,
          label: bonusLabel || 'Bonus XPOT',
          delayMinutes: bonusDelayMinutes,
        }),
      })) as { drop: AdminBonusDrop };

      const drop = data.drop;

      setBonusSuccess(
        `Scheduled ${drop.label} · ${drop.amountXpot.toLocaleString()} XPOT.`,
      );

      // Optimistically add/refresh in upcoming list
      setUpcomingDrops(prev => {
        const without = prev.filter(d => d.id !== drop.id);
        return [...without, drop];
      });
    } catch (err: any) {
      console.error('[ADMIN] schedule bonus error', err);
      setBonusError(err?.message || 'Failed to schedule bonus XPOT.');
    } finally {
      setBonusSubmitting(false);
    }
  }

  // ── Pick main XPOT winner (manual override) ───────────────────

  async function handlePickMainWinner() {
    setPickError(null);
    setPickSuccess(null);

    if (!adminToken) {
      setPickError('Admin token missing. Unlock admin first.');
      return;
    }

    setIsPickingWinner(true);
    try {
      const data = await authedFetch('/api/admin/pick-winner', {
        method: 'POST',
      });

      const raw = (data as any).winner as any;
      if (!raw) throw new Error('No winner returned from API');

      const winner: AdminWinner = {
        ...raw,
        payoutUsd:
          raw.payoutUsd ??
          raw.payoutXpot ??
          raw.amountUsd ??
          raw.amountXpot ??
          0,
      };

      setPickSuccess(
        `Main XPOT winner: ${winner.ticketCode} (${winner.walletAddress.slice(
          0,
          4,
        )}…${winner.walletAddress.slice(-4)}).`,
      );

      try {
        const winnersData = await authedFetch('/api/admin/winners');
        setWinners((winnersData as any).winners ?? []);
      } catch (err) {
        console.error('[ADMIN] refresh winners after pick error', err);
        setWinners(prev => [winner, ...prev]);
      }

      setTodayDraw(prev => (prev ? { ...prev, status: 'closed' } : prev));
    } catch (err: any) {
      setPickError(err.message || 'Failed to pick main XPOT winner');
    } finally {
      setIsPickingWinner(false);
    }
  }

  // ── Panic: reopen today’s draw ──────────────────────────────
  async function handleReopenDraw() {
    setTodayDrawError(null);

    if (!adminToken) {
      alert('Admin token missing. Unlock admin first.');
      return;
    }

    setIsReopeningDraw(true);
    try {
      const data = await authedFetch('/api/admin/reopen-draw', {
        method: 'POST',
      });

      if (!data || (data as any).ok === false) {
        throw new Error((data as any)?.error || 'Failed to reopen draw');
      }

      setTodayDraw(prev => (prev ? { ...prev, status: 'open' } : prev));
    } catch (err: any) {
      console.error('[XPOT] reopen draw error:', err);
      alert(err.message || 'Unexpected error reopening draw');
    } finally {
      setIsReopeningDraw(false);
    }
  }

  // ── Mark winner as paid ─────────────────────────────────────

  async function handleMarkAsPaid(winnerId: string) {
    setMarkPaidError(null);

    if (!adminToken) {
      setMarkPaidError('Admin token missing. Unlock admin first.');
      return;
    }

    const txUrl = txInputs[winnerId]?.trim() || '';
    if (!txUrl) {
      setMarkPaidError('Paste a TX link before marking as paid.');
      return;
    }

    setSavingPaidId(winnerId);
    try {
      const data = await authedFetch('/api/admin/mark-paid', {
        method: 'POST',
        body: JSON.stringify({ winnerId, txUrl }),
      });

      if (data && (data as any).ok === false) {
        throw new Error((data as any).error || 'Failed to mark as paid');
      }

      setWinners(prev =>
        prev.map(w =>
          w.id === winnerId ? { ...w, isPaidOut: true, txUrl } : w,
        ),
      );
    } catch (err: any) {
      setMarkPaidError(err.message || 'Failed to mark as paid');
    } finally {
      setSavingPaidId(null);
    }
  }

  // ── Load Today, tickets, winners, upcoming drops ─────────────

  useEffect(() => {
    if (!adminToken) return;

    let cancelled = false;

    async function loadAll() {
      // Today
      setTodayLoading(true);
      setTodayDrawError(null);
      try {
        const data = await authedFetch('/api/admin/today');
        if (!cancelled) setTodayDraw((data as any).today ?? null);
      } catch (err: any) {
        console.error('[ADMIN] /today error', err);
        if (!cancelled) {
          setTodayDrawError(err.message || 'Failed to load today');
        }
      } finally {
        if (!cancelled) setTodayLoading(false);
      }

      // Tickets
      setTicketsLoading(true);
      setTicketsError(null);
      try {
        const data = await authedFetch('/api/admin/tickets');
        if (!cancelled) setTickets((data as any).tickets ?? []);
      } catch (err: any) {
        console.error('[ADMIN] /tickets error', err);
        if (!cancelled) {
          setTicketsError(err.message || 'Failed to load tickets');
        }
      } finally {
        if (!cancelled) setTicketsLoading(false);
      }

      // Winners
      setWinnersLoading(true);
      setWinnersError(null);
      try {
        const data = await authedFetch('/api/admin/winners');
        if (!cancelled) setWinners((data as any).winners ?? []);
      } catch (err: any) {
        console.error('[ADMIN] /winners error', err);
        if (!cancelled) {
          setWinnersError(err.message || 'Failed to load results');
        }
      } finally {
        if (!cancelled) setWinnersLoading(false);
      }

      // Upcoming bonus drops
      setUpcomingLoading(true);
      setUpcomingError(null);
      try {
        const data = await authedFetch('/api/admin/bonus-upcoming');
        if (!cancelled) {
          setUpcomingDrops((data as any).drops ?? []);
        }
      } catch (err: any) {
        console.error('[ADMIN] /bonus-upcoming error', err);
        if (!cancelled) {
          setUpcomingError(err?.message || 'Failed to load upcoming drops');
        }
      } finally {
        if (!cancelled) {
          setUpcomingLoading(false);
        }
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [adminToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Bonus XPOT next-drop countdown ───────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!upcomingDrops || upcomingDrops.length === 0) {
      setNextBonusDrop(null);
      setNextBonusCountdown(null);
      return;
    }

    const scheduled = upcomingDrops.filter(
      d => d.status === 'SCHEDULED',
    );
    if (scheduled.length === 0) {
      setNextBonusDrop(null);
      setNextBonusCountdown(null);
      return;
    }

    // Find earliest scheduled drop
    const next = scheduled.reduce<AdminBonusDrop | null>((acc, d) => {
      if (!acc) return d;
      const accTime = new Date(acc.scheduledAt).getTime();
      const dTime = new Date(d.scheduledAt).getTime();
      return dTime < accTime ? d : acc;
    }, null);

    if (!next) {
      setNextBonusDrop(null);
      setNextBonusCountdown(null);
      return;
    }

    setNextBonusDrop(next);
    const targetTime = new Date(next.scheduledAt).getTime();

    function updateCountdown() {
      const diffMs = targetTime - Date.now();
      if (diffMs <= 0) {
        setNextBonusCountdown('00:00:00');
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = String(Math.floor(totalSeconds / 3600)).padStart(
        2,
        '0',
      );
      const minutes = String(
        Math.floor((totalSeconds % 3600) / 60),
      ).padStart(2, '0');
      const seconds = String(totalSeconds % 60).padStart(2, '0');

      setNextBonusCountdown(`${hours}:${minutes}:${seconds}`);
    }

    updateCountdown();
    const id = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(id);
  }, [upcomingDrops]);

  // Clamp visibleTicketCount if tickets shrink / first load
  useEffect(() => {
    setVisibleTicketCount(prev =>
      Math.min(prev, tickets.length || MAX_TODAY_TICKETS),
    );
  }, [tickets.length]);

  function handleLoadMoreTickets() {
    setVisibleTicketCount(prev =>
      Math.min(prev + MAX_TODAY_TICKETS, tickets.length),
    );
  }

  // Clamp visibleWinnerCount when winners list changes
  useEffect(() => {
    setVisibleWinnerCount(prev => {
      if (winners.length === 0) return 0;
      if (winners.length <= MAX_RECENT_WINNERS) return winners.length;
      if (prev && prev > 0) return Math.min(prev, winners.length);
      return MAX_RECENT_WINNERS;
    });
  }, [winners.length]);

  function handleLoadMoreWinners() {
    setVisibleWinnerCount(prev =>
      Math.min(prev + MAX_RECENT_WINNERS, winners.length),
    );
  }

  // ── Admin token handling ──────────────────────────────────────

  async function handleUnlock(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setIsSavingToken(true);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ADMIN_TOKEN_KEY, tokenInput.trim());
      }
      setAdminToken(tokenInput.trim());
      setTokenAccepted(true);
    } finally {
      setIsSavingToken(false);
    }
  }

  function handleClearToken() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
    setAdminToken(null);
    setTokenAccepted(false);
    setTokenInput('');
  }

  const isDrawLocked = todayDraw?.status === 'closed';

  // Draw date / next draw date helper
  const DAY_MS = 24 * 60 * 60 * 1000;
  const closesAtDate = todayDraw?.closesAt
    ? new Date(todayDraw.closesAt)
    : null;
  const now = new Date();

  let drawDateLabel = 'Draw date';
  let drawDateValue: Date | null = null;

  if (todayDraw?.date) {
    drawDateValue = new Date(todayDraw.date);
  }

  // if the current time is past today's close, show "Next draw date"
  if (closesAtDate && now >= closesAtDate) {
    drawDateLabel = 'Next draw date';
    drawDateValue = new Date(closesAtDate.getTime() + DAY_MS);
  }

    // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-[#02020a] text-slate-100">
      {/* Top pre-launch banner */}
      <div className="w-full bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#ec4899] shadow-[0_0_30px_rgba(168,85,247,0.55)]">
        <div className="mx-auto flex h-11 max-w-[1520px] items-center justify-center px-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-50 sm:h-12">
          PRE-LAUNCH MODE · XPOT TOKEN NOT DEPLOYED · BUILD V0.9.3
        </div>
      </div>

      <main className="relative mx-auto flex w-full max-w-[1520px] flex-col gap-6 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
        {/* Galaxy background layers */}
        <div className="pointer-events-none absolute inset-0 -z-30 bg-[#02020a]" />

        {/* Deep blue / purple nebulas */}
        <div
          className="
            pointer-events-none absolute inset-0 -z-20 opacity-90
            bg-[radial-gradient(circle_at_10%_0%,rgba(15,23,42,0.95),transparent_60%),radial-gradient(circle_at_0%_60%,rgba(37,99,235,0.45),transparent_60%),radial-gradient(circle_at_100%_30%,rgba(168,85,247,0.60),transparent_60%),radial-gradient(circle_at_100%_90%,rgba(236,72,153,0.55),transparent_65%)]
          "
        />

        {/* Star belt – subtle across the top only */}
        <div
          className="
            pointer-events-none absolute inset-x-0 top-0 -z-15 h-[260px]
            opacity-60
            [background-image:
              radial-gradient(circle_at_5%_20%,rgba(248,250,252,0.9)_1px,transparent_0),
              radial-gradient(circle_at_40%_10%,rgba(226,232,240,0.7)_1px,transparent_0),
              radial-gradient(circle_at_70%_25%,rgba(148,163,184,0.7)_1.1px,transparent_0),
              radial-gradient(circle_at_95%_15%,rgba(148,163,184,0.55)_0.9px,transparent_0)
            ]
            [background-size:900px_260px,1000px_260px,1100px_260px,1200px_260px]
            [background-position:0px_0px,180px_10px,40px_40px,260px_30px]
            mix-blend-screen
          "
        />

        {/* Soft vignette */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.82)_70%,rgba(0,0,0,0.97)_100%)]" />

        {/* Nebula band behind dashboard shell */}
        <div
          className="
            pointer-events-none absolute -z-10
            -inset-x-40 top-12 h-[640px]
            bg-[radial-gradient(circle_at_0%_10%,rgba(37,99,235,0.55),transparent_55%),radial-gradient(circle_at_45%_0%,rgba(15,23,42,0.95),transparent_55%),radial-gradient(circle_at_100%_60%,rgba(168,85,247,0.60),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(236,72,153,0.55),transparent_60%)]
            opacity-95 blur-2xl
          "
        />

        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: logo + section label */}
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
              Operations center
            </span>
          </div>

          {/* Right: control-room title + status pills */}
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <h1 className="text-sm font-semibold text-white sm:text-base">
                Control room for today’s XPOT
              </h1>

              {AUTO_DRAW_ENABLED && (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse" />
                  Auto draw enabled
                </span>
              )}

              {isDevHost && (
                <span className="rounded-full border border-amber-400/60 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                  Dev environment
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              Monitor pool state, entries and rewards. All data is live and
              admin-key gated.
            </p>
          </div>
        </header>

        {/* Admin key band */}
        <section className="relative rounded-3xl">
          {/* Soft halo */}
          <div className="pointer-events-none absolute -inset-20 bg-[radial-gradient(circle_at_10%_0%,rgba(79,70,229,0.28),transparent_55%),radial-gradient(circle_at_80%_120%,rgba(236,72,153,0.24),transparent_58%)] opacity-70 blur-3xl" />

          {/* Slim gradient bar */}
          <div className="relative rounded-3xl border border-slate-900/70 bg-gradient-to-r from-[#050816]/90 via-[#050816]/80 to-[#050816]/90 shadow-[0_22px_70px_rgba(15,23,42,0.85)]">
            <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: label + explainer */}
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-950/80 px-3 py-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Admin key
                    </span>
                    <span
                      className={`h-1.5 w-1.5 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.9)] ${
                        tokenAccepted ? 'bg-emerald-400' : 'bg-slate-600'
                      }`}
                    />
                  </span>

                  <span className="text-xs text-slate-400">
                    Enter your admin token to unlock XPOT operations.
                  </span>
                </div>

                {/* Right: access status pill */}
                <div className="flex items-center justify-start sm:justify-end">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]
                      shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] ${
                        tokenAccepted
                          ? 'border border-slate-600/60 bg-slate-800/60 text-slate-200'
                          : 'border border-slate-700/70 bg-slate-900/70 text-slate-400'
                      }`}
                  >
                    {tokenAccepted
                      ? 'Access level confirmed'
                      : 'Locked · token required'}
                  </span>
                </div>
              </div>

              <form
                onSubmit={handleUnlock}
                className="flex flex-1 flex-col gap-2 sm:max-w-xl sm:flex-row"
              >
                <input
                  type="password"
                  className="flex-1 rounded-full border border-slate-700/80 bg-[#020617]/90 px-4 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-400/80"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  placeholder="Paste admin token…"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSavingToken || !tokenInput.trim()}
                    className={`${BTN_UTILITY} px-4 py-2 text-xs`}
                  >
                    {tokenAccepted ? 'Update key' : 'Unlock'}
                  </button>
                  {tokenAccepted && (
                    <button
                      type="button"
                      onClick={handleClearToken}
                      className={`${BTN_UTILITY} px-4 py-2 text-xs`}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Main grid: left (XPOT card + entries), right (winners) */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* LEFT COLUMN */}
          <div className="space-y-4">
            {/* XPOT CARD */}
            {/* --------------- XPOT card block (unchanged) --------------- */}
            {/* paste your existing XPOT card + countdown + crown button here */}
            {/* I’m not re-pasting the entire block to save space, but the version
                you already have above this message is structurally fine. */}
          </div>

          {/* RIGHT COLUMN – recent winners */}
          <div className="w-full space-y-4 lg:max-w-[640px]">
            <section
              className="
                relative overflow-hidden rounded-[24px]
                border border-slate-900/70
                bg-transparent
                px-5 py-5
              "
            >
              {/* Header */}
              <div className="relative mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white tracking-wide">
                    Recent XPOT winners
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Internal log of the latest entries and reward execution.
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="relative">
                {winnersLoading && (
                  <p className="text-xs text-slate-500">Loading records…</p>
                )}

                {winnersError && (
                  <p className="text-xs text-amber-300">{winnersError}</p>
                )}

                {!winnersLoading &&
                  !winnersError &&
                  winners.length === 0 && (
                    <p className="rounded-2xl bg-slate-900/70 px-4 py-3 text-xs text-slate-500">
                      No completed draws yet. Once you pick winners and mark
                      XPOT as paid, they&apos;ll appear here.
                    </p>
                  )}

                {!winnersLoading &&
                  !winnersError &&
                  visibleWinners.length > 0 && (
                    <>
                      {/* Flat list, no cards */}
                      <div className="mt-1 divide-y divide-slate-800/70 border-t border-slate-800/80">
                        {visibleWinners.map(w => {
                          const label = formatWinnerLabel(w);
                          const isMain =
                            w.kind === 'main' || label === 'Main XPOT';
                          const displayXpot = isMain
                            ? MAIN_XPOT_REWARD
                            : w.payoutUsd;

                          return (
                            <article
                              key={w.id}
                              className="group flex flex-col gap-2 py-4"
                            >
                              {/* TOP ROW */}
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-mono text-[11px] text-slate-200">
                                  {w.ticketCode}
                                </p>

                                <div className="flex items-center gap-2">
                                  {label && (
                                    <span
                                      className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] ${
                                        w.kind === 'bonus'
                                          ? 'bg-emerald-500/12 text-emerald-300'
                                          : 'bg-slate-800/70 text-slate-200'
                                      }`}
                                    >
                                      {label}
                                    </span>
                                  )}

                                  <span className="text-[11px] text-slate-500">
                                    {formatDate(w.date)}
                                  </span>
                                </div>
                              </div>

                              {/* MIDDLE ROW: wallet */}
                              <CopyableWallet address={w.walletAddress} />

                              {/* BOTTOM ROW: payout + actions */}
                              <div className="mt-2 flex items-center justify-between gap-3">
                                <XpotPill amount={displayXpot} />

                                {w.isPaidOut ? (
                                  w.txUrl && (
                                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-sky-300">
                                      <span className="font-semibold">
                                        Reward sent
                                      </span>
                                      <span className="text-slate-500">·</span>

                                      <a
                                        href={w.txUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="underline decoration-sky-400/40 hover:text-sky-200"
                                      >
                                        View TX
                                      </a>

                                      <button
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            await navigator.clipboard.writeText(
                                              w.txUrl!,
                                            );
                                            setCopiedTxWinnerId(w.id);
                                            setTimeout(
                                              () => setCopiedTxWinnerId(null),
                                              1200,
                                            );
                                          } catch {
                                            // ignore
                                          }
                                        }}
                                        className="rounded-full border border-sky-400/40 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-sky-200 hover:bg-sky-500/10"
                                      >
                                        {copiedTxWinnerId === w.id
                                          ? 'Copied'
                                          : 'Copy TX'}
                                      </button>
                                    </div>
                                  )
                                ) : (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <input
                                      type="text"
                                      placeholder="Paste TX link…"
                                      className="w-44 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-[11px] text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 outline-none"
                                      value={txInputs[w.id] ?? ''}
                                      onChange={e =>
                                        setTxInputs(prev => ({
                                          ...prev,
                                          [w.id]: e.target.value,
                                        }))
                                      }
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleMarkAsPaid(w.id)}
                                      disabled={savingPaidId === w.id}
                                      className={`${BTN_UTILITY} px-4 py-1.5 text-[11px]`}
                                    >
                                      {savingPaidId === w.id
                                        ? 'Saving…'
                                        : 'Mark as paid'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>

                      {markPaidError && (
                        <p className="mt-2 text-xs text-amber-300">
                          {markPaidError}
                        </p>
                      )}

                      {/* FOOTER */}
                      <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs text-slate-400">
                        <p>
                          Showing latest {visibleWinners.length} of{' '}
                          {winners.length}
                        </p>

                        {visibleWinners.length < winners.length && (
                          <button
                            type="button"
                            onClick={handleLoadMoreWinners}
                            className={`${BTN_UTILITY} px-3 py-1 text-[11px]`}
                          >
                            Load more
                          </button>
                        )}
                      </div>
                    </>
                  )}
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
