// components/BonusStrip.tsx
'use client';

export default function BonusStrip() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm text-slate-200">
        Bonus rounds and drops will appear here.
      </div>
      <div className="mt-1 text-xs text-slate-400">Pre-launch mode</div>
    </div>
  );
}
