{/* ✅ Redesigned top: calmer, fewer boxes, more proof-driven */}
<section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
  <div className="relative overflow-hidden border-b border-white/5 bg-black">
    {/* ambient premium purple/gold wash */}
    <div
      className="
        pointer-events-none absolute inset-0
        bg-[radial-gradient(circle_at_18%_22%,rgba(168,85,247,0.18),transparent_62%),
            radial-gradient(circle_at_78%_34%,rgba(56,189,248,0.10),transparent_66%),
            radial-gradient(circle_at_55%_0%,rgba(var(--xpot-gold),0.12),transparent_58%),
            linear-gradient(180deg,rgba(0,0,0,0.10),rgba(0,0,0,0.86))]
      "
    />
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/10" />

    <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6">
      <div className="pt-8 sm:pt-10 pb-10">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* LEFT: headline + CTA */}
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verifiable by design
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200">
                <Lock className="h-3.5 w-3.5" />
                Immutable token controls
              </span>
            </div>

            <h1 className="mt-5 text-balance text-3xl font-semibold leading-tight sm:text-4xl">
              Tokenomics built for proof,
              <span className="text-emerald-300"> not promises.</span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
              XPOT is a daily distribution protocol. The rules are simple, the supply is fixed and every important claim has an on-chain proof target.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href={ROUTE_HUB} className={`${BTN_PRIMARY} px-5 py-2.5 text-sm`}>
                Enter today&apos;s XPOT
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link href={ROUTE_TERMS} className={`${BTN_UTILITY} px-5 py-2.5 text-sm`}>
                Terms
              </Link>

              <a
                href={SOLSCAN.token(String(TOKEN_MINT))}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.06] transition"
              >
                Explorer proof
                <ExternalLink className="h-4 w-4 text-slate-500" />
              </a>
            </div>

            {/* Minimal stat strip (one row, readable) */}
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Total supply</p>
                <p className="mt-2 font-mono text-lg font-semibold text-slate-100">{supply.toLocaleString('en-US')}</p>
                <p className="mt-1 text-xs text-slate-500">Fixed, minted once</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Rewards reserve</p>
                <p className="mt-2 font-mono text-lg font-semibold text-emerald-200">{DISTRIBUTION_RESERVE.toLocaleString('en-US')} XPOT</p>
                <p className="mt-1 text-xs text-slate-500">Designated reserve wallet</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Daily rule</p>
                <p className="mt-2 font-mono text-lg font-semibold text-slate-100">
                  {fmtInt(DISTRIBUTION_DAILY_XPOT)}
                  <span className="ml-2 text-xs font-semibold text-slate-500">/ day</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">Protocol fixed</p>
              </div>
            </div>
          </div>

          {/* RIGHT: one calm “Proof panel” instead of many boxes */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_30px_110px_rgba(0,0,0,0.40)] backdrop-blur-xl">
              <div
                className="
                  pointer-events-none absolute -inset-24 opacity-70 blur-3xl
                  bg-[radial-gradient(circle_at_20%_25%,rgba(168,85,247,0.18),transparent_55%),
                      radial-gradient(circle_at_85%_70%,rgba(16,185,129,0.14),transparent_60%)]
                "
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Proof panel</p>
                    <p className="mt-1 text-sm font-semibold text-slate-100">Immutable controls + reserve coverage</p>
                    <p className="mt-1 text-xs text-slate-500">Everything here links to public on-chain evidence.</p>
                  </div>

                  <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                </div>

                {/* Reserve coverage (big, easy to read) */}
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Reserve coverage</p>
                  <p className="mt-2 font-mono text-3xl font-semibold text-emerald-200">
                    {runwayFixedYears.toFixed(2)}
                    <span className="ml-2 text-sm font-semibold text-slate-500">years</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Proof: {DISTRIBUTION_RESERVE.toLocaleString('en-US')} XPOT ({runwayFixedDays.toLocaleString('en-US')} days) sits in the reserve wallet
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={openDistribution}
                      className="inline-flex items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/15 transition"
                    >
                      View reserve
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>

                    <Link
                      href={ROUTE_HUB}
                      className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.06] transition"
                    >
                      Enter today
                      <ArrowRight className="ml-2 h-4 w-4 text-slate-400" />
                    </Link>
                  </div>
                </div>

                {/* Token controls (collapsed detail, much calmer) */}
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Token controls</p>
                      <p className="mt-1 text-sm font-semibold text-slate-100">Mint and freeze authority revoked</p>
                      <p className="mt-1 text-xs text-slate-500">No new supply. No account freezing.</p>
                    </div>

                    <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200">
                      Locked
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Mint authority</p>
                        <p className="mt-0.5 text-sm font-semibold text-emerald-200">Revoked</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ProofLink href={SOLSCAN.account(String(TOKEN_MINT))} label="Mint account" />
                        {REVOKE_PROOF.mintAuthorityTx ? (
                          <ProofLink href={SOLSCAN.tx(REVOKE_PROOF.mintAuthorityTx)} label="Revoke tx" />
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Freeze authority</p>
                        <p className="mt-0.5 text-sm font-semibold text-emerald-200">Revoked</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ProofLink href={SOLSCAN.account(String(TOKEN_MINT))} label="Mint account" />
                        {REVOKE_PROOF.freezeAuthorityTx ? (
                          <ProofLink href={SOLSCAN.tx(REVOKE_PROOF.freezeAuthorityTx)} label="Revoke tx" />
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Supply</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-200">Fixed</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ProofLink href={SOLSCAN.token(String(TOKEN_MINT))} label="Token page" />
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-[11px] text-slate-600">
                    Every “revoked” claim has a proof target. The mint account shows current authorities, and revoke transactions can be linked if you paste the signatures.
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">10-year requirement</p>
                  <p className="mt-2 font-mono text-xl font-semibold text-slate-100">{TEN_YEARS_REQUIRED.toLocaleString('en-US')}</p>
                  <p className="mt-1 text-xs text-slate-500">Exact at 1,000,000/day</p>
                </div>

                <p className="mt-4 text-[11px] text-slate-600">
                  Built to feel calm and verifiable. If it cannot be proven on-chain, it should not exist.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 h-px w-full bg-white/10" />
      </div>
    </div>
  </div>
</section>
