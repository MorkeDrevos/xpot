'use client';

import Link from 'next/link';
import { useState } from 'react';

// ── Helpers / types ──────────────────────────────────────────────

const MIN_PER_ENTRY = 1_000_000;
const mockBalance = 3_400_000; // 3.4M XPOT
const entryCount = Math.floor(mockBalance / MIN_PER_ENTRY);

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
  const randBlock = () =>
    Array.from({ length: 4 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join('');
  return `XPOT-${randBlock()}-${randBlock()}`;
}

// Build mock entries based on balance
const now = new Date();
const initialEntries: Entry[] = Array.from({ length: entryCount }).map(
  (_, i) => ({
    id: i + 1,
    code: makeCode(),
    status: 'in-draw',
    label: "Today's main jackpot • $10,000",
    jackpotUsd: '$10,000',
    createdAt: now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
  })
);

// Mark first as winner for preview
if (initialEntries.length > 0) {
  initialEntries[0].status = 'won';
}

// ── Component ────────────────────────────────────────────────────

export default function DashboardPage() {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [winnerClaimed, setWinnerClaimed] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const activeEntries = entries.filter(e => e.status === 'in-draw' || e.status === 'won');
  const totalEntries = entries.length;

  const handleCopy = async (entry: Entry) => {
    try {
      await navigator.clipboard.writeText(entry.code);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore for now
    }
  };

  const winner = entries.find(e => e.status === 'won' || e.status === 'claimed');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-lg">
              💎
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-slate-100">
                XPOT
              </span>
              <span className="text-xs text-slate-400">
                Your entries · One winner · One jackpot
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/"
              className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-300 hover:border-slate-500 hover:text-slate-100"
            >
              Back to main page
            </Link>
            <button
              type="button"
              className="hidden rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur hover:bg-white/10 sm:inline-flex"
            >
              Sign in with X (soon)
            </button>
          </nav>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 space-y-8">
        {/* Hero row */}
        <section className="flex flex-col gap-6 md:flex-row">
          {/* Summary card */}
          <div className="flex-1 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.85)]">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
              Your XPOT dashboard
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">
              Track your entries, jackpots and wins.
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Once X login is live, we’ll sync your tweets and XPOT codes here.
              For now this is a preview of how your daily luck hub will feel.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-xs text-slate-400">Entries this round</p>
                <p className="mt-2 text-2xl font-semibold text-slate-50">
                  {activeEntries.length}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Entries depend on your XPOT balance.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-xs text-slate-400">Total entries (preview)</p>
                <p className="mt-2 text-2xl font-semibold text-slate-50">
                  {totalEntries}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Full history coming with X login.
                </p>
              </div>
              <div className="col-span-2 rounded-2xl border border-emerald-600/40 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-slate-900/80 p-4 sm:col-span-1">
                <p className="text-xs text-emerald-300">Next daily jackpot</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-100">
                  $10,000
                </p>
                <p className="mt-1 text-xs text-emerald-200/80">
                  Draws daily on-chain. One wallet hits the pot.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                alert(
                  'XPOT activated. One tweet per account. Your balance now controls entries.'
                )
              }
              className="mt-6 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-black hover:bg-emerald-400 transition"
            >
              Activate XPOT access
            </button>
            <p className="mt-3 text-xs text-slate-400">
              You only activate once. From then on, your XPOT balance determines
              your number of entries.
            </p>
          </div>

          {/* X login / connect */}
          <aside className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              Coming soon
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-50">
              Sign in with X and lock your entries.
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              In v1, you’ll connect X, verify your tweet and link the wallet
              holding XPOT. Every valid combo becomes an entry code that shows
              up here.
            </p>
            <button
              type="button"
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-sky-500 px-4 py-2.5 text-sm font-medium text-slate-950 shadow-lg shadow-sky-500/30 hover:bg-sky-400"
            >
              Sign in with X (preview)
            </button>
            <p className="mt-3 text-xs text-slate-500">
              We’ll never post for you. Your X is only used to verify entries.
            </p>

            <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold text-slate-200">
                Connect wallet (preview)
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                In v1, you'll connect a Solana wallet so your XPOT balance can
                update entries in real time.
              </p>
              <button
                type="button"
                className="mt-3 w-full rounded-full bg-slate-800 py-2 text-xs font-medium text-slate-500 cursor-not-allowed"
                disabled
              >
                Connect wallet (coming soon)
              </button>
            </section>
          </aside>
        </section>

        {/* Today’s result / claim section */}
        <section className="mt-10 rounded-2xl border border-emerald-500/40 bg-slate-900/70 p-6 shadow-[0_0_60px_rgba(16,185,129,0.18)]">
          <h2 className="text-lg font-semibold text-emerald-100">
            Today’s result
          </h2>

          {winner ? (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-300">
                  One of your codes{' '}
                  <span className="font-mono text-emerald-300">
                    {winner.code}
                  </span>{' '}
                  hit today’s jackpot.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Return to your dashboard after the draw to claim. If you don’t
                  claim in time, the unclaimed amount rolls over on top of the
                  next jackpot.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setWinnerClaimed(true);
                  setEntries(prev =>
                    prev.map(e =>
                      e.id === winner.id ? { ...e, status: 'claimed' } : e
                    )
                  );
                }}
                disabled={winnerClaimed}
                className={`mt-3 rounded-full px-5 py-2 text-sm font-semibold transition sm:mt-0 ${
                  winnerClaimed
                    ? 'cursor-not-allowed bg-slate-800 text-slate-500 border border-slate-700'
                    : 'bg-emerald-400 text-slate-900 hover:bg-emerald-300'
                }`}
              >
                {winnerClaimed ? 'Prize claimed' : 'Claim today’s jackpot'}
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-300">
              Your codes are in the draw. The result will appear here when the
              timer hits zero.
            </p>
          )}

          {winnerClaimed && (
            <p className="mt-3 text-xs text-emerald-300">
              Nice catch. Any unclaimed portion would roll over on top of
              tomorrow’s jackpot.
            </p>
          )}
        </section>

        {/* Entries list */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            Your entry codes
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Each code represents one chance to win in a specific draw. Entries
            are generated based on your XPOT balance.
          </p>

          <div className="mt-6 space-y-4">
            {entries.map(entry => (
              <div
                key={entry.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
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
                      <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                        Expired
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-slate-400">{entry.label}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Created: {entry.createdAt}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(entry)}
                    className="rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-300 hover:border-slate-500 hover:bg-slate-800"
                  >
                    {copiedId === entry.id ? 'Copied' : 'Copy code'}
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-slate-800 px-3 py-1 text-[11px] text-slate-400 hover:border-slate-700 hover:bg-slate-900"
                  >
                    View entry tweet ↗
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div
