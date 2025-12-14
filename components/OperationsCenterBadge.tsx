'use client';

export default function OperationsCenterBadge() {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur">
      <span
        className="h-2 w-2 rounded-full"
        style={{
          background: 'rgb(var(--xpot-accent))',
          boxShadow:
            '0 0 14px rgba(var(--xpot-accent),0.45), 0 0 22px rgba(var(--xpot-accent-2),0.20)',
        }}
      />
      <span className="text-[12px] sm:text-[13px] font-semibold tracking-wide text-slate-200">
        One protocol. <span className="text-slate-400">One identity.</span> One
        daily XPOT draw.
      </span>
    </div>
  );
}
