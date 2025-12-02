'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';

type WalletConnectModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const { wallets, select, connected, connecting } = useWallet();
  const [showUninstalled, setShowUninstalled] = useState(false);

  // Close modal when a wallet successfully connects
  useEffect(() => {
    if (connected && isOpen) {
      onClose();
    }
  }, [connected, isOpen, onClose]);

  const visibleWallets = useMemo(() => {
    const installed = wallets.filter(
      (w) =>
        w.readyState === WalletReadyState.Installed ||
        w.readyState === WalletReadyState.Loadable
    );
    const notDetected = wallets.filter(
      (w) => w.readyState === WalletReadyState.NotDetected
    );

    return showUninstalled ? [...installed, ...notDetected] : installed;
  }, [wallets, showUninstalled]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl border border-cyan-500/40 bg-slate-900/95 text-slate-50 shadow-2xl">
        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400" />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-semibold">Connect your wallet to XPOT</h2>
            <p className="mt-1 text-xs text-slate-400">
              By connecting your wallet, you acknowledge that you understand how XPOT
              draws work and accept the terms in the{' '}
              <a
                href="/disclaimer"
                className="underline decoration-cyan-400/70 underline-offset-2 hover:text-cyan-300"
              >
                disclaimer
              </a>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <span className="sr-only">Close</span>
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-4 pt-1">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            Choose wallet
          </p>

          {/* Wallet grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visibleWallets.map((wallet) => (
              <button
                key={wallet.adapter.name}
                type="button"
                onClick={() => select(wallet.adapter.name)}
                disabled={connecting}
                className="group flex items-center justify-between rounded-xl border border-slate-700/70 bg-slate-900/80 px-4 py-3 text-left transition hover:border-cyan-400/70 hover:bg-slate-900"
              >
                <div className="flex items-center gap-3">
                  {wallet.adapter.icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={wallet.adapter.icon}
                      alt={wallet.adapter.name}
                      className="h-8 w-8 rounded-lg bg-slate-800 object-contain p-1"
                    />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {wallet.adapter.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {walletLabelHint(wallet.adapter.name, wallet.readyState)}
                    </span>
                  </div>
                </div>

                <div className="rounded-full border border-slate-700/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 group-hover:border-cyan-400/80 group-hover:text-cyan-300">
                  {readyStateLabel(wallet.readyState)}
                </div>
              </button>
            ))}

            {visibleWallets.length === 0 && (
              <div className="col-span-1 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-sm text-slate-400 sm:col-span-2">
                No compatible wallets detected in your browser. Enable one of the
                supported Solana wallets (Phantom, Solflare, Backpack, …) and reload.
              </div>
            )}
          </div>

          {/* Show uninstalled toggle */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-400">
            <span>Show uninstalled wallets</span>
            <button
              type="button"
              onClick={() => setShowUninstalled((x) => !x)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                showUninstalled ? 'bg-cyan-500/80' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow transition ${
                  showUninstalled ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-slate-800 px-6 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-slate-300">New to Solana wallets?</p>
            <p className="text-[11px] text-slate-400">
              You keep full control of your funds. XPOT only checks balances and
              sends rewards you win.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-right sm:items-end">
            <a
              href="https://phantom.app/"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-semibold text-cyan-300 hover:text-cyan-200"
            >
              Get a wallet &rarr;
            </a>
            <a
              href="/how-it-works"
              className="text-[11px] text-slate-400 hover:text-slate-200"
            >
              How XPOT draws work
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small helper to show a nicer hint under each wallet name
function walletLabelHint(name: string, ready: WalletReadyState): string {
  if (name.toLowerCase().includes('phantom')) return 'Most popular Solana wallet';
  if (name.toLowerCase().includes('solflare')) return 'Mobile & browser wallet';
  if (name.toLowerCase().includes('backpack')) return 'Backpack compatible';
  if (name.toLowerCase().includes('ledger')) return 'Hardware wallet';
  if (ready === WalletReadyState.NotDetected) return 'Not installed on this device';
  return 'Connect to join XPOT draws';
}

function readyStateLabel(ready: WalletReadyState): string {
  switch (ready) {
    case WalletReadyState.Installed:
      return 'Installed';
    case WalletReadyState.Loadable:
      return 'Loadable';
    case WalletReadyState.NotDetected:
      return 'Not installed';
    case WalletReadyState.Unsupported:
      return 'Unsupported';
    default:
      return 'Unavailable';
  }
}

// ─────────────────────────────────────────────
// Toast for “Jupiter wallet connected” style
// ─────────────────────────────────────────────

type WalletConnectedToastProps = {
  walletName: string;
  address?: string | null;
  onClose: () => void;
};

export function WalletConnectedToast({
  walletName,
  address,
  onClose,
}: WalletConnectedToastProps) {
  if (!walletName) return null;

  return (
    <div className="pointer-events-auto fixed right-4 top-4 z-50 max-w-sm rounded-2xl border border-cyan-500/60 bg-slate-900/95 px-4 pb-3 pt-3 text-slate-50 shadow-2xl">
      <div className="flex items-start">
        <div className="mt-0.5 mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/90 text-slate-950">
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="10"
              cy="10"
              r="9"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path
              d="M6 10.5 8.5 13 14 7.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">
            {walletName} wallet connected
          </p>
          {address && (
            <div className="mt-1 text-[11px] leading-snug text-slate-300">
              <div className="font-semibold text-slate-400">Wallet</div>
              <div className="break-all text-slate-200">{address}</div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-3 rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
