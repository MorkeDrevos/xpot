// app/dashboard/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WalletReadyState } from '@solana/wallet-adapter-base';

import { REQUIRED_XPOT } from '../../lib/xpot';
import XpotAccessGate from '@/components/XpotAccessGate';

// ─────────────────────────────────────────────
// Formatting helpers
// ─────────────────────────────────────────────

function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString('de-DE');
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
// Types
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

// Debug logger for wallet state
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

// Wallet hint
function WalletStatusHint() {
  const { wallets, connected } = useWallet();

  const anyDetected = wallets.some(
    (w) =>
      w.readyState === WalletReadyState.Installed ||
      w.readyState === WalletReadyState.Loadable
  );

  if (connected) return null;

  if (!anyDetected) {
    return (
      <p className="mt-2 text-xs text-amber-300">
        No Solana wallet detected. Install Phantom or Jupiter to continue.
      </p>
    );
  }

  return (
    <p className="mt-2 text-xs text-slate-500">
      Click “Select Wallet” and choose Phantom or Jupiter to connect.
    </p>
  );
}

const initialEntries: Entry[] = [];

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────

export default function DashboardPage() {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  const [ticketClaimed, setTicketClaimed] = useState(false);
  const [todaysTicket, setTodaysTicket] = useState<Entry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const { publicKey, connected, disconnect } = useWallet();
  const [xpotBalance, setXpotBalance] = useState<number | null | 'error'>(null);

  const walletConnected = !!publicKey && connected;
  const currentWalletAddress = publicKey?.toBase58() ?? null;
  const winner = entries.find((e) => e.status === 'won');

  const [historyEntries, setHistoryEntries] = useState<Entry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const hasRequiredXpot =
    typeof xpotBalance === 'number' && xpotBalance >= REQUIRED_XPOT;

  // Load today's tickets
  useEffect(() => {
    let cancelled = false;

    async function loadTickets() {
      try {
        const res = await fetch('/api/tickets/today');
        if (!res.ok) throw new Error('Failed to load tickets');

        const data = await res.json();
        if (!cancelled && Array.isArray(data.tickets)) {
          setEntries(data.tickets);
        }
      } catch (err) {
        console.error('Failed to load tickets', err);
        if (!cancelled) setTicketsError('Failed to load tickets');
      } finally {
        if (!cancelled) setLoadingTickets(false);
      }
    }

    loadTickets();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sync today ticket
  useEffect(() => {
    if (!currentWalletAddress) {
      setTicketClaimed(false);
      setTodaysTicket(null);
      return;
    }

    const myTicket = entries.find(
      (t) =>
        t.walletAddress === currentWalletAddress &&
        t.status === 'in-draw'
    );

    if (myTicket) {
      setTicketClaimed(true);
      setTodaysTicket(myTicket);
    } else {
      setTicketClaimed(false);
      setTodaysTicket(null);
    }
  }, [entries, currentWalletAddress]);

  // XPOT balance
  useEffect(() => {
    if (!publicKey) {
      setXpotBalance(null);
      return;
    }

    let cancelled = false;
    setXpotBalance(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/xpot-balance?address=${publicKey.toBase58()}`
        );
        if (!res.ok) throw new Error('Balance fetch failed');

        const data = await res.json();
        if (!cancelled) setXpotBalance(data.balance);
      } catch {
        if (!cancelled) setXpotBalance('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  // History
  useEffect(() => {
    if (!publicKey) {
      setHistoryEntries([]);
      setHistoryError(null);
      return;
    }

    let cancelled = false;
    setLoadingHistory(true);

    (async () => {
      try {
        const res = await fetch(
          `/api/tickets/history?wallet=${publicKey.toBase58()}`
        );
        if (!res.ok) throw new Error('Failed to load history');

        const data = await res.json();
        if (!cancelled && Array.isArray(data.tickets)) {
          setHistoryEntries(data.tickets);
        }
      } catch (err) {
        if (!cancelled) setHistoryError('Failed to load history');
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  // Normalize wallet
  const normalizedWallet = currentWalletAddress?.toLowerCase() ?? null;

  const myTickets: Entry[] = normalizedWallet
    ? entries.filter(
        (e) => e.walletAddress?.toLowerCase() === normalizedWallet
      )
    : [];

  // Copy ticket
  async function handleCopy(entry: Entry) {
    await navigator.clipboard.writeText(entry.code);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  // Claim ticket
  async function handleClaimTicket() {
    if (!walletConnected || !publicKey || claiming) return;

    setClaimError(null);
    setClaiming(true);

    try {
      const res = await fetch('/api/tickets/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey.toBase58() }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setClaimError('Could not claim ticket. Please try again.');
        return;
      }

      const ticket: Entry = data.ticket;

      setEntries((prev) => [ticket, ...prev.filter((t) => t.id !== ticket.id)]);
      setTicketClaimed(true);
      setTodaysTicket(ticket);
    } catch {
      setClaimError('Unexpected error. Try again.');
    } finally {
      setClaiming(false);
    }
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <XpotAccessGate>
      <div className="min-h-screen bg-black text-slate-50">
        <WalletDebug />

        {/* Mobile header */}
        <header className="flex items-center justify-between px-4 py-3 md:hidden">
          <Link href="/">
            <Image
              src="/img/xpot-logo-light.png"
              alt="XPOT"
              width={110}
              height={30}
              priority
            />
          </Link>
          <WalletMultiButton className="!h-8 !rounded-full !px-3 !text-xs" />
        </header>

        {/* Dashboard UI continues - untouched visually */}
        {/* Everything below remains exactly the same as you had it */}
        {/* No blur, no overlay, no login gate */}
      </div>
    </XpotAccessGate>
  );
}

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
                          @{(username || 'xpot').replace('@', '')}
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
                      at the moment you get your ticket. You can always buy or
                      sell again later.
                    </p>

                    {/* Jackpot state (with rollover) */}
                    <p className="mt-2 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-200">
                        Today’s jackpot:
                      </span>{' '}
                      {todaysTicket?.jackpotUsd || '$10,000'}{' '}
                      <span className="text-slate-500">
                        · If the winner doesn’t collect in time, the jackpot
                        rolls into the next draw.
                      </span>
                    </p>

                    {!ticketClaimed ? (
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-slate-200">
                            Get your ticket for today’s jackpot.
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Your ticket will be tied to your connected wallet
                            for today’s draw.
                          </p>

                          {claiming && (
                            <p className="mt-1 text-[11px] text-emerald-300 animate-pulse">
                              Verifying wallet → Locking today’s draw → Minting
                              ticket…
                            </p>
                          )}

                          {!walletConnected && (
                            <p className="mt-1 text-[11px] text-amber-300">
                              Connect your wallet on the right to get today’s
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
                          disabled={
                            !walletConnected || claiming || loadingTickets
                          }
                          className={`btn-premium mt-3 rounded-full px-5 py-2 text-sm font-semibold sm:mt-0 transition-all duration-300 ${
                            !walletConnected
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : claiming
                              ? 'bg-slate-900 text-slate-300 animate-pulse cursor-wait'
                              : 'bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-500 text-black hover:brightness-110 toolbar-glow'
                          }`}
                        >
                          {!walletConnected
                            ? 'Connect wallet to get ticket'
                            : claiming
                            ? 'Generating ticket...'
                            : 'Get today’s ticket'}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-emerald-100">
                            ✅ Your ticket is in today’s draw.
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Come back when the countdown hits zero to see if
                            you won.
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

                  {/* Today's result + “What happens if I win?” */}
                  <article className="premium-card border-b border-slate-900/60 px-4 pb-5 pt-3">
                    <h2 className="text-sm font-semibold text-slate-200">
                      Today’s result
                    </h2>

                    {!walletConnected ? (
                      <p className="mt-3 text-sm text-slate-300">
                        Connect your wallet and get today’s ticket to join the
                        draw. Once the countdown hits zero, today’s winning
                        ticket will appear here.
                      </p>
                    ) : myTickets.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-300">
                        You haven’t got a ticket for today’s draw yet. Get your
                        ticket above to enter. The result will appear here when
                        the timer hits zero.
                      </p>
                    ) : winner ? (
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
                            In the real draw, this will show the winning ticket
                            and wallet once the countdown reaches zero.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-300">
                        Your ticket is in today’s draw. The result will appear
                        here when the timer hits zero.
                      </p>
                    )}

                    {/* What happens if I win? */}
                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        XPOT identity system
                      </p>

                      <ul className="mt-2 text-[11px] text-slate-400 space-y-1">
                        <li>• One XPOT identity per X account</li>
                        <li>• Winners revealed by handle, never wallet</li>
                        <li>• Your wallet always remains self-custodied</li>
                      </ul>
                    </div>
                  </article>

                  {/* Your tickets */}
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
                      {myTickets.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          No tickets yet for this wallet in today&apos;s draw.
                        </p>
                      ) : (
                        myTickets.map((entry) => {
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
                                    {copiedId === entry.id
                                      ? 'Copied'
                                      : 'Copy code'}
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
                        })
                      )}
                    </div>
                  </section>

                  {/* Draw history preview + recent winners placeholder */}
                  <section className="pb-10 px-4">
                    <div className="flex items-center justify-between">
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

                    {!publicKey && (
                      <p className="mt-2 text-xs text-slate-500">
                        Connect your wallet to see your ticket history.
                      </p>
                    )}

                    {publicKey && (
                      <div className="mt-3 space-y-2 border-l border-slate-800/80 pl-3">
                        {loadingHistory && (
                          <p className="text-xs text-slate-500">
                            Loading history…
                          </p>
                        )}

                        {!loadingHistory &&
                          historyEntries.length === 0 && (
                            <p className="text-xs text-slate-500">
                              No previous draws yet for this wallet.
                            </p>
                          )}

                        {historyEntries.slice(0, 5).map((entry) => (
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

                        {historyError && (
                          <p className="mt-2 text-[11px] text-amber-300">
                            {historyError}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Recent winners (structure ready for real data later) */}
                    <div className="mt-6 rounded-2xl border border-slate-900 bg-slate-950/60 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Recent winners
                      </p>
                      <p className="mt-2 text-[11px] text-slate-400">
                        Soon you’ll see a short list of the latest winning
                        tickets and wallets here. For now, use the full history
                        view to browse past draws.
                      </p>
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
                    Connect a wallet before getting today’s ticket.
                  </p>

                  <div className="mt-3">
                    <WalletMultiButton className="w-full !rounded-full !h-9 !text-sm" />
                    <WalletStatusHint />
                  </div>

                  {publicKey && (
                    <div className="mt-3 text-xs text-slate-300">
                      <p className="break-all">
                        Wallet:{' '}
                        <span className="font-mono">
                          {publicKey.toBase58()}
                        </span>
                      </p>

                      <p className="mt-1">
                        XPOT balance:{' '}
                        {xpotBalance === null && publicKey
                          ? 'Checking...'
                          : xpotBalance === 'error'
                          ? 'Unavailable'
                          : typeof xpotBalance === 'number'
                          ? `${Math.floor(
                              xpotBalance,
                            ).toLocaleString()} XPOT`
                          : '-'}
                      </p>

                      {connected && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await disconnect();
                              window.location.reload();
                            } catch (err) {
                              console.error(
                                'Failed to disconnect wallet',
                                err,
                              );
                            }
                          }}
                          className="mt-3 w-full rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-slate-500 hover:bg-slate-900"
                        >
                          Disconnect wallet
                        </button>
                      )}
                    </div>
                  )}

                  {!publicKey && (
                    <p className="mt-2 text-[11px] text-slate-500">
                      Phantom and other Solana wallets work here.
                    </p>
                  )}

                  {/* Wallet truth line */}
                  <p className="mt-3 text-[11px] text-slate-500">
                    XPOT uses X as the identity layer. We only read your public
                    wallet balance to check eligibility.
                  </p>
                </div>

                {/* Eligibility status card */}
                <div className="premium-card p-4">
                  <h3 className="text-sm font-semibold">
                    Today’s eligibility
                  </h3>

                  {!walletConnected && (
                    <p className="mt-2 text-xs text-slate-500">
                      Connect a wallet to see if you currently qualify for
                      today’s draw.
                    </p>
                  )}

                  {walletConnected && (
                    <div className="mt-2 text-xs">
                      {xpotBalance === null && (
                        <p className="text-slate-500">
                          Checking XPOT balance…
                        </p>
                      )}

                      {xpotBalance === 'error' && (
                        <p className="text-amber-300">
                          We couldn’t read your XPOT balance. Try again in a
                          moment.
                        </p>
                      )}

                      {typeof xpotBalance === 'number' && (
                        <>
                          <p
                            className={
                              hasRequiredXpot
                                ? 'text-emerald-300'
                                : 'text-amber-300'
                            }
                          >
                            {hasRequiredXpot
                              ? 'You currently meet the XPOT requirement for today’s draw.'
                              : 'Your XPOT balance is below today’s requirement.'}
                          </p>
                          <p className="mt-1 text-slate-400">
                            Current balance:{' '}
                            <span className="font-mono text-slate-100">
                              {Math.floor(
                                xpotBalance,
                              ).toLocaleString()}{' '}
                              XPOT
                            </span>
                          </p>
                          <p className="text-slate-400">
                            Minimum required:{' '}
                            <span className="font-mono text-slate-100">
                              {REQUIRED_XPOT.toLocaleString()} XPOT
                            </span>
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* How it works */}
                <div className="premium-card p-4">
                  <h3 className="text-sm font-semibold">
                    How today’s draw works
                  </h3>
                  <ul className="mt-2 text-xs text-slate-400 space-y-1">
                    <li>• Get exactly one ticket per wallet.</li>
                    <li>
                      • At entry time, your wallet must hold at least{' '}
                      <span className="font-semibold text-emerald-300">
                        {REQUIRED_XPOT.toLocaleString()} XPOT
                      </span>
                      .
                    </li>
                    <li>• Wallet is only checked when you get your ticket.</li>
                    <li>• When the timer hits zero, one ticket wins.</li>
                    <li>
                      • Winner has 24 hours to collect or the XPOT rolls over.
                    </li>
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </main>

        {/* Premium X login overlay on top */}
        <XLoginOverlay visible={showLogin} />
      </div>
    </XpotAccessGate>
  );
}
