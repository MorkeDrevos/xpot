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

/* -------------------- X-style Verified Badge -------------------- */

function VerifiedBadge() {
  return (
    <span className="x-verified-badge" aria-label="Verified account">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="x-verified-svg"
      >
        <circle cx="12" cy="12" r="12" fill="#1D9BF0" />
        <path
          d="M8.5 12.5 11 15 15.5 9.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/* -------------------- Page -------------------- */

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const user = session?.user as any | undefined;
  const isAuthed = !!session;

  // TEMP: show tick whenever signed in.
  // Later we’ll wire user.verified from NextAuth token.
  const isVerified = isAuthed && true;

  const [entries, setEntries] = useState<Entry[]>(initialEntries);
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

  const activeEntries = entries.filter(e => e.status === 'in-draw' || e.status === 'won');
  const winner = entries.find(e => e.status === 'won');

  async function handleCopy(entry: Entry) {
    await navigator.clipboard.writeText(entry.code);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function openXLoginPopup() {
    if (typeof window === 'undefined') return;

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
              <Link href="/dashboard" className="nav-item-active">
                Dashboard
              </Link>
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
              onClick={() => (!isAuthed ? openXLoginPopup() : setAccountMenuOpen(v => !v))}
              className="mb-2 flex items-center justify-between rounded-2xl bg-slate-900/70 px-3 py-2 cursor-pointer hover:bg-slate-800/80 transition-transform duration-100 active:scale-[0.97]"
            >
              <div className="flex items-center gap-2">
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name ?? 'X avatar'}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-slate-700 grid place-items-center text-xs">
                    @
                  </div>
                )}

                <div className="leading-tight">
                  <p className="flex items-center gap-1 text-sm font-semibold">
                    {user?.name ?? 'Your X handle'}
                    {isVerified && <VerifiedBadge />}
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
              <div className="x-account-dropdown absolute bottom-12 left-0 w-64 rounded-3xl border border-slate-800 bg-slate-950 shadow-xl">

                {/* Active account row */}
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-3 py-3">
                  <div className="flex items-center gap-2">
                    {user?.image ? (
                      <img
                        src={user.image}
                        alt={user.name ?? 'X avatar'}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-slate-700 grid place-items-center text-xs">
                        @
                      </div>
                    )}
                    <div className="leading-tight">
                      <p className="flex items-center gap-1 text-xs font-semibold text-slate-50">
                        {user?.name ?? 'Your X handle'}
                        {isVerified && <VerifiedBadge />}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        @{user?.username ?? 'your_handle'}
                      </p>
                    </div>
                  </div>

                  {/* Little green check like “active account” */}
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-[11px] text-emerald-400">
                    ✓
                  </span>
                </div>

                {/* Log out row */}
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  className="w-full px-3 py-3 text-left text-[13px] text-slate-200 hover:bg-slate-900"
                >
                  Log out @{user?.username ?? 'your_handle'}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* CENTER COLUMN */}
        <section className="min-h-screen flex-1 border-r border-slate-900">

          <header className="sticky top-0 z-10 border-b border-slate-900 bg-black/90 px-4 py-4 backdrop-blur">
            <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-500">
              Your XPOT entries, jackpots and wins.
            </p>
          </header>

          {/* New version banner */}
          {hasNewBuild && (
            <div className="border-b border-emerald-700/60 bg-emerald-500/10 px-4 py-2">
              <div className="flex items-center justify-between gap-3 text-sm text-emerald-100">
                <span>New XPOT version is live.</span>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-full bg-emerald-500 px-3 py-1 text-[12px] font-semibold text-black hover:bg-emerald-400"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="space-y-4 border-x border-slate-900 px-4 pb-10">

            {/* Overview cards */}
            <section className="pt-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-400">
                Overview
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Once X login is live, we’ll sync your XPOT balance and entry codes
                here. This is how your daily luck hub will feel.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="stat">
                  <p className="stat-label">Entries this round</p>
                  <p className="stat-value">{activeEntries.length}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Based on your XPOT balance.
                  </p>
                </div>
                <div className="stat">
                  <p className="stat-label">Total entries (preview)</p>
                  <p className="stat-value">{entries.length}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Full history with X login.
                  </p>
                </div>
                <div className="stat special">
                  <p className="stat-label">Next daily jackpot</p>
                  <p className="stat-value text-emerald-100">$10,000</p>
                  <p className="mt-1 text-[11px] text-emerald-200/80">
                    Draws daily on-chain. One wallet hits the pot.
                  </p>
                </div>
              </div>
            </section>

            {/* Today’s result */}
            <section className="border-t border-slate-900 pt-4">
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
                        ? 'cursor-not-allowed bg-slate-900 text-slate-500 border border-slate-800'
                        : 'bg-emerald-400 text-slate-900 hover:bg-emerald-300'
                    }`}
                  >
                    {winnerClaimed ? 'Prize claimed' : 'Claim today’s jackpot'}
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-300">
                  Your codes are in the draw. The result will appear here when the
                  timer hits zero.
                </p>
              )}
            </section>

            {/* Entries feed */}
            <section className="pt-4">
              <h2 className="text-sm font-semibold text-slate-200">
                Your entry codes
              </h2>
              <p className="text-xs text-slate-500">
                Each code is one ticket into a specific draw. Generated from your XPOT
                balance after activation.
              </p>

              <div className="mt-3 space-y-3">
                {entries.map(entry => (
                  <article
                    key={entry.id}
                    className="entry"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-slate-50">
                          {entry.code}
                        </span>
                        {entry.status === 'in-draw' && (
                          <span className="pill pill-emerald">In draw</span>
                        )}
                        {entry.status === 'won' && !winnerClaimed && (
                          <span className="pill pill-amber">Winner</span>
                        )}
                        {entry.status === 'claimed' && (
                          <span className="pill pill-sky">Claimed</span>
                        )}
                        {entry.status === 'expired' && (
                          <span className="pill pill-muted">Expired</span>
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
                        className="btn-ghost"
                      >
                        {copiedId === entry.id ? 'Copied' : 'Copy code'}
                      </button>
                      <button
                        type="button"
                        className="btn-ghost-muted"
                      >
                        View entry tweet ↗
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
