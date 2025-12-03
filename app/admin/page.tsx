// app/admin/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';

import JackpotPanel from '@/components/JackpotPanel';

// ---------------------------------------------
// Types
// ---------------------------------------------

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
  payoutUsd: number;
  isPaidOut: boolean;
  txUrl?: string | null;
  kind?: AdminWinnerKind;
  label?: string | null;
};

// ---------------------------------------------
// Helpers
// ---------------------------------------------

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

// ---------------------------------------------
// Button styles (control room system)
// ---------------------------------------------

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:opacity-40 disabled:cursor-not-allowed';

const BTN_SECONDARY =
  'inline-flex items-center justify-center rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition';

// ---------------------------------------------
// Page
// ---------------------------------------------

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
  const [bonusAmount, setBonusAmount] = useState('500');
  const [bonusLabel, setBonusLabel] = useState('Bonus jackpot');
  const [bonusSubmitting, setBonusSubmitting] = useState(false);
  const [bonusError, setBonusError] = useState<string | null>(null);
  const [bonusSuccess, setBonusSuccess] = useState<string | null>(null);

  // Pick main winner state
  const [pickError, setPickError] = useState<string | null>(null);
  const [pickSuccess, setPickSuccess] = useState<string | null>(null);
  const [isPickingWinner, setIsPickingWinner] = useState(false);

  // ---------------------------------------------
  // Load admin token from localStorage
  // ---------------------------------------------

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (stored) {
      setAdminToken(stored);
      setTokenAccepted(true);
    }
  }, []);

  // ---------------------------------------------
  // Fetch helpers with auth header
  // ---------------------------------------------

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

  // ---------------------------------------------
  // Drop bonus jackpot (bonus winner)
  // ---------------------------------------------

  async function handleDropBonus(e: React.FormEvent) {
    e.preventDefault();
    setBonusError(null);
    setBonusSuccess(null);

    if (!adminToken) {
      setBonusError('Admin token missing. Unlock admin first.');
      return;
    }

    const amountNumber = Number(bonusAmount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      setBonusError('Enter a valid USD amount.');
      return;
    }

    setBonusSubmitting(true);
    try {
      const res = await authedFetch('/api/admin/bonus', {
        method: 'POST',
        body: JSON.stringify({
          amountUsd: amountNumber,
          label: bonusLabel || 'Bonus jackpot',
        }),
      });

      const r = res.reward;
      setBonusSuccess(
        `Bonus ${formatUsd(r.amountUsd)} sent to ${r.ticketCode} (${r.walletAddress.slice(
          0,
          4,
        )}…${r.walletAddress.slice(-4)}).`,
      );

      // Refresh winners list
      try {
        const winnersData = await authedFetch('/api/admin/winners');
        setWinners(winnersData.winners ?? []);
      } catch {
        // ignore secondary error
      }
    } catch (err: any) {
      setBonusError(err.message || 'Failed to drop bonus jackpot');
    } finally {
      setBonusSubmitting(false);
    }
  }

  // ---------------------------------------------
  // Pick main jackpot winner
  // ---------------------------------------------

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
      if (!w) {
        throw new Error('No winner returned from API');
      }

      setPickSuccess(
        `Main jackpot winner: ${w.ticketCode} (${w.walletAddress.slice(
          0,
          4,
        )}…${w.walletAddress.slice(-4)}).`,
      );

      // Prepend to winners list
      setWinners((prev) => [w, ...prev]);

      // Mark draw as closed in UI
      setTodayDraw((prev) =>
        prev ? { ...prev, status: 'closed' } : prev,
      );
    } catch (err: any) {
      setPickError(err.message || 'Failed to pick main jackpot winner');
    } finally {
      setIsPickingWinner(false);
    }
  }

  // ---------------------------------------------
  // Load today, tickets, winners when token is ready
  // ---------------------------------------------

  useEffect(() => {
    if (!adminToken) return;

    let cancelled = false;

    async function loadAll() {
      // Today
      setTodayLoading(true);
      setTodayDrawError(null);
      try {
        const data = await authedFetch('/api/admin/today');
        if (!cancelled) {
          setTodayDraw(data.today ?? null);
        }
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
        if (!cancelled) {
          setTickets(data.tickets ?? []);
        }
      } catch (err: any) {
        console.error('[ADMIN] /tickets error', err);
        if (!cancelled) {
          setTicketsError(err.message || 'Failed to load tickets');
        }
      } finally {
        if (!cancelled) setTicketsLoading(false);
      }

      // Winners (main + bonus)
      setWinnersLoading(true);
      setWinnersError(null);
      try {
        const data = await authedFetch('/api/admin/winners');
        if (!cancelled) {
          setWinners(data.winners ?? []);
        }
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

  // ---------------------------------------------
  // Countdown until todayDraw.closesAt
  // ---------------------------------------------

  useEffect(() => {
    if (!todayDraw?.closesAt) {
      setCountdownText(null);
      setCountdownSeconds(null);
      return;
    }

    const closesAt = new Date(todayDraw.closesAt);

    function updateCountdown() {
      const now = new Date();
      const diff = closesAt.getTime() - now.getTime();

      // Past closing time – snap to zero and stop decreasing
      if (diff <= 0) {
        setCountdownText('00:00:00');
        setCountdownSeconds(0);
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
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

    return () => {
      window.clearInterval(id);
    };
  }, [todayDraw?.closesAt]);

  // ---------------------------------------------
  // Admin token handling
  // ---------------------------------------------

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

  // ---------------------------------------------
  // Render
  // ---------------------------------------------

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 text-slate-100">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <p className="admin-eyebrow">X P O T · A D M I N</p>
        <h1 className="admin-title">XPOT Operations Center</h1>
        <p className="admin-subtitle">
          Live system access to pool state, entries and rewards. Built for
          accuracy. Protected by design.
        </p>
      </header>

      {/* Admin key card */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-100">Admin key</p>
            <p className="mt-1 text-xs text-slate-400">
              Store your admin token in this browser to unlock XPOT control
              actions and admin-only endpoints.
            </p>
            {tokenAccepted && (
              <p className="mt-1 text-xs font-semibold text-emerald-400">
                Admin token accepted. Secure endpoints unlocked.
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
      </section>

      {/* Main grid: left (Jackpot + summary + entries), right (winners) */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)]">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* Big live XPOT card */}
          <JackpotPanel
            isLocked={isDrawLocked}
            onJackpotUsdChange={setLiveJackpotUsd}
          />

          {/* Today XPOT summary card */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Today&apos;s draw
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Live status for today&apos;s XPOT round: entries, rollover and
                  pool size.
                </p>
              </div>

              {todayDraw && (
                <div className="flex flex-col items-end gap-1 text-xs">
                  <span className="text-slate-500">Draw date</span>
                  <span className="font-mono text-slate-200">
                    {formatDate(todayDraw.date)}
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
                  {!todayLoading && !todayDraw && <span>Not scheduled</span>}
                  {todayLoading && <span>Loading…</span>}

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
    font-mono text-2xl font-semibold mt-2 transition-all
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
  ${BTN_PRIMARY} px-4 py-2 text-sm transition-all ease-out duration-300
  ${isWarningCritical ? 'ring-2 ring-amber-400/40 shadow-lg scale-[1.02]' : ''}
`}
                    >
                      {isPickingWinner
                        ? 'Picking winner…'
                        : 'Pick main jackpot winner'}
                    </button>
                  </div>
                )}

              {!todayDrawError && !todayLoading && !todayDraw && (
                <p>No XPOT draw scheduled for today yet.</p>
              )}

              {/* Main jackpot winner feedback */}
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

          {/* Drop bonus jackpot */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-100">
              Drop bonus jackpot
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Trigger an instant bonus jackpot using today&apos;s ticket pool. A
              random ticket from today&apos;s entries is selected as winner.
            </p>

            <form onSubmit={handleDropBonus} className="mt-4 space-y-4">
              {/* Amount row */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  Amount
                </label>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-400"
                      value={bonusAmount}
                      onChange={(e) => setBonusAmount(e.target.value)}
                    />
                    <span className="text-xs text-slate-400">USD</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[50, 100, 250, 500, 1000].map((v) => (
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
                        ${v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Label row */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  Label
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-400"
                  value={bonusLabel}
                  onChange={(e) => setBonusLabel(e.target.value)}
                  placeholder="Bonus jackpot"
                />
              </div>

              {/* Messages + submit */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs">
                  {bonusError && (
                    <p className="text-amber-300">{bonusError}</p>
                  )}
                  {bonusSuccess && (
                    <p className="text-emerald-300">{bonusSuccess}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={bonusSubmitting}
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm disabled:cursor-not-allowed disabled:bg-emerald-500/40"
                >
                  {bonusSubmitting ? 'Dropping…' : 'Drop bonus jackpot'}
                </button>
              </div>
            </form>
          </section>

          {/* Today XPOT entries list */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-100">
              Today&apos;s XPOT entries
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Every entry that has been issued into today&apos;s XPOT pool.
            </p>

            <div className="mt-3">
              {ticketsLoading && (
                <p className="text-xs text-slate-500">Loading tickets…</p>
              )}

              {ticketsError && (
                <p className="text-xs text-amber-300">{ticketsError}</p>
              )}

              {!ticketsLoading && !ticketsError && tickets.length === 0 && (
                <p className="rounded-xl bg-slate-950/90 px-3 py-2 text-xs text-slate-500">
                  No entries yet for today&apos;s XPOT.
                </p>
              )}

              {!ticketsLoading && !ticketsError && tickets.length > 0 && (
                <div className="mt-2 space-y-2">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/90 px-3 py-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-mono text-[11px] text-slate-100">
                          {t.code}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {t.walletAddress}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-300">
                          {t.status.replace('-', ' ')}
                        </span>
                        <p className="font-mono text-[11px] text-slate-500">
                          {formatDateTime(t.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN – recent winners */}
        <div className="space-y-4">
          <section className="h-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-100">
              Recent XPOT results
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Internal log of the latest selected entries and payout status.
            </p>

            <div className="mt-3">
              {winnersLoading && (
                <p className="text-xs text-slate-500">Loading results…</p>
              )}

              {winnersError && (
                <p className="text-xs text-amber-300">{winnersError}</p>
              )}

              {!winnersLoading && !winnersError && winners.length === 0 && (
                <p className="rounded-xl bg-slate-950/90 px-3 py-2 text-xs text-slate-500">
                  No completed draws yet. Once you pick winners and mark jackpots
                  as paid, they will appear here.
                </p>
              )}

              {!winnersLoading && !winnersError && winners.length > 0 && (
                <div className="mt-2 space-y-3">
                  {winners.map((w) => (
                    <article
                      key={w.id}
                      className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/90 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono text-[11px] text-slate-100">
                          {w.ticketCode}
                        </p>
                        <div className="flex items-center gap-2">
                          {w.label && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
                                w.kind === 'bonus'
                                  ? 'bg-emerald-500/10 text-emerald-300'
                                  : 'bg-slate-800 text-slate-200'
                              }`}
                            >
                              {w.label}
                            </span>
                          )}
                          <p className="text-[11px] text-slate-500">
                            {formatDate(w.date)}
                          </p>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {w.walletAddress}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <UsdPill amount={w.payoutUsd} size="sm" />
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
                            w.isPaidOut
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : 'bg-amber-500/10 text-amber-300'
                          }`}
                        >
                          {w.isPaidOut ? 'Reward sent' : 'Pending payout'}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
