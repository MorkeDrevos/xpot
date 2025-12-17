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

  // Public pill (non-hub pages)
  pillText?: string;

  // Optional right slogan (non-hub pages)
  sloganRight?: string;

  // Escape hatch (non-hub pages only)
  rightSlot?: ReactNode;

  // Hub enhancements
  hubWalletStatus?: HubWalletStatus;
  onOpenWalletModal?: () => void;
  liveIsOpen?: boolean;

  // Banner
  hasBanner?: boolean;
  maxWidthClassName?: string;
};

const XPOT_X_POST =
  'https://x.com/xpotbet/status/1998020027069653445?s=46&t=F6JSZfQ0P85RPUutnn4nag';

const WINNERS_HREF = '/winners';

/**
 * Official Contract Address (shown in top bar on public pages).
 * Replace with your real mint when ready.
 */
const XPOT_OFFICIAL_CA = 'So11111111111111111111111111111111111111112';

/**
 * Optional - if you implement this API route later:
 * return { priceUsd: number }
 * Safe if missing - chip just shows "—".
 */
const XPOT_PRICE_ENDPOINT = '/api/price/xpot';

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
            <div className="flex min-w-0 items-center gap-4">
              <Link href={logoHref} className="flex shrink-0 items-center gap-3">
                <Image
                  src="/img/xpot-logo-light.png"
                  alt="XPOT"
                  width={460}
                  height={120}
                  priority
                  className="h-[120px] max-h-[120px] w-auto object-contain animate-[xpotStarFlash_20s_ease-in-out_infinite]"
                />
              </Link>

              <div className="hidden min-w-0 items-center gap-3 sm:flex">
                {isHub ? (
                  <Link
                    href="/hub"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[11px] font-semibold tracking-wide text-slate-300 hover:bg-white/[0.06]"
                    title="Back to Hub"
                  >
                    <span className="h-2 w-2 rounded-full bg-slate-300/70 shadow-[0_0_10px_rgba(148,163,184,0.35)]" />
                    <span className="truncate opacity-85">HUB</span>
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[11px] font-semibold tracking-wide text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-slate-300/70 shadow-[0_0_10px_rgba(148,163,184,0.35)]" />
                    <span className="truncate opacity-85">{pillText}</span>
                  </span>
                )}

                {!isHub && sloganRight && (
                  <span className="hidden items-center rounded-full border border-white/10 bg-white/[0.035] px-4 py-1.5 text-[11px] font-semibold tracking-wide text-slate-200 lg:inline-flex">
                    {sloganRight}
                  </span>
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-6 text-sm text-slate-300">
              {isHub ? (
                <HubNav
                  clerkEnabled={clerkEnabled}
                  hubWalletStatus={hubWalletStatus}
                  onOpenWalletModal={onOpenWalletModal}
                  liveIsOpen={liveIsOpen}
                />
              ) : (
                <>
                  {/* Official CA - compact + premium */}
                  <OfficialContractChipCompact />

                  {rightSlot ? rightSlot : <PublicNav liveIsOpen={liveIsOpen} />}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Premium divider */}
      <div className="relative h-[1px] w-full overflow-hidden">
        <div className="absolute left-1/2 top-0 h-full w-[72%] -translate-x-1/2 bg-[linear-gradient(90deg,rgba(56,189,248,0.1),rgba(56,189,248,0.55),rgba(56,189,248,0.1))]" />
      </div>
    </header>
  );
}

/* ---------------- OFFICIAL CA CHIP (compact) ---------------- */

function shortenAddress(addr: string, left = 6, right = 6) {
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

function OfficialContractChipCompact() {
  const [copied, setCopied] = useState(false);
  const [priceUsd, setPriceUsd] = useState<number | null>(null);

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
    const id = setInterval(poll, 5000);
    return () => {
      alive = false;
      clearInterval(id);
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
    <div className="hidden items-center md:flex">
      <div
        className="
          group relative inline-flex items-center gap-3
          rounded-full border border-emerald-400/25 bg-emerald-500/[0.08]
          px-3 py-1.5
          shadow-[0_0_34px_rgba(16,185,129,0.14)]
          hover:bg-emerald-500/[0.12]
        "
        title={XPOT_OFFICIAL_CA}
      >
        {/* subtle glow */}
        <div
          className="
            pointer-events-none absolute -inset-8 rounded-full opacity-60 blur-2xl
            bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.22),transparent_62%)]
          "
        />

        {/* left badge */}
        <span className="relative z-10 inline-flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-300" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/90">
            Official CA
          </span>
        </span>

        {/* address (single line) */}
        <span className="relative z-10 font-mono text-[11px] text-emerald-100/95">
          {shortenAddress(XPOT_OFFICIAL_CA, 10, 10)}
        </span>

        {/* optional price - tiny, not labeled */}
        <span className="relative z-10 hidden items-center gap-2 lg:inline-flex">
          <span className="h-3 w-px bg-emerald-300/15" />
          <span className="font-mono text-[11px] text-emerald-100/85">
            {formatUsd(priceUsd)}
          </span>
        </span>

        {/* copy icon button */}
        <button
          type="button"
          onClick={onCopy}
          className="
            relative z-10 inline-flex items-center justify-center
            rounded-full border border-emerald-400/15 bg-black/20
            p-2
            hover:bg-black/30
          "
          title="Copy official contract address"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-200" />
          ) : (
            <Copy className="h-4 w-4 text-emerald-200/90" />
          )}
        </button>
      </div>
    </div>
  );
}

