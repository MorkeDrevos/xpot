// components/PremiumWalletModal.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState, type WalletName } from '@solana/wallet-adapter-base';
import { ChevronRight, ExternalLink, Shield, Wallet } from 'lucide-react';

import XpotLogoLottie from '@/components/XpotLogoLottie';

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-slate-700 text-slate-200 hover:bg-slate-800 transition';

function shortAddr(a: string) {
  if (!a) return a;
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

function PremiumStatusBanner({
  text = 'PRE-LAUNCH MODE',
  items = ['CONTRACT DEPLOYED', 'TRADING NOT ACTIVE YET'],
}: {
  text?: string;
  items?: string[];
}) {
  const reduce = useReducedMotion();
  const line = [text, ...items].join('  •  ');

  return (
    <div className="relative overflow-hidden">
      {/* Banner body */}
      <div
        className="
          relative
          border-b border-white/10
          bg-gradient-to-r from-purple-700/55 via-violet-600/55 to-indigo-700/55
        "
      >
        {/* Moving shimmer layer */}
        <motion.div
          aria-hidden
          className="
            pointer-events-none absolute inset-0
            opacity-70
            [background:linear-gradient(110deg,transparent,rgba(255,255,255,0.20),transparent)]
            [background-size:220%_100%]
          "
          initial={{ backgroundPositionX: '0%' }}
          animate={reduce ? undefined : { backgroundPositionX: ['0%', '220%'] }}
          transition={
            reduce
              ? undefined
              : { duration: 3.8, ease: 'linear', repeat: Infinity }
          }
        />

        {/* Subtle star/sparkle grain */}
        <motion.div
          aria-hidden
          className="
            pointer-events-none absolute inset-0 opacity-60
            [background-image:
              radial-gradient(circle_at_18%_42%,rgba(255,255,255,0.22)_0px,transparent_1.6px),
              radial-gradient(circle_at_72%_34%,rgba(255,255,255,0.18)_0px,transparent_1.5px),
              radial-gradient(circle_at_46%_78%,rgba(255,255,255,0.16)_0px,transparent_1.4px),
              radial-gradient(circle_at_88%_66%,rgba(255,255,255,0.14)_0px,transparent_1.4px)
            ]
            [background-size:520px_120px]
          "
          initial={{ backgroundPositionX: 0 }}
          animate={reduce ? undefined : { backgroundPositionX: [0, 520] }}
          transition={
            reduce
              ? undefined
              : { duration: 8, ease: 'linear', repeat: Infinity }
          }
        />

        {/* Soft inner glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.20),transparent_62%)]"
        />

        {/* Content */}
        <div className="relative flex h-11 items-center justify-center px-6">
          {/* Fade edges */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-black/35 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-black/35 to-transparent"
          />

          {/* Marquee */}
          <div className="relative w-full overflow-hidden">
            <motion.div
              className="flex w-max items-center gap-10"
              initial={{ x: 0 }}
              animate={reduce ? undefined : { x: ['0%', '-50%'] }}
              transition={
                reduce
                  ? undefined
                  : { duration: 18, ease: 'linear', repeat: Infinity }
              }
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.42em] text-white/90">
                {line}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.42em] text-white/90">
                {line}
              </span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Micro highlight line */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />
    </div>
  );
}

