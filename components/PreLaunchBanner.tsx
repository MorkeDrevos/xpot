// components/PreLaunchBanner.tsx
export default function PreLaunchBanner() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-500 text-[11px] font-medium text-white shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 px-3 py-1.5">
        <span className="uppercase tracking-[0.18em] text-white/90">
          PRE-LAUNCH MODE
        </span>
        <span className="h-1 w-1 rounded-full bg-white/80" />
        <span className="uppercase tracking-[0.18em] text-white/90">
          XPOT TOKEN NOT DEPLOYED
        </span>
        <span className="h-1 w-1 rounded-full bg-white/80" />
        <span className="uppercase tracking-[0.18em] text-white/90">
          BUILD V0.9.3
        </span>
      </div>
    </div>
  );
}
