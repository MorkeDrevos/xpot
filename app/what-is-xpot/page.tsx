import Link from 'next/link';

export default function WhatIsXpotPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col px-4 pb-20 pt-8 sm:px-6 lg:px-8">
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
            <span>XPOT Guide</span>
          </div>
        </header>

        {/* Hero card – premium explainer */}
        <section className="relative mx-auto max-w-3xl overflow-hidden rounded-[32px] border border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950/95 to-black px-6 pb-8 pt-7 shadow-[0_40px_160px_rgba(0,0,0,0.9)]">
          {/* Soft glow */}
          <div className="pointer-events-none absolute inset-px rounded-[30px] bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.08),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.08),transparent_55%)]" />

          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
              What is XPOT?
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl md:text-[32px]">
              XPOT is your entry key to the crypto jackpot draw
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              XPOT is the token the XPOT.bet draw revolves around. Hold the minimum XPOT balance,
              connect your wallet and sign in with X – then your X account can claim one ticket for
              the current draw.
            </p>

            {/* 3-step strip */}
            <div className="mt-5 grid gap-4 text-sm text-slate-200 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  1. Hold XPOT
                </p>
                <p className="mt-1 text-sm text-slate-100">
                  Keep at least the minimum XPOT balance in your connected wallet.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  2. Sign in with X
                </p>
                <p className="mt-1 text-sm text-slate-100">
                  Your X account is used to issue exactly one ticket per draw.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  3. Claim your ticket
                </p>
                <p className="mt-1 text-sm text-slate-100">
                  If you meet the requirements, you can generate a ticket and join the jackpot.
                </p>
              </div>
            </div>

            {/* Disclaimer + primary / secondary CTAs */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4 text-xs text-slate-400">
              <p className="max-w-xs leading-relaxed">
                XPOT is not an investment recommendation. It is a utility token used inside the
                XPOT.bet draw mechanic.
              </p>

              <div className="flex flex-wrap gap-2">
                {/* Primary – send them to main entry flow */}
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-[11px] font-semibold text-slate-950 shadow shadow-sky-500/40 hover:bg-sky-400"
                >
                  Enter today&apos;s draw
                </Link>

                {/* Secondary – dashboard */}
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

        {/* Content sections */}
        <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-10 text-sm text-slate-300">
          {/* How it works */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              How the XPOT draw works
            </h2>
            <p className="mt-3 text-sm leading-relaxed">
              Each draw selects a single winning ticket out of all valid entries. Every ticket is
              linked to one X account and one wallet at the time of entry.
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">
              <li>• You sign in with X on XPOT.bet.</li>
              <li>• You connect a wallet that holds at least the minimum XPOT balance.</li>
              <li>• You claim one ticket for the current draw – one ticket per X account.</li>
              <li>• When the draw closes, one ticket is selected as the winner.</li>
              <li>• The winner can claim the jackpot within the published claim window.</li>
            </ul>
          </section>

          {/* Requirements */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Entry requirements
            </h2>
            <p className="mt-3 text-sm leading-relaxed">
              To keep entries fair and limit spam, XPOT uses three simple requirements:
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  X account
                </p>
                <p className="mt-1 text-sm leading-relaxed">
                  You must sign in with X. Your X handle is what the winning ticket will show.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Wallet connection
                </p>
                <p className="mt-1 text-sm leading-relaxed">
                  You connect a wallet on the supported network. This is where XPOT is held and
                  where jackpots are paid out.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Minimum XPOT balance
                </p>
                <p className="mt-1 text-sm leading-relaxed">
                  Your wallet must hold at least the published minimum XPOT amount at the moment
                  you enter the draw. If the balance drops later, the ticket stays valid for that
                  draw.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  One ticket per draw
                </p>
                <p className="mt-1 text-sm leading-relaxed">
                  Each X account can claim exactly one ticket per draw. New draw – new chance.
                </p>
              </div>
            </div>
          </section>

          {/* FAQ style block */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Quick questions
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed">
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
                  No. Sign in with X is used only to confirm which account owns the ticket.
                  Posting is always optional.
                </p>
              </div>
            </div>
          </section>

          {/* Safety / disclaimer */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4 text-[11px] leading-relaxed text-slate-400">
            XPOT and XPOT.bet are experimental crypto products. Do not buy XPOT with money you
            cannot afford to lose. Nothing on this page is financial advice or a guarantee of
            returns. Always double check contract addresses and only use official links shared by
            the XPOT team.
          </section>

          {/* Final CTA strip */}
          <section className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-900 pt-4">
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
