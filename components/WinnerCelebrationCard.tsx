'use client';

import React, { useMemo } from 'react';
import { ExternalLink, Sparkles, Trophy } from 'lucide-react';
import XAccountIdentity from '@/components/XAccountIdentity';

type WinnerSpotlight = {
  handle: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  verified?: boolean | null;
  txUrl?: string | null;
  amountXpot?: number | null;
  kind?: 'MAIN' | 'BONUS' | null;

  // Optional - if you pass it from HomePageClient later, we'll show date-only (no time)
  drawDate?: string | null;
};

function normalizeHandle(h: string | null | undefined) {
  const s = String(h ?? '').trim();
  if (!s) return '@unknown';
  return s.startsWith('@') ? s : `@${s}`;
}

function xProfileUrl(handle: string | null | undefined) {
  const h = normalizeHandle(handle).replace(/^@/, '');
  return `https://x.com/${encodeURIComponent(h)}`;
}

function safeTimeMs(iso?: string | null) {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : 0;
}

// ✅ date-only (no time)
function formatDateOnly(iso?: string | null) {
  const ms = safeTimeMs(iso);
  if (!ms) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(ms));
}

function formatXp(amount?: number | null) {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
}

export default function WinnerCelebrationCard({
  winner,
  className = '',
}: {
  winner: WinnerSpotlight | null | undefined;
  className?: string;
}) {
  const hasWinner = Boolean(winner?.handle || winner?.txUrl || winner?.avatarUrl);

  // ✅ no "x" prefix - amount is just "1,000,000"
  const amount = formatXp(winner?.amountXpot ?? 1_000_000);

  const handleNorm = useMemo(() => normalizeHandle(winner?.handle), [winner?.handle]);
  const profileUrl = useMemo(() => xProfileUrl(winner?.handle), [winner?.handle]);

  // ✅ if you provide drawDate/claimedAt, we show "Claimed 3 Jan 2026" (no time)
  const claimedLabel = useMemo(
    () => (winner?.drawDate ? formatDateOnly(winner.drawDate) : ''),
    [winner?.drawDate],
  );

  return (
    <section
      className={[
        'relative overflow-hidden rounded-[28px]',
        'border border-white/10 bg-slate-950/25 ring-1 ring-white/[0.06]',
        'shadow-[0_40px_140px_rgba(0,0,0,0.55)]',
        className,
      ].join(' ')}
      aria-label="Latest winner"
    >
      {/* celebratory glow */}
      <div className="pointer-events-none absolute -inset-24 opacity-80 blur-3xl bg-[radial-gradient(circle_at_18%_18%,rgba(var(--xpot-gold),0.22),transparent_60%),radial-gradient(circle_at_86%_22%,rgba(56,189,248,0.12),transparent_55%),radial-gradient(circle_at_60%_90%,rgba(34,197,94,0.10),transparent_60%)]" />

      {/* subtle sweep line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.55),rgba(255,255,255,0.18),rgba(var(--xpot-gold),0.35),transparent)] opacity-80" />

      <div className="relative p-4 sm:p-5 lg:p-6">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <Trophy className="h-4.5 w-4.5 text-[rgb(var(--xpot-gold))]" />
            </span>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-400">LATEST WINNER</p>

              {/* ✅ remove "Verified on-chain" vibe - keep it clean */}
              <p className="mt-0.5 text-[12px] text-slate-300">Published with a real @handle</p>

              {/* ✅ optional claimed line, date-only */}
              {claimedLabel ? (
                <p className="mt-1 text-[11px] text-slate-400">
                  <span className="uppercase tracking-[0.22em] text-[10px] text-slate-500 mr-2">Claimed</span>
                  <span className="text-slate-300">{claimedLabel}</span>
                </p>
              ) : null}
            </div>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--xpot-gold),0.28)] bg-[rgba(var(--xpot-gold),0.10)] px-3 py-1.5 text-[12px] font-semibold text-[rgb(var(--xpot-gold))]">
            <Sparkles className="h-4 w-4" />
            {winner?.kind === 'BONUS' ? 'BONUS' : 'MAIN'}
          </span>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
          {/* identity */}
          <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="min-w-0 flex-1">
              <a href={profileUrl} target="_blank" rel="noreferrer" className="group block" title="Open X profile">
                <XAccountIdentity
                  name={winner?.name ?? null}
                  handle={winner?.handle ?? null}
                  avatarUrl={winner?.avatarUrl ?? null}
                  verified={Boolean(winner?.verified)}
                  subtitle={winner?.kind === 'BONUS' ? 'Bonus winner' : null}
                />

                {/* premium affordance */}
                <div className="mt-2 flex items-center gap-2 text-[12px] text-slate-400">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5">
                    Open profile
                    <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-slate-200" />
                  </span>
                  <span className="truncate text-slate-500">{handleNorm}</span>
                </div>
              </a>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {winner?.txUrl ? (
                  <a
                    href={winner.txUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] text-slate-200 hover:bg-white/[0.05]"
                  >
                    TX
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[12px] text-slate-400">
                    TX
                  </span>
                )}

                {!hasWinner ? <span className="text-[12px] text-slate-400">Awaiting publish</span> : null}
              </div>
            </div>
          </div>

          {/* payout */}
          <div className="relative overflow-hidden rounded-2xl border border-[rgba(var(--xpot-gold),0.22)] bg-[rgba(var(--xpot-gold),0.08)] p-4 ring-1 ring-white/[0.06]">
            <div className="pointer-events-none absolute -inset-16 opacity-70 blur-2xl bg-[radial-gradient(circle_at_15%_20%,rgba(var(--xpot-gold),0.22),transparent_55%),radial-gradient(circle_at_80%_25%,rgba(255,255,255,0.10),transparent_60%)]" />

            {/* shine */}
            <div className="pointer-events-none absolute -inset-x-24 top-0 h-[140%] rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)] opacity-50 animate-[xpotSweep_5.5s_linear_infinite]" />

            <p className="relative text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-500">Payout</p>

            <div className="relative mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-white sm:text-[34px]">{amount}</span>
              <span className="text-[14px] font-semibold text-[rgb(var(--xpot-gold))]">XPOT</span>
            </div>

            {/* ✅ remove the "verified holder" language */}
            <p className="relative mt-2 text-[12px] leading-relaxed text-slate-300">
              Every day, one handle gets paid. No anonymous winners.
            </p>
          </div>
        </div>
      </div>

      {/* keyframes */}
      <style jsx>{`
        @keyframes xpotSweep {
          0% {
            transform: translateX(-30%) rotate(12deg);
          }
          100% {
            transform: translateX(30%) rotate(12deg);
          }
        }
      `}</style>
    </section>
  );
}
