'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';

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

// Seed preview entries so the list never looks empty
const now = new Date();
const initialEntries: Entry[] = [
  {
    id: 1,
    code: makeCode(),
    status: 'won',
    label: "Today's main jackpot • $10,000",
    jackpotUsd: '$10,000',
    createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: 2,
    code: makeCode(),
    status: 'in-draw',
    label: "Yesterday's main jackpot • $8,400",
    jackpotUsd: '$8,400',
    createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

export default function ClaimTicketSection() {
  const { data: session, status } = useSession();
  const isAuthed = !!session;

  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [ticketClaimed, setTicketClaimed] = useState(false);
  const [todaysTicket, setTodaysTicket] = useState<Entry | null>(null);
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const winner = entries.find(e => e.status === 'won');

  function handleMockConnectWallet() {
    // TEMP: pretend a wallet is connected
    setWalletConnected(true);
    // Just a preview-style fake address
    setWalletAddress('2krTwN...u6LrUk');
  }

  async function handleCopy(entry: Entry) {
    try {
      await navigator.clipboard.writeText(entry.code);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore clipboard errors
    }
  }

  function handleClaimTicket() {
    if (!isAuthed) {
      // Force X login first
      signIn(undefined, { callbackUrl: '/dashboard' });
      return;
    }

    if (!walletConnected) {
      // Do nothing – button is disabled anyway
      return;
    }

    if (ticketClaimed) return;

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
    };

    setEntries(prev => [newEntry, ...prev]);
    setTicketClaimed(true);
    setTodaysTicket(newEntry);
  }

  return (
    <section className="space-y-4">
      {/* TODAY'S TICKET – MAIN CARD */}
      <article className="premium-card border-b border-slate-900/60 px-4 pt-4 pb-5">
        <h2 className="text-sm font-semibold text-emerald-100">
          Today’s ticket
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          One ticket per X account per draw. Hold the minimum XPOT when you
          claim. You can always buy or sell again later.
        </p>

        {!ticketClaimed ? (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-200">
                Claim your ticket for today’s jackpot.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Your ticket will be tied to this X account for today’s draw.
              </p>

              {!isAuthed && (
                <p className="mt-2 text-[11px] text-amber-300">
                  Sign in with X first. No posting is required.
                </p>
              )}

              {isAuthed && !walletConnected && (
                <p className="mt-2 text-[11px] text-amber-300">
                  Connect a wallet before claiming today’s ticket.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleClaimTicket}
              disabled={!isAuthed || !walletConnected}
              className={`btn-premium mt-3 rounded-full px-5 py-2 text-sm font-semibold sm:mt-0 ${
                !isAuthed || !walletConnected
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-500 text-black toolbar-glow'
              }`}
            >
              {!isAuthed
                ? 'Sign in with X'
                : !walletConnected
                ? 'Connect wallet to claim'
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
                Come back when the countdown hits zero to see if you won.
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

      {/* WALLET CARD (PREVIEW – NO REAL CHAIN YET) */}
      <article className="premium-card px-4 py-4">
        <h3 className="text-sm font-semibold">Wallet</h3>
        <p className="mt-1 text-xs text-slate-400">
          Connect a wallet before claiming today’s ticket. Real Solana wiring
          comes next.
        </p>

        <div className="mt-3 flex flex-col gap-2">
          {walletConnected && walletAddress ? (
            <p className="text-xs text-emerald-200">
              Wallet connected:{' '}
              <span className="font-mono text-emerald-300">
                {walletAddress}
              </span>
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              No wallet connected yet.
            </p>
          )}

          <button
            type="button"
            onClick={handleMockConnectWallet}
            className="mt-1 inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-white"
          >
            {walletConnected ? 'Change wallet (preview)' : 'Connect wallet (preview)'}
          </button>

          <p className="mt-1 text-[11px] text-slate-500">
            This is a visual preview only. On-chain wallet + XPOT balance checks
            will be added next.
          </p>
        </div>
      </article>

      {/* TODAY'S RESULT (PREVIEW) */}
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
                In the real draw, this will show the winning ticket and X handle
                once the countdown reaches zero.
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-300">
            Your tickets are in the draw. The result will appear here when the
            timer hits zero.
          </p>
        )}
      </article>

      {/* YOUR TICKETS LIST */}
      <section className="pb-2 px-0">
        <h2 className="px-4 pt-3 text-sm font-semibold text-slate-200">
          Your tickets
        </h2>
        <p className="px-4 text-xs text-slate-500">
          Each ticket is tied to a specific daily draw and this X account.
        </p>

        <div className="mt-3 space-y-2 border-l border-slate-800/80 pl-3">
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
    </section>
  );
}
