// components/PreLaunchBanner.tsx
export default function PreLaunchBanner() {
  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <div
        className="
          relative w-full 
          py-2 sm:py-3 
          text-[10px] sm:text-[11px] md:text-[12px] 
          font-semibold tracking-wide text-white/85
          bg-[url('/nebula-banner.jpg')] 
          bg-cover bg-center bg-no-repeat
          backdrop-blur-[2px]
          border-b border-white/10
          shadow-[0_0_18px_rgba(120,40,255,0.28)]
        "
      >
        <div
          className="
            absolute inset-0 
            bg-gradient-to-r 
            from-[#180022]/75 via-[#3b0066]/55 to-[#180022]/75
          "
        />
        <div className="relative mx-auto max-w-6xl flex items-center justify-center gap-x-3 flex-wrap px-4">
          <span className="uppercase tracking-[0.22em]">
            PRE-LAUNCH MODE
          </span>
          <span className="h-1 w-1 rounded-full bg-white/70" />
          <span className="uppercase tracking-[0.22em]">
            XPOT TOKEN NOT DEPLOYED
          </span>
          <span className="h-1 w-1 rounded-full bg-white/70" />
          <span className="uppercase tracking-[0.22em]">
            BUILD V0.9.7
          </span>
        </div>
      </div>
    </div>
  );
}
