'use client';

export default function Xpot1918Badge({
  className = '',
  label = '19.18 YEARS',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full',
        'border border-emerald-400/15 bg-emerald-300/10',
        'px-3 py-1',
        'text-[11px] font-semibold tracking-[0.18em]',
        'text-[rgb(var(--xpot-gold-2))]',
        'shadow-[0_12px_40px_rgba(0,0,0,0.35)]',
        className,
      ].join(' ')}
    >
      {label}
    </span>
  );
}
