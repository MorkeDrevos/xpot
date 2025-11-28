'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useWallet } from '@solana/wallet-adapter-react';
import ConnectWalletButton from './ConnectWalletButton';

export default function ClaimTicketSection() {
  const { data: session } = useSession();
  const { publicKey } = useWallet();

  const isXLoggedIn = !!session;
  const isWalletConnected = !!publicKey;

  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const canClaim = isXLoggedIn && isWalletConnected && !claiming;

  const handleClaim = async () => {
    setClaiming(true);
    await new Promise(r => setTimeout(r, 1200)); // UI only for now
    setClaimed(true);
    setClaiming(false);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-5 max-w-xl">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
        XPOT Access
      </h2>

      {/* STEP 1 */}
      <div className="mt-4 border border-white/10 rounded-xl p-4">
        {!isXLoggedIn ? (
          <button
            onClick={() => signIn('twitter')}
            className="rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold"
          >
            Sign in with X
          </button>
        ) : (
          <p className="text-emerald-300 text-sm">X connected</p>
        )}
      </div>

      {/* STEP 2 */}
      <div className="mt-3 border border-white/10 rounded-xl p-4">
        <ConnectWalletButton />
      </div>

      {/* STEP 3 */}
      <button
        onClick={handleClaim}
        disabled={!canClaim}
        className={`mt-4 w-full rounded-xl px-4 py-3 font-semibold ${
          canClaim
            ? 'bg-emerald-400 text-black hover:bg-emerald-300'
            : 'bg-white/5 text-gray-400 cursor-not-allowed'
        }`}
      >
        {claiming ? 'Claiming...' : 'Claim Ticket'}
      </button>

      {claimed && <p className="mt-2 text-emerald-300">Ticket claimed (UI only)</p>}
    </div>
  );
}
