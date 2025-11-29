// app/what-is-xpot/page.tsx
import Link from 'next/link';

export default function WhatIsXpotPage() {
  return (
    <main className="min-h-screen bg-[#020309] text-slate-50">
      <div className="mx-auto flex max-w-[1200px] flex-col px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        {/* Top nav / back link */}
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-100"
          >
            <span className="rounded-full bg-slate-900/80 px-2 py-1 text-[10px]">
              ← Back
            </span>
            <span className="hidden sm:inline">Return to XPOT dashboard</span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#2c2c33] bg-[#05060b] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            <span>XPOT Guide</span>
          </div>
        </header>

        {/* HERO – flagship layout */}
        <section className="relative overflow-hidden rounded-[40px] border border-[#2b2215] bg-gradient-to-br from-[#100c08] via-[#050308] to-[#05060a] px-8 py-10 sm:px-12 sm:py-14 shadow-[0_40px_160px_rgba(0,0,0,0.85)]">
          {/* Soft inner glow */}
          <div className="pointer-events-none absolute inset-px rounded-[38px] bg-[radial-gradient(circle_at_0%_0%,rgba(249,115,22,0.18),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(52,211,153,0.14),transparent_55%)] opacity-80" />

          <div className="relative flex flex-col gap-10 lg:flex-row lg:items-start">
            {/* Left column – story */}
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300/80">
                What is XPOT
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                XPOT is your entry key
                <br />
                to a controlled crypto jackpot draw
              </h1>

              <p className="mt-4 text-sm leading-relaxed text-slate-200/90">
                XPOT is the token the XPOT.bet draw revolves around. Hold the
                minimum XPOT balance, connect your wallet and sign in with X –
                then your X account can claim exactly one ticket for the
                current draw.
              </p>

              {/* Core pillars – no bullets, just short premium lines */}
              <div className="mt-6 space-y-3 text-sm text-slate-100/90">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200/80">
                    One ticket per X account
                  </p>
                  <p className="mt-1 text-sm text-slate-200/90">
                    Each draw, your X handle can issue one ticket only. No spam,
                    no multi-account farming.
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200/80">
                    Wallet-based eligibility
                  </p>
                  <p className="mt-1 text-sm text-slate-200/90">
                    Your wallet must hold at least the minimum XPOT balance at
                    the moment you enter.
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200/80">
                    No auto-posting from X
                  </p>
                  <p className="mt-1 text-sm text-slate-200/90">
                    XPOT.bet never posts from your X account automatically.
                    Posting is always a choice, never a requirement.
                  </p>
                </div>
              </div>

              {/* Primary CTAs */}
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full bg-amber-300 px-5 py-2.5 text-xs font-semibold text-slate-950 shadow-[0_0_30px_rgba(251,191,36,0.45)] transition hover:bg-amber-200"
                >
                  Enter today&apos;s draw
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-full border border-[#3b352a] bg-black/40 px-5 py-2.5 text-xs font-medium text-slate-100 transition hover:border-[#575047] hover:bg-black/70"
                >
                  Go to dashboard
                </Link>
              </div>

              <p className="mt-4 max-w-md text-[11px] text-slate-400/80">
                XPOT is not an investment recommendation. It is a utility token
                used exclusively inside the XPOT.bet draw mechanic.
              </p>
            </div>

            {/* Right column – compact key facts */}
            <aside className="w-full max-w-sm rounded-3xl border border-[#2f2616] bg-black/40 px-6 py-6 text-sm text-slate-200/90 lg:ml-auto">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">
                XPOT Key Facts
              </p>

              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    Clear rules
                  </p>
                  <p className="mt-1 text-sm">
                    Each ticket is linked to one X account and one wallet at the
                    time of entry. No spam, no ticket stacking.
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    Eligibility at entry
                  </p>
                  <p className="mt-1 text-sm">
                    Your XPOT balance is checked when you enter. For that round,
                    your ticket remains valid even if the balance changes later.
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    Identity, not access
                  </p>
                  <p className="mt-1 text-sm">
                    Sign in with X confirms which account owns the ticket.
                    XPOT.bet never gains control of your X account.
                  </p>
                </div>
              </div>

              <p className="mt-5 rounded-2xl bg-black/40 px-4 py-3 text-[11px] text-slate-400/90">
                XPOT and XPOT.bet are experimental crypto products. Only use
                funds you can afford to lose and always double-check contract
                addresses.
              </p>
            </aside>
          </div>
        </section>

        {/* BODY SECTIONS – calm, prose-like */}

        {/* How the draw works */}
        <section className="mx-auto mt-12 max-w-3xl text-sm text-slate-200/90">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            How the XPOT draw works
          </h2>

          <p className="mt-4">
            Each draw selects a single winning ticket out of all valid entries.
            Every ticket is linked to one X account and one wallet at the time
            of entry.
          </p>

          <div className="mt-4 space-y-2">
            <p>
              <span className="font-medium text-slate-100">1.</span> You sign in
              with X on XPOT.bet.
            </p>
            <p>
              <span className="font-medium text-slate-100">2.</span> You connect
              a wallet that holds at least the minimum XPOT balance.
            </p>
            <p>
              <span className="font-medium text-slate-100">3.</span> You claim
              one ticket for the current draw – one ticket per X account.
            </p>
            <p>
              <span className="font-medium text-slate-100">4.</span> When the
              draw closes, one ticket is selected as the winner.
            </p>
            <p>
              <span className="font-medium text-slate-100">5.</span> The winner
              can claim the jackpot within the published claim window.
            </p>
          </div>
        </section>

        {/* Entry requirements */}
        <section className="mx-auto mt-10 max-w-3xl text-sm text-slate-200/90">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Entry requirements
          </h2>
          <p className="mt-4">
            To keep entries fair and limit spam, XPOT uses three simple
            requirements:
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#26242a] bg-[#070811] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                X account
              </p>
              <p className="mt-2">
                You must sign in with X. Your X handle is what the winning
                ticket will display.
              </p>
            </div>
            <div className="rounded-2xl border border-[#26242a] bg-[#070811] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Wallet connection
              </p>
              <p className="mt-2">
                You connect a wallet on the supported network. This is where
                XPOT is held and where jackpots are paid out.
              </p>
            </div>
            <div className="rounded-2xl border border-[#26242a] bg-[#070811] px-4 py-3 sm:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Minimum XPOT balance
              </p>
              <p className="mt-2">
                Your wallet must hold at least the published minimum XPOT amount
                at the moment you enter the draw. If the balance drops later,
                your ticket remains valid for that round, but you will need the
                minimum XPOT again to enter a future draw.
              </p>
            </div>
          </div>
        </section>

        {/* Quick questions */}
        <section className="mx-auto mt-10 max-w-3xl text-sm text-slate-200/90">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Quick questions
          </h2>

          <div className="mt-4 space-y-4">
            <div>
              <p className="font-medium text-slate-100">
                Is XPOT a guarantee of winning?
              </p>
              <p className="mt-1 text-sm">
                No. XPOT lets you join the draw when you meet the requirements,
                but only one ticket wins each round.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-100">
                Can I sell my XPOT after I enter a draw?
              </p>
              <p className="mt-1 text-sm">
                The requirement is checked when you enter. Selling later does
                not retroactively cancel your ticket for that draw, but you will
                need the minimum XPOT again to enter a future draw.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-100">
                Does XPOT or XPOT.bet ever post from my X account?
              </p>
              <p className="mt-1 text-sm">
                No. Sign in with X is used only to confirm which account owns
                the ticket. Posting is always optional.
              </p>
            </div>
          </div>
        </section>

        {/* Safety disclaimer */}
        <section className="mx-auto mt-10 max-w-3xl rounded-2xl border border-[#26242a] bg-[#070811] px-4 py-4 text-[11px] text-slate-400/90">
          XPOT and XPOT.bet are experimental crypto products. Do not buy XPOT
          with money you cannot afford to lose. Nothing on this page is
          financial advice or a guarantee of returns. Always double-check
          contract addresses and only use official links shared by the XPOT
          team.
        </section>

        {/* Final CTA */}
        <section className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Ready to see if you qualify for the next draw?
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-amber-300 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_24px_rgba(251,191,36,0.4)] hover:bg-amber-200"
            >
              Enter today&apos;s draw
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-[#3b352a] bg-black/40 px-4 py-2 text-xs font-medium text-slate-100 hover:border-[#575047] hover:bg-black/70"
            >
              Go to dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
