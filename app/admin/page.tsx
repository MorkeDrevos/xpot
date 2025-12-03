// app/admin/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';

import JackpotPanel from '@/components/JackpotPanel';

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
  payoutUsd: number;
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

  // Live jackpot USD coming from JackpotPanel
  const [liveJackpotUsd, setLiveJackpotUsd] = useState<number | null>(null);

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

  // ── Drop bonus jackpot (bonus winner) ─────────────────────────

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

  // ── Pick main jackpot winner ─────────────────────────────────

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

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 text-slate-100">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300">
          XPOT ADMIN
        </p>
        <h1 className="text-lg font-semibold text-white">
          Internal control room for Today&apos;s XPOT, pool state and selected
          wallets.
        </h1>
      </header>

      {/* Admin key card */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-100">Admin key</p>
            <p className="mt-1 text-xs text-slate-400">
              Paste your admin token to unlock live XPOT data. Stored only in
              this browser.
            </p>
            {tokenAccepted && (
              <p className="mt-1 text-xs font-semibold text-emerald-400">
                Admin token accepted. XPOT admin endpoints are unlocked for this
                browser.
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
                className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm disabled:cursor-not-allowed disabled:bg-emerald-500/40"
              >
                {tokenAccepted ? 'Update token' : 'Unlock'}
              </button>
              {tokenAccepted && (
                <button
                  type="button"
                  onClick={handleClearToken}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800/80"
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

          {/* Today’s XPOT summary card */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Today&apos;s XPOT
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Overview of today&apos;s XPOT round: entries, XPOT pool state and
                  timing.
                </p>
              </div>

              {todayDraw && (
                <p className="text-xs text-slate-500">
                  Draw date:{' '}
                  <span className="font-mono text-slate-300">
                    {formatDate(todayDraw.date)}
                  </span>
                </p>
              )}
            </div>

            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Round status
                </p>
                <p className="mt-1 font-semibold text-slate-100">
                  {todayLoading && 'Loading…'}
                  {!todayLoading &&
                    todayDraw &&
                    todayDraw.status === 'open' &&
                    'Open'}
                  {!todayLoading &&
                    todayDraw &&
                    todayDraw.status === 'closed' &&
                    'Closed'}
                  {!todayLoading &&
                    todayDraw &&
                    todayDraw.status === 'completed' &&
                    'Completed'}
                  {!todayLoading && !todayDraw && 'Not scheduled'}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Entries in pool
                </p>
                <p className="mt-1 font-mono text-slate-100">
                  {todayLoading ? '–' : todayDraw?.ticketsCount ?? 0}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Rollover amount
                </p>
                <div className="mt-1">
                  <UsdPill amount={todayDraw?.rolloverUsd ?? 0} size="sm" />
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Today&apos;s XPOT (live)
                </p>
                <div className="mt-1">
                  <UsdPill amount={liveJackpotUsd} size="sm" />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-500">
              {todayDrawError && (
                <p className="text-amber-300">{todayDrawError}</p>
              )}
              {!todayDrawError &&
                !todayLoading &&
                todayDraw &&
                todayDraw.closesAt && (
                  <p className="mb-2">
                    Draw closes in{' '}
                    <span className="font-mono text-emerald-300">
                      {/* Countdown text is handled by the client-side timer logic */}
                    </span>{' '}
                    at{' '}
                    <span className="font-mono text-slate-300">
                      {formatDateTime(todayDraw.closesAt)}
                    </span>
                    .
                  </p>
                )}
              {!todayDrawError && !todayLoading && !todayDraw && (
                <p>No XPOT draw scheduled for today yet.</p>
              )}

              {/* Main jackpot winner controls */}
              <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs">
                  {pickError && (
                    <p className="text-amber-300">{pickError}</p>
                  )}
                  {pickSuccess && (
                    <p className="text-emerald-300">{pickSuccess}</p>
                  )}
                </div>
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
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 shadow-sm disabled:cursor-not-allowed disabled:bg-emerald-500/40"
                >
                  {isPickingWinner
                    ? 'Picking winner…'
                    : 'Pick main jackpot winner'}
                </button>
              </div>
            </div>
          </section>

          {/* Drop bonus jackpot */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-100">
              Drop bonus jackpot
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Fire a manual hype jackpot using today&apos;s ticket pool. Winner is
              picked instantly from all tickets in today&apos;s draw.
            </p>

            <form onSubmit={handleDropBonus} className="mt-4 space-y-4">
              {/* Amount row */}
              <div>
                <label className="block text-xs uppercase tracking-[0.16em] text-slate-500">
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
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          Number(bonusAmount) === v
                            ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200'
                            : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-400/70'
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
                <label className="block text-xs uppercase tracking-[0.16em] text-slate-500">
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

          {/* Today’s XPOT entries list */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4 shadow-sm">
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

              {!ticketsLoading && !ticketsError && tickets.length === 0 && (
                <p className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-500">
                  No entries yet for today&apos;s XPOT.
                </p>
              )}

              {!ticketsLoading && !ticketsError && tickets.length > 0 && (
                <div className="mt-2 space-y-2">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs"
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
          <section className="h-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-100">
              Recent XPOT results
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

              {!winnersLoading && !winnersError && winners.length === 0 && (
                <p className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-500">
                  No completed draws yet. Once you pick winners and mark jackpots
                  as paid, they&apos;ll appear here.
                </p>
              )}

              {!winnersLoading && !winnersError && winners.length > 0 && (
                <div className="mt-2 space-y-3">
                  {winners.map((w) => (
                    <article
                      key={w.id}
                      className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs"
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
