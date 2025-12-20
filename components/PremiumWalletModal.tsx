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
  'inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition disabled:cursor-not-allowed disabled:opacity-40';

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
    <Modal open={open} onClose={onClose}>
      {/* Compact XPOT shell (keeps Modal.tsx unchanged + fixes your build errors) */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_30%_0%,rgba(56,189,248,0.10),transparent_55%),radial-gradient(circle_at_85%_25%,rgba(236,72,153,0.10),transparent_55%),linear-gradient(to_bottom,rgba(2,6,23,0.90),rgba(2,6,23,0.70))] p-4 shadow-[0_40px_140px_rgba(0,0,0,0.75)]">
        {/* subtle highlight line */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        {/* header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <XpotLogoLottie className="h-7 w-auto" height={28} />
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400/90" />
              XPOT access
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

        {/* title */}
        <div className="mt-4 text-center">
          <h3 className="text-[22px] font-semibold leading-tight text-slate-100">
            Connect wallet
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-300">
            Used to verify eligibility and claim today’s entry. XPOT never takes custody of funds.
          </p>
        </div>

        {/* current wallet */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Current wallet
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-100">
                {wallet?.adapter?.name ?? 'No wallet selected'}
              </p>
              <p className="mt-1 font-mono text-xs text-slate-400">
                {address ? shortAddr(address) : 'Not connected'}
              </p>
              {connecting ? (
                <p className="mt-2 text-xs text-amber-300">Waiting for wallet approval…</p>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              {connected ? (
                <button
                  type="button"
                  onClick={() => disconnect().catch(() => {})}
                  className={`${BTN_UTILITY} h-9 px-4 text-xs`}
                >
                  Disconnect
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className={`${BTN_PRIMARY} h-9 px-4 text-xs`}
              >
                Done
              </button>
            </div>
          </div>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <Shield className="h-4 w-4 text-emerald-200" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
              Secure connection
            </span>
          </div>
        </div>

        {/* wallet list */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Available wallets
            </p>
            <p className="text-[10px] text-slate-500">Solana</p>
          </div>

          <div className="mt-2 max-h-[260px] space-y-2 overflow-y-auto pr-1">
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
                    group flex w-full items-center justify-between gap-3
                    rounded-2xl border border-white/10
                    bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),rgba(0,0,0,0.20))]
                    px-4 py-3 text-left
                    hover:border-white/20 hover:bg-white/10
                    transition
                  "
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                      <Wallet className="h-5 w-5 text-slate-200" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">
                        {String(name)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {installed ? 'Detected' : 'Not installed'}
                        {isSelected ? ' · selected' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!installed ? (
                      <span className="inline-flex items-center gap-2 text-xs text-amber-200">
                        <ExternalLink className="h-4 w-4" />
                        Install
                      </span>
                    ) : busy === String(name) ? (
                      <span className="text-xs text-slate-400">Opening…</span>
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-200" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* footer hint */}
        <p className="mt-4 text-center text-[11px] text-slate-500">
          Tip: keep a small SOL balance for network fees.
        </p>
      </div>
    </Modal>
  );
}
