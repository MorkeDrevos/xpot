'use client';

export function PriceUnavailableNote({
  compact,
  mode = 'pending-pair',
}: {
  compact?: boolean;
  mode?: 'feed-error' | 'pending-pair';
}) {
  const title = mode === 'feed-error' ? 'PRICE FEED UNAVAILABLE' : 'TOKEN NOT TRADABLE YET';
  const body = 'Price feed is temporarily unavailable. We will retry automatically.';
  const secondary =
    mode === 'feed-error'
      ? 'If this persists, DexScreener may be rate limiting. Refresh later.'
      : 'XPOT is not trading yet. Liquidity has not been deployed, so no market price exists.';

  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] shadow-[0_10px_30px_rgba(0,0,0,0.25)]',
        compact ? 'px-3 py-2' : 'px-4 py-3',
      ].join(' ')}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(circle_at_18%_30%, rgba(245,158,11,0.12), transparent 60%), radial-gradient(circle_at_82%_20%, rgba(251,191,36,0.08), transparent 62%)',
        }}
      />

      <p className="relative text-[11px] uppercase tracking-[0.22em] text-amber-300 font-semibold">{title}</p>
      <p className="relative mt-2 text-[12px] text-amber-100/80">{body}</p>
      <p className="mt-1 text-[11px] italic text-slate-300/60">{secondary}</p>
    </div>
  );
}
