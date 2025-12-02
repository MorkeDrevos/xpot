// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { REQUIRED_XPOT, TOKEN_SYMBOL } from '@/lib/xpot';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatTime(ms: number) {
  if (ms <= 0) return '00:00:00';
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function formatUsd(amount: number | null | undefined) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '0.00';
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatUsdPrice(amount: number | null | undefined) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '0.000000';
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 6,
    maximumFractionDigits: 6,
  });
}

const TWEET_FLAG_KEY = 'xpot_tweet_posted';
const XPOT_SUPPLY_FOR_DRAW = 1_000_000;

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function Home() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [tweetPosted, setTweetPosted] = useState(false);

  const [pricePerXpot, setPricePerXpot] = useState<number | null>(null);
  const [xpotPoolUsd, setXpotPoolUsd] = useState<number | null>(null);

  // Simple 24h countdown from first render (placeholder until real closesAt)
  useEffect(() => {
    const end = Date.now() + 24 * 60 * 60 * 1000;
    const tick = () => setTimeLeft(end - Date.now());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load tweet flag from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(TWEET_FLAG_KEY);
    if (stored === 'true') setTweetPosted(true);
  }, []);

  // Live price from /api/xpot/price (Jupiter under the hood)
  useEffect(() => {
    let cancelled = false;

    async function loadPrice() {
      try {
        const res = await fetch('/api/xpot/price', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();

        const price =
          typeof data.priceUsd === 'number' && !Number.isNaN(data.priceUsd)
            ? data.priceUsd
            : null;

        if (cancelled) return;

        setPricePerXpot(price);
        if (price !== null) {
          setXpotPoolUsd(price * XPOT_SUPPLY_FOR_DRAW);
        }
      } catch (err) {
        console.error('[XPOT] Failed to load price', err);
        if (!cancelled) {
          setPricePerXpot(null);
          setXpotPoolUsd(null);
        }
      }
    }

    loadPrice();
    const id = window.setInterval(loadPrice, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  function handleTweetClick() {
    const tweetText = `I'm in today's XPOT 1,000,000 on-chain reward draw. #XPOT`;
    const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(
      tweetText,
    )}`;

    if (typeof window !== 'undefined') {
      window.open(tweetUrl, '_blank', 'noopener,noreferrer');
      window.localStorage.setItem(TWEET_FLAG_KEY, 'true');
    }

    setTweetPosted(true);
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-black text-slate-50 px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 rounded-[32px] border border-slate-800/70 bg-[#020617]/95 shadow-[0_40px_120px_rgba(0,0,0,0.95)] backdrop-blur-xl">
        {/* Top nav */}
        <header className="flex items-center justify-between gap-3 border-b border-slate-900/80 px-5 py-4">
          <div className="flex items-center gap-2">
            <Image
              src="/img/xpot-logo-light.png"
              alt="XPOT"
              width={110}
              height={30}
              priority
            />
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Daily on-chain reward draw
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-emerald-400 hover:text-emerald-300"
            >
              Open dashboard
            </Link>
          </div>
        </header>

        {/* Hero grid */}
        <div className="grid gap-6 px-5 pb-6 pt-4 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          {/* LEFT: copy + steps */}
          <section className="flex flex-col gap-5">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                <span className="text-slate-300">XPOT</span>{' '}
                <span className="text-slate-50">
                  – your daily on-chain reward pool.
                </span>
              </h1>
              <p className="mt-3 max-w-xl text-sm text-slate-300 sm:text-[15px]">
                Every 24 hours, a fixed pool of{' '}
                <span className="font-semibold text-emerald-300">
                  1,000,000 XPOT
                </span>{' '}
                is set aside for a single wallet. No ticket sales, no custodial
                deposits – your on-chain balance decides your entries.
              </p>
            </div>

            {/* “How it works” */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                How today’s draw works
              </p>
              <ol className="mt-3 space-y-3 text-xs text-slate-300">
                <li>
                  <span className="font-semibold text-slate-100">
                    1. Hold the active ticket token
                  </span>
                  <br />
                  For this phase, XPOT reads your balance in{' '}
                  <span className="font-mono text-emerald-300">
                    {REQUIRED_XPOT.toLocaleString()} {TOKEN_SYMBOL}
                  </span>{' '}
                  or more on Solana to qualify.
                </li>
                <li>
                  <span className="font-semibold text-slate-100">
                    2. One entry per wallet
                  </span>
                  <br />
                  At snapshot time each qualifying wallet receives a single
                  entry tied to its address.
                </li>
                <li>
                  <span className="font-semibold text-slate-100">
                    3. One wallet receives today’s XPOT
                  </span>
                  <br />
                  When the countdown hits zero, one entry is selected. The full
                  1,000,000 XPOT allocation is reserved for that wallet.
                </li>
              </ol>

              <p className="mt-3 text-[11px] text-slate-500">
                XPOT never takes custody of your funds. Your wallet stays in
                your control at all times; we only read balances and publish
                results.
              </p>
            </div>
          </section>

          {/* RIGHT: Today’s XPOT + tweet activation */}
          <section className="flex flex-col gap-4">
            {/* Today’s XPOT panel */}
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-black p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Today&apos;s XPOT
              </p>

              {/* XPOT amount */}
              <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-3xl font-semibold text-slate-50 sm:text-4xl">
                  1,000,000
                </span>
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  XPOT
                </span>
              </div>

              {/* Live USD + per-XPOT price */}
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-baseline rounded-full bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-300">
                    <span className="font-mono text-sm">
                      {formatUsd(xpotPoolUsd)}
                    </span>
                    <span className="ml-1 text-[10px] uppercase tracking-[0.16em] text-emerald-400">
                      USD
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-500">(live)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  1 XPOT ≈{' '}
                  <span className="font-mono text-slate-100">
                    {formatUsdPrice(pricePerXpot)}
                  </span>{' '}
                  USD <span className="text-slate-600">(via Jupiter)</span>
                </p>
              </div>

              {/* Countdown */}
              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Next draw in
                </p>
                <p className="mt-1 font-mono text-2xl text-slate-50">
                  {formatTime(timeLeft)}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Countdown preview. In production this will be wired to today’s
                  on-chain draw close time.
                </p>
              </div>
            </div>

            {/* Activation tweet */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Activate your XPOT profile
              </p>
              <p className="mt-2 text-xs text-slate-300">
                XPOT uses your X account to connect wallets with winners and
                announcements. One small tweet is enough to link everything
                forever.
              </p>

              <button
                type="button"
                onClick={tweetPosted ? undefined : handleTweetClick}
                disabled={tweetPosted}
                className={`mt-3 w-full rounded-full border px-4 py-2 text-sm font-medium transition ${
                  tweetPosted
                    ? 'cursor-not-allowed border-slate-700 bg-slate-800 text-slate-500'
                    : 'border-emerald-400 bg-slate-950 text-emerald-300 hover:border-emerald-300 hover:bg-slate-900'
                }`}
              >
                {tweetPosted
                  ? 'Tweet posted – XPOT is linked to your X'
                  : 'Post activation tweet'}
              </button>

              <p className="mt-2 text-[11px] text-slate-500">
                You only ever need to post once. From then on, your on-chain
                balance and wallet decide how many entries you have in each
                daily XPOT.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
