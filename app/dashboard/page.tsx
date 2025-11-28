{/* LOGIN OVERLAY – premium glass XPOT access */}
{!isAuthed && (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-[16px]">
    <div className="relative mx-4 w-full max-w-md rounded-3xl border border-slate-800 bg-[#05070c] px-8 py-7 text-center shadow-[0_40px_160px_rgba(0,0,0,0.95)] ring-1 ring-emerald-400/30">
      {/* Soft glow halo */}
      <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-b from-emerald-400/10 via-transparent to-sky-400/10 blur-xl" />

      {/* Content */}
      <div className="relative">
        {/* Pill label */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          <span className="h-1 w-1 rounded-full bg-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.85)]" />
          <span>XPOT Access</span>
        </div>

        {/* Heading */}
        <h2 className="mb-2 text-xl font-semibold tracking-tight text-slate-50">
          Sign in to enter today’s draw
        </h2>

        {/* Main description */}
        <p className="mb-4 text-xs leading-relaxed text-slate-400">
          One ticket per X account, per draw. <br className="hidden sm:inline" />
          No posts. No forms. Just one click to enter.
        </p>

        {/* Requirements line with tooltip */}
        <p className="mb-5 text-[11px] leading-relaxed text-slate-500">
          Requires wallet connection and{' '}
          <span className="relative inline-block cursor-help group">
            minimum <span className="text-slate-200">XPOT</span> balance
            {/* Tooltip */}
            <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 w-44 -translate-x-1/2 rounded-md bg-slate-950 px-2 py-1 text-[10px] text-slate-100 opacity-0 shadow-lg shadow-black/60 ring-1 ring-slate-700/70 transition-opacity group-hover:opacity-100">
              You’ll need a minimum XPOT balance in your connected wallet to
              lock in today’s ticket.
            </span>
          </span>
          .
        </p>

        {/* Main CTA */}
        <button
          type="button"
          onClick={handleSignInWithX}
          className="w-full rounded-full bg-gradient-to-r from-sky-400 to-sky-500 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-sky-500/30 transition-transform duration-150 hover:from-sky-300 hover:to-sky-500 active:scale-[0.97]"
        >
          {status === 'loading' ? 'Checking session…' : 'Sign in with X'}
        </button>

        {/* Helper micro-copy + XPOT link */}
        <div className="mt-3 flex flex-col gap-1 text-[11px] text-slate-500">
          <p>Wrong X account? Switch on x.com first.</p>
          <button
            type="button"
            className="mx-auto inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300/90 underline underline-offset-2 hover:text-emerald-200"
            // wire this later to router.push('/what-is-xpot') or similar
          >
            What is XPOT?
          </button>
        </div>
      </div>
    </div>
  </div>
)}
