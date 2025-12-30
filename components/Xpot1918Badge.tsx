'use client';

export default function Xpot1918Badge({
  className = '',
  label = '19.18 YEARS',
  subdued = true,
}: {
  className?: string;
  label?: string;
  subdued?: boolean;
}) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full',
        // smaller + calmer
        'px-2.5 py-1',
        'text-[10px] sm:text-[11px] font-semibold uppercase',
        'tracking-[0.16em]',
        // micro, not shouting
        subdued
          ? 'border border-emerald-400/12 bg-emerald-300/8 text-emerald-100/90'
          : 'border border-emerald-400/18 bg-emerald-300/10 text-[rgb(var(--xpot-gold-2))]',
        'shadow-[0_10px_30px_rgba(0,0,0,0.30)]',
        'ring-1 ring-black/30',
        className,
      ].join(' ')}
    >
      {label}
    </span>
  );
}
