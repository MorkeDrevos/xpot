// components/PremiumWalletModal.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { useWallet } from '@solana/wallet-adapter-react';
import {
  WalletReadyState,
  WalletName,
} from '@solana/wallet-adapter-base';

import {
  ChevronRight,
  ExternalLink,
  Shield,
  Wallet as WalletIcon,
  X,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-slate-700 text-slate-200 hover:bg-slate-800 transition disabled:cursor-not-allowed disabled:opacity-40';

function shortAddr(a: string) {
  if (!a) return a;
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

function readinessLabel(rs: WalletReadyState) {
  if (rs === WalletReadyState.Installed) return 'Installed';
  if (rs === WalletReadyState.Loadable) return 'Detected';
  if (rs === WalletReadyState.NotDetected) return 'Not installed';
  return 'Unsupported';
}

function readinessTone(rs: WalletReadyState) {
  if (rs === WalletReadyState.Installed) return 'text-emerald-200 bg-emerald-500/10 border-emerald-400/20';
  if (rs === WalletReadyState.Loadable) return 'text-sky-200 bg-sky-500/10 border-sky-400/20';
  if (rs === WalletReadyState.NotDetected) return 'text-amber-200 bg-amber-500/10 border-amber-400/20';
  return 'text-slate-300 bg-slate-800/50 border-white/10';
}

function walletInstallUrl(name: string) {
  const n = name.toLowerCase();
  if (n.includes('phantom')) return 'https://phantom.app/';
  if (n.includes('solflare')) return 'https://solflare.com/';
  if (n.includes('backpack')) return 'https://backpack.app/';
  if (n.includes('coinbase')) return 'https://www.coinbase.com/wallet';
  if (n.includes('ledger')) return 'https://www.ledger.com/';
  if (n.includes('trust')) return 'https://trustwallet.com/';
  return null;
}

export default function PremiumWalletModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    wallets,
    wallet,
    publicKey,
    connected,
    connecting,
    disconnect,
    select,
  } = useWallet();

  const [busy, setBusy] = useState<WalletName | null>(null);

  const detected = useMemo(() => {
    const score = (w: any) => {
      const rs: WalletReadyState = w.readyState;
      if (rs === WalletReadyState.Installed) return 4;
      if (rs === WalletReadyState.Loadable) return 3;
      if (rs === WalletReadyState.NotDetected) return 2;
      return 0;
    };
    return [...wallets].sort((a, b) => score(b) - score(a));
  }, [wallets]);

  useEffect(() => {
    if (!open) setBusy(null);
  }, [open]);

  async function handlePick(name: WalletName) {
    try {
      setBusy(name);
      select(name);
    } finally {
      setTimeout(() => setBusy(null), 450);
    }
  }

  const address = publicKey?.toBase58() ?? null;
  const selectedName = wallet?.adapter?.name ?? 'No wallet selected';
  const selectedIcon = (wallet?.adapter as any)?.icon as string | undefined;

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

          {/* Ultra premium frame */}
          <motion.div
            initial={{ y: 18, scale: 0.985, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.99, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="
              relative w-full max-w-[860px]
              overflow-hidden
              rounded-[38px]
              border border-white/10
              bg-gradient-to-b from-slate-950/85 to-slate-950/55
              shadow-[0_40px_140px_rgba(0,0,0,0.80)]
              backdrop-blur-xl
            "
          >
            {/* Ambient glows */}
            <div className="pointer-events-none absolute -top-28 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 left-[16%] h-[420px] w-[420px] rounded-full bg-amber-500/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.06),transparent_45%),radial-gradient(circle_at_70%_40%,rgba(168,85,247,0.10),transparent_48%),radial-gradient(circle_at_30%_80%,rgba(245,158,11,0.10),transparent_52%)]" />

            {/* Header line */}
            <div className="pointer-events-none absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="relative px-6 py-6 sm:px-8 sm:py-8">
              {/* Top row */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    <Shield className="h-4 w-4 text-emerald-200" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                      Secure connection
                    </span>
                    <span className="mx-1 h-3 w-px bg-white/10" />
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                      <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                      XPOT grade
                    </span>
                  </div>

                  <h3 className="mt-4 text-[32px] font-semibold leading-tight text-slate-100">
                    Choose your Solana wallet
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Connect a wallet to check eligibility and claim today’s XPOT entry.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Current wallet panel */}
              <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
                <div className="rounded-[28px] border border-white/10 bg-black/30 px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Current wallet
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                        {selectedIcon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={selectedIcon}
                            alt={selectedName}
                            className="h-7 w-7 object-contain opacity-90"
                          />
                        ) : (
                          <WalletIcon className="h-5 w-5 text-slate-200" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-100">
                          {selectedName}
                        </p>
                        <p className="mt-1 font-mono text-xs text-slate-400">
                          {address ? shortAddr(address) : 'Not connected'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {connected ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                          <CheckCircle2 className="h-4 w-4" />
                          Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                          Not connected
                        </span>
                      )}
                    </div>
                  </div>

                  {connecting && (
                    <p className="mt-3 text-xs text-amber-300">
                      Waiting for wallet approval…
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-2">
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

                <div className="rounded-[28px] border border-white/10 bg-black/30 px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Tip
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    Keep a small SOL balance for network fees. Eligibility checks are done on-chain.
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    XPOT never takes custody of funds.
                  </p>
                </div>
              </div>

              {/* Wallet list */}
              <div className="mt-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Available wallets
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {detected.map(w => {
                    const name = w.adapter.name as WalletName;
                    const icon = (w.adapter as any)?.icon as string | undefined;

                    const rs: WalletReadyState = w.readyState;
                    const installed =
                      rs === WalletReadyState.Installed ||
                      rs === WalletReadyState.Loadable;

                    const isSelected = wallet?.adapter?.name === name;
                    const installUrl = walletInstallUrl(String(name));

                    return (
                      <button
                        key={String(name)}
                        type="button"
                        onClick={() => handlePick(name)}
                        className="
                          group relative overflow-hidden text-left
                          rounded-[28px]
                          border border-white/10
                          bg-gradient-to-b from-white/6 to-black/30
                          px-5 py-4
                          hover:border-white/20 hover:bg-white/10
                          transition
                        "
                      >
                        {/* sheen */}
                        <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                          <div className="absolute -left-24 top-0 h-full w-48 rotate-12 bg-white/8 blur-xl" />
                        </div>

                        <div className="relative flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                              {icon ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={icon}
                                  alt={String(name)}
                                  className="h-7 w-7 object-contain opacity-90"
                                />
                              ) : (
                                <WalletIcon className="h-5 w-5 text-slate-200" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-100">
                                {String(name)}
                              </p>

                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span
                                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${readinessTone(
                                    rs,
                                  )}`}
                                >
                                  {readinessLabel(rs)}
                                </span>

                                {isSelected ? (
                                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                                    Selected
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="relative flex items-center gap-2">
                            {busy === name ? (
                              <span className="text-xs text-slate-400">Opening…</span>
                            ) : (
                              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-200" />
                            )}
                          </div>
                        </div>

                        {!installed && (
                          <div className="relative mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                            <span className="text-xs text-slate-300">
                              Install to use this wallet
                            </span>

                            {installUrl ? (
                              <a
                                href={installUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="inline-flex items-center gap-2 text-xs text-amber-200 hover:text-amber-100"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Get wallet
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-2 text-xs text-amber-200">
                                <ExternalLink className="h-4 w-4" />
                                Extension / App
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-7 flex items-center justify-between gap-3 text-[11px] text-slate-500">
                <span>Solana mainnet</span>
                <span className="hidden sm:inline">
                  You can switch wallets anytime from the hub
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
