// app/winners/loading.tsx
export default function WinnersLoading() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6">
      <section className="mt-[140px] space-y-6 pb-16">
        {/* Hero card skeleton */}
        <div className="rounded-[30px] border border-slate-900/70 bg-slate-950/60 px-6 py-6 backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="h-4 w-44 rounded-full bg-white/10" />
              <div className="h-3 w-[520px] max-w-[70vw] rounded-full bg-white/5" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-28 rounded-full bg-white/5 ring-1 ring-white/10" />
              <div className="h-9 w-28 rounded-full bg-white/5 ring-1 ring-white/10" />
            </div>
          </div>
        </div>

        {/* Log card skeleton */}
        <div className="rounded-[30px] border border-slate-900/70 bg-slate-950/60 px-6 py-6 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="h-4 w-36 rounded-full bg-white/10" />
              <div className="h-3 w-[420px] max-w-[70vw] rounded-full bg-white/
