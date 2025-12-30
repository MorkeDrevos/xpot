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
        'relative inline-flex items-center',
        'rounded-full',
        'border border-emerald-400/20',
        'bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.22),rgba(0,0,0,0.28)_55%,rgba(0,0,0,0.20)_100%)]',
        'px-3 py-1',
        'shadow-[0_14px_40px_rgba(16,185,129,0.10)]',
        className,
      ].join(' ')}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-black/40" />
      <strong
        className={[
          'relative z-10',
          'font-semibold',
          'text-[rgb(var(--xpot-gold-2))]',
          'tracking-[0.12em]',
          'uppercase',
          'whitespace-nowrap',
          'text-[11px] sm:text-[12px]',
        ].join(' ')}
      >
        {label}
      </strong>
    </span>
  );
}
