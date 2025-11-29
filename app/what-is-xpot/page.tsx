import Link from 'next/link';

export default function WhatIsXpotPage() {
  return (
    <main className="min-h-screen bg-[#020616] text-slate-50">
      {/* Glow backdrop */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.28),transparent_55%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.22),transparent_55%)] opacity-70" />
      
      <div className="relative mx-auto flex max-w-6xl flex-col px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        {/* Top bar */}
        <header className="mb-10 flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-100"
          >
            <span className="rounded-full bg-slate-900/80 px-2 py-1 text-[10px]">← Back</span>
            <span className="hidden sm:inline">Return to XPOT dashboard</span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-slate-950/80 px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-emerald-300/90">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            <span>XPOT key facts</span>
          </div>
        </header>

        {/* HERO SECTION – clean split layout */}
        <section className="mb-14 grid items-start gap-10 md:grid-cols-[minmax(0,3.2fr)_minmax(0,2.3fr)]">
          {/* Left: main story */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300/90">
              What is XPOT
            </p>
            <h1 className="mt-3 text-[2.4rem] font-semibold leading-tight tracking-tight sm:text-[2.7rem]">
              XPOT is your entry key
              <br />
              to the crypto jackpot draw
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-300/90">
              XPOT is the token the XPOT.bet draw revolves around. Hold the minimum XPOT balance,
              connect your wallet and sign in with X – then your X account can claim one ticket for
              the current draw.
            </p>

            {/* Three “pillars” row */}
            <div className="mt-7 grid gap-4 text-sm sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/80 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  One ticket per X
                </p>
                <p className="mt-2 text-[13px] text-slate-200">
                  Each draw, your X handle can claim exactly one ticket. No ticket farming.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/80 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Wallet-based entry
                </p>
                <p className="mt-2 text-[13px] text-slate-200">
                  Your wallet must hold at least the minimum XPOT balance when you enter.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/80 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  No auto posting
                </p>
                <p className="mt-2 text-[13px] text-slate-200">
                  XPOT.bet never posts from your X account automatically. Posting is always
                  optional.
                </p>
              </div>
            </div>

            {/* Primary CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-2.5 text-[13px] font-semibold text-slate-950 shadow-lg shadow-sky-500/35 hover:bg-sky-400"
              >
                Enter today&apos;s draw
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-950/70 px-6 py-2.5 text-[13px] font-medium text-slate-100 hover:border-slate-400 hover:bg-slate-900"
              >
                Go to dashboard
              </Link>
            </div>
          </div>

          {/* Right: “Trust column” – feels like a bank factsheet */}
          <aside className="rounded-3xl border border-slate-800/80 bg-slate-950/90 px-5 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.9)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              At a glance
            </p>

            <div className="mt-4 space-y-4 text-[13px] text-slate-200">
              <div>
                <p className="font-medium text-slate-50">Clear rules</p>
                <p className="mt-1 text-slate-300">
                  Each ticket is tied to one X account and one wallet at the time of entry.
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-50">Eligibility at entry</p>
                <p className="mt-1 text-slate-300">
                  Your XPOT balance is checked when you enter. For that round, your ticket stays
                  valid.
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-50">Identity, not access</p>
                <p className="mt-1 text-slate-300">
                  Sign in with X is used to confirm who owns the ticket. It does not give XPOT.bet
                  control of your account.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-950 px-4 py-3 text-[11px] text-slate-400">
              XPOT and XPOT.bet are experimental crypto products. Only use funds you can afford to
              lose and always double-check contract addresses.
            </div>
          </aside>
        </section>

        {/* SECTION: How the draw works – vertical timeline */}
        <section className="mb-12 grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2.5fr)]">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              How the XPOT draw works
            </h2>

            <ol className="mt-5 space-y-5 border-l border-slate-800/70 pl-5 text-sm text-slate-200">
              {[
                'You sign in with X on XPOT.bet.',
                'You connect a wallet that holds at least the minimum XPOT balance.',
                'You claim one ticket for the current draw – one ticket per X account.',
                'When the draw closes, one ticket is selected as the winner.',
                'The winner can claim the jackpot within the published claim window.',
              ].map((step, idx) => (
                <li key={idx} className="relative">
                  <span className="absolute -left-[11px] top-[6px] h-2.5 w-2.5 rounded-full border border-emerald-300 bg-emerald-500 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Small “Why this feels fair” strip */}
          <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 px-5 py-5 text-sm text-slate-200">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Why XPOT feels fair
            </h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-[13px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>One-ticket-per-account rule keeps spam and multi-account farming out.</span>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                <span>XPOT balance requirement aligns entries with the token itself.</span>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                <span>No automatic posting protects your X presence and reputation.</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Entry requirements – 4 cards */}
        <section className="mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Entry requirements
          </h2>
          <p className="mt-3 text-sm text-slate-300">
            To keep entries fair and limit spam, XPOT uses three simple requirements:
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                X account
              </p>
              <p className="mt-2 text-sm text-slate-200">
                You must sign in with X. Your X handle is what the winning ticket will show.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Wallet connection
              </p>
              <p className="mt-2 text-sm text-slate-200">
                You connect a wallet on the supported network. This is where XPOT is held and where
                jackpots are paid out.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Minimum XPOT balance
              </p>
              <p className="mt-2 text-sm text-slate-200">
                Your wallet must hold at least the published minimum XPOT amount at the moment you
                enter the draw. If the balance drops later, the ticket stays valid for that draw.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                One ticket per draw
              </p>
              <p className="mt-2 text-sm text-slate-200">
                Each X account can claim exactly one ticket per draw. New draw – new chance.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: Quick questions */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Quick questions
          </h2>
          <div className="mt-4 space-y-5 text-sm">
            <div>
              <p className="font-medium text-slate-100">Is XPOT a guarantee of winning?</p>
              <p className="mt-1 text-slate-300">
                No. XPOT lets you join the draw when you meet the requirements, but only one ticket
                wins each round.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-100">Can I sell my XPOT after I enter a draw?</p>
              <p className="mt-1 text-slate-300">
                The requirement is checked when you enter. Selling later does not retroactively
                cancel your ticket for that draw, but you will need the minimum XPOT again to enter
                a future draw.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-100">
                Does XPOT or XPOT.bet ever post from my X account?
              </p>
              <p className="mt-1 text-slate-300">
                No. Sign in with X is used only to confirm which account owns the ticket. Posting is
                always optional.
              </p>
            </div>
          </div>
        </section>

        {/* Final disclaimer + CTA row */}
        <section className="space-y-5">
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
    </main>
  );
}
