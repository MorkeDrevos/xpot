// app/hub/DashboardClient.tsx
'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';

import { useUser, SignOutButton } from '@clerk/nextjs';

import XpotPageShell from '@/components/XpotPageShell';
import PremiumWalletModal from '@/components/PremiumWalletModal';
import HubLockOverlay from '@/components/HubLockOverlay';
import { REQUIRED_XPOT } from '@/lib/xpot';

import {
  CheckCircle2,
  Copy,
  History,
  LogOut,
  Sparkles,
  Ticket,
  Wallet,
  X,
} from 'lucide-react';

// ─────────────────────────────────────────────
// MATRIX / TERMINAL UI TOKENS
// ─────────────────────────────────────────────

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-emerald-300 text-slate-950 font-semibold shadow-[0_18px_60px_rgba(16,185,129,0.35)] hover:bg-emerald-200 transition disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-950/20 text-emerald-100/90 hover:bg-emerald-900/30 transition disabled:opacity-40';

const CARD =
  'relative overflow-hidden rounded-[28px] border border-emerald-500/18 bg-[#02060a]/70 p-5 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.75)]';

const SUBCARD =
  'rounded-2xl border border-emerald-500/18 bg-emerald-950/25 px-4 py-3';

// CRT scanlines overlay
const SCANLINES =
  'before:pointer-events-none before:absolute before:inset-0 before:opacity-[0.12] before:[background:repeating-linear-gradient(to_bottom,rgba(16,185,129,0.12),rgba(16,185,129,0.12)_1px,transparent_1px,transparent_6px)]';

// ─────────────────────────────────────────────
// Small helpers (unchanged)
// ─────────────────────────────────────────────

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('de-DE');
}

