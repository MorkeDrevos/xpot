'use client';

import React, { useMemo, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

function InlineConnectWalletButton() {
  const { publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  const label = useMemo(() => {
    if (connecting) return 'Connecting...';
    if (!publicKey) return 'Connect wallet';
    const addr = publicKey.toBase58();
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  }, [publicKey, connecting]);

  const handleClick = () => {
    if (!publicKey) {
      setVisible(true);
      return;
    }
    disconnect();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={connecting}
      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}

export default function XpotPage() {
  const { data: session } = useSession();
  const { publicKey } = useWallet();

  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isXLoggedIn = !!session;
  const isWalletConnected = !!publicKey;
  const canClaim = isXLoggedIn && isWalletConnected && !isClaiming;

  const xName =
    (session?.user as any)?.username ||
    (session?.user as any)?.name ||
    null;

  const handleXLogin = () => {
    signIn('twitter'); // change if your provider id is different
  };

  const handleXLogout = () => {
    signOut();
  };

  const handleClaim = async () => {
    if (!canClaim) return;
    setIsClaiming(true);
    setHasClaimed(false);
    setError(null);

    try {
      // UI only for now
      await new Promise(resolve => setTimeout(resolve, 1200));
      setHasClaimed(true);
    } catch (e: any) {
      setError(e?.message || 'Could not claim ticket. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            XPOT Access
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Connect X and your Solana wallet to claim an XPOT ticket.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/40">
          {/* STEP 1 – X LOGIN */}
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Step 1
                </p>
                <p className="text-sm font-medium text-slate-50">
                  Connect X account
                </p>
                {!isXLoggedIn && (
                  <p className="mt-1 text-xs text-slate-400">
                    Sign in with X so we can link your ticket.
                  </p>
                )}
                {isXLoggedIn && (
                  <p className="mt-1 text-xs text-emerald-300">
                    Connected as{' '}
                    <span className="font-semibold">
                      @{xName ?? 'your-account'}
                    </span>
                  </p>
                )}
              </div>

              {!isXLoggedIn ? (
                <button
                  type="button"
                  onClick={handleXLogin}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-100"
                >
                  Sign in with X
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleXLogout}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/5"
                >
                  Sign out
                </button>
              )}
            </div>
          </div>

          {/* STEP 2 – WALLET */}
          <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Step 2
                </p>
                <p className="text-sm font-medium text-slate-50">
                  Connect Solana wallet
                </p>
                {!isWalletConnected && (
                  <p className="mt-1 text-xs text-slate-400">
                    Use Phantom, Backpack, or Solflare.
                  </p>
                )}
                {isWalletConnected && (
                  <p className="mt-1 text-xs text-emerald-300">
                    Wallet connected
                  </p>
                )}
              </div>

              <div className="w-40">
                <InlineConnectWalletButton />
              </div>
            </div>
          </div>

          {/* STEP 3 – CLAIM */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleClaim}
              disabled={!canClaim}
              className={`flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
                canClaim
                  ? 'bg-emerald-400 text-black hover:bg-emerald-300'
                  : 'bg-white/5 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isClaiming ? 'Claiming ticket…' : 'Claim XPOT ticket'}
            </button>

            {!isXLoggedIn && (
              <p className="mt-2 text-xs text-slate-400">
                To claim a ticket, connect your X account first.
              </p>
            )}
            {isXLoggedIn && !isWalletConnected && (
              <p className="mt-2 text-xs text-slate-400">
                Connect your wallet to unlock the claim button.
              </p>
            )}
            {isXLoggedIn && isWalletConnected && !hasClaimed && !error && (
              <p className="mt-2 text-xs text-emerald-300">
                You&apos;re ready. Hit claim to lock in your ticket.
              </p>
            )}
            {hasClaimed && !error && (
              <p className="mt-2 text-xs font-medium text-emerald-300">
                Ticket claimed (UI only for now).
              </p>
            )}
            {error && (
              <p className="mt-2 text-xs font-medium text-red-400">
                {error}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
