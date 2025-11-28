'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';

// ─────────────────────────────────────────────
// Types & helpers
// ─────────────────────────────────────────────

type EntryStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

type Entry = {
  id: number;
  code: string;
  status: EntryStatus;
  label: string;
  jackpotUsd: string;
  createdAt: string;
};

function makeCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = () =>
    Array.from({ length: 4 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join('');
  return `XPOT-${block()}-${block()}`;
}

// Seed a couple of preview tickets for the list
const now = new Date();
const initialEntries: Entry[] = [
  {
    id: 1,
    code: makeCode(),
    status: 'won',
    label: "Today's main jackpot • $10,000",
    jackpotUsd: '$10,000',
    createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: 2,
    code: makeCode(),
    status: 'in-draw',
    label: "Yesterday's main jackpot • $8,400",
    jackpotUsd: '$8,400',
    createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

// Temporary preview balance – replace with real on-chain balance later
const mockBalance = 7_492_000;

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const user = session?.user as any | undefined;
  const isAuthed = status === 'authenticated';

  // Robust username fallback
  const username =
    user?.username ||
    user?.screen_name ||
    user?.handle ||
    user?.name?.replace(/\s+/g, '').toLowerCase() ||
    'your_handle';

  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [ticketClaimed, setTicketClaimed] = useState(false);
  const [todaysTicket, setTodaysTicket] = useState<Entry | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // TEMP: wallet connection state – wire this to real wallet adapter later
  const [walletConnected, setWalletConnected] = useState(false);

  const winner = entries.find(e => e.status === 'won');

  function openXLoginPopup() {
    if (typeof window === 'undefined') return;

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const url = '/x-login';

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

  async function handleCopy(entry: Entry) {
    try {
      await navigator.clipboard.writeText(entry.code);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  }

  function handleClaimTicket() {
    // 1) Must be signed in with X
    if (!isAuthed) {
      openXLoginPopup();
      return;
    }

    // 2) Must have wallet connected (real wiring later)
    if (!walletConnected) {
      // later: open wallet modal here
      return;
    }

    // 3) Prevent double claim
    if (ticketClaimed) return;

    const newEntry: Entry = {
      id: Date.now(),
      code: makeCode(),
      status: 'in-draw',
      label: "Today's main jackpot • $10,000",
      jackpotUsd: '$10,000',
      createdAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setEntries(prev => [newEntry, ...prev]);
    setTicketClaimed(true);
    setTodaysTicket(newEntry);
  }

  // Close account menu when clicking outside (simple escape key version)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setAccountMenuOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ─────────────────────────────────────────────
  // Today CTA button logic
  // ─────────────────────────────────────────────

  const showClaimCtaLabel = (() => {
    if (!isAuthed) return 'Sign in with X';
    if (!walletConnected) return 'Connect wallet to claim';
    return 'Claim today’s ticket';
  })();

  const showClaimCtaDisabled = (() => {
    // Logged out: button should be clickable to trigger sign-in
    if (!isAuthed) return false;
    // Logged in but no wallet yet: disable until wallet wiring is done
    if (!walletConnected) return true;
    // Logged in + wallet → only disable after claiming
    return ticketClaimed;
  })();

  const handleClaimCtaClick = () => {
    if (!isAuthed) {
      openXLoginPopup();
      return;
    }
    if (!walletConnected) {
      // later: open wallet connect modal
      return;
    }
    handleClaimTicket();
  };

  return (
  <main className="min-h-screen bg-black text-slate-50">
    <div className="mx-auto flex max-w-6xl">
      {/* full-screen hero for claim – keep or remove as needed */}

      <div className="mx-auto flex max-w-6xl">
        {/* ── Left nav (X-style) ───────────────────────────── */}
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

            {/* Main CTA mirrors ticket claim */}
            <button
              type="button"
              onClick={handleClaimCtaClick}
              className="btn-premium mt-3 w-full rounded-full bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-500 py-2 text-sm font-semibold text-black toolbar-glow"
            >
              {showClaimCtaLabel}
            </button>
          </div>

          {/* Mini user chip + account menu */}
          <div className="relative">
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

                <div className="leading-tight">
                  <p className="flex items-center gap-1 text-xs font-semibold text-slate-50">
                    {user?.name ?? 'Your X handle'}
                  </p>
                  <p className="text-[11px] text-slate-500">@{username}</p>
                </div>
              </div>

              <span className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500">
                ⋯
              </span>
            </div>

            {isAuthed && accountMenuOpen && (
              <div className="x-account-menu absolute bottom-14 left-0 w-72 rounded-3xl border border-slate-800 bg-slate-950 shadow-xl shadow-black/60 overflow-hidden">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 hover:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
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
                    <div className="leading-tight">
                      <p className="text-xs font-semibold text-slate-50">
                        {user?.name ?? 'Your X handle'}
                      </p>
                      <p className="text-[11px] text-slate-500">@{username}</p>
                    </div>
                  </div>
                </button>

                <hr className="border-t border-slate-900" />

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

        {/* ── Main shell ───────────────────────────────────── */}
        <div className="flex flex-1 gap-6 rounded-[28px] border border-slate-800/70 bg-[#020617] shadow-[0_30px_100px_rgba(0,0,0,0.9)] overflow-hidden">
          {/* Center column */}
          <section className="min-h-screen flex-1">
            {/* Sticky header */}
            <header className="sticky top-0 z-10 border-b border-slate-900 bg-black/70 px-4 py-3 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Dashboard
                  </h1>
                  <p className="text-[13px] text-slate-400">
                    One jackpot. One winner. Your daily XPOT ticket.
                  </p>
                </div>
                <div className="hidden text-right text-[11px] text-slate-500 sm:block">
                  <p className="uppercase tracking-[0.16em] text-slate-400">
                    Next draw in
                  </p>
                  {/* static preview countdown for now */}
                  <p className="font-mono text-xs text-slate-200">02:14:09</p>
                </div>
              </div>
            </header>

            {/* Scroll content */}
            <div className="space-y-4 px-0">
              {/* Profile header */}
              <section className="flex items-center justify-between border-b border-slate-900 bg-gradient-to-r from-slate-950 via-slate-900/40 to-slate-950 px-4 pt-3 pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-800">
                    {user?.image ? (
                      <img
                        src={user.image}
                        alt={user.name ?? 'X avatar'}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg">🖤</span>
                    )}
                  </div>

                  <div className="flex flex-col leading-tight">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-slate-50">
                        {user?.name ?? 'Not signed in'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {isAuthed ? `@${username}` : 'Sign in with X to claim tickets'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                >
                  ⋯
                </button>
              </section>

              {/* TODAY'S TICKET CARD – CLEAN ENTRY FLOW */}
              <article className="premium-card border-b border-slate-900/60 px-4 pt-4 pb-5">
                <h2 className="text-sm font-semibold text-emerald-100">
                  Today’s ticket
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  One ticket per X account per draw. Hold the minimum XPOT when
                  you claim. You can always buy or sell again later.
                </p>

                {!ticketClaimed ? (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-200">
                        Claim your ticket for today’s jackpot.
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Your ticket will be tied to this X account for today’s draw.
                      </p>
                    </div>

                    <div className="flex flex-col items-start sm:items-end">
                      <button
                        type="button"
                        onClick={handleClaimCtaClick}
                        disabled={showClaimCtaDisabled}
                        className={`btn-premium mt-3 rounded-full px-5 py-2 text-sm font-semibold sm:mt-0 ${
                          showClaimCtaDisabled
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-500 text-black toolbar-glow'
                        }`}
                      >
                        {showClaimCtaLabel}
                      </button>

                      {!isAuthed && (
                        <p className="mt-1 text-[11px] text-slate-400">
                          Sign in with X to claim your daily ticket.
                        </p>
                      )}

                      {isAuthed && !walletConnected && (
                        <p className="mt-1 text-[11px] text-amber-300">
                          Connect your wallet on the right to claim today’s ticket.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-emerald-100">
                        ✅ Your ticket is in today’s draw.
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Come back when the countdown hits zero to see if you won.
                      </p>
                      {todaysTicket && (
                        <p className="mt-2 text-xs text-slate-300">
                          Ticket code:{' '}
                          <span className="font-mono text-emerald-300">
                            {todaysTicket.code}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </article>

              {/* Today’s result card (preview) */}
              <article className="premium-card border-b border-slate-900/60 px-4 pb-5 pt-3">
                <h2 className="text-sm font-semibold text-slate-200">
                  Today’s result
                </h2>

                {winner ? (
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-200">
                        One ticket{' '}
                        <span className="font-mono text-emerald-300">
                          {winner.code}
                        </span>{' '}
                        hit today’s jackpot (preview).
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        In the real draw, this will show the winning ticket and
                        X handle once the countdown reaches zero.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-300">
                    Your tickets are in the draw. The result will appear here when
                    the timer hits zero.
                  </p>
                )}
              </article>

              {/* Tickets feed */}
              <section className="pb-10 px-4">
                <h2 className="pt-3 text-sm font-semibold text-slate-200">
                  Your tickets
                </h2>
                <p className="text-xs text-slate-500">
                  Each ticket is tied to a specific daily draw and this X account.
                </p>

                <div className="mt-3 space-y-2 border-l border-slate-800/80 pl-3">
                  {entries.map(entry => (
                    <article
                      key={entry.id}
                      className="rounded-2xl border border-slate-900 bg-slate-950/70 px-4 pb-4 pt-3 hover:border-slate-700 hover:bg-slate-950 transition"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-slate-50">
                              {entry.code}
                            </span>

                            {entry.status === 'in-draw' && (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                                In draw
                              </span>
                            )}
                            {entry.status === 'won' && (
                              <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                                Winner
                              </span>
                            )}
                            {entry.status === 'claimed' && (
                              <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-300">
                                Claimed
                              </span>
                            )}
                            {entry.status === 'expired' && (
                              <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                                Expired
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            {entry.label}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            Created: {entry.createdAt}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(entry)}
                            className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] text-slate-300 hover:border-slate-500 hover:bg-slate-900"
                          >
                            {copiedId === entry.id ? 'Copied' : 'Copy code'}
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
              </section>
            </div>
          </section>

          {/* Right sidebar */}
          <aside className="hidden w-72 shrink-0 flex-col gap-4 border-l border-slate-900 bg-slate-950/40 p-4 lg:flex">
            {/* Your XPOT */}
            <div className="premium-card mb-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
              <h3 className="text-sm font-semibold text-slate-100">Your XPOT</h3>
              <p className="mt-1 text-xs text-slate-400">
                XPOT in your wallet right now. You can hold, buy or sell any time.
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-emerald-300">
                {mockBalance.toLocaleString()} XPOT
              </p>
            </div>

            {/* Sign in with X card */}
            <div className="premium-card mb-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
              <h3 className="text-sm font-semibold text-slate-100">
                {isAuthed ? 'Signed in with X' : 'Sign in with X'}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                XPOT uses your X account so each daily ticket belongs to one
                identity. No posting is required.
              </p>

              {!isAuthed ? (
                <button
                  type="button"
                  onClick={openXLoginPopup}
                  className="mt-3 w-full rounded-full bg-sky-500 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
                >
                  Sign in with X
                </button>
              ) : (
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {user?.image ? (
                      <img
                        src={user.image}
                        alt={user.name ?? 'X avatar'}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-[11px]">
                        @
                      </div>
                    )}
                    <div className="leading-tight">
                      <p className="text-xs font-semibold text-slate-50">
                        {user?.name ?? 'Your X handle'}
                      </p>
                      <p className="text-[11px] text-slate-500">@{username}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-[11px] text-slate-400 hover:text-red-400"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="premium-card rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
              <h3 className="text-sm font-semibold text-slate-100">
                How today’s draw works
              </h3>
              <ul className="mt-2 space-y-1 text-xs text-slate-400">
                <li>• Claim exactly one ticket per X account.</li>
                <li>• When the timer hits zero, one ticket wins.</li>
                <li>• Winner has 24 hours to claim or jackpot rolls over.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
