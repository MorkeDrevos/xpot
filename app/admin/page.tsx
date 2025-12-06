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
  const base =
    'inline-flex items-baseline rounded-full bg-emerald-500/10 text-emerald-300 font-semibold';
  const cls =
    size === 'sm'
      ? `${base} px-2 py-0.5 text-xs`
      : `${base} px-3 py-1 text-sm`;

  return (
    <span className={cls}>
      <span className="font-mono text-[0.92em]">{value}</span>
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
  'inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:opacity-40 disabled:cursor-not-allowed';

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

      const r = res.reward;
      setBonusSuccess(
        `Bonus ${formatUsd(r.amountUsd)} sent to ${r.ticketCode} (${r.walletAddress.slice(
          0,
          4,
        )}…${r.walletAddress.slice(-4)}).`,
      );

      try {
        const winnersData = await authedFetch('/api/admin/winners');
        setWinners(winnersData.winners ?? []);
      } catch {
        // ignore
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

      const w = data.winner as AdminWinner | undefined;
      if (!w) throw new Error('No winner returned from API');

      setPickSuccess(
        `Main XPOT winner: ${w.ticketCode} (${w.walletAddress.slice(
          0,
          4,
        )}…${w.walletAddress.slice(-4)}).`,
      );

      setWinners((prev) => [w, ...prev]);
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
    <main className="mx-auto max-w-7xl flex flex-col gap-6 px-4 py-6 text-slate-100">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/img/xpot-logo-light.png"
              alt="XPOT"
              width={112}
              height={30}
              priority
            />
          </Link>
          <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-300">
            Admin console
          </span>
        </div>

        <div className="flex flex-col items-start gap-1 sm:items-end">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-semibold text-white">
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

      {/* Admin key card – cinematic glass */}
      <section className="relative rounded-3xl bg-transparent">
        {/* Glow behind card */}
        <div className="pointer-events-none absolute -inset-8 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.25),transparent_45%),radial-gradient(circle_at_80%_100%,rgba(56,189,248,0.25),transparent_45%)] opacity-70 blur-2xl" />

        {/* Glass card */}
        <div className="relative rounded-3xl bg-black/30 backdrop-blur-xl border border-white/10 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white tracking-wide">
                Admin key
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Enter your admin token to unlock XPOT operations.
              </p>
              {tokenAccepted && (
                <p className="mt-1 text-xs font-semibold text-emerald-400">
                  Authentication successful. Secure access granted.
                </p>
              )}
            </div>

            <form
              onSubmit={handleUnlock}
              className="flex flex-1 flex-col gap-2 sm:max-w-md sm:flex-row"
            >
              <input
                type="password"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-400"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste admin token…"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSavingToken || !tokenInput.trim()}
                  className={`${BTN_UTILITY} px-3 py-2 text-xs`}
                >
                  {tokenAccepted ? 'Update key' : 'Unlock'}
                </button>
                {tokenAccepted && (
                  <button
                    type="button"
                    onClick={handleClearToken}
                    className={`${BTN_UTILITY} px-3 py-2 text-xs`}
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Main grid: left (XPOT + summary + entries), right (winners) */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)]">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* Big live XPOT card */}
          <div className="jackpot-shell">
            <div className="jackpot-shell-inner">
              <JackpotPanel
                isLocked={isDrawLocked}
                onJackpotUsdChange={setLiveJackpotUsd}
              />
            </div>
          </div>

          {/* Today’s XPOT summary card */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Today&apos;s round
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Live overview of today&apos;s XPOT draw, entries, rollovers
                  and prize pool.
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
                      No XPOT round detected for today – backend should create
                      this automatically.
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
                      <span className="uppercase tracking-wide text-slate-500 text-xs">
                        Closes in
                      </span>
                      <span
                        className={`
                          ml-2 font-mono text-2xl font-semibold mt-2 transition-all
                          ${
                            isWarningCritical
                              ? 'text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg animate-pulse'
                              : isWarningSoon
                              ? 'text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded-lg'
                              : 'text-emerald-300'
                          }
                        `}
                      >
                        {countdownText}
                      </span>
                    </p>

                    <div className="flex flex-col items-stretch gap-2 sm:items-end">
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
  ${BTN_PRIMARY} primary-cta px-4 py-2 text-sm transition-all ease-out duration-300
  ${isWarningCritical ? 'ring-2 ring-amber-400/40 shadow-lg scale-[1.02]' : ''}
`}
                      >
                        {isPickingWinner
                          ? 'Picking winner…'
                          : 'Select primary recipient'}
                      </button>

                      {todayDraw?.status === 'closed' && (
                        <button
                          type="button"
                          onClick={handleReopenDraw}
                          disabled={isReopeningDraw || !adminToken}
                          className="inline-flex items-center justify-center rounded-lg border border-red-500/70 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-200 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-100">
              Drop bonus XPOT
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Fire a manual hype XPOT using today&apos;s ticket pool. Winner is
              picked instantly from all tickets in today&apos;s draw.
            </p>

            <form onSubmit={handleDropBonus} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  Amount
                </label>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={100000}
                      step={1000}
                      className="w-32 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-400"
                      value={bonusAmount}
                      onChange={(e) => setBonusAmount(e.target.value)}
                    />
                    <span className="text-xs text-slate-400">XPOT</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[100_000, 250_000, 500_000, 1_000_000].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setBonusAmount(String(v))}
                        className={`${BTN_SECONDARY} px-4 py-2 text-sm ${
                          Number(bonusAmount) === v
                            ? 'border-amber-400 bg-amber-500/10 text-amber-200'
                            : 'border-slate-700 bg-slate-900 text-slate-300'
                        }`}
                      >
                        {v.toLocaleString()} XPOT
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    Label
                  </label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-400"
                    value={bonusLabel}
                    onChange={(e) => setBonusLabel(e.target.value)}
                    placeholder="Bonus XPOT"
                  />
                </div>

                <button
                  type="submit"
                  disabled={bonusSubmitting}
                  className="mt-1 inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm disabled:cursor-not-allowed disabled:bg-emerald-500/40 sm:mt-0"
                >
                  {bonusSubmitting ? 'Dropping…' : 'Drop bonus XPOT'}
                </button>
              </div>

              <div className="text-xs min-h-[1.25rem]">
                {bonusError && (
                  <p className="text-amber-300">{bonusError}</p>
                )}
                {bonusSuccess && (
                  <p className="text-emerald-300">{bonusSuccess}</p>
                )}
              </div>
            </form>
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
          <section className="h-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-100">
              Recent XPOT winners
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Internal log of the latest selected entries and reward status.
            </p>

            <div className="mt-3">
              {winnersLoading && (
                <p className="text-xs text-slate-500">Loading results…</p>
              )}

              {winnersError && (
                <p className="text-xs text-amber-300">{winnersError}</p>
              )}

              {!winnersLoading &&
                !winnersError &&
                winners.length === 0 && (
                  <p className="rounded-xl bg-slate-950/90 px-3 py-2 text-xs text-slate-500">
                    No completed draws yet. Once you pick winners and mark XPOT
                    as paid, they&apos;ll appear here.
                  </p>
                )}

              {!winnersLoading &&
                !winnersError &&
                visibleWinners.length > 0 && (
                  <div className="mt-2 space-y-3">
                    {visibleWinners.map((w) => (
                      <article
                        key={w.id}
                        className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/90 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-mono text-[11px] text-slate-100">
                            {w.ticketCode}
                          </p>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const displayLabel = formatWinnerLabel(w);
                              if (!displayLabel) return null;

                              return (
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
                                    w.kind === 'bonus'
                                      ? 'bg-emerald-500/10 text-emerald-300'
                                      : 'bg-slate-800 text-slate-200'
                                  }`}
                                >
                                  {displayLabel}
                                </span>
                              );
                            })()}
                            <p className="text-[11px] text-slate-500">
                              {formatDate(w.date)}
                            </p>
                          </div>
                        </div>

                        <CopyableWallet address={w.walletAddress} />

                        <div className="flex items-center justify-between gap-3">
                          <XpotPill amount={w.payoutUsd} size="sm" />

                          <div className="flex flex-col items-end gap-1">
                            {w.isPaidOut ? (
                              w.txUrl && (
                                <div className="flex items-center gap-2 text-[11px] text-emerald-300">
                                  <span className="font-semibold">
                                    Reward sent
                                  </span>
                                  <span className="text-emerald-400">·</span>

                                  <a
                                    href={w.txUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline decoration-emerald-400/40 hover:decoration-emerald-300 hover:text-emerald-200 transition-colors"
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
                                      } catch (err) {
                                        console.error(
                                          'Failed to copy TX link',
                                          err,
                                        );
                                      }
                                    }}
                                    className="rounded-md border border-emerald-500/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-emerald-200 hover:bg-emerald-500/10"
                                  >
                                    {copiedTxWinnerId === w.id
                                      ? 'Copied'
                                      : 'Copy TX'}
                                  </button>
                                </div>
                              )
                            ) : (
                              <div className="flex flex-col items-end gap-1">
                                <input
                                  type="text"
                                  placeholder="Paste TX link…"
                                  className="w-44 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 outline-none"
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
                                  className={`${BTN_UTILITY} px-3 py-1 text-[11px]`}
                                >
                                  {savingPaidId === w.id
                                    ? 'Saving…'
                                    : 'Mark as paid'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}

                    {markPaidError && (
                      <p className="mt-2 text-xs text-amber-300">
                        {markPaidError}
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                      <p>
                        Showing latest {visibleWinners.length} of{' '}
                        {winners.length} winners
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
                  </div>
                )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
