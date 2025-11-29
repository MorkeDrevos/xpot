import Link from 'next/link';

export default function WhatIsXpotPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#020617_0,_#020617_35%,_#000_100%)] text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        {/* Top nav / back link */}
        <header className="mb-10 flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-100"
          >
            <span className="rounded-full bg-slate-900/80 px-2 py-1 text-[10px]">← Back</span>
            <span className="hidden sm:inline">Return to XPOT dashboard</span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/80 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
            <span>XPOT standard</span>
          </div>
        </header>

        {/* HERO – flagship card */}
        <section className="relative mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-slate-800/90 bg-slate-950/95 px-8 pb-10 pt-9 shadow-[0_40px_160px_rgba(0,0,0,0.95)]">
          {/* soft inner glow */}
          <div className="pointer-events-none absolute inset-px rounded-[30px] bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.25),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.25),transparent_55%)]" />

          <div className="relative grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2.3fr)]">
            {/* Left: Story + CTA */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
                What is XPOT
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-[2.15rem]">
                XPOT is your entry key
                <br />
                to the crypto jackpot draw
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-slate-300/90">
                XPOT is the token the XPOT.bet draw revolves around. Hold the minimum XPOT balance,
                connect your wallet and sign in with X – then your X account can claim one ticket
                for the current draw.
              </p>

              {/* Key pillars – very compact */}
              <div className="mt-6 space-y-3 text-[12px] text-slate-200/90">
                <div className="flex items-start gap-3">
                  <span className="mt-[3px] h-1.5 w-1.5 flex-none rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  <p>
                    <span className="font-semibold text-slate-100">
                      One ticket per X account.
                    </span>{' '}
                    Every draw, each X handle can claim exactly one ticket.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-[3px] h-1.5 w-1.5 flex-none rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.7)]" />
                  <p>
                    <span className="font-semibold text-slate-100">
                      Wallet-based eligibility.
                    </span>{' '}
                    Your wallet must hold the minimum XPOT balance when you enter.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-[3px] h-1.5 w-1.5 flex-none rounded-full bg-slate-300/90" />
                  <p>
                    <span className="font-semibold text-slate-100">No auto-posting.</span>{' '}
                    Sign in with X confirms identity only. Posting is always optional.
                  </p>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full bg-sky-500 px-5 py-2.5 text-[12px] font-semibold text-slate-950 shadow shadow-sky-500/40 hover:bg-sky-400"
                >
                  Enter today&apos;s draw
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/80 px-5 py-2.5 text-[12px] font-medium text-slate-100 hover:border-slate-500 hover:bg-slate-900"
                >
                  Go to dashboard
                </Link>
              </div>
            </div>

            {/* Right: Trust panel */}
            <aside className="h-full rounded-3xl border border-slate-800/90 bg-slate-950/90 px-5 py-5 text-[12px] text-slate-200">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                At a glance
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-50">Clear ticket rules</p>
                  <p className="mt-1 text-[12px] text-slate-300">
                    One ticket per X account and per draw. No multi-account farming, no spam.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-50">
                    Wallet &amp; XPOT balance required
                  </p>
                  <p className="mt-1 text-[12px] text-slate-300">
                    Eligibility is checked at the moment you enter. Your ticket is locked in for
                    that draw.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-50">Identity, not access</p>
                  <p className="mt-1 text-[12px] text-slate-300">
                    XPOT.bet never posts from your X account automatically. You stay fully in
                    control.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3 text-[11px] text-slate-400">
                XPOT and XPOT.bet are experimental crypto products. Use only funds you can afford to
                lose and always double-check contract addresses.
              </div>
            </aside>
          </div>
        </section>

        {/* BELOW HERO – calm, structured, no clutter */}
        <div className="mx-auto mt-12 flex max-w-5xl flex-col gap-10 text-sm text-slate-300">
          {/* How it works + checklist */}
          <section className="grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2.3fr)]">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                How the XPOT draw works
              </h2>
              <ol className="mt-4 space-y-3 text-sm text-slate-200">
                <li>1. Sign in with X on XPOT.bet.</li>
                <li>2. Connect a wallet that holds at least the minimum XPOT balance.</li>
                <li>3. Claim one ticket for the current draw – one ticket per X account.</li>
                <li>4. When the draw closes, one ticket is selected as the winner.</li>
                <li>5. The winner can claim the jackpot within the published claim window.</li>
              </ol>
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Eligibility checklist
              </h2>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    X account
                  </p>
                  <p className="mt-1 text-sm text-slate-200">
                    You have an active X account and can sign in on XPOT.bet.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Connected wallet
                  </p>
                  <p className="mt-1 text-sm text-slate-200">
                    Your wallet is on the supported network and can hold XPOT and payouts.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Minimum XPOT balance
                  </p>
                  <p className="mt-1 text-sm text-slate-200">
                    At the moment you enter the draw, your wallet holds at least the published
                    minimum XPOT amount.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Quick questions */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Quick questions
            </h2>
            <div className="mt-4 space-y-5 text-sm">
              <div>
                <p className="font-medium text-slate-100">Is XPOT a guarantee of winning?</p>
                <p className="mt-1 text-slate-300">
                  No. XPOT lets you join the draw when you meet the requirements, but only one
                  ticket wins each round.
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-100">
                  Can I sell my XPOT after I enter a draw?
                </p>
                <p className="mt-1 text-slate-300">
                  The requirement is checked when you enter. Selling later does not retroactively
                  cancel your ticket for that draw, but you will need the minimum XPOT again to
                  enter a future draw.
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-100">
                  Does XPOT or XPOT.bet ever post from my X account?
                </p>
                <p className="mt-1 text-slate-300">
                  No. Sign in with X is used only to confirm which account owns the ticket. Posting
                  is always optional and always in your control.
                </p>
              </div>
            </div>
          </section>

          {/* Final CTA + disclaimer row */}
          <section className="mt-2 space-y-5">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 text-[11px] text-slate-400">
              XPOT and XPOT.bet are experimental crypto products. Do not buy XPOT with money you
              cannot afford to lose. Nothing on this page is financial advice or a guarantee of
              returns. Always double-check contract addresses and only use official links shared by
              the XPOT team.
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
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
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
