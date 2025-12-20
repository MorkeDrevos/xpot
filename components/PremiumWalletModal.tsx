// components/PremiumWalletModal.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState, type WalletName } from '@solana/wallet-adapter-base';
import { ChevronRight, ExternalLink, Shield, Wallet } from 'lucide-react';

import Modal from '@/components/Modal';
import XpotLogoLottie from '@/components/XpotLogoLottie';

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition';

function shortAddr(a: string) {
  if (!a) return a;
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
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
      setTimeout(() => setBusy(null), 300);
    }
  }

  const address = publicKey?.toBase58() ?? null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      tone="xpot-light"
      maxWidthClassName="max-w-3xl"
      hideHeader
      ariaLabel="Select wallet"
      closeOnBackdrop
    >
      {/* Subtle top glow (inside modal) */}
      <div className="pointer-events-none absolute -top-28 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-[18%] h-[380px] w-[380px] rounded-full bg-fuchsia-500/10 blur-3xl" />

      {/* Header row */}
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <XpotLogoLottie className="h-8 w-auto" height={32} />
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
            XPOT ACCESS
          </span>

          <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            <Shield className="h-4 w-4 text-emerald-200" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
              Secure connection
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
        >
          Close
        </button>
      </div>

      {/* Title block (simple like your screenshot) */}
      <div className="relative mt-6 text-center">
        <h3 className="text-[34px] font-semibold leading-tight text-slate-100">
          Select your wallet
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">
          Connect a Solana wallet to check XPOT eligibility and claim today’s entry.
          No custody. No surprises.
        </p>
      </div>

      {/* Current wallet row */}
      <div className="relative mt-6 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-4">
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
              {connected ? (
                <button
                  type="button"
                  onClick={() => disconnect().catch(() => {})}
                  className={`${BTN_UTILITY} h-10 px-4 text-xs`}
                >
                  Disconnect
                </button>
              ) : null}

              <button
                type="button"
                onClick={onClose}
                className={`${BTN_PRIMARY} h-10 px-5 text-xs`}
              >
                Done
              </button>
            </div>
          </div>

          {connecting ? (
            <p className="mt-2 text-xs text-amber-300">Waiting for wallet approval…</p>
          ) : null}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Tip
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            Keep a small SOL balance for network fees. XPOT eligibility is checked on-chain.
          </p>
        </div>
      </div>

      {/* Wallet list */}
      <div className="relative mt-6">
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
                  bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),rgba(0,0,0,0.22))]
                  px-5 py-4
                  hover:border-white/20 hover:bg-white/10
                  transition
                "
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
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

                  {busy === String(name) ? (
                    <span className="text-xs text-slate-400">Opening…</span>
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-200" />
                  )}
                </div>

                {!installed ? (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <span className="text-xs text-slate-300">Install to use this wallet</span>
                    <span className="inline-flex items-center gap-2 text-xs text-amber-200">
                      <ExternalLink className="h-4 w-4" />
                      Extension / App
                    </span>
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer microcopy */}
      <div className="relative mt-6 flex items-center justify-between gap-3 text-[11px] text-slate-500">
        <span>XPOT never takes custody of funds.</span>
        <span className="hidden sm:inline">Solana mainnet</span>
      </div>
    </Modal>
  );
}
