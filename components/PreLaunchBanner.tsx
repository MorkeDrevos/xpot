// components/PreLaunchBanner.tsx
export default function PreLaunchBanner() {
  return (
    <div className="fixed inset-x-0 top-0 z-50">
      PRE-LAUNCH MODE   ×   XPOT TOKEN NOT DEPLOYED   ×   BUILD v0.9.8
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
