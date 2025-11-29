// app/dashboard/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

const MIN_XPOT_REQUIRED = 10_000; // later we swap to XPOT balance
const endpoint = 'https://api.mainnet-beta.solana.com';

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
  walletAddress: string; // <- key: which wallet this ticket belongs to
};

function makeCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = () =>
    Array.from({ length: 4 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join('');
  return `XPOT-${block()}-${block()}`;
}

// ─────────────────────────────────────────────
// Root wrapper: Solana connection + wallet
// ─────────────────────────────────────────────

export default function DashboardPage() {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <DashboardInner />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

// ─────────────────────────────────────────────
// Inner dashboard – wallet + SOL balance + tickets
// ─────────────────────────────────────────────

function DashboardInner() {
  const username = 'your_handle';

  const [entries, setEntries] = useState<Entry[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const { publicKey, connected } = useWallet();
  const [solBalance, setSolBalance] = useState<number | null | 'error'>(null);

  const walletAddress = publicKey?.toBase58() ?? null;
  const walletConnected = !!walletAddress && connected;

  // ─────────────────────────────────────────────
  // Restore & persist tickets (per browser)
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('xpotTicketsV1');
      if (!raw) return;
      const parsed = JSON.parse(raw) as Entry[];
      if (Array.isArray(parsed)) {
        setEntries(parsed);
      }
    } catch (err) {
      console.error('Error loading stored XPOT tickets', err);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('xpotTicketsV1', JSON.stringify(entries));
    } catch (err) {
      console.error('Error saving XPOT tickets', err);
    }
  }, [entries]);

  // ─────────────────────────────────────────────
  // Load SOL balance via API when wallet changes
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!walletAddress) {
      setSolBalance(null);
      return;
    }

    let cancelled = false;
    setSolBalance(null); // show "Loading..." while fetching

    (async () => {
      try {
        const res = await fetch(`/api/sol-balance?address=${walletAddress}`);
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const data: { lamports: number } = await res.json();
        if (cancelled) return;

        setSolBalance(data.lamports / LAMPORTS_PER_SOL);
      } catch (err) {
        console.error('Error loading SOL balance (via API)', err);
        if (!cancelled) setSolBalance('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  // ─────────────────────────────────────────────
  // Derived per-wallet state
  // ─────────────────────────────────────────────

  // All tickets for the current connected wallet
  const currentWalletEntries = walletAddress
    ? entries.filter(e => e.walletAddress === walletAddress)
    : [];

  const hasTicketForCurrentWallet = currentWalletEntries.length > 0;
  const latestTicketForWallet = currentWalletEntries[0] ?? null;

  // Winner preview logic (later you’ll wire real RNG)
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
    if (!walletConnected || !walletAddress) return; // must be connected
    if (hasTicketForCurrentWallet) return; // this wallet already entered

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
      walletAddress,
    };

    // Newest first
    setEntries(prev => [newEntry, ...prev]);
  }

  // ─────────────────────────────────────────────
  // Small helper to display wallet short form
  // ─────────────────────────────────────────────

  function formatWalletShort(addr: string) {
    if (addr.length <= 8) return addr;
    return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-black text-slate-50 relative">
      {/* MAIN DASHBOARD SHELL */}
      <div className="mx-auto flex max-w-6xl">
        {/* Left nav */}
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

            {/* Nav */}
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

            {/* Main CTA */}
            <button
              type="button"
              onClick={handleClaimTicket}
              disabled={!walletConnected || hasTicketForCurrentWallet}
              className={`btn-premium mt-3 w-full rounded-full py-2 text-sm font-semibold ${
                !walletConnected
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : hasTicketForCurrentWallet
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-500 text-black toolbar-glow'
              }`}
            >
              {!walletConnected
                ? 'Connect wallet to claim'
                : hasTicketForCurrentWallet
                ? 'This wallet is already in'
                : 'Claim today’s ticket'}
            </button>

            <p className="px-3 text-[11px] text-slate-500 mt-1">
              One ticket per wallet, per draw. Switching wallets lets you enter
              again with a different wallet.
            </p>
          </div>

          {/* Mini account chip */}
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
                  Wallet-native preview. X login wiring comes later.
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main shell */}
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

              {/* Today's ticket */}
              <article className="premium-card border-b border-slate-900/60 px-4 pt-4 pb-5">
                <h2 className="text-sm font-semibold text-emerald-100">
                  Today’s ticket
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  One ticket per wallet per draw. You must hold at least{' '}
                  <span className="font-semibold text-emerald-300">
                    {MIN_XPOT_REQUIRED.toLocaleString()} XPOT
                  </span>{' '}
                  at the moment you claim. You can always buy or sell again
                  later.
                </p>

                {!walletConnected ? (
                  <div className="mt-4 text-xs text-amber-300">
                    Connect your wallet on the right to claim today’s ticket.
                  </div>
                ) : !hasTicketForCurrentWallet ? (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-200">
                        This wallet has not entered yet.
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Claim your ticket for today’s jackpot. Each wallet can
                        enter once per draw.
                      </p>
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
                      Claim today’s ticket
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-emerald-100">
                        ✅ This wallet is in today’s draw.
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        You can switch wallets if you want another wallet to
                        enter too.
                      </p>
                      {latestTicketForWallet && (
                        <p className="mt-2 text-xs text-slate-300">
                          Ticket code:{' '}
                          <span className="font-mono text-emerald-300">
                            {latestTicketForWallet.code}
                          </span>
                        </p>
                      )}
                      {walletAddress && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          Wallet:{' '}
                          <span className="font-mono">
                            {formatWalletShort(walletAddress)}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </article>

              {/* Today's result (preview) */}
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
                  Tickets from all wallets you’ve connected in this browser
                  session. Each ticket is tied to a specific wallet and draw.
                </p>

                <div className="mt-3 space-y-2 border-l border-slate-800/80 pl-3">
                  {entries.length === 0 && (
                    <p className="text-xs text-slate-500">
                      No tickets yet. Connect a wallet and claim today’s entry.
                    </p>
                  )}

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
                          <p className="mt-1 text-[11px] text-slate-500">
                            Wallet:{' '}
                            <span className="font-mono">
                              {formatWalletShort(entry.walletAddress)}
                            </span>
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

              <p className="mt-1 text-xs text-slate-400">
                Connect a wallet before claiming today’s ticket.
              </p>

              <div className="mt-3">
                <WalletMultiButton className="w-full !rounded-full !h-9 !text-sm" />
              </div>

              {walletAddress && (
                <div className="mt-3 text-xs text-slate-300">
                  <p className="break-all">
                    Wallet:{' '}
                    <span className="font-mono">{walletAddress}</span>
                  </p>
                  <p className="mt-1">
                    SOL balance:{' '}
                    {solBalance === null && walletAddress
                      ? 'Loading...'
                      : solBalance === 'error'
                      ? 'Unavailable'
                      : typeof solBalance === 'number'
                      ? `${solBalance.toFixed(4)} SOL`
                      : '-'}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    This wallet can claim one ticket per draw.
                  </p>
                </div>
              )}

              {!walletAddress && (
                <p className="mt-2 text-[11px] text-slate-500">
                  Phantom and other Solana wallets work here. This is live
                  mainnet SOL.
                </p>
              )}
            </div>

            {/* How it works */}
            <div className="premium-card p-4">
              <h3 className="text-sm font-semibold">How today’s draw works</h3>
              <ul className="mt-2 text-xs text-slate-400 space-y-1">
                <li>• Claim exactly one ticket per wallet.</li>
                <li>
                  • At claim time, your wallet must hold at least{' '}
                  <span className="font-semibold text-emerald-300">
                    {MIN_XPOT_REQUIRED.toLocaleString()} XPOT
                  </span>
                  .
                </li>
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
