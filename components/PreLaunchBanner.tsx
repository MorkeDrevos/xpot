// components/PreLaunchBanner.tsx
export default function PreLaunchBanner() {
  return (
    <div
      className="
        fixed inset-x-0 top-0 z-[70]
        h-[var(--xpot-banner-h)]
        bg-[linear-gradient(90deg,#1c002b,#3a0099,#6a2cff,#3a0099,#1c002b)]
        bg-[length:200%_200%]
        animate-[xpotBannerMove_12s_linear_infinite]
        shadow-[0_0_18px_rgba(120,40,255,0.35)]
        border-b border-white/10
      "
    >
      <div
        className="
          mx-auto flex h-full max-w-6xl flex-wrap items-center justify-center gap-x-3 px-4
          text-[10px] sm:text-[11px] md:text-[12px]
          font-medium text-white/90
        "
      >
        <span className="uppercase tracking-[0.20em] text-white/90">
          PRE-LAUNCH MODE
        </span>
        <span className="h-1 w-1 rounded-full bg-white/80" />
        <span className="uppercase tracking-[0.20em] text-white/90">
          XPOT TOKEN NOT DEPLOYED
        </span>
        <span className="h-1 w-1 rounded-full bg-white/80" />
        <span className="uppercase tracking-[0.20em] text-white/90">
          BUILD V0.9.7
        </span>
      </div>
    </div>
  );
}
