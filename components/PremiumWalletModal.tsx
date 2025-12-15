// components/PremiumWalletModal.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState, type WalletName } from '@solana/wallet-adapter-base';
import {
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Shield,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
};

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] transition disabled:cursor-not-allowed disabled:opacity-40';

function shortAddr(a: string) {
  if (!a) return a;
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

function scoreWalletReadyState(rs: WalletReadyState) {
  if (rs === WalletReadyState.Installed) return 30;
  if (rs === WalletReadyState.Loadable) return 20;
  if (rs === WalletReadyState.NotDetected) return 10;
  return 0;
}

function walletBadge(rs: WalletReadyState, isSelected: boolean) {
  if (isSelected) return { label: 'Selected', tone: 'emerald' as const };
  if (rs === WalletReadyState.Installed) return { label: 'Detected', tone: 'sky' as const };
  if (rs === WalletReadyState.Loadable) return { label: 'Openable', tone: 'sky' as const };
  return { label: 'Not installed', tone: 'slate' as const };
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: 'emerald' | 'sky' | 'slate';
}) {
  const cls =
    tone === 'emerald'
      ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
      : tone === 'sky'
      ? 'border-sky-400/20 bg-sky-500/10 text-sky-200'
      : 'border-white/10 bg-white/[0.03] text-slate-200';

  return (
    <span
      className={classNames(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
        cls,
      )}
    >
      {label}
    </span>
  );
}

export default function PremiumWalletModal({ open, onClose }: Props) {
  const {
    wallets,
    wallet,
    publicKey,
    connected,
    connecting,
    disconnect,
    select,
  } = useWallet();

  const [busy, setBusy] = useState<string | null>(null);

  const detected = useMemo(() => {
    const sorted = [...wallets].sort((a, b) => {
      const sa = scoreWalletReadyState(a.readyState);
      const sb = scoreWalletReadyState(b.readyState);
      if (sb !== sa) return sb - sa;
      return String(a.adapter.name).localeCompare(String(b.adapter.name));
    });

    // Keep installed/loadable first, but still show everything
    return sorted;
  }, [wallets]);

  useEffect(() => {
    if (!open) setBusy(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function handlePick(name: WalletName) {
    try {
      setBusy(String(name));
      select(name);
    } finally {
      // tiny ceremony delay, no jank
      setTimeout(() => setBusy(null), 420);
    }
  }

  const address = publicKey?.toBase58() ?? null;
  const currentName = wallet?.adapter?.name ?? null;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop (nebula + glass blur) */}
          <div className="absolute inset-0" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70" />
            <div className="absolute inset-0 backdrop-blur-2xl" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_20%_15%,rgba(56,189,248,0.10),transparent_55%),radial-gradient(900px_circle_at_80%_55%,rgba(245,158,11,0.10),transparent_60%),radial-gradient(900px_circle_at_45%_85%,rgba(168,85,247,0.08),transparent_55%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.8)_1px,transparent_0)] [background-size:34px_34px]" />
          </div>

          {/* Card */}
          <motion.div
            initial={{ y: 18, scale: 0.985, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.99, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="
              relative w-full max-w-[820px]
              overflow-hidden
              rounded-[40px] border border-white/10
              bg-gradient-to-b from-slate-950/75 to-slate-950/45
              shadow-[0_40px_140px_rgba(0,0,0,0.82)]
              backdrop-blur-xl
            "
          >
            {/* Inner glass edge */}
            <div className="pointer-events-none absolute inset-0 rounded-[40px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]" />

            {/* Ambient glows */}
            <div className="pointer-events-none absolute -top-28 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 left-[14%] h-[460px] w-[460px] rounded-full bg-amber-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-36 right-[10%] h-[520px] w-[520px] rounded-full bg-purple-500/10 blur-3xl" />

            <div className="relative px-6 py-6 sm:px-8 sm:py-8">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                    <Shield className="h-4 w-4 text-emerald-200" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                      Secure wallet link
                    </span>
                  </div>

                  <h3 className="mt-4 text-[30px] font-semibold leading-tight text-slate-100">
                    Select wallet
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Choose the wallet that unlocks your XPOT entry. XPOT never accesses private keys.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-slate-200 hover:bg-white/[0.08]"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Current connection + trust */}
              <div className="mt-7 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className="rounded-[28px] border border-white/10 bg-black/30 px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Current wallet
                  </p>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">
                        {currentName ?? 'No wallet selected'}
                      </p>
                      <p className="mt-1 font-mono text-xs text-slate-400">
                        {address ? shortAddr(address) : 'Not connected'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {connected ? (
                        <Badge label="Connected" tone="emerald" />
                      ) : connecting ? (
                        <Badge label="Waiting" tone="sky" />
                      ) : (
                        <Badge label="Idle" tone="slate" />
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
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

                    {connecting ? (
                      <span className="ml-1 text-xs text-amber-200">
                        Waiting for wallet approval…
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/30 px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Trust
                  </p>
                  <div className="mt-2 space-y-2 text-xs leading-relaxed text-slate-300">
                    <p className="flex items-start gap-2">
                      <CheckCircle2 className="mt-[2px] h-4 w-4 text-emerald-200" />
                      Your wallet stays on your device (self-custody).
                    </p>
                    <p className="flex items-start gap-2">
                      <CheckCircle2 className="mt-[2px] h-4 w-4 text-emerald-200" />
                      You may need a small SOL balance for network fees.
                    </p>
                    <p className="flex items-start gap-2">
                      <Sparkles className="mt-[2px] h-4 w-4 text-sky-200" />
                      XPOT eligibility is checked on-chain.
                    </p>
                  </div>
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
                    const rs = w.readyState;
                    const isSelected = currentName === String(name);

                    const installed =
                      rs === WalletReadyState.Installed ||
                      rs === WalletReadyState.Loadable;

                    const badge = walletBadge(rs, isSelected);

                    return (
                      <button
                        key={String(name)}
                        type="button"
                        onClick={() => handlePick(name)}
                        className={classNames(
                          'group relative overflow-hidden text-left',
                          'rounded-[28px] border border-white/10',
                          'bg-gradient-to-b from-white/[0.06] to-black/30',
                          'px-5 py-4 transition',
                          'hover:border-white/20 hover:bg-white/[0.08]',
                          isSelected && 'border-white/25 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]',
                        )}
                      >
                        {/* subtle sweep */}
                        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <div className="absolute -left-1/3 top-0 h-full w-1/2 rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)]" />
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
                              <Wallet className="h-5 w-5 text-slate-200" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-100">
                                {String(name)}
                              </p>

                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <Badge label={badge.label} tone={badge.tone} />

                                {!installed ? (
                                  <span className="text-xs text-slate-400">
                                    Install to use this wallet
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400">
                                    Ready to connect
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {busy === String(name) ? (
                              <span className="text-xs text-slate-400">Opening…</span>
                            ) : (
                              <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:text-slate-200" />
                            )}
                          </div>
                        </div>

                        {!installed ? (
                          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                            <span className="text-xs text-slate-300">
                              Get the extension / app
                            </span>
                            <span className="inline-flex items-center gap-2 text-xs text-amber-200">
                              <ExternalLink className="h-4 w-4" />
                              Install
                            </span>
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
                <span>XPOT never takes custody of funds.</span>
                <span className="inline-flex items-center gap-2">
                  <span className="hidden sm:inline">Solana mainnet</span>
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
