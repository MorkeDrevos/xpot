'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState, type WalletName } from '@solana/wallet-adapter-base';
import { ChevronRight, ExternalLink, Shield, Wallet, X } from 'lucide-react';

function shortAddr(a: string) {
  if (!a) return a;
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

// Shared “sibling” CTA styling (matches HubLockOverlay)
const CTA_PRIMARY =
  `
  group relative
  inline-flex items-center justify-center gap-2
  rounded-full
  bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.02))]
  border border-white/15
  font-semibold text-slate-100
  shadow-[0_10px_40px_rgba(0,0,0,0.45)]
  transition
  hover:border-emerald-300/40
  hover:text-white
  hover:shadow-[0_0_0_1px_rgba(16,185,129,0.25),0_20px_60px_rgba(0,0,0,0.55)]
  active:scale-[0.985]
  disabled:cursor-not-allowed disabled:opacity-40
  `;

const CTA_GHOST =
  'inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] transition disabled:cursor-not-allowed disabled:opacity-40';

export default function PremiumWalletModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { wallets, wallet, publicKey, connected, connecting, disconnect, select } = useWallet();
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
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setBusy(null);
  }, [open]);

  async function handlePick(name: WalletName) {
    try {
      setBusy(String(name));
      select(name);
    } finally {
      setTimeout(() => setBusy(null), 260);
    }
  }

  if (!open) return null;

  const address = publicKey?.toBase58() ?? null;

  return (
    <div className="fixed inset-0 z-[90]">
      {/* Backdrop */}
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/60 backdrop-blur-2xl"
        onClick={onClose}
      />

      {/* Center */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div
          className="
            relative w-full max-w-[420px]
            rounded-[26px] border border-white/10
            bg-[linear-gradient(to_bottom,rgba(2,6,23,0.88),rgba(2,6,23,0.62))]
            shadow-[0_30px_120px_rgba(0,0,0,0.78)]
            overflow-hidden
          "
        >
          {/* Ambient glows */}
          <div className="pointer-events-none absolute -top-24 left-1/2 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-[18%] h-[320px] w-[320px] rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.10),transparent_60%)]" />

          <div className="relative p-5">
            {/* Top row */}
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400/90 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-200">
                  Connect wallet
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Title */}
            <div className="mt-4">
              <h3 className="text-[18px] font-semibold text-slate-100">Select a wallet to enter XPOT</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
                Fast, simple, and clean. You can change it any time.
              </p>
            </div>

            {/* Current wallet */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Wallet connected
                  </p>
                  <p className="mt-1 truncate font-mono text-[12px] text-slate-200">
                    {address ? shortAddr(address) : 'Not connected'}
                  </p>
                </div>

                {connected ? (
                  <button
                    type="button"
                    onClick={() => disconnect().catch(() => {})}
                    className={`${CTA_GHOST} h-9 px-4 text-[12px]`}
                  >
                    Disconnect
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    <Shield className="h-4 w-4 text-emerald-200" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                      Secure
                    </span>
                  </div>
                )}
              </div>

              {connecting ? <p className="mt-2 text-[12px] text-amber-300">Waiting for wallet approval...</p> : null}
            </div>

            {/* Wallet list */}
            <div className="mt-4 space-y-2">
              {detected.map(w => {
                const name = w.adapter.name as WalletName;
                const rs = w.readyState;
                const installed = rs === WalletReadyState.Installed || rs === WalletReadyState.Loadable;
                const isSelected = wallet?.adapter?.name === String(name);

                return (
                  <button
                    key={String(name)}
                    type="button"
                    onClick={() => handlePick(name)}
                    className="
                      group w-full text-left
                      rounded-2xl border border-white/10
                      bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(0,0,0,0.18))]
                      px-3 py-3
                      hover:border-white/20 hover:bg-white/10
                      transition
                    "
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                          {w.adapter.icon ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={w.adapter.icon} alt="" className="h-6 w-6 rounded-md" />
                          ) : (
                            <Wallet className="h-5 w-5 text-slate-200" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-slate-100">{String(name)}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {installed ? 'Installed' : 'Available'}
                            {isSelected ? ' - selected' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {busy === String(name) ? (
                          <span className="text-[11px] text-slate-400">Opening...</span>
                        ) : installed ? (
                          // Primary “Connect” CTA - now matches the X CTA
                          <span className={`${CTA_PRIMARY} h-8 px-4 text-[12px]`}>
                            <span className="absolute inset-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_20%,rgba(16,185,129,0.20),transparent_55%)]" />
                            <span className="relative">Connect</span>
                          </span>
                        ) : (
                          <span className={`${CTA_GHOST} h-8 px-4 text-[12px]`}>
                            <span className="inline-flex items-center gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Install
                            </span>
                          </span>
                        )}

                        <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-slate-200" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                We never see your seed phrase.
              </span>
              <span className="hidden sm:inline">Solana mainnet</span>
            </div>

            {/* Optional close CTA */}
            <div className="mt-4">
              <button type="button" onClick={onClose} className={`${CTA_GHOST} h-10 w-full text-[12px]`}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
