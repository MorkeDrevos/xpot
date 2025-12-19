'use client';

import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Copy, Wallet, Clock } from 'lucide-react';

type VaultTx = { signature: string; blockTime: number | null; err: unknown | null };
type VaultEntry = {
  name: string;
  address: string;
  ata: string;
  balance: { amount: string; uiAmount: number; decimals: number } | null;
  recentTx: VaultTx[];
};

type VaultResponse = {
  ok: boolean;
  mint: string;
  fetchedAt: number;
  groups: Record<string, VaultEntry[]>;
};

function shortAddr(a: string) {
  if (!a) return a;
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

function fmtXp(ui: number | null) {
  if (ui == null || !Number.isFinite(ui)) return '—';
  return ui.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
}

export default function VaultsPanel({
  groupKey,
  title = 'Vaults (on-chain)',
  showTx = true,
}: {
  groupKey: string;
  title?: string;
  showTx?: boolean;
}) {
  const [data, setData] = useState<VaultResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        const res = await fetch('/api/vaults', { cache: 'no-store' });
        const json = (await res.json()) as VaultResponse;
        if (!alive) return;
        setData(json);
      } catch {
        if (!alive) return;
        setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    const t = window.setInterval(run, 30_000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);

  const vaults = useMemo(() => data?.groups?.[groupKey] ?? [], [data, groupKey]);

  return (
    <div className="mt-4 rounded-2xl border border-slate-900/70 bg-slate-950/45 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</p>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          {loading ? 'Updating…' : 'Live'}
        </div>
      </div>

      {vaults.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">{loading ? 'Loading…' : 'No vaults configured.'}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {vaults.map(v => (
            <div key={`${v.address}-${v.name}`} className="rounded-2xl border border-slate-900/70 bg-slate-950/55 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-100">{v.name}</p>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono">{shortAddr(v.address)}</span>

                    <button
                      type="button"
                      onClick={() => copyText(v.address)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-800/80 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-900 transition"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </button>

                    <a
                      href={`https://solscan.io/account/${v.address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-slate-800/80 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-900 transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Solscan
                    </a>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">XPOT balance</p>
                  <p className="mt-1 font-mono text-lg text-slate-100">
                    {v.balance ? fmtXp(v.balance.uiAmount) : '—'}
                  </p>
                </div>
              </div>

              {showTx ? (
                <div className="mt-3 border-t border-white/5 pt-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Recent transactions</p>

                  {v.recentTx?.length ? (
                    <div className="mt-2 space-y-1">
                      {v.recentTx.slice(0, 3).map(tx => (
                        <a
                          key={tx.signature}
                          href={`https://solscan.io/tx/${tx.signature}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-900/70 bg-slate-950/40 px-3 py-2 text-xs text-slate-300 hover:bg-slate-900/50 transition"
                        >
                          <span className="font-mono">{shortAddr(tx.signature)}</span>
                          <span className={tx.err ? 'text-rose-300' : 'text-emerald-300'}>
                            {tx.err ? 'Error' : 'OK'}
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">No recent transactions found.</p>
                  )}
                </div>
              ) : null}
            </div>
          ))}

          <p className="pt-1 text-[11px] text-slate-600">
            Balances update from chain. Explorer links are public and verifiable.
          </p>
        </div>
      )}
    </div>
  );
}
