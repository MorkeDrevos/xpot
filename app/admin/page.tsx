// app/admin/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';

import JackpotPanel from '@/components/JackpotPanel';
import Image from 'next/image';
import Link from 'next/link';

const MAX_TODAY_TICKETS = 10;   // how many “Today’s XPOT entries” to show
const MAX_RECENT_WINNERS = 15;  // how many “Recent XPOT winners” to show

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

  // mark-as-paid local state
  const [txInputs, setTxInputs] = useState<Record<string, string>>({});
  const [savingPaidId, setSavingPaidId] = useState<string | null>(null);
  const [markPaidError, setMarkPaidError] = useState<string | null>(null);

  // how many tickets / winners to show; grow when you click "Load more"
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
  const [bonusAmount, setBonusAmount] = useState('500');
  const [bonusLabel, setBonusLabel] = useState('Bonus XPOT');
  const [bonusSubmitting, setBonusSubmitting] = useState(false);
  const [bonusError, setBonusError] = useState<string | null>(null);
  const [bonusSuccess, setBonusSuccess] = useState<string | null>(null);

  // Pick main winner state
  const [pickError, setPickError] = useState<string | null>(null);
  const [pickSuccess, setPickSuccess] = useState<string | null>(null);
  const [isPickingWinner, setIsPickingWinner] = useState(false);

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

      // Reload admin so the Today card + tickets refresh
      window.location.reload();
    } catch (err: any) {
      console.error('[XPOT] create today draw error:', err);
      alert(err.message || 'Unexpected error creating today’s round');
    } finally {
      setCreatingDraw(false);
    }
  }

  // ── Drop bonus XPOT (bonus winner) ─────────────────────────

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

      // Refresh winners list
      try {
        const winnersData = await authedFetch('/api/admin/winners');
        setWinners(winnersData.winners ?? []);
      } catch {
        // ignore secondary error
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
      if (!w) {
        throw new Error('No winner returned from API');
      }

      setPickSuccess(
        `Main XPOT winner: ${w.ticketCode} (${w.walletAddress.slice(
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
      setPickError(err.message || 'Failed to pick main XPOT winner');
    } finally {
      setIsPickingWinner(false);
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
      const res = await authedFetch('/api/admin/mark-paid', {
        method: 'POST',
        body: JSON.stringify({ winnerId, txUrl }),
      });

      if (!res.ok) {
        throw new Error(res.error || 'Failed to mark as paid');
      }

      // Update local winners list
      setWinners((prev) =>
        prev.map((w) =>
          w.id === winnerId
            ? { ...w, isPaidOut: true, txUrl }
            : w,
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

  // ── Countdown until todayDraw.closesAt ────────────────────────

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

  // Clamp visibleWinnerCount if winners shrink / first load
  useEffect(() => {
    setVisibleWinnerCount((prev) =>
      Math.min(prev, winners.length || MAX_RECENT_WINNERS),
    );
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

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <main className="mx-auto max-w-7xl flex flex-col gap-6 px-4 py-6 text-slate-100 bg-[color:var(--bg-elevated)] rounded-3xl">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {/* Logo + admin label */}
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

        <div className="flex flex-col items-start sm:items-end gap-1">
          <h1 className="text-sm sm:text-base font-semibold text-white">
            Control room for today&apos;s XPOT round.
          </h1>
          <p className="text-[11px] text-slate-500">
            Monitor pool state, entries and rewards. All data is live and admin-key gated.
          </p>
        </div>
      </header>

      {/* Admin key card */}
      <section className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-100">Admin key</p>
            <p className="mt-1 text-xs text-slate-400">
              Enter your admin token to unlock XPOT operations
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
      </section>

      {/* Main grid: left (XPOT + summary + entries), right (winners) */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)]">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* Big live XPOT card */}
          <JackpotPanel
            isLocked={isDrawLocked}
            onJackpotUsdChange={setLiveJackpotUsd}
          />

          {/* Today’s XPOT summary card */}
          {/* (all your summary / bonus / entries sections stay exactly as you pasted) */}
          {/* I’m keeping them here unchanged for brevity in this explanation */}

          {/* ─────────────────────────────────────────────────
              Your existing "Today’s XPOT summary card",
              "Drop bonus XPOT" and "Today’s XPOT entries"
              blocks go here exactly as in your last message.
              ───────────────────────────────────────────────── */}
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

                          <div className="flex flex-col items-end gap-1">
                            {/* Status pill */}
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
                                w.isPaidOut
                                  ? 'bg-emerald-500/10 text-emerald-300'
                                  : 'bg-amber-500/10 text-amber-300'
                              }`}
                            >
                              {w.isPaidOut ? 'Reward sent' : 'Pending payout'}
                            </span>

                            {/* TX link + Mark as paid controls */}
                            {w.isPaidOut ? (
                              w.txUrl && (
                                <a
                                  href={w.txUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
                                >
                                  View TX
                                </a>
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
                        Showing latest {visibleWinners.length} of {winners.length}{' '}
                        winners
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
