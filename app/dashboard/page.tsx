{/* Today's result (preview) */}
<article className="premium-card border-b border-slate-900/60 px-4 pb-5 pt-3">
  <h2 className="text-sm font-semibold text-slate-200">
    Today’s result
  </h2>

  {!walletConnected ? (
    // No wallet yet
    <p className="mt-3 text-sm text-slate-300">
      Connect your wallet and claim today’s ticket to join the draw.
      Once the countdown hits zero, today’s winning ticket will appear here.
    </p>
  ) : myTickets.length === 0 ? (
    // Wallet connected but no ticket
    <p className="mt-3 text-sm text-slate-300">
      You haven’t claimed a ticket for today’s draw yet. Claim your ticket
      above to enter. The result will appear here when the timer hits zero.
    </p>
  ) : winner ? (
    // (Later) when you actually mark a winner in the DB
    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-slate-200">
          One ticket{' '}
          <span className="font-mono text-emerald-300">
            {winner.code}
          </span>{' '}
          hit today’s jackpot (preview).
        </p>
        <p className="mt-1 text-xs text-slate-400">
          In the real draw, this will show the winning ticket and wallet
          once the countdown reaches zero.
        </p>
      </div>
    </div>
  ) : (
    // Wallet + ticket, but draw not resolved yet
    <p className="mt-3 text-sm text-slate-300">
      Your ticket is in today’s draw. The result will appear here when
      the timer hits zero.
    </p>
  )}
</article>
