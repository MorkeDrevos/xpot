'use client';

import { useEffect, useState } from 'react';

type AuditEntry = {
  id: string;
  date: string;
  ticketCode: string;
  wallet: string;
  jackpotUsd: number;
  txUrl?: string;
};

export default function AuditLogCard() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/draw/public-recent', {
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error('Failed to load audit log');
        }

        const data = await res.json();
        if (Array.isArray(data.winners)) {
          setEntries(data.winners);
        } else {
          setEntries([]);
        }
      } catch (err) {
        setError('Audit feed unavailable');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4">
      <h2 className="text-sm font-semibold text-slate-100">Public audit log</h2>
      <p className="mt-1 text-xs text-slate-400">
        Verifiable winners and payout history (on-chain proof).
      </p>

      {loading && (
        <p className="mt-3 text-xs text-slate-500">
          Loading audit log…
        </p>
      )}

      {error && (
        <p className="mt-3 text-xs text-amber-300">
          {error}
        </p>
      )}

      {!loading && !error && entries.length === 0 && (
        <p className="mt-3 text-xs text-slate-500">
          No winners recorded yet.
        </p>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="mt-3 space-y-2 text-[11px] text-slate-200">
          {entries.map((w) => (
            <div
              key={w.id}
              className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-xs">{w.ticketCode}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {w.wallet}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400">
                    {new Date(w.date).toLocaleDateString()}
                  </p>
                  <p className="mt-0.5 text-[10px] text-emerald-300">
                    ${w.jackpotUsd.toLocaleString()}
                  </p>
                </div>
              </div>

              {w.txUrl && (
                <a
                  href={w.txUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-[10px] text-sky-400 hover:text-sky-300"
                >
                  View transaction
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
