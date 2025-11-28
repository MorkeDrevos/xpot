'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { Connection, PublicKey } from '@solana/web3.js';
import {
  WalletAdapterNetwork
} from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
  useWallet
} from '@solana/wallet-adapter-react';

import {
  WalletModalProvider,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';

import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
  LedgerWalletAdapter
} from '@solana/wallet-adapter-wallets';

import '@solana/wallet-adapter-react-ui/styles.css';


// -------------------------
// CONFIG
// -------------------------

const RPC_URL = 'https://api.mainnet-beta.solana.com';
const TEST_MINT = process.env.NEXT_PUBLIC_TEST_MINT!;


// -------------------------
// TYPES
// -------------------------

type EntryStatus = 'in-draw' | 'won' | 'claimed';

type Entry = {
  id: number;
  code: string;
  status: EntryStatus;
  label: string;
  createdAt: string;
};


// -------------------------
// HELPERS
// -------------------------

function makeCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = () =>
    Array.from({ length: 4 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join('');
  return `XPOT-${block()}-${block()}`;
}


// -------------------------
// WALLET BALANCE READER
// -------------------------

function useTokenBalance(mintAddress: string) {
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) return;

    const fetchBalance = async () => {
      try {
        const connection = new Connection(RPC_URL, 'confirmed');
        const mint = new PublicKey(mintAddress);

        const accounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { mint }
        );

        const amount =
          accounts.value[0]?.account.data.parsed.info.tokenAmount
            .uiAmount || 0;

        setBalance(amount);
      } catch (err) {
        setError('Could not load balance');
      }
    };

    fetchBalance();
  }, [publicKey, mintAddress]);

  return { balance, error };
}



// -------------------------
// INNER DASHBOARD UI
// -------------------------

