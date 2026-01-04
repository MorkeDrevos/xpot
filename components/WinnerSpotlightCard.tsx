// components/WinnerSpotlightCard.tsx
'use client';

import { useMemo, useState } from 'react';
import { BadgeCheck, Crown, ExternalLink, ShieldCheck, Sparkles, Megaphone } from 'lucide-react';

export type WinnerRow = {
  id: string;
  handle: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  wallet: string | null; // kept for compatibility, but NEVER displayed
  amountXpot?: number | null;
  amount?: number | null;
  drawDate: string | null;
  txUrl?: string | null;
  isPaidOut?: boolean; // ignored for UI - keep for backwards compatibility
  label?: string | null; // kept for compatibility, but NEVER displayed
};

const XPOT_SIGN = '✕';

function normalizeHandle(h: string | null | undefined) {
  const s = String(h ?? '').trim();
  if (!s) return '@winner';
  return s.startsWith('@') ? s : `@${s}`;
}

function toXProfileUrl(handle: string) {
  const h = normalizeHandle(handle).replace(/^@/, '');
  return `https://x.com/${encodeURIComponent(h)}`;
}

function formatIsoToMadridYmd(iso: string) {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function formatXpotAmount(amount: number | null | undefined) {
  const n = typeof amount === 'number' && Number.isFinite(amount) ? amount : 1_000_000;
  return `${XPOT_SIGN}${n.toLocaleString()}`;
}

function Avatar({
  src,
  label,
  size = 42,
}: {
  src?: string | null;
  label: string;
  size?: number;
}) {
  const handle = useMemo(() => normalizeHandle(label).replace(/^@/, '').trim(), [label]);

  const resolvedSrc = useMemo(() => {
    if (src) return src;
    if (!handle) return null;
    const cacheKey = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
    return `https://unavatar.io/twitter/${encodeURIComponent(handle)}?cache=${cacheKey}`;
  }, [src, handle]);

  const [failed, setFailed] = useState(false);

  const initials = useMemo(() => {
    const s = handle || '';
    if (!s) return 'X';
    return s.slice(0, 2).toUpperCase();
  }, [handle]);

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full border border-white/12 bg-white/[0.04]"
      style={{ width: size, height: size }}
      title={normalizeHandle(label)}
    >
      {resolvedSrc && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedSrc}
          alt={normalizeHandle(label)}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-mono text-[12px] text-slate-200">
          {initials}
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 ring-1 ring-white/[0.10]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.14),transparent_58%)]" />
      <div className="pointer-events-none absolute -inset-8 opacity-40 blur-2xl bg-[radial-gradient(circle_at_60%_30%,rgba(var(--xpot-gold),0.18),transparent_68%)]" />
    </div>
  );
}

function Pill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'emerald' | 'gold';
}) {
  const cls =
    tone === 'emerald'
      ? 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100/90'
      : tone === 'gold'
      ? 'border-[rgba(var(--xpot-gold),0.28)] bg-[rgba(var(--xpot-gold),0.10)] text-[rgb(var(--xpot-gold-2))]'
      : 'border-white/10 bg-white/[0.03] text-slate-200/90';

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em]',
        cls,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

function buildPromoShareText(prizeText: string, hasWinner: boolean) {
  if (hasWinner) return `XPOT just paid out ${prizeText}. One daily draw. Enter today. @XPOTbet`;
  return `XPOT - one daily draw. Enter today. @XPOTbet`;
}

