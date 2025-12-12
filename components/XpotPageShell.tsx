  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <XpotPageShell>
      <WalletDebug />

      {/* Top header - same vibe as admin */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/img/xpot-logo-light.png"
              alt="XPOT"
              width={132}
              height={36}
              priority
            />
          </Link>

          <span className="rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
            Holder dashboard
          </span>

          <span className="hidden sm:inline-flex">
            <StatusPill tone="emerald">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse" />
              Live
            </StatusPill>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:justify-end">
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/70 px-4 py-2 text-xs text-slate-200 hover:bg-slate-900/70"
          >
            <Sparkles className="h-4 w-4" />
            Home
          </Link>

          <Link
            href="/dashboard/history"
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/70 px-4 py-2 text-xs text-slate-200 hover:bg-slate-900/70"
          >
            <History className="h-4 w-4" />
            History
          </Link>

          <div className="hidden sm:block">
            <WalletMultiButton className="!h-10 !rounded-full !px-4 !text-sm" />
          </div>

          <SignOutButton redirectUrl="/dashboard">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/70 px-4 py-2 text-xs text-slate-200 hover:bg-slate-900/70"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </SignOutButton>
        </div>
      </header>

      {/* Mobile wallet row */}
      <div className="mt-4 sm:hidden">
        <div className="rounded-[24px] border border-slate-900/70 bg-slate-950/60 px-4 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Wallet
            </p>
            <StatusPill tone="slate">
              <Wallet className="h-3.5 w-3.5" />
              {walletConnected ? 'Connected' : 'Not connected'}
            </StatusPill>
          </div>
          <div className="mt-3">
            <WalletMultiButton className="w-full !h-10 !rounded-full !text-sm" />
            <WalletStatusHint />
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* LEFT */}
        <div className="space-y-4">
          {/* Identity + eligibility band */}
          <section className="relative overflow-hidden rounded-[30px] border border-slate-900/70 bg-transparent shadow-[0_32px_110px_rgba(15,23,42,0.85)] backdrop-blur-xl">
            <div className="pointer-events-none absolute -inset-28 bg-[radial-gradient(circle_at_5%_0%,rgba(59,130,246,0.40),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(129,140,248,0.40),transparent_58%)] opacity-85" />

            <div className="relative z-10 px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 overflow-hidden rounded-full border border-slate-700/70 bg-slate-900/70">
                    {avatar ? (
                      <Image
                        src={avatar}
                        alt={handle || 'X avatar'}
                        width={44}
                        height={44}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                        <X className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  <div className="leading-tight">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-slate-50">
                        {name || 'XPOT user'}
                      </p>
                      <StatusPill tone="emerald">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        X identity linked
                      </StatusPill>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      {handle ? (
                        <a
                          href={`https://x.com/${handle}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:text-emerald-300"
                        >
                          <X className="h-3.5 w-3.5" />
                          @{handle}
                          <ArrowRight className="h-3.5 w-3.5 opacity-60" />
                        </a>
                      ) : (
                        <span className="text-amber-300">
                          X handle not detected yet
                        </span>
                      )}

                      {currentWalletAddress && (
                        <>
                          <span className="text-slate-600">·</span>
                          <span className="font-mono text-slate-200">
                            {shortWallet(currentWalletAddress)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <StatusPill tone={walletConnected ? 'sky' : 'slate'}>
                      <Wallet className="h-3.5 w-3.5" />
                      {walletConnected ? 'Wallet connected' : 'Wallet required'}
                    </StatusPill>

                    {walletConnected && typeof xpotBalance === 'number' && (
                      <StatusPill tone={hasRequiredXpot ? 'emerald' : 'amber'}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {hasRequiredXpot ? 'Eligible' : 'Not eligible'}
                      </StatusPill>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400">
                    XPOT checks eligibility only when you request today’s ticket.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    XPOT balance
                  </p>
                  <p className="mt-1 font-mono text-sm text-slate-100">
                    {xpotBalance === null
                      ? walletConnected
                        ? 'Checking…'
                        : '–'
                      : xpotBalance === 'error'
                      ? 'Unavailable'
                      : `${Math.floor(xpotBalance).toLocaleString()} XPOT`}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Minimum: {REQUIRED_XPOT.toLocaleString()} XPOT
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    Today’s status
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">
                    {ticketClaimed ? 'Ticket in draw' : 'Not entered yet'}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    One ticket per wallet per draw.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    Privacy
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">
                    Handle shown, wallet hidden
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Winners are revealed by X handle, not wallet.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Today’s ticket - premium action card */}
          <section className="relative overflow-hidden rounded-[30px] border border-slate-900/70 bg-transparent shadow-[0_32px_110px_rgba(15,23,42,0.85)] backdrop-blur-xl">
            <div className="pointer-events-none absolute -inset-28 bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.22),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(236,72,153,0.22),transparent_55%)] opacity-80" />

            <div className="relative z-10 space-y-4 px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-50">
                    Today’s entry
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Your wallet must hold at least{' '}
                    <span className="font-semibold text-emerald-200">
                      {REQUIRED_XPOT.toLocaleString()} XPOT
                    </span>{' '}
                    at the exact moment you request the ticket.
                  </p>
                </div>

                <StatusPill tone={ticketClaimed ? 'emerald' : 'slate'}>
                  <Ticket className="h-3.5 w-3.5" />
                  {ticketClaimed ? 'Entered' : 'Not entered'}
                </StatusPill>
              </div>

              {ticketsError && (
                <p className="text-xs text-amber-300">{ticketsError}</p>
              )}

              {!ticketClaimed ? (
                <div className="rounded-[24px] border border-slate-800/80 bg-slate-950/80 px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-200">
                        Get your ticket for today’s draw.
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Your entry is issued by the backend and bound to your
                        wallet.
                      </p>

                      {claiming && (
                        <p className="mt-2 text-[11px] text-emerald-300 animate-pulse">
                          Verifying wallet - Checking XPOT - Issuing ticket…
                        </p>
                      )}

                      {!walletConnected && (
                        <p className="mt-2 text-[11px] text-amber-300">
                          Connect your wallet to request the ticket.
                        </p>
                      )}

                      {claimError && (
                        <p className="mt-2 text-[11px] text-amber-300">
                          {claimError}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleClaimTicket}
                      disabled={!walletConnected || claiming || loadingTickets}
                      className={`${BTN_PRIMARY} px-7 py-3 text-sm`}
                    >
                      {claiming ? 'Generating…' : 'Get today’s ticket'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-[24px] border border-emerald-500/30 bg-emerald-500/5 px-4 py-4 shadow-[0_0_30px_rgba(16,185,129,0.18)]">
                  <p className="text-sm font-semibold text-emerald-100">
                    ✅ Your ticket is in the draw.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Keep your wallet self-custodied. Come back after the draw to
                    see results.
                  </p>

                  {todaysTicket?.code && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                          Ticket code
                        </p>
                        <p className="mt-1 font-mono text-lg text-emerald-200">
                          {todaysTicket.code}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          todaysTicket && handleCopy(todaysTicket)
                        }
                        className={`${BTN_UTILITY} px-4 py-2 text-xs`}
                      >
                        <Copy className="h-4 w-4" />
                        {copiedId === todaysTicket.id ? 'Copied' : 'Copy code'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-slate-800/80 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Today’s result
                </p>

                {!walletConnected ? (
                  <p className="mt-2 text-sm text-slate-300">
                    Connect your wallet and request a ticket to join the draw.
                  </p>
                ) : myTickets.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-300">
                    You haven’t entered today yet. Request the ticket above.
                  </p>
                ) : winner ? (
                  iWonToday ? (
                    <div className="mt-3 rounded-2xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 shadow-[0_0_30px_rgba(16,185,129,0.35)]">
                      <p className="text-sm font-semibold text-emerald-100">
                        🎉 You hit today’s XPOT.
                      </p>
                      <p className="mt-1 text-xs text-emerald-50">
                        Winning ticket:{' '}
                        <span className="font-mono text-emerald-200">
                          {winner.code}
                        </span>
                      </p>
                      <p className="mt-2 text-[11px] text-emerald-100/90">
                        Claim flow will appear here once payouts are wired
                        end-to-end.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3">
                      <p className="text-sm text-slate-200">
                        Today’s winning ticket is{' '}
                        <span className="font-mono text-emerald-300">
                          {winner.code}
                        </span>
                        .
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Winner handle + claim status will display here in the
                        full version.
                      </p>
                    </div>
                  )
                ) : (
                  <p className="mt-2 text-sm text-slate-300">
                    Your ticket is in the draw. The winning ticket will appear
                    after draw execution.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Your tickets - ultra clean list */}
          <section className="rounded-[30px] border border-slate-900/70 bg-transparent px-5 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.85)] backdrop-blur-xl sm:px-6 sm:py-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Your tickets
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Tickets associated with your connected wallet.
                </p>
              </div>

              {walletConnected ? (
                <StatusPill tone="sky">
                  <Wallet className="h-3.5 w-3.5" />
                  {shortWallet(currentWalletAddress || '')}
                </StatusPill>
              ) : (
                <StatusPill tone="slate">
                  <Wallet className="h-3.5 w-3.5" />
                  Connect wallet
                </StatusPill>
              )}
            </div>

            <div className="mt-4 border-t border-slate-800/80">
              {!walletConnected ? (
                <p className="py-4 text-xs text-slate-500">
                  Connect your wallet to view your tickets.
                </p>
              ) : myTickets.length === 0 ? (
                <p className="py-4 text-xs text-slate-500">
                  No tickets found for this wallet today.
                </p>
              ) : (
                <div className="divide-y divide-slate-800/70">
                  {myTickets.map(entry => (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm text-slate-100">
                            {entry.code}
                          </span>

                          {entry.status === 'in-draw' && (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-emerald-300">
                              In draw
                            </span>
                          )}
                          {entry.status === 'won' && (
                            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-amber-200">
                              Won
                            </span>
                          )}
                          {entry.status === 'claimed' && (
                            <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-sky-200">
                              Claimed
                            </span>
                          )}
                          {entry.status === 'expired' && (
                            <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-300">
                              Expired
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500">
                          Created {formatDateTime(entry.createdAt)} - {entry.label}
                        </p>

                        <p className="text-[11px] text-slate-500">
                          Wallet{' '}
                          <span className="font-mono text-slate-300">
                            {shortWallet(entry.walletAddress)}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(entry)}
                          className={`${BTN_UTILITY} px-4 py-2 text-xs`}
                        >
                          <Copy className="h-4 w-4" />
                          {copiedId === entry.id ? 'Copied' : 'Copy code'}
                        </button>

                        <button
                          type="button"
                          className={`${BTN_UTILITY} px-4 py-2 text-xs opacity-60`}
                          disabled
                        >
                          View entry tweet (soon)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT */}
        <div className="space-y-4 lg:max-w-[640px]">
          {/* Wallet cockpit card */}
          <section className="relative overflow-hidden rounded-[24px] border border-slate-900/70 bg-transparent px-5 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),transparent_55%),radial-gradient(circle_at_80%_120%,rgba(34,197,94,0.14),transparent_55%)] opacity-80" />

            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white tracking-wide">
                    Wallet cockpit
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Connect, verify, then request today’s ticket.
                  </p>
                </div>

                <StatusPill tone={walletConnected ? 'emerald' : 'slate'}>
                  <Wallet className="h-3.5 w-3.5" />
                  {walletConnected ? 'Connected' : 'Disconnected'}
                </StatusPill>
              </div>

              <div className="mt-4">
                <WalletMultiButton className="w-full !h-11 !rounded-full !text-sm" />
                <WalletStatusHint />
              </div>

              {publicKey && (
                <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3 text-xs">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    Connected wallet
                  </p>
                  <p className="mt-1 break-all font-mono text-[11px] text-slate-200">
                    {publicKey.toBase58()}
                  </p>

                  <div className="mt-3 grid gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">XPOT balance</span>
                      <span className="font-mono text-slate-100">
                        {xpotBalance === null
                          ? 'Checking…'
                          : xpotBalance === 'error'
                          ? 'Unavailable'
                          : `${Math.floor(xpotBalance).toLocaleString()} XPOT`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Eligibility</span>
                      <span
                        className={`font-semibold ${
                          typeof xpotBalance === 'number'
                            ? hasRequiredXpot
                              ? 'text-emerald-300'
                              : 'text-amber-300'
                            : 'text-slate-400'
                        }`}
                      >
                        {typeof xpotBalance === 'number'
                          ? hasRequiredXpot
                            ? 'Eligible'
                            : 'Not eligible'
                          : '—'}
                      </span>
                    </div>
                  </div>

                  {connected && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await disconnect();
                          window.location.reload();
                        } catch (err) {
                          console.error('Failed to disconnect wallet', err);
                        }
                      }}
                      className="mt-4 w-full rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-200 hover:bg-slate-900/60"
                    >
                      Disconnect wallet
                    </button>
                  )}
                </div>
              )}

              <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3 text-[11px] text-slate-400">
                XPOT uses X as identity. Wallet stays self-custodied. We only read
                public balance to verify eligibility.
              </div>
            </div>
          </section>

          {/* Recent winners - clean terminal vibe */}
          <section className="relative overflow-hidden rounded-[24px] border border-slate-900/70 bg-transparent px-5 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.14),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(236,72,153,0.12),transparent_55%)] opacity-80" />

            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white tracking-wide">
                    Recent winners
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Latest payouts and handles (global).
                  </p>
                </div>

                <Link
                  href="/dashboard/history"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/60 px-4 py-2 text-xs text-slate-200 hover:bg-slate-900/70"
                >
                  View history
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-4 border-t border-slate-800/80 pt-4">
                {loadingWinners && (
                  <p className="text-xs text-slate-500">Loading records…</p>
                )}

                {winnersError && (
                  <p className="text-xs text-amber-300">{winnersError}</p>
                )}

                {!loadingWinners && !winnersError && recentWinners.length === 0 && (
                  <p className="rounded-2xl bg-slate-950/70 px-4 py-3 text-xs text-slate-500">
                    No completed draws yet. As soon as XPOT starts, winners will
                    appear here.
                  </p>
                )}

                {!loadingWinners && recentWinners.length > 0 && (
                  <div className="space-y-2">
                    {recentWinners.map(w => (
                      <article
                        key={w.id}
                        className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                              {formatDate(w.drawDate)}
                            </p>
                            <p className="mt-1 font-mono text-sm text-slate-100">
                              {w.ticketCode}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              Jackpot{' '}
                              <span className="font-semibold text-emerald-300">
                                ${Number(w.jackpotUsd ?? 0).toLocaleString()}
                              </span>
                            </p>
                          </div>

                          <div className="text-right">
                            {w.handle ? (
                              <a
                                href={`https://x.com/${w.handle}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-300 hover:text-emerald-200"
                              >
                                <X className="h-3.5 w-3.5" />
                                @{w.handle}
                              </a>
                            ) : (
                              <p className="text-[11px] text-slate-500">
                                Handle soon
                              </p>
                            )}
                            <p className="mt-1 text-[10px] text-slate-600">
                              {shortWallet(w.walletAddress)}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Draw history preview (wallet-specific) */}
          <section className="rounded-[24px] border border-slate-900/70 bg-transparent px-5 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.9)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-white tracking-wide">
                  Your draw history
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Past entries for your connected wallet.
                </p>
              </div>

              <Link href="/dashboard/history" className={`${BTN_UTILITY} px-4 py-2 text-xs`}>
                <History className="h-4 w-4" />
                Full history
              </Link>
            </div>

            <div className="mt-4 border-t border-slate-800/80 pt-4">
              {!publicKey && (
                <p className="text-xs text-slate-500">
                  Connect your wallet to see your ticket history.
                </p>
              )}

              {publicKey && (
                <>
                  {loadingHistory && (
                    <p className="text-xs text-slate-500">Loading history…</p>
                  )}

                  {!loadingHistory && historyEntries.length === 0 && (
                    <p className="rounded-2xl bg-slate-950/70 px-4 py-3 text-xs text-slate-500">
                      No previous draws yet for this wallet.
                    </p>
                  )}

                  {!loadingHistory && historyEntries.length > 0 && (
                    <div className="space-y-2">
                      {historyEntries.slice(0, 5).map(entry => (
                        <article
                          key={entry.id}
                          className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                                {formatDate(entry.createdAt)}
                              </p>
                              <p className="mt-1 font-mono text-sm text-slate-100">
                                {entry.code}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-500">
                                {entry.label}
                              </p>
                            </div>

                            <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-200">
                              {entry.status.replace('-', ' ').toUpperCase()}
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {historyError && (
                    <p className="mt-2 text-xs text-amber-300">{historyError}</p>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </section>

      {/* Footer micro copy */}
      <section className="mt-6 grid gap-4 border-t border-slate-800/70 pt-5 text-[12px] text-slate-400 sm:grid-cols-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Transparent by design
          </p>
          <p className="mt-1 leading-relaxed">
            Entries and payouts are verifiable. When TX links are live, you can
            audit everything.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            No ticket sales
          </p>
          <p className="mt-1 leading-relaxed">
            Tickets are free. Holding XPOT is what qualifies you for the daily
            pool.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            X-native identity
          </p>
          <p className="mt-1 leading-relaxed">
            Winners are revealed by handle, not wallet. Your custody stays yours.
          </p>
        </div>
      </section>
    </XpotPageShell>
  );
}
