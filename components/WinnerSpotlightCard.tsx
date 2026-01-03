// components/WinnerSpotlightCard.tsx
'use client';

import { useMemo, useState } from 'react';
import { BadgeCheck, Crown, ExternalLink, ShieldCheck } from 'lucide-react';

type WinnerRow = {
  id: string;
  handle: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  wallet: string | null;
  amountXpot?: number | null;
  amount?: number | null;
  drawDate: string | null;
  txUrl?: string | null;
  isPaidOut?: boolean;
  label?: string | null;
};

const XPOT_SIGN = '✕';

function normalizeHandle(h: string | null | undefined) {
  const s = String(h ?? '').trim();
  if (!s) return '@unknown';
  return s.startsWith('@') ? s : `@${s}`;
}

function toXProfileUrl(handle: string) {
  const h = normalizeHandle(handle).replace(/^@/, '');
  return `https://x.com/${encodeURIComponent(h)}`;
}

function shortenAddress(addr: string, left = 6, right = 6) {
  if (!addr) return '';
  if (addr.length <= left + right + 3) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
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
  size = 36,
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
      className="relative shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.03]"
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
      <div className="pointer-events-none absolute inset-0 ring-1 ring-white/[0.06]" />
    </div>
  );
}

export default function WinnerSpotlightCard({
  winner,
  className = '',
  compact = false,
}: {
  winner: WinnerRow | null;
  className?: string;
  compact?: boolean;
}) {
  const paid = Boolean(winner?.isPaidOut);

  const handle = winner?.handle ? normalizeHandle(winner.handle) : null;
  const displayName = winner?.name ? String(winner.name).trim() : '';
  const xUrl = handle ? toXProfileUrl(handle) : null;

  const label = winner
    ? handle ?? (winner.wallet ? shortenAddress(winner.wallet, 6, 6) : '@winner')
    : '@winner';

  const ymd = winner?.drawDate ? formatIsoToMadridYmd(winner.drawDate) : null;

  const amountResolved =
    typeof winner?.amountXpot === 'number'
      ? winner.amountXpot
      : typeof winner?.amount === 'number'
      ? winner.amount
      : 1_000_000;

  const payoutText = formatXpotAmount(amountResolved);

  const pad = compact ? 'px-4 py-3' : 'px-5 py-4';
  const avatarSize = compact ? 34 : 40;

  const shareText = winner
    ? `I just won today’s XPOT draw ${payoutText}. Proof on-chain. @XPOTbet`
    : `XPOT - one daily draw. @XPOTbet`;
  const shareIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  return (
    <div
      className={[
        'relative overflow-hidden rounded-[26px] border border-white/10 bg-slate-950/25 ring-1 ring-white/[0.05]',
        className,
      ].join(' ')}
    >
      <style jsx global>{`
        @keyframes xpotWinnerSheen {
          0% {
            transform: translateX(-60%) skewX(-14deg);
            opacity: 0;
          }
          18% {
            opacity: 0.18;
          }
          60% {
            opacity: 0.08;
          }
          100% {
            transform: translateX(60%) skewX(-14deg);
            opacity: 0;
          }
        }
        .xpot-winner-sheen {
          position: absolute;
          inset: -40px;
          pointer-events: none;
          background: linear-gradient(
            100deg,
            transparent 0%,
            rgba(255, 255, 255, 0.04) 32%,
            rgba(var(--xpot-gold), 0.10) 50%,
            rgba(56, 189, 248, 0.05) 68%,
            transparent 100%
          );
          mix-blend-mode: screen;
          opacity: 0;
          animation: xpotWinnerSheen 11.5s ease-in-out infinite;
        }
      `}</style>

      <div className="pointer-events-none absolute -inset-24 opacity-75 blur-3xl bg-[radial-gradient(circle_at_18%_20%,rgba(var(--xpot-gold),0.16),transparent_60%),radial-gradient(circle_at_82%_30%,rgba(56,189,248,0.10),transparent_62%)]" />
      <div className="xpot-winner-sheen" />

      <div className={`relative ${pad}`}>
        {/* header */}
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <Crown className="h-4 w-4 text-[rgb(var(--xpot-gold-2))]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200">
              Latest winner
            </span>
          </div>

          <div
            className={[
              'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em]',
              paid
                ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200'
                : 'border-amber-400/20 bg-amber-500/10 text-amber-200',
            ].join(' ')}
            title={paid ? 'Paid' : 'Awaiting payout'}
          >
            <span className={`h-2 w-2 rounded-full ${paid ? 'bg-emerald-400' : 'bg-amber-300'}`} />
            {paid ? 'Paid' : 'Awaiting payout'}
          </div>
        </div>

        {/* main row */}
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="flex items-center gap-3">
            <Avatar src={winner?.avatarUrl} label={label} size={avatarSize} />

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
                    >
                      <span className="truncate text-[14px] font-semibold text-slate-50">{label}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                    </a>
                  ) : (
                    <div className="truncate text-[14px] font-semibold text-slate-50">{label}</div>
                  )
                ) : (
                  <div className="truncate text-[14px] font-semibold text-slate-50">Syncing winner</div>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-slate-400">
                {displayName ? <span className="max-w-[240px] truncate text-slate-300">{displayName}</span> : null}
                {displayName && (ymd || winner?.wallet || winner?.label) ? (
                  <span className="text-slate-700">•</span>
                ) : null}
                {ymd ? <span className="font-mono">{ymd}</span> : null}

                {winner?.wallet ? (
                  <>
                    <span className="text-slate-700">•</span>
                    <span className="font-mono">{shortenAddress(winner.wallet, 7, 7)}</span>
                  </>
                ) : null}

                {winner?.label ? (
                  <>
                    <span className="text-slate-700">•</span>
                    <span className="text-slate-300">{winner.label}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:justify-center">
            <div className="text-right">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Payout
              </div>
              <div className="mt-1 font-mono text-[18px] text-[rgb(var(--xpot-gold-2))]">{payoutText}</div>
            </div>

            <div className="flex items-center gap-2">
              {winner?.txUrl ? (
                <a
                  href={winner.txUrl}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-slate-200 hover:bg-white/[0.06] transition"
                >
                  <ShieldCheck className="h-4 w-4 text-slate-300" />
                  Proof
                  <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                </a>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-slate-400">
                  <BadgeCheck className="h-4 w-4 text-slate-500" />
                  Proof after payout
                </div>
              )}

              {winner ? (
                <a
                  href={shareIntentUrl}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-slate-200 hover:bg-white/[0.06] transition"
                  title="Share on X"
                >
                  Share
                  <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        {!compact ? (
          <div className="mt-4 text-[12px] text-slate-400">
            Ops triggers payout - then the on-chain transaction is published here.
          </div>
        ) : null}
      </div>
    </div>
  );
}
