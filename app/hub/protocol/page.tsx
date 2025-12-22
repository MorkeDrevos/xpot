// app/hub/protocol/page.tsx
'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  ExternalLink,
  Info,
} from 'lucide-react';

import XpotPageShell from '@/components/XpotPageShell';

type LiveDraw = {
  jackpotXpot: number; // API field (keep)
  jackpotUsd: number; // API field (keep)
  closesAt: string; // ISO (keep)
  status: 'OPEN' | 'LOCKED' | 'DRAWING' | 'COMPLETED';
};

type BonusXPOT = {
  id: string;
  amountXpot: number;
  scheduledAt: string; // ISO
  status: 'UPCOMING' | 'CLAIMED';
};

type ProtocolState = {
  lpUsd?: number;
  lpChange24hPct?: number;
  liquiditySignal?: 'HEALTHY' | 'WATCH' | 'CRITICAL';
  priceUsd?: number;
  volume24hUsd?: number;
  updatedAt?: string; // ISO
  source?: 'dexscreener';
  pairUrl?: string;
  pairAddress?: string;
  chainId?: string;
  dexId?: string;
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

/* ─────────────────────────────────────────────
   Madrid cutoff (sync with homepage)
   Cutoff: 22:00 Europe/Madrid
───────────────────────────────────────────── */

function getMadridParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const get = (type: string, fallback = '0') => Number(parts.find(p => p.type === type)?.value ?? fallback);

  return {
    y: get('year', '0'),
    m: get('month', '1'),
    d: get('day', '1'),
    hh: get('hour', '0'),
    mm: get('minute', '0'),
    ss: get('second', '0'),
  };
}

function getMadridOffsetMs(now = new Date()) {
  const p = getMadridParts(now);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss);
  return asUtc - now.getTime();
}

function getNextMadridCutoffUtcMs(cutoffHour = 22, now = new Date()) {
  const p = getMadridParts(now);
  const offsetMs = getMadridOffsetMs(now);

  const mkUtcFromMadridWallClock = (yy: number, mm: number, dd: number, hh: number, mi: number, ss: number) => {
    const asUtc = Date.UTC(yy, mm - 1, dd, hh, mi, ss);
    return asUtc - offsetMs;
  };

  let targetUtc = mkUtcFromMadridWallClock(p.y, p.m, p.d, cutoffHour, 0, 0);

  if (now.getTime() >= targetUtc) {
    const base = new Date(Date.UTC(p.y, p.m - 1, p.d, 0, 0, 0));
    base.setUTCDate(base.getUTCDate() + 1);
    const yy = base.getUTCFullYear();
    const mm = base.getUTCMonth() + 1;
    const dd = base.getUTCDate();
    targetUtc = mkUtcFromMadridWallClock(yy, mm, dd, cutoffHour, 0, 0);
  }

  return targetUtc;
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

function isPairPending(p?: ProtocolState | null) {
  if (!p) return true;
  const hasAny =
    Number.isFinite(Number(p.priceUsd)) ||
    Number.isFinite(Number(p.lpUsd)) ||
    Number.isFinite(Number(p.volume24hUsd));
  return !hasAny;
}

function fmtTimeMadridFromUtcMs(utcMs: number) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(utcMs));
  } catch {
    return '22:00';
  }
}

