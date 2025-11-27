'use client';

import Link from 'next/link';
import { useState } from 'react';

type EntryStatus = 'active' | 'won' | 'lost' | 'expired';

type Entry = {
  id: string;
  code: string;
  drawLabel: string;
  jackpotUsd: number;
  status: EntryStatus;
  createdAt: string;
  tweetUrl?: string;
};

const mockEntries: Entry[] = [
  {
    id: '1',
    code: 'XPOT-2F9K-7Q3B',
    drawLabel: "Today's main jackpot",
    jackpotUsd: 10000,
    status: 'active',
    createdAt: 'Today · 09:34',
    tweetUrl: 'https://x.com/your-handle/status/...',
  },
  {
    id: '2',
    code: 'XPOT-9M1C-4Z8L',
    drawLabel: 'Side draw · Night Owl',
    jackpotUsd: 1500,
    status: 'expired',
    createdAt: 'Yesterday · 21:10',
    tweetUrl: 'https://x.com/your-handle/status/...',
  },
  {
    id: '3',
    code: 'XPOT-7V4P-1D2A',
    drawLabel: 'Daily jackpot',
    jackpotUsd: 7500,
    status: 'lost',
    createdAt: '2 days ago · 18:02',
    tweetUrl: 'https://x.com/your-handle/status/...',
  },
];

function statusLabel(status: EntryStatus) {
  switch (status) {
    case 'active':
      return 'In draw';
    case 'won':
      return 'Winner';
    case 'lost':
      return 'Not picked';
    case 'expired':
      return 'Expired';
  }
}

function statusClasses(status: EntryStatus) {
  switch (status) {
    case 'active':
      return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40';
    case 'won':
      return 'bg-amber-500/10 text-amber-300 border-amber-500/40';
    case 'lost':
      return 'bg-slate-500/10 text-slate-300 border-slate-500/40';
    case 'expired':
      return 'bg-rose-500/10 text-rose-300 border-rose-500/40';
  }
}

export default function DashboardPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (entry: Entry) => {
    try {
      await navigator.clipboard.writeText(entry.code);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore for now
    }
  };

  const activeEntries = mockEntries.filter(e => e.status === 'active');
  const totalEntries = mockEntries.length;

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
                  One code per entry.
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
          </aside>
        </section>

        {/* Entries list */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-slate-100">
                Your entry codes
              </h2>
              <p className="text-xs text-slate-500">
                Each code represents one chance to win in a specific draw.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {mockEntries.map(entry => (
              <div
                key={entry.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 sm:px-5 sm:py-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-mono tracking-[0.16em] text-slate-100">
                        {entry.code}
                      </span>
                      <span
                        className={
                          'rounded-full border px-2.5 py-1 text-[11px] font-medium ' +
                          statusClasses(entry.status)
                        }
                      >
                        {statusLabel(entry.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {entry.drawLabel} ·{' '}
                      <span className="text-emerald-300">
                        ${entry.jackpotUsd.toLocaleString()}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Created: {entry.createdAt}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <button
                      type="button"
                      onClick={() => handleCopy(entry)}
                      className="inline-flex items-center justify-center rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-emerald-500 hover:text-emerald-300"
                    >
                      {copiedId === entry.id ? 'Code copied' : 'Copy code'}
                    </button>
                    {entry.tweetUrl && (
                      <Link
                        href={entry.tweetUrl}
                        target="_blank"
                        className="text-[11px] text-sky-400 hover:text-sky-300"
                      >
                        View entry tweet ↗
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
