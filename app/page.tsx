'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

function formatTime(ms: number) {
  if (ms <= 0) return '00:00:00';
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

const TWEET_FLAG_KEY = 'xpot_tweet_posted';

export default function Home() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [tweetPosted, setTweetPosted] = useState(false);

  // simple 24h countdown from first render (placeholder)
  useEffect(() => {
    const end = Date.now() + 24 * 60 * 60 * 1000;
    const timer = setInterval(() => {
      setTimeLeft(end - Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // load tweet-flag from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(TWEET_FLAG_KEY);
    if (stored === 'true') setTweetPosted(true);
  }, []);

  function handleTweetClick() {
    const tweetUrl =
      'https://x.com/intent/tweet?text=I%27m%20in%20the%20%24XPOT%20jackpot.'; // %27 = '

    if (typeof window !== 'undefined') {
      window.open(tweetUrl, '_blank', 'noopener,noreferrer');
      window.localStorage.setItem(TWEET_FLAG_KEY, 'true');
    }

    setTweetPosted(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-4xl space-y-8 rounded-3xl border border-slate-800 bg-slate-950/60 px-6 py-8 shadow-[0_0_80px_rgba(15,23,42,0.9)] backdrop-blur-xl md:px-10 md:py-10">
        {/* Top label */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-xs font-medium text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Daily on-chain jackpot • Solana
        </div>

        {/* Hero copy */}
        <header className="space-y-3">
          <div className="flex justify-end">
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-slate-50"
            >
              Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            <span className="text-slate-300">💎 XPOT</span>{' '}
            <span className="text-slate-50">- The X-powered crypto jackpot.</span>
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 md:text-base">
            Hold <span className="font-semibold text-emerald-300">$XPOT</span>, post your
            entry tweet, and watch the daily draw. One winner. One jackpot.
          </p>
        </header>

        // app/dashboard/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useSession } from 'next-auth/react';

import { REQUIRED_XPOT } from '../../lib/xpot';
import XpotAccessGate from '@/components/XpotAccessGate';   // 👈 NEW

// … all your helpers / types / components stay exactly the same …

// ─────────────────────────────────────────────
// Inner dashboard
// ─────────────────────────────────────────────

export default function DashboardPage() {
  // useSession may return undefined during prerender, so be defensive
  const sessionResult = useSession();
  const session = sessionResult?.data ?? null;

  const username =
    session?.user?.name ||
    session?.user?.email?.split('@')[0] ||
    'XPOT user';

  // … all your existing hooks / state / effects …

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <XpotAccessGate>   {/* 👈 Gate the whole dashboard behind X login */}
      <main className="min-h-screen bg-black text-slate-50 relative">
        {/* everything that was previously inside <main> stays the same */}
        {/* WalletDebug, headers, layout, etc… */}
        {/* ... your existing JSX unchanged ... */}
      </main>
    </XpotAccessGate>
  );
}

        {/* Main area */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Jackpot card */}
          <div className="flex flex-col justify-between gap-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Today&apos;s main jackpot
                </span>
                <span className="text-[10px] rounded-full border border-amber-400/40 bg-amber-400/5 px-2 py-0.5 uppercase tracking-[0.18em] text-amber-200">
                  One winner only
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-emerald-300 md:text-4xl">
                  $10,000
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  est. prize pool
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Next draw starts in
              </p>
              <p className="font-mono text-2xl text-slate-50 md:text-3xl">
                {formatTime(timeLeft)}
              </p>
              <p className="text-xs text-slate-400">
                Live, provably fair draws. The winner wallet is picked on-chain and paid
                directly.
              </p>
            </div>
          </div>

          {/* Entry steps */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <h2 className="text-xl font-semibold text-slate-200">
              How to enter the XPOT jackpot
            </h2>

            <ol className="mt-4 space-y-4 text-sm text-slate-300">
              <li>
                <span className="font-semibold text-slate-200">Buy &amp; hold XPOT</span>
                <br />
                Pick up XPOT on Solana and hold the minimum for the round.
              </li>

              <li>
                <span className="font-semibold text-slate-200">
                  Post your entry tweet
                </span>
                <br />
                Send one pre-filled tweet from XPOT. This activates your account forever.
              </li>

              <li>
                <span className="font-semibold text-slate-200">
                  Balance = more entries
                </span>
                <br />
                After activation, entries are based purely on how much XPOT you hold.
              </li>
            </ol>

            {/* One-tweet-ever button */}
            <button
              type="button"
              onClick={tweetPosted ? undefined : handleTweetClick}
              disabled={tweetPosted}
              className={`mt-3 w-full rounded-full border border-emerald-400 px-4 py-2 text-sm font-medium transition ${
                tweetPosted
                  ? 'cursor-not-allowed border-slate-700 bg-slate-800 text-slate-500'
                  : 'bg-slate-900 text-emerald-300 hover:border-emerald-300 hover:bg-slate-800'
              }`}
            >
              {tweetPosted
                ? 'Tweet posted – you’re locked in'
                : 'Tweet today’s entry'}
            </button>
            <p className="mt-2 text-[11px] text-slate-500">
              You only ever need to post once. From then on your XPOT balance decides
              your entries.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
