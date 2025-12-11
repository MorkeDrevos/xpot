// components/PreLaunchBanner.tsx
export default function PreLaunchBanner() {
  return (
    <div
      className="
        fixed inset-x-0 top-0 z-50 
        py-2 sm:py-3 
        text-center 
        text-[10px] sm:text-[11px] md:text-[12px] 
        font-semibold tracking-wide 
        text-white/80
        bg-[#0b0b11]
        border-b border-white/10 
        shadow-[0_0_14px_rgba(60,60,120,0.35)]
        bg-[radial-gradient(circle_at_top,rgba(120,0,255,0.14),transparent)]
      "
    >
      <div className="mx-auto max-w-6xl flex items-center justify-center gap-x-3 flex-wrap px-4">
        <span className="uppercase tracking-[0.24em]">
          PRE-LAUNCH MODE
        </span>
        <span className="h-1 w-1 rounded-full bg-white/70" />
        <span className="uppercase tracking-[0.24em]">
          XPOT TOKEN NOT DEPLOYED
        </span>
        <span className="h-1 w-1 rounded-full bg-white/70" />
        <span className="uppercase tracking-[0.24em]">
          BUILD V0.9.7
        </span>
      </div>
    </div>
  );
}
