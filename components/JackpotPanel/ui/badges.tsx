// components/JackpotPanel/ui/badges.tsx
'use client';

export function RunwayBadge({ label, tooltip }: { label: string; tooltip?: string }) {
  return (
    <div className="group relative inline-flex items-center justify-center">
      <span
        className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-100 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        title={tooltip || label}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.35)]" />
        {label}
      </span>
    </div>
  );
}

export function UsdEstimateBadge({ compact }: { compact?: boolean }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] font-semibold uppercase tracking-[0.18em] text-slate-200',
        compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1 text-[10px]',
      ].join(' ')}
      title="USD value is an estimate from live price feeds"
    >
      Est.
    </span>
  );
}

export function PriceUnavailableNote() {
  return (
    <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-center">
      <p className="text-xs font-semibold text-rose-100">Price feed temporarily unavailable</p>
      <p className="mt-1 text-[11px] text-rose-200/80">
        DexScreener may be rate-limiting or the token is not indexed yet. We’ll keep retrying.
      </p>
    </div>
  );
}
