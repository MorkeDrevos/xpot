// app/mechanism/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, Cpu, ShieldCheck, Timer, Trophy, RefreshCcw, ExternalLink } from 'lucide-react';
import XpotPageShell from '@/components/XpotPageShell';

export const dynamic = 'force-dynamic';

type Live = {
  ok: boolean;
  draw: null | {
    id: string;
    drawDate: string;
    closesAt: string | null;
    status: 'OPEN' | 'LOCKED' | 'DRAWING' | 'COMPLETED';
    ticketsCount: number;
    jackpotXpot: number;
  };
  engine: {
    status: 'IDLE' | 'EXECUTING' | 'COMPLETED';
    algorithm: string;
    randomness: string;
    notes: string[];
  };
  lastMainWinner: null | {
    id: string;
    date: string;
    ticketCode: string;
    walletAddress: string;
    isPaidOut: boolean;
    txUrl: string | null;
  };
};

function fmt(dt: string) {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB');
}

function countdown(closesAtIso: string | null) {
  if (!closesAtIso) return null;
  const t = new Date(closesAtIso).getTime();
  if (!Number.isFinite(t)) return null;
  const diff = Math.max(0, Math.floor((t - Date.now()) / 1000));
  const hh = String(Math.floor(diff / 3600)).padStart(2, '0');
  const mm = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
  const ss = String(diff % 60).padStart(2, '0');
  return { diff, text: `${hh}:${mm}:${ss}` };
}

export default function MechanismPage() {
  const [data, setData] = useState<Live | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setErr(null);
      const res = await fetch('/api/mechanism/live', { cache: 'no-store' });
      const json = (await res.json()) as Live;
      if (!res.ok || !json?.ok) throw new Error((json as any)?.error || 'Failed to load');
      setData(json);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;

    load();
    const id = window.setInterval(() => {
      if (!alive) return;
      load();
    }, 2000);

    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const cd = useMemo(() => countdown(data?.draw?.closesAt ?? null), [data?.draw?.closesAt, data]);

  const engineTone =
    data?.engine?.status === 'EXECUTING'
      ? 'border-sky-400/60 bg-sky-500/10 text-sky-100'
      : data?.engine?.status === 'COMPLETED'
      ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200'
      : 'border-slate-700/70 bg-slate-900/60 text-slate-300';

  return (
    <XpotPageShell
      title="Mechanism"
      subtitle="Live transparency dashboard for how XPOT picks winners."
      topBarProps={{ pillText: 'TRANSPARENCY ENGINE', liveIsOpen: false }}
      pageTag="hub"
    >
      <section className="mt-6 space-y-6">
        <section className="xpot-panel px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${engineTone}`}>
                  <Cpu className="h-3.5 w-3.5" />
                  Engine {data?.engine?.status ?? 'IDLE'}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  <Activity className="h-3.5 w-3.5" />
                  Draw {data?.draw?.status ?? '—'}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Public
                </span>
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-100">What’s happening right now</p>
              <p className="mt-1 text-xs text-slate-400">
                This page reflects the live backend state. When the draw runner executes, the engine switches to EXECUTING.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" className="xpot-btn h-10 px-4 text-[12px]" onClick={load}>
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
              <Link href="/winners" className="xpot-btn h-10 px-4 text-[12px]">
                <Trophy className="h-4 w-4" />
                Winners
              </Link>
            </div>
          </div>

          <div className="mt-5 xpot-divider" />

          {loading ? (
            <div className="xpot-card px-4 py-4 text-sm text-slate-400">Loading…</div>
          ) : err ? (
            <div className="xpot-card px-4 py-4 text-sm text-amber-300">{err}</div>
          ) : !data?.draw ? (
            <div className="xpot-card px-4 py-4 text-sm text-slate-500">No draw detected for today yet.</div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <div className="xpot-card px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Eligible pool</p>
                <p className="mt-2 text-2xl font-mono text-slate-100">{data.draw.ticketsCount}</p>
                <p className="mt-1 text-xs text-slate-500">Tickets with status IN_DRAW (today’s draw)</p>
              </div>

              <div className="xpot-card px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Closes in</p>
                <p className="mt-2 text-2xl font-mono text-slate-100">{cd?.text ?? '—'}</p>
                <p className="mt-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <Timer className="h-4 w-4 text-slate-500" />
                    {data.draw.closesAt ? fmt(data.draw.closesAt) : 'No close time set'}
                  </span>
                </p>
              </div>

              <div className="xpot-card px-4 py-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Last MAIN winner</p>
                {data.lastMainWinner ? (
                  <>
                    <p className="mt-2 font-mono text-sm text-slate-100">{data.lastMainWinner.ticketCode}</p>
                    <p className="mt-1 text-xs text-slate-400">{data.lastMainWinner.walletAddress}</p>
                    <p className="mt-1 text-xs text-slate-500">{fmt(data.lastMainWinner.date)}</p>
                    {data.lastMainWinner.txUrl ? (
                      <a
                        className="mt-3 inline-flex items-center gap-2 text-xs text-emerald-300 hover:text-emerald-200"
                        href={data.lastMainWinner.txUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View TX
                      </a>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No winner yet.</p>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="xpot-card-primary" data-glow="purple">
          <div className="xpot-nebula-halo" />
          <div className="relative z-10 px-5 py-5 sm:px-6 sm:py-6">
            <p className="text-sm font-semibold text-slate-100">Algorithm (current)</p>
            <p className="mt-1 text-xs text-slate-400">
              {data?.engine?.algorithm ?? '—'}
            </p>

            <div className="mt-4 xpot-divider" />

            <p className="mt-4 text-xs text-slate-400">
              Randomness source: <span className="font-semibold text-slate-200">{data?.engine?.randomness ?? '—'}</span>
            </p>

            <ul className="mt-3 space-y-2 text-xs text-slate-400">
              {(data?.engine?.notes ?? []).map((n, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-600" />
                  <span>{n}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 text-[11px] text-slate-500">
              Next upgrade: publish a verifiable proof bundle (snapshot hash + picked index) per draw.
            </div>
          </div>
        </section>
      </section>
    </XpotPageShell>
  );
}
