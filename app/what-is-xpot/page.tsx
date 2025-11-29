import Link from 'next/link';

export default function WhatIsXpotPage() {
  return (
    <main className="min-h-screen bg-[#02040a] text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        {/* Top nav / back link */}
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-100"
          >
            <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px]">← Back</span>
            <span className="hidden sm:inline">Return to XPOT dashboard</span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
            <span>XPOT Key facts</span>
          </div>
        </header>

        {/* HERO – wider, no bullets */}
        <section className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-slate-800 bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.12),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.18),transparent_55%),linear-gradient(to_bottom,#050816,#02030a)] px-8 pb-7 pt-8 shadow-[0_40px_140px_rgba(0,0,0,0.9)]">
          <div className="relative grid gap-10 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)]">
            {/* Left: story */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">
                What is XPOT?
              </p>
              <h1 className="mt-3 text-[2.1rem] font-semibold leading-tight tracking-tight sm:text-[2.25rem]">
                XPOT is your entry key to the crypto jackpot draw
              </h1>
              <p className="mt-4 text-sm text-slate-200/90">
                XPOT is the token the XPOT.bet draw revolves around. Hold the minimum XPOT balance,
                connect your wallet and sign in with X – then your X account can claim one ticket
                for the current draw.
              </p>

              <p className="mt-5 text-sm text-slate-200/90">
                XPOT follows three simple rules:
                {' '}
                <span className="font-medium">one ticket per X account</span>,
                {' '}
                <span className="font-medium">wallet-based eligibility using a minimum XPOT balance</span>,
                {' '}
                and
                {' '}
                <span className="font-medium">no automatic posting from your X account</span>.
              </p>
            </div>

            {/* Right: compact fact card */}
            <aside className="rounded-3xl border border-slate-800/80 bg-slate-950/70 px-5 py-5 text-sm text-slate-200/95">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                At a glance
              </p>

              <div className="mt-4 space-y-4 text-[13px] leading-relaxed">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Clear rules
                  </p>
                  <p className="mt-1 text-slate-200">
                    Each ticket is linked to one X account and one wallet at the time of entry. No
                    spam, no ticket farming.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Eligibility at entry
                  </p>
                  <p className="mt-1 text-slate-200">
                    Your XPOT balance is checked when you enter. For that round, your ticket stays
                    valid even if the balance changes later.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Identity, not access
                  </p>
                  <p className="mt-1 text-slate-200">
                    Sign in with X is used only to confirm which account owns the ticket. XPOT.bet
                    never gains control of your X account.
                  </p>
                </div>
              </div>

              <p className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-3 text-[11px] leading-relaxed text-slate-400">
                XPOT and XPOT.bet are experimental crypto products. Only use funds you can afford to
                lose and always double-check contract addresses.
              </p>
            </aside>
          </div>

          {/* Hero CTAs */}
          <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-slate-800 pt-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-sky-500 px-5 py-2.5 text-xs font-semibold text-slate-950 shadow shadow-sky-500/40 hover:bg-sky-400"
            >
              Enter today&apos;s draw
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/80 px-5 py-2.5 text-xs font-medium text-slate-100 hover:border-slate-500 hover:bg-slate-900"
            >
              Go to dashboard
            </Link>
          </div>
        </section>

        {/* Lower content – kept lean */}
        <div className="mx-auto mt-12 flex max-w-4xl flex-col gap-10 text-sm text-slate-300">
          {/* How it works */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              How the XPOT draw works
            </h2>
            <ol className="mt-4 space-y-2 text-sm">
              <li>1. You sign in with X on XPOT.bet.</li>
              <li>2. You connect a wallet that holds at least the minimum XPOT balance.</li>
              <li>3. You claim one ticket for the current draw – one ticket per X account.</li>
              <li>4. When the draw closes, one ticket is selected as the winner.</li>
              <li>5. The winner can claim the jackpot within the published claim window.</li>
            </ol>
          </section>

          {/* Requirements */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Entry requirements
            </h2>
            <p className="mt-3 text-sm">
              To keep entries fair and limit spam, XPOT uses three simple requirements:
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  X account
                </p>
                <p className="mt-1 text-sm">
                  You must sign in with X. Your X handle is what the winning ticket will show.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Wallet connection
                </p>
                <p className="mt-1 text-sm">
                  You connect a wallet on the supported network. This is where XPOT is held and
                  where jackpots are paid out.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
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

          {/* FAQ */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Quick questions
            </h2>
            <div className="mt-4 space-y-3 text-sm">
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

          {/* Safety strip */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-[11px] leading-relaxed text-slate-400">
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
