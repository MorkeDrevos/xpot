'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import JackpotPanel from '@/components/JackpotPanel';
import AuditLogCard from '@/components/AuditLogCard';
import Modal from '@/components/Modal';

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
  closesAt?: string; // ISO string when draw auto-closes
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

type AdminWinner = {
  drawId: string;
  date: string;
  ticketCode: string;
  walletAddress: string;
  jackpotUsd: number;
  paidOut: boolean;
  txUrl?: string;
};

const ADMIN_TOKEN_KEY = 'xpot_admin_token';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatUsd(amount: number | undefined | null) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '$0';
  return `$${amount.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}`;
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [checkingToken, setCheckingToken] = useState(false);

  const [todayDraw, setTodayDraw] = useState<TodayDraw | null>(null);
  const [todayError, setTodayError] = useState<string | null>(null);
  const [loadingToday, setLoadingToday] = useState(false);

  const [todayTickets, setTodayTickets] = useState<AdminTicket[]>([]);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const [recentWinners, setRecentWinners] = useState<AdminWinner[]>([]);
  const [winnersError, setWinnersError] = useState<string | null>(null);
  const [loadingWinners, setLoadingWinners] = useState(false);

  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  // Winner state
  const [pickingWinner, setPickingWinner] = useState(false);
  const [lastPickedWinner, setLastPickedWinner] = useState<{
    ticketCode: string;
    walletAddress: string;
    jackpotUsd?: number;
  } | null>(null);
  const [winnerJustPicked, setWinnerJustPicked] = useState(false);

  // Modals
  const [showPickModal, setShowPickModal] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);

  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);
  const [reopening, setReopening] = useState(false);

  // NEW: reset draw
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // NEW: lock & ship as-is
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [locking, setLocking] = useState(false);

  // NEW: payouts for winners
  const [payoutTx, setPayoutTx] = useState<Record<string, string>>({});
  const [payingOutId, setPayingOutId] = useState<string | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  // ─────────────────────────────────────────────
  // Live countdown to draw close (admin chip)
  // ─────────────────────────────────────────────

  useEffect(() => {
    const closesAt = todayDraw?.closesAt;
    const status = todayDraw?.status;

    if (!closesAt || status !== 'open') {
      setTimeLeft(null);
      return;
    }

    function updateCountdown() {
      const target = new Date(closesAt as string).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600)
        .toString()
        .padStart(2, '0');
      const minutes = Math.floor((totalSeconds % 3600) / 60)
        .toString()
        .padStart(2, '0');
      const seconds = (totalSeconds % 60).toString().padStart(2, '0');

      setTimeLeft(`${hours}:${minutes}:${seconds}`);
    }

    updateCountdown();
    const id = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(id);
  }, [todayDraw?.closesAt, todayDraw?.status]);

  // ─────────────────────────────────────────────
  // Init: load stored admin token
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (stored) {
      setAdminToken(stored);
      setTokenInput(stored);
      setTokenValid(true);
    }
  }, []);

  // Small helper for admin fetches with header
  async function adminFetch(path: string, options: RequestInit = {}) {
    if (!adminToken) throw new Error('NO_ADMIN_TOKEN');

    const res = await fetch(path, {
      ...options,
      headers: {
        ...(options.headers || {}),
        'x-admin-token': adminToken,
        'Content-Type':
          options.body && !(options.headers as any)?.['Content-Type']
            ? 'application/json'
            : (options.headers as any)?.['Content-Type'] ?? undefined,
      },
      cache: 'no-store',
    });

    if (res.status === 401) {
      setTokenValid(false);
      throw new Error('UNAUTHORIZED');
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }

    return res.json();
  }

  // ─────────────────────────────────────────────
  // Admin actions
  // ─────────────────────────────────────────────

  // Re-open draw
  async function handleReopenDraw() {
    if (!todayDraw) return;

    try {
      setReopening(true);
      setReopenError(null);

      const data = await adminFetch('/api/admin/draw/reopen', {
        method: 'POST',
      });

      if (!data.ok) throw new Error(data.error ?? 'Unknown error');

      setShowReopenModal(false);
      await loadAll();
    } catch (err) {
      console.error('[ADMIN] reopen-draw error:', err);
      setReopenError(
        err instanceof Error ? err.message : 'Failed to re-open draw',
      );
    } finally {
      setReopening(false);
    }
  }

  // RESET today’s draw – dev emergency
  async function handleResetDraw() {
    if (!todayDraw) return;

    try {
      setResetting(true);
      setResetError(null);

      const data = await adminFetch('/api/admin/draw/reset-today', {
        method: 'POST',
      });

      if (!data.ok) throw new Error(data.error ?? 'Unknown error');

      setShowResetModal(false);
      await loadAll();
    } catch (err) {
      console.error('[ADMIN] reset-draw error:', err);
      setResetError(
        err instanceof Error ? err.message : 'Failed to reset draw',
      );
    } finally {
      setResetting(false);
    }
  }

  // LOCK & SHIP AS-IS – force-complete draw
  async function handleLockDrawNow() {
    if (!todayDraw) return;

    try {
      setLocking(true);
      setLockError(null);

      const data = await adminFetch('/api/admin/draw/lock-now', {
        method: 'POST',
      });

      if (!data.ok) throw new Error(data.error ?? 'Unknown error');

      setShowLockModal(false);
      await loadAll();
    } catch (err) {
      console.error('[ADMIN] lock-draw error:', err);
      setLockError(
        err instanceof Error ? err.message : 'Failed to lock draw',
      );
    } finally {
      setLocking(false);
    }
  }

  // Mark payout as paid + optional tx link
  async function handleMarkPaid(drawId: string) {
    const tx = payoutTx[drawId]?.trim() || undefined;

    try {
      setPayingOutId(drawId);
      setPayoutError(null);

      const data = await adminFetch('/api/admin/winners/mark-paid', {
        method: 'POST',
        body: JSON.stringify({ drawId, txUrl: tx }),
      });

      if (!data.ok) throw new Error(data.error ?? 'Unknown error');

      await loadAll();
    } catch (err) {
      console.error('[ADMIN] mark-paid error:', err);
      setPayoutError(
        err instanceof Error ? err.message : 'Failed to update payout status',
      );
    } finally {
      setPayingOutId(null);
    }
  }

  // Verify token against /api/admin/health
  async function verifyToken() {
    if (!tokenInput) {
      setTokenValid(false);
      return;
    }

    setCheckingToken(true);
    setTokenValid(null);

    try {
      const res = await fetch('/api/admin/health', {
        headers: { 'x-admin-token': tokenInput },
        cache: 'no-store',
      });

      if (!res.ok) {
        setTokenValid(false);
        return;
      }

      const data = await res.json();
      if (data.ok) {
        setAdminToken(tokenInput);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(ADMIN_TOKEN_KEY, tokenInput);
        }
        setTokenValid(true);
        await loadAll(tokenInput);
      } else {
        setTokenValid(false);
      }
    } catch (err) {
      console.error('[ADMIN] Health check failed:', err);
      setTokenValid(false);
    } finally {
      setCheckingToken(false);
    }
  }

  // Load all admin data (today + tickets + winners)
  async function loadAll(optionalToken?: string) {
    const token = optionalToken ?? adminToken;
    if (!token) return;

    setTodayError(null);
    setTicketsError(null);
    setWinnersError(null);

    setLoadingToday(true);
    setLoadingTickets(true);
    setLoadingWinners(true);

    try {
      const headers = { 'x-admin-token': token };

      const [drawRes, ticketsRes, winnersRes] = await Promise.all([
        fetch('/api/admin/draw/today', { headers, cache: 'no-store' }),
        fetch('/api/admin/draw/today/tickets', { headers, cache: 'no-store' }),
        fetch('/api/admin/draw/recent-winners', {
          headers,
          cache: 'no-store',
        }),
      ]);

      if (
        drawRes.status === 401 ||
        ticketsRes.status === 401 ||
        winnersRes.status === 401
      ) {
        setTokenValid(false);
        throw new Error('UNAUTHORIZED');
      }

      const drawJson = drawRes.ok ? await drawRes.json() : null;
      const ticketsJson = ticketsRes.ok ? await ticketsRes.json() : null;
      const winnersJson = winnersRes.ok ? await winnersRes.json() : null;

      if (drawJson?.ok) {
        setTodayDraw(drawJson.draw);
      } else if (!drawRes.ok) {
        setTodayError(`Failed to load today’s draw (${drawRes.status})`);
      }

      if (ticketsJson?.ok && Array.isArray(ticketsJson.tickets)) {
        setTodayTickets(ticketsJson.tickets);
      } else if (!ticketsRes.ok) {
        setTicketsError(
          `Failed to load today’s tickets (${ticketsRes.status})`,
        );
      }

      if (winnersJson?.ok && Array.isArray(winnersJson.winners)) {
        setRecentWinners(winnersJson.winners);
      } else if (!winnersRes.ok) {
        setWinnersError(
          `Failed to load recent winners (${winnersRes.status})`,
        );
      }
    } catch (err) {
      console.error('[ADMIN] loadAll error:', err);
      const msg =
        err instanceof Error ? err.message : 'Unexpected admin error';
      if (!todayError) setTodayError(msg);
      if (!ticketsError) setTicketsError(msg);
      if (!winnersError) setWinnersError(msg);
    } finally {
      setLoadingToday(false);
      setLoadingTickets(false);
      setLoadingWinners(false);
    }
  }

  // Whenever a valid token is set, auto-load data
  useEffect(() => {
    if (adminToken) {
      void loadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  // Derived: can we pick winner right now?
  const canPickWinner =
    !!todayDraw &&
    adminToken &&
    todayDraw.status === 'open' &&
    todayDraw.ticketsCount > 0 &&
    !loadingToday &&
    !pickingWinner;

  const isDrawLocked = !!todayDraw && todayDraw.status !== 'open';

  const todayWinner =
    recentWinners.find(w => {
      const d = new Date(w.date);
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }) ?? null;

  // Real pick-winner handler
  async function handlePickWinner() {
    if (!todayDraw) return;

    try {
      setPickingWinner(true);
      setPickError(null);

      const data = await adminFetch('/api/admin/draw/pick-winner', {
        method: 'POST',
      });

      if (!data.ok) throw new Error(data.error ?? 'Unknown error');

      setLastPickedWinner({
        ticketCode: data.winner.code,
        walletAddress: data.winner.wallet,
        jackpotUsd: data.winner.jackpotUsd,
      });
      setWinnerJustPicked(true);
      setTimeout(() => setWinnerJustPicked(false), 1800);

      setShowPickModal(false);
      await loadAll();
    } catch (err) {
      console.error('[ADMIN] pick-winner error:', err);
      setPickError(
        err instanceof Error ? err.message : 'Failed to pick winner',
      );
    } finally {
      setPickingWinner(false);
    }
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-black text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6">
        {/* Top bar */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              XPOT admin
            </p>
            <p className="text-sm text-slate-300">
              Internal control room for today&apos;s draw, jackpot state and
              winners.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:border-slate-500 hover:bg-slate-900"
          >
            Back to user dashboard
          </Link>
        </header>

        {/* Admin token bar */}
        <section className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-200">
                Admin key
              </p>
              <p className="text-[11px] text-slate-500">
                Paste your admin token to unlock live draw data. Stored only in
                this browser&apos;s local storage.
              </p>
            </div>

            <div className="flex flex-1 items-center gap-2 md:max-w-md">
              <input
                type="password"
                className="flex-1 rounded-full border border-slate-700 bg-black px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-400"
                placeholder="Paste XPOT_ADMIN_TOKEN..."
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value.trim())}
              />
              <button
                type="button"
                onClick={verifyToken}
                disabled={!tokenInput || checkingToken}
                className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                {checkingToken ? 'Checking…' : 'Unlock'}
              </button>
            </div>
          </div>

          {tokenValid === false && (
            <p className="mt-2 text-[11px] text-amber-300">
              Invalid admin token. Double-check the value from Vercel and try
              again.
            </p>
          )}
          {tokenValid && (
            <p className="mt-2 text-[11px] text-emerald-300">
              Admin token accepted. Live draw endpoints are unlocked for this
              browser.
            </p>
          )}
        </section>

        {/* Main layout */}
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
          {/* LEFT COLUMN */}
          <div className="space-y-4">
            {/* Jackpot panel – 1,000,000 XPOT + live USD via Jupiter */}
            <JackpotPanel isLocked={isDrawLocked} />

            {/* Today’s draw */}
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
              <header className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Today&apos;s draw
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Overview of today&apos;s draw: ticket pool, winner status
                    and timing.
                  </p>
                </div>

                {todayDraw?.status === 'open' && timeLeft && (
                  <div className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200">
                    <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                      Closes in
                    </span>
                    <span className="font-mono">{timeLeft}</span>
                  </div>
                )}

                {todayDraw?.status !== 'open' && todayDraw && (
                  <div className="rounded-full border border-slate-700/60 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-300">
                    Draw locked
                  </div>
                )}
              </header>

              {!adminToken && (
                <p className="mt-3 text-xs text-slate-500">
                  Paste your admin key above to load today&apos;s draw details.
                </p>
              )}

              {adminToken && loadingToday && (
                <p className="mt-3 text-xs text-slate-500">
                  Loading today&apos;s draw…
                </p>
              )}

              {adminToken && todayError && !loadingToday && (
                <p className="mt-3 text-xs text-amber-300">
                  Failed to load today&apos;s draw. {todayError}
                </p>
              )}

              {adminToken && todayWinner && (
                <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-3 py-3 text-[11px] text-slate-100">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                    Today&apos;s winner
                  </p>
                  <p className="mt-1 font-mono text-xs">
                    {todayWinner.ticketCode}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {todayWinner.walletAddress}
                  </p>
                  <p className="mt-1 text-[10px] text-emerald-300">
                    {formatUsd(todayWinner.jackpotUsd)} ·{' '}
                    {todayWinner.paidOut ? 'Paid out' : 'Pending payout'}
                  </p>
                </div>
              )}

              {adminToken && todayDraw && !loadingToday && !todayError && (
                <>
                  <div className="mt-4 grid gap-4 text-xs text-slate-200 sm:grid-cols-2">
                    <div>
                      <p className="text-slate-400">Status</p>
                      <p className="mt-1 font-semibold capitalize">
                        {todayDraw.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Today&apos;s jackpot</p>
                      <p className="mt-1 font-semibold">
                        {formatUsd(todayDraw.jackpotUsd)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Rollover amount</p>
                      <p className="mt-1 font-semibold">
                        {formatUsd(todayDraw.rolloverUsd)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Tickets in pool</p>
                      <p className="mt-1 font-semibold">
                        {todayDraw.ticketsCount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* When draw is open but no tickets */}
                  {todayDraw.status === 'open' &&
                    todayDraw.ticketsCount === 0 && (
                      <p className="mt-4 w-full rounded-full bg-slate-900 py-2 text-center text-xs text-slate-500">
                        No tickets in pool yet.
                      </p>
                    )}

                  {/* When draw is open and tickets > 0 */}
                  {todayDraw.status === 'open' &&
                    todayDraw.ticketsCount > 0 && (
                      <div className="mt-4 space-y-2">
                        <button
                          type="button"
                          disabled={!canPickWinner}
                          className="w-full rounded-full bg-amber-400 py-2 text-xs font-semibold text-black hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-amber-300/60"
                          onClick={() => {
                            setPickError(null);
                            setShowPickModal(true);
                          }}
                        >
                          {pickingWinner ? 'Picking winner…' : 'Pick winner now'}
                        </button>

                        {/* Lock & ship as-is */}
                        <button
                          type="button"
                          disabled={locking}
                          className="w-full rounded-full border border-slate-700 bg-slate-950 py-2 text-xs font-semibold text-slate-200 hover:border-amber-400 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={() => {
                            setLockError(null);
                            setShowLockModal(true);
                          }}
                        >
                          Lock draw now (ship as-is)
                        </button>
                      </div>
                    )}

                  {/* When draw is locked / completed */}
                  {todayDraw.status !== 'open' && (
                    <>
                      <p className="mt-3 text-[11px] text-slate-400">
                        Draw is locked. You can review the winner and payout
                        status below.
                      </p>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => {
                            setReopenError(null);
                            setShowReopenModal(true);
                          }}
                          className="w-full rounded-full border border-slate-700 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-500 hover:bg-slate-900"
                        >
                          Re-open draw (panic switch)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setResetError(null);
                            setShowResetModal(true);
                          }}
                          className="w-full rounded-full border border-red-500/70 bg-red-500/5 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/15"
                        >
                          Reset today&apos;s draw
                        </button>
                      </div>
                    </>
                  )}

                  {lastPickedWinner && (
                    <div
                      className={`mt-3 rounded-xl border px-3 py-2 text-[11px] ${
                        winnerJustPicked
                          ? 'border-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-400 animate-pulse'
                          : 'border-emerald-500/40 bg-emerald-500/5'
                      } text-emerald-100`}
                    >
                      <p className="text-xs font-semibold">
                        Winner locked for today&apos;s draw
                      </p>
                      <p className="mt-1">
                        Ticket:{' '}
                        <span className="font-mono">
                          {lastPickedWinner.ticketCode}
                        </span>
                      </p>
                      <p className="mt-0.5 break-all">
                        Wallet:{' '}
                        <span className="font-mono">
                          {lastPickedWinner.walletAddress}
                        </span>
                      </p>
                      {typeof lastPickedWinner.jackpotUsd === 'number' && (
                        <p className="mt-0.5">
                          Jackpot: {formatUsd(lastPickedWinner.jackpotUsd)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Pick-winner confirmation modal */}
                  {todayDraw && (
                    <Modal
                      open={showPickModal}
                      onClose={() => {
                        if (!pickingWinner) setShowPickModal(false);
                      }}
                      title="Confirm today’s winner"
                    >
                      <p className="mb-3 text-xs text-slate-300">
                        XPOT will randomly select one ticket from
                        today&apos;s pool. This action can&apos;t be undone.
                      </p>

                      <div className="mb-3 rounded-lg bg-slate-900 px-3 py-2 text-[11px] text-slate-200">
                        <p>
                          Tickets in pool:{' '}
                          <span className="font-semibold">
                            {todayDraw.ticketsCount.toLocaleString()}
                          </span>
                        </p>
                        <p>
                          Jackpot:{' '}
                          <span className="font-semibold">
                            {formatUsd(todayDraw.jackpotUsd)}
                          </span>
                        </p>
                      </div>

                      {pickError && (
                        <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                          {pickError}
                        </div>
                      )}

                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          disabled={pickingWinner}
                          onClick={() => setShowPickModal(false)}
                          className="w-full rounded-full border border-slate-600 px-4 py-2 text-xs text-slate-200 hover:border-slate-300 hover:text-slate-50 sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={pickingWinner}
                          onClick={handlePickWinner}
                          className="w-full rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300 sm:w-auto disabled:cursor-not-allowed disabled:bg-amber-300/60"
                        >
                          {pickingWinner
                            ? 'Picking winner…'
                            : 'Yes, pick winner'}
                        </button>
                      </div>
                    </Modal>
                  )}

                  {/* Re-open draw confirmation modal */}
                  {todayDraw && (
                    <Modal
                      open={showReopenModal}
                      onClose={() => {
                        if (!reopening) setShowReopenModal(false);
                      }}
                      title="Re-open today’s draw?"
                    >
                      <p className="mb-3 text-xs text-slate-300">
                        This will unlock today&apos;s draw so new tickets can
                        be issued again. Use this only as an emergency switch.
                      </p>

                      <div className="mb-3 rounded-lg bg-slate-900 px-3 py-2 text-[11px] text-slate-200">
                        <p>
                          Tickets in pool:{' '}
                          <span className="font-semibold">
                            {todayDraw.ticketsCount.toLocaleString()}
                          </span>
                        </p>
                        <p>
                          Jackpot:{' '}
                          <span className="font-semibold">
                            {formatUsd(todayDraw.jackpotUsd)}
                          </span>
                        </p>
                      </div>

                      {reopenError && (
                        <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                          {reopenError}
                        </div>
                      )}

                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          disabled={reopening}
                          onClick={() => setShowReopenModal(false)}
                          className="w-full rounded-full border border-slate-600 px-4 py-2 text-xs text-slate-200 hover:border-slate-300 hover:text-slate-50 sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={reopening}
                          onClick={handleReopenDraw}
                          className="w-full rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-200 sm:w-auto disabled:cursor-not-allowed disabled:bg-slate-300/70"
                        >
                          {reopening
                            ? 'Re-opening…'
                            : 'Yes, re-open draw'}
                        </button>
                      </div>
                    </Modal>
                  )}

                  {/* Reset today’s draw modal */}
                  {todayDraw && (
                    <Modal
                      open={showResetModal}
                      onClose={() => {
                        if (!resetting) setShowResetModal(false);
                      }}
                      title="Reset today’s draw?"
                    >
                      <p className="mb-3 text-xs text-red-200">
                        This will wipe today&apos;s draw state in the dev DB
                        (tickets, status and winner). Use only for testing.
                      </p>

                      {resetError && (
                        <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                          {resetError}
                        </div>
                      )}

                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          disabled={resetting}
                          onClick={() => setShowResetModal(false)}
                          className="w-full rounded-full border border-slate-600 px-4 py-2 text-xs text-slate-200 hover:border-slate-300 hover:text-slate-50 sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={resetting}
                          onClick={handleResetDraw}
                          className="w-full rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-400 sm:w-auto disabled:cursor-not-allowed disabled:bg-red-400/70"
                        >
                          {resetting ? 'Resetting…' : 'Yes, reset today'}
                        </button>
                      </div>
                    </Modal>
                  )}

                  {/* Lock & ship as-is modal */}
                  {todayDraw && (
                    <Modal
                      open={showLockModal}
                      onClose={() => {
                        if (!locking) setShowLockModal(false);
                      }}
                      title="Lock draw now?"
                    >
                      <p className="mb-3 text-xs text-slate-300">
                        This will mark today&apos;s draw as locked / completed
                        using the current ticket pool. No more tickets can be
                        issued after this.
                      </p>

                      <div className="mb-3 rounded-lg bg-slate-900 px-3 py-2 text-[11px] text-slate-200">
                        <p>
                          Tickets in pool:{' '}
                          <span className="font-semibold">
                            {todayDraw.ticketsCount.toLocaleString()}
                          </span>
                        </p>
                        <p>
                          Jackpot:{' '}
                          <span className="font-semibold">
                            {formatUsd(todayDraw.jackpotUsd)}
                          </span>
                        </p>
                      </div>

                      {lockError && (
                        <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                          {lockError}
                        </div>
                      )}

                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          disabled={locking}
                          onClick={() => setShowLockModal(false)}
                          className="w-full rounded-full border border-slate-600 px-4 py-2 text-xs text-slate-200 hover:border-slate-300 hover:text-slate-50 sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={locking}
                          onClick={handleLockDrawNow}
                          className="w-full rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300 sm:w-auto disabled:cursor-not-allowed disabled:bg-amber-300/70"
                        >
                          {locking ? 'Locking…' : 'Yes, lock draw now'}
                        </button>
                      </div>
                    </Modal>
                  )}
                </>
              )}
            </section>

            {/* Wallet truth line */}
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
              <h2 className="text-sm font-semibold text-slate-100">
                Wallet truth line
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                What is actually true on-chain, regardless of what the UI is
                showing.
              </p>

              <ul className="mt-3 space-y-1 text-xs text-slate-300">
                <li>• XPOT.bet never takes custody of user funds.</li>
                <li>• Tickets are tied to wallet address and draw date.</li>
                <li>
                  • Eligibility is checked at entry time, not during the draw.
                </li>
              </ul>
            </section>

            {/* Today’s tickets */}
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
              <h2 className="text-sm font-semibold text-slate-100">
                Today&apos;s tickets (admin view)
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Every ticket that has been issued for the current draw.
              </p>

              {!adminToken && (
                <p className="mt-3 text-xs text-slate-500">
                  Unlock with your admin key to see today&apos;s tickets.
                </p>
              )}

              {adminToken && loadingTickets && (
                <p className="mt-3 text-xs text-slate-500">
                  Loading tickets…
                </p>
              )}

              {adminToken && ticketsError && !loadingTickets && (
                <p className="mt-3 text-xs text-amber-300">{ticketsError}</p>
              )}

              {adminToken &&
                !loadingTickets &&
                !ticketsError &&
                todayTickets.length === 0 && (
                  <p className="mt-3 text-xs text-slate-500">
                    No tickets yet for today&apos;s draw.
                  </p>
                )}

              {adminToken &&
                !loadingTickets &&
                !ticketsError &&
                todayTickets.length > 0 && (
                  <div className="mt-3 space-y-1 text-[11px] text-slate-200">
                    {todayTickets.slice(0, 50).map(t => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2"
                      >
                        <div>
                          <p className="font-mono text-xs">{t.code}</p>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            {t.walletAddress}
                          </p>
                        </div>
                        <div className="text-right text-[10px] text-slate-400">
                          <p>{t.status}</p>
                          <p className="mt-0.5">
                            {new Date(t.createdAt).toLocaleTimeString(
                              undefined,
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </section>

            {/* Recent winners + payouts */}
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Recent winners
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Internal log of the latest winning tickets and payout
                    status.
                  </p>
                </div>
              </div>

              {!adminToken && (
                <p className="mt-3 text-xs text-slate-500">
                  Unlock with your admin key to see completed draws.
                </p>
              )}

              {adminToken && loadingWinners && (
                <p className="mt-3 text-xs text-slate-500">
                  Loading recent winners…
                </p>
              )}

              {adminToken && winnersError && !loadingWinners && (
                <p className="mt-3 text-xs text-amber-300">{winnersError}</p>
              )}

              {adminToken &&
                !loadingWinners &&
                !winnersError &&
                recentWinners.length === 0 && (
                  <p className="mt-3 text-xs text-slate-500">
                    No completed draws yet. Once you pick winners and mark
                    jackpots as paid, they&apos;ll appear here.
                  </p>
                )}

              {adminToken &&
                !loadingWinners &&
                !winnersError &&
                recentWinners.length > 0 && (
                  <div className="mt-3 space-y-2 text-[11px] text-slate-200">
                    {payoutError && (
                      <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                        {payoutError}
                      </div>
                    )}

                    {recentWinners.map(w => (
                      <div
                        key={w.drawId}
                        className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-mono text-xs">
                              {w.ticketCode}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-500">
                              {w.walletAddress}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400">
                              {new Date(w.date).toLocaleDateString()}
                            </p>
                            <p className="mt-0.5 text-[10px] text-emerald-300">
                              {formatUsd(w.jackpotUsd)}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {w.paidOut ? 'Paid out' : 'Pending'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Payout tx URL (optional)"
                              className="w-full rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] text-slate-100 outline-none focus:border-emerald-400"
                              value={payoutTx[w.drawId] ?? (w.txUrl ?? '')}
                              onChange={e =>
                                setPayoutTx(prev => ({
                                  ...prev,
                                  [w.drawId]: e.target.value,
                                }))
                              }
                            />
                            {w.txUrl && (
                              <a
                                href={w.txUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-block text-[10px] text-sky-400 hover:text-sky-300"
                              >
                                View transaction
                              </a>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={payingOutId === w.drawId}
                            onClick={() => handleMarkPaid(w.drawId)}
                            className={`mt-1 w-full rounded-full px-3 py-1.5 text-[11px] font-semibold sm:mt-0 sm:w-auto ${
                              w.paidOut
                                ? 'border border-slate-600 text-slate-200 hover:border-slate-400'
                                : 'bg-emerald-500 text-black hover:bg-emerald-400'
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            {payingOutId === w.drawId
                              ? 'Saving…'
                              : w.paidOut
                              ? 'Update payout'
                              : 'Mark paid'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            {/* Today’s eligibility */}
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
              <h2 className="text-sm font-semibold text-slate-100">
                Today&apos;s eligibility
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                What users see as the current entry rules.
              </p>
              <ul className="mt-3 space-y-1 text-xs text-slate-300">
                <li>• Sign in with X.</li>
                <li>• Connect a Solana wallet.</li>
                <li>
                  • Hold the minimum XPOT balance at the moment they get
                  today&apos;s ticket.
                </li>
                <li>• Exactly one ticket per wallet per draw.</li>
              </ul>
            </section>

            {/* How draw works (user view) */}
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
              <h2 className="text-sm font-semibold text-slate-100">
                How today&apos;s draw works
              </h2>
              <ul className="mt-3 space-y-1 text-xs text-slate-300">
                <li>• Get exactly one ticket per wallet.</li>
                <li>
                  • At entry time, wallet must hold at least{' '}
                  <span className="font-semibold">100,000 XPOT</span>.
                </li>
                <li>• Wallet is only checked when you get your ticket.</li>
                <li>• When the timer hits zero, one ticket wins.</li>
                <li>
                  • Winner has 24 hours to collect or the jackpot rolls over.
                </li>
              </ul>
            </section>

            {/* Optional: audit log card if you want it here */}
            <AuditLogCard />
          </div>
        </div>
      </div>
    </main>
  );
}
