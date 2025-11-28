'use client';

import React from 'react';

type ConnectWalletButtonProps = {
  connected?: boolean;
  onClick?: () => void;
};

export default function ConnectWalletButton({
  connected = false,
  onClick,
}: ConnectWalletButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-full px-4 py-2 text-sm font-semibold transition ${
        connected
          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40'
          : 'bg-slate-900 text-slate-100 border border-slate-700 hover:bg-slate-800'
      }`}
    >
      {connected ? 'Wallet connected' : 'Connect wallet (preview)'}
    </button>
  );
}
