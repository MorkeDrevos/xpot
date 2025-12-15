'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import XpotPageShell from '@/components/XpotPageShell';
import {
  Crown,
  Sparkles,
  Timer,
  Ticket,
  Zap,
} from 'lucide-react';

type LiveDraw = {
  jackpotXpot: number;
  jackpotUsd: number;
  closesAt: string;
  status: 'OPEN' | 'LOCKED' | 'DRAWING' | 'COMPLETED';
};

type BonusXPOT = {
  id: string;
  amountXpot: number;
  scheduledAt: string;
  status: 'UPCOMING' | 'CLAIMED';
};

export default function HubLivePage() {
  const [draw, setDraw] = useState<LiveDraw | null>(null);
  const [bonus, setBonus] = useState<BonusXPOT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const [d, b] = await Promise.all([
          fetch('/api/draw/live', { cache: 'no-store' }).then(r => r.json()),
          fetch('/api/bonus/live', { cache: 'no-store' }).then(r => r.json()),
        ]);

        if (!alive) return;
        setDraw(d.draw ?? null);
        setBonus(Array.isArray(b.bonus) ? b.bonus : []);
      } catch {
        if (!alive) return;
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    const t = setInterval(load, 15_000); // soft live refresh
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <XpotPageShell
      topBarProps={{
        pillText: 'XPOT LIVE',
        sloganRight: 'Real-time reward flow',
      }}
    >
      <section className="mt-6 space-y-6">
        {/* MAIN XPOT */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            relative overflow-hidden
            rounded-[36px] border border-slate-900/70
            bg-slate-950/60 px-6 py-6
            backdrop-blur-xl
          "
        >
          <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Main XPOT
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Today’s primary draw
                </p>
              </div>

              <StatusPill tone="emerald">
                <Sparkles className="h-3.5 w-3.5" />
                LIVE
              </StatusPill>
            </div>

            {loading || !draw ? (
              <p className="mt-6 text-sm text-slate-400">Loading live draw…</p>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-black/40 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    Jackpot
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-100">
                    {draw.jackpotXpot.toLocaleString()} XPOT
                  </p>
                  <p className="text-xs text-slate-400">
                    ≈ ${draw.jackpotUsd.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-black/40 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    Closes in
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-100">
                    <Timer className="h-4 w-4" />
                    {new Date(draw.closesAt).toLocaleTimeString()}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-black/40 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    Status
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-100">
                    {draw.status}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.section>

        {/* BONUS XPOTS */}
        <section className="rounded-[36px] border border-slate-900/70 bg-slate-950/60 px-6 py-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-100">
                Bonus XPOTs
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Extra reward drops today
              </p>
            </div>

            <Zap className="h-5 w-5 text-amber-300" />
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-400">Loading bonus XPOTs…</p>
            ) : bonus.length === 0 ? (
              <p className="text-sm text-slate-500">
                No bonus XPOTs scheduled.
              </p>
            ) : (
              bonus.map(b => (
                <div
                  key={b.id}
                  className="
                    flex items-center justify-between
                    rounded-2xl border border-slate-800 bg-black/40
                    px-4 py-3
                  "
                >
                  <div>
                    <p className="font-semibold text-slate-100">
                      {b.amountXpot.toLocaleString()} XPOT
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(b.scheduledAt).toLocaleTimeString()}
                    </p>
                  </div>

                  <StatusPill tone={b.status === 'CLAIMED' ? 'emerald' : 'amber'}>
                    {b.status === 'CLAIMED' ? (
                      <>
                        <Crown className="h-3.5 w-3.5" />
                        Claimed
                      </>
                    ) : (
                      <>
                        <Ticket className="h-3.5 w-3.5" />
                        Upcoming
                      </>
                    )}
                  </StatusPill>
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </XpotPageShell>
  );
}