/* ---------------- LIVE CHIP (shared) ---------------- */

function LiveDot({ isOpen }: { isOpen: boolean }) {
  return (
    <span className="relative inline-flex h-3 w-3 shrink-0 items-center justify-center">
      {isOpen ? (
        <>
          <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-emerald-400/60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
        </>
      ) : (
        <span className="inline-flex h-2 w-2 rounded-full bg-slate-500" />
      )}
    </span>
  );
}

function LiveNavItem({
  href,
  label = 'Live',
  isOpen,
  variant,
}: {
  href: string;
  label?: string;
  isOpen: boolean;
  variant: 'text' | 'pill';
}) {
  if (variant === 'pill') {
    return (
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 hover:bg-white/[0.06]"
        title={isOpen ? 'Live draw is open' : 'Live view'}
      >
        <LiveDot isOpen={isOpen} />
        <Radio className="h-5 w-5 text-emerald-300" />
        <span className="leading-none">{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 hover:text-white"
      title={isOpen ? 'Live draw is open' : 'Live view'}
    >
      <LiveDot isOpen={isOpen} />
      <Radio className="h-4 w-4 text-emerald-300" />
      <span className="leading-none">{label}</span>
    </Link>
  );
}

/* ---------------- PUBLIC NAV ---------------- */

function PublicNav({ liveIsOpen }: { liveIsOpen: boolean }) {
  return (
    <>
      <Link href="/hub" className="hover:text-white">
        Hub
      </Link>

      <LiveNavItem href="/hub/live" isOpen={liveIsOpen} variant="text" />

      <Link
        href={WINNERS_HREF}
        className="inline-flex items-center gap-2 hover:text-white"
      >
        <Trophy className="h-4 w-4 text-amber-300" />
        Winners
      </Link>

      <Link
        href={XPOT_X_POST}
        target="_blank"
        className="inline-flex items-center gap-2 hover:text-white"
        title="Official XPOT announcement"
      >
        <ExternalLink className="h-4 w-4" />
        X
      </Link>

      <Link
        href="/hub"
        className="rounded-full bg-white px-5 py-2 font-semibold text-black hover:bg-slate-200"
      >
        Enter today&apos;s XPOT →
      </Link>
    </>
  );
}

/* ---------------- HUB NAV ---------------- */

function HubNav({
  clerkEnabled,
  hubWalletStatus,
  onOpenWalletModal,
  liveIsOpen,
}: {
  clerkEnabled: boolean;
  hubWalletStatus?: HubWalletStatus;
  onOpenWalletModal?: () => void;
  liveIsOpen: boolean;
}) {
  const { user, isLoaded } = useUser();
  const externalAccounts = (user?.externalAccounts || []) as any[];

  const xAccount = externalAccounts.find(
    (acc) =>
      String(acc.provider || '').toLowerCase().includes('twitter') ||
      String(acc.provider || '').toLowerCase().includes('x'),
  );

  const handle = xAccount?.username || xAccount?.screenName || null;
  const avatar = xAccount?.imageUrl || user?.imageUrl || null;
  const displayHandle = handle ? `@${handle.replace(/^@/, '')}` : null;
  const initial = (displayHandle || 'X')[1] || 'X';

  return (
    <div className="flex items-center gap-4">
      {/* Identity chip */}
      <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 sm:flex">
        {isLoaded && avatar ? (
          <img
            src={avatar}
            alt="X avatar"
            className="h-6 w-6 rounded-full border border-white/10"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs">
            {initial}
          </div>
        )}
        <span className="text-xs font-semibold">
          {displayHandle ?? 'X linking…'}
        </span>
      </div>

      <LiveNavItem href="/hub/live" isOpen={liveIsOpen} variant="pill" />

      <Link
        href={WINNERS_HREF}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 hover:bg-white/[0.06]"
      >
        <Trophy className="h-5 w-5 text-amber-300" />
        Winners
      </Link>

      <Link
        href={XPOT_X_POST}
        target="_blank"
        title="Official XPOT announcement"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 hover:bg-white/[0.06]"
      >
        <ExternalLink className="h-5 w-5" />
        X
      </Link>

      <HubWalletMenuInline
        hubWalletStatus={hubWalletStatus}
        onOpenWalletModal={onOpenWalletModal}
      />

      {clerkEnabled && (
        <SignOutButton redirectUrl="/">
          <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 hover:bg-white/[0.06]">
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </SignOutButton>
      )}
    </div>
  );
}

/* ---------------- WALLET ---------------- */

function toneRing(tone: HubWalletTone) {
  if (tone === 'emerald') return 'ring-emerald-400/20 bg-emerald-500/5';
  if (tone === 'amber') return 'ring-amber-400/20 bg-amber-500/5';
  if (tone === 'sky') return 'ring-sky-400/20 bg-sky-500/5';
  return 'ring-white/10 bg-white/[0.03]';
}

function HubWalletMenuInline({
  hubWalletStatus,
  onOpenWalletModal,
}: {
  hubWalletStatus?: HubWalletStatus;
  onOpenWalletModal?: () => void;
}) {
  const { setVisible } = useWalletModal();
  const { publicKey, connected } = useWallet();

  const addr = connected && publicKey ? publicKey.toBase58() : null;

  const label =
    hubWalletStatus?.label ?? (connected ? 'Wallet linked' : 'Select wallet');
  const sublabel =
    hubWalletStatus?.sublabel ?? (addr ? shortWallet(addr) : 'Change wallet');

  const tone: HubWalletTone =
    hubWalletStatus?.winner
      ? 'sky'
      : hubWalletStatus?.claimed
      ? 'emerald'
      : connected
      ? 'sky'
      : 'amber';

  const microIcon = hubWalletStatus?.winner ? (
    <Crown className="h-4 w-4" />
  ) : hubWalletStatus?.claimed ? (
    <Ticket className="h-4 w-4" />
  ) : (
    <Wallet className="h-4 w-4" />
  );

  const open = () =>
    onOpenWalletModal ? onOpenWalletModal() : setVisible(true);

  return (
    <button
      onClick={open}
      className={`group rounded-full border border-white/10 px-6 py-3 ring-1 ${toneRing(
        tone,
      )} hover:opacity-95`}
      title={addr ?? undefined}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/30">
          {microIcon}
        </span>
        <span className="font-semibold">{label}</span>
      </div>
      <div className="mt-1 text-[11px] text-slate-400">{sublabel}</div>
    </button>
  );
}

function shortWallet(addr: string) {
  return addr ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : '';
}
