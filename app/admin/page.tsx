// app/admin/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import JackpotPanel from '@/components/JackpotPanel';
import XpotPageShell from '@/components/XpotPageShell';
import { XPOT_POOL_SIZE } from '@/lib/xpot';

const MAX_TODAY_TICKETS = 10;
const MAX_RECENT_WINNERS = 9;
const MAIN_XPOT_REWARD = XPOT_POOL_SIZE;

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
  payoutUsd: number; // used as XPOT amount in UI for bonus
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
  return d.toLocaleDateString('en-GB');
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
  const parts = value.split(' ');
  const unit = parts.pop();
  const amountStr = parts.join(' ');

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
      <span className="font-mono text-xs text-slate-500">(unknown wallet)</span>
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
// Animated logo (Lottie) with safe fallback
// expects /public/lottie/xpot-logo.json
// ─────────────────────────────────────────────

function XpotLogoAnimated({
  className,
  width = 132,
  height = 36,
}: {
  className?: string;
  width?: number;
  height?: number;
}) {
  const [Lottie, setLottie] = useState<any>(null);
  const [animationData, setAnimationData] = useState<any>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const mod = await import('lottie-react');
        if (!cancelled) setLottie(() => mod.default);
      } catch {
        if (!cancelled) setFailed(true);
      }

      try {
        const res = await fetch('/lottie/xpot-logo.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('missing lottie json');
        const json = await res.json();
        if (!cancelled) setAnimationData(json);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed || !Lottie || !animationData) {
    return (
      <Image
        src="/img/xpot-logo-light.png"
        alt="XPOT"
        width={width}
        height={height}
        priority
        className={className}
      />
    );
  }

  const Comp = Lottie;
  return (
    <div className={className} style={{ width, height }}>
      <Comp animationData={animationData} loop autoplay />
    </div>
  );
}

