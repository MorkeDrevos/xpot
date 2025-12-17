'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import XpotPageShell from '@/components/XpotPageShell';
import { Crown, Sparkles, Timer, Ticket, Zap } from 'lucide-react';

type LiveDraw = {
  jackpotXpot: number;
  jackpotUsd: number;
  closesAt: string; // ISO
  status: 'OPEN' | 'LOCKED' | 'DRAWING' | 'COMPLETED';
};

type BonusXPOT = {
  id: string;
  amountXpot: number;
  scheduledAt: string; // ISO
  status: 'UPCOMING' | 'CLAIMED';
};

type PillTone = 'slate' | 'emerald' | 'amber' | 'sky';

function StatusPill({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: PillTone;
}) {
  const cls =
    tone === 'emerald'
      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20'
      : tone === 'amber'
      ? 'bg-amber-500/10 text-amber-300 border-amber-400/20'
      : tone === 'sky'
      ? 'bg-sky-500/10 text-sky-300 border-sky-400/20'
      : 'bg-slate-800/60 text-slate-200 border-white/10';

  return (
    <span
      className={`
        inline-flex items-center gap-2
        rounded-full border px-3 py-1
        text-[10px] font-semibold uppercase tracking-[0.18em]
        ${cls}
      `}
    >
      {children}
    </span>
  );
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatCountdown(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return '00:00:00';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

export default function HubLivePage() {
  const [draw, setDraw] = useState<LiveDraw | null>(null);
  const [bonus, setBonus] = useState<BonusXPOT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // local timer tick for countdown
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setError(null);

        const [dRes, bRes] = await Promise.all([
          fetch('/api/draw/live', { cache: 'no-store' }),
          fetch('/api/bonus/live', { cache: 'no-store' }),
        ]);

        const d = await dRes.json().catch(() => ({}));
        const b = await bRes.json().catch(() => ({}));

        if (!alive) return;

        setDraw(d?.draw ?? null);
        setBonus(Array.isArray(b?.bonus) ? b.bonus : []);
      } catch (e) {
        if (!alive) return;
        setError('Failed to load live data. Please refresh.');
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

  const liveIsOpen = draw?.status === 'OPEN';

  const closesIn = useMemo(() => {
    if (!draw?.closesAt) return '00:00:00';
    const target = new Date(draw.closesAt).getTime();
    return formatCountdown(target - now);
  }, [draw?.closesAt, now]);

  return (
    <XpotPageShell
      topBarProps={{
        liveIsOpen,
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
          <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-100">Main XPOT</p>
                <p className="mt-1 text-xs text-slate-400">Today’s primary draw</p>
              </div>

              <StatusPill tone={liveIsOpen ? 'emerald' : 'slate'}>
                <Sparkles className="h-3.5 w-3.5" />
                {liveIsOpen ? 'LIVE' : 'STANDBY'}
              </StatusPill>
            </div>

            {error ? (
              <p className="mt-6 text-sm text-amber-300">{error}</p>
            ) : loading || !draw ? (
              <p className="mt-6 text-sm text-slate-400">Loading live draw…</p>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-black/40 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    Jackpot
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-100">
                    {Number(draw.jackpotXpot ?? 0).toLocaleString()} XPOT
                  </p>
                  <p className="text-xs text-slate-400">
                    ≈ ${Number(draw.jackpotUsd ?? 0).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-black/40 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    Closes in
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-100">
                    <Timer className="h-4 w-4" />
                    {closesIn}
                  </p>
                  <p className="text-xs text-slate-500">
                    Closes at {new Date(draw.closesAt).toLocaleTimeString()}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-black/40 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    Status
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-100">{draw.status}</p>
                  <p className="text-xs text-slate-500">
                    {draw.status === 'OPEN'
                      ? 'Entries are active'
                      : draw.status === 'LOCKED'
                      ? 'Entry window closed'
                      : draw.status === 'DRAWING'
                      ? 'Picking winner'
                      : 'Completed'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.section>

        {/* BONUS XPOTS */}
        <section className="rounded-[36px] border border-slate-900/70 bg-slate-950/60 px-6 py-6 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-100">Bonus XPOTs</p>
              <p className="mt-1 text-xs text-slate-400">Extra reward drops today</p>
            </div>

            <Zap className="h-5 w-5 text-amber-300" />
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-400">Loading bonus XPOTs…</p>
            ) : bonus.length === 0 ? (
              <p className="text-sm text-slate-500">No bonus XPOTs scheduled.</p>
            ) : (
              bonus.map(b => (
                <div
                  key={b.id}
                  className="
                    flex items-center justify-between gap-4
                    rounded-2xl border border-slate-800 bg-black/40
                    px-4 py-3
                  "
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-100">
                      {Number(b.amountXpot ?? 0).toLocaleString()} XPOT
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
