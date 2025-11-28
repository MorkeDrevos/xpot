'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

// ─────────────────────────────────────────────────────────────
// Types & helpers
// ─────────────────────────────────────────────────────────────

type EntryStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

type Entry = {
  id: number;
  code: string;
  status: EntryStatus;
  label: string;
  jackpotUsd: string;
  createdAt: string;
};

type Phase = 'preSnapshot' | 'betweenSnapshotAndDraw' | 'drawing' | 'postDraw';

const MIN_PER_ENTRY = 1_000_000;
const mockBalanceNow = 7_492_000; // live balance preview
const entryCount = Math.floor(mockBalanceNow / MIN_PER_ENTRY);
const JACKPOT_USD = 10_000;

// generate ticket-style codes
function makeCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = () =>
    Array.from({ length: 4 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join('');
  return `XPOT-${block()}-${block()}`;
}

// initial tickets – “today’s draw”
const nowSeed = new Date();
const initialEntries: Entry[] = Array.from({ length: entryCount }).map((_, i) => ({
  id: i + 1,
  code: makeCode(),
  status: 'in-draw',
  label: "Today's main jackpot • $10,000",
  jackpotUsd: '$10,000',
  createdAt: nowSeed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
}));

// mark one as winner for preview
if (initialEntries.length > 0) {
  initialEntries[0].status = 'won';
}

// format countdown nicely
function formatDuration(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

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
    (user?.name ? user.name.replace(/\s+/g, '').toLowerCase() : '') ||
    'your_handle';

  // entries state
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [winnerClaimed, setWinnerClaimed] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // build auto-reload banner
  const [currentBuildId, setCurrentBuildId] = useState<string | null>(null);
  const [hasNewBuild, setHasNewBuild] = useState(false);

  // live time
  const [now, setNow] = useState<Date>(new Date());

  // schedule for today (preview: snapshot in 2h, draw 1h later, results 10m later)
  const [schedule] = useState(() => {
    const base = new Date();
    const snapshotAt = new Date(base.getTime() + 2 * 60 * 60 * 1000);
    const drawAt = new Date(snapshotAt.getTime() + 60 * 60 * 1000);
    const resultsAt = new Date(drawAt.getTime() + 10 * 60 * 1000);
    return { snapshotAt, drawAt, resultsAt };
  });

  // live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // build-info polling (for “New XPOT version is live” banner)
  useEffect(() => {
    let cancelled = false;

    async function checkBuild() {
      try {
        const res = await fetch('/api/build-info', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { buildId?: string };
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

  // phase logic
  const phase: Phase = useMemo(() => {
    const { snapshotAt, drawAt, resultsAt } = schedule;
    if (now < snapshotAt) return 'preSnapshot';
    if (now < drawAt) return 'betweenSnapshotAndDraw';
    if (now < resultsAt) return 'drawing';
    return 'postDraw';
  }, [now, schedule]);

  // countdown target & label
  const { countdownLabel, countdownValue } = useMemo(() => {
    const { snapshotAt, drawAt, resultsAt } = schedule;
    let label = '';
    let target: Date | null = null;

    switch (phase) {
      case 'preSnapshot':
        label = 'Entry window closes in';
        target = snapshotAt;
        break;
      case 'betweenSnapshotAndDraw':
        label = 'Winner revealed in';
        target = drawAt;
        break;
      case 'drawing':
        label = 'Finalising results…';
        target = resultsAt;
        break;
      case 'postDraw':
      default: {
        label = 'Next draw in';
      const nextSnapshot = new Date(snapshotAt.getTime() + 24 * 60 * 60 * 1000);
        target = nextSnapshot;
        break;
      }
    }

    const ms = target ? target.getTime() - now.getTime() : 0;
    return {
      countdownLabel: label,
      countdownValue: formatDuration(ms),
    };
  }, [now, phase, schedule]);

  const activeEntries = entries.filter(
    (e) => e.status === 'in-draw' || e.status === 'won'
  );
  const totalEntries = entries.length;
  const winner = entries.find((e) => e.status === 'won');

  const inDraw = phase !== 'preSnapshot' && totalEntries > 0;
  const snapshotTimeLabel = schedule.snapshotAt.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  // if they are “in draw”, treat identity as locked for today
  const identityLocked = inDraw;

  async function handleCopy(entry: Entry) {
    try {
      await navigator.clipboard.writeText(entry.code);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
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

  // header status chip
  const headerStatus = (() => {
    switch (phase) {
      case 'preSnapshot':
        return { label: 'Daily draw', tone: 'status-pill' };
      case 'betweenSnapshotAndDraw':
        return { label: 'Draw locked', tone: 'status-pill-amber' };
      case 'drawing':
        return { label: 'Drawing winner…', tone: 'status-pill-emerald' };
      case 'postDraw':
      default:
        return { label: 'Winner announced', tone: 'status-pill-emerald' };
    }
  })();

  return (
    <main className="min-h-screen bg-black text-slate-50">
      <div className="mx-auto flex max-w-6xl px-4 py-6 lg:px-0">
        {/* ── Left rail (X-like) ───────────────────────────── */}
        <aside className="hidden min-h-[640px] w-56 flex-col justify-between border-r border-slate-900 pr-3 md:flex">
          <div className="space-y-6">
            {/* Logo / brand */}
            <div className="flex items-center gap-2 px-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-lg">
                💎
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-tight">XPOT</span>
                <span className="text-[11px] text-slate-500">Daily crypto jackpot</span>
              </div>
            </div>

            {/* Nav */}
            <nav className="space-y-1 text-sm">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-full bg-slate-900 px-3 py-2 font-medium text-slate-50"
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

            {/* Primary CTA (placeholder for now) */}
            <button
              type="button"
              className="btn-premium mt-3 w-full rounded-full bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-500 py-2 text-sm font-semibold text-black toolbar-glow"
            >
              ENTER TODAY’S DRAW
            </button>
          </div>

          {/* Account chip + dropdown */}
          <div className="relative">
            <div
              className="mb-2 flex cursor-pointer items-center justify-between rounded-2xl bg-slate-900/70 px-3 py-2 hover:bg-slate-800/80"
              onClick={() => {
                if (!isAuthed) {
                  openXLoginPopup();
                } else {
                  setAccountMenuOpen((open) => !open);
                }
              }}
            >
              <div className="flex items-center gap-2">
                <div className="relative">
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
                  {identityLocked && (
                    <span className="x-avatar-lock">
                      <span className="x-avatar-lock-glyph">🔒</span>
                    </span>
                  )}
                </div>

                <div className="leading-tight">
                  <p className="flex items-center gap-1 text-xs font-semibold text-slate-50">
                    {user?.name ?? 'Your X handle'}
                    {isAuthed && isVerified && <span className="x-verified-badge" />}
                  </p>
                  <p className="text-[11px] text-slate-500">@{username}</p>
                </div>
              </div>

              <span className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500">
                ⋯
              </span>
            </div>

            {isAuthed && accountMenuOpen && (
              <div className="x-account-menu absolute bottom-14 left-0 w-72 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-xl shadow-black/60">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 hover:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
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
                      {identityLocked && (
                        <span className="x-avatar-lock">
                          <span className="x-avatar-lock-glyph">🔒</span>
                        </span>
                      )}
                    </div>
                    <div className="leading-tight">
                      <p className="flex items-center gap-1 text-xs font-semibold text-slate-50">
                        {user?.name ?? 'Your X handle'}
                        {isVerified && <span className="x-verified-badge" />}
                      </p>
                      <p className="text-[11px] text-slate-500">@{username}</p>
                    </div>
                  </div>
                </button>

                <hr />

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

        {/* ── Main shell: center + right ────────────────────── */}
        <div className="premium-shell flex flex-1 flex-col gap-0 rounded-[28px] border border-slate-800/70 bg-[#020617] shadow-[0_30px_100px_rgba(0,0,0,0.9)] lg:flex-row lg:gap-6">
          {/* Center column */}
          <section className="flex-1 border-slate-900/60 lg:border-r">
            {/* Top bar like X */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-900 bg-black/70 px-4 py-3 backdrop-blur">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
                  <span className={headerStatus.tone}>{headerStatus.label}</span>
                </div>
                <p className="text-[13px] text-slate-400">
                  One jackpot. One winner. XPOT tracks your entries and results.
                </p>
              </div>
              <div className="text-right text-[11px] text-slate-500">
                <p className="font-mono text-xs">{countdownLabel}</p>
                <p className="font-mono text-sm text-slate-100">{countdownValue}</p>
              </div>
            </header>

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

            {/* Scrollable content */}
            <div className="space-y-4 px-0 pb-8">
              {/* Profile header (static preview for now) */}
              <section className="flex items-center justify-between border-b border-slate-900 bg-gradient-to-r from-slate-950 via-slate-900/40 to-slate-950 px-4 pt-3 pb-2">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-800">
                    <span className="text-lg">🖤</span>
                    {identityLocked && (
                      <span className="x-avatar-lock">
                        <span className="x-avatar-lock-glyph">🔒</span>
                      </span>
                    )}
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

              {/* HERO: your entries today */}
              <article className="border-b border-slate-900/60 px-4 pt-4 pb-5">
                <div className="card-premium rounded-3xl p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-300">
                        Your entries today
                      </p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <p className="text-3xl font-semibold tracking-tight text-slate-50">
                          {phase === 'preSnapshot' ? entryCount : activeEntries.length}
                        </p>
                        <span className="text-xs text-slate-400">
                          {entryCount === 1 ? 'ticket' : 'tickets'}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
  Today’s cut-off at {snapshotTimeLabel}. Keep XPOT in your wallet until then to stay in the draw.
</p>
                    </div>

                    <div className="rounded-2xl bg-slate-950/60 px-3 py-2 text-right text-[11px] text-slate-400">
                      <p className="font-mono text-xs text-slate-200">
                        Balance now: {mockBalanceNow.toLocaleString()} XPOT
                      </p>
                      <p className="mt-0.5">
                        1 ticket per{' '}
                        <span className="font-mono text-[11px] text-slate-200">
                          1,000,000 XPOT
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                      <p className="text-[11px] text-slate-400">Status</p>
                      <p className="mt-1 text-sm font-semibold text-slate-100">
                        {phase === 'preSnapshot'
                          ? 'Waiting for snapshot'
                          : inDraw
                          ? 'In today’s draw'
                          : 'Not in today’s draw'}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
  Tickets are locked at today’s cut-off time.
</p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                      <p className="text-[11px] text-slate-400">Today’s jackpot</p>
                      <p className="mt-1 text-xl font-semibold text-emerald-100">
                        ${JACKPOT_USD.toLocaleString()}
                      </p>
                      <p className="mt-1 text-[11px] text-emerald-200/80">
                        One winning ticket. One wallet.
                      </p>
                    </div>

                    <div className="premium-highlight jackpot-core col-span-2 p-3 sm:col-span-1">
                      <p className="text-[11px] text-emerald-200">Draw rhythm</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-50">
                        Daily snapshot · on-chain draw · transparent winner
                      </p>
                      <p className="mt-1 text-sm font-semibold text-emerald-50">
  Daily cut-off · verifiable draw · transparent winner
</p>
<p className="mt-1 text-[11px] text-emerald-100/80">
  XPOT uses your balance at cut-off time to generate tickets. No manual
  claiming, no weird off-site lotteries.
</p>
                    </div>
                  </div>
                </div>
              </article>

              {/* Today’s result */}
              <article className="premium-card border-b border-slate-900/60 px-4 pb-5 pt-3">
                <h2 className="text-sm font-semibold text-emerald-100">Today’s result</h2>

                {phase !== 'postDraw' && (
                  <p className="mt-3 text-sm text-slate-300">
                    Your tickets are in the draw. The result will appear here when the
                    timer hits zero.
                  </p>
                )}

                {phase === 'postDraw' && winner && (
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-200">
                        One of your tickets{' '}
                        <span className="font-mono text-emerald-300">
                          {winner.code}
                        </span>{' '}
                        hit today’s jackpot.
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Prize is claimable for a limited time. After that, any unclaimed
                        amount rolls into the next jackpot.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setWinnerClaimed(true);
                        setEntries((prev) =>
                          prev.map((e) =>
                            e.id === winner.id ? { ...e, status: 'claimed' } : e
                          )
                        );
                      }}
                      disabled={winnerClaimed}
                      className={`btn-premium mt-3 rounded-full px-5 py-2 text-sm font-semibold transition sm:mt-0 ${
                        winnerClaimed
                          ? 'cursor-not-allowed border border-slate-800 bg-slate-900 text-slate-500'
                          : 'bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-500 text-slate-950 hover:brightness-110'
                      }`}
                    >
                      {winnerClaimed ? 'Prize claimed' : 'Claim jackpot'}
                    </button>
                  </div>
                )}

                {phase === 'postDraw' && !winner && (
                  <p className="mt-3 text-sm text-slate-300">
                    None of your tickets hit today. Your balance will generate new
                    tickets for the next draw.
                  </p>
                )}

                {winnerClaimed && (
                  <p className="mt-3 text-xs text-emerald-300">
                    Nice catch. Any unclaimed portion would have rolled over on top of
                    tomorrow’s jackpot.
                  </p>
                )}
              </article>

              {/* Tickets feed */}
              <section className="pb-10 px-4">
                <h2 className="pt-3 text-sm font-semibold text-slate-200">
                  Your tickets
                </h2>
                <p className="text-xs text-slate-500">
                  Each ticket is tied to a snapshot and draw. Later you’ll be able to
                  open a ticket to see on-chain proof.
                </p>

                <div className="mt-3 space-y-2 border-l border-slate-800/80 pl-3">
                  {entries.map((entry) => (
                    <article
                      key={entry.id}
                      className="rounded-2xl border border-slate-900 bg-slate-950/70 px-4 pb-4 pt-3 transition hover:border-slate-700 hover:bg-slate-950"
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
                          <p className="mt-1 text-xs text-slate-400">{entry.label}</p>
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
                            View ticket (soon)
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </section>

          {/* Right column */}
          <aside className="hidden w-full max-w-xs flex-col gap-4 border-t border-slate-900/60 bg-slate-950/40 px-4 py-4 lg:flex lg:border-t-0">
            {/* Balance preview */}
            <div className="premium-card p-4">
              <h3 className="text-sm font-semibold">XPOT balance (preview)</h3>
              <p className="mt-1 text-xs text-slate-400">
                In v1 this updates in real time from your Solana wallet.
              </p>
              <p className="mt-3 bg-gradient-to-r from-emerald-200 via-emerald-100 to-white bg-clip-text text-3xl font-semibold tracking-tight text-transparent">
                {mockBalanceNow.toLocaleString()}
                <span className="ml-1 text-sm text-slate-400">XPOT</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                = {entryCount} ticket{entryCount === 1 ? '' : 's'} in today’s draw.
              </p>
            </div>

            {/* X sign-in */}
            <div className="premium-card p-4">
              <h3 className="text-sm font-semibold">
                {isAuthed ? 'Connected with X' : 'Sign in with X'}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                XPOT links your tickets to one X identity. Later, ticket views and
                win-notifications will feel just like opening a tweet.
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
                  Sign out @{username}
                </button>
              )}
            </div>

            {/* Wallet connect preview */}
            <div className="premium-card p-4">
              <h3 className="text-sm font-semibold">Wallet link (preview)</h3>
              <p className="mt-1 text-xs text-slate-400">
  Connect a Solana wallet so XPOT can read your balance at
  the daily cut-off and generate tickets automatically.
</p>
              <button
                type="button"
                disabled
                className="mt-3 w-full cursor-not-allowed rounded-full bg-slate-800 py-2 text-xs font-medium text-slate-500"
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
