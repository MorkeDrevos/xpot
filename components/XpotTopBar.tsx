'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import { useUser, SignOutButton } from '@clerk/nextjs';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

import {
  Crown,
  ExternalLink,
  LogOut,
  Radio,
  Ticket,
  Trophy,
  Wallet,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';

/* ───────────────────────────────────────────── */
/* CONFIG                                       */
/* ───────────────────────────────────────────── */

const XPOT_OFFICIAL_CA = 'So11111111111111111111111111111111111111112'; // replace later
const XPOT_PRICE_ENDPOINT = '/api/price/xpot'; // optional, safe if missing

const XPOT_X_POST =
  'https://x.com/xpotbet/status/1998020027069653445?s=46&t=F6JSZfQ0P85RPUutnn4nag';

const WINNERS_HREF = '/winners';

/* ───────────────────────────────────────────── */

type HubWalletTone = 'slate' | 'emerald' | 'amber' | 'sky';

export type HubWalletStatus = {
  label: string;
  sublabel?: string;
  tone?: HubWalletTone;
  claimed?: boolean;
  winner?: boolean;
};

type XpotTopBarProps = {
  logoHref?: string;
  pillText?: string;
  sloganRight?: string;
  rightSlot?: ReactNode;
  hubWalletStatus?: HubWalletStatus;
  onOpenWalletModal?: () => void;
  liveIsOpen?: boolean;
  hasBanner?: boolean;
  maxWidthClassName?: string;
};

/* ───────────────────────────────────────────── */

function shorten(addr: string, l = 6, r = 6) {
  return `${addr.slice(0, l)}…${addr.slice(-r)}`;
}

function formatUsd(v: number | null) {
  if (!v || !Number.isFinite(v)) return '—';
  if (v >= 1) return `$${v.toFixed(2)}`;
  if (v >= 0.01) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(6)}`;
}

/* ───────────────────────────────────────────── */
/* OFFICIAL CONTRACT STRIP                       */
/* ───────────────────────────────────────────── */

function OfficialContractStrip() {
  const [copied, setCopied] = useState(false);
  const [priceUsd, setPriceUsd] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const res = await fetch(XPOT_PRICE_ENDPOINT, { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled && typeof data?.priceUsd === 'number') {
          setPriceUsd(data.priceUsd);
        }
      } catch {
        // silent
      }
    }

    tick();
    const id = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  async function onCopy() {
    await navigator.clipboard.writeText(XPOT_OFFICIAL_CA);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center gap-3 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
        <ShieldCheck className="h-4 w-4 text-emerald-300" />

        <div className="flex flex-col leading-tight">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Official XPOT Contract
          </span>
          <span className="font-mono text-[11px] text-emerald-100">
            {shorten(XPOT_OFFICIAL_CA)}
          </span>
        </div>

        <span className="mx-1 h-4 w-px bg-emerald-400/30" />

        <div className="text-[11px] font-mono text-emerald-200">
          {formatUsd(priceUsd)}
        </div>

        <button
          onClick={onCopy}
          className="ml-1 inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-500/20"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────── */
/* MAIN COMPONENT                               */
/* ───────────────────────────────────────────── */

export default function XpotTopBar({
  logoHref = '/',
  pillText = 'THE X-POWERED REWARD PROTOCOL',
  sloganRight,
  rightSlot,
  hubWalletStatus,
  onOpenWalletModal,
  liveIsOpen = false,
  hasBanner = true,
  maxWidthClassName = 'max-w-[1440px]',
}: XpotTopBarProps) {
  const pathname = usePathname() || '';
  const isHub = pathname === '/hub' || pathname.startsWith('/hub/');
  const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const top = hasBanner ? 'calc(var(--xpot-banner-h, 0px) - 1px)' : '0px';

  return (
    <header className="fixed inset-x-0 z-[60] w-full" style={{ top }}>
      <div className="border-b border-white/5 bg-black/70 backdrop-blur-md">
        <div className={`mx-auto w-full ${maxWidthClassName} px-4 sm:px-6`}>
          <div className="flex min-h-[124px] items-center justify-between gap-6">
            {/* LEFT */}
            <div className="flex items-center gap-4">
              <Link href={logoHref} className="flex items-center gap-3">
                <Image
                  src="/img/xpot-logo-light.png"
                  alt="XPOT"
                  width={460}
                  height={120}
                  priority
                  className="h-[120px] w-auto object-contain"
                />
              </Link>

              {!isHub && (
                <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[11px] font-semibold tracking-wide text-slate-300">
                  {pillText}
                </span>
              )}
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-4 text-sm text-slate-300">
              {isHub ? (
                <HubNav
                  clerkEnabled={clerkEnabled}
                  hubWalletStatus={hubWalletStatus}
                  onOpenWalletModal={onOpenWalletModal}
                  liveIsOpen={liveIsOpen}
                />
              ) : (
                <>
                  <OfficialContractStrip />
                  {rightSlot}
                  <PublicNav liveIsOpen={liveIsOpen} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative h-[1px] w-full overflow-hidden">
        <div className="absolute left-1/2 top-0 h-full w-[72%] -translate-x-1/2 bg-[linear-gradient(90deg,rgba(16,185,129,0.15),rgba(16,185,129,0.55),rgba(16,185,129,0.15))]" />
      </div>
    </header>
  );
}

/* ───────────────────────────────────────────── */
/* EXISTING NAV / HUB CODE BELOW (UNCHANGED)    */
/* ───────────────────────────────────────────── */

/* ... rest of your file remains exactly the same ... */
