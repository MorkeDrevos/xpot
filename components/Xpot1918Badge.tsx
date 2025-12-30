'use client';

type Xpot1918BadgeProps = {
  label?: string;
  className?: string;
};

export default function Xpot1918Badge({
  label = '19.18 YEARS',
  className = '',
}: Xpot1918BadgeProps) {
  return (
    <span
      className={[
        'relative inline-flex items-center',
        'rounded-full',
        'border border-emerald-400/18',
        'bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.18),rgba(0,0,0,0.30)_55%,rgba(0,0,0,0.22)_100%)]',
        'px-3 py-1',
        'shadow-[0_18px_55px_rgba(16,185,129,0.10)]',
        'ring-1 ring-black/35',
        'select-none',
        className,
      ].join(' ')}
      aria-label="XPOT reserve coverage"
    >
      <strong
        className={[
          'relative z-10',
          'font-semibold',
          'text-[rgb(var(--xpot-gold-2))]',
          'tracking-[0.12em]',
          'uppercase',
          'whitespace-nowrap',
        ].join(' ')}
      >
        {label}
      </strong>
    </span>
  );
}