// ─────────────────────────────────────────────
// Button styles
// ─────────────────────────────────────────────

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_DANGER =
  'inline-flex items-center justify-center rounded-full border border-red-500/70 bg-red-500/10 text-red-200 hover:bg-red-500/20 transition disabled:cursor-not-allowed disabled:opacity-50';

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

  const [txInputs, setTxInputs] = useState<Record<string, string>>({});
  const [savingPaidId, setSavingPaidId] = useState<string | null>(null);
  const [markPaidError, setMarkPaidError] = useState<string | null>(null);
  const [copiedTxWinnerId, setCopiedTxWinnerId] = useState<string | null>(null);

  const [visibleTicketCount, setVisibleTicketCount] = useState(MAX_TODAY_TICKETS);
  const [visibleWinnerCount, setVisibleWinnerCount] = useState(MAX_RECENT_WINNERS);

  const visibleTickets = useMemo(
    () => tickets.slice(0, visibleTicketCount),
    [tickets, visibleTicketCount],
  );

  const visibleWinners = useMemo(
    () => winners.slice(0, visibleWinnerCount),
    [winners, visibleWinnerCount],
  );

  const [liveJackpotUsd, setLiveJackpotUsd] = useState<number | null>(null);

  const [countdownText, setCountdownText] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  const isWarningSoon = countdownSeconds !== null && countdownSeconds <= 15 * 60;
  const isWarningCritical = countdownSeconds !== null && countdownSeconds <= 5 * 60;

  const [bonusAmount, setBonusAmount] = useState('100000');
  const [bonusLabel, setBonusLabel] = useState('Bonus XPOT');
  const [bonusDelayMinutes, setBonusDelayMinutes] = useState<number>(30);
  const [bonusSubmitting, setBonusSubmitting] = useState(false);
  const [bonusError, setBonusError] = useState<string | null>(null);
  const [bonusSuccess, setBonusSuccess] = useState<string | null>(null);

  const [upcomingDrops, setUpcomingDrops] = useState<AdminBonusDrop[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [upcomingError, setUpcomingError] = useState<string | null>(null);

  const [nextBonusDrop, setNextBonusDrop] = useState<AdminBonusDrop | null>(null);
  const [nextBonusCountdown, setNextBonusCountdown] = useState<string | null>(null);

  const [pickError, setPickError] = useState<string | null>(null);
  const [pickSuccess, setPickSuccess] = useState<string | null>(null);
  const [isPickingWinner, setIsPickingWinner] = useState(false);
  const [isReopeningDraw, setIsReopeningDraw] = useState(false);

  const [creatingDraw, setCreatingDraw] = useState(false);

  const [cancelingDropId, setCancelingDropId] = useState<string | null>(null);
  const [cancelDropError, setCancelDropError] = useState<string | null>(null);

  // ── Load admin token ────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (stored) {
      setAdminToken(stored);
      setTokenAccepted(true);
    }
  }, []);

  // ── Fetch helpers ────────────────────────────
  async function authedFetch(input: string, init?: RequestInit) {
    if (!adminToken) throw new Error('NO_ADMIN_TOKEN');

    const res = await fetch(input, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        'x-xpot-admin-token': adminToken,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Request failed (${res.status}): ${body || res.statusText || 'Unknown error'}`,
      );
    }

    return res.json();
  }

  async function refreshUpcomingDrops() {
    setUpcomingLoading(true);
    setUpcomingError(null);
    try {
      const data = await authedFetch('/api/admin/bonus-upcoming');
      setUpcomingDrops((data as any).drops ?? []);
    } catch (err: any) {
      console.error('[ADMIN] refresh upcoming error', err);
      setUpcomingError(err?.message || 'Failed to load upcoming drops');
    } finally {
      setUpcomingLoading(false);
    }
  }

  // ── Manually create today’s draw (dev) ───────
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

  // ── Schedule bonus XPOT ─────────────────────
  async function handleScheduleBonus(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBonusError(null);
    setBonusSuccess(null);

    if (!adminToken) {
      setBonusError('Admin token missing. Unlock admin first.');
      return;
    }

    if (!todayDraw) {
      setBonusError(
        'No draw detected for today yet. Create today’s draw first or wait for auto-create.',
      );
      return;
    }

    if (todayDraw.status !== 'open') {
      setBonusError(
        'Today’s draw is not open. Bonus drops can only be scheduled for an open draw.',
      );
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
      })) as { drop?: AdminBonusDrop };

      const drop = data?.drop;
      setBonusSuccess(
        drop
          ? `Scheduled ${drop.label} · ${drop.amountXpot.toLocaleString()} XPOT.`
          : `Scheduled bonus XPOT.`,
      );

      await refreshUpcomingDrops();
    } catch (err: any) {
      console.error('[ADMIN] schedule bonus error', err);
      setBonusError(err?.message || 'Failed to schedule bonus XPOT.');
    } finally {
      setBonusSubmitting(false);
    }
  }

  // ── Cancel scheduled bonus drop ─────────────
  async function handleCancelBonusDrop(dropId: string) {
    setCancelDropError(null);

    if (!adminToken) {
      setCancelDropError('Admin token missing. Unlock admin first.');
      return;
    }

    setCancelingDropId(dropId);
    try {
      const data = await authedFetch(
        `/api/admin/bonus-cancel?id=${encodeURIComponent(dropId)}`,
        { method: 'POST' },
      );

      if (data && (data as any).ok === false) {
        throw new Error((data as any).error || 'Failed to cancel drop');
      }

      setUpcomingDrops(prev =>
        prev.map(d => (d.id === dropId ? { ...d, status: 'CANCELLED' } : d)),
      );
    } catch (err: any) {
      console.error('[ADMIN] cancel drop error', err);
      setCancelDropError(err?.message || 'Failed to cancel bonus drop.');
    } finally {
      setCancelingDropId(null);
    }
  }

  // ── Pick main winner (manual override) ───────
  async function handlePickMainWinner() {
    setPickError(null);
    setPickSuccess(null);

    if (!adminToken) {
      setPickError('Admin token missing. Unlock admin first.');
      return;
    }

    setIsPickingWinner(true);
    try {
      const data = await authedFetch('/api/admin/pick-winner', { method: 'POST' });

      const raw = (data as any).winner as any;
      if (!raw) throw new Error('No winner returned from API');

      const winner: AdminWinner = {
        ...raw,
        payoutUsd:
          raw.payoutUsd ?? raw.payoutXpot ?? raw.amountUsd ?? raw.amountXpot ?? 0,
      };

      setPickSuccess(
        `Main XPOT winner: ${winner.ticketCode} (${winner.walletAddress.slice(0, 4)}…${winner.walletAddress.slice(-4)}).`,
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

  // ── Panic reopen draw ───────────────────────
  async function handleReopenDraw() {
    setTodayDrawError(null);

    if (!adminToken) {
      alert('Admin token missing. Unlock admin first.');
      return;
    }

    setIsReopeningDraw(true);
    try {
      const data = await authedFetch('/api/admin/reopen-draw', { method: 'POST' });

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

  // ── Mark winner as paid ─────────────────────
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
        prev.map(w => (w.id === winnerId ? { ...w, isPaidOut: true, txUrl } : w)),
      );
    } catch (err: any) {
      setMarkPaidError(err.message || 'Failed to mark as paid');
    } finally {
      setSavingPaidId(null);
    }
  }

  // ── Load Today, tickets, winners, upcoming ──
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
        if (!cancelled) setTodayDrawError(err.message || 'Failed to load today');
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
        if (!cancelled) setTicketsError(err.message || 'Failed to load tickets');
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
        if (!cancelled) setWinnersError(err.message || 'Failed to load results');
      } finally {
        if (!cancelled) setWinnersLoading(false);
      }

      // Upcoming bonus drops
      setUpcomingLoading(true);
      setUpcomingError(null);
      try {
        const data = await authedFetch('/api/admin/bonus-upcoming');
        if (!cancelled) setUpcomingDrops((data as any).drops ?? []);
      } catch (err: any) {
        console.error('[ADMIN] /bonus-upcoming error', err);
        if (!cancelled)
          setUpcomingError(err?.message || 'Failed to load upcoming drops');
      } finally {
        if (!cancelled) setUpcomingLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  // ── Main countdown (closesAt) ───────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!todayDraw?.closesAt) {
      setCountdownText(null);
      setCountdownSeconds(null);
      return;
    }

    const targetTime = new Date(todayDraw.closesAt).getTime();

    function updateCountdown() {
      const diffMs = targetTime - Date.now();
      let totalSeconds = Math.floor(diffMs / 1000);
      if (totalSeconds <= 0) totalSeconds = 0;

      setCountdownSeconds(totalSeconds);

      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      const seconds = String(totalSeconds % 60).padStart(2, '0');
      setCountdownText(`${hours}:${minutes}:${seconds}`);
    }

    updateCountdown();
    const id = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(id);
  }, [todayDraw?.closesAt]);

  // ── Next bonus countdown ────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!upcomingDrops || upcomingDrops.length === 0) {
      setNextBonusDrop(null);
      setNextBonusCountdown(null);
      return;
    }

    const scheduled = upcomingDrops.filter(d => d.status === 'SCHEDULED');
    if (scheduled.length === 0) {
      setNextBonusDrop(null);
      setNextBonusCountdown(null);
      return;
    }

    const next = scheduled.reduce<AdminBonusDrop | null>((acc, d) => {
      if (!acc) return d;
      return new Date(d.scheduledAt).getTime() < new Date(acc.scheduledAt).getTime()
        ? d
        : acc;
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
      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      const seconds = String(totalSeconds % 60).padStart(2, '0');
      setNextBonusCountdown(`${hours}:${minutes}:${seconds}`);
    }

    updateCountdown();
    const id = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(id);
  }, [upcomingDrops]);

  useEffect(() => {
    setVisibleTicketCount(prev => Math.min(prev, tickets.length || MAX_TODAY_TICKETS));
  }, [tickets.length]);

  function handleLoadMoreTickets() {
    setVisibleTicketCount(prev => Math.min(prev + MAX_TODAY_TICKETS, tickets.length));
  }

  useEffect(() => {
    setVisibleWinnerCount(prev => {
      if (winners.length === 0) return 0;
      if (winners.length <= MAX_RECENT_WINNERS) return winners.length;
      if (prev && prev > 0) return Math.min(prev, winners.length);
      return MAX_RECENT_WINNERS;
    });
  }, [winners.length]);

  function handleLoadMoreWinners() {
    setVisibleWinnerCount(prev => Math.min(prev + MAX_RECENT_WINNERS, winners.length));
  }

  // ── Admin token handling ────────────────────
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

  const DAY_MS = 24 * 60 * 60 * 1000;
  const closesAtDate = todayDraw?.closesAt ? new Date(todayDraw.closesAt) : null;
  const now = new Date();

  let drawDateLabel = 'Draw date';
  let drawDateValue: Date | null = todayDraw?.date ? new Date(todayDraw.date) : null;

  if (closesAtDate && now >= closesAtDate) {
    drawDateLabel = 'Next draw date';
    drawDateValue = new Date(closesAtDate.getTime() + DAY_MS);
  }

  return (
    <XpotPageShell title="Operations Center" subtitle="Control room for today’s XPOT">
      <div className="relative">
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

        <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {/* Header */}
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="inline-flex items-center gap-2">
                <XpotLogoAnimated />
              </Link>
              <span className="rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                Operations center
              </span>
            </div>

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
                securely gated behind your admin key.
              </p>
            </div>
          </header>

          {/* Admin key band */}
          <section className="relative mt-5 rounded-3xl">
            <div className="pointer-events-none absolute -inset-20 bg-[radial-gradient(circle_at_10%_0%,rgba(79,70,229,0.28),transparent_55%),radial-gradient(circle_at_80%_120%,rgba(236,72,153,0.24),transparent_58%)] opacity-70 blur-3xl" />

            <div className="relative rounded-3xl border border-slate-900/70 bg-gradient-to-r from-[#050816]/90 via-[#050816]/80 to-[#050816]/90 shadow-[0_22px_70px_rgba(15,23,42,0.85)]">
              <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                      Paste your private admin key to unlock XPOT operations.
                    </span>
                  </div>

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

          {/* Main grid */}
          <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            {/* LEFT */}
            <div className="space-y-4">
              {/* XPOT CARD */}
              <section
                className="
                  relative overflow-hidden rounded-[30px]
                  border border-slate-900/70
                  bg-transparent
                  shadow-[0_32px_110px_rgba(15,23,42,0.85)]
                  backdrop-blur-xl
                "
              >
                <div
                  className="
                    pointer-events-none absolute -inset-28
                    bg-[radial-gradient(circle_at_5%_0%,rgba(59,130,246,0.40),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(129,140,248,0.40),transparent_58%)]
                    opacity-85
                  "
                />

                <div className="relative z-10 space-y-5 px-5 py-5 sm:px-6 sm:py-6">
                  <JackpotPanel
                    isLocked={isDrawLocked}
                    onJackpotUsdChange={setLiveJackpotUsd}
                    variant="embedded"
                  />

                  <div className="mt-4 border-t border-slate-800/80" />

                  <div className="pt-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">
                          Today&apos;s round
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Live overview of today&apos;s XPOT draw, entries,
                          rollovers and prize pool.
                        </p>
                      </div>

                      {todayDraw && (
                        <div className="flex flex-col items-end gap-1 text-xs">
                          <span className="text-slate-500">{drawDateLabel}</span>
                          <span className="font-mono text-slate-200">
                            {drawDateValue ? formatDate(drawDateValue) : '–'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid gap-4 text-sm sm:grid-cols-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                          Round status
                        </p>
                        <p className="mt-1 inline-flex items-center gap-2 font-semibold text-slate-100">
                          {todayLoading && <span>Loading...</span>}
                          {todayDraw && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
                                todayDraw.status === 'open'
                                  ? 'bg-emerald-500/10 text-emerald-300'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {todayDraw.status.toUpperCase()}
                            </span>
                          )}
                          {!todayLoading && !todayDraw && (
                            <span className="text-xs font-normal text-amber-300">
                              No XPOT round detected for today - backend should
                              create this automatically.
                            </span>
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                          Entries in pool
                        </p>
                        <p className="mt-1 font-mono text-slate-100">
                          {todayLoading ? '–' : todayDraw?.ticketsCount ?? 0}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                          Rollover amount
                        </p>
                        <div className="mt-1">
                          <UsdPill amount={todayDraw?.rolloverUsd ?? 0} size="sm" />
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                          Today&apos;s XPOT (live)
                        </p>
                        <div className="mt-1">
                          <UsdPill amount={liveJackpotUsd} size="sm" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[24px] bg-slate-950/90 px-3 py-3 text-xs text-slate-500">
                      {todayDrawError && <p className="text-amber-300">{todayDrawError}</p>}

                      {!todayDrawError && !todayLoading && todayDraw && todayDraw.closesAt && (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm sm:text-base">
                              <span className="text-xs uppercase tracking-wide text-slate-500">
                                Closes in
                              </span>
                              <span
                                className={`
                                  ml-2 mt-2 font-mono text-2xl font-semibold transition-all
                                  ${
                                    isWarningCritical
                                      ? 'rounded-lg bg-amber-500/10 px-2 py-0.5 text-amber-300 animate-pulse'
                                      : isWarningSoon
                                      ? 'rounded-lg bg-amber-500/5 px-2 py-0.5 text-amber-400'
                                      : 'text-emerald-300'
                                  }
                                `}
                              >
                                {countdownText}
                              </span>
                            </p>
                          </div>

                          <div className="flex flex-col items-stretch gap-2 sm:items-end">
                            {!AUTO_DRAW_ENABLED && (
                              <button
                                type="button"
                                disabled={
                                  isPickingWinner ||
                                  !adminToken ||
                                  todayLoading ||
                                  !todayDraw ||
                                  todayDraw.status !== 'open'
                                }
                                onClick={handlePickMainWinner}
                                className={`
                                  ${BTN_PRIMARY} px-7 py-3 text-sm transition-all ease-out duration-300
                                  ${isWarningCritical ? 'ring-2 ring-amber-400/40 shadow-lg scale-[1.02]' : ''}
                                `}
                              >
                                {isPickingWinner ? 'Picking winner…' : 'Crown today’s XPOT winner'}
                              </button>
                            )}

                            {AUTO_DRAW_ENABLED && (
                              <div className="flex flex-col items-end text-right">
                                <span
                                  className="
                                    inline-flex items-center gap-2
                                    rounded-full border border-sky-400/70
                                    bg-sky-500/10 px-4 py-1.5
                                    text-[10px] font-semibold uppercase tracking-[0.2em]
                                    text-sky-100 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]
                                  "
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.9)] animate-pulse" />
                                  Auto draw enabled
                                </span>
                                <span className="mt-1 text-[11px] text-slate-400">
                                  Manual crown button is disabled while auto-draw is active.
                                </span>
                              </div>
                            )}

                            {todayDraw &&
                              todayDraw.status === 'closed' &&
                              adminToken &&
                              !AUTO_DRAW_ENABLED && (
                                <button
                                  type="button"
                                  onClick={handleReopenDraw}
                                  disabled={isReopeningDraw}
                                  className={
                                    BTN_DANGER +
                                    ' px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]'
                                  }
                                >
                                  {isReopeningDraw ? 'Reopening…' : '🚨 Emergency reopen draw'}
                                </button>
                              )}
                          </div>
                        </div>
                      )}

                      {!todayDrawError && !todayLoading && !todayDraw && (
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-slate-400 text-xs">
                            No XPOT draw scheduled yet. The backend should auto-create one shortly.
                          </p>

                          {isDevHost && (
                            <button
                              type="button"
                              onClick={handleCreateTodayDraw}
                              disabled={creatingDraw || !adminToken}
                              className="inline-flex items-center justify-center rounded-full border border-emerald-500/70 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {creatingDraw ? 'Creating today’s draw…' : 'Create today’s draw (dev)'}
                            </button>
                          )}
                        </div>
                      )}

                      {(pickError || pickSuccess) && (
                        <div className="mt-2 text-xs">
                          {pickError && <p className="text-amber-300">{pickError}</p>}
                          {pickSuccess && <p className="text-emerald-300">{pickSuccess}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Schedule bonus XPOT */}
              <section
                className="
                  relative overflow-hidden rounded-3xl
                  border border-slate-900/70
                  bg-transparent
                  px-4 py-4
                  shadow-[0_20px_60px_rgba(15,23,42,0.85)]
                  backdrop-blur-xl
                "
              >
                <div
                  className="
                    pointer-events-none absolute inset-0
                    bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.22),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(236,72,153,0.22),transparent_55%)]
                    opacity-70
                  "
                />

                <div className="relative flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-50">Schedule bonus XPOT</p>
                      <p className="mt-1 max-w-xl text-xs text-slate-400">
                        Line up hype bonuses from today&apos;s ticket pool. At the scheduled time, one extra winner will be picked from all tickets in the draw.
                      </p>
                    </div>

                    <div className="flex flex-col items-end text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      <span className="rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1">
                        Manual schedule - Off-chain
                      </span>
                    </div>
                  </div>

                  <form
                    onSubmit={handleScheduleBonus}
                    className="mt-2 grid gap-6 md:grid-cols-[minmax(0,1.4fr)_280px]"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.16em] text-slate-500">
                          Amount
                        </label>

                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={100000}
                              step={1000}
                              className="h-10 w-32 rounded-xl border border-slate-700 bg-slate-900/80 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-400/80"
                              value={bonusAmount}
                              onChange={e => setBonusAmount(e.target.value)}
                            />
                            <span className="text-xs text-slate-400">XPOT</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                          Quick presets
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[100_000, 250_000, 500_000, 1_000_000].map(v => {
                            const isActive = Number(bonusAmount) === v;
                            return (
                              <button
                                key={v}
                                type="button"
                                onClick={() => setBonusAmount(String(v))}
                                className={`h-9 rounded-full px-4 text-xs font-medium ${
                                  isActive
                                    ? 'border border-emerald-400/70 bg-emerald-500/15 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.3)]'
                                    : 'border border-slate-700/70 bg-slate-900/80 text-slate-300 hover:border-slate-500'
                                }`}
                              >
                                {v.toLocaleString()} XPOT
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full flex-col justify-between gap-3">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="block text-[10px] uppercase tracking-[0.16em] text-slate-500">
                            Label
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-400/80"
                            value={bonusLabel}
                            onChange={e => setBonusLabel(e.target.value)}
                            placeholder="Bonus XPOT"
                          />
                          <p className="text-[11px] text-slate-500">
                            Shown in the winners log so you can tell hype bonuses apart from the main XPOT.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                            Timer
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {[5, 15, 30, 60].map(mins => {
                              const isActive = bonusDelayMinutes === mins;
                              return (
                                <button
                                  key={mins}
                                  type="button"
                                  onClick={() => setBonusDelayMinutes(mins)}
                                  className={`h-8 rounded-full px-3 text-[11px] font-medium ${
                                    isActive
                                      ? 'border border-sky-400/70 bg-sky-500/15 text-sky-200 shadow-[0_0_0_1px_rgba(56,189,248,0.35)]'
                                      : 'border border-slate-700/70 bg-slate-900/80 text-slate-300 hover:border-slate-500'
                                  }`}
                                >
                                  {mins < 60 ? `${mins} min` : `${mins / 60} h`}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button
                          type="submit"
                          disabled={bonusSubmitting || !todayDraw || todayDraw.status !== 'open'}
                          className="
                            h-11 w-full rounded-full
                            bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-700
                            text-emerald-50 text-sm font-semibold
                            ring-1 ring-emerald-400/25
                            shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_6px_14px_rgba(16,185,129,0.28)]
                            hover:brightness-105 hover:shadow-[0_10px_20px_rgba(16,185,129,0.35)]
                            transition-all
                            disabled:opacity-50 disabled:cursor-not-allowed
                          "
                        >
                          {bonusSubmitting ? 'Scheduling bonus…' : 'Schedule bonus XPOT'}
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="mt-3 min-h-[1.25rem] text-xs">
                    {bonusError && <p className="text-amber-300">{bonusError}</p>}
                    {bonusSuccess && <p className="text-emerald-300">{bonusSuccess}</p>}
                  </div>

                  <div className="mt-3 border-t border-slate-800/80 pt-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Upcoming bonus drops
                      </p>

                      <button
                        type="button"
                        onClick={refreshUpcomingDrops}
                        disabled={upcomingLoading}
                        className={`${BTN_UTILITY} px-3 py-1 text-[11px]`}
                      >
                        {upcomingLoading ? 'Refreshing…' : 'Refresh'}
                      </button>
                    </div>

                    {nextBonusDrop && nextBonusCountdown && !upcomingLoading && !upcomingError && (
                      <div className="mt-2 flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/80 px-3 py-2 text-[11px]">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                            Next bonus XPOT fires in
                          </span>
                          <span className="mt-1 text-xs text-slate-300">
                            {nextBonusDrop.label} · {nextBonusDrop.amountXpot.toLocaleString()} XPOT
                          </span>
                        </div>
                        <span className="font-mono text-lg font-semibold text-emerald-300">
                          {nextBonusCountdown}
                        </span>
                      </div>
                    )}

                    {upcomingLoading && (
                      <p className="mt-1 text-[11px] text-slate-500">Loading bonus schedule…</p>
                    )}

                    {upcomingError && (
                      <p className="mt-1 text-[11px] text-amber-300">{upcomingError}</p>
                    )}

                    {cancelDropError && (
                      <p className="mt-1 text-[11px] text-amber-300">{cancelDropError}</p>
                    )}

                    {!upcomingLoading && !upcomingError && upcomingDrops.length === 0 && (
                      <p className="mt-1 text-[11px] text-slate-500">No bonus drops scheduled yet.</p>
                    )}

                    {!upcomingLoading && !upcomingError && upcomingDrops.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {upcomingDrops.map(d => {
                          const isScheduled = d.status === 'SCHEDULED';
                          const isCancelled = d.status === 'CANCELLED';
                          const isFired = d.status === 'FIRED';

                          return (
                            <div
                              key={d.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/70 px-3 py-2 text-[11px]"
                            >
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-slate-100">{d.label}</span>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
                                      isScheduled
                                        ? 'bg-emerald-500/12 text-emerald-300'
                                        : isFired
                                        ? 'bg-sky-500/10 text-sky-200'
                                        : 'bg-slate-800/70 text-slate-300'
                                    }`}
                                  >
                                    {d.status}
                                  </span>
                                </div>
                                <span className="font-mono text-slate-400">
                                  {formatDateTime(d.scheduledAt)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-200">
                                  {d.amountXpot.toLocaleString()} XPOT
                                </span>

                                {isScheduled && (
                                  <button
                                    type="button"
                                    onClick={() => handleCancelBonusDrop(d.id)}
                                    disabled={cancelingDropId === d.id}
                                    className={`${BTN_DANGER} px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]`}
                                  >
                                    {cancelingDropId === d.id ? 'Cancelling…' : 'Cancel'}
                                  </button>
                                )}

                                {isCancelled && (
                                  <span className="text-slate-500 text-[10px] uppercase tracking-[0.16em]">
                                    Cancelled
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Today’s entries */}
              <section
                className="
                  rounded-[30px]
                  border border-slate-900/70
                  bg-transparent
                  px-4 py-4
                  shadow-[0_18px_60px_rgba(15,23,42,0.85)]
                  backdrop-blur-xl
                "
              >
                <p className="text-sm font-semibold text-slate-100">Today&apos;s XPOT entries</p>
                <p className="mt-1 text-xs text-slate-400">
                  Every entry that has been issued for the current XPOT round.
                </p>

                <div className="mt-3">
                  {ticketsLoading && <p className="text-xs text-slate-500">Loading tickets…</p>}
                  {ticketsError && <p className="text-xs text-amber-300">{ticketsError}</p>}

                  {!ticketsLoading && !ticketsError && visibleTickets.length === 0 && (
                    <p className="rounded-2xl bg-slate-950/90 px-3 py-2 text-xs text-slate-500">
                      No entries yet for today&apos;s XPOT.
                    </p>
                  )}

                  {!ticketsLoading && !ticketsError && visibleTickets.length > 0 && (
                    <div className="mt-2 border-t border-slate-800/80">
                      {visibleTickets.map(t => (
                        <div
                          key={t.id}
                          className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 py-3 text-xs first:border-t-0"
                        >
                          <div className="space-y-0.5">
                            <p className="font-mono text-[11px] text-slate-100">{t.code}</p>
                            <CopyableWallet address={t.walletAddress} />
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-200">
                              {t.status.replace('-', ' ').toUpperCase()}
                            </span>
                            <p className="font-mono text-[11px] text-slate-500">
                              {formatDateTime(t.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}

                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <p>
                          Showing {visibleTickets.length} of {tickets.length} tickets
                        </p>

                        {visibleTickets.length < tickets.length && (
                          <button
                            type="button"
                            onClick={handleLoadMoreTickets}
                            className={`${BTN_UTILITY} px-3 py-1 text-[11px]`}
                          >
                            Load more
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* RIGHT */}
            <div className="w-full space-y-4 lg:max-w-[640px]">
              <section
                className="
                  relative overflow-hidden rounded-[24px]
                  border border-slate-900/70
                  bg-transparent
                  px-5 py-5
                  shadow-[0_18px_60px_rgba(15,23,42,0.85)]
                  backdrop-blur-xl
                "
              >
                <div className="relative mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-white tracking-wide">
                      Recent XPOT winners
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Internal log of executed rewards, payouts and winner tickets.
                    </p>
                  </div>
                </div>

                <div className="relative">
                  {winnersLoading && <p className="text-xs text-slate-500">Loading records…</p>}
                  {winnersError && <p className="text-xs text-amber-300">{winnersError}</p>}

                  {!winnersLoading && !winnersError && winners.length === 0 && (
                    <p className="rounded-2xl bg-slate-900/70 px-4 py-3 text-xs text-slate-500">
                      No completed draws yet. Once you pick winners and mark XPOT as paid, they&apos;ll appear here.
                    </p>
                  )}

                  {!winnersLoading && !winnersError && visibleWinners.length > 0 && (
                    <>
                      <div className="mt-1 divide-y divide-slate-800/70 border-t border-slate-800/80">
                        {visibleWinners.map(w => {
                          const label = formatWinnerLabel(w);
                          const isMain = w.kind === 'main' || label === 'Main XPOT';
                          const displayXpot = isMain ? MAIN_XPOT_REWARD : w.payoutUsd;

                          return (
                            <article key={w.id} className="group flex flex-col gap-2 py-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-mono text-[11px] text-slate-200">{w.ticketCode}</p>

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

                                  <span className="text-[11px] text-slate-500">{formatDate(w.date)}</span>
                                </div>
                              </div>

                              <CopyableWallet address={w.walletAddress} />

                              <div className="mt-2 flex items-center justify-between gap-3">
                                <XpotPill amount={displayXpot} />

                                {w.isPaidOut ? (
                                  w.txUrl && (
                                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-sky-300">
                                      <span className="font-semibold">Reward sent</span>
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
                                            await navigator.clipboard.writeText(w.txUrl!);
                                            setCopiedTxWinnerId(w.id);
                                            setTimeout(() => setCopiedTxWinnerId(null), 1200);
                                          } catch {
                                            // ignore
                                          }
                                        }}
                                        className="rounded-full border border-sky-400/40 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-sky-200 hover:bg-sky-500/10"
                                      >
                                        {copiedTxWinnerId === w.id ? 'Copied' : 'Copy TX'}
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
                                        setTxInputs(prev => ({ ...prev, [w.id]: e.target.value }))
                                      }
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleMarkAsPaid(w.id)}
                                      disabled={savingPaidId === w.id}
                                      className={`${BTN_UTILITY} px-4 py-1.5 text-[11px]`}
                                    >
                                      {savingPaidId === w.id ? 'Saving…' : 'Mark as paid'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>

                      {markPaidError && <p className="mt-2 text-xs text-amber-300">{markPaidError}</p>}

                      <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs text-slate-400">
                        <p>
                          Showing latest {visibleWinners.length} of {winners.length}
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

        {/* ULTRA PREMIUM LOCK MODAL */}
        {!tokenAccepted && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-md">
            <div
              className="
                relative w-full max-w-md rounded-3xl border border-slate-700/70
                bg-gradient-to-b from-[#020617] via-[#020617] to-black
                px-6 py-6 sm:px-8 sm:py-8
                shadow-[0_0_80px_rgba(15,23,42,0.9)]
              "
            >
              <div className="pointer-events-none absolute -inset-10 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.4),transparent_55%),radial-gradient(circle_at_bottom,_rgba(168,85,247,0.35),transparent_55%)] opacity-70 blur-3xl" />

              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <XpotLogoAnimated width={110} height={32} />
                  <span
                    className="
                      rounded-full border border-slate-700/70 bg-slate-950/80
                      px-3 py-1 text-[9px] uppercase tracking-[0.22em]
                      text-slate-300
                    "
                  >
                    Operations Center
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-50">
                    Unlock XPOT operations center
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Step inside the live XPOT control deck. Monitor today&apos;s round, entries, wallets and reward execution - secured behind your private{' '}
                    <span className="font-semibold text-slate-200">admin key</span>.
                  </p>
                </div>

                <form onSubmit={handleUnlock} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      Admin key
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        autoFocus
                        className="
                          w-full rounded-2xl border border-slate-700/80 bg-slate-950/90
                          px-4 py-3 pr-20 text-sm text-slate-100
                          placeholder:text-slate-600
                          outline-none focus:border-emerald-400/80
                        "
                        value={tokenInput}
                        onChange={e => setTokenInput(e.target.value)}
                        placeholder="Paste your secret XPOT admin key…"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[10px] uppercase tracking-[0.18em] text-slate-500">
                        Secured
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Your key is stored locally in this browser only.
                    </p>
                    <p className="text-[10px] text-slate-500">
                      <span className="font-semibold text-slate-300">Never share your admin key</span> - it unlocks full XPOT operations.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingToken || !tokenInput.trim()}
                    className="
                      inline-flex w-full items-center justify-center
                      rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600
                      px-4 py-3 text-sm font-semibold text-emerald-50
                      shadow-[0_18px_45px_rgba(16,185,129,0.45)]
                      ring-1 ring-emerald-400/40
                      transition-all hover:brightness-105 hover:shadow-[0_22px_60px_rgba(16,185,129,0.6)]
                      disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none
                    "
                  >
                    {isSavingToken ? 'Verifying key…' : 'Unlock admin view'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </XpotPageShell>
  );
}