export default function WinnerSpotlightCard({
  winner,
  className = '',
  compact = false,
  embedded = false,
}: {
  winner: WinnerRow | null;
  className?: string;
  compact?: boolean;
  embedded?: boolean;
}) {
  const handle = winner?.handle ? normalizeHandle(winner.handle) : null;
  const displayName = winner?.name ? String(winner.name).trim() : '';
  const xUrl = handle ? toXProfileUrl(handle) : null;

  // XPOT rule: ONLY X identity details - never show wallet or internal label
  const label = winner ? handle ?? '@winner' : '@winner';

  const ymd = winner?.drawDate ? formatIsoToMadridYmd(winner.drawDate) : null;

  const amountResolved =
    typeof winner?.amountXpot === 'number'
      ? winner.amountXpot
      : typeof winner?.amount === 'number'
      ? winner.amount
      : 1_000_000;

  const prizeText = formatXpotAmount(amountResolved);
  const hasProof = Boolean(winner?.txUrl);
  const hasWinner = Boolean(winner);

  const pad = compact ? 'px-4 py-3' : 'px-5 py-4';
  const avatarSize = compact ? 34 : 42;

  // Promotional share for anyone
  const shareText = buildPromoShareText(prizeText, hasWinner);
  const shareIntentUrl = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}`;

  const Outer = embedded ? 'div' : 'section';
  const outerClass = embedded
    ? ['relative', className].join(' ')
    : [
        'relative overflow-hidden rounded-[32px]',
        'border border-white/10 bg-slate-950/25 ring-1 ring-white/[0.06]',
        'shadow-[0_40px_160px_rgba(0,0,0,0.70)]',
        className,
      ].join(' ');

  return (
    <Outer className={outerClass}>
      <style jsx global>{`
        @keyframes xpotWinnerSheen {
          0% {
            transform: translateX(-65%) skewX(-14deg);
            opacity: 0;
          }
          16% {
            opacity: 0.16;
          }
          55% {
            opacity: 0.10;
          }
          100% {
            transform: translateX(65%) skewX(-14deg);
            opacity: 0;
          }
        }
        .xpot-winner-sheen {
          position: absolute;
          inset: -120px;
          pointer-events: none;
          background: linear-gradient(
            100deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 30%,
            rgba(var(--xpot-gold), 0.18) 50%,
            rgba(56, 189, 248, 0.10) 70%,
            transparent 100%
          );
          mix-blend-mode: screen;
          opacity: 0;
          animation: xpotWinnerSheen 12.5s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .xpot-winner-sheen {
            animation: none !important;
          }
        }
      `}</style>

      {!embedded ? (
        <>
          <div className="pointer-events-none absolute -inset-28 opacity-85 blur-3xl bg-[radial-gradient(circle_at_14%_20%,rgba(var(--xpot-gold),0.20),transparent_62%),radial-gradient(circle_at_85%_28%,rgba(56,189,248,0.12),transparent_64%),radial-gradient(circle_at_50%_92%,rgba(16,185,129,0.10),transparent_62%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.22)_1px,transparent_0)] [background-size:18px_18px]" />
          <div className="xpot-winner-sheen" />
        </>
      ) : null}

      <div className={`relative ${pad}`}>
        {/* top gradient rule (console vibe) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(var(--xpot-gold),0.75),rgba(56,189,248,0.55),transparent)] opacity-70" />

        {/* header */}
        <div className="flex items-center justify-between gap-3">
          <Pill>
            <Crown className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
            Latest winner
          </Pill>

          <Pill tone={hasProof ? 'emerald' : 'neutral'}>
            <span className={`h-2 w-2 rounded-full ${hasProof ? 'bg-emerald-400' : 'bg-slate-400'}`} />
            {hasProof ? 'On-chain proof' : 'Winner published'}
          </Pill>
        </div>

        {/* main */}
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar src={winner?.avatarUrl} label={label} size={avatarSize} />
              <div className="pointer-events-none absolute -inset-1 rounded-full ring-1 ring-white/[0.06]" />
            </div>

            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                {winner ? (
                  xUrl ? (
                    <a
                      href={xUrl}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="inline-flex min-w-0 items-center gap-2 hover:opacity-95"
                      title={`Open ${label} on X`}
                      aria-label={`Open ${label} on X`}
                    >
                      <span className="truncate text-[14px] font-semibold text-slate-50">{label}</span>
                      {displayName ? (
                        <span className="truncate text-[13px] text-slate-400">- {displayName}</span>
                      ) : null}
                      <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                    </a>
                  ) : (
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-semibold text-slate-50">{label}</div>
                      {displayName ? (
                        <div className="truncate text-[13px] text-slate-400">{displayName}</div>
                      ) : null}
                    </div>
                  )
                ) : (
                  <div className="truncate text-[14px] font-semibold text-slate-50">Winner syncing</div>
                )}

                {winner?.handle ? (
                  <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-200/90">
                    <Sparkles className="h-3.5 w-3.5 text-[rgb(var(--xpot-gold-2))]" />
                    Spotlight
                  </span>
                ) : null}
              </div>

              {/* XP-only metadata (no wallet, no label) */}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-slate-400">
                {ymd ? <span className="font-mono">{ymd}</span> : null}
              </div>
            </div>
          </div>

          {/* right column */}
          <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:justify-center">
            <div className="text-right">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Prize</div>
              <div className="mt-1 font-mono text-[19px] text-[rgb(var(--xpot-gold-2))] drop-shadow-[0_0_18px_rgba(245,199,95,0.25)]">
                {prizeText}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {winner?.txUrl ? (
                <a
                  href={winner.txUrl}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-[11px] text-slate-200 hover:bg-white/[0.06] transition"
                  aria-label="Open on-chain proof"
                  title="Open on-chain proof"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-200/90" />
                  Proof
                  <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                </a>
              ) : (
                <div
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-slate-400"
                  title="Proof will appear here when available"
                >
                  <BadgeCheck className="h-4 w-4 text-slate-500" />
                  Proof pending
                </div>
              )}

              {/* Promotional share for ANYONE */}
              <a
                href={shareIntentUrl}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-[11px] text-slate-200 hover:bg-white/[0.06] transition"
                title="Post about XPOT on X"
                aria-label="Post about XPOT on X"
              >
                <Megaphone className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
                Post on X
                <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
              </a>
            </div>
          </div>
        </div>

        {/* Removed: "Winner and proof are published here." (not premium, redundant) */}
      </div>
    </Outer>
  );
}
