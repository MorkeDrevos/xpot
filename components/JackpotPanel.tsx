// components/JackpotPanel.tsx
'use client';

type JackpotPanelProps = {
  variant?: 'standalone' | 'embedded';
  isLocked?: boolean;
  onJackpotUsdChange?: (value: number | null) => void;
};

export default function JackpotPanel({ variant = 'standalone' }: JackpotPanelProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400">Today’s XPOT</div>
          <div className="mt-1 text-2xl font-semibold">$0.00</div>
        </div>

        <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-200">
          {variant === 'embedded' ? 'Embedded' : 'Standalone'}
        </span>
      </div>

      <div className="mt-4 text-sm text-slate-300">
        Jackpot panel restored. Live pricing will be reconnected after merge.
      </div>
    </section>
  );
}