function DashboardInner() {
  const { data: session } = useSession();
  const { publicKey } = useWallet();

  const isAuthed = !!session;
  const walletConnected = !!publicKey;

  const { balance, error } = useTokenBalance(TEST_MINT);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [todaysTicket, setTodaysTicket] = useState<Entry | null>(null);

  const username =
    (session?.user as any)?.username ||
    (session?.user as any)?.screen_name ||
    (session?.user as any)?.name ||
    'user';

  function openXLogin() {
    window.location.href = '/x-login';
  }

  function handleClaim() {
    if (!isAuthed) {
      openXLogin();
      return;
    }

    if (!walletConnected) {
      alert('Connect your wallet first.');
      return;
    }

    if (todaysTicket) return;

    const ticket: Entry = {
      id: Date.now(),
      code: makeCode(),
      status: 'in-draw',
      label: "Today's jackpot",
      createdAt: new Date().toLocaleTimeString()
    };

    setEntries(prev => [ticket, ...prev]);
    setTodaysTicket(ticket);
  }


  return (
    <main className="min-h-screen bg-black text-slate-50">
      <div className="mx-auto flex max-w-6xl">

        {/* LEFT NAV */}
        <aside className="hidden min-h-screen w-56 border-r border-slate-900 px-3 py-4 md:flex flex-col justify-between">

          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-9 rounded-full bg-emerald-700/20 flex items-center justify-center">💎</div>
              <div>
                <div className="text-sm font-semibold">XPOT</div>
                <div className="text-xs text-slate-500">Daily Jackpot</div>
              </div>
            </div>

            <nav className="space-y-2">
              <div className="bg-slate-900 rounded-full px-3 py-2 text-sm">Dashboard</div>
              <div className="text-sm text-slate-500 px-3">Draw history</div>
            </nav>

            <button
              onClick={handleClaim}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-300 text-black py-2 text-sm font-semibold"
            >
              Claim today’s ticket
            </button>
          </div>

          {/* USER MENU */}
          <div className="text-xs text-slate-400">
            @{username}
            <button onClick={() => signOut()} className="block mt-1 text-red-400">Log out</button>
          </div>
        </aside>



        {/* MAIN */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] rounded-[28px] border border-slate-800 bg-[#020617]">

          {/* CENTER */}
          <section className="p-6">

            <header className="mb-6">
              <h1 className="text-2xl font-semibold">Dashboard</h1>
              <p className="text-xs text-slate-400">
                One jackpot. One winner. One ticket per day.
              </p>
            </header>


            {/* TICKET CARD */}
            <div className="premium-card p-5 mb-4 border border-slate-800 rounded-xl">

              <h2 className="text-sm font-semibold text-emerald-200">
                Today's ticket
              </h2>

              {!todaysTicket ? (
                <div className="mt-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm">Claim your ticket for today.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Requires X login + connected wallet.
                    </p>
                  </div>
                  <button
                    onClick={handleClaim}
                    disabled={!isAuthed || !walletConnected}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      !isAuthed || !walletConnected
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-400 to-lime-300 text-black'
                    }`}
                  >
                    {!isAuthed ? 'Sign in with X'
                      : !walletConnected ? 'Connect wallet'
                        : 'Claim ticket'}
                  </button>
                </div>
              ) : (
                <div className="mt-4">
                  ✅ Ticket in draw  
                  <div className="mt-1 font-mono text-emerald-300">
                    {todaysTicket.code}
                  </div>
                </div>
              )}
            </div>


            {/* TICKETS */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Your tickets</h3>

              {entries.length === 0 && (
                <div className="text-xs text-slate-500">Nothing yet.</div>
              )}

              {entries.map(t => (
                <div
                  key={t.id}
                  className="border border-slate-800 rounded-xl p-3 mb-2 flex justify-between"
                >
                  <div>
                    <div className="font-mono text-sm">{t.code}</div>
                    <div className="text-xs text-slate-500">{t.label}</div>
                  </div>
                  <span className="text-xs text-emerald-300">
                    {t.status === 'in-draw' ? 'In draw' : ''}
                  </span>
                </div>
              ))}
            </div>

          </section>



          {/* RIGHT SIDEBAR */}
          <aside className="p-4 space-y-4 bg-slate-950/60">

            {/* WALLET */}
            <div className="premium-card p-4 border border-slate-800 rounded-xl">
              <h3 className="text-sm font-semibold">Wallet</h3>

              <div className="mt-2">
                <WalletMultiButton className="!bg-sky-500 !text-black !text-xs !rounded-full" />
              </div>

              {walletConnected && (
                <>
                  <div className="mt-3 text-xs text-slate-400">
                    Token balance
                  </div>

                  {error && (
                    <div className="text-xs text-red-400">
                      {error}
                    </div>
                  )}

                  {balance !== null && (
                    <div className="mt-1 text-2xl font-semibold text-emerald-300">
                      {balance.toLocaleString()}
                    </div>
                  )}
                </>
              )}
            </div>


            {/* X LOGIN */}
            <div className="premium-card p-4 border border-slate-800 rounded-xl">
              <h3 className="text-sm font-semibold">X account</h3>
              {!isAuthed ? (
                <button
                  onClick={openXLogin}
                  className="mt-2 w-full rounded-full bg-sky-500 py-2 text-black text-sm"
                >
                  Sign in with X
                </button>
              ) : (
                <div className="mt-2 text-emerald-300 text-xs">
                  Signed in as @{username}
                </div>
              )}
            </div>


            {/* RULES */}
            <div className="premium-card p-4 border border-slate-800 rounded-xl text-xs text-slate-400">
              <div>• One ticket per X account</div>
              <div>• Wallet only checked when claiming</div>
              <div>• Winner has 24h to claim or rollover</div>
            </div>

          </aside>

        </div>
      </div>
    </main>
  );
}



// -------------------------
// ROOT WRAPPER (WALLET PROVIDERS)
// -------------------------

export default function DashboardPage() {

  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new BackpackWalletAdapter(),
    new LedgerWalletAdapter()
  ];

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <DashboardInner />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