export default function HubProtocolPage() {
  const [draw, setDraw] = useState<LiveDraw | null>(null);
  const [bonus, setBonus] = useState<BonusXPOT[]>([]);
  const [proto, setProto] = useState<ProtocolState | null>(null);

  const [loading, setLoading] = useState(true);
  const [protoLoading, setProtoLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [protoError, setProtoError] = useState<string | null>(null);

  // sync tick (matches homepage vibe better than 1s)
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Avoid state updates after unmount and avoid out-of-order responses
  const liveReqId = useRef(0);
  const protoReqId = useRef(0);

  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(t);
  }, []);

  // Live draw + bonus
  useEffect(() => {
    let alive = true;

    async function load() {
      const req = ++liveReqId.current;

      try {
        setError(null);

        const ac = new AbortController();
        const t = window.setTimeout(() => ac.abort(), 5500);

        const [dRes, bRes] = await Promise.all([
          fetch('/api/draw/live', { cache: 'no-store', signal: ac.signal }),
          fetch('/api/bonus/live', { cache: 'no-store', signal: ac.signal }),
        ]).finally(() => window.clearTimeout(t));

        const d = await dRes.json().catch(() => ({}));
        const b = await bRes.json().catch(() => ({}));

        if (!alive || req !== liveReqId.current) return;

        setDraw(d?.draw ?? null);
        setBonus(Array.isArray(b?.bonus) ? b.bonus : []);
      } catch {
        if (!alive) return;
        setError('Failed to load live data. Please refresh.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    const t = window.setInterval(load, 15_000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);

  // Protocol metrics
  useEffect(() => {
    let alive = true;

    async function loadProto() {
      const req = ++protoReqId.current;

      try {
        setProtoError(null);

        const ac = new AbortController();
        const t = window.setTimeout(() => ac.abort(), 5500);

        const res = await fetch('/api/protocol/state', {
          cache: 'no-store',
          signal: ac.signal,
        }).finally(() => window.clearTimeout(t));

        if (!alive || req !== protoReqId.current) return;

        if (!res.ok) {
          setProto(null);
          return;
        }

        const j = await res.json().catch(() => ({}));
        setProto((j?.state ?? j ?? null) as ProtocolState | null);
      } catch {
        if (!alive) return;
        setProtoError('Protocol metrics unavailable.');
        setProto(null);
      } finally {
        if (alive) setProtoLoading(false);
      }
    }

    loadProto();
    const t = window.setInterval(loadProto, 20_000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);

  const liveIsOpen = draw?.status === 'OPEN';

  // MAIN synced cutoff (same as homepage)
  const nextCutoffUtcMs = useMemo(() => getNextMadridCutoffUtcMs(22, new Date(nowMs)), [nowMs]);
  const closesIn = useMemo(() => formatCountdown(nextCutoffUtcMs - nowMs), [nextCutoffUtcMs, nowMs]);
  const closesAtMadrid = useMemo(() => fmtTimeMadridFromUtcMs(nextCutoffUtcMs), [nextCutoffUtcMs]);

  // Optional drift detector (if API closesAt doesn't match cutoff)
  const apiClosesAtMs = draw?.closesAt ? new Date(draw.closesAt).getTime() : null;
  const cutoffDriftMin = useMemo(() => {
    if (!apiClosesAtMs || !Number.isFinite(apiClosesAtMs)) return null;
    const diffMs = Math.abs(apiClosesAtMs - nextCutoffUtcMs);
    return Math.round(diffMs / 60000);
  }, [apiClosesAtMs, nextCutoffUtcMs]);

  const pendingPair = useMemo(() => isPairPending(proto), [proto]);

  const updatedLabel = useMemo(() => {
    if (!proto?.updatedAt) return 'Live';
    try {
      return `Updated ${new Date(proto.updatedAt).toLocaleTimeString()}`;
    } catch {
      return 'Live';
    }
  }, [proto?.updatedAt]);

  return (
    <XpotPageShell
      title="Protocol State"
      subtitle="Live protocol integrity, liquidity conditions, and execution signals."
      pageTag="hub"
      topBarProps={{ liveIsOpen }}
      headerClassName="bg-white/[0.015]"
    >
      <section className="mt-2 space-y-6">
        {/* TOP STRIP */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.02] px-6 py-6 backdrop-blur-xl"
        >
          <div className="pointer-events-none absolute -top-36 left-16 h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -top-40 right-0 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Integrity overview</p>
              <p className="mt-2 text-sm text-slate-200/90">
                A calm, real-time view of liquidity and execution - designed for trust, not hype.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <Info className="h-4 w-4 text-slate-300" />
                  Data: {protoLoading ? 'loading…' : proto?.source ? proto.source : 'unavailable'}
                </span>

                {proto?.pairUrl ? (
                  <Link
                    href={proto.pairUrl}
                    target="_blank"
                    className="inline-flex items-center gap-2 text-slate-200/80 hover:text-slate-100 transition"
                  >
                    View pair <ExternalLink className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="text-slate-500">Pair link not available yet</span>
                )}
              </div>
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
                {updatedLabel}
              </StatusPill>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="LP (USD)"
              value={protoLoading ? 'Loading…' : fmtUsd(proto?.lpUsd)}
              hint={protoLoading ? '' : pendingPair ? 'Pending first LP' : 'Total liquidity value'}
              icon={<Waves className="h-4 w-4 text-sky-300" />}
            />
            <MetricCard
              label="LP change (24h)"
              value={protoLoading ? 'Loading…' : fmtPct(proto?.lpChange24hPct)}
              hint={protoLoading ? '' : 'History module lands next'}
              icon={<ChartNoAxesCombined className="h-4 w-4 text-fuchsia-300" />}
            />
            <MetricCard
              label="Price (USD)"
              value={protoLoading ? 'Loading…' : proto?.priceUsd ? `$${proto.priceUsd.toFixed(6)}` : '—'}
              hint={protoLoading ? '' : pendingPair ? 'Pending market' : 'Reference price'}
              icon={<Activity className="h-4 w-4 text-emerald-300" />}
            />
            <MetricCard
              label="Volume (24h)"
              value={protoLoading ? 'Loading…' : fmtUsd(proto?.volume24hUsd)}
              hint={protoLoading ? '' : pendingPair ? 'No trades yet' : 'Observed volume'}
              icon={<Zap className="h-4 w-4 text-amber-300" />}
            />
          </div>

          {protoError ? <p className="mt-4 text-sm text-amber-300">{protoError}</p> : null}

          {!protoLoading && pendingPair ? (
            <div className="mt-5 rounded-3xl border border-amber-400/15 bg-amber-500/[0.06] p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-amber-400/20 bg-white/[0.03]">
                  <Info className="h-5 w-5 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Market pending</p>
                  <p className="mt-1 text-sm text-slate-200/85">
                    XPOT is not trading yet or the first liquidity pool is not indexed publicly. This panel will auto-populate once an
                    LP exists.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Nothing to do here - it goes live automatically.</p>
                </div>
              </div>
            </div>
          ) : null}
        </motion.section>

        {/* MAIN XPOT */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.02] px-6 py-6 backdrop-blur-xl"
        >
          <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-100">Main reward</p>
                <p className="mt-1 text-xs text-slate-400">Today’s primary selection</p>
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
                  label="Main reward"
                  value={`${Number(draw.jackpotXpot ?? 0).toLocaleString()} XPOT`}
                  hint={`≈ ${fmtUsd(draw.jackpotUsd)}`}
                  icon={<Crown className="h-4 w-4 text-amber-300" />}
                />

                <MetricCard
                  label="Closes in"
                  value={closesIn}
                  hint={`Closes at ${closesAtMadrid} (Madrid 22:00 cutoff)`}
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

            {!loading && draw?.closesAt && cutoffDriftMin !== null && cutoffDriftMin >= 2 ? (
              <p className="mt-4 text-xs text-amber-200/90">
                Note: API close time differs from Madrid cutoff by ~{cutoffDriftMin} min. This page follows the Madrid 22:00 cutoff to
                stay synced with the homepage.
              </p>
            ) : null}
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
                    <p className="font-semibold text-slate-100">{Number(b.amountXpot ?? 0).toLocaleString()} XPOT</p>
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

        {/* LIVE MARKET PANELS */}
        <section className="grid gap-6 lg:grid-cols-2">
          <PremiumPanel title="Liquidity" subtitle="LP integrity and stability signals." icon={<Waves className="h-5 w-5 text-sky-300" />}>
            <div className="grid gap-3 sm:grid-cols-2">
              <SoftKpi label="Total LP" value={protoLoading ? 'Loading…' : fmtUsd(proto?.lpUsd)} />
              <SoftKpi label="24h change" value={protoLoading ? 'Loading…' : fmtPct(proto?.lpChange24hPct)} />
            </div>

            <div className="mt-5">
              <GraphPlaceholder
                title="LP trend (24h)"
                note="Placeholder only. Real trend needs server-side snapshots stored over time."
              />
            </div>
          </PremiumPanel>

          <PremiumPanel title="Market" subtitle="Reference price and volume behaviour." icon={<Activity className="h-5 w-5 text-emerald-300" />}>
            <div className="grid gap-3 sm:grid-cols-2">
              <SoftKpi label="Price" value={protoLoading ? 'Loading…' : proto?.priceUsd ? `$${proto.priceUsd.toFixed(6)}` : '—'} />
              <SoftKpi label="Volume (24h)" value={protoLoading ? 'Loading…' : fmtUsd(proto?.volume24hUsd)} />
            </div>

            <div className="mt-5">
              <GraphPlaceholder
                title="Price + volume"
                note="Placeholder only. Real sparklines require server-side sampling or a chart feed."
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
