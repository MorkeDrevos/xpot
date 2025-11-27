'use client';

import Link from 'next/link';
import { useState } from 'react';

/* ───────────────── Helpers / mock data ───────────────── */

const MLN_PER_ENTRY = 1_000_000;
const mockBalance = 3_400_000; // 3.4M XPOT  →  3 entries
const entryCount = Math.floor(mockBalance / MLN_PER_ENTRY);

type EntryStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

type Entry = {
  id: number;
  code: string;
  status: EntryStatus;
  label: string;
  jackpotUsd: string;
  createdAt: string;
};

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = () =>
    Array.from({ length: 4 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join('');
  return `XPOT-${block()}-${block()}`;
}

const now = new Date();
const baseEntries: Entry[] = Array.from({ length: entryCount }).map((_, i) => ({
  id: i + 1,
  code: makeCode(),
  status: 'in-draw',
  label: "Today's main jackpot · $10,000",
  jackpotUsd: '$10,000',
  createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
}));

// mark first as mock winner
if (baseEntries.length > 0) {
  baseEntries[0].status = 'won';
}

/* ───────────────── Page ───────────────── */

export default function DashboardPage() {
  const [entries, setEntries] = useState<Entry[]>(baseEntries);
  const [winnerClaimed, setWinnerClaimed] = useState(false);

  const activeEntries = entries.filter(e => e.status === 'in-draw' || e.status === 'won');
  const totalEntries = entries.length;

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // ignore for now
    }
  };

  const winnerEntry = entries.find(e => e.status === 'won' || e.status === 'claimed');

  return (
    <main className="min-h-screen bg-black text-slate-50">
      <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-4 lg:px-6">
        {/* ── Left rail (X-style nav) ─────────────────────── */}
        <aside className="hidden w-56 flex-col justify-between border-r border-slate-900/80 pr-4 pt-2 lg:flex">
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-xl">
                💎
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-tight text-slate-50">
                  XPOT
                </span>
                <span className="text-xs text-slate-500">Daily crypto jackpot</span>
              </div>
            </div>

            <nav className="space-y-1 text-sm">
              <button className="flex w-full items-center gap-3 rounded-full bg-slate-900 px-3 py-2 font-medium text-slate-50">
                <span className="text-lg">🏠</span>
                <span>Dashboard</span>
              </button>
              <button className="flex w-full items-center gap-3 rounded-full px-3 py-2 text-slate-400 hover:bg-slate-900 hover:text-slate-50">
                <span className="text-lg">📜</span>
                <span>Draw history</span>
              </button>
              <button className="flex w-full items-center gap-3 rounded-full px-3 py-2 text-slate-400 hover:bg-slate-900 hover:text-slate-50">
                <span className="text-lg">⚙️</span>
                <span>Settings</span>
              </button>
            </nav>
          </div>

          <button
            type="button"
            className="mb-4 mt-6 w-full rounded-full bg-emerald-500 py-3 text-sm font-semibold text-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
          >
            Create XPOT entry
          </button>
        </aside>

        {/* ── Center column (timeline-style content) ─────── */}
        <section className="flex min-w-0 flex-1 flex-col border-x border-slate-900/80">
          {/* header bar (like profile title) */}
          <header className="border-b border-slate-900/80 px-4 pb-3 pt-2">
            <h1 className="text-base font-semibold tracking-tight text-slate-50">
              Dashboard
            </h1>
            <p className="text-xs text-slate-500">
              Your XPOT entries, jackpots and wins.
            </p>
          </header>

          <div className="flex-1 space-y-6 px-4 pb-10 pt-4">
            {/* Overview card */}
            <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-400">
                Overview
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Once X login is live, we’ll sync your XPOT balance and entry codes here.
                This is how your daily luck hub will feel.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Entries this round
                  </p>
                  <p className="mt-1 text-xl font-semibold">{activeEntries.length}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Based on your XPOT balance.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Total entries (preview)
                  </p>
                  <p className="mt-1 text-xl font-semibold">{totalEntries}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Full history coming with X login.
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-slate-950 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-100">
                    Next daily jackpot
                  </p>
                  <p className="mt-1 text-xl font-semibold text-emerald-50">
                    $10,000
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-100/80">
                    Draws daily on-chain. One wallet hits the pot.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="mt-4 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400"
                onClick={() =>
                  alert(
                    'XPOT activated. One tweet per account. From now on your XPOT balance decides your entries.'
                  )
                }
              >
                Activate XPOT access
              </button>
              <p className="mt-2 text-[11px] text-slate-500">
                You only activate once. From then on, your XPOT balance decides how many
                entries you get in every draw.
              </p>
            </section>

            {/* Today’s result / claim card */}
            <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
              <h2 className="text-sm font-semibold text-slate-100">Today’s result</h2>

              {winnerEntry ? (
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-300">
                      One of your codes{' '}
                      <span className="font-mono text-emerald-300">
                        {winnerEntry.code}
                      </span>{' '}
                      hit today’s jackpot.
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Return to your dashboard after the draw to claim. If you don’t
                      claim in time, the unclaimed amount rolls over on top of the next
                      jackpot.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setWinnerClaimed(true);
                      setEntries(prev =>
                        prev.map(e =>
                          e.id === winnerEntry.id ? { ...e, status: 'claimed' } : e
                        )
                      );
                    }}
                    disabled={winnerClaimed}
                    className={`mt-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      winnerClaimed
                        ? 'cursor-not-allowed border border-slate-700 bg-slate-900 text-slate-500'
                        : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
                    }`}
                  >
                    {winnerClaimed ? 'Prize claimed' : "Claim today’s jackpot"}
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-300">
                  Your codes are in the draw. The result will appear here when the
                  timer hits zero.
                </p>
              )}

              {winnerClaimed && (
                <p className="mt-2 text-[11px] text-emerald-300">
                  Nice catch. Any unclaimed portion would roll over on top of tomorrow’s
                  jackpot.
                </p>
              )}
            </section>

            {/* Entry list (timeline style) */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Your entry codes
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Each code is one ticket into a specific draw. Entries are generated from
                your XPOT balance after activation.
              </p>

              <div className="mt-4 space-y-3">
                {entries.map(entry => (
                  <article
                    key={entry.id}
                    className="flex flex-col gap-3 border-b border-slate-900 pb-3 last:border-b-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-slate-100">
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
                          <span className="rounded-full bg-slate-700/70 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                            Expired
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(entry.code)}
                          className="rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-300 hover:border-slate-500 hover:bg-slate-900"
                        >
                          Copy code
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-slate-800 px-3 py-1 text-[11px] text-slate-400 hover:border-slate-700 hover:bg-slate-950"
                        >
                          View entry tweet ↗
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      <p>{entry.label}</p>
                      <p className="mt-0.5">Created: {entry.createdAt}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </section>

        {/* ── Right column (X-style side cards) ──────────── */}
        <aside className="hidden w-72 flex-col gap-4 pt-2 lg:flex">
          {/* Balance card */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 text-sm">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              XPOT balance (preview)
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              In v1 this updates in real time from your Solana wallet.
            </p>
            <p className="mt-4 text-2xl font-semibold text-slate-50">
              {mockBalance.toLocaleString()} <span className="text-sm">XPOT</span>
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              ≈ {entryCount} entries in today’s main draw.
            </p>
          </section>

          {/* X login */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 text-sm">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Sign in with X (coming soon)
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Connect your X account once. We’ll verify your tweet and lock your XPOT
              holder status.
            </p>
            <button
              type="button"
              className="mt-4 w-full rounded-full bg-sky-500 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
            >
              Sign in with X
            </button>
            <p className="mt-2 text-[11px] text-slate-500">
              We never post for you. X is only used to verify entries.
            </p>
          </section>

          {/* Wallet connect */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 text-sm">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Connect wallet (preview)
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              In v1, you’ll connect a Solana wallet so XPOT balance can update entries
              in real time.
            </p>
            <button
              type="button"
              disabled
              className="mt-4 w-full cursor-not-allowed rounded-full bg-slate-900 py-2 text-sm font-medium text-slate-500"
            >
              Connect wallet (coming soon)
            </button>
          </section>
        </aside>
      </div>
    </main>
  );
}
