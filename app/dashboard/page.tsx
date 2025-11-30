'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

import { REQUIRED_XPOT } from '../../lib/xpot';

import { useSession } from 'next-auth/react';

function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString('de-DE'); // 30.11.2025
}

function formatDateTime(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────

const endpoint = 'https://api.mainnet-beta.solana.com';

// ─────────────────────────────────────────────
// Types & helpers
// ─────────────────────────────────────────────

type EntryStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

type Entry = {
  id: string;
  code: string;
  status: EntryStatus;
  label: string;
  jackpotUsd: string;
  createdAt: string;
  walletAddress: string;
};

function shortWallet(addr: string) {
  if (!addr || addr.length < 8) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function WalletDebug() {
  const { publicKey, connected, wallet } = useWallet();

  useEffect(() => {
    console.log('[XPOT] Wallet state changed:', {
      connected,
      publicKey: publicKey?.toBase58() ?? null,
      walletName: wallet?.adapter?.name ?? null,
    });
  }, [connected, publicKey, wallet]);

  return null;
}

// Start with empty list – DB will fill this
const initialEntries: Entry[] = [];

// ─────────────────────────────────────────────
// Inner dashboard – uses wallet + SOL balance
// ─────────────────────────────────────────────

export default function DashboardPage() {
  const username =
  session?.user?.name ||
  session?.user?.email?.split('@')[0] ||
  'XPOT user';
  const { data: session } = useSession();

  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  const [ticketClaimed, setTicketClaimed] = useState(false);
  const [todaysTicket, setTodaysTicket] = useState<Entry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const { publicKey, connected } = useWallet();
  const [solBalance, setSolBalance] = useState<number | null | 'error'>(null);

  const walletConnected = !!publicKey && connected;
  const currentWalletAddress = publicKey?.toBase58() ?? null;
  const winner = entries.find(e => e.status === 'won');

  // ─────────────────────────────────────────────
  // Load today's tickets from DB
  // ─────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function loadTickets() {
      try {
        const res = await fetch('/api/tickets/today');
        if (!res.ok) throw new Error('Failed to load tickets');

        const data = await res.json();

        if (!cancelled && Array.isArray(data.tickets)) {
          if (data.tickets.length > 0) {
            setEntries(data.tickets);
          }
        }
      } catch (err) {
        console.error('Failed to load tickets from DB', err);
        if (!cancelled) {
          setTicketsError(
            (err as Error).message ?? 'Failed to load tickets'
          );
        }
      } finally {
        if (!cancelled) setLoadingTickets(false);
      }
    }

    loadTickets();

    return () => {
      cancelled = true;
    };
  }, []);

  // ─────────────────────────────────────────────
  // Sync "today's ticket" state with DB
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!currentWalletAddress) {
      setTicketClaimed(false);
      setTodaysTicket(null);
      return;
    }

    const myTicket = entries.find(
      t => t.walletAddress === currentWalletAddress && t.status === 'in-draw'
    );

    if (myTicket) {
      setTicketClaimed(true);
      setTodaysTicket(myTicket);
    } else {
      setTicketClaimed(false);
      setTodaysTicket(null);
    }
  }, [entries, currentWalletAddress]);

  // ─────────────────────────────────────────────
  // SOL balance (via API route)
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!publicKey) {
      setSolBalance(null);
      return;
    }

    let cancelled = false;
    setSolBalance(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/sol-balance?address=${publicKey.toBase58()}`
        );
        if (!res.ok) throw new Error(`API error: ${res.status}`);

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
  }, [publicKey]);

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

  async function handleClaimTicket() {
    if (!walletConnected || !publicKey) return;
    if (loadingTickets || claiming) return; // avoid double clicks

    setClaimError(null);
    setClaiming(true);

    const walletAddress = publicKey.toBase58();

    try {
      const res = await fetch('/api/tickets/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok || !data.ok) {
        const code = data.error as string | undefined;

        switch (code) {
          case 'NOT_ENOUGH_XPOT':
            setClaimError(
              `You need at least ${(
                data.required ?? REQUIRED_XPOT
              ).toLocaleString()} XPOT to claim today’s ticket. Your wallet currently has ${Number(
                data.balance ?? 0
              ).toLocaleString()} XPOT.`
            );
            break;

          case 'NOT_ENOUGH_SOL':
            setClaimError(
              `Your wallet needs some SOL for network fees before you can claim today’s ticket.`
            );
            break;

          case 'XPOT_CHECK_FAILED':
            setClaimError(
              'Could not verify your XPOT balance right now. Please try again in a moment.'
            );
            break;

          case 'MISSING_WALLET':
          case 'INVALID_BODY':
            setClaimError(
              'Something is wrong with your wallet address. Try reconnecting your wallet and claiming again.'
            );
            break;

          default:
            setClaimError('Ticket claim failed. Please try again.');
        }

        console.error('Claim failed', res.status, text);
        return;
      }

      // Success path
      const ticket: Entry = data.ticket;
      const tickets: Entry[] | undefined = data.tickets;

      if (Array.isArray(tickets) && tickets.length > 0) {
        setEntries(tickets);
      } else if (ticket) {
        setEntries(prev => {
          const others = prev.filter(t => t.id !== ticket.id);
          return [ticket, ...others];
        });
      }

      setTicketClaimed(true);
      setTodaysTicket(ticket);
      setClaimError(null);
    } catch (err) {
      console.error('Error calling /api/tickets/claim', err);
      setClaimError('Unexpected error while claiming. Please try again.');
    } finally {
      setClaiming(false);
    }
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-black text-slate-50 relative">
      <WalletDebug />
      <div className="mx-auto flex max-w-6xl">
        {/* Left nav */}
        <aside className="hidden min-h-screen w-56 border-r border-slate-900 px-3 py-4 md:flex flex-col justify-between">
          <div className="space-y-6">
            {/* Logo */}
            <div className="px-3">
              <Link href="/" className="inline-flex flex-col gap-1">
                <Image
                  src="/img/xpot-logo-light.png"
                  alt="XPOT"
                  width={120}
                  height={32}
                  priority
                />
              </Link>
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

              <Link
                href="/dashboard/history"
                className="flex w-full items-center gap-3 rounded-full px-3 py-2 text-slate-300 hover:bg-slate-900/70"
              >
                <span className="text-lg">🎟️</span>
                <span>Draw history</span>
              </Link>

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
              disabled={!walletConnected || claiming || loadingTickets}
              className={`btn-premium mt-3 w-full rounded-full py-2 text-sm font-semibold ${
                !walletConnected || claiming || loadingTickets
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-500 text-black toolbar-glow'
              }`}
            >
              {!walletConnected
                ? 'Connect wallet to claim'
                : claiming
                ? 'Claiming…'
                : 'Claim today’s ticket'}
            </button>
          </div>

          {/* Mini account chip */}
          <div className="relative">
            <div
              className="mb-2 flex items-center justify-between rounded-2xl bg-slate-900/70 px-3 py-2 cursor-pointer hover:bg-slate-800/80"
              onClick={() => setAccountMenuOpen(open => !open)}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700">
                  <Image
                    src="/img/xpot-mark.png"
                    alt="XPOT icon"
                    width={20}
                    height={20}
                  />
                </div>

                <div className="leading-tight">
                  <p className="flex items-center gap-1 text-xs font-semibold text-slate-50">
                    XPOT user
                  </p>
                  <a
  href={`https://x.com/${username.replace('@', '')}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-xs text-slate-500 hover:text-emerald-300"
>
  @{username.replace('@', '')}
</a>
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
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700">
                      <Image
                        src="/img/xpot-mark.png"
                        alt="XPOT icon"
                        width={22}
                        height={22}
                      />
                    </div>
                    <div className="leading-tight">
                      <p className="text-xs font-semibold text-slate-50">
                        XPOT user
                      </p>
                      <a
  href={`https://x.com/${username.replace('@', '')}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-xs text-slate-500 hover:text-emerald-300"
>
  @{username.replace('@', '')}
</a>
                    </div>
                  </div>
                </div>

                <hr className="border-t border-slate-900" />

                <button
                  type="button"
                  className="block w-full px-4 py-3 text-left text-[13px] text-slate-400 hover:bg-slate-900 cursor-default"
                >
                  Login with X coming soon
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
  <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
  <p className="text-[13px] text-slate-400">
    One jackpot. One winner. Your daily XPOT ticket.
  </p>
</div>
                {/* ... */}
              </div>
            </header>

            {/* Scroll content */}
            <div className="space-y-4 px-0">
              {/* Profile header */}
              <section className="flex items-center justify-between border-b border-slate-900 bg-gradient-to-r from-slate-950 via-slate-900/40 to-slate-950 px-4 pt-3 pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-800">
                    <Image
                      src="/img/xpot-mark.png"
                      alt="XPOT icon"
                      width={28}
                      height={28}
                    />
                  </div>

                  <div className="flex flex-col leading-tight">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-slate-50">
                        Mørke Drevos
                      </span>
                    </div>
                    <a
  href={`https://x.com/${username.replace('@', '')}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-xs text-slate-500 hover:text-emerald-300"
>
  @{username.replace('@', '')}
</a>
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
                    {REQUIRED_XPOT.toLocaleString()} XPOT
                  </span>{' '}
                  at the moment you claim. You can always buy or sell again
                  later.
                </p>

                {!ticketClaimed ? (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-200">
                        Claim your ticket for today’s jackpot.
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Your ticket will be tied to your connected wallet for
                        today’s draw.
                      </p>

                      {claiming && (
                        <p className="mt-1 text-[11px] text-emerald-300 animate-pulse">
                          Verifying wallet → Locking today’s draw → Minting
                          ticket…
                        </p>
                      )}

                      {!walletConnected && (
                        <p className="mt-1 text-[11px] text-amber-300">
                          Connect your wallet on the right to claim today’s
                          ticket.
                        </p>
                      )}

                      {claimError && (
                        <p className="mt-2 text-[11px] text-amber-300">
                          {claimError}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleClaimTicket}
                      disabled={!walletConnected || claiming || loadingTickets}
                      className={`btn-premium mt-3 rounded-full px-5 py-2 text-sm font-semibold sm:mt-0 transition-all duration-300 ${
                        !walletConnected
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : claiming
                          ? 'bg-slate-900 text-slate-300 animate-pulse cursor-wait'
                          : 'bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-500 text-black hover:brightness-110 toolbar-glow'
                      }`}
                    >
                      {!walletConnected
                        ? 'Connect wallet to claim'
                        : claiming
                        ? 'Generating ticket...'
                        : 'Claim today’s ticket'}
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-emerald-100">
                        ✅ Your ticket is in today’s draw.
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Come back when the countdown hits zero to see if you
                        won.
                      </p>
                      {todaysTicket && (
                        <p className="mt-2 text-xs text-slate-300">
                          Ticket code:{' '}
                          <span className="font-mono text-emerald-300">
                            {todaysTicket.code}
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
                  Each ticket is tied to a specific daily draw and wallet.
                  Tickets from your{' '}
                  <span className="font-semibold text-emerald-300">
                    currently connected wallet
                  </span>{' '}
                  are highlighted.
                </p>

                <div className="mt-3 space-y-2 border-l border-slate-800/80 pl-3">
                  {entries.map(entry => {
                    const isCurrentWallet =
                      currentWalletAddress &&
                      entry.walletAddress === currentWalletAddress;

                    return (
                      <article
                        key={entry.id}
                        className={`rounded-2xl px-4 pb-4 pt-3 transition border ${
                          isCurrentWallet
                            ? 'border-emerald-400/70 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.25)]'
                            : 'border-slate-900 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
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

                              {isCurrentWallet && (
                                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                                  Current wallet
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs text-slate-400">
                              {entry.label}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                              Created: {formatDateTime(entry.createdAt)}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                              Wallet:{' '}
                              <span className="font-mono">
                                {shortWallet(entry.walletAddress)}
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
                    );
                  })}
                </div>
              </section>

              {/* Draw history preview */}
              <section className="pb-10 px-4">
                <div className="flex itemscenter justify-between">
                  <h2 className="text-sm font-semibold text-slate-200">
                    Draw history
                  </h2>

                  <Link
                    href="/dashboard/history"
                    className="text-[11px] text-slate-400 hover:text-emerald-300"
                  >
                    View full history →
                  </Link>
                </div>

                <p className="text-xs text-slate-500">
                  Your previous tickets from earlier draws.
                </p>

                <div className="mt-3 space-y-2 border-l border-slate-800/80 pl-3">
                  {entries.length === 0 && (
                    <p className="text-xs text-slate-500">
                      No previous draws yet.
                    </p>
                  )}

                  {entries.slice(0, 5).map(entry => (
                    <article
                      key={entry.id}
                      className="rounded-2xl border border-slate-900 bg-slate-950/70 px-4 pb-3 pt-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-sm text-slate-50">
                            {entry.code}
                          </span>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {formatDate(entry.createdAt)}
                          </p>
                        </div>

                        <span className="text-[11px] text-slate-400">
                          {entry.status}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>

                {ticketsError && (
                  <p className="mt-2 text-[11px] text-amber-300">
                    {ticketsError}
                  </p>
                )}
              </section>
            </div>
          </section>

          {/* Right sidebar */}
          <aside className="hidden w-80 flex-col gap-4 bg-slate-950/40 px-4 py-4 lg:flex">
            {/* Wallet card */}
            <div className="premium-card p-4">
              <h3 className="text-sm font-semibold">Wallet</h3>

              <p className="mt-1 text-xs text-slate-400">
                Connect wallet before claiming today’s ticket.
              </p>

              <div className="mt-3">
                <WalletMultiButton className="w-full !rounded-full !h-9 !text-sm" />
              </div>

              {publicKey && (
                <div className="mt-3 text-xs text-slate-300">
                  <p className="break-all">
                    Wallet:{' '}
                    <span className="font-mono">{publicKey.toBase58()}</span>
                  </p>
                  <p className="mt-1">
                    SOL balance:{' '}
                    {solBalance === null && publicKey
                      ? 'Loading...'
                      : solBalance === 'error'
                      ? 'Unavailable'
                      : typeof solBalance === 'number'
                      ? `${solBalance.toFixed(4)} SOL`
                      : '-'}
                  </p>
                </div>
              )}

              {!publicKey && (
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
                    {REQUIRED_XPOT.toLocaleString()} XPOT
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
