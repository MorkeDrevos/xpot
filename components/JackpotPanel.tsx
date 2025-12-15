// app/components/JackpotPanel.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { TOKEN_MINT, XPOT_POOL_SIZE } from '@/lib/xpot';

const JACKPOT_XPOT = XPOT_POOL_SIZE;
const PRICE_POLL_MS = 2000;

type JackpotPanelProps = {
  isLocked?: boolean;
  onJackpotUsdChange?: (value: number | null) => void;
  variant?: 'standalone' | 'embedded';
};

function formatUsd(value: number | null) {
  if (value === null || !Number.isFinite(value)) return '$0.00';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const MILESTONES = [
  25, 50, 75, 100,
  150, 200, 300, 400, 500,
  750, 1_000, 1_500, 2_000, 3_000, 4_000, 5_000,
  7_500, 10_000, 15_000, 20_000, 30_000, 40_000, 50_000,
  75_000, 100_000, 150_000, 200_000, 300_000, 400_000, 500_000,
  750_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000,
];

function getMadridSessionKey() {
  const now = new Date();
  const madridNow = new Date(
    now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }),
  );
  madridNow.setHours(madridNow.getHours() + 2);
  return `${madridNow.getFullYear()}${String(
    madridNow.getMonth() + 1,
  ).padStart(2, '0')}${String(madridNow.getDate()).padStart(2, '0')}`;
}

export default function JackpotPanel({
  isLocked,
  onJackpotUsdChange,
}: JackpotPanelProps) {
  const [priceUsd, setPriceUsd] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hadError, setHadError] = useState(false);
  const [maxJackpotToday, setMaxJackpotToday] = useState<number | null>(null);

  const [justPumped, setJustPumped] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  const prevJackpot = useRef<number | null>(null);
  const updatePulseTimeout = useRef<number | null>(null);

  const sessionKey = `xpot_max_session_usd_${getMadridSessionKey()}`;

  useEffect(() => {
    const stored = localStorage.getItem(sessionKey);
    if (stored) {
      const num = Number(stored);
      if (!Number.isNaN(num)) setMaxJackpotToday(num);
    }
  }, [sessionKey]);

  useEffect(() => {
    let timer: number | null = null;

    async function fetchPrice() {
      try {
        setHadError(false);
        const res = await fetch(
          `https://lite-api.jup.ag/price/v3?ids=${TOKEN_MINT}`,
        );
        if (!res.ok) throw new Error('Price fetch failed');

        const json = await res.json();
        const price = json[TOKEN_MINT]?.usdPrice;

        if (typeof price === 'number') {
          setPriceUsd(price);
          setJustUpdated(true);
          if (updatePulseTimeout.current)
            clearTimeout(updatePulseTimeout.current);
          updatePulseTimeout.current = window.setTimeout(
            () => setJustUpdated(false),
            400,
          );
        } else {
          throw new Error('Invalid price');
        }
      } catch {
        setPriceUsd(null);
        setHadError(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrice();
    timer = window.setInterval(fetchPrice, PRICE_POLL_MS);

    return () => {
      if (timer) clearInterval(timer);
      if (updatePulseTimeout.current)
        clearTimeout(updatePulseTimeout.current);
    };
  }, []);

  const jackpotUsd = priceUsd ? JACKPOT_XPOT * priceUsd : null;

  useEffect(() => {
    onJackpotUsdChange?.(jackpotUsd);
    if (jackpotUsd == null) return;

    if (prevJackpot.current && jackpotUsd > prevJackpot.current) {
      setJustPumped(true);
      setTimeout(() => setJustPumped(false), 1600);
    }
    prevJackpot.current = jackpotUsd;

    setMaxJackpotToday(prev => {
      const next = prev == null ? jackpotUsd : Math.max(prev, jackpotUsd);
      localStorage.setItem(sessionKey, String(next));
      return next;
    });
  }, [jackpotUsd, sessionKey, onJackpotUsdChange]);

  const reachedMilestone =
    jackpotUsd != null
      ? MILESTONES.filter(m => jackpotUsd >= m).slice(-1)[0] ?? null
      : null;

  const nextMilestone =
    jackpotUsd != null
      ? MILESTONES.find(m => jackpotUsd < m) ?? null
      : null;

  const showUnavailable =
    !isLoading && (jackpotUsd === null || hadError);

  const poolLabel = `${JACKPOT_XPOT.toLocaleString()} XPOT`;
  const displayUsd = jackpotUsd ? formatUsd(jackpotUsd) : '—';

  return (
    <section className="relative rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 shadow-sm">
      <div
        className={`pointer-events-none absolute inset-0 rounded-2xl border border-[#3BA7FF]/40 shadow-[0_0_40px_rgba(59,167,255,0.45)] transition-opacity ${
          justPumped ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* HEADER */}
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="space-y-3">
          <span className="inline-flex rounded-full bg-[rgba(59,167,255,0.12)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7CC8FF]">
            Today&apos;s XPOT
          </span>

          <span className="inline-flex items-baseline rounded-xl bg-black/40 px-4 py-2 font-mono text-lg tracking-[0.16em] text-slate-100 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]">
            {poolLabel}
          </span>
        </div>

        <div className="flex flex-col items-end gap-1 text-xs">
          {isLocked && (
            <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-200">
              Draw locked
            </span>
          )}
          {showUnavailable && (
            <span className="text-[11px] font-semibold text-amber-300">
              Live price not available yet.
            </span>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <p className="mt-4 text-xs text-slate-400">
        Today&apos;s XPOT round is fixed at 1,000,000 XPOT. USD value updates live
        via Jupiter.
      </p>
    </section>
  );
}
