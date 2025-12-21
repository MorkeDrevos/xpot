// components/GoldAmount.tsx
type GoldAmountProps = {
  value: string;
  suffix?: string; // XPOT, USD, etc
  size?: 'sm' | 'md' | 'lg';
};

export default function GoldAmount({ value, suffix = 'XPOT', size = 'md' }: GoldAmountProps) {
  const sizeMap = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  };

  return (
    <span className="inline-flex items-baseline gap-2">
      <span
        className={`font-mono ${sizeMap[size]} tracking-[0.18em]`}
        style={{
          color: 'rgba(201,162,74,0.95)',
          textShadow: '0 0 22px rgba(201,162,74,0.18)',
        }}
      >
        {value}
      </span>
      <span className="text-slate-400 text-sm tracking-[0.22em] uppercase">
        {suffix}
      </span>
    </span>
  );
}
