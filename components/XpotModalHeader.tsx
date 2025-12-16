'use client';

import XpotLogoLottie from '@/components/XpotLogoLottie';

export default function XpotModalHeader({
  onClose,
}: {
  onClose?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 pb-4">
      <div className="flex items-center gap-3">
        <XpotLogoLottie
          className="h-8 w-auto"
          height={32}
        />

        <span className="rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
          X-Powered
        </span>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="rounded-full border border-slate-700/70 bg-slate-900/70 p-2 text-slate-300 hover:bg-slate-800"
          aria-label="Close"
        >
          ✕
        </button>
      )}
    </div>
  );
}
