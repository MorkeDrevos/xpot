// app/admin/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, FormEvent } from 'react';

import JackpotPanel from '@/components/JackpotPanel';
import Image from 'next/image';
import Link from 'next/link';

const MAX_TODAY_TICKETS = 10; // how many “Today’s XPOT entries” to show
const MAX_RECENT_WINNERS = 9; // how many “Recent XPOT winners” to show

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
    'inline-flex items-center justify-center h-[30px] rounded-full bg-slate-900/70 border border-slate-700/60 text-sky-200 font-semibold shadow-inner hover:shadow-[0_0_6px_rgba(56,189,248,0.15)] transition';
  const cls =
    size === 'sm'
      ? `${base} px-3 text-[11px]`
      : `${base} px-4 text-sm`;

  return (
    <span className={cls}>
      <span className="font-mono text-[0.92em]">{value}</span>
      <span className="ml-1 text-[0.7em] uppercase tracking-[0.16em] text-slate-400">
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
}: {
  amount: number | null | undefined;
}) {
  const value = formatXpot(amount);

  const base =
    'inline-flex items-baseline rounded-full bg-slate-950 text-slate-100 font-medium border border-white/10 px-3 py-0.5 text-xs shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]';

  return (
    <span className={base}>
      <span className="font-mono text-[0.92em] tracking-wide">
        {value}
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
      <span className="text-xs text-slate-500 font-mono">
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
      className="group inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-300 transition-colors"
    >
      <span className="font-mono">{truncateAddress(address, 6)}</span>
      <span className="rounded-md border border-slate-600/60 px-1 py-[1px] text-[10px] uppercase tracking-wide group-hover:border-emerald-400/60">
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────
// Button styles (control room system)
// ─────────────────────────────────────────────

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:opacity-40 disabled:cursor-not-allowed';

const BTN_SECONDARY =
  'inline-flex items-center justify-center rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition';

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
  const [copiedTxWinnerId, setCopiedTxWinnerId] = useState<string | null>(null);

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

  // Bonus jackpot form
  const [bonusAmount, setBonusAmount] = useState('100000');
  const [bonusLabel, setBonusLabel] = useState('Bonus XPOT');
  const [bonusSubmitting, setBonusSubmitting] = useState(false);
  const [bonusError, setBonusError] = useState<string | null>(null);
  const [bonusSuccess, setBonusSuccess] = useState<string | null>(null);

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
        Authorization: `Bearer ${adminToken}`,
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

      if (!data || data.ok === false) {
        throw new Error(data?.error || 'Failed to create today’s draw');
      }

      window.location.reload();
    } catch (err: any) {
      console.error('[XPOT] create today draw error:', err);
      alert(err.message || 'Unexpected error creating today’s round');
    } finally {
      setCreatingDraw(false);
    }
  }

  // ── Drop bonus XPOT (bonus winner) ─────────────────────────

  async function handleDropBonus(e: FormEvent) {
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

    setBonusSubmitting(true);
    try {
      const res = await authedFetch('/api/admin/bonus', {
        method: 'POST',
        body: JSON.stringify({
          amountUsd: amountNumber,
          label: bonusLabel || 'Bonus XPOT',
        }),
      });

      const raw = res.reward as any;

      // Normalise reward amount (XPOT amount)
      const rewardAmount =
        raw?.payoutUsd ??
        raw?.payoutXpot ??
        raw?.amountXpot ??
        raw?.amountUsd ??
        raw?.amount ??
        0;

      const xpotAmount = formatXpot(rewardAmount);

      // Optional X handle if backend sends it
      const xHandle: string | undefined =
        raw?.xHandle ||
        raw?.handle ||
        raw?.user?.xHandle ||
        raw?.user?.handle;

      const wallet = raw?.walletAddress || '';
      const shortWallet =
        wallet && wallet.length > 8
          ? `${wallet.slice(0, 4)}…${wallet.slice(-4)}`
          : wallet || '(unknown wallet)';

      const handlePart = xHandle ? ` @${xHandle}` : '';

      setBonusSuccess(
        `Bonus ${xpotAmount} sent to ${raw.ticketCode}${handlePart} (${shortWallet}).`,
      );

      // refresh winners list
      try {
        const winnersData = await authedFetch('/api/admin/winners');
        setWinners(winnersData.winners ?? []);
      } catch {
        // ignore refresh failure
      }
    } catch (err: any) {
      setBonusError(err.message || 'Failed to drop bonus XPOT');
    } finally {
      setBonusSubmitting(false);
    }
  }

  // ── Pick main XPOT winner ─────────────────────────────────

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

      const raw = data.winner as any;
      if (!raw) throw new Error('No winner returned from API');

      // 🔧 Normalise shape so payoutUsd is always present
      const winner: AdminWinner = {
        ...raw,
        payoutUsd:
          raw.payoutUsd ??
          raw.payoutXpot ?? // common backend name
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

      // 🔄 Refresh winners from canonical endpoint so UI matches after reload
      try {
        const winnersData = await authedFetch('/api/admin/winners');
        setWinners(winnersData.winners ?? []);
      } catch (err) {
        console.error('[ADMIN] refresh winners after pick error', err);
        // fallback: at least show the locally picked winner
        setWinners((prev) => [winner, ...prev]);
      }

      // Close today’s draw in local state
      setTodayDraw((prev) => (prev ? { ...prev, status: 'closed' } : prev));
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

      if (!data || data.ok === false) {
        throw new Error(data?.error || 'Failed to reopen draw');
      }

      setTodayDraw((prev) => (prev ? { ...prev, status: 'open' } : prev));
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

      if (data && data.ok === false) {
        throw new Error(data.error || 'Failed to mark as paid');
      }

      setWinners((prev) =>
        prev.map((w) =>
          w.id === winnerId ? { ...w, isPaidOut: true, txUrl } : w,
        ),
      );
    } catch (err: any) {
      setMarkPaidError(err.message || 'Failed to mark as paid');
    } finally {
      setSavingPaidId(null);
    }
  }

  // ── Load Today, tickets, winners when token is ready ──────────

  useEffect(() => {
    if (!adminToken) return;

    let cancelled = false;

    async function loadAll() {
      // Today
      setTodayLoading(true);
      setTodayDrawError(null);
      try {
        const data = await authedFetch('/api/admin/today');
        if (!cancelled) setTodayDraw(data.today ?? null);
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
        if (!cancelled) setTickets(data.tickets ?? []);
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
        if (!cancelled) setWinners(data.winners ?? []);
      } catch (err: any) {
        console.error('[ADMIN] /winners error', err);
        if (!cancelled) {
          setWinnersError(err.message || 'Failed to load results');
        }
      } finally {
        if (!cancelled) setWinnersLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [adminToken]);

  // ── Countdown until todayDraw.closesAt (daily loop) ───────────

  useEffect(() => {
    if (!todayDraw?.closesAt) {
      setCountdownText(null);
      setCountdownSeconds(null);
      return;
    }

    const closesAt = new Date(todayDraw.closesAt);
    const DAY_MS = 24 * 60 * 60 * 1000;

    function updateCountdown() {
      const now = new Date();

      let target = closesAt;
      let diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        target = new Date(closesAt.getTime() + DAY_MS);
        diff = target.getTime() - now.getTime();
      }

      const totalSeconds = Math.max(0, Math.floor(diff / 1000));
      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const minutes = String(
        Math.floor((totalSeconds % 3600) / 60),
      ).padStart(2, '0');
      const seconds = String(totalSeconds % 60).padStart(2, '0');

      setCountdownText(`${hours}:${minutes}:${seconds}`);
      setCountdownSeconds(totalSeconds);
    }

    updateCountdown();
    const id = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(id);
  }, [todayDraw?.closesAt]);

  // Clamp visibleTicketCount if tickets shrink / first load

  useEffect(() => {
    setVisibleTicketCount((prev) =>
      Math.min(prev, tickets.length || MAX_TODAY_TICKETS),
    );
  }, [tickets.length]);

  function handleLoadMoreTickets() {
    setVisibleTicketCount((prev) =>
      Math.min(prev + MAX_TODAY_TICKETS, tickets.length),
    );
  }

  // Clamp visibleWinnerCount when winners list changes

  useEffect(() => {
    setVisibleWinnerCount((prev) => {
      if (winners.length === 0) return 0;
      if (winners.length <= MAX_RECENT_WINNERS) return winners.length;
      if (prev && prev > 0) return Math.min(prev, winners.length);
      return MAX_RECENT_WINNERS;
    });
  }, [winners.length]);

  function handleLoadMoreWinners() {
    setVisibleWinnerCount((prev) =>
      Math.min(prev + MAX_RECENT_WINNERS, winners.length),
    );
  }

  // ── Admin token handling ──────────────────────────────────────

  async function handleUnlock(e: any) {
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
  let drawDateValue: Date | string | null = todayDraw?.date ?? null;

  if (closesAtDate && now >= closesAtDate) {
    drawDateLabel = 'Next draw date';
    const next = new Date(closesAtDate.getTime() + DAY_MS);
    drawDateValue = next;
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-4 px-4 pt-0 pb-8 text-slate-100 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/img/xpot-logo-light.png"
              alt="XPOT"
              priority
              className="h-20 w-auto drop-shadow-[0_0_26px_rgba(52,211,153,0.45)] sm:h-24 lg:h-28 xl:h-32"
            />
          </Link>
          <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-300">
            OPERATIONS CENTER
          </span>
        </div>

        <div className="flex flex-col items-start gap-1 sm:items-end">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-white sm:text-base">
              Control room for today&apos;s XPOT.
            </h1>

            {isDevHost && (
              <span className="rounded-full border border-amber-400/60 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                Dev environment
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-500">
            Monitor pool state, entries and rewards. All data is live and
            admin-key gated.
          </p>
        </div>
      </header>

      {/* Admin key card */}
      <section className="relative rounded-3xl">
        {/* Glow background */}
        <div className="pointer-events-none absolute -inset-8 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.25),transparent_45%),radial-gradient(circle_at_80%_100%,rgba(56,189,248,0.25),transparent_45%)] opacity-70 blur-2xl" />

        {/* Glass card */}
        <div className="relative rounded-3xl border border-white/5 bg-black/40 px-5 py-4 shadow-[0_0_60px_rgba(99,102,241,0.15)] backdrop-blur-xl sm:flex sm:items-center sm:justify-between sm:gap-4">
          {/* Left copy */}
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold tracking-wide text-white">
              Admin key
            </p>

            <p
              className={`text-xs leading-relaxed ${
                tokenAccepted ? 'text-sky-300' : 'text-slate-400'
              }`}
            >
              Enter your admin token to unlock XPOT operations.
              {tokenAccepted && ' Access level confirmed.'}
            </p>
          </div>

          {/* Right input + buttons */}
          <form
            onSubmit={handleUnlock}
            className="mt-3 flex w-full gap-2 sm:mt-0 sm:max-w-md"
          >
            <input
              type="password"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-400"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste admin token…"
            />

            <button
              type="submit"
              disabled={isSavingToken || !tokenInput.trim()}
              className={`${BTN_UTILITY} px-4 py-2 text-xs whitespace-nowrap`}
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
          </form>
        </div>
      </section>

      {/* Main grid: left (XPOT + summary + entries), right (winners) */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)]">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* Big live XPOT card */}
          <div
            className={`jackpot-shell ${
              isWarningCritical
                ? 'animate-[jackpotPulse_1.5s_ease-in-out_infinite]'
                : ''
            }`}
          >
            <div className="jackpot-shell-inner py-6 lg:py-8">
              <JackpotPanel
                isLocked={isDrawLocked}
                onJackpotUsdChange={setLiveJackpotUsd}
              />
            </div>
          </div>

          {/* Today’s XPOT summary card */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-xl">
                <p className="text-sm font-semibold text-slate-100">
                  Today&apos;s round
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Live overview of today&apos;s XPOT draw, entries, rollovers
                  and prize pool.
                </p>
              </div>

              {/* Date / next draw – always rendered so the header stays balanced */}
              <div className="flex flex-col items-start text-xs sm:items-end">
                <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  {drawDateLabel}
                </span>
                <span className="mt-0.5 font-mono text-slate-200">
                  {todayDraw && drawDateValue
                    ? formatDate(drawDateValue)
                    : '–'}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  Round status
                </p>
                <div className="mt-1 inline-flex items-center gap-2 font-semibold text-slate-100">
                  {todayLoading && <span>Loading...</span>}
                  {todayDraw && (
                    <span
                      className={`inline-flex h-[30px] items-center justify-center rounded-full px-3 text-[11px] uppercase tracking-[0.16em] ${
                        todayDraw.status === 'open'
                          ? 'border border-slate-600/50 bg-slate-800 text-slate-200'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {todayDraw.status.toUpperCase()}
                    </span>
                  )}
                  {!todayLoading && !todayDraw && (
                    <span className="text-xs font-normal text-amber-300">
                      No XPOT round detected for today – backend should create
                      this automatically.
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  Entries in pool
                </p>
                <div className="mt-1">
                  <span className="inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1 text-[11px] font-mono tracking-wide text-slate-100">
                    {todayLoading ? '–' : todayDraw?.ticketsCount ?? 0}
                  </span>
                </div>
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

            <div className="mt-4 rounded-xl bg-slate-950/90 px-3 py-3 text-xs text-slate-500">
              {todayDrawError && (
                <p className="text-amber-300">{todayDrawError}</p>
              )}

              {!todayDrawError &&
                !todayLoading &&
                todayDraw &&
                todayDraw.closesAt && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm sm:text-base">
                      <span className="text-xs uppercase tracking-wide text-slate-500">
                        Closes in
                      </span>
                      <span
                        className={`ml-2 mt-2 rounded-lg px-2 py-0.5 font-mono text-2xl font-semibold transition-all ${
                          isWarningCritical
                            ? 'animate-pulse bg-amber-500/15 text-amber-300'
                            : isWarningSoon
                            ? 'bg-amber-500/10 text-amber-300'
                            : 'bg-amber-500/5 text-amber-300'
                        }`}
                      >
                        {countdownText}
                      </span>
                    </p>

                    <div className="flex flex-col items-stretch gap-2 sm:items-end">
                      <div className="flex flex-wrap items-center gap-2">
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
                          className={`${BTN_PRIMARY} primary-cta h-10 w-[272px] mr-[-3px] text-sm transition-all duration-300 ease-out ${
                            isWarningCritical
                              ? 'scale-[1.02] ring-2 ring-amber-400/40 shadow-lg'
                              : ''
                          }`}
                        >
                          Crown today&apos;s XPOT winner
                        </button>

                        {todayDraw?.status !== 'open' && (
                          <button
                            type="button"
                            onClick={handleCreateTodayDraw}
                            disabled={creatingDraw || !adminToken}
                            className={`${BTN_SECONDARY} h-10 px-4 text-[11px] uppercase tracking-[0.16em]`}
                          >
                            {creatingDraw
                              ? 'Creating round…'
                              : 'Create today’s round'}
                          </button>
                        )}
                      </div>

                      {todayDraw?.status === 'closed' && (
                        <button
                          type="button"
                          onClick={handleReopenDraw}
                          disabled={isReopeningDraw || !adminToken}
                          className="inline-flex items-center justify-center rounded-lg border border-red-500/70 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isReopeningDraw ? 'Reopening…' : '🚨 Reopen draw (panic)'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

              {!todayDrawError && !todayLoading && !todayDraw && (
                <p>No XPOT draw scheduled for today yet.</p>
              )}

              {(pickError || pickSuccess) && (
                <div className="mt-2 text-xs">
                  {pickError && (
                    <p className="text-amber-300">{pickError}</p>
                  )}
                  {pickSuccess && (
                    <p className="text-emerald-300">{pickSuccess}</p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Drop bonus XPOT */}
          <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/85 px-4 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.85)]">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(34,197,94,0.18),transparent_55%)] opacity-70" />

            <div className="relative flex flex-col gap-4">
              {/* Header row */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-50">
                    Drop bonus XPOT
                  </p>
                  <p className="mt-1 max-w-xl text-xs text-slate-400">
                    Fire a manual hype bonus from today&apos;s ticket pool. One
                    extra winner is picked instantly from all tickets in
                    today&apos;s draw.
                  </p>
                </div>

                <div className="flex flex-col items-end text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  <span className="rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1">
                    Manual bonus · Off-chain trigger
                  </span>
                </div>
              </div>

              {/* Form grid */}
              <form
                onSubmit={handleDropBonus}
                className="mt-2 grid gap-6 md:grid-cols-[minmax(0,1.4fr)_280px]"
              >
                {/* LEFT – amount + presets */}
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
                          onChange={(e) => setBonusAmount(e.target.value)}
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
                      {[100_000, 250_000, 500_000, 1_000_000].map((v) => {
                        const isActive = Number(bonusAmount) === v;
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setBonusAmount(String(v))}
                            className={`h-10 rounded-full px-4 text-xs font-medium ${
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

                {/* RIGHT – label + CTA */}
                <div className="flex w-full flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      Label
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-400/80"
                      value={bonusLabel}
                      onChange={(e) => setBonusLabel(e.target.value)}
                      placeholder="Bonus XPOT"
                    />
                    <p className="text-[11px] text-slate-500">
                      Shown in the winners log so you can tell hype bonuses
                      apart from the main XPOT.
                    </p>
                  </div>

                  {/* CTA row */}
                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={bonusSubmitting}
                      className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-sm font-semibold text-slate-50 shadow-[0_0_26px_rgba(79,70,229,0.6)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {bonusSubmitting ? 'Dropping bonus…' : 'Drop bonus XPOT'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Status line */}
              <div className="mt-3 min-h-[1.25rem] text-xs">
                {bonusError && (
                  <p className="text-amber-300">{bonusError}</p>
                )}
                {bonusSuccess && (
                  <p className="text-emerald-300">{bonusSuccess}</p>
                )}
              </div>
            </div>
          </section>

          {/* Today’s XPOT entries list */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-100">
              Today&apos;s XPOT entries
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Every entry that has been issued for the current XPOT round.
            </p>

            <div className="mt-3">
              {ticketsLoading && (
                <p className="text-xs text-slate-500">Loading tickets…</p>
              )}

              {ticketsError && (
                <p className="text-xs text-amber-300">{ticketsError}</p>
              )}

              {!ticketsLoading &&
                !ticketsError &&
                visibleTickets.length === 0 && (
                  <p className="rounded-xl bg-slate-950/90 px-3 py-2 text-xs text-slate-500">
                    No entries yet for today&apos;s XPOT.
                  </p>
                )}

              {!ticketsLoading &&
                !ticketsError &&
                visibleTickets.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {visibleTickets.map((t) => (
                      <div
                        key={t.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/90 px-3 py-2 text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-mono text-[11px] text-slate-100">
                            {t.code}
                          </p>
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
                        Showing {visibleTickets.length} of {tickets.length}{' '}
                        tickets
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

        {/* RIGHT COLUMN – recent winners */}
        <div className="space-y-4">
          <section className="relative h-full overflow-hidden rounded-3xl border border-slate-800 bg-black/25 px-5 py-5 shadow-[0_20px_60px_rgba(15,23,42,0.8)] backdrop-blur-xl">
            {/* subtle ambient glow */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),transparent_65%),radial-gradient(circle_at_80%_100%,rgba(16,185,129,0.12),transparent_55%)] opacity-70" />

            {/* Header */}
            <div className="relative mb-4">
              <p className="text-base font-semibold tracking-wide text-white">
                Recent XPOT winners
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Internal log of the latest entries and reward execution.
              </p>
            </div>

            {/* Content */}
            <div className="relative">
              {winnersLoading && (
                <p className="text-xs text-slate-500">Loading records…</p>
              )}

              {winnersError && (
                <p className="text-xs text-amber-300">{winnersError}</p>
              )}

              {!winnersLoading && !winnersError && winners.length === 0 && (
                <p className="rounded-xl bg-slate-900/70 px-4 py-3 text-xs text-slate-500">
                  No completed draws yet.
                </p>
              )}

              {!winnersLoading && !winnersError && visibleWinners.length > 0 && (
                <>
                  {/* Flat list, no cards – just clean rows */}
                  <div className="mt-1 divide-y divide-slate-800/70 border-t border-slate-800/80">
                    {visibleWinners.map((w) => (
                      <article
                        key={w.id}
                        className="group flex flex-col gap-2 py-4"
                      >
                        {/* TOP ROW: ticket + label + date */}
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-mono text-[11px] text-slate-200">
                            {w.ticketCode}
                          </p>

                          <div className="flex items-center gap-2">
                            {(() => {
                              const label = formatWinnerLabel(w);
                              if (!label) return null;

                              return (
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] ${
                                    w.kind === 'bonus'
                                      ? 'bg-emerald-500/12 text-emerald-300'
                                      : 'bg-slate-800/70 text-slate-200'
                                  }`}
                                >
                                  {label}
                                </span>
                              );
                            })()}

                            <span className="text-[11px] text-slate-500">
                              {formatDate(w.date)}
                            </span>
                          </div>
                        </div>

                        {/* MIDDLE ROW: wallet */}
                        <CopyableWallet address={w.walletAddress} />

                        {/* BOTTOM ROW: payout + actions */}
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <XpotPill amount={w.payoutUsd} />

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
                                className="w-44 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-[11px] text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 outline-none"
                                value={txInputs[w.id] ?? ''}
                                onChange={(e) =>
                                  setTxInputs((prev) => ({
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
                    ))}
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
  );
}
