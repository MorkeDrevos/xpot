'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import JackpotPanel from '@/components/JackpotPanel';
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
  closesAt?: string;
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

// Plain numeric USD formatter (no symbol)
function formatUsd(amount: number | null | undefined, decimals = 2) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return '0.00';
  }

  return amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// More precise for tiny per-XPOT prices (if needed elsewhere)
function formatUsdPrice(amount: number | null | undefined) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return '0.00000';
  }

  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 5,
    maximumFractionDigits: 5,
  });
}

// Small pill for USD amounts so we have one consistent look
function UsdPill({
  amount,
  size = 'md',
}: {
  amount: number | undefined | null;
  size?: 'sm' | 'md';
}) {
  const value = formatUsd(amount);
  const base =
    'inline-flex items-baseline rounded-full bg-emerald-500/10 text-emerald-300 font-semibold';
  const md = 'px-3 py-1 text-xs';
  const sm = 'px-2 py-0.5 text-[11px]';

  return (
    <span className={`${base} ${size === 'md' ? md : sm}`}>
      <span className="font-mono text-sm">{value}</span>
      <span className="ml-1 text-[10px] uppercase tracking-[0.16em] text-emerald-400">
        USD
      </span>
    </span>
  );
}

// XPOT pill – fixed 1,000,000 XPOT for each XPOT round
function XpotPill({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const base =
    'inline-flex items-baseline rounded-full bg-sky-500/10 text-sky-300 font-semibold';
  const md = 'px-3 py-1 text-xs';
  const sm = 'px-2 py-0.5 text-[11px]';

  return (
    <span className={`${base} ${size === 'md' ? md : sm}`}>
      <span className="font-mono text-sm">1,000,000.00</span>
      <span className="ml-1 text-[10px] uppercase tracking-[0.16em] text-sky-400">
        XPOT
      </span>
    </span>
  );
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
  const [liveJackpotUsd, setLiveJackpotUsd] = useState<number | null>(null);

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

  // Payouts
  const [savingPayoutId, setSavingPayoutId] = useState<string | null>(null);

  // ─────────────────────────────────────────────
  // Effects: token, countdown, live XPOT USD value
  // ─────────────────────────────────────────────

  // Load stored token on first render
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (stored) {
      setAdminToken(stored);
      setTokenInput(stored);
      setTokenValid(true);
    }
  }, []);

  // Live countdown to round close (admin view)
  useEffect(() => {
    const closesAt = todayDraw?.closesAt;
    const status = todayDraw?.status;

    if (!closesAt || status !== 'open') {
      setTimeLeft(null);
      return;
    }

    function updateCountdown(iso: string) {
      const target = new Date(iso).getTime();
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

    updateCountdown(closesAt);
    const id = window.setInterval(() => updateCountdown(closesAt), 1000);
    return () => window.clearInterval(id);
  }, [todayDraw?.closesAt, todayDraw?.status]);

  // Live value of 1,000,000 XPOT in USD
  useEffect(() => {
    async function loadLiveJackpot() {
      try {
        const res = await fetch('/api/xpot/price', { cache: 'no-store' });
        if (!res.ok) return;

        const data = await res.json();
        const pricePerXpot = data.priceUsd;

        if (typeof pricePerXpot === 'number' && !Number.isNaN(pricePerXpot)) {
          const jackpot = pricePerXpot * 1_000_000;
          setLiveJackpotUsd(jackpot);
        }
      } catch (err) {
        console.error('[ADMIN] live XPOT value fetch failed', err);
      }
    }

    loadLiveJackpot();
    const id = window.setInterval(loadLiveJackpot, 15_000);
    return () => window.clearInterval(id);
  }, []);

  // Whenever a valid token is set, auto-load data
  useEffect(() => {
    if (adminToken) {
      void loadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  // ─────────────────────────────────────────────
  // Helpers: admin fetch + handlers
  // ─────────────────────────────────────────────

  async function adminFetch(path: string, options: RequestInit = {}) {
    if (!adminToken) {
      throw new Error('NO_ADMIN_TOKEN');
    }

    const res = await fetch(path, {
      ...options,
      headers: {
        ...(options.headers || {}),
        'x-admin-token': adminToken,
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

  // Verify token
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

  // Load all admin data (Today’s XPOT + entries + results)
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
        fetch('/api/admin/draw/today/tickets', {
          headers,
          cache: 'no-store',
        }),
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
        setTodayError(`Failed to load Today’s XPOT (${drawRes.status})`);
      }

      if (ticketsJson?.ok && Array.isArray(ticketsJson.tickets)) {
        setTodayTickets(ticketsJson.tickets);
      } else if (!ticketsRes.ok) {
        setTicketsError(
          `Failed to load Today’s XPOT entries (${ticketsRes.status})`,
        );
      }

      if (winnersJson?.ok && Array.isArray(winnersJson.winners)) {
        setRecentWinners(winnersJson.winners);
      } else if (!winnersRes.ok) {
        setWinnersError(
          `Failed to load XPOT results (${winnersRes.status})`,
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

  // Re-open Today’s XPOT round (called from modal)
  async function handleReopenDraw() {
    if (!todayDraw) return;

    try {
      setReopening(true);
      setReopenError(null);

      const data = await adminFetch('/api/admin/draw/reopen', {
        method: 'POST',
      });

      if (!data.ok) {
        throw new Error(data.error ?? 'Unknown error');
      }

      setShowReopenModal(false);
      await loadAll();
    } catch (err) {
      console.error('[ADMIN] reopen-xpot error:', err);
      setReopenError(
        err instanceof Error ? err.message : 'Failed to re-open Today’s XPOT',
      );
    } finally {
      setReopening(false);
    }
  }

  // Real selection handler for Today’s XPOT
  async function handlePickWinner() {
    if (!todayDraw) return;

    try {
      setPickingWinner(true);
      setPickError(null);

      const data = await adminFetch('/api/admin/draw/pick-winner', {
        method: 'POST',
      });

      if (!data.ok) {
        throw new Error(data.error ?? 'Unknown error');
      }

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
        err instanceof Error
          ? err.message
          : 'Failed to run Today’s XPOT selection',
      );
    } finally {
      setPickingWinner(false);
    }
  }

  // Reward payout control
  async function handleMarkPayout(winner: AdminWinner) {
    const txUrl =
      typeof window !== 'undefined'
        ? window.prompt(
            'Paste reward tx URL (optional). Leave blank if not needed.',
            winner.txUrl ?? '',
          )
        : winner.txUrl ?? '';

    try {
      setSavingPayoutId(winner.drawId);
      const data = await adminFetch('/api/admin/winners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drawId: winner.drawId,
          txUrl: txUrl || null,
        }),
      });

      if (!data.ok) {
        throw new Error(data.error ?? 'Failed to save reward status');
      }

      await loadAll();
    } catch (err) {
      console.error('[ADMIN] mark-paid error:', err);
      setWinnersError(
        err instanceof Error ? err.message : 'Failed to save reward status',
      );
    } finally {
      setSavingPayoutId(null);
    }
  }

  // ─────────────────────────────────────────────
  // Derived values
  // ─────────────────────────────────────────────

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
              XPOT admin - TESTING
            </p>
            <p className="text-sm text-slate-300">
              Internal control room for Today&apos;s XPOT, pool state and
              selected wallets.
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
                Paste your admin token to unlock live XPOT data. Stored only in
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
              Admin token accepted. XPOT admin endpoints are unlocked for this
              browser.
            </p>
          )}
        </section>

        {/* Main layout */}
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
          {/* LEFT COLUMN */}
          <div className="space-y-4">
            {/* XPOT panel – 1,000,000 XPOT + live USD via Jupiter */}
            <JackpotPanel isLocked={isDrawLocked} />

            {/* Today’s XPOT */}
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Today&apos;s XPOT
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Overview of Today&apos;s XPOT round: entries, XPOT pool
                    state and timing.
                  </p>
                </div>

                <div className="flex items-center gap-2">
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
                      XPOT locked
                    </div>
                  )}
                </div>
              </header>

              {!adminToken && (
                <p className="mt-3 text-xs text-slate-500">
                  Paste your admin key above to load Today&apos;s XPOT details.
                </p>
              )}

              {adminToken && loadingToday && (
                <p className="mt-3 text-xs text-slate-500">
                  Loading Today&apos;s XPOT…
                </p>
              )}

              {adminToken && todayError && !loadingToday && (
                <p className="mt-3 text-xs text-amber-300">
                  Failed to load Today&apos;s XPOT. {todayError}
                </p>
              )}

              {adminToken && todayWinner && (
                <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-3 py-3 text-[11px] text-slate-100">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                    Today&apos;s XPOT result
                  </p>
                  <p className="mt-1 font-mono text-xs">
                    {todayWinner.ticketCode}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {todayWinner.walletAddress}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-emerald-300">
                    <UsdPill amount={todayWinner.jackpotUsd} size="sm" />
                    <span className="text-slate-500">·</span>
                    <span>
                      {todayWinner.paidOut ? 'Reward sent' : 'Pending reward'}
                    </span>
                  </p>
                </div>
              )}

              {adminToken && todayDraw && !loadingToday && !todayError && (
                <>
                  <div className="mt-4 grid gap-4 text-xs text-slate-200 sm:grid-cols-2">
                    <div>
                      <p className="text-slate-400">Round status</p>
                      <p className="mt-1 font-semibold capitalize">
                        {todayDraw.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Entries in pool</p>
                      <p className="mt-1 font-semibold">
                        {todayDraw.ticketsCount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Rollover amount</p>
                      <p className="mt-1">
                        <UsdPill amount={todayDraw.rolloverUsd} size="sm" />
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">
                        Today&apos;s XPOT{' '}
                        <span className="text-[11px] text-slate-500">
                          (live)
                        </span>
                      </p>
                      <p className="mt-1">
                        <UsdPill
                          amount={liveJackpotUsd ?? todayDraw.jackpotUsd}
                        />
                      </p>
                    </div>
                  </div>

                  {/* When round is open but no entries */}
                  {todayDraw.status === 'open' &&
                    todayDraw.ticketsCount === 0 && (
                      <p className="mt-4 w-full rounded-full bg-slate-900 py-2 text-center text-xs text-slate-500">
                        No entries in Today&apos;s XPOT yet.
                      </p>
                    )}

                  {/* When round is open and entries > 0 */}
                  {todayDraw.status === 'open' &&
                    todayDraw.ticketsCount > 0 && (
                      <button
                        type="button"
                        disabled={!canPickWinner}
                        className="mt-4 w-full rounded-full bg-amber-400 py-2 text-xs font-semibold text-black hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-amber-300/60"
                        onClick={() => {
                          setPickError(null);
                          setShowPickModal(true);
                        }}
                      >
                        {pickingWinner
                          ? 'Running selection…'
                          : 'Run selection now'}
                      </button>
                    )}

                  {/* When round is locked / completed */}
                  {todayDraw.status !== 'open' && (
                    <>
                      <p className="mt-3 text-[11px] text-slate-400">
                        Today&apos;s XPOT is locked. You can review the selected
                        wallet and reward status below.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setReopenError(null);
                          setShowReopenModal(true);
                        }}
                        className="mt-3 w-full rounded-full border border-slate-700 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-500 hover:bg-slate-900"
                      >
                        Re-open Today&apos;s XPOT (panic switch)
                      </button>
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
                        Selected wallet locked for Today&apos;s XPOT
                      </p>
                      <p className="mt-1">
                        Entry:{' '}
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
                        <p className="mt-0.5 flex items-center gap-1">
                          <span>XPOT value:</span>
                          <UsdPill
                            amount={lastPickedWinner.jackpotUsd}
                            size="sm"
                          />
                        </p>
                      )}
                    </div>
                  )}

                  {/* Selection confirmation modal */}
                  {todayDraw && (
                    <Modal
                      open={showPickModal}
                      onClose={() => {
                        if (!pickingWinner) setShowPickModal(false);
                      }}
                      title="Confirm Today’s XPOT selection"
                    >
                      <p className="mb-3 text-xs text-slate-300">
                        XPOT will randomly select one entry from Today&apos;s
                        pool. This action can&apos;t be undone.
                      </p>

                      <div className="mb-3 rounded-lg bg-slate-900 px-3 py-2 text-[11px] text-slate-200">
                        <p>
                          Entries in pool:{' '}
                          <span className="font-semibold">
                            {todayDraw.ticketsCount.toLocaleString()}
                          </span>
                        </p>
                        <p className="mt-1 flex items-center gap-1">
                          <span>Today&apos;s XPOT:</span>
                          <UsdPill
                            amount={liveJackpotUsd ?? todayDraw.jackpotUsd}
                            size="sm"
                          />
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
                            ? 'Running selection…'
                            : 'Yes, run selection'}
                        </button>
                      </div>
                    </Modal>
                  )}

                  {/* Re-open XPOT confirmation modal */}
                  {todayDraw && (
                    <Modal
                      open={showReopenModal}
                      onClose={() => {
                        if (!reopening) setShowReopenModal(false);
                      }}
                      title="Re-open Today’s XPOT?"
                    >
                      <p className="mb-3 text-xs text-slate-300">
                        This will unlock Today&apos;s XPOT round so new entries
                        can be added again. Use this only as an emergency
                        switch.
                      </p>

                      <div className="mb-3 rounded-lg bg-slate-900 px-3 py-2 text-[11px] text-slate-200">
                        <p>
                          Entries in pool:{' '}
                          <span className="font-semibold">
                            {todayDraw.ticketsCount.toLocaleString()}
                          </span>
                        </p>
                        <p className="mt-1 flex items-center gap-1">
                          <span>Today&apos;s XPOT:</span>
                          <UsdPill
                            amount={liveJackpotUsd ?? todayDraw.jackpotUsd}
                            size="sm"
                          />
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
                            : 'Yes, re-open Today’s XPOT'}
                        </button>
                      </div>
                    </Modal>
                  )}
                </>
              )}
            </section>

            {/* Today’s XPOT entries */}
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
              <h2 className="text-sm font-semibold text-slate-100">
                Today&apos;s XPOT entries
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Every entry that has been issued for the current XPOT round.
              </p>

              {!adminToken && (
                <p className="mt-3 text-xs text-slate-500">
                  Unlock with your admin key to see Today&apos;s XPOT entries.
                </p>
              )}

              {adminToken && loadingTickets && (
                <p className="mt-3 text-xs text-slate-500">
                  Loading entries…
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
                    No entries yet for Today&apos;s XPOT.
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
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            {/* Recent XPOT results */}
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Recent XPOT results
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Internal log of the latest selected entries and reward
                    status.
                  </p>
                </div>
              </div>

              {!adminToken && (
                <p className="mt-3 text-xs text-slate-500">
                  Unlock with your admin key to see completed XPOT rounds.
                </p>
              )}

              {adminToken && loadingWinners && (
                <p className="mt-3 text-xs text-slate-500">
                  Loading XPOT results…
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
                    No completed XPOT rounds yet. Once you run selections and
                    mark rewards as sent, they&apos;ll appear here.
                  </p>
                )}

              {adminToken &&
                !loadingWinners &&
                !winnersError &&
                recentWinners.length > 0 && (
                  <div className="mt-3 space-y-2 text-[11px] text-slate-200">
                    {recentWinners.map(w => (
                      <div
                        key={w.drawId}
                        className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
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
                            <p className="mt-0.5">
                              <UsdPill amount={w.jackpotUsd} size="sm" />
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {w.paidOut ? 'Reward sent' : 'Pending'}
                            </p>
                          </div>
                        </div>

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

                        {!w.paidOut && (
                          <button
                            type="button"
                            onClick={() => handleMarkPayout(w)}
                            disabled={savingPayoutId === w.drawId}
                            className="mt-2 rounded-full border border-emerald-500/60 px-3 py-1 text-[10px] font-semibold text-emerald-200 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {savingPayoutId === w.drawId
                              ? 'Saving reward…'
                              : 'Mark reward sent + tx link'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
