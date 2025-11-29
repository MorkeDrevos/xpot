import Link from 'next/link';

export default function WhatIsXpotPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#020617] via-[#020814] to-black text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        {/* Top nav / back + guide */}
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-100"
          >
            <span className="rounded-full bg-slate-900/80 px-2 py-1 text-[10px] border border-slate-700/70">
              ← Back
            </span>
            <span className="hidden sm:inline">Return to XPOT dashboard</span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-slate-950/80 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-emerald-200/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
            <span>XPOT Guide</span>
          </div>
        </header>

        {/* HERO – premium card */}
        <section className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-slate-800/90 bg-[#020918] shadow-[0_40px_160px_rgba(0,0,0,0.85)]">
          {/* Soft finance-style gradient frame */}
          <div className="pointer-events-none absolute inset-px rounded-[30px] bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.10),transparent_55%),radial-gradient(circle_at_110%_0%,rgba(16,185,129,0.12),transparent_55%),radial-gradient(circle_at_50%_120%,rgba(15,118,110,0.25),transparent_55%)] opacity-80" />
          
          <div className="relative grid gap-10 px-7 pb-8 pt-7 lg:grid-cols-[1.6fr,1.1fr] lg:px-10 lg:pb-10 lg:pt-8">
            {/* LEFT – Story + steps */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/85">
                What is XPOT?
              </p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-[32px]">
                XPOT is your entry key to the crypto jackpot draw
              </h1>
              <p className="mt-3 max-w-xl text-sm text-slate-300/90">
                XPOT is the token the XPOT.bet draw revolves around. Hold the minimum XPOT balance,
                connect your wallet and sign in with X – then your X account can claim one ticket
                for the current draw.
              </p>

              {/* 3-step strip */}
              <div className="mt-6 grid gap-4 text-sm text-slate-200 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-800/90 bg-slate-950/70 px-3.5 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    1. Hold XPOT
                  </p>
                  <p className="mt-1 text-[13px] text-slate-100">
                    Keep at least the minimum XPOT balance in your connected wallet.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800/90 bg-slate-950/70 px-3.5 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    2. Sign in with X
                  </p>
                  <p className="mt-1 text-[13px] text-slate-100">
                    Your X account is used to issue exactly one ticket per draw.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800/90 bg-slate-950/70 px-3.5 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    3. Claim your ticket
                  </p>
                  <p className="mt-1 text-[13px] text-slate-100">
                    If you meet the requirements, you can generate a ticket and join the jackpot.
                  </p>
                </div>
              </div>

              {/* Hero CTAs + disclaimer */}
              <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4 text-[11px] text-slate-400">
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

            {/* RIGHT – “At a glance” / trust panel */}
            <aside className="rounded-[26px] border border-slate-800/90 bg-slate-950/75 px-4.5 py-4 sm:px-5 sm:py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                At a glance
              </p>

              <div className="mt-3 space-y-3 text-[13px]">
                <div>
                  <p className="flex items-center gap-2 text-slate-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                    <span className="font-medium">One ticket per X account</span>
                  </p>
                  <p className="mt-1 text-slate-300/90">
                    Each draw, your X handle can claim exactly one ticket – no spam, no multi-account
                    farming.
                  </p>
                </div>

                <div>
                  <p className="flex items-center gap-2 text-slate-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/90" />
                    <span className="font-medium">Wallet-based eligibility</span>
                  </p>
                  <p className="mt-1 text-slate-300/90">
                    Your wallet must hold at least the minimum XPOT balance at the moment you enter
                    the draw.
                  </p>
                </div>

                <div>
                  <p className="flex items-center gap-2 text-slate-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400/90" />
                    <span className="font-medium">No posts from your X account</span>
                  </p>
                  <p className="mt-1 text-slate-300/90">
                    Sign in with X is used only to confirm identity for the ticket. Posting is always
                    optional.
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-3 py-3 text-[11px] text-slate-400">
                  XPOT and XPOT.bet are experimental crypto products. Only use funds you can afford
                  to lose and always double-check contract addresses.
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* TRUST STRIP – why it feels fair */}
        <section className="mx-auto mt-10 max-w-4xl rounded-3xl border border-slate-900/80 bg-slate-950/60 px-5 py-4 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Why XPOT feels fair
            </p>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/90 px-3 py-1 text-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Clear one-ticket-per-account rule
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/90 px-3 py-1 text-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                Wallet + XPOT balance required
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/90 px-3 py-1 text-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                No auto-posting from your X account
              </span>
            </div>
          </div>
        </section>

        {/* BODY CONTENT */}
        <div className="mx-auto mt-10 flex max-w-4xl flex-col gap-8 text-sm text-slate-300">
          {/* How it works */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              How the XPOT draw works
            </h2>
            <p className="mt-3 text-sm">
              Each draw selects a single winning ticket out of all valid entries. Every ticket is
              linked to one X account and one wallet at the time of entry.
            </p>
            <ul className="mt-3 space-y-2 text-sm">
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
            <p className="mt-3 text-sm">
              To keep entries fair and limit spam, XPOT uses three simple requirements:
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  X account
                </p>
                <p className="mt-1 text-sm">
                  You must sign in with X. Your X handle is what the winning ticket will show.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Wallet connection
                </p>
                <p className="mt-1 text-sm">
                  You connect a wallet on the supported network. This is where XPOT is held and
                  where jackpots are paid out.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Minimum XPOT balance
                </p>
                <p className="mt-1 text-sm">
                  Your wallet must hold at least the published minimum XPOT amount at the moment
                  you enter the draw. If the balance drops later, the ticket stays valid for that
                  draw.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  One ticket per draw
                </p>
                <p className="mt-1 text-sm">
                  Each X account can claim exactly one ticket per draw. New draw – new chance.
                </p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Quick questions
            </h2>
            <div className="mt-3 space-y-3 text-sm">
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
          <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-[11px] text-slate-400">
            XPOT and XPOT.bet are experimental crypto products. Do not buy XPOT with money you
            cannot afford to lose. Nothing on this page is financial advice or a guarantee of
            returns. Always double-check contract addresses and only use official links shared by
            the XPOT team.
          </section>

          {/* Final CTA row */}
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
