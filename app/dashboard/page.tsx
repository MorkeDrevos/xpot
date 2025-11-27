'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

/* -------------------- Helpers / Types -------------------- */

const MIN_PER_ENTRY = 1_000_000;
const mockBalance = 3_400_000;
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

function makeCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = () =>
    Array.from({ length: 4 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join('');
  return `XPOT-${block()}-${block()}`;
}

const now = new Date();

const initialEntries: Entry[] = Array.from({ length: entryCount }).map((_, i) => ({
  id: i + 1,
  code: makeCode(),
  status: 'in-draw',
  label: "Today's main jackpot • $10,000",
  jackpotUsd: '$10,000',
  createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
}));

if (initialEntries.length > 0) {
  initialEntries[0].status = 'won';
}

/* -------------------- Page -------------------- */

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const user = session?.user as any | undefined;
  const isAuthed = !!session;

  const [entries] = useState<Entry[]>(initialEntries);
  const [winnerClaimed, setWinnerClaimed] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  /* -------- Auto refresh on redeploy -------- */
  const [currentBuildId, setCurrentBuildId] = useState<string | null>(null);
  const [hasNewBuild, setHasNewBuild] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkBuild() {
      try {
        const res = await fetch('/api/build-info', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const incoming = data.buildId || 'unknown';

        if (!currentBuildId) {
          setCurrentBuildId(incoming);
          return;
        }

        if (incoming !== currentBuildId && !cancelled) {
          setHasNewBuild(true);
        }
      } catch {}
    }

    checkBuild();
    const interval = setInterval(checkBuild, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentBuildId]);

  const activeEntries = entries.filter(e => e.status === 'in-draw' || e.status === 'won');
  const winner = entries.find(e => e.status === 'won');

  async function handleCopy(entry: Entry) {
    await navigator.clipboard.writeText(entry.code);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function openXLoginPopup() {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      '/auth/x-login',
      'xpot-x-login',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes`
    );

    if (!popup) return;
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        window.location.reload();
      }
    }, 800);
  }

  /* -------------------- UI -------------------- */

  return (
    <main className="min-h-screen bg-black text-slate-100 text-[15px]">
      <div className="mx-auto flex max-w-6xl">

        {/* LEFT NAV */}
        <aside className="hidden min-h-screen w-56 border-r border-slate-900 px-3 py-4 md:flex flex-col justify-between">

          <div className="space-y-6">

            {/* Logo */}
            <div className="flex items-center gap-2 px-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-lg">
                💎
              </div>
              <div>
                <div className="text-base font-semibold">XPOT</div>
                <div className="text-xs text-slate-500">Daily crypto jackpot</div>
              </div>
            </div>

            {/* Nav */}
            <nav className="space-y-1 text-base">
              <Link href="/dashboard" className="nav-item-active">Dashboard</Link>
              <button className="nav-item">Draw history</button>
              <button className="nav-item">Settings</button>
            </nav>

            <button className="mt-4 w-full rounded-full bg-emerald-500 py-3 font-semibold text-black shadow-lg hover:bg-emerald-400">
              Create XPOT entry
            </button>
          </div>

          {/* MINI USER CHIP */}
          <div className="relative">

            <div
              onClick={() => !isAuthed ? openXLoginPopup() : setAccountMenuOpen(v => !v)}
              className="mb-2 flex items-center justify-between rounded-2xl bg-slate-900/70 px-3 py-2 hover:bg-slate-800/80 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {user?.image ? (
                  <img src={user.image} className="h-8 w-8 rounded-full" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-slate-700 grid place-items-center text-xs">@</div>
                )}

                <div>
                  <p className="flex items-center gap-1 font-semibold">
                    {user?.name ?? 'Your X handle'}
                    {isAuthed && <span className="x-verified-badge">✓</span>}
                  </p>
                  <p className="text-xs text-slate-500">
                    @{user?.username ?? 'your_handle'}
                  </p>
                </div>
              </div>

              <span className="w-6 h-6 grid place-items-center text-slate-400">⋯</span>
            </div>

            {/* DROPDOWN */}
            {isAuthed && accountMenuOpen && (
              <div className="absolute bottom-12 left-0 w-64 rounded-3xl border border-slate-800 bg-slate-950 shadow-xl">

                <div className="flex items-center justify-between px-3 py-3 border-b border-slate-800">

                  <div className="flex items-center gap-2">
                    <img src={user?.image} className="h-9 w-9 rounded-full" />
                    <div>
                      <p className="flex items-center gap-1 font-semibold">
                        {user?.name}
                        <span className="x-verified-badge">✓</span>
                      </p>
                      <p className="text-xs text-slate-500">@{user?.username}</p>
                    </div>
                  </div>

                  <span className="h-5 w-5 rounded-full bg-emerald-500/10 grid place-items-center text-emerald-400 text-xs">
                    ✓
                  </span>
                </div>

                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full text-left px-3 py-3 hover:bg-slate-900"
                >
                  Log out @{user?.username}
                </button>

              </div>
            )}

          </div>
        </aside>

        {/* CENTER COLUMN */}
        <section className="min-h-screen flex-1 border-r border-slate-900">

          <header className="sticky top-0 z-10 border-b border-slate-900 bg-black/90 px-4 py-4">
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <p className="text-sm text-slate-500">Your XPOT entries and wins</p>
          </header>

          {hasNewBuild && (
            <div className="bg-emerald-500/10 border-b border-emerald-500 px-4 py-2 text-sm flex justify-between">
              <span>New version available</span>
              <button onClick={() => location.reload()} className="bg-emerald-500 px-3 py-1 rounded-full text-black">
                Refresh
              </button>
            </div>
          )}

          <div className="p-4 space-y-4">

            <div className="grid grid-cols-3 gap-3">

              <div className="stat">
                <span className="stat-label">Entries this round</span>
                <span className="stat-value">{activeEntries.length}</span>
              </div>

              <div className="stat">
                <span className="stat-label">Total entries</span>
                <span className="stat-value">{entries.length}</span>
              </div>

              <div className="stat special">
                <span className="stat-label">Next jackpot</span>
                <span className="stat-value">$10,000</span>
              </div>

            </div>

            {winner && (
              <div className="p-4 bg-emerald-500/10 rounded-xl">
                <p>
                  One of your codes{' '}
                  <span className="font-mono text-emerald-400">{winner.code}</span>{' '}
                  won.
                </p>
                <button
                  disabled={winnerClaimed}
                  onClick={() => setWinnerClaimed(true)}
                  className="mt-2 rounded-full bg-emerald-400 px-4 py-2 text-black"
                >
                  {winnerClaimed ? 'Claimed' : 'Claim reward'}
                </button>
              </div>
            )}

            <section>
              <h2 className="text-lg font-semibold">Your entry codes</h2>
              <div className="mt-3 space-y-3">
                {entries.map(entry => (
                  <div key={entry.id} className="entry">
                    <span className="font-mono">{entry.code}</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleCopy(entry)}>
                        {copiedId === entry.id ? 'Copied' : 'Copy'}
                      </button>
                      <button>Tweet</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </section>
      </div>
    </main>
  );
}
