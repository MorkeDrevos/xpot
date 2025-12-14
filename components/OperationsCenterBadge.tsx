// components/OperationsCenterBadge.tsx
'use client';

type OperationsCenterBadgeProps = {
  live?: boolean;
  autoDraw?: boolean;
};

export default function OperationsCenterBadge({
  live = true,
  autoDraw = false,
}: OperationsCenterBadgeProps) {
  const tone = autoDraw ? 'auto' : live ? 'live' : 'idle';

  const dotCls =
    tone === 'auto'
      ? 'bg-sky-300 shadow-[0_0_14px_rgba(56,189,248,0.75)] animate-pulse'
      : tone === 'live'
      ? 'bg-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.6)]'
      : 'bg-slate-500 shadow-[0_0_12px_rgba(100,116,139,0.35)]';

  const pillCls =
    tone === 'auto'
      ? 'border-sky-400/30 bg-sky-500/10'
      : tone === 'live'
      ? 'border-emerald-400/25 bg-emerald-500/10'
      : 'border-white/10 bg-white/5';

  const label =
    tone === 'auto' ? 'AUTO DRAW' : tone === 'live' ? 'LIVE' : 'STANDBY';

  const sub =
    tone === 'auto'
      ? 'Automation engaged'
      : tone === 'live'
      ? 'Ops stream active'
      : 'Awaiting unlock';

  return (
    <div className="flex w-full min-w-0 justify-end">
      <div
        className={[
          // key: allow shrinking inside flex parents
          'inline-flex max-w-full min-w-0 items-center',
          // height + spacing (slim)
          'h-[32px] gap-2 rounded-full border px-3 pl-2.5',
          'backdrop-blur',
          'shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_60px_rgba(2,6,23,0.45)]',
          pillCls,
        ].join(' ')}
      >
        <span className={['h-2 w-2 shrink-0 rounded-full', dotCls].join(' ')} />

        <div className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-200">
            {label}
          </span>
          <span className="min-w-0 truncate text-[11px] text-slate-400">
            {sub}
          </span>
        </div>

        {/* Divider + long tagline only when there is room */}
        <span className="hidden lg:inline-flex mx-1 h-4 w-px shrink-0 bg-white/10" />

        <span className="text-sm font-semibold tracking-[0.02em] text-slate-100">
  One protocol.
  <span className="mx-1 text-slate-400">One identity.</span>
  <span className="text-slate-100">One daily XPOT draw.</span>
</span>
      </div>
    </div>
  );
}
