import Link from 'next/link';

export default function WhatIsXpotPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#020617] via-black to-black text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        {/* Top nav / back link */}
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-100"
          >
            <span className="rounded-full bg-slate-900/80 px-2 py-1 text-[10px]">← Back</span>
            <span className="hidden sm:inline">Return to XPOT dashboard</span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/80 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
            <span>XPOT guide</span>
          </div>
        </header>

        {/* HERO – calm, premium card */}
        <section className="relative mx-auto max-w-4xl overflow-hidden rounded-[32px] border border-slate-800/80 bg-slate-950/95 px-7 pb-8 pt-7 shadow-[0_40px_140px_rgba(0,0,0,0.9)]">
          {/* Soft glow frame */}
          <div className="pointer-events-none absolute inset-px rounded-[30px] bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.16),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.16),transparent_55%)]" />

          <div className="relative space-y-6">
            {/* Title block */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                What is XPOT
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                XPOT is your entry key to the crypto jackpot draw
              </h1>
              <p className="mt-3 text-sm text-slate-300/90">
                XPOT is the token the XPOT.bet draw revolves around. Hold the minimum XPOT balance,
                connect your wallet and sign in with X – then your X account can claim one ticket
                for the current draw.
              </p>
            </div>

            {/* Compact “at a glance” strip */}
            <div className="grid gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-4 text-[12px] text-slate-200 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  One ticket per X account
                </p>
                <p className="text-[12px] text-slate-300">
                  Each draw, your X handle can claim exactly one ticket – no spam, no multi-account
                  farming.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Wallet-based eligibility
                </p>
                <p className="text-[12px] text-slate-300">
                  Your wallet must hold at least the minimum XPOT balance at the moment you enter
                  the draw.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  No auto-posting
                </p>
                <p className="text-[12px] text-slate-300">
                  Sign in with X is used only to confirm identity for the ticket. Posting is always
                  optional.
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4 text-xs text-slate-400">
              <p className="max-w-xs">
                XPOT is not an investment recommendation. It is a utility token used inside the
                XPOT.bet draw mechanic.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-[11px] font-semibold text-slate-950 shadow shadow-sky-500/40 hover:bg-sky-400"
                >
                  Enter today&apos;s draw
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-[11px] font-medium text-slate-100 hover:border-slate-500 hover:bg-slate-900"
                >
                  Go to dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* UNDER-HERO – simple, not busy */}
        <div className="mx-auto mt-10 flex max-w-4xl flex-col gap-10 text-sm text-slate-300">
          {/* How it works + Fairness */}
          <section className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                How the XPOT draw works
              </h2>
              <ol className="mt-3 space-y-2 text-sm text-slate-200">
                <li>1. You sign in with X on XPOT.bet.</li>
                <li>2. You connect a wallet that holds at least the minimum XPOT balance.</li>
                <li>3. You claim one ticket for the current draw – one ticket per X account.</li>
                <li>4. When the draw closes, one ticket is selected as the winner.</li>
                <li>5. The winner can claim the jackpot within the published claim window.</li>
              </ol>
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Why XPOT feels fair
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                <li>• Clear one-ticket-per-account rule for every draw.</li>
                <li>• Wallet + XPOT balance required at the moment of entry.</li>
                <li>• No automatic posts or actions from your X account.</li>
              </ul>
            </div>
          </section>

          {/* Entry requirements – slim row of cards */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Entry requirements
            </h2>
            <p className="mt-3 text-sm text-slate-300">
              To keep entries fair and limit spam, XPOT uses three simple requirements:
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  X account
                </p>
                <p className="mt-1 text-sm">
                  You sign in with X. Your X handle is what the winning ticket will show.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Wallet connection
                </p>
                <p className="mt-1 text-sm">
                  You connect a wallet on the supported network. This is where XPOT is held and
                  where jackpots are paid out.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Minimum XPOT balance
                </p>
                <p className="mt-1 text-sm">
                  Your wallet must hold at least the published minimum XPOT amount when you enter
                  the draw.
                </p>
              </div>
            </div>
          </section>

          {/* Quick questions */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Quick questions
            </h2>
            <div className="mt-3 space-y-4 text-sm">
              <div>
                <p className="font-medium text-slate-100">Is XPOT a guarantee of winning?</p>
                <p className="text-slate-300">
                  No. XPOT lets you join the draw when you meet the requirements, but only one
                  ticket wins each round.
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-100">
                  Can I sell my XPOT after I enter a draw?
                </p>
                <p className="text-slate-300">
                  The requirement is checked when you enter. Selling later does not retroactively
                  cancel your ticket for that draw, but you will need the minimum XPOT again to
                  enter a future draw.
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-100">
                  Does XPOT or XPOT.bet ever post from my X account?
                </p>
                <p className="text-slate-300">
                  No. Sign in with X is used only to confirm which account owns the ticket. Posting
                  is always optional.
                </p>
              </div>
            </div>
          </section>

          {/* Safety / disclaimer */}
          <section className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 text-[11px] text-slate-400">
            XPOT and XPOT.bet are experimental crypto products. Do not buy XPOT with money you
            cannot afford to lose. Nothing on this page is financial advice or a guarantee of
            returns. Always double-check contract addresses and only use official links shared by
            the XPOT team.
          </section>

          {/* Final CTA */}
          <section className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              Ready to see if you qualify for the next draw?
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow shadow-sky-500/40 hover:bg-sky-400"
              >
                Enter today&apos;s draw
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-xs font-medium text-slate-100 hover:border-slate-500 hover:bg-slate-900"
              >
                Go to dashboard
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
