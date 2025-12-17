// components/PreLaunchBanner.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, ShieldCheck } from 'lucide-react';

type PreLaunchBannerProps = {
  hidden?: boolean;
};

const XPOT_OFFICIAL_CA = 'FYeJCZvfzwUcFLq7mr82zJFu8qvoJ3kQB3W1kd1Ejko1';

// Optional - safe if missing, UI shows "—"
const XPOT_PRICE_ENDPOINT = '/api/price/xpot';

function shortenAddress(addr: string, left = 8, right = 6) {
  if (!addr) return '';
  if (addr.length <= left + right + 3) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}

function formatUsd(v: number | null) {
  if (v === null || !Number.isFinite(v)) return '—';
  if (v >= 1) return `$${v.toFixed(2)}`;
  if (v >= 0.01) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(6)}`;
}

function OfficialCaChip() {
  const [copied, setCopied] = useState(false);
  const [priceUsd, setPriceUsd] = useState<number | null>(null);

  const addrShort = useMemo(() => shortenAddress(XPOT_OFFICIAL_CA, 10, 8), []);

  useEffect(() => {
    let alive = true;

    async function poll() {
      try {
        const res = await fetch(XPOT_PRICE_ENDPOINT, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;
        if (typeof data?.priceUsd === 'number') setPriceUsd(data.priceUsd);
      } catch {
        // silent
      }
    }

    poll();
    const id = window.setInterval(poll, 7000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(XPOT_OFFICIAL_CA);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <div className="hidden items-center lg:flex">
      <div
        className="
          group relative inline-flex items-center gap-2
          rounded-full
          px-3 py-1.5
          border border-white/10
          bg-white/[0.06]
          backdrop-blur
          hover:bg-white/[0.10]
        "
        title={XPOT_OFFICIAL_CA}
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/30">
          <ShieldCheck className="h-4 w-4 text-emerald-200" />
        </span>

        <div className="flex flex-col leading-none">
          <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-emerald-200/90">
            Verified CA
          </span>
          <span className="mt-1 font-mono text-[12px] text-white/90">{addrShort}</span>
        </div>

        <div className="hidden 2xl:flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">XPOT</span>
          <span className="font-mono text-[12px] text-white/80">{formatUsd(priceUsd)}</span>
        </div>

        <button
          type="button"
          onClick={onCopy}
          className="
            inline-flex items-center justify-center
            h-7 w-7 rounded-full
            border border-white/10
            bg-white/[0.05]
            hover:bg-white/[0.08]
          "
          title="Copy official contract address"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-200" /> : <Copy className="h-4 w-4 text-white/90" />}
        </button>
      </div>
    </div>
  );
}

export default function PreLaunchBanner({ hidden = false }: PreLaunchBannerProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;

    if (hidden) {
      root.style.setProperty('--xpot-banner-h', '0px');
      return;
    }

    function setVar() {
      const el = ref.current;
      if (!el) return;
      const h = el.offsetHeight || 0;
      root.style.setProperty('--xpot-banner-h', `${h}px`);
    }

    setVar();

    const ro = new ResizeObserver(() => setVar());
    if (ref.current) ro.observe(ref.current);

    window.addEventListener('resize', setVar);
    const t1 = window.setTimeout(setVar, 0);
    const t2 = window.setTimeout(setVar, 120);

    return () => {
      window.removeEventListener('resize', setVar);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro.disconnect();
    };
  }, [hidden]);

  if (hidden) return null;

  return (
    <div
      ref={ref}
      className="
        fixed inset-x-0 top-0 z-[60]
        border-b border-white/10
        bg-gradient-to-r from-[#5b21b6] via-[#2e1065] to-[#111827]
      "
    >
      <div className="mx-auto max-w-[1440px] px-4">
        <div className="flex h-12 items-center justify-center">
          <div className="relative w-full">
            <div
              className="
                pointer-events-none absolute inset-0
                opacity-60
                bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.10),transparent)]
                translate-x-[-60%]
                animate-[xpotBannerSweep_5.5s_linear_infinite]
              "
            />

            <div className="relative flex items-center justify-center">
              <p className="text-center text-[12px] font-semibold uppercase tracking-[0.32em] text-white/80">
                PRE-LAUNCH MODE <span className="mx-2 text-white/40">•</span> CONTRACT DEPLOYED{' '}
                <span className="mx-2 text-white/40">•</span> OFFICIAL CA VERIFIED{' '}
                <span className="mx-2 text-white/40">•</span> TRADING NOT ACTIVE YET
              </p>

              {/* Right-side CA chip (desktop only) */}
              <div className="absolute right-0">
                <OfficialCaChip />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes xpotBannerSweep {
          0% {
            transform: translateX(-60%);
          }
          100% {
            transform: translateX(160%);
          }
        }
      `}</style>
    </div>
  );
}