export default function PremiumWalletModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { wallets, wallet, publicKey, connected, connecting, disconnect, select } =
    useWallet();
  const [busy, setBusy] = useState<string | null>(null);

  const detected = useMemo(() => {
    const score = (w: any) => {
      const rs = w.readyState;
      if (rs === WalletReadyState.Installed) return 3;
      if (rs === WalletReadyState.Loadable) return 2;
      if (rs === WalletReadyState.NotDetected) return 1;
      return 0;
    };
    return [...wallets].sort((a, b) => score(b) - score(a));
  }, [wallets]);

  useEffect(() => {
    if (!open) setBusy(null);
  }, [open]);

  async function handlePick(name: WalletName) {
    try {
      setBusy(String(name));
      select(name);
    } finally {
      setTimeout(() => setBusy(null), 450);
    }
  }

  const address = publicKey?.toBase58() ?? null;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-2xl"
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            initial={{ y: 18, scale: 0.985, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.99, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="
              relative w-full max-w-[760px]
              rounded-[36px] border border-white/10
              bg-gradient-to-b from-slate-950/80 to-slate-950/55
              shadow-[0_40px_140px_rgba(0,0,0,0.80)]
              backdrop-blur-xl
              overflow-hidden
            "
          >
            {/* Premium top banner */}
            <PremiumStatusBanner
              text="PRE-LAUNCH MODE"
              items={['CONTRACT DEPLOYED', 'TRADING NOT ACTIVE YET']}
            />

            {/* Ambient glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-[18%] h-[380px] w-[380px] rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative px-6 py-6 sm:px-7 sm:py-7">
              {/* XPOT brand header (logo + close) */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <XpotLogoLottie className="h-8 w-auto" height={32} />
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                    XPOT
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                  aria-label="Close"
                >
                  Close
                </button>
              </div>

              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    <Shield className="h-4 w-4 text-emerald-200" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                      Secure wallet connection
                    </span>
                  </div>

                  <h3 className="mt-4 text-[30px] font-semibold leading-tight text-slate-100">
                    Select wallet
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Connect a Solana wallet to check XPOT eligibility and claim today’s entry.
                  </p>
                </div>

                <div className="hidden sm:block" />
              </div>

              {/* Connected row */}
              <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className="rounded-3xl border border-white/10 bg-black/30 px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Current wallet
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">
                        {wallet?.adapter?.name ?? 'No wallet selected'}
                      </p>
                      <p className="mt-1 font-mono text-xs text-slate-400">
                        {address ? shortAddr(address) : 'Not connected'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {connected && (
                        <button
                          type="button"
                          onClick={() => disconnect().catch(() => {})}
                          className={`${BTN_UTILITY} h-10 px-4 text-xs`}
                        >
                          Disconnect
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={onClose}
                        className={`${BTN_PRIMARY} h-10 px-4 text-xs`}
                      >
                        Done
                      </button>
                    </div>
                  </div>

                  {connecting && (
                    <p className="mt-2 text-xs text-amber-300">Waiting for wallet approval…</p>
                  )}
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/30 px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Tip
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    You’ll need a small SOL balance for network fees. XPOT eligibility is checked on-chain.
                  </p>
                </div>
              </div>

              {/* Wallet list */}
              <div className="mt-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Available wallets
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {detected.map(w => {
                    const name = w.adapter.name as WalletName;
                    const rs = w.readyState;
                    const isSelected = wallet?.adapter?.name === String(name);

                    const installed =
                      rs === WalletReadyState.Installed || rs === WalletReadyState.Loadable;

                    return (
                      <button
                        key={String(name)}
                        type="button"
                        onClick={() => handlePick(name)}
                        className="
                          group relative overflow-hidden text-left
                          rounded-3xl border border-white/10
                          bg-gradient-to-b from-white/5 to-black/30
                          px-5 py-4
                          hover:border-white/20 hover:bg-white/10
                          transition
                        "
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
                              <Wallet className="h-5 w-5 text-slate-200" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-100">
                                {String(name)}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {installed ? 'Detected' : 'Not installed'}
                                {isSelected ? ' · selected' : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {busy === String(name) ? (
                              <span className="text-xs text-slate-400">Opening…</span>
                            ) : (
                              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-200" />
                            )}
                          </div>
                        </div>

                        {!installed && (
                          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                            <span className="text-xs text-slate-300">Install to use this wallet</span>
                            <span className="inline-flex items-center gap-2 text-xs text-amber-200">
                              <ExternalLink className="h-4 w-4" />
                              Extension / App
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3 text-[11px] text-slate-500">
                <span>XPOT never takes custody of funds.</span>
                <span className="hidden sm:inline">Solana mainnet</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
