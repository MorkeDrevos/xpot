'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

// ── Helpers / types ──────────────────────────────────────────────

const MIN_PER_ENTRY = 1_000_000;
const mockBalance = 3_400_000; // 3.4M XPOT (preview)
const entryCount = Math.floor(mockBalance / MIN_PER_ENTRY);

type TicketStatus = 'in-draw' | 'won' | 'expired' | 'claimed' | 'not-picked';

type Ticket = {
  id: number;
  dateLabel: string; // e.g. "Today · Nov 27"
  code: string;
  status: TicketStatus;
  jackpotUsd: string;
  claimDeadline?: string; // e.g. "Claim within 24h"
};

function makeCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = () =>
    Array.from({ length: 4 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join('');
  return `XPOT-${block()}-${block()}`;
}

function makeDateLabel(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const isToday = offsetDays === 0;
  const base = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return isToday ? `Today · ${base}` : base;
}

const todayLabel = makeDateLabel(0);

// Some mock history so UI feels real
const initialTickets: Ticket[] = [
  {
    id: 1,
    dateLabel: makeDateLabel(-2),
    code: makeCode(),
    status: 'not-picked',
    jackpotUsd: '$10,000',
  },
  {
    id: 2,
    dateLabel: makeDateLabel(-1),
    code: makeCode(),
    status: 'expired',
    jackpotUsd: '$10,800',
    claimDeadline: 'Not claimed in time · rolled over',
  },
  {
    id: 3,
    dateLabel: todayLabel,
    code: makeCode(),
    status: 'in-draw',
    jackpotUsd: '$11,600',
    claimDeadline: 'Result after today’s draw',
  },
];

// ── Page ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const user = session?.user as any | undefined;
  const isAuthed = !!session;
  const isVerified = !!user?.verified;

  // robust username fallback
  const username =
    user?.username ||
    user?.screen_name ||
    user?.handle ||
    (user?.name ? user.name.replace(/\s+/g, '').toLowerCase() : null) ||
    'your_handle';

  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [copiedCodeId, setCopiedCodeId] = useState<number | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // Auto-update on new deploy banner
  const [currentBuildId, setCurrentBuildId] = useState<string | null>(null);
  const [hasNewBuild, setHasNewBuild] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkBuild() {
      try {
        const res = await fetch('/api/build-info', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { buildId?: string };
        const incoming = data.buildId || 'unknown';

        if (!currentBuildId) {
          setCurrentBuildId(incoming);
          return;
        }

        if (incoming !== currentBuildId && !cancelled) {
          setHasNewBuild(true);
        }
      } catch {
        // ignore
      }
    }

    checkBuild();
    const interval = setInterval(checkBuild, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentBuildId]);

  const todayTicket = tickets.find(t => t.dateLabel === todayLabel);
  const hasTodayTicket = !!todayTicket;
  const winnerToday = todayTicket && todayTicket.status === 'won';
  const hasAnyTickets = tickets.length > 0;

  async function handleCopyCode(ticket: Ticket) {
    try {
      await navigator.clipboard.writeText(ticket.code);
      setCopiedCodeId(ticket.id);
      setTimeout(() => setCopiedCodeId(null), 1500);
    } catch {
      // ignore for now
    }
  }

  function openXLoginPopup() {
    if (typeof window === 'undefined') return;

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const url = '/auth/x-login';

    const popup = window.open(
      url,
      'xpot-x-login',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
    );

    if (!popup) return;

    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        window.location.reload();
      }
    }, 800);
  }

  function handleGetTodayTicket() {
    if (!isAuthed) {
      openXLoginPopup();
      return;
    }

    if (hasTodayTicket) {
      return;
    }

    const newTicket: Ticket = {
      id: tickets.length ? tickets[tickets.length - 1].id + 1 : 1,
      dateLabel: todayLabel,
      code: makeCode(),
      status: 'in-draw',
      jackpotUsd: '$11,600',
      claimDeadline: 'Result after today’s draw',
    };

    setTickets(prev => [...prev, newTicket]);
  }

  function handleClaimToday() {
    if (!todayTicket || todayTicket.status !== 'won') return;

    setTickets(prev =>
      prev.map(t =>
        t.id === todayTicket.id ? { ...t, status: 'claimed', claimDeadline: 'Claimed in time' } : t
      )
    );
  }

  return (
    <main className="min-h-screen bg-black text-slate-50">
      <div className="mx-auto flex max-w-6xl">
        {/* ── Left nav (X-like) ─────────────────────────────── */}
        <aside className="hidden min-h-screen w-56 border-r border-slate-900 px-3 py-4 md:flex flex-col justify-between">
          <div className="space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-2 px-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-lg">
                💎
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-tight">XPOT</span>
                <span className="text-[11px] text-slate-500">
                  Daily crypto jackpot
                </span>
              </div>
            </div>

            {/* Nav items */}
            <nav className="space-y-1 text-sm">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-full px-3 py-2 font-medium bg-slate-900 text-slate-50"
              >
                <span className="text-lg">🏠</span>
                <span>Dashboard</span>
              </Link>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-full px-3 py-2 text-slate-300 hover:bg-slate-900/70"
              >
                <span className="text-lg">🎟️</span>
                <span>Draw history</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-full px-3 py-2 text-slate-300 hover:bg-slate-900/70"
              >
                <span className="text-lg">⚙️</span>
                <span>Settings</span>
              </button>
            </nav>

            {/* Big CTA like “Post” – for now just a visual */}
            <button
              type="button"
              className="btn-premium mt-3 w-full rounded-full bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-500 py-2 text-sm font-semibold text-black toolbar-glow"
            >
              Create XPOT entry
            </button>
          </div>

          {/* Mini user chip + account menu (X-style) */}
          <div className="relative">
            {/* Bottom-left chip */}
            <div
              className="mb-2 flex items-center justify-between rounded-2xl bg-slate-900/70 px-3 py-2 cursor-pointer hover:bg-slate-800/80"
              onClick={() => {
                if (!isAuthed) {
                  openXLoginPopup();
                } else {
                  setAccountMenuOpen(open => !open);
                }
              }}
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  {user?.image ? (
                    <img
                      src={user.image}
                      alt={user.name ?? 'X avatar'}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs">
                      @
                    </div>
                  )}

                  {/* Small lock badge on avatar rim */}
                  {isAuthed && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-black">
                      🔒
                    </span>
                  )}
                </div>

                <div className="leading-tight">
                  <p className="flex items-center gap-1 text-xs font-semibold text-slate-50">
                    {user?.name ?? 'Your X handle'}
                    {isAuthed && isVerified && <span className="x-verified-badge" />}
                  </p>
                  <p className="text-[11px] text-slate-500">@{username}</p>
                </div>
              </div>

              {/* Right side: 3 dots */}
              <span className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500">
                ⋯
              </span>
            </div>

            {/* Dropdown menu – X-style account */}
            {isAuthed && accountMenuOpen && (
              <div className="account-menu x-account-menu absolute bottom-14 left-0 w-72 rounded-3xl border border-slate-800 bg-slate-950 shadow-xl shadow-black/60 overflow-hidden">
                {/* Single account row */}
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 hover:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {user?.image ? (
                        <img
                          src={user.image}
                          alt={user.name ?? 'X avatar'}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-xs">
                          @
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-black">
                        🔒
                      </span>
                    </div>
                    <div className="leading-tight">
                      <p className="flex items-center gap-1 text-xs font-semibold text-slate-50">
                        {user?.name ?? 'Your X handle'}
                        {isVerified && <span className="x-verified-badge" />}
                      </p>
                      <p className="text-[11px] text-slate-500">@{username}</p>
                    </div>
                  </div>
                </button>

                {/* Divider */}
                <hr className="border-t border-slate-900" />

                {/* Logout row only */}
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  className="block w-full px-4 py-3 text-left text-[13px] text-slate-200 hover:bg-slate-900"
                >
                  Log out @{username}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main shell: center + right in one premium container ─ */}
        <div className="flex flex-1 gap-6 rounded-[28px] border border-slate-800/70 bg-[#020617] shadow-[0_30px_100px_rgba(0,0,0,0.9)] overflow-hidden">
          {/* ── Center column (feed) ───────────────────────────── */}
          <section className="min-h-screen flex-1">
            {/* Sticky header like X */}
            <header className="sticky top-0 z-10 border-b border-slate-900 bg-black/70 px-4 py-3 backdrop-blur">
              <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
              <p className="text-[13px] text-slate-400">
                Get your daily ticket, see today’s draw and track your wins.
              </p>
            </header>

            {/* New version banner */}
            {hasNewBuild && (
              <div className="border-b border-emerald-700/60 bg-emerald-500/10 px-4 py-2">
                <div className="flex items-center justify-between gap-3 text-xs text-emerald-100">
                  <span>New XPOT version is live.</span>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-black hover:bg-emerald-400"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            )}

            {/* Scroll content */}
            <div className="space-y-4 px-0">
              {/* Profile header – X-style */}
              <section className="flex items-center justify-between border-b border-slate-900 bg-gradient-to-r from-slate-950 via-slate-900/40 to-slate-950 px-4 pt-3 pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-800">
                    <span className="text-lg">🖤</span>
                  </div>

                  <div className="flex flex-col leading-tight">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-slate-50">
                        Mørke Drevos
                      </span>
                      <span className="x-verified-badge" />
                    </div>
                    <span className="text-xs text-slate-500">@{username}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                >
                  ⋯
                </button>
              </section>

              {/* Today’s draw card */}
              <article className="border-b border-slate-900/60 px-4 pt-4 pb-5">
                <div className="card-premium rounded-3xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-300">
                        Today’s draw
                      </p>
                      <p className="mt-1 text-sm text-slate-200">
                        One ticket per X account per day. No snapshots. No spreadsheets.
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Jackpot: <span className="text-emerald-300 font-semibold">$11,600</span> ·
                        Result appears here after today’s draw.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-400">Today</p>
                      <p className="text-sm font-medium text-slate-100">{todayLabel}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                    {!isAuthed ? (
                      <>
                        <p className="text-sm text-slate-200">
                          Sign in with X to get today’s ticket.
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          XPOT is powered by X. We use your X account as your identity.
                        </p>
                        <button
                          type="button"
                          onClick={openXLoginPopup}
                          className="btn-premium mt-3 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-black hover:bg-sky-400"
                        >
                          Sign in with X
                        </button>
                      </>
                    ) : !hasTodayTicket ? (
                      <>
                        <p className="text-sm text-slate-200">
                          You don’t have a ticket for today yet.
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Hold the minimum XPOT when you tap the button below and we’ll
                          create your ticket for today’s draw.
                        </p>
                        <button
                          type="button"
                          onClick={handleGetTodayTicket}
                          className="btn-premium mt-3 rounded-full bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-500 px-4 py-2 text-sm font-semibold text-black toolbar-glow"
                        >
                          Get today’s ticket
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-slate-200">
                          Your ticket for today:
                        </p>
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-slate-50">
                                {todayTicket.code}
                              </span>
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                                {winnerToday ? 'Winner' : 'In today’s draw'}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500">
                              One ticket per X account per day. Your wallet balance only
                              matters at the moment you get the ticket.
                            </p>
                            {todayTicket.claimDeadline && (
                              <p className="mt-1 text-[11px] text-slate-500">
                                {todayTicket.status === 'won'
                                  ? 'You have 24 hours to claim or it rolls over.'
                                  : todayTicket.claimDeadline}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 mt-2 sm:mt-0">
                            <button
                              type="button"
                              onClick={() => handleCopyCode(todayTicket)}
                              className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] text-slate-300 hover:border-slate-500 hover:bg-slate-900"
                            >
                              {copiedCodeId === todayTicket.id ? 'Copied' : 'Copy code'}
                            </button>

                            {winnerToday && (
                              <button
                                type="button"
                                onClick={handleClaimToday}
                                className="btn-premium rounded-full bg-emerald-400 px-4 py-1.5 text-[11px] font-semibold text-slate-900 hover:bg-emerald-300"
                              >
                                Claim today’s jackpot
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </article>

              {/* Tickets history */}
              <section className="pb-10 px-4">
                <h2 className="pt-3 text-sm font-semibold text-slate-200">
                  Your tickets
                </h2>
                <p className="text-xs text-slate-500">
                  One ticket per X account per day. Winners have 24 hours to claim or
                  the full amount rolls over into the next jackpot.
                </p>

                {hasAnyTickets ? (
                  <div className="mt-3 border-l border-slate-800/80 pl-3 space-y-2">
                    {tickets
                      .slice()
                      .reverse()
                      .map(ticket => (
                        <article
                          key={ticket.id}
                          className="rounded-2xl border border-slate-900 bg-slate-950/70 px-4 pb-4 pt-3 hover:border-slate-700 hover:bg-slate-950 transition"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-[11px] text-slate-400">
                                {ticket.dateLabel}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="font-mono text-sm text-slate-50">
                                  {ticket.code}
                                </span>

                                {ticket.status === 'in-draw' && (
                                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                                    In draw
                                  </span>
                                )}
                                {ticket.status === 'won' && (
                                  <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                                    Winner
                                  </span>
                                )}
                                {ticket.status === 'claimed' && (
                                  <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-300">
                                    Claimed
                                  </span>
                                )}
                                {ticket.status === 'expired' && (
                                  <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                                    Expired · rolled over
                                  </span>
                                )}
                                {ticket.status === 'not-picked' && (
                                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                                    Not picked
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-[11px] text-slate-500">
                                Jackpot: {ticket.jackpotUsd}
                              </p>
                              {ticket.claimDeadline && (
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                  {ticket.claimDeadline}
                                </p>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopyCode(ticket)}
                                className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] text-slate-300 hover:border-slate-500 hover:bg-slate-900"
                              >
                                {copiedCodeId === ticket.id ? 'Copied' : 'Copy code'}
                              </button>
                              <button
                                type="button"
                                className="rounded-full border border-slate-800 px-3 py-1 text-[11px] text-slate-400 hover:border-slate-700 hover:bg-slate-950"
                              >
                                View entry tweet ↗
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">
                    You don’t have any tickets yet. Sign in with X and get today’s
                    ticket to enter the next draw.
                  </p>
                )}
              </section>
            </div>
          </section>

          {/* ── Right sidebar (X “What’s happening”) ───────────── */}
          <aside className="hidden w-80 flex-col gap-4 bg-slate-950/40 px-4 py-4 lg:flex">
            {/* Balance preview */}
            <div className="premium-card p-4">
              <h3 className="text-sm font-semibold">XPOT balance (preview)</h3>
              <p className="mt-1 text-xs text-slate-400">
                In v1 this updates in real time from your Solana wallet.
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-emerald-100 to-white">
                {mockBalance.toLocaleString()}{' '}
                <span className="text-sm text-slate-400">XPOT</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                = {entryCount} entries if tickets were automatic. XPOT uses daily tickets instead.
              </p>
            </div>

            {/* Sign in with X */}
            <div className="premium-card p-4">
              <h3 className="text-sm font-semibold">
                {isAuthed ? 'Signed in with X' : 'Sign in with X'}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                XPOT is powered by X. Your X account is your identity for daily tickets.
              </p>

              {!isAuthed ? (
                <button
                  type="button"
                  onClick={openXLoginPopup}
                  className="mt-3 w-full rounded-full bg-sky-500 py-2 text-sm font-semibold text-slate-950 shadow shadow-sky-500/40 hover:bg-sky-400"
                >
                  {status === 'loading' ? 'Checking session…' : 'Sign in with X'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="mt-3 w-full rounded-full bg-slate-800 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700"
                >
                  Sign out
                </button>
              )}
            </div>

            {/* Wallet connect preview */}
            <div className="premium-card p-4">
              <h3 className="text-sm font-semibold">Connect wallet (preview)</h3>
              <p className="mt-1 text-xs text-slate-400">
                In v1, we’ll check your XPOT balance on-chain when you get your daily ticket.
              </p>
              <button
                type="button"
                disabled
                className="mt-3 w-full rounded-full bg-slate-800 py-2 text-xs font-medium text-slate-500 cursor-not-allowed"
              >
                Connect wallet (coming soon)
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
