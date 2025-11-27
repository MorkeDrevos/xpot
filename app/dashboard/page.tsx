'use client';

import Link from 'next/link';
import { useState } from 'react';

// ───────────────────────────
// Helpers / mock data
// ───────────────────────────

type EntryStatus = 'in-draw' | 'won' | 'claimed' | 'expired';

type Entry = {
  id: number;
  code: string;
  status: EntryStatus;
  label: string;
  jackpotUsd: string;
  createdAt: string;
};

const MIN_PER_ENTRY = 1_000_000;
// mock: 3.4M XPOT → 3 entries
const mockBalance = 3_400_000;
const entryCount = Math.floor(mockBalance / MIN_PER_ENTRY);

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randBlock = () =>
    Array.from({ length: 4 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join('');
  return `XPOT-${randBlock()}-${randBlock()}`;
}

function buildMockEntries(): Entry[] {
  const now = new Date();
  const list: Entry[] = Array.from({ length: entryCount }).map((_, i) => ({
    id: i + 1,
    code: makeCode(),
    status: 'in-draw',
    label: "Today's main jackpot • $10,000",
    jackpotUsd: '$10,000',
    createdAt: now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));

  if (list.length > 0) {
    list[0].status = 'won'; // mock: one winner
  }

  return list;
}

// ───────────────────────────
// Page component
// ───────────────────────────

export default function DashboardPage() {
  const [entries, setEntries] = useState<Entry[]>(() => buildMockEntries());
  const [winnerClaimed, setWinnerClaimed] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const activeEntries = entries.filter(
    (e) => e.status === 'in-draw' || e.status === 'won'
  );
  const totalEntries = entries.length;

  const winner = entries.find((e) => e.status === 'won');

  async function handleCopy(entry: Entry) {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(entry.code);
        setCopiedId(entry.id);
        setTimeout(() => setCopiedId(null), 1500);
      }
    } catch {
      // ignore for now
    }
  }

  function handleClaim() {
    if (!winner || winnerClaimed) return;
    setWinnerClaimed(true);
    setEntries((prev) =>
      prev.map((e) =>
        e.id === winner.id ? { ...e, status: 'claimed' } : e
      )
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top bar (like X header) */}
      <header className="border-b border-slate-900/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-lg">
              💎
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-slate-100">
                XPOT
              </span>
              <span className="text-xs text-slate-400">
                One tweet. Daily on-chain jackpots.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/"
              className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-300 hover:border-slate-500 hover:text-slate-50"
            >
              Back to main page
            </Link>
          </div>
        </div>
      </header>

      {/* 3-column layout like X: nav · feed · right rail */}
      <div className="mx-auto flex max-w-6xl gap-4 px-2 py-6 md:px-4">
        {/* Left nav */}
        <aside className="hidden w-56 shrink-0 flex-col gap-4 md:flex">
          <nav className="space-y-2 text-sm">
            <button className="flex w-full items-center gap-3 rounded-full bg-slate-900 px-3 py-2 text-slate-50">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10">
                💎
              </span>
              <span className="font-medium">Dashboard</span>
            </button>

            <button className="flex w-full items-center gap-3 rounded-full px-3 py-2 text-slate-400 hover:bg-slate-900 hover:text-slate-100">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-800/80 text-xs">
                #
              </span>
              <span>Draws history</span>
            </button>

            <button className="flex w-full items-center gap-3 rounded-full px-3 py-2 text-slate-400 hover:bg-slate-900 hover:text-slate-100">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-800/80 text-xs">
                ⚙️
              </span>
              <span>Settings</span>
            </button>
          </nav>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-400">
            <p className="font-semibold text-slate-100">XPOT rule</p>
            <p className="mt-1">
              One tweet per account, forever. Your XPOT balance decides how many
              codes you get in every draw.
            </p>
          </div>
        </aside>

        {/* Center column – feed */}
        <section className="flex min-w-0 flex-1 flex-col gap-4 border-x border-slate-900/80 px-0 md:px-4">
          {/* Pinned / summary card */}
          <div className="border-b border-slate-900/80 pb-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
              Your XPOT dashboard
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-50">
              Track your entries, jackpots and wins.
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              This is how your daily luck hub will feel once X login and wallet
              connect are live.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-xs text-slate-400">Entries this round</p>
                <p className="mt-2 text-2xl font-semibold text-slate-50">
                  {activeEntries.length}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  One code per XPOT block.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-xs text-slate-400">
                  Total entries (preview)
                </p>
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
                  'XPOT activated (preview). One tweet per account. Your balance now determines entries.'
                )
              }
              className="mt-4 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition"
            >
              Activate XPOT access
            </button>
            <p className="mt-2 text-xs text-slate-400">
              You only activate once. From then on, your XPOT balance determines
              how many codes you get in each draw.
            </p>
          </div>

          {/* "Today’s result" – looks like a pinned post */}
          <div className="rounded-2xl border border-emerald-500/40 bg-slate-900/80 p-4 shadow-[0_0_40px_rgba(16,185,129,0.16)]">
            <h2 className="text-sm font-semibold text-emerald-100">
              Today’s result
            </h2>

            {winner ? (
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-200">
                    One of your codes{' '}
                    <span className="font-mono text-emerald-300">
                      {winner.code}
                    </span>{' '}
                    hit today’s jackpot.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Come back after the draw to claim. If you don’t claim in
                    time, the unclaimed amount rolls over on top of the next
                    jackpot.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={winnerClaimed}
                  className={`mt-2 rounded-full px-5 py-2 text-sm font-semibold transition sm:mt-0 ${
                    winnerClaimed
                      ? 'cursor-not-allowed bg-slate-800 text-slate-500 border border-slate-700'
                      : 'bg-emerald-400 text-slate-900 hover:bg-emerald-300'
                  }`}
                >
                  {winnerClaimed ? 'Prize claimed' : 'Claim today’s jackpot'}
                </button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-300">
                Your codes are in the draw. The result will show here when the
                timer hits zero.
              </p>
            )}

            {winnerClaimed && (
              <p className="mt-3 text-xs text-emerald-300">
                Nice catch. Any unclaimed portion would roll over on top of
                tomorrow’s jackpot.
              </p>
            )}
          </div>

          {/* Feed-style list of entry codes */}
          <section className="mt-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              Your entry codes
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Each code is one chance to win in a specific draw. Generated
              automatically from your XPOT balance once X + wallet are live.
            </p>

            <div className="mt-4 space-y-3">
              {entries.map((entry) => (
                <article
                  key={entry.id}
                  className="flex gap-3 border-b border-slate-900/80 pb-3 pt-3 last:border-b-0"
                >
                  {/* avatar like X */}
                  <div className="mt-1">
                    <div className="h-9 w-9 rounded-full bg-emerald-500/10 text-sm flex items-center justify-center">
                      💎
                    </div>
                  </div>

                  {/* content */}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-100">
                        XPOT entry
                      </span>
                      <span className="text-slate-500">· {entry.createdAt}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm text-slate-100">
                        {entry.code}
                      </span>

                      {entry.status === 'in-draw' && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                          In draw
                        </span>
                      )}
                      {entry.status === 'won' && !winnerClaimed && (
                        <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                          Winner – claim on this page
                        </span>
                      )}
                      {entry.status === 'claimed' && (
                        <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-300">
                          Claimed
                        </span>
                      )}
                      {entry.status === 'expired' && (
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                          Expired
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400">{entry.label}</p>
                    <p className="text-[11px] text-slate-500">
                      Jackpot: {entry.jackpotUsd}
                    </p>

                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(entry)}
                        className="rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-300 hover:border-slate-500 hover:bg-slate-900"
                      >
                        {copiedId === entry.id ? 'Copied' : 'Copy code'}
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-slate-800 px-3 py-1 text-[11px] text-slate-400 hover:border-slate-700 hover:bg-slate-950"
                      >
                        View draw details ↗
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>

        {/* Right rail – jackpots + X/wallet preview */}
        <aside className="hidden w-72 shrink-0 flex-col gap-4 lg:flex">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs font-semibold text-slate-200">
              Next jackpot
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">
              $10,000
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Daily XPOT draw. One wallet hits the pot. Winner appears in your
              dashboard.
            </p>
            <div className="mt-3 rounded-xl bg-slate-950/60 px-3 py-2 text-[11px] text-slate-400">
              v1: on-chain randomness + public winner logs.
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              Coming soon
            </p>
            <h3 className="mt-2 text-sm font-semibold text-slate-100">
              Sign in with X
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              You’ll sign once with your main X account to verify your XPOT
              tweet and link your wallet.
            </p>
            <button
              type="button"
              className="mt-3 w-full rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-sky-500/30 hover:bg-sky-400"
            >
              Sign in with X (preview)
            </button>
            <p className="mt-2 text-[11px] text-slate-500">
              We never post for you. X is used only to verify entries.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h3 className="text-sm font-semibold text-slate-200">
              Connect wallet (preview)
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              In v1, you’ll connect a Solana wallet so your XPOT balance can
              update entries in real time.
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
    </main>
  );
}
