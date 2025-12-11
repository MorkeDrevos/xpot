// components/PreLaunchBanner.tsx
export default function PreLaunchBanner() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-500 text-[10px] sm:text-[11px] md:text-[12px] font-medium text-white shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-3 py-2 sm:px-4 sm:py-3">
        <span className="uppercase tracking-[0.18em] text-white/90">
          PRE-LAUNCH MODE
        </span>
        <span className="h-1 w-1 rounded-full bg-white/80" />
        <span className="uppercase tracking-[0.18em] text-white/90">
          XPOT TOKEN NOT DEPLOYED
        </span>
        <span className="h-1 w-1 rounded-full bg-white/80" />
        <span className="uppercase tracking-[0.18em] text-white/90">
          BUILD V0.9.7
        </span>
      </div>
    </div>
  );
}
