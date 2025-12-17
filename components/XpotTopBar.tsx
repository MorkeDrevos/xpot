// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ReactNode, useEffect, useMemo, useState } from 'react';
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
  pillText?: string;
  sloganRight?: string;
  rightSlot?: ReactNode;

  hubWalletStatus?: HubWalletStatus;
  onOpenWalletModal?: () => void;
  liveIsOpen?: boolean;

  hasBanner?: boolean;
  maxWidthClassName?: string;
};

const XPOT_X_POST =
  'https://x.com/xpotbet/status/1998020027069653445?s=46&t=F6JSZfQ0P85RPUutnn4nag';

const WINNERS_HREF = '/winners';

const XPOT_OFFICIAL_CA = 'FYeJCZvfzwUcFLq7mr82zJFu8qvoJ3kQB3W1kd1Ejko1';
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
                  <OfficialContractRoyalChip />
                  {rightSlot ? rightSlot : <PublicNav liveIsOpen={liveIsOpen} />}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative h-[1px] w-full overflow-hidden">
        <div className="absolute left-1/2 top-0 h-full w-[72%] -translate-x-1/2 bg-[linear-gradient(90deg,rgba(56,189,248,0.1),rgba(56,189,248,0.55),rgba(56,189,248,0.1))]" />
      </div>
    </header>
  );
}

/* ---------------- OFFICIAL CA CHIP (ROYAL, WIDER, NO YELLOW TICK, NEW ORNAMENT) ---------------- */

function shortenAddress(addr: string, left = 10, right = 10) {
  if (!addr) return '';
  if (addr.length <= left + right + 3) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}

function formatUsd(v: number | null) {
  if (v === null || !Number.isFinite(v)) return null; // hide instead of "—"
  if (v >= 1) return `$${v.toFixed(2)}`;
  if (v >= 0.01) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(6)}`;
}

function OfficialContractRoyalChip() {
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
    const id = setInterval(poll, 6000);
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

  const addrShort = useMemo(() => shortenAddress(XPOT_OFFICIAL_CA, 10, 10), []);
  const priceText = formatUsd(priceUsd);

  return (
    <div className="hidden items-center md:flex">
      <div
        className="
          group relative inline-flex items-center
          rounded-full
          border border-emerald-400/14
          bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]
          shadow-[0_18px_55px_rgba(0,0,0,0.52)]
          backdrop-blur-xl
          hover:border-emerald-300/22
          px-3 py-[6px]
          min-w-[360px]
        "
        title={XPOT_OFFICIAL_CA}
      >
        {/* Aura */}
        <div className="pointer-events-none absolute -inset-10 rounded-full opacity-60 blur-3xl bg-[radial-gradient(circle_at_18%_10%,rgba(16,185,129,0.18),transparent_55%),radial-gradient(circle_at_86%_70%,rgba(56,189,248,0.10),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/10" />

        <div className="relative z-10 flex w-full items-center justify-between gap-3">
          {/* Left cluster */}
          <div className="flex min-w-0 items-center gap-3">
            {/* Seal (no yellow tick) */}
            <span
              className="
                inline-flex h-7 w-7 items-center justify-center
                rounded-full
                border border-emerald-300/18
                bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.14),rgba(0,0,0,0.38))]
                shadow-[0_0_0_1px_rgba(16,185,129,0.10),0_12px_34px_rgba(0,0,0,0.50)]
              "
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-200" />
            </span>

            {/* Text */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-emerald-200/90">
                  OFFICIAL CA
                </span>

                {/* optional tiny crown “royal” accent */}
                <Crown className="h-3.5 w-3.5 text-emerald-200/70" />
              </div>

              <div className="mt-[3px] flex items-center gap-2">
                <span className="truncate font-mono text-[11px] text-slate-100/95">
                  {addrShort}
                </span>

                {priceText && (
                  <span className="hidden xl:inline-flex items-center gap-2">
                    {/* New “ornament” separator (not a boring line) */}
                    <span className="relative inline-flex h-4 w-[1px] overflow-hidden rounded-full">
                      <span className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-200/25 to-transparent" />
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      XPOT
                    </span>
                    <span className="font-mono text-[11px] text-slate-100/80">
                      {priceText}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* New ornament between content and copy (royal divider + diamond) */}
          <div className="flex items-center gap-2">
            <span className="relative hidden sm:inline-flex h-5 w-[1px] overflow-hidden rounded-full">
              <span className="absolute inset-0 bg-gradient-to-b from-transparent via-white/14 to-transparent" />
              <span className="absolute inset-0 blur-[1px] bg-gradient-to-b from-transparent via-emerald-300/18 to-transparent" />
            </span>
            <span className="hidden sm:inline-flex h-2 w-2 rotate-45 rounded-[3px] border border-white/10 bg-white/[0.04] shadow-[0_0_18px_rgba(16,185,129,0.18)]" />

            {/* Copy button (smaller, clean) */}
            <button
              type="button"
              onClick={onCopy}
              className="
                inline-flex items-center justify-center
                h-8 w-8 rounded-full
                border border-white/10
                bg-white/[0.04]
                hover:bg-white/[0.07]
                shadow-[0_12px_34px_rgba(0,0,0,0.40)]
              "
              title="Copy official contract address"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-200" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-slate-100/90" />
              )}
            </button>
          </div>
        </div>
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

      <Link href={WINNERS_HREF} className="inline-flex items-center gap-2 hover:text-white">
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
        <span className="text-xs font-semibold">{displayHandle ?? 'X linking…'}</span>
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

      <HubWalletMenuInline hubWalletStatus={hubWalletStatus} onOpenWalletModal={onOpenWalletModal} />

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

  const open = () => (onOpenWalletModal ? onOpenWalletModal() : setVisible(true));

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
