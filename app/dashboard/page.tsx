'use client';

import Link from 'next/link';
import { useState } from 'react';

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

export default function DashboardPage() {
  // No more NextAuth – everything is local state for now
  const isAuthed = true; // treat everyone as “signed in” until we re-add auth

  const username = 'your_handle';

  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [ticketClaimed, setTicketClaimed] = useState(false);
  const [todaysTicket, setTodaysTicket] = useState<Entry | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // For now this is just a boolean. Later we swap it for real wallets.
  const [walletConnected, setWalletConnected] = useState(false);

  const winner = entries.find(e => e.status === 'won');

  // ─────────────────────────────────────────────
  // Ticket helpers
  // ─────────────────────────────────────────────

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
    // 1) Must have wallet connected
    if (!walletConnected) return;

    // 2) Prevent double-claim
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

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-black text-slate-50 relative">
      {/* MAIN DASHBOARD SHELL */}
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
              onClick={handleClaimTicket}
              disabled={!walletConnected}
              className={`btn-premium mt-3 w-full rounded-full py-2 text-sm font-semibold ${
                !walletConnected
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-500 text-black toolbar-glow'
              }`}
            >
              {!walletConnected ? 'Connect wallet to claim' : 'Claim today’s ticket'}
            </button>
          </div>

          {/* Mini user chip + account menu (static preview) */}
          <div className="relative">
            <div
              className="mb-2 flex items-center justify-between rounded-2xl bg-slate-900/70 px-3 py-2 cursor-pointer hover:bg-slate-800/80"
              onClick={() => setAccountMenuOpen(open => !open)}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs">
                  @
                </div>

                <div className="leading-tight">
                  <p className="flex items-center gap-1 text-xs font-semibold text-slate-50">
                    XPOT user
                  </p>
                  <p className="text-[11px] text-slate-500">@{username}</p>
                </div>
              </div>

              <span className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500">
                ⋯
              </span>
            </div>

            {accountMenuOpen && (
              <div className="x-account-menu absolute bottom-14 left-0 w-72 rounded-3xl border border-slate-800 bg-slate-950 shadow-xl shadow-black/60 overflow-hidden">
                <div className="flex w-full items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-xs">
                      @
                    </div>
                    <div className="leading-tight">
                      <p className="text-xs font-semibold text-slate-50">
                        XPOT user
                      </p>
                      <p className="text-[11px] text-slate-500">@{username}</p>
                    </div>
                  </div>
                </div>

                <hr className="border-t border-slate-900" />

                <button
                  type="button"
                  className="block w-full px-4 py-3 text-left text-[13px] text-slate-400 hover:bg-slate-900 cursor-default"
                >
                  Login with X coming soon
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
                    <span className="text-lg">🖤</span>
                  </div>

                  <div className="flex flex-col leading-tight">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-slate-50">
                        Mørke Drevos
                      </span>
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

              {/* TODAY'S TICKET CARD – CLEAN ENTRY FLOW */}
              <article className="premium-card border-b border-slate-900/60 px-4 pt-4 pb-5">
                <h2 className="text-sm font-semibold text-emerald-100">
                  Today’s ticket
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  One ticket per wallet per draw. Hold the minimum XPOT when
                  you claim. You can always buy or sell again later.
                </p>

                {!ticketClaimed ? (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-200">
                        Claim your ticket for today’s jackpot.
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Your ticket will be tied to your connected wallet for
                        today’s draw.
                      </p>
                      {!walletConnected && (
                        <p className="mt-1 text-[11px] text-amber-300">
                          Connect your wallet on the right to claim today’s
                          ticket.
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleClaimTicket}
                      disabled={!walletConnected}
                      className={`btn-premium mt-3 rounded-full px-5 py-2 text-sm font-semibold sm:mt-0 ${
                        !walletConnected
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-500 text-black toolbar-glow'
                      }`}
                    >
                      {!walletConnected
                        ? 'Connect wallet to claim'
                        : 'Claim today’s ticket'}
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-emerald-100">
                        ✅ Your ticket is in today’s draw.
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Come back when the countdown hits zero to see if you
                        won.
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
                        wallet once the countdown reaches zero.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-300">
                    Your tickets are in the draw. The result will appear here
                    when the timer hits zero.
                  </p>
                )}
              </article>

              {/* Tickets feed */}
              <section className="pb-10 px-4">
                <h2 className="pt-3 text-sm font-semibold text-slate-200">
                  Your tickets
                </h2>
                <p className="text-xs text-slate-500">
                  Each ticket is tied to a specific daily draw and your wallet.
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
                            disabled
                          >
                            View entry tweet (soon)
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
          <aside className="hidden w-80 flex-col gap-4 bg-slate-950/40 px-4 py-4 lg:flex">
            {/* Wallet card */}
            <div className="premium-card p-4">
              <h3 className="text-sm font-semibold">Wallet</h3>

              {walletConnected ? (
                <>
                  <p className="mt-1 text-xs text-emerald-300">
                    Wallet connected (preview).
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    In v1, this will show your XPOT balance and basic checks at
                    claim time.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-xs text-slate-400">
                    Connect wallet before claiming today’s ticket.
                  </p>
                  <button
                    type="button"
                    onClick={() => setWalletConnected(true)}
                    className="mt-3 w-full rounded-full bg-purple-600 py-2 text-sm font-semibold text-white hover:bg-purple-500"
                  >
                    Connect wallet (preview)
                  </button>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Real Phantom / Solflare / Backpack wiring comes next.
                  </p>
                </>
              )}
            </div>

            {/* How it works */}
            <div className="premium-card p-4">
              <h3 className="text-sm font-semibold">How today’s draw works</h3>
              <ul className="mt-2 text-xs text-slate-400 space-y-1">
                <li>• Claim exactly one ticket per wallet.</li>
                <li>• Wallet is only checked when claiming.</li>
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
