// app/admin/AdminClient.tsx
'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import JackpotPanel from '@/components/JackpotPanel';
import { XPOT_POOL_SIZE } from '@/lib/xpot';
import XpotPageShell from '@/components/XpotPageShell';

const MAX_TODAY_TICKETS = 10;
const MAX_RECENT_WINNERS = 9;
const MAIN_XPOT_REWARD = XPOT_POOL_SIZE;

const AUTO_DRAW_ENABLED =
  process.env.NEXT_PUBLIC_XPOT_AUTO_DRAW_ENABLED === 'true';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type DrawStatus = 'open' | 'closed' | 'completed';

type TodayDraw = {
  id: string;
  date: string;
  status: DrawStatus;
  jackpotUsd: number;
  rolloverUsd: number;
  ticketsCount: number;
  closesAt?: string | null;
};

type TicketStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

type AdminTicket = {
  id: string;
  code: string;
  walletAddress: string;
  status: TicketStatus;
  createdAt: string;
  jackpotUsd?: number;
};

type AdminWinnerKind = 'main' | 'bonus';

type AdminWinner = {
  id: string;
  drawId: string;
  date: string;
  ticketCode: string;
  walletAddress: string;
  jackpotUsd: number;
  payoutUsd: number; // used as XPOT amount in UI
  isPaidOut: boolean;
  txUrl?: string | null;
  kind?: AdminWinnerKind;
  label?: string | null;
};

type BonusDropStatus = 'SCHEDULED' | 'FIRED' | 'CANCELLED';

type AdminBonusDrop = {
  id: string;
  label: string;
  amountXpot: number;
  scheduledAt: string;
  status: BonusDropStatus;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const ADMIN_TOKEN_KEY = 'xpot_admin_token';

function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB');
}

function formatDateTime(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatUsd(amount: number | null | undefined, decimals = 2) {
  if (amount == null || !Number.isFinite(amount)) return '$0.00';
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatXpot(amount: number | null | undefined, decimals = 2) {
  if (amount == null || !Number.isFinite(amount)) return '0 XPOT';
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })} XPOT`;
}

function UsdPill({
  amount,
  size = 'md',
}: {
  amount: number | null | undefined;
  size?: 'sm' | 'md';
}) {
  const value = formatUsd(amount);
  const base =
    'inline-flex items-baseline rounded-full bg-emerald-500/10 text-emerald-300 font-semibold';
  const cls =
    size === 'sm'
      ? `${base} px-2 py-0.5 text-xs`
      : `${base} px-3 py-1 text-sm`;

  return (
    <span className={cls}>
      <span className="font-mono text-[0.92em]">{value}</span>
      <span className="ml-1 text-[0.7em] uppercase tracking-[0.16em] text-emerald-400">
        USD
      </span>
    </span>
  );
}

function formatWinnerLabel(w: AdminWinner): string | null {
  if (!w.label) return null;
  const raw = w.label.trim();
  if (w.kind === 'main' || /jackpot/i.test(raw)) return 'Main XPOT';
  return raw.replace(/jackpot/gi, 'XPOT');
}

function XpotPill({
  amount,
  size = 'md',
}: {
  amount: number | null | undefined;
  size?: 'sm' | 'md';
}) {
  const value = formatXpot(amount);
  const parts = value.split(' ');
  const unit = parts.pop();
  const amountStr = parts.join(' ');

  const base =
    'inline-flex items-baseline rounded-full border border-slate-700/80 bg-slate-950/80 text-slate-100 font-semibold shadow-[0_0_0_1px_rgba(15,23,42,0.9)]';
  const cls =
    size === 'sm' ? `${base} px-3 py-1 text-xs` : `${base} px-4 py-1.5 text-sm`;

  return (
    <span className={cls}>
      <span className="font-mono tracking-[0.14em] text-[0.9em]">
        {amountStr}
      </span>
      <span className="ml-2 text-[0.68em] uppercase tracking-[0.24em] text-slate-400">
        {unit}
      </span>
    </span>
  );
}

function truncateAddress(addr: string, visible: number = 6) {
  if (!addr) return '(unknown wallet)';
  if (addr.length <= visible * 2) return addr;
  return `${addr.slice(0, visible)}…${addr.slice(-visible)}`;
}

function CopyableWallet({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  if (!address)
    return (
      <span className="font-mono text-xs text-slate-500">
        (unknown wallet)
      </span>
    );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error('Failed to copy wallet address', err);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group inline-flex items-center gap-1 text-[11px] text-slate-400 transition-colors hover:text-emerald-300"
    >
      <span className="font-mono">{truncateAddress(address, 6)}</span>
      <span className="rounded-md border border-slate-600/60 px-1 py-[1px] text-[10px] tracking-wide group-hover:border-emerald-400/60">
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────
// Animated logo (Lottie) with safe fallback
// expects /public/lottie/xpot-logo.json
// ─────────────────────────────────────────────

function XpotLogoAnimated({
  className,
  width = 132,
  height = 36,
}: {
  className?: string;
  width?: number;
  height?: number;
}) {
  const [Lottie, setLottie] = useState<any>(null);
  const [animationData, setAnimationData] = useState<any>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const mod = await import('lottie-react');
        if (!cancelled) setLottie(() => mod.default);
      } catch {
        if (!cancelled) setFailed(true);
      }

      try {
        const res = await fetch('/lottie/xpot-logo.json', {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('missing lottie json');
        const json = await res.json();
        if (!cancelled) setAnimationData(json);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed || !Lottie || !animationData) {
    return (
      <Image
        src="/img/xpot-logo-light.png"
        alt="XPOT"
        width={width}
        height={height}
        priority
        className={className}
      />
    );
  }

  const Comp = Lottie;
  return (
    <div className={className} style={{ width, height }}>
      <Comp animationData={animationData} loop autoplay />
    </div>
  );
}

// ─────────────────────────────────────────────
// Button styles
// ─────────────────────────────────────────────

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_DANGER =
  'inline-flex items-center justify-center rounded-full border border-red-500/70 bg-red-500/10 text-red-200 hover:bg-red-500/20 transition disabled:cursor-not-allowed disabled:opacity-50';

// ─────────────────────────────────────────────
// Page (CLIENT)
// ─────────────────────────────────────────────

export default function AdminClient() {
  // (everything below is EXACTLY your original AdminPage logic)
  // ✅ keep all your state, effects, handlers, UI as-is

  // ...PASTE THE REST OF YOUR ORIGINAL FILE CONTENT HERE...
  // (starting from: const [adminToken, setAdminToken] = useState...
  // and ending at the end of your return JSX)

  return (
    <XpotPageShell title="Operations Center" subtitle="Control room for today’s XPOT">
      {/* IMPORTANT: do NOT re-add extra global backgrounds here if XpotPageShell already provides them */}
      {/* Keep your existing UI exactly as it was */}
      <div className="text-slate-200">
        Paste the remainder of your original Admin page here (unchanged).
      </div>
    </XpotPageShell>
  );
}
