'use client';

import Link from 'next/link';
import { useState } from 'react';

/* ───────────────────── CONFIG ───────────────────── */

const MIN_PER_ENTRY = 1_000_000;
const mockBalance = 3_400_000; // 3.4M XPOT
const entryCount = Math.floor(mockBalance / MIN_PER_ENTRY);

/* ───────────────────── TYPES ───────────────────── */

type EntryStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

type Entry = {
  id: number;
  code: string;
  status: EntryStatus;
  label: string;
  jackpotUsd: string;
  createdAt: string;
};

/* ─────────────────── HELPERS ──────────────────── */

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randBlock = () =>
    Array.from({ length: 4 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join('');
  return `XPOT-${randBlock()}-${randBlock()}`;
}

/* ─────────────── MOCK ENTRIES FROM BALANCE ─────────────── */

const now = new Date();

const initialEntries: Entry[] = Array.from({ length: entryCount }).map((_, i) => ({
  id: i + 1,
  code: makeCode(),
  status: 'in-draw',
  label: "Today's main jackpot • $10,000",
  jackpotUsd: '$10,000',
  createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
}));

// make one winner for preview
if (initialEntries.length > 0) initialEntries[0].status = 'won';

/* ───────────────────── PAGE ───────────────────── */

export default function DashboardPage() {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [winnerClaimed, setWinnerClaimed] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const activeEntries = entries.filter(e => e.status === 'in-draw' || e.status === 'won');
  const totalEntries = entries.length;
  const winner = entries.find(e => e.status === 'won' || e.status === 'claimed');

  async function handleCopy(entry: Entry) {
    await navigator.clipboard.writeText(entry.code);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">

      {/* HEADER */}
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-full bg-emerald-500/10 flex items-center justify-center">💎</span>
            <div>
              <p className="text-sm font-semibold">XPOT</p>
              <p className="text-xs text-slate-400">Your entries · One winner</p>
            </div>
          </div>
          <Link
            href="/"
            className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500"
          >
            Back to main
          </Link>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-5xl p-6 space-y-10">

        {/* DASHBOARD BLOCK */}
        <section className="grid gap-6 md:grid-cols-[1.4fr_1fr]">

          {/* SUMMARY */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-xs uppercase tracking-widest text-emerald-400">Your XPOT dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold">Track entries & jackpots</h1>
            <p className="mt-2 text-sm text-slate-400">
              You tweet once. Your balance creates entries forever.
            </p>

            <div className="grid grid-cols-3 gap-3 mt-6">
              <Stat title="Active entries" value={activeEntries.length} />
              <Stat title="Total entries" value={totalEntries} />
              <Stat title="Next jackpot" value="$10,000" />
            </div>

            <button
              className="mt-6 rounded-xl bg-emerald-500/90 px-5 py-3 text-black font-semibold hover:bg-emerald-400"
              onClick={() => alert('XPOT activated. One tweet per account.')}
            >
              Activate XPOT access
            </button>
            <p className="mt-2 text-xs text-slate-400">
              Only once. From now on, your balance controls entries.
            </p>
          </div>

          {/* SIDEBAR */}
          <aside className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-5">
            <div>
              <p className="uppercase text-xs text-slate-400">Coming soon</p>
              <h2 className="text-lg font-semibold mt-1">Sign in with X</h2>
              <p className="text-sm mt-1 text-slate-400">
                One tweet per account · forever.
              </p>
              <button className="w-full mt-4 rounded-full bg-sky-500 py-2 text-black font-semibold">
                Sign in with X (preview)
              </button>
            </div>

            {/* WALLET STUB */}
            <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold">Connect wallet (preview)</h3>
              <p className="mt-1 text-xs text-slate-400">
                Wallet = entries in real time.
              </p>
              <button disabled className="mt-3 w-full rounded-full bg-slate-800 py-2 text-xs text-slate-500">
                Connect wallet (coming soon)
              </button>
            </section>
          </aside>

        </section>

        {/* RESULT / CLAIM */}
        <section className="rounded-2xl border border-emerald-500/40 bg-slate-900/70 p-6">
          <h2 className="text-lg font-semibold">Today’s result</h2>

          {winner && (
            <>
              <p className="mt-3 text-sm">
                Winning code:{' '}
                <span className="font-mono text-emerald-400">{winner.code}</span>
              </p>

              <p className="text-xs mt-1 text-slate-400">
                Not claimed = rolls on top of tomorrow’s jackpot.
              </p>

              <button
                disabled={winnerClaimed}
                className={`mt-4 rounded-full px-5 py-2 font-semibold ${
                  winnerClaimed
                    ? 'bg-slate-800 text-slate-500'
                    : 'bg-emerald-400 text-black hover:bg-emerald-300'
                }`}
                onClick={() => {
                  setEntries(e =>
                    e.map(x =>
                      x.id === winner.id ? { ...x, status: 'claimed' } : x
                    )
                  );
                  setWinnerClaimed(true);
                }}
              >
                {winnerClaimed ? 'Claimed' : 'Claim jackpot'}
              </button>
            </>
          )}
        </section>

        {/* ENTRIES */}
        <section>
          <h2 className="uppercase text-sm tracking-widest text-slate-400">
            Your entry codes
          </h2>

          <div className="mt-5 space-y-3">
            {entries.map(entry => (
              <div
                key={entry.id}
                className="flex justify-between items-center rounded-xl border border-slate-800 bg-slate-900/70 p-4"
              >
                <div>
                  <p className="font-mono">{entry.code}</p>
                  <p className="text-xs text-slate-400">{entry.label}</p>
                </div>

                <button
                  onClick={() => handleCopy(entry)}
                  className="rounded-full border border-slate-700 px-3 py-1 text-xs hover:bg-slate-800"
                >
                  {copiedId === entry.id ? 'Copied' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

/* ───────────────────── SMALL COMPONENT ───────────────────── */

function Stat({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
      <p className="text-xs text-slate-400">{title}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
