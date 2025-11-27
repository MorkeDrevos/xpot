'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

// ── Helpers / types ──────────────────────────────────────────────

const MIN_PER_ENTRY = 1_000_000;
const mockBalance = 3_400_000; // 3.4M XPOT (preview)
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

// Build preview entries based on balance
const initialEntries: Entry[] = Array.from({ length: entryCount }).map((_, i) => ({
  id: i + 1,
  code: makeCode(),
  status: 'in-draw',
  label: "Today's main jackpot • $10,000",
  jackpotUsd: '$10,000',
  createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
}));

// Mark first entry as winner (preview)
if (initialEntries.length > 0) {
  initialEntries[0].status = 'won';
}

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
    user?.name?.replace(/\s+/g, '').toLowerCase() ||
    'your_handle';

  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [winnerClaimed, setWinnerClaimed] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // ── Auto-update on new deploy ────────────────────────────────
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

        // First run: just store it
        if (!currentBuildId) {
          setCurrentBuildId(incoming);
          return;
        }

        // Subsequent runs: if changed, show banner
        if (incoming !== currentBuildId && !cancelled) {
          setHasNewBuild(true);
        }
      } catch {
        // ignore
      }
    }

    checkBuild();
    const interval = setInterval(checkBuild, 30_000); // every 30s

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentBuildId]);

  const activeEntries = entries.filter(
    e => e.status === 'in-draw' || e.status === 'won'
  );
  const totalEntries = entries.length;
  const winner = entries.find(e => e.status === 'won');

  async function handleCopy(entry: Entry) {
    try {
      await navigator.clipboard.writeText(entry.code);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 1500);
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

            {/* Big CTA like “Post” */}
            <button
              type="button"
              className="btn-premium mt-4 w-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_20px_40px_rgba(22,163,74,0.5)] hover:brightness-110 active:scale-[0.97] transition-all"
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
              <div className="x-account-menu absolute bottom-14 left-0 w-72 rounded-3xl border border-slate-800 bg-slate-950 shadow-xl shadow-black/60 overflow-hidden">
                {/* Single account row */}
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

                {/* Logout row only (no add/manage) */}
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
                Your XPOT entries, jackpots and wins.
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
              {/* Profile header – static X-style */}
              <section className="flex items-center justify-between border-b border-slate-900 bg-gradient-to-r from-slate-950 via-slate-900/40 to-slate-950 px-4 pt-3 pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-800">
                    {/* you can swap this for your real avatar later */}
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

              {/* Summary “tweet” style card */}
              <article className="premium-card border-b border-slate-900/60 px-4 pt-4 pb-5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-400">
                  Overview
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Once X login is live, we’ll sync your XPOT balance and entry codes
                  here. This is how your daily luck hub will feel.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-[11px] text-slate-400">Entries this round</p>
                    <p className="mt-1 text-xl font-semibold">
                      {activeEntries.length}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Based on your XPOT balance.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-[11px] text-slate-400">
                      Total entries (preview)
                    </p>
                    <p className="mt-1 text-xl font-semibold">{totalEntries}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Full history with X login.
                    </p>
                  </div>
                  <div className="premium-highlight col-span-2 p-3 sm:col-span-1">
                    <p className="text-[11px] text-emerald-300">Next daily jackpot</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-100">
                      $10,000
                    </p>
                    <p className="mt-1 text-[11px] text-emerald-200/80">
                      Draws daily on-chain. One wallet hits the pot.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    alert(
                      'XPOT access activated (preview). One tweet per account. Balance controls your entries.'
                    )
                  }
                  className="btn-premium mt-4 rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 px-4 py-2 text-sm font-semibold text-black shadow-[0_20px_40px_rgba(22,163,74,0.5)] hover:brightness-110 active:scale-[0.97] transition-all"
                >
                  Activate XPOT access
                </button>
                <p className="mt-2 text-[11px] text-slate-500">
                  You only activate once. From then on, your XPOT balance decides how
                  many entries you get in every draw.
                </p>
              </article>

              {/* Today’s result card */}
              <article className="premium-card border-b border-slate-900/60 px-4 pb-5 pt-3">
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
                        Return to your dashboard after the draw to claim. If you
                        don’t claim in time, the unclaimed amount rolls over on top
                        of the next jackpot.
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
                      className={`btn-premium mt-3 rounded-full px-5 py-2 text-sm font-semibold transition sm:mt-0 ${
  winnerClaimed
    ? 'cursor-not-allowed bg-slate-900 text-slate-500 border border-slate-800'
    : 'bg-emerald-400 text-slate-900 hover:bg-emerald-300'
}`}
                    >
                      {winnerClaimed ? 'Prize claimed' : 'Claim today’s jackpot'}
                    </button>
                  </div>
                ) : (
                  <p className="btn-premium mt-3 text-sm text-slate-300">
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
              </article>

              {/* Entries “feed” */}
              <section className="pb-10 px-4">
                <h2 className="pt-3 text-sm font-semibold text-slate-200">
                  Your entry codes
                </h2>
                <p className="text-xs text-slate-500">
                  Each code is one ticket into a specific draw. Generated from your
                  XPOT balance after activation.
                </p>

                <div className="mt-3 border-l border-slate-800/80 pl-3 space-y-2">
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
                            {entry.status === 'won' && !winnerClaimed && (
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
                = {entryCount} entries in today’s main draw.
              </p>
            </div>

            {/* Sign in with X */}
            <div className="premium-card p-4">
              <h3 className="text-sm font-semibold">
                {isAuthed ? 'Signed in with X' : 'Sign in with X'}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Connect your X account once. We’ll verify your tweet and lock your
                XPOT holder status.
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

              <p className="mt-2 text-[11px] text-slate-500">
                We never post for you. X is only used to verify entries.
              </p>
            </div>

            {/* Wallet connect preview */}
            <div className="premium-card p-4">
              <h3 className="text-sm font-semibold">Connect wallet (preview)</h3>
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
      </div>
    </main>
  );
}
