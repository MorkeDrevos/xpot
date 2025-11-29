import Link from 'next/link';

export default function WhatIsXpotPage() {
  return (
    <main className="min-h-screen bg-[#070707] text-[#f4f1ea]">
      <div className="mx-auto flex max-w-6xl flex-col px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        {/* Top bar */}
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-[11px] font-medium text-[#8c867c] hover:text-[#f4f1ea]"
          >
            <span className="rounded-full bg-[#111111] px-2 py-1 text-[10px] uppercase tracking-[0.16em]">
              ← Back
            </span>
            <span className="hidden sm:inline">Return to XPOT dashboard</span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#2a2418] bg-[#0b0b0b] px-4 py-1 text-[10px] uppercase tracking-[0.22em] text-[#b7afa3]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8dd2b4] shadow-[0_0_14px_rgba(141,210,180,0.9)]" />
            <span>XPOT Key Facts</span>
          </div>
        </header>

        {/* HERO: Black Gold Vault */}
        <section className="relative overflow-hidden rounded-[32px] border border-[#262019] bg-[radial-gradient(circle_at_10%_0%,rgba(201,179,125,0.14),transparent_55%),radial-gradient(circle_at_90%_120%,rgba(141,210,180,0.12),transparent_52%),linear-gradient(to_bottom,#101010,#050505)] px-6 py-8 sm:px-10 sm:py-10 shadow-[0_60px_220px_rgba(0,0,0,1)]">
          {/* Inner soft border glow */}
          <div className="pointer-events-none absolute inset-px rounded-[30px] border border-[#1a140e]/60" />

          <div className="relative flex flex-col gap-10 lg:flex-row lg:items-start">
            {/* Left side – story */}
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8dd2b4]">
                What is XPOT
              </p>
              <h1 className="mt-3 text-[2.3rem] font-[500] leading-tight tracking-tight text-[#f4f1ea] sm:text-[2.6rem]">
                XPOT is your entry key
                <span className="block">to a controlled crypto jackpot draw</span>
              </h1>

              <p className="mt-4 text-[13px] leading-relaxed text-[#b7afa3]">
                XPOT is the token the XPOT.bet draw revolves around. Hold the minimum XPOT balance,
                connect your wallet and sign in with X – then your X account can claim exactly one
                ticket for the current draw.
              </p>

              {/* Three key assurances */}
              <div className="mt-6 space-y-3 text-[13px] text-[#f4f1ea]">
                <div className="rounded-2xl bg-[#121212]/80 px-4 py-3 ring-1 ring-[#29231a]">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#b7afa3]">
                    One ticket per X account
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#f4f1ea]">
                    Each draw, your X handle can claim one ticket only. No spam, no multi-account
                    farming.
                  </p>
                </div>
                <div className="rounded-2xl bg-[#121212]/80 px-4 py-3 ring-1 ring-[#29231a]">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#b7afa3]">
                    Wallet-based eligibility
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#f4f1ea]">
                    Your wallet must hold at least the minimum XPOT balance at the moment you enter
                    the draw.
                  </p>
                </div>
                <div className="rounded-2xl bg-[#121212]/80 px-4 py-3 ring-1 ring-[#29231a]">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#b7afa3]">
                    No auto posting
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#f4f1ea]">
                    XPOT.bet never posts from your X account automatically. Posting is always a
                    choice.
                  </p>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full bg-[#c9b37d] px-5 py-2.5 text-[12px] font-semibold tracking-[0.14em] text-[#16130c] shadow-[0_0_40px_rgba(201,179,125,0.55)] transition-colors hover:bg-[#e1c88a]"
                >
                  Enter today&apos;s draw
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-full border border-[#2a2418] bg-[#111111]/70 px-5 py-2.5 text-[12px] font-medium tracking-[0.16em] text-[#b7afa3] transition-colors hover:border-[#3a2f1f] hover:text-[#f4f1ea]"
                >
                  Go to dashboard
                </Link>
              </div>

              <p className="mt-4 max-w-md text-[11px] leading-relaxed text-[#8c867c]">
                XPOT is not an investment recommendation. It is a utility token used exclusively
                inside the XPOT.bet draw mechanic.
              </p>
            </div>

            {/* Right side – vault facts */}
            <aside className="w-full max-w-sm rounded-[28px] border border-[#262019] bg-[#0b0b0b]/95 px-5 py-5 text-[12px] text-[#b7afa3] shadow-[0_0_120px_rgba(0,0,0,0.9)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#b7afa3]">
                At a glance
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f4f1ea]">
                    Clear rules
                  </p>
                  <p className="mt-1 leading-relaxed">
                    Each ticket is linked to one X account and one wallet at the moment of entry.
                    No spam, no ticket stacking.
                  </p>
                </div>

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#302619] to-transparent" />

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f4f1ea]">
                    Eligibility at entry
                  </p>
                  <p className="mt-1 leading-relaxed">
                    Your XPOT balance is checked when you enter. For that round, your ticket
                    remains valid even if the balance changes later.
                  </p>
                </div>

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#302619] to-transparent" />

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f4f1ea]">
                    Identity, not access
                  </p>
                  <p className="mt-1 leading-relaxed">
                    Sign in with X is used only to confirm which account owns the ticket. XPOT.bet
                    never gains control of your X account.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-[#101010] px-4 py-3 text-[11px] text-[#8c867c] ring-1 ring-[#27201a]">
                XPOT and XPOT.bet are experimental crypto products. Only use funds you can afford to
                lose and always double-check contract addresses.
              </div>
            </aside>
          </div>
        </section>

        {/* WHY XPOT FEELS CONTROLLED */}
        <section className="mt-9 rounded-3xl border border-[#262019] bg-[#090909] px-6 py-4 text-[12px] text-[#b7afa3] sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f4f1ea]">
              Why XPOT feels controlled
            </p>
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#121212] px-3 py-1 text-[11px] text-[#b7afa3] ring-1 ring-[#302619]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8dd2b4]" />
                <span>One ticket per X account</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#121212] px-3 py-1 text-[11px] text-[#b7afa3] ring-1 ring-[#302619]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8dd2b4]" />
                <span>Wallet + XPOT balance at entry</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#121212] px-3 py-1 text-[11px] text-[#b7afa3] ring-1 ring-[#302619]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8dd2b4]" />
                <span>No automatic posting from X</span>
              </div>
            </div>
          </div>
        </section>

        {/* HOW THE DRAW WORKS */}
        <section className="mt-10 text-[13px] text-[#b7afa3]">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#f4f1ea]">
            How the XPOT draw works
          </h2>
          <div className="mt-4 space-y-2">
            <p>
              1. You sign in with X on XPOT.bet and connect a wallet that holds at least the
              minimum XPOT balance.
            </p>
            <p>2. You generate one ticket for the current draw – one ticket per X account.</p>
            <p>3. When the draw closes, one ticket is selected as the winner.</p>
            <p>4. The winner can claim the jackpot within the published claim window.</p>
          </div>
        </section>

        {/* ENTRY REQUIREMENTS */}
        <section className="mt-10 text-[13px] text-[#b7afa3]">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#f4f1ea]">
            Entry requirements
          </h2>
          <p className="mt-3">
            To keep entries fair and limit spam, XPOT uses three simple requirements:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#262019] bg-[#0b0b0b] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f4f1ea]">
                X account
              </p>
              <p className="mt-1">
                You must sign in with X. Your X handle is what the winning ticket will display if
                your ticket is selected.
              </p>
            </div>
            <div className="rounded-2xl border border-[#262019] bg-[#0b0b0b] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f4f1ea]">
                Wallet connection
              </p>
              <p className="mt-1">
                You connect a wallet on the supported network. This is where XPOT is held and where
                jackpots are paid out.
              </p>
            </div>
            <div className="rounded-2xl border border-[#262019] bg-[#0b0b0b] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f4f1ea]">
                Minimum XPOT balance
              </p>
              <p className="mt-1">
                Your wallet must hold at least the published minimum XPOT amount at the moment you
                enter the draw.
              </p>
            </div>
            <div className="rounded-2xl border border-[#262019] bg-[#0b0b0b] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f4f1ea]">
                One ticket per draw
              </p>
              <p className="mt-1">
                Each X account can generate exactly one ticket per draw. When a new draw opens, your
                entry resets and you can qualify again.
              </p>
            </div>
          </div>
        </section>

        {/* QUICK QUESTIONS */}
        <section className="mt-10 text-[13px] text-[#b7afa3]">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#f4f1ea]">
            Quick questions
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="font-medium text-[#f4f1ea]">Is XPOT a guarantee of winning?</p>
              <p className="mt-1">
                No. XPOT lets you join the draw when you meet the requirements, but only one ticket
                wins each round.
              </p>
            </div>
            <div>
              <p className="font-medium text-[#f4f1ea]">
                Can I sell my XPOT after I enter a draw?
              </p>
              <p className="mt-1">
                The requirement is checked when you enter. Selling later does not retroactively
                cancel your ticket for that draw, but you will need the minimum XPOT again to enter a
                future draw.
              </p>
            </div>
            <div>
              <p className="font-medium text-[#f4f1ea]">
                Does XPOT or XPOT.bet ever post from my X account?
              </p>
              <p className="mt-1">
                No. Sign in with X is used only to confirm which account owns the ticket. Posting is
                always optional.
              </p>
            </div>
          </div>
        </section>

        {/* Safety / disclaimer */}
        <section className="mt-8 rounded-2xl border border-[#262019] bg-[#0b0b0b] px-5 py-4 text-[11px] leading-relaxed text-[#8c867c]">
          XPOT and XPOT.bet are experimental crypto products. Do not buy XPOT with money you cannot
          afford to lose. Nothing on this page is financial advice or a guarantee of returns. Always
          double-check contract addresses and only use official links shared by the XPOT team.
        </section>

        {/* Final CTA */}
        <section className="mt-8 flex flex-wrap items-center justify-between gap-4 text-[12px] text-[#b7afa3]">
          <p>Ready to see if you qualify for the next draw?</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-[#c9b37d] px-5 py-2.5 text-[12px] font-semibold tracking-[0.14em] text-[#16130c] shadow-[0_0_40px_rgba(201,179,125,0.55)] transition-colors hover:bg-[#e1c88a]"
            >
              Enter today&apos;s draw
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-[#2a2418] bg-[#111111]/70 px-5 py-2.5 text-[12px] font-medium tracking-[0.16em] text-[#b7afa3] transition-colors hover:border-[#3a2f1f] hover:text-[#f4f1ea]"
            >
              Go to dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
