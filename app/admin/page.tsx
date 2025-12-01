// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type DrawStatus = 'scheduled' | 'open' | 'closed' | 'paid';

type AdminDraw = {
  id: string;
  drawDate: string; // ISO
  jackpotUsd: number;
  status: DrawStatus;
  rolloverFromPrev: boolean;
  rolloverToNext: boolean;
  ticketsCount: number;
  winnerTicketCode?: string | null;
  winnerWallet?: string | null;
  claimDeadline?: string | null;
};

type AdminTicket = {
  id: string;
  code: string;
  walletAddress: string;
  createdAt: string;
  status: 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';
};

type AdminWinner = {
  id: string;
  drawDate: string;
  ticketCode: string;
  walletAddress: string;
  jackpotUsd: number;
  claimed: boolean;
};

function shortWallet(addr: string) {
  if (!addr || addr.length < 8) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
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

function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString('de-DE');
}

export default function AdminPage() {
  const [draw, setDraw] = useState<AdminDraw | null>(null);
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [winners, setWinners] = useState<AdminWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAdminData() {
      setLoading(true);
      setError(null);
      try {
        // Adapt these endpoints to whatever you implement
        const [drawRes, ticketsRes, winnersRes] = await Promise.all([
          fetch('/api/admin/draw/today'),
          fetch('/api/admin/draw/today/tickets'),
          fetch('/api/admin/draw/recent-winners'),
        ]);

        if (!drawRes.ok) throw new Error('Failed to load today’s draw');
        if (!ticketsRes.ok) throw new Error('Failed to load tickets');
        if (!winnersRes.ok) throw new Error('Failed to load winners');

        const drawData = await drawRes.json();
        const ticketsData = await ticketsRes.json();
        const winnersData = await winnersRes.json();

        if (cancelled) return;

        setDraw(drawData.draw ?? null);
        setTickets(Array.isArray(ticketsData.tickets) ? ticketsData.tickets : []);
        setWinners(Array.isArray(winnersData.winners) ? winnersData.winners : []);
      } catch (err) {
        console.error('[ADMIN] Load error', err);
        if (!cancelled) {
          setError((err as Error).message ?? 'Failed to load admin data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAdminData();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePickWinner() {
    if (!draw) return;
    setActionBusy(true);
    setActionMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/draw/pick-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawId: draw.id }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? 'Failed to pick winner');
      }

      setActionMessage('Winner selected for this draw.');
      // Simple refresh – you can optimise later
      window.location.reload();
    } catch (err) {
      console.error('[ADMIN] Pick winner error', err);
      setError(
        (err as Error).message ?? 'Could not pick winner. Try again in a moment.'
      );
    } finally {
      setActionBusy(false);
    }
  }

  async function handleMarkPaid() {
    if (!draw) return;
    setActionBusy(true);
    setActionMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/draw/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawId: draw.id }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? 'Failed to mark jackpot as paid');
      }

      setActionMessage('Jackpot marked as paid.');
      window.location.reload();
    } catch (err) {
      console.error('[ADMIN] Mark paid error', err);
      setError(
        (err as Error).message ??
          'Could not mark jackpot as paid. Try again in a moment.'
      );
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-10 pt-6">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              XPOT admin
            </h1>
            <p className="text-xs text-slate-400">
              Internal control room for today’s draw, jackpot state and winners.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500 hover:bg-slate-900"
            >
              Back to user dashboard
            </Link>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            {error}
          </div>
        )}

        {actionMessage && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
            {actionMessage}
          </div>
        )}

        {/* Top row: draw + eligibility + wallet truth */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Today’s draw */}
          <section className="premium-card md:col-span-2 p-4">
            <h2 className="text-sm font-semibold text-slate-100">
              Today’s draw
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Snapshot of the current jackpot, rollover state and ticket pool.
            </p>

            {loading && !draw && (
              <p className="mt-3 text-xs text-slate-500">Loading…</p>
            )}

            {draw && (
              <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                      Draw date
                    </p>
                    <p className="text-sm text-slate-100">
                      {formatDate(draw.drawDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                      Today’s jackpot
                    </p>
                    <p className="text-sm text-emerald-300">
                      ${draw.jackpotUsd.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                      Status
                    </p>
                    <p className="text-sm capitalize text-slate-100">
                      {draw.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                      Tickets in pool
                    </p>
                    <p className="text-sm text-slate-100">
                      {draw.ticketsCount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 text-[11px] text-slate-400 sm:grid-cols-2">
                  <p>
                    ✅ Rollover in: {draw.rolloverFromPrev ? 'Yes' : 'No'} ·
                    Rollover out: {draw.rolloverToNext ? 'Yes' : 'No'}
                  </p>
                  {draw.winnerTicketCode ? (
                    <p>
                      🏆 Winner ticket:{' '}
                      <span className="font-mono text-emerald-300">
                        {draw.winnerTicketCode}
                      </span>{' '}
                      · Wallet:{' '}
                      <span className="font-mono">
                        {shortWallet(draw.winnerWallet ?? '')}
                      </span>
                    </p>
                  ) : (
                    <p>🏆 No winner selected yet.</p>
                  )}
                </div>

                {draw.claimDeadline && (
                  <p className="mt-2 text-[11px] text-slate-400">
                    Claim window ends:{' '}
                    <span className="font-mono">
                      {formatDateTime(draw.claimDeadline)}
                    </span>
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={actionBusy || !tickets.length}
                    onClick={handlePickWinner}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                      actionBusy || !tickets.length
                        ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                        : 'bg-emerald-500 text-black hover:bg-emerald-400'
                    }`}
                  >
                    Pick winner from pool
                  </button>
                  <button
                    type="button"
                    disabled={actionBusy || !draw.winnerTicketCode}
                    onClick={handleMarkPaid}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                      actionBusy || !draw.winnerTicketCode
                        ? 'cursor-not-allowed bg-slate-900 text-slate-600'
                        : 'border border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500'
                    }`}
                  >
                    Mark jackpot as paid
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Eligibility + wallet truth */}
          <section className="space-y-4">
            {/* Eligibility status card */}
            <div className="premium-card p-4">
              <h3 className="text-sm font-semibold text-slate-100">
                Today’s eligibility
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                What users see as the current entry rules.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-300">
                <li>Sign in with X.</li>
                <li>Connect a Solana wallet.</li>
                <li>
                  Hold the minimum XPOT balance at the moment they get today’s
                  ticket.
                </li>
                <li>Exactly one ticket per wallet per draw.</li>
              </ul>
            </div>

            {/* Wallet truth line */}
            <div className="premium-card p-4">
              <h3 className="text-sm font-semibold text-slate-100">
                Wallet truth line
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                What is actually true on-chain, regardless of UI:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-300">
                <li>XPOT.bet never takes custody of funds.</li>
                <li>Tickets are tied to wallet address and draw date.</li>
                <li>
                  Eligibility is checked at entry time, not during the draw.
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* Lower row: tickets + recent winners */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Tickets table */}
          <section className="premium-card md:col-span-2 p-4">
            <h2 className="text-sm font-semibold text-slate-100">
              Today’s tickets (admin view)
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Every ticket that has been issued for the current draw.
            </p>

            {loading && !tickets.length && (
              <p className="mt-3 text-xs text-slate-500">Loading…</p>
            )}

            {!loading && tickets.length === 0 && (
              <p className="mt-3 text-xs text-slate-500">
                No tickets yet for today’s draw.
              </p>
            )}

            {tickets.length > 0 && (
              <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-900">
                <table className="min-w-full text-left text-[11px]">
                  <thead className="bg-slate-950/80 text-slate-400">
                    <tr>
                      <th className="px-3 py-2 font-medium">Ticket</th>
                      <th className="px-3 py-2 font-medium">Wallet</th>
                      <th className="px-3 py-2 font-medium">Created</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 bg-slate-950/40">
                    {tickets.map(t => (
                      <tr key={t.id}>
                        <td className="px-3 py-2 font-mono text-slate-100">
                          {t.code}
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-300">
                          {shortWallet(t.walletAddress)}
                        </td>
                        <td className="px-3 py-2 text-slate-300">
                          {formatDateTime(t.createdAt)}
                        </td>
                        <td className="px-3 py-2 text-slate-300">
                          {t.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Recent winners */}
          <section className="premium-card p-4">
            <h2 className="text-sm font-semibold text-slate-100">
              Recent winners
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Internal log of the latest winning tickets and payout status.
            </p>

            {loading && !winners.length && (
              <p className="mt-3 text-xs text-slate-500">Loading…</p>
            )}

            {!loading && winners.length === 0 && (
              <p className="mt-3 text-xs text-slate-500">
                No completed draws yet. Once you pick winners and mark jackpots
                as paid, they’ll appear here.
              </p>
            )}

            <div className="mt-3 space-y-2">
              {winners.map(w => (
                <article
                  key={w.id}
                  className="rounded-2xl border border-slate-900 bg-slate-950/70 px-3 py-2 text-xs"
                >
                  <p className="font-mono text-slate-100">{w.ticketCode}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Draw: {formatDate(w.drawDate)} · Wallet:{' '}
                    <span className="font-mono">
                      {shortWallet(w.walletAddress)}
                    </span>
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Jackpot: ${w.jackpotUsd.toLocaleString()} ·{' '}
                    {w.claimed ? 'Claimed' : 'Not claimed / rolled over'}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
