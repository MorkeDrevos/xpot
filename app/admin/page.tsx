// app/admin/page.tsx
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
  jackpotUsd: number; // internal name, keep for now
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
  jackpotUsd?: number; // internal
};

type AdminWinner = {
  drawId: string;
  date: string;
  ticketCode: string;
  walletAddress: string;
  jackpotUsd: number; // internal
  paidOut: boolean;
  txUrl?: string;
};

const ADMIN_TOKEN_KEY = 'xpot_admin_token';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatUsd(amount: number | null | undefined, decimals = 2) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '0.00';
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatUsdPrice(amount: number | null | undefined) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '0.000000';
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  });
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

// Fixed 1,000,000 XPOT allocation pill
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

function shortenWallet(addr: string | null | undefined, visible = 4) {
  if (!addr) return '';
  if (addr.length <= visible * 2 + 3) return addr;
  return `${addr.slice(0, visible)}…${addr.slice(-visible)}`;
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

  const [pickingWinner, setPickingWinner] = useState(false);
  const [lastPickedWinner, setLastPickedWinner] = useState<{
    ticketCode: string;
    walletAddress: string;
    jackpotUsd?: number;
  } | null>(null);
  const [winnerJustPicked, setWinnerJustPicked] = useState(false);

  const [showPickModal, setShowPickModal] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);

  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);
  const [reopening, setReopening] = useState(false);

  const [savingPayoutId, setSavingPayoutId] = useState<string | null>(null);
  const [copiedWalletId, setCopiedWalletId] = useState<string | null>(null);

  // ─────────────────────────────────────────────
  // Effects
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
        console.error('[ADMIN] live allocation fetch failed', err);
      }
    }

    loadLiveJackpot();
    const id = window.setInterval(loadLiveJackpot, 15_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (adminToken) {
      void loadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  // ─────────────────────────────────────────────
  // Internal helpers
  // ─────────────────────────────────────────────

  async function handleCopyWallet(address: string, id: string) {
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        address
      ) {
        await navigator.clipboard.writeText(address);
        setCopiedWalletId(id);
        setTimeout(() => {
          setCopiedWalletId(prev => (prev === id ? null : prev));
        }, 1500);
      }
    } catch (err) {
      console.error('[ADMIN] copy wallet failed', err);
    }
  }

  async function adminFetch(path: string, options: RequestInit = {}) {
    if (!adminToken) throw new Error('NO_ADMIN_TOKEN');

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

  async function handleMarkPayout(winner: AdminWinner) {
    const txUrl =
      typeof window !== 'undefined'
        ? window.prompt(
            'Paste payout tx URL (optional). Leave blank if not needed.',
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

      if (!data.ok) throw new Error(data.error ?? 'Failed to save payout');

      await loadAll();
    } catch (err) {
      console.error('[ADMIN] mark-paid error:', err);
      setWinnersError(
        err instanceof Error ? err.message : 'Failed to save payout',
      );
    } finally {
      setSavingPayoutId(null);
    }
  }

    async function handleStartDraw(hoursFromNow: number) {
    if (!adminToken) return;

    const closesAt = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);

    try {
      // optional: show some temporary UI later
      const data = await adminFetch('/api/admin/draw/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closesAt: closesAt.toISOString(),
          // you can pass jackpotUsd override here if you want:
          // jackpotUsd: liveJackpotUsd ?? todayDraw?.jackpotUsd ?? 0,
        }),
      });

      if (!data.ok) throw new Error(data.error ?? 'Failed to start draw');

      // Reload today’s draw + tickets + winners
      await loadAll();
    } catch (err) {
      console.error('[ADMIN] start-draw error:', err);
      setTodayError(
        err instanceof Error ? err.message : 'Failed to start / reset draw',
      );
    }
  }

  // ─────────────────────────────────────────────
  // Derived
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
              XPOT admin
            </p>
            <p className="text-sm text-slate-300">
              Internal control room for today&apos;s draw, XPOT allocation
              state and winners.
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
              <p className="text-xs font-semibold text-slate-200">Admin key</p>
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
            {/* XPOT allocation panel – 1,000,000 XPOT + live USD */}
            <JackpotPanel isLocked={isDrawLocked} />

                        {/* Today’s draw */}
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Today&apos;s draw
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Overview of today&apos;s draw: ticket pool, allocation
                    amount and timing.
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
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

                  {/* Start / reset draw button */}
                  {adminToken && (
                    <button
                      type="button"
                      onClick={() => handleStartDraw(3)} // 3h timer – tweak later
                      className="rounded-full border border-sky-500/60 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-200 hover:bg-sky-500/20"
                    >
                      Start / reset today&apos;s draw (3h)
                    </button>
                  )}
                </div>
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

              {/* Today winner badge */}
              {adminToken && todayWinner && (
                <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-3 py-3 text-[11px] text-slate-100">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                    Today&apos;s allocation recipient
                  </p>
                  <p className="mt-1 font-mono text-xs">
                    {todayWinner.ticketCode}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyWallet(
                          todayWinner.walletAddress,
                          `today-${todayWinner.drawId}`,
                        )
                      }
                      className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400 hover:text-sky-300 focus:outline-none"
                    >
                      <span>{shortenWallet(todayWinner.walletAddress, 4)}</span>
                      <span className="rounded-full bg-slate-800 px-2 py-[1px] text-[9px] uppercase tracking-[0.18em]">
                        {copiedWalletId === `today-${todayWinner.drawId}`
                          ? 'Copied'
                          : 'Copy'}
                      </span>
                    </button>
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-[10px] text-emerald-300">
                    <XpotPill size="sm" />
                    <span className="text-slate-500">·</span>
                    <span>
                      {todayWinner.paidOut
                        ? 'Allocation paid out'
                        : 'Pending payout'}
                    </span>
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
                      <p className="text-slate-400">Tickets in pool</p>
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
                      <p className="text-[#F5C46C] drop-shadow-[0_0_6px_rgba(245,196,108,0.6)]">
  Today's XPOT{' '}
  <span className="text-[11px] text-[#F5C46C]/70">(live)</span>
</p>
                      <p className="mt-1">
                        <UsdPill
                          amount={liveJackpotUsd ?? todayDraw.jackpotUsd}
                        />
                      </p>
                    </div>
                  </div>

                  {todayDraw.status === 'open' &&
                    todayDraw.ticketsCount === 0 && (
                      <p className="mt-4 w-full rounded-full bg-slate-900 py-2 text-center text-xs text-slate-500">
                        No tickets in pool yet.
                      </p>
                    )}

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
                          ? 'Picking allocation recipient…'
                          : 'Pick allocation recipient now'}
                      </button>
                    )}

                  {todayDraw.status !== 'open' && (
                    <>
                      <p className="mt-3 text-[11px] text-slate-400">
                        Draw is locked. You can review the recipient and payout
                        status below.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setReopenError(null);
                          setShowReopenModal(true);
                        }}
                        className="mt-3 w-full rounded-full border border-slate-700 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-500 hover:bg-slate-900"
                      >
                        Re-open draw (panic switch)
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
                        Allocation recipient locked for today&apos;s draw
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
                        <p className="mt-0.5 flex items-center gap-1">
                          <span>Allocation amount:</span>
                          <XpotPill size="sm" />
                        </p>
                      )}
                    </div>
                  )}

                  {/* Pick winner modal */}
                  {todayDraw && (
                    <Modal
                      open={showPickModal}
                      onClose={() => {
                        if (!pickingWinner) setShowPickModal(false);
                      }}
                      title="Confirm today’s allocation recipient"
                    >
                      <p className="mb-3 text-xs text-slate-300">
                        XPOT will randomly select one ticket from
                        today&apos;s pool as the allocation recipient. This
                        action can&apos;t be undone.
                      </p>

                      <div className="mb-3 rounded-lg bg-slate-900 px-3 py-2 text-[11px] text-slate-200">
                        <p>
                          Tickets in pool:{' '}
                          <span className="font-semibold">
                            {todayDraw.ticketsCount.toLocaleString()}
                          </span>
                        </p>
                        <p className="mt-1 flex items-center gap-1">
                          <span>Allocation amount:</span>
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
                            ? 'Picking recipient…'
                            : 'Yes, pick recipient'}
                        </button>
                      </div>
                    </Modal>
                  )}

                  {/* Re-open draw modal */}
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
                        <p className="mt-1 flex items-center gap-1">
                          <span>Allocation amount:</span>
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
                            : 'Yes, re-open draw'}
                        </button>
                      </div>
                    </Modal>
                  )}
                </>
              )}
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
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyWallet(
                                  t.walletAddress,
                                  `ticket-${t.id}`,
                                )
                              }
                              className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400 hover:text-sky-300 focus:outline-none"
                            >
                              <span>{shortenWallet(t.walletAddress, 4)}</span>
                              <span className="rounded-full bg-slate-800 px-2 py-[1px] text-[9px] uppercase tracking-[0.18em]">
                                {copiedWalletId === `ticket-${t.id}`
                                  ? 'Copied'
                                  : 'Copy'}
                              </span>
                            </button>
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
            {/* Recent winners */}
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    Recent allocation recipients
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Internal log of the latest selected tickets and payout
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
                  Loading recent recipients…
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
                    No completed draws yet. Once you pick recipients and mark
                    allocations as paid, they&apos;ll appear here.
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
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyWallet(
                                    w.walletAddress,
                                    `winner-${w.drawId}`,
                                  )
                                }
                                className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400 hover:text-sky-300 focus:outline-none"
                              >
                                <span>
                                  {shortenWallet(w.walletAddress, 4)}
                                </span>
                                <span className="rounded-full bg-slate-800 px-2 py-[1px] text-[9px] uppercase tracking-[0.18em]">
                                  {copiedWalletId === `winner-${w.drawId}`
                                    ? 'Copied'
                                    : 'Copy'}
                                </span>
                              </button>
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] text-slate-400">
                              {new Date(w.date).toLocaleDateString()}
                            </p>
                            <p className="mt-0.5">
                              {/* XPOT allocation pill here */}
                              <XpotPill size="sm" />
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {w.paidOut ? 'Paid out' : 'Pending'}
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
                              ? 'Saving payout…'
                              : 'Mark as paid + tx link'}
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