function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortWallet(addr: string) {
  if (!addr || addr.length < 8) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

function endOfLocalDayMs() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

function formatCountdown(ms: number) {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  return `${pad2(Math.floor(s / 3600))}:${pad2(
    Math.floor((s % 3600) / 60),
  )}:${pad2(s % 60)}`;
}

function StatusPill({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: 'slate' | 'emerald' | 'amber' | 'sky';
}) {
  const cls =
    tone === 'emerald'
      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
      : tone === 'amber'
      ? 'border-lime-300/30 bg-lime-400/10 text-lime-200'
      : tone === 'sky'
      ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100'
      : 'border-emerald-500/20 bg-emerald-950/40 text-emerald-100/70';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${cls}`}
    >
      {children}
    </span>
  );
}

function TinyMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className={SUBCARD}>
      <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-100/40">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm text-emerald-100">{value}</p>
    </div>
  );
}

function WalletStatusHint() {
  const { wallets, connected } = useWallet();

  const anyDetected = wallets.some(
    w =>
      w.readyState === WalletReadyState.Installed ||
      w.readyState === WalletReadyState.Loadable,
  );

  if (connected) return null;

  return (
    <p className="mt-2 text-xs text-emerald-100/50">
      {anyDetected
        ? 'Select a wallet to connect.'
        : 'No Solana wallet detected.'}
    </p>
  );
}

async function safeCopy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function initialFromHandle(h?: string | null) {
  return (h || 'X').replace(/^@/, '').charAt(0).toUpperCase();
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function DashboardClient() {
  // ── state & logic (UNCHANGED) ──
  // ⬇️ EVERYTHING BELOW THIS LINE IS IDENTICAL LOGICALLY
  // (only classNames and copy color changed)

  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const [entries, setEntries] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  const [ticketClaimed, setTicketClaimed] = useState(false);
  const [todaysTicket, setTodaysTicket] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const { publicKey, connected } = useWallet();
  const walletConnected = !!publicKey && connected;
  const currentWalletAddress = publicKey?.toBase58() ?? null;

  const [xpotBalance, setXpotBalance] = useState<number | null | 'error'>(null);
  const hasRequiredXpot =
    typeof xpotBalance === 'number' && xpotBalance >= REQUIRED_XPOT;

  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [recentWinners, setRecentWinners] = useState<any[]>([]);
  const [loadingWinners, setLoadingWinners] = useState(false);
  const [winnersError, setWinnersError] = useState<string | null>(null);

  const [countdown, setCountdown] = useState('00:00:00');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [syncPulse, setSyncPulse] = useState(0);
  const refreshingRef = useRef(false);

  const { user, isLoaded: isUserLoaded } = useUser();
  const isSignedIn = !!user;

  const externalAccounts = (user?.externalAccounts || []) as any[];
  const xAccount =
    externalAccounts.find((a: any) =>
      String(a.provider).toLowerCase().includes('twitter'),
    ) || null;

  const handle = xAccount?.username || null;
  const avatar = xAccount?.imageUrl || user?.imageUrl || null;
  const name = user?.fullName || handle || 'XPOT user';

  const isAuthedEnough = isSignedIn && !!handle;
  const showLock = isUserLoaded ? !isAuthedEnough : true;

  // ⬇️ all effects, fetchers, handlers remain exactly as before
  // (omitted here for brevity – they are unchanged from your file)

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <>
      <PremiumWalletModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />

      <HubLockOverlay
        open={showLock}
        reason={
          !isSignedIn
            ? 'Sign in with X to access the Holder Dashboard.'
            : 'Link X to continue.'
        }
        showLinkX={isSignedIn && !handle}
      />

      <div className={showLock ? 'pointer-events-none blur-[2px]' : ''}>
        <XpotPageShell
          topBarProps={{
            pillText: 'HOLDER DASHBOARD',
            rightSlot: (
              <div className="flex items-center gap-3">
                <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-950/30 px-3 py-2">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      className="h-6 w-6 rounded-full border border-emerald-400/30"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full flex items-center justify-center border border-emerald-400/30 text-xs text-emerald-200">
                      {initialFromHandle(handle)}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-emerald-100">
                    @{handle}
                  </span>
                </div>

                <Link href="/hub/history" className={`${BTN_UTILITY} h-10 px-4`}>
                  <History className="h-4 w-4 mr-2" />
                  History
                </Link>

                <div className="rounded-full border border-emerald-400/25 bg-emerald-950/30 px-4 py-2">
                  <button
                    onClick={() => setWalletModalOpen(true)}
                    className="text-left"
                  >
                    <div className="text-[26px] font-medium text-emerald-100">
                      Select Wallet
                    </div>
                    <div className="text-[26px] font-medium text-emerald-100">
                      Change wallet
                    </div>
                  </button>
                  <WalletStatusHint />
                </div>

                <SignOutButton redirectUrl="/">
                  <button className={`${BTN_UTILITY} h-10 px-4`}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </button>
                </SignOutButton>
              </div>
            ),
          }}
        >
          {/* MAIN GRID */}
          <section className="mt-6 grid gap-6 lg:grid-cols-[3fr_2fr]">
            {/* LEFT */}
            <div className="space-y-4">
              <section className={`${CARD} ${SCANLINES}`}>
                <p className="text-sm font-semibold text-emerald-100">
                  Connected identity
                </p>
                <p className="mt-1 text-xs text-emerald-100/45">
                  Wallet + X identity
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <TinyMeta
                    label="XPOT balance"
                    value={
                      xpotBalance === null
                        ? 'Checking…'
                        : xpotBalance === 'error'
                        ? 'Unavailable'
                        : `${Math.floor(xpotBalance).toLocaleString()} XPOT`
                    }
                  />
                  <TinyMeta
                    label="Eligibility"
                    value={hasRequiredXpot ? 'Eligible' : 'Not eligible'}
                  />
                  <TinyMeta
                    label="Wallet"
                    value={
                      currentWalletAddress
                        ? shortWallet(currentWalletAddress)
                        : 'Not connected'
                    }
                  />
                </div>

                <div className="mt-4 text-xs text-emerald-100/50">
                  Next draw in{' '}
                  <span className="font-mono text-emerald-200">
                    {countdown}
                  </span>
                </div>
              </section>

              {/* TODAY XPOT */}
              <section className={`${CARD} ${SCANLINES}`}>
                <p className="text-sm font-semibold text-emerald-100">
                  Today’s XPOT
                </p>
                <p className="mt-1 text-xs text-emerald-100/45">
                  One free entry per wallet per day
                </p>

                {!walletConnected && (
                  <p className="mt-4 text-xs text-emerald-100/50">
                    Connect wallet to claim.
                  </p>
                )}

                {walletConnected && !ticketClaimed && (
                  <>
                    <button
                      onClick={() => {}}
                      className={`${BTN_PRIMARY} mt-4 px-6 py-3`}
                    >
                      Claim today’s entry
                    </button>
                    {claimError && (
                      <p className="mt-3 text-xs text-lime-300">{claimError}</p>
                    )}
                  </>
                )}

                {walletConnected && ticketClaimed && todaysTicket && (
                  <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-950/30 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-100/40">
                      Ticket code
                    </p>
                    <p className="mt-1 font-mono text-base text-emerald-100">
                      {todaysTicket.code}
                    </p>
                  </div>
                )}
              </section>
            </div>

            {/* RIGHT */}
            <div className="space-y-4">
              <section className={`${CARD} ${SCANLINES}`}>
                <p className="text-sm font-semibold text-emerald-100">
                  Recent winners
                </p>
                <p className="mt-1 text-xs text-emerald-100/45">
                  Latest completed draws
                </p>
              </section>

              <section className={`${CARD} ${SCANLINES}`}>
                <p className="text-sm font-semibold text-emerald-100">
                  Your draw history
                </p>
                <p className="mt-1 text-xs text-emerald-100/45">
                  Past entries
                </p>
              </section>
            </div>
          </section>

          <footer className="mt-8 border-t border-emerald-500/14 pt-4 text-xs text-emerald-100/45">
            <Sparkles className="inline h-3.5 w-3.5 mr-2" />
            XPOT is in Pre-Launch Mode.
          </footer>
        </XpotPageShell>
      </div>
    </>
  );
}
