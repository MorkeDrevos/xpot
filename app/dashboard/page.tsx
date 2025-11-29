'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

const MIN_XPOT_REQUIRED = 100_000;

// 🔴 FIXED RPC (stable public provider)
const endpoint = 'https://rpc.ankr.com/solana';

// ─────────────────────────────────────────────
// Types & helpers
// ─────────────────────────────────────────────

type EntryStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

type Entry = {
  id: number;
  code: string;
  status: EntryStatus;
  label: string;
  jackpotUsd: string;
  createdAt: string;
};

function makeCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = () =>
    Array.from({ length: 4 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join('');
  return `XPOT-${block()}-${block()}`;
}

const now = new Date();
const initialEntries: Entry[] = [
  {
    id: 1,
    code: makeCode(),
    status: 'won',
    label: "Today's main jackpot • $10,000",
    jackpotUsd: '$10,000',
    createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: 2,
    code: makeCode(),
    status: 'in-draw',
    label: "Yesterday's main jackpot • $8,400",
    jackpotUsd: '$8,400',
    createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

// ─────────────────────────────────────────────
// ROOT WALLET WRAPPER
// ─────────────────────────────────────────────

export default function DashboardPage() {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <DashboardInner />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD CORE
// ─────────────────────────────────────────────

function DashboardInner() {
  const username = 'your_handle';
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [ticketClaimed, setTicketClaimed] = useState(false);
  const [todaysTicket, setTodaysTicket] = useState<Entry | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const walletConnected = !!publicKey && connected;

  const winner = entries.find(e => e.status === 'won');

  // ✅ LOAD SOL BALANCE
  useEffect(() => {
    if (!publicKey) {
      setSolBalance(null);
      return;
    }

    (async () => {
      try {
        const lamports = await connection.getBalance(publicKey);
        setSolBalance(lamports / LAMPORTS_PER_SOL);
      } catch {
        setSolBalance(null);
      }
    })();
  }, [publicKey, connection]);

  async function handleCopy(entry: Entry) {
    await navigator.clipboard.writeText(entry.code);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function handleClaimTicket() {
    if (!walletConnected) return;
    if (ticketClaimed) return;

    const newEntry: Entry = {
      id: Date.now(),
      code: makeCode(),
      status: 'in-draw',
      label: "Today's main jackpot • $10,000",
      jackpotUsd: '$10,000',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setEntries(prev => [newEntry, ...prev]);
    setTicketClaimed(true);
    setTodaysTicket(newEntry);
  }

  return (
    <main className="min-h-screen bg-black text-slate-50">
      <div className="mx-auto flex max-w-6xl">
        <aside className="hidden min-h-screen w-56 border-r border-slate-900 px-3 py-4 md:flex flex-col justify-between">

          <button
            onClick={handleClaimTicket}
            disabled={!walletConnected}
            className={`mt-4 rounded-full py-2 text-sm font-semibold ${
              !walletConnected
                ? 'bg-slate-800 text-slate-500'
                : 'bg-gradient-to-r from-emerald-400 to-lime-400 text-black'
            }`}
          >
            {!walletConnected ? 'Connect wallet to claim' : 'Claim today’s ticket'}
          </button>
        </aside>

        {/* RIGHT SIDEBAR */}
        <aside className="w-96 bg-slate-950/40 p-4">
          <h3 className="text-sm font-semibold">Wallet</h3>

          <div className="mt-3">
            <WalletMultiButton className="!w-full !rounded-full !h-9" />
          </div>

          {publicKey && (
            <>
              <p className="mt-3 text-xs break-all">
                Wallet: {publicKey.toBase58()}
              </p>
              <p className="mt-1 text-xs">
                SOL balance: {solBalance === null ? 'Loading...' : solBalance.toFixed(4) + ' SOL'}
              </p>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
