// components/PremiumWalletModal.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState, type WalletName } from '@solana/wallet-adapter-base';
import { ChevronRight, ExternalLink, ShieldCheck, Wallet } from 'lucide-react';

function shortAddr(a: string) {
  if (!a) return a;
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

function isDetected(rs: WalletReadyState) {
  return rs === WalletReadyState.Installed || rs === WalletReadyState.Loadable;
}

export default function PremiumWalletModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const { wallets, wallet, publicKey, connected, connecting, disconnect, select } = useWallet();
  const [busy, setBusy] = useState<string | null>(null);

  const detected = useMemo(() => {
    const score = (w: any) => {
      const rs = w.readyState as WalletReadyState;
      if (rs === WalletReadyState.Installed) return 3;
      if (rs === WalletReadyState.Loadable) return 2;
      if (rs === WalletReadyState.NotDetected) return 1;
      return 0;
    };
    return [...wallets].sort((a, b) => score(b) - score(a));
  }, [wallets]);

  const address = publicKey?.toBase58() ?? null;

  useEffect(() => {
    if (!open) setBusy(null);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (!open) return;
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function handlePick(name: WalletName) {
    try {
      setBusy(String(name));
      select(name);
    } finally {
      window.setTimeout(() => setBusy(null), 260);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop (click to close) */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-2xl"
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            initial={{ y: 14, scale: 0.99, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.99, opacity: 0 }}
            transition={
              reduce
                ? { duration: 0.15 }
                : { type: 'spring', stiffness: 260, damping: 26 }
            }
            className="
              relative w-full max-w-[460px]
              overflow-hidden
              rounded-[28px]
              border border-white/10
              bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.10),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.10),transparent_55%),linear-gradient(to_bottom,rgba(2,6,23,0.88),rgba(2,6,23,0.66))]
              shadow-[0_30px_120px_rgba(0,0,0,0.78)]
              backdrop-blur-xl
            "
          >
            {/* subtle highlight line */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
            />

            <div className="relative p-5 sm:p-6">
              {/* Top row */}
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400/90 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-200">
                    Connect wallet
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-white/[0.08]"
                >
                  Close
                </button>
              </div>

              {/* Title */}
              <div className="mt-4">
                <h3 className="text-xl font-semibold text-slate-100">
                  Select a wallet to enter XPOT
                </h3>
                <p className="mt-1 text-sm text-slate-300">
                  Fast, simple and clean. You can change it anytime.
                </p>
              </div>

              {/* Current wallet chip */}
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Wallet connected
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-100">
                      {wallet?.adapter?.name ?? 'No wallet selected'}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-slate-400">
                      {address ? shortAddr(address) : 'Not connected'}
                    </p>
                  </div>

                  {connected ? (
                    <button
                      type="button"
                      onClick={() => disconnect().catch(() => {})}
                      className="inline-flex h-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-200" />
                      <span className="text-[11px] font-semibold text-slate-200">
                        Secure
                      </span>
                    </div>
                  )}
                </div>

                {connecting ? (
                  <p className="mt-2 text-xs text-amber-200">
                    Waiting for wallet approval…
                  </p>
                ) : null}
              </div>

              {/* Wallet list */}
              <div className="mt-4 space-y-2">
                {detected.map(w => {
                  const name = w.adapter.name as WalletName;
                  const rs = w.readyState as WalletReadyState;
                  const installed = isDetected(rs);
                  const isSelected = wallet?.adapter?.name === String(name);

                  const icon = (w.adapter as any)?.icon as string | undefined;
                  const url = (w.adapter as any)?.url as string | undefined;

                  return (
                    <button
                      key={String(name)}
                      type="button"
                      onClick={() => handlePick(name)}
                      className="
                        group w-full
                        rounded-2xl border border-white/10
                        bg-white/[0.03]
                        px-4 py-3
                        text-left
                        hover:bg-white/[0.06] hover:border-white/20
                        transition
                      "
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                            {icon ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={icon} alt="" className="h-5 w-5" />
                            ) : (
                              <Wallet className="h-5 w-5 text-slate-200" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-100">
                              {String(name)}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              {installed ? 'Installed' : 'Available'}
                              {isSelected ? ' · selected' : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!installed && url ? (
                            <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-amber-200">
                              <ExternalLink className="h-4 w-4" />
                              Get
                            </span>
                          ) : null}

                          {busy === String(name) ? (
                            <span className="text-xs text-slate-400">Opening…</span>
                          ) : (
                            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-200" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 text-[11px] text-slate-500">
                We never see your seed phrase.
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
