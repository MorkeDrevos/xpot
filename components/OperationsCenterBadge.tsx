// components/OperationsCenterBadge.tsx
'use client';

export default function OperationsCenterBadge() {
  return (
    <div className="flex w-full items-start justify-end sm:w-auto sm:items-center">
      <div
        className="
          inline-flex h-10 items-center
          rounded-full border border-white/10
          bg-white/5 px-4 pl-[14px]
          shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_60px_rgba(2,6,23,0.45)]
          backdrop-blur
        "
      >
        <span
          className="
            mr-[10px] ml-[2px] h-2.5 w-2.5 rounded-full
            bg-sky-300 shadow-[0_0_14px_rgba(56,189,248,0.75)]
          "
        />
        <span className="text-sm font-semibold tracking-tight text-slate-100">
          One protocol. <span className="font-semibold text-slate-400">One identity.</span>{' '}
          <span className="font-semibold text-slate-100">One daily XPOT draw.</span>
        </span>
      </div>
    </div>
  );
}
