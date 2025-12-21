// app/hub/protocol/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ChartNoAxesCombined,
  Crown,
  ShieldCheck,
  Sparkles,
  Timer,
  Ticket,
  Waves,
  Zap,
} from 'lucide-react';

import XpotPageShell from '@/components/XpotPageShell';

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

type ProtocolState = {
  // Optional - only if you build /api/protocol/state later
  lpUsd?: number; // total LP in USD
  lpChange24hPct?: number; // +/- %
  liquiditySignal?: 'HEALTHY' | 'WATCH' | 'CRITICAL';
  priceUsd?: number;
  volume24hUsd?: number;
  updatedAt?: string; // ISO
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

function fmtUsd(n?: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function fmtPct(n?: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

function toneFromSignal(sig?: ProtocolState['liquiditySignal']): PillTone {
  if (sig === 'HEALTHY') return 'emerald';
  if (sig === 'WATCH') return 'amber';
  if (sig === 'CRITICAL') return 'slate';
  return 'sky';
}

function labelFromSignal(sig?: ProtocolState['liquiditySignal']) {
  if (sig === 'HEALTHY') return 'Healthy';
  if (sig === 'WATCH') return 'Watch';
  if (sig === 'CRITICAL') return 'Critical';
  return 'Unknown';
}

export default function HubProtocolPage() {
  const [draw, setDraw] = useState<LiveDraw | null>(null);
  const [bonus, setBonus] = useState<BonusXPOT[]>([]);
  const [proto, setProto] = useState<ProtocolState | null>(null);

  const [loading, setLoading] = useState(true);
  const [protoLoading, setProtoLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [protoError, setProtoError] = useState<string | null>(null);

  // local timer tick for countdown
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Live draw + bonus (existing endpoints)
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
    const t = setInterval(load, 15_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  // Protocol metrics (optional endpoint - safe fallback)
  useEffect(() => {
    let alive = true;

    async function loadProto() {
      try {
        setProtoError(null);

        const res = await fetch('/api/protocol/state', { cache: 'no-store' });
        if (!res.ok) {
          // endpoint not implemented yet -> treat as "unavailable", not an error state
          if (!alive) return;
          setProto(null);
          return;
        }

        const j = await res.json().catch(() => ({}));
        if (!alive) return;

        setProto(j?.state ?? j ?? null);
      } catch (e) {
        if (!alive) return;
        setProtoError('Protocol metrics unavailable.');
        setProto(null);
      } finally {
        if (alive) setProtoLoading(false);
      }
    }

    loadProto();
    const t = setInterval(loadProto, 20_000);
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
      title="Protocol State"
      subtitle="Live protocol integrity, liquidity conditions, and execution signals."
      pageTag="hub"
      topBarProps={{ liveIsOpen }}
      headerClassName="bg-white/[0.015]"
    >
      <section className="mt-2 space-y-6">
        {/* TOP STRIP: Integrity overview */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.02] px-6 py-6 backdrop-blur-xl"
        >
          <div className="pointer-events-none absolute -top-36 left-16 h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -top-40 right-0 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Integrity overview
              </p>
              <p className="mt-2 text-sm text-slate-200/90">
                A calm, real-time view of liquidity and execution - designed for trust, not hype.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={liveIsOpen ? 'emerald' : 'slate'}>
                <Sparkles className="h-3.5 w-3.5" />
                {liveIsOpen ? 'Live entries' : 'Standby'}
              </StatusPill>

              <StatusPill tone={toneFromSignal(proto?.liquiditySignal)}>
                <ShieldCheck className="h-3.5 w-3.5" />
                Liquidity: {labelFromSignal(proto?.liquiditySignal)}
              </StatusPill>

              <StatusPill tone="sky">
                <Activity className="h-3.5 w-3.5" />
                {proto?.updatedAt ? `Updated ${new Date(proto.updatedAt).toLocaleTimeString()}` : 'Live'}
              </StatusPill>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="LP (USD)"
              value={protoLoading ? 'Loading…' : fmtUsd(proto?.lpUsd)}
              hint={protoLoading ? '' : proto ? 'Total liquidity value' : 'Unavailable'}
              icon={<Waves className="h-4 w-4 text-sky-300" />}
            />
            <MetricCard
              label="LP change (24h)"
              value={protoLoading ? 'Loading…' : fmtPct(proto?.lpChange24hPct)}
              hint={protoLoading ? '' : proto ? 'Stability signal' : 'Unavailable'}
              icon={<ChartNoAxesCombined className="h-4 w-4 text-fuchsia-300" />}
            />
            <MetricCard
              label="Price (USD)"
              value={protoLoading ? 'Loading…' : proto?.priceUsd ? `$${proto.priceUsd.toFixed(6)}` : '—'}
              hint={protoLoading ? '' : proto ? 'Reference price' : 'Unavailable'}
              icon={<Activity className="h-4 w-4 text-emerald-300" />}
            />
            <MetricCard
              label="Volume (24h)"
              value={protoLoading ? 'Loading…' : fmtUsd(proto?.volume24hUsd)}
              hint={protoLoading ? '' : proto ? 'Observed volume' : 'Unavailable'}
              icon={<Zap className="h-4 w-4 text-amber-300" />}
            />
          </div>

          {protoError ? <p className="mt-4 text-sm text-amber-300">{protoError}</p> : null}
        </motion.section>

        {/* MAIN XPOT (reuse logic, more premium + less boxy) */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.02] px-6 py-6 backdrop-blur-xl"
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
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <MetricCard
                  label="Jackpot"
                  value={`${Number(draw.jackpotXpot ?? 0).toLocaleString()} XPOT`}
                  hint={`≈ ${fmtUsd(draw.jackpotUsd)}`}
                  icon={<Crown className="h-4 w-4 text-amber-300" />}
                />
                <MetricCard
                  label="Closes in"
                  value={closesIn}
                  hint={`Closes at ${new Date(draw.closesAt).toLocaleTimeString()}`}
                  icon={<Timer className="h-4 w-4 text-sky-300" />}
                />
                <MetricCard
                  label="Status"
                  value={draw.status}
                  hint={
                    draw.status === 'OPEN'
                      ? 'Entries are active'
                      : draw.status === 'LOCKED'
                      ? 'Entry window closed'
                      : draw.status === 'DRAWING'
                      ? 'Picking winner'
                      : 'Completed'
                  }
                  icon={<Sparkles className="h-4 w-4 text-emerald-300" />}
                />
              </div>
            )}
          </div>
        </motion.section>

        {/* BONUS XPOTS */}
        <section className="rounded-[36px] border border-white/10 bg-white/[0.02] px-6 py-6 backdrop-blur-xl">
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
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-100">
                      {Number(b.amountXpot ?? 0).toLocaleString()} XPOT
                    </p>
                    <p className="text-xs text-slate-400">{new Date(b.scheduledAt).toLocaleTimeString()}</p>
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

        {/* LIVE MARKET PANELS (placeholder graphs - safe, premium, wide) */}
        <section className="grid gap-6 lg:grid-cols-2">
          <PremiumPanel
            title="Liquidity"
            subtitle="LP integrity and stability signals."
            icon={<Waves className="h-5 w-5 text-sky-300" />}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <SoftKpi label="Total LP" value={protoLoading ? 'Loading…' : fmtUsd(proto?.lpUsd)} />
              <SoftKpi label="24h change" value={protoLoading ? 'Loading…' : fmtPct(proto?.lpChange24hPct)} />
            </div>

            <div className="mt-5">
              <GraphPlaceholder
                title="LP trend (24h)"
                note="Live graph module lands next. Data will be derived from on-chain liquidity snapshots."
              />
            </div>
          </PremiumPanel>

          <PremiumPanel
            title="Market"
            subtitle="Reference price and volume behaviour."
            icon={<Activity className="h-5 w-5 text-emerald-300" />}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <SoftKpi
                label="Price"
                value={protoLoading ? 'Loading…' : proto?.priceUsd ? `$${proto.priceUsd.toFixed(6)}` : '—'}
              />
              <SoftKpi label="Volume (24h)" value={protoLoading ? 'Loading…' : fmtUsd(proto?.volume24hUsd)} />
            </div>

            <div className="mt-5">
              <GraphPlaceholder
                title="Price + volume"
                note="We will render a premium sparkline and 24h band once sampling is wired."
              />
            </div>
          </PremiumPanel>
        </section>
      </section>
    </XpotPageShell>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
        {icon ? (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-lg font-semibold text-slate-100">{value}</p>
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function PremiumPanel({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.02] px-6 py-6 backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-28 right-0 h-[420px] w-[420px] rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-0 h-[420px] w-[420px] rounded-full bg-fuchsia-500/10 blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-100">{title}</p>
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          </div>
          {icon ? (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
              {icon}
            </span>
          ) : null}
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function SoftKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function GraphPlaceholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-200">{title}</p>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
          <ChartNoAxesCombined className="h-3.5 w-3.5 text-slate-200" />
          Module
        </span>
      </div>

      <div className="mt-3 h-[160px] w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
        <div className="h-full w-full opacity-70 [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:22px_22px]" />
      </div>

      <p className="mt-3 text-xs text-slate-400">{note}</p>
    </div>
  );
}
