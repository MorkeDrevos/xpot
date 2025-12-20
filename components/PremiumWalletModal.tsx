// components/PremiumWalletModal.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState, type WalletName } from '@solana/wallet-adapter-base';
import { ChevronRight, ExternalLink, Shield, Wallet } from 'lucide-react';

import Modal from '@/components/Modal';

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 px-5 py-2 text-sm font-semibold text-black hover:brightness-105 transition';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 transition';

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
  title="Select wallet"
  size="xl"
>
      {/* XPOT subtle header */}
      <div className="mb-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
          <Shield className="h-4 w-4 text-emerald-300" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
            Secure wallet connection
          </span>
        </div>

        <p className="mt-3 text-sm text-slate-400">
          Connect a Solana wallet to check XPOT eligibility and claim today’s entry.
        </p>
      </div>

      {/* Current wallet */}
      <div className="mb-5 rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
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
                className={BTN_UTILITY}
              >
                Disconnect
              </button>
            )}
            <button type="button" onClick={onClose} className={BTN_PRIMARY}>
              Done
            </button>
          </div>
        </div>

        {connecting && (
          <p className="mt-2 text-xs text-amber-300">
            Waiting for wallet approval…
          </p>
        )}
      </div>

      {/* Wallet list */}
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Available wallets
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {detected.map(w => {
            const name = w.adapter.name as WalletName;
            const rs = w.readyState;
            const installed =
              rs === WalletReadyState.Installed ||
              rs === WalletReadyState.Loadable;

            return (
              <button
                key={String(name)}
                type="button"
                onClick={() => handlePick(name)}
                className="
                  group text-left
                  rounded-2xl border border-white/10
                  bg-black/30 px-4 py-4
                  hover:border-white/20 hover:bg-white/[0.06]
                  transition
                "
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/40">
                      <Wallet className="h-5 w-5 text-slate-200" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">
                        {String(name)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {installed ? 'Detected' : 'Not installed'}
                      </p>
                    </div>
                  </div>

                  {busy === String(name) ? (
                    <span className="text-xs text-slate-400">Opening…</span>
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-200" />
                  )}
                </div>

                {!installed && (
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-2">
                    <span className="text-xs text-slate-300">
                      Install to use
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-amber-200">
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

      <div className="mt-6 flex items-center justify-between text-[11px] text-slate-500">
        <span>XPOT never takes custody of funds.</span>
        <span className="hidden sm:inline">Solana mainnet</span>
      </div>
    </Modal>
  );
}
