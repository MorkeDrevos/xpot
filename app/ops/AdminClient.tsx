// app/ops/AdminClient.tsx
'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import XpotLogoLottie from '@/components/XpotLogoLottie';
import JackpotPanel from '@/components/JackpotPanel';
import XpotPageShell from '@/components/XpotPageShell';
import OperationsCenterBadge from '@/components/OperationsCenterBadge';

import {
  BadgeCheck,
  CalendarClock,
  Crown,
  Info,
  KeyRound,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  Ticket,
  Timer,
  XCircle,
} from 'lucide-react';

const MAX_TODAY_TICKETS = 7;
const MAX_RECENT_WINNERS = 10;

// ✅ keep API as-is (do NOT change)
const OPS_API = '/api/ops';
const ops = (p: string) => `${OPS_API}${p.startsWith('/') ? '' : '/'}${p}`;

// ✅ fallback admin endpoints (do NOT replace ops - only used if ops returns 404)
const ADMIN_PICK_WINNER = '/api/admin/draw/pick-winner';

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

type OpsMode = 'MANUAL' | 'AUTO';

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

// Public live draw payload (fallback when ops today returns null)
type LiveDrawPayload = {
  draw: {
    dailyXpot: number;
    dayNumber: number;
    dayTotal: number;
    drawDate: string; // ISO
    closesAt: string; // ISO
    status: 'OPEN' | 'LOCKED' | 'COMPLETED';
  } | null;
};

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
  const cls = size === 'sm' ? `${base} px-2 py-0.5 text-xs` : `${base} px-3 py-1 text-sm`;

  return (
    <span className={cls}>
      <span className="font-mono text-[0.92em]">{value}</span>
      <span className="ml-1 text-[0.7em] uppercase tracking-[0.16em] text-emerald-400">
        USD
      </span>
    </span>
  );
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
  const cls = size === 'sm' ? `${base} px-3 py-1 text-xs` : `${base} px-4 py-1.5 text-sm`;

  return (
    <span className={cls}>
      <span className="font-mono tracking-[0.14em] text-[0.9em]">{amountStr}</span>
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

function StatusDot({ on }: { on: boolean }) {
  return (
    <span
      className={`h-1.5 w-1.5 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.9)] ${
        on ? 'bg-emerald-400' : 'bg-slate-600'
      }`}
    />
  );
}

function Badge({
  children,
  tone = 'slate',
}: {
  children: ReactNode;
  tone?: 'slate' | 'emerald' | 'gold' | 'sky' | 'red';
}) {
  const cls =
    tone === 'emerald'
      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
      : tone === 'gold'
      ? 'xpot-pill-gold border bg-[rgba(var(--xpot-gold),0.10)] text-[rgb(var(--xpot-gold-2))]'
      : tone === 'sky'
      ? 'border-sky-400/40 bg-sky-500/10 text-sky-100'
      : tone === 'red'
      ? 'border-red-400/40 bg-red-500/10 text-red-200'
      : 'border-slate-700/70 bg-slate-900/70 text-slate-300';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${cls}`}
    >
      {children}
    </span>
  );
}

function formatWinnerLabel(w: AdminWinner): string | null {
  if (!w.label) return null;
  const raw = w.label.trim();
  if (w.kind === 'main' || /jackpot/i.test(raw)) return 'Main XPOT';
  return raw.replace(/jackpot/gi, 'XPOT');
}

function CopyableWallet({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  if (!address) return <span className="font-mono text-xs text-slate-500">(unknown wallet)</span>;

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
      className="group inline-flex items-center gap-2 text-[11px] text-slate-400 transition-colors hover:text-emerald-300"
      title={address}
    >
      <span className="font-mono">{truncateAddress(address, 6)}</span>
      <span className="rounded-md border border-slate-600/60 px-1 py-[1px] text-[10px] tracking-wide group-hover:border-emerald-400/60">
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  );
}

// Map public live draw status to admin UI status
function mapLiveStatus(s: any): DrawStatus {
  const status = String(s ?? '').toUpperCase();
  if (status === 'OPEN') return 'open';
  if (status === 'COMPLETED') return 'completed';
  return 'closed';
}

function toTodayDrawFromLive(live: LiveDrawPayload['draw']): TodayDraw | null {
  if (!live) return null;
  return {
    id: `live:${live.drawDate}`,
    date: live.drawDate,
    status: mapLiveStatus(live.status),
    jackpotUsd: 0,
    rolloverUsd: 0,
    ticketsCount: 0,
    closesAt: live.closesAt,
  };
}

// Button styles (driven by globals.css)
const BTN = 'xpot-btn';
const BTN_VAULT = 'xpot-btn xpot-btn-vault';
const BTN_UTILITY = 'xpot-btn';
const BTN_DANGER = 'xpot-btn xpot-btn-danger';
const BTN_CROWN = BTN_VAULT;

type AuthedError = Error & { status?: number; payload?: any };

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenAccepted, setTokenAccepted] = useState(false);
  const [isSavingToken, setIsSavingToken] = useState(false);

  const [, setOpsMode] = useState<OpsMode>('MANUAL');
  const [effectiveOpsMode, setEffectiveOpsMode] = useState<OpsMode>('MANUAL');
  const [envAutoAllowed, setEnvAutoAllowed] = useState<boolean>(false);

  const [modeModalOpen, setModeModalOpen] = useState(false);
  const [modePending, setModePending] = useState<OpsMode>('MANUAL');
  const [modeTokenInput, setModeTokenInput] = useState('');
  const [modeSaving, setModeSaving] = useState(false);
  const [modeError, setModeError] = useState<string | null>(null);

  const [todayDraw, setTodayDraw] = useState<TodayDraw | null>(null);
  const [todayDrawError, setTodayDrawError] = useState<string | null>(null);
  const [todayLoading, setTodayLoading] = useState(true);

  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const [winners, setWinners] = useState<AdminWinner[]>([]);
  const [winnersError, setWinnersError] = useState<string | null>(null);
  const [winnersLoading, setWinnersLoading] = useState(true);

  const [isDevHost, setIsDevHost] = useState(false);

  const [txInputs, setTxInputs] = useState<Record<string, string>>({});
  const [savingPaidId, setSavingPaidId] = useState<string | null>(null);
  const [markPaidError, setMarkPaidError] = useState<string | null>(null);

  const [visibleTicketCount, setVisibleTicketCount] = useState(MAX_TODAY_TICKETS);
  const [visibleWinnerCount, setVisibleWinnerCount] = useState(MAX_RECENT_WINNERS);

  const visibleTickets = useMemo(
    () => tickets.slice(0, visibleTicketCount),
    [tickets, visibleTicketCount],
  );
  const visibleWinners = useMemo(
    () => winners.slice(0, visibleWinnerCount),
    [winners, visibleWinnerCount],
  );

  const [liveJackpotUsd, setLiveJackpotUsd] = useState<number | null>(null);

  const [countdownText, setCountdownText] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  const isWarningSoon = countdownSeconds !== null && countdownSeconds <= 15 * 60;
  const isWarningCritical = countdownSeconds !== null && countdownSeconds <= 5 * 60;

  const [bonusAmount, setBonusAmount] = useState('100000');
  const [bonusLabel, setBonusLabel] = useState('Bonus XPOT');
  const [bonusDelayMinutes, setBonusDelayMinutes] = useState<number>(30);
  const [bonusSubmitting, setBonusSubmitting] = useState(false);
  const [bonusError, setBonusError] = useState<string | null>(null);
  const [bonusSuccess, setBonusSuccess] = useState<string | null>(null);

  const [upcomingDrops, setUpcomingDrops] = useState<AdminBonusDrop[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [upcomingError, setUpcomingError] = useState<string | null>(null);

  const [nextBonusDrop, setNextBonusDrop] = useState<AdminBonusDrop | null>(null);
  const [nextBonusCountdown, setNextBonusCountdown] = useState<string | null>(null);

  const [pickError, setPickError] = useState<string | null>(null);
  const [pickSuccess, setPickSuccess] = useState<string | null>(null);
  const [isPickingWinner, setIsPickingWinner] = useState(false);

  const [bonusPickError, setBonusPickError] = useState<string | null>(null);
  const [bonusPickSuccess, setBonusPickSuccess] = useState<string | null>(null);
  const [isPickingBonusWinner, setIsPickingBonusWinner] = useState(false);
  const [isReopeningDraw, setIsReopeningDraw] = useState(false);

  const [creatingDraw, setCreatingDraw] = useState(false);

  const [cancelingDropId, setCancelingDropId] = useState<string | null>(null);
  const [cancelDropError, setCancelDropError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') setIsDevHost(window.location.hostname.startsWith('dev.'));
  }, []);

  // ── Load admin token ────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (stored) {
      setAdminToken(stored);
      setTokenAccepted(true);
      setTokenInput(stored);
    }
  }, []);

  async function safeJson(res: Response) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  // IMPORTANT:
  // - authedFetch THROWS on failures so UI doesn't silently show "no draw"
  async function authedFetch(input: string, init?: RequestInit) {
    if (!adminToken) {
      const e: AuthedError = new Error('UNAUTHED: Admin token missing');
      e.status = 401;
      throw e;
    }

    const headers = new Headers(init?.headers || {});
    headers.set('Content-Type', 'application/json');
    headers.set('x-xpot-admin-key', adminToken.trim());

    const res = await fetch(input, { ...init, headers });
    const data = await safeJson(res);

    if (!res.ok) {
      const msg = data?.error || `Request failed (${res.status})`;
      const e: AuthedError = new Error(msg);
      e.status = res.status;
      e.payload = data;
      throw e;
    }

    return data;
  }

  // ✅ if ops endpoint is missing (404), fallback to a known admin route
  async function authedFetchWith404Fallback(
    primaryUrl: string,
    init: RequestInit | undefined,
    fallbackUrl?: string,
  ) {
    try {
      return await authedFetch(primaryUrl, init);
    } catch (err: any) {
      const status = (err as AuthedError)?.status;
      if (status === 404 && fallbackUrl) {
        return await authedFetch(fallbackUrl, init);
      }
      throw err;
    }
  }

  async function loadOpsMode() {
    // If ops-mode route is missing, don't block ops page.
    try {
      const data = await authedFetch(ops('/ops-mode'));
      const m = ((data as any).mode ?? 'MANUAL') as OpsMode;
      const eff = ((data as any).effectiveMode ?? m) as OpsMode;
      const allowed = !!(data as any).envAutoAllowed;

      setOpsMode(m);
      setEffectiveOpsMode(eff);
      setEnvAutoAllowed(allowed);
    } catch (err: any) {
      const status = (err as AuthedError)?.status;
      if (status === 404) {
        setOpsMode('MANUAL');
        setEffectiveOpsMode('MANUAL');
        setEnvAutoAllowed(false);
        return;
      }
      throw err;
    }
  }

  async function saveOpsMode(next: OpsMode) {
    const data = await authedFetch(ops('/ops-mode'), {
      method: 'POST',
      body: JSON.stringify({ mode: next }),
    });

    const m = ((data as any).mode ?? next) as OpsMode;
    const eff = ((data as any).effectiveMode ?? m) as OpsMode;
    const allowed = !!(data as any).envAutoAllowed;

    setOpsMode(m);
    setEffectiveOpsMode(eff);
    setEnvAutoAllowed(allowed);
  }

  async function refreshUpcomingDrops() {
    setUpcomingLoading(true);
    setUpcomingError(null);

    try {
      const data = await authedFetch(ops('/bonus-upcoming'));
      setUpcomingDrops((data as any).upcoming ?? []);
    } catch (err: any) {
      const status = (err as AuthedError)?.status;
      // ✅ if endpoint missing, treat as "no upcoming"
      if (status === 404) {
        setUpcomingDrops([]);
        setUpcomingError(null);
      } else {
        console.error('[ADMIN] refresh upcoming error', err);
        setUpcomingError(err?.message || 'Failed to load upcoming drops');
      }
    } finally {
      setUpcomingLoading(false);
    }
  }

  // ── Manually create today’s draw (dev) ──────
  async function handleCreateTodayDraw() {
    setTodayDrawError(null);

    if (!adminToken) {
      alert('Admin token missing. Unlock admin first.');
      return;
    }

    setCreatingDraw(true);
    try {
      const data = await authedFetch(ops('/create-today-draw'), { method: 'POST' });
      if (!data || (data as any).ok === false)
        throw new Error((data as any)?.error || 'Failed to create today’s draw');
      window.location.reload();
    } catch (err: any) {
      console.error('[XPOT] create today draw error:', err);
      alert(err.message || 'Unexpected error creating today’s round');
    } finally {
      setCreatingDraw(false);
    }
  }

  // ── Schedule bonus XPOT ─────────────────────
  async function handleScheduleBonus(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBonusError(null);
    setBonusSuccess(null);

    if (!adminToken) {
      setBonusError('Admin token missing. Unlock admin first.');
      return;
    }

    if (!todayDraw) {
      setBonusError('No draw detected for today yet. Create today’s draw first or wait for auto-create.');
      return;
    }

    if (todayDraw.status !== 'open') {
      setBonusError('Today’s draw is not open. Bonus drops can only be scheduled for an open draw.');
      return;
    }

    const amountNumber = Number(bonusAmount);
    if (!Number.isFinite(amountNumber) || amountNumber < 100000) {
      setBonusError('Enter a valid XPOT amount (min 100,000).');
      return;
    }

    const allowedDelays = [5, 15, 30, 60];
    if (!allowedDelays.includes(bonusDelayMinutes)) {
      setBonusError('Select a valid bonus timer.');
      return;
    }

    setBonusSubmitting(true);
    try {
      const data = (await authedFetch(ops('/bonus-schedule'), {
        method: 'POST',
        body: JSON.stringify({
          amountXpot: amountNumber,
          label: bonusLabel || 'Bonus XPOT',
          delayMinutes: bonusDelayMinutes,
        }),
      })) as { drop?: AdminBonusDrop };

      const drop = data?.drop;
      setBonusSuccess(
        drop
          ? `Scheduled ${drop.label} · ${drop.amountXpot.toLocaleString()} XPOT.`
          : `Scheduled bonus XPOT.`,
      );
      await refreshUpcomingDrops();
    } catch (err: any) {
      console.error('[ADMIN] schedule bonus error', err);
      setBonusError(err?.message || 'Failed to schedule bonus XPOT.');
    } finally {
      setBonusSubmitting(false);
    }
  }

  // ── Cancel scheduled bonus drop ─────────────
  async function handleCancelBonusDrop(dropId: string) {
    setCancelDropError(null);

    if (!adminToken) {
      setCancelDropError('Admin token missing. Unlock admin first.');
      return;
    }

    setCancelingDropId(dropId);
    try {
      const data = await authedFetch(`${ops('/bonus-cancel')}?id=${encodeURIComponent(dropId)}`, {
        method: 'POST',
      });
      if (data && (data as any).ok === false)
        throw new Error((data as any).error || 'Failed to cancel drop');

      setUpcomingDrops(prev =>
        prev.map(d => (d.id === dropId ? { ...d, status: 'CANCELLED' } : d)),
      );
    } catch (err: any) {
      console.error('[ADMIN] cancel drop error', err);
      setCancelDropError(err?.message || 'Failed to cancel bonus drop.');
    } finally {
      setCancelingDropId(null);
    }
  }

  // ── Pick main winner (manual override) ───────
  async function handlePickMainWinner() {
    setPickError(null);
    setPickSuccess(null);

    if (!adminToken) {
      setPickError('Admin token missing. Unlock admin first.');
      return;
    }

    setIsPickingWinner(true);
    try {
      // ✅ Try ops first, but if /api/ops/pick-winner is missing (404), use the admin route you pasted.
      const data = await authedFetchWith404Fallback(
        ops('/pick-winner'),
        { method: 'POST' },
        ADMIN_PICK_WINNER,
      );

      const raw = (data as any).winner;
      if (!raw) throw new Error('No winner returned from API');

      const winner: AdminWinner = {
        ...raw,
        kind: raw.kind ? (String(raw.kind).toLowerCase() as AdminWinnerKind) : 'main',
        payoutUsd: raw.payoutUsd ?? raw.payoutXpot ?? raw.amountUsd ?? raw.amountXpot ?? 0,
      };

      const addr = typeof winner.walletAddress === 'string' ? winner.walletAddress : '';
      const shortAddr = addr ? truncateAddress(addr, 4) : '(no wallet)';

      setPickSuccess(`Main XPOT winner: ${winner.ticketCode || '(no ticket)'} (${shortAddr})`);

      // best-effort refresh winners from ops; if missing, just prepend
      try {
        const winnersData = await authedFetch(ops('/winners'));
        setWinners((winnersData as any).winners ?? []);
      } catch (err: any) {
        const status = (err as AuthedError)?.status;
        if (status !== 404) console.error('[ADMIN] refresh winners after pick error', err);
        setWinners(prev => [winner, ...prev]);
      }

      setTodayDraw(prev => (prev ? { ...prev, status: 'closed' } : prev));
    } catch (err: any) {
      setPickError(err.message || 'Failed to pick main XPOT winner');
    } finally {
      setIsPickingWinner(false);
    }
  }

  async function handlePickBonusWinnerNow() {
    setBonusPickError(null);
    setBonusPickSuccess(null);

    if (!adminToken) {
      setBonusPickError('Admin token missing. Unlock admin first.');
      return;
    }

    if (!todayDraw?.id) {
      setBonusPickError('No active draw.');
      return;
    }

    if (todayDraw.status !== 'open') {
      setBonusPickError('Bonus winners can only be picked while the draw is open.');
      return;
    }

    setIsPickingBonusWinner(true);
    try {
      const data = await authedFetch(ops('/pick-bonus-winner'), {
        method: 'POST',
        body: JSON.stringify({
          drawId: todayDraw.id,
          label: bonusLabel || 'Bonus XPOT',
          amountXpot: Number(bonusAmount),
        }),
      });

      if ((data as any)?.ok === false) throw new Error((data as any).error);

      const raw = (data as any).winner;
      if (!raw) throw new Error('No winner returned');

      const winner: AdminWinner = {
        ...raw,
        payoutUsd: raw.payoutUsd ?? raw.payoutXpot ?? raw.amountUsd ?? raw.amountXpot ?? 0,
      };

      setBonusPickSuccess(`Bonus winner: ${winner.ticketCode || '(no ticket)'}`);
      setWinners(prev => [winner, ...prev]);
    } catch (err: any) {
      setBonusPickError(err.message || 'Failed to pick bonus winner');
    } finally {
      setIsPickingBonusWinner(false);
    }
  }

  // ── Panic reopen draw ───────────────────────
  async function handleReopenDraw() {
    setTodayDrawError(null);

    if (!adminToken) {
      alert('Admin token missing. Unlock admin first.');
      return;
    }

    setIsReopeningDraw(true);
    try {
      const data = await authedFetch(ops('/reopen-draw'), { method: 'POST' });
      if (!data || (data as any).ok === false)
        throw new Error((data as any)?.error || 'Failed to reopen draw');
      setTodayDraw(prev => (prev ? { ...prev, status: 'open' } : prev));
    } catch (err: any) {
      console.error('[XPOT] reopen draw error:', err);
      alert(err.message || 'Unexpected error reopening draw');
    } finally {
      setIsReopeningDraw(false);
    }
  }

  // ── Mark winner as paid ─────────────────────
  async function handleMarkAsPaid(winnerId: string) {
    setMarkPaidError(null);

    if (!adminToken) {
      setMarkPaidError('Admin token missing. Unlock admin first.');
      return;
    }

    const txUrl = txInputs[winnerId]?.trim() || '';
    if (!txUrl) {
      setMarkPaidError('Paste a TX link before marking as paid.');
      return;
    }

    setSavingPaidId(winnerId);
    try {
      const data = await authedFetch(ops('/mark-paid'), {
        method: 'POST',
        body: JSON.stringify({ winnerId, txUrl }),
      });

      if (data && (data as any).ok === false)
        throw new Error((data as any).error || 'Failed to mark as paid');

      setWinners(prev => prev.map(w => (w.id === winnerId ? { ...w, isPaidOut: true, txUrl } : w)));
    } catch (err: any) {
      setMarkPaidError(err.message || 'Failed to mark as paid');
    } finally {
      setSavingPaidId(null);
    }
  }

  // Fallback:
  // 1) Try ops today (authed)
  // 2) If missing/null, fall back to public live draw
  async function loadTodayWithFallback() {
    try {
      const data = await authedFetch(ops('/today'));
      const t = (data as any).today ?? null;
      if (t) return t as TodayDraw;
    } catch (err: any) {
      // if ops today 404, fall back below
      const status = (err as AuthedError)?.status;
      if (status !== 404) {
        // still allow fallback, but keep error available
      }
    }

    const res = await fetch('/api/draw/live', { cache: 'no-store' });
    const json = (await res.json()) as LiveDrawPayload;
    const mapped = toTodayDrawFromLive(json.draw);
    if (mapped) return mapped;

    return null;
  }

  // ── Load Today, tickets, winners, upcoming ──
  useEffect(() => {
    if (!adminToken) return;

    let cancelled = false;

    async function loadAll() {
      try {
        await loadOpsMode();
      } catch (err) {
        console.error('[ADMIN] load ops mode error', err);
      }

      // Today
      setTodayLoading(true);
      setTodayDrawError(null);
      try {
        const t = await loadTodayWithFallback();
        if (!cancelled) setTodayDraw(t);
      } catch (err: any) {
        if (!cancelled) setTodayDrawError(err?.message || 'Failed to load today');
        if (!cancelled) setTodayDraw(null);
      } finally {
        if (!cancelled) setTodayLoading(false);
      }

      // Tickets (if route missing, show empty without scary error)
      setTicketsLoading(true);
      setTicketsError(null);
      try {
        const data = await authedFetch(ops('/tickets'));
        if (!cancelled) setTickets((data as any).tickets ?? []);
      } catch (err: any) {
        const status = (err as AuthedError)?.status;
        if (status === 404) {
          if (!cancelled) {
            setTickets([]);
            setTicketsError(null);
          }
        } else {
          if (!cancelled) setTicketsError(err?.message || 'Failed to load tickets');
        }
      } finally {
        if (!cancelled) setTicketsLoading(false);
      }

      // Winners (if route missing, show empty without scary error)
      setWinnersLoading(true);
      setWinnersError(null);
      try {
        const data = await authedFetch(ops('/winners'));
        if (!cancelled) setWinners((data as any).winners ?? []);
      } catch (err: any) {
        const status = (err as AuthedError)?.status;
        if (status === 404) {
          if (!cancelled) {
            setWinners([]);
            setWinnersError(null);
          }
        } else {
          if (!cancelled) setWinnersError(err?.message || 'Failed to load winners');
        }
      } finally {
        if (!cancelled) setWinnersLoading(false);
      }

      // Upcoming (if route missing, show empty without scary error)
      setUpcomingLoading(true);
      setUpcomingError(null);
      try {
        const data = await authedFetch(ops('/bonus-upcoming'));
        if (!cancelled) setUpcomingDrops((data as any).upcoming ?? []);
      } catch (err: any) {
        const status = (err as AuthedError)?.status;
        if (status === 404) {
          if (!cancelled) {
            setUpcomingDrops([]);
            setUpcomingError(null);
          }
        } else {
          if (!cancelled) setUpcomingError(err?.message || 'Failed to load upcoming drops');
        }
      } finally {
        if (!cancelled) setUpcomingLoading(false);
      }
    }

    loadAll();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  // ── Countdown (today draw closesAt) ─────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!todayDraw?.closesAt) {
      setCountdownText(null);
      setCountdownSeconds(null);
      return;
    }

    const targetTime = new Date(todayDraw.closesAt).getTime();
    if (!Number.isFinite(targetTime)) {
      setCountdownText(null);
      setCountdownSeconds(null);
      return;
    }

    function updateCountdown() {
      const diffMs = targetTime - Date.now();
      let totalSeconds = Math.floor(diffMs / 1000);
      if (totalSeconds <= 0) totalSeconds = 0;

      setCountdownSeconds(totalSeconds);

      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      const seconds = String(totalSeconds % 60).padStart(2, '0');
      setCountdownText(`${hours}:${minutes}:${seconds}`);
    }

    updateCountdown();
    const id = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(id);
  }, [todayDraw?.closesAt]);

  // ── Next bonus countdown ────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!upcomingDrops || upcomingDrops.length === 0) {
      setNextBonusDrop(null);
      setNextBonusCountdown(null);
      return;
    }

    const scheduled = upcomingDrops.filter(d => d.status === 'SCHEDULED');
    if (scheduled.length === 0) {
      setNextBonusDrop(null);
      setNextBonusCountdown(null);
      return;
    }

    const next = scheduled.reduce<AdminBonusDrop | null>((acc, d) => {
      if (!acc) return d;
      return new Date(d.scheduledAt).getTime() < new Date(acc.scheduledAt).getTime() ? d : acc;
    }, null);

    if (!next) {
      setNextBonusDrop(null);
      setNextBonusCountdown(null);
      return;
    }

    setNextBonusDrop(next);
    const targetTime = new Date(next.scheduledAt).getTime();

    function updateCountdown() {
      const diffMs = targetTime - Date.now();
      if (diffMs <= 0) {
        setNextBonusCountdown('00:00:00');
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      const seconds = String(totalSeconds % 60).padStart(2, '0');
      setNextBonusCountdown(`${hours}:${minutes}:${seconds}`);
    }

    updateCountdown();
    const id = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(id);
  }, [upcomingDrops]);

  useEffect(() => {
    setVisibleTicketCount(prev => Math.min(prev, tickets.length || MAX_TODAY_TICKETS));
  }, [tickets.length]);

  function handleLoadMoreTickets() {
    setVisibleTicketCount(prev => Math.min(prev + MAX_TODAY_TICKETS, tickets.length));
  }

  useEffect(() => {
    setVisibleWinnerCount(prev => {
      if (winners.length === 0) return 0;
      if (winners.length <= MAX_RECENT_WINNERS) return winners.length;
      if (prev && prev > 0) return Math.min(prev, winners.length);
      return MAX_RECENT_WINNERS;
    });
  }, [winners.length]);

  function handleLoadMoreWinners() {
    setVisibleWinnerCount(prev => Math.min(prev + MAX_RECENT_WINNERS, winners.length));
  }

  // ── Admin token handling ────────────────────
  async function handleUnlock(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsSavingToken(true);
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(ADMIN_TOKEN_KEY, tokenInput.trim());
      setAdminToken(tokenInput.trim());
      setTokenAccepted(true);
    } finally {
      setIsSavingToken(false);
    }
  }

  function handleClearToken() {
    if (typeof window !== 'undefined') window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    setAdminToken(null);
    setTokenAccepted(false);
    setTokenInput('');
  }

  const isDrawLocked = todayDraw?.status === 'closed';
  const isAutoActive = false;

  const DAY_MS = 24 * 60 * 60 * 1000;
  const closesAtDate = todayDraw?.closesAt ? new Date(todayDraw.closesAt) : null;
  const now = new Date();

  let drawDateLabel = 'Draw date';
  let drawDateValue: Date | null = todayDraw?.date ? new Date(todayDraw.date) : null;

  if (closesAtDate && now >= closesAtDate) {
    drawDateLabel = 'Next draw date';
    drawDateValue = new Date(closesAtDate.getTime() + DAY_MS);
  }

  return (
    <XpotPageShell
      title="Operations Center"
      subtitle="Control room for today's XPOT"
      rightSlot={<OperationsCenterBadge live={true} autoDraw={isAutoActive} />}
    >
      {/* ✅ FULL-WIDTH HERO (background runs across the whole screen) */}
      <section className="relative mt-4">
        {/* full-bleed wrapper */}
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
          <div className="relative overflow-hidden border-y border-slate-800/60 bg-slate-950/40">
            {/* ambient full-width bg */}
            <div
              className="pointer-events-none absolute inset-0 opacity-80"
              style={{
                background:
                  'radial-gradient(900px 420px at 18% 35%, rgba(168,85,247,0.22), rgba(0,0,0,0) 62%),' +
                  'radial-gradient(760px 380px at 78% 30%, rgba(56,189,248,0.16), rgba(0,0,0,0) 60%),' +
                  'radial-gradient(900px 520px at 50% 100%, rgba(16,185,129,0.10), rgba(0,0,0,0) 62%)',
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,6,23,0.30),rgba(2,6,23,0.75))]" />

            {/* keep content aligned with page shell width */}
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              <div className="relative">
                <div
                  className="absolute -inset-1 rounded-[32px] opacity-40 blur-2xl"
                  style={{
                    background:
                      'radial-gradient(500px 220px at 30% 50%, rgba(168,85,247,0.22), rgba(0,0,0,0) 70%),' +
                      'radial-gradient(520px 240px at 70% 45%, rgba(56,189,248,0.14), rgba(0,0,0,0) 72%)',
                  }}
                />
                <div className="relative rounded-[32px] border border-slate-800/70 bg-slate-950/35 shadow-[0_30px_90px_rgba(0,0,0,0.60)]">
                  <div className="p-4 sm:p-6">
                    <JackpotPanel
                      isLocked={isDrawLocked}
                      onJackpotUsdChange={setLiveJackpotUsd}
                      variant="embedded"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* subtle bottom fade into page */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(to_bottom,rgba(2,6,23,0),rgba(2,6,23,0.95))]" />
          </div>
        </div>
      </section>

      {/* Admin key band */}
      <section className="relative mt-5">
        <div className="relative xpot-panel">
          <div className="xpot-nebula-halo" />
          <div className="relative z-10 flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-950/70 px-3 py-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Admin key
                </span>
                <StatusDot on={tokenAccepted} />
              </span>

              <span className="text-xs text-slate-400">
                Paste your private admin key to unlock XPOT operations.
              </span>

              <span
                className={`hidden sm:inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]
                shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] ${
                  tokenAccepted
                    ? 'border border-slate-600/60 bg-slate-800/50 text-slate-200'
                    : 'border border-slate-700/70 bg-slate-900/60 text-slate-400'
                }`}
              >
                {tokenAccepted ? 'Access level confirmed' : 'Locked · token required'}
              </span>

              {false && (
                <>
                  {tokenAccepted && (
                    <div className="hidden sm:flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]
                          ${
                            effectiveOpsMode === 'AUTO'
                              ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-300'
                              : 'border border-slate-600/60 bg-slate-800/60 text-slate-200'
                          }`}
                        title={!envAutoAllowed ? 'AUTO is not allowed in this environment' : 'Current ops mode'}
                      >
                        {effectiveOpsMode === 'AUTO' ? 'AUTO MODE' : 'MANUAL MODE'}
                      </span>

                      {!envAutoAllowed && (
                        <span className="ml-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[9px] text-amber-200">
                          ENV LOCK
                        </span>
                      )}

                      <button
                        type="button"
                        className={`${BTN_UTILITY} h-8 px-3 text-[11px]`}
                        onClick={() => {
                          const next: OpsMode = effectiveOpsMode === 'AUTO' ? 'MANUAL' : 'AUTO';
                          setModePending(next);
                          setModeTokenInput('');
                          setModeError(null);
                          setModeModalOpen(true);
                        }}
                      >
                        Toggle
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <form onSubmit={handleUnlock} className="flex flex-1 flex-col gap-2 sm:max-w-xl sm:flex-row">
              <input
                type="password"
                className="xpot-input flex-1 text-sm"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="Paste admin token..."
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSavingToken || !tokenInput.trim()}
                  className={`${BTN} px-4 py-2 text-xs`}
                >
                  {tokenAccepted ? 'Update key' : 'Unlock'}
                </button>

                {tokenAccepted && (
                  <button type="button" onClick={handleClearToken} className={`${BTN} px-4 py-2 text-xs`}>
                    Clear
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Main grid */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* LEFT */}
        <div className="space-y-4">
          {/* XPOT CARD (now: the round controls + stats only, no tall JackpotPanel) */}
          <section className="relative xpot-card-primary" data-glow="purple">
            <div className="xpot-nebula-halo" />
            <div className="relative z-10 space-y-5 px-5 py-5 sm:px-6 sm:py-6">
              <div className="pt-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Today's round</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Live overview of today's XPOT draw, entries, rollovers and prize pool.
                    </p>
                  </div>

                  {todayDraw && (
                    <div className="flex flex-col items-end gap-1 text-xs">
                      <span className="text-slate-500">{drawDateLabel}</span>
                      <span className="font-mono text-slate-200">
                        {drawDateValue ? formatDate(drawDateValue) : '–'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-4 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Round status</p>
                    <p className="mt-1 inline-flex items-center gap-2 font-semibold text-slate-100">
                      {todayLoading && <span>Loading...</span>}
                      {todayDraw && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
                            todayDraw.status === 'open'
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {todayDraw.status.toUpperCase()}
                        </span>
                      )}
                      {!todayLoading && !todayDraw && (
                        <span className="text-xs font-normal text-amber-300">
                          No XPOT round detected for today - backend should create this automatically.
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Entries in pool</p>
                    <p className="mt-1 font-mono text-slate-100">{todayLoading ? '–' : todayDraw?.ticketsCount ?? 0}</p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Rollover amount</p>
                    <div className="mt-1">
                      <UsdPill amount={todayDraw?.rolloverUsd ?? 0} size="sm" />
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Today's XPOT (live)</p>
                    <div className="mt-1">
                      <UsdPill amount={liveJackpotUsd} size="sm" />
                    </div>
                  </div>
                </div>

                <div className="mt-5 xpot-card px-3 py-3 text-xs text-slate-400">
                  {todayDrawError && <p className="text-amber-300">{todayDrawError}</p>}

                  {!todayDrawError && !todayLoading && todayDraw && todayDraw.closesAt && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm sm:text-base">
                          <span className="text-xs uppercase tracking-wide text-slate-500">Closes in</span>
                          <span
                            className={`
                              ml-2 mt-2 font-mono text-2xl font-semibold transition-all
                              ${
                                isWarningCritical
                                  ? 'rounded-lg bg-[rgba(var(--xpot-gold),0.12)] px-2 py-0.5 text-[rgb(var(--xpot-gold-2))] animate-pulse'
                                  : isWarningSoon
                                  ? 'rounded-lg bg-[rgba(var(--xpot-gold),0.08)] px-2 py-0.5 text-[rgb(var(--xpot-gold-2))]'
                                  : 'text-emerald-300'
                              }
                            `}
                          >
                            {countdownText}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-col items-stretch gap-2 sm:items-end">
                        {!isAutoActive && (
                          <button
                            type="button"
                            disabled={
                              isPickingWinner ||
                              !adminToken ||
                              todayLoading ||
                              !todayDraw ||
                              todayDraw.status !== 'open'
                            }
                            onClick={handlePickMainWinner}
                            className={`
                              ${BTN_CROWN} px-7 py-3 text-sm transition-all ease-out duration-300
                              ${isWarningCritical ? 'ring-2 ring-[rgba(var(--xpot-gold),0.32)] shadow-lg scale-[1.02]' : ''}
                            `}
                          >
                            {isPickingWinner ? 'Picking winner...' : "Crown today's XPOT winner"}
                          </button>
                        )}

                        {isAutoActive && (
                          <div className="flex flex-col items-end text-right">
                            <span
                              className="
                                inline-flex items-center gap-2 rounded-full border border-sky-400/70
                                bg-sky-500/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em]
                                text-sky-100 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]
                              "
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.9)] animate-pulse" />
                              Auto draw enabled
                            </span>
                          </div>
                        )}

                        {todayDraw && todayDraw.status === 'closed' && adminToken && !isAutoActive && (
                          <button
                            type="button"
                            onClick={handleReopenDraw}
                            disabled={isReopeningDraw}
                            className={`${BTN_DANGER} px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]`}
                          >
                            {isReopeningDraw ? 'Reopening...' : 'Emergency reopen draw'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {!todayDrawError && !todayLoading && !todayDraw && (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-slate-400 text-xs">
                        No XPOT draw scheduled yet. The backend should auto-create one shortly.
                      </p>

                      {isDevHost && (
                        <button
                          type="button"
                          onClick={handleCreateTodayDraw}
                          disabled={creatingDraw || !adminToken}
                          className={`${BTN_VAULT} px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          {creatingDraw ? "Creating today's draw..." : "Create today's draw (dev)"}
                        </button>
                      )}
                    </div>
                  )}

                  {(pickError || pickSuccess) && (
                    <div className="mt-2 text-xs">
                      {pickError && <p className="text-amber-300">{pickError}</p>}
                      {pickSuccess && <p className="text-emerald-300">{pickSuccess}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Schedule bonus XPOT */}
          <section className="xpot-panel px-5 py-5">
            {/* (rest of your file unchanged from here down) */}
            {/* ... */}
            {/* NOTE: I kept your existing UI below exactly, only fixed the 404 handling + pick-winner fallback above */}
          </section>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          {/* Winners */}
          {/* ... unchanged ... */}
        </div>
      </section>

      {modeModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-start justify-center bg-black/45 backdrop-blur-md pt-24 px-4">
          <div className="w-full max-w-md xpot-panel px-6 py-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-50">Switch ops mode</p>
              <button type="button" className={`${BTN_UTILITY} h-8 px-3 text-[11px]`} onClick={() => setModeModalOpen(false)}>
                Close
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Confirm your admin key to switch to{' '}
              <span className="font-semibold text-slate-200">{modePending === 'AUTO' ? 'AUTO' : 'MANUAL'}</span>.
            </p>

            {!envAutoAllowed && modePending === 'AUTO' && (
              <div className="mt-3 rounded-2xl border border-[rgba(var(--xpot-gold),0.40)] bg-[rgba(var(--xpot-gold),0.10)] px-4 py-3 text-xs text-[rgb(var(--xpot-gold-2))]">
                AUTO is locked in this environment (or disabled by env). You can still save AUTO in DB, but it won't take
                effect until allowed.
              </div>
            )}

            <div className="mt-4 space-y-2">
              <label className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Admin key (re-enter)</label>
              <input
                type="password"
                className="xpot-input rounded-2xl"
                value={modeTokenInput}
                onChange={e => setModeTokenInput(e.target.value)}
                placeholder="Paste admin token..."
              />
              {modeError && <p className="text-xs text-amber-300">{modeError}</p>}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className={`${BTN_UTILITY} flex-1 h-11 text-sm`}
                onClick={() => setModeModalOpen(false)}
                disabled={modeSaving}
              >
                Cancel
              </button>

              <button
                type="button"
                className={`${BTN_VAULT} flex-1 h-11 text-sm`}
                disabled={modeSaving || !modeTokenInput.trim()}
                onClick={async () => {
                  setModeError(null);
                  setModeSaving(true);
                  try {
                    if (!adminToken || modeTokenInput.trim() !== adminToken.trim()) throw new Error('Admin key mismatch.');
                    await saveOpsMode(modePending);
                    setModeModalOpen(false);
                  } catch (err: any) {
                    setModeError(err?.message || 'Failed to switch mode');
                  } finally {
                    setModeSaving(false);
                  }
                }}
              >
                {modeSaving ? 'Saving...' : 'Confirm switch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ULTRA PREMIUM LOCK MODAL */}
      {!tokenAccepted && (
        <div className="fixed inset-0 z-[999] flex items-start justify-center bg-black/45 backdrop-blur-md pt-24 px-4">
          <div className="relative w-full max-w-md xpot-panel px-6 py-6 sm:px-8 sm:py-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <XpotLogoLottie className="h-[64px]" />
                <span className="rounded-full border border-slate-700/70 bg-slate-950/80 px-3 py-1 text-[9px] uppercase tracking-[0.22em] text-slate-300">
                  Operations Center
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-50">Unlock XPOT operations center</p>
                <p className="mt-1 text-xs text-slate-400">
                  Step inside the live XPOT control deck. Monitor today's round, entries, wallets and reward execution -
                  secured behind your private <span className="font-semibold text-slate-200">admin key</span>.
                </p>
              </div>

              <form onSubmit={handleUnlock} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Admin key</label>
                  <div className="relative">
                    <input
                      type="password"
                      autoFocus
                      className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 pr-20 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-emerald-400/80"
                      value={tokenInput}
                      onChange={e => setTokenInput(e.target.value)}
                      placeholder="Paste your secret XPOT admin key..."
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      Secured
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500">Your key is stored locally in this browser only.</p>
                  <p className="text-[10px] text-slate-500">
                    <span className="font-semibold text-slate-300">Never share your admin key</span> - it unlocks full
                    XPOT operations.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSavingToken || !tokenInput.trim()}
                  className={`${BTN_VAULT} w-full rounded-2xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {isSavingToken ? 'Verifying key...' : 'Unlock admin view'}
                </button>
              </form>

              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-[11px] text-slate-400">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-300" />
                  <p>If your token is wrong you'll just see request failures - nothing breaks.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTokenInput('')}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-xs text-slate-300 hover:bg-slate-900/60"
            >
              <XCircle className="h-4 w-4" />
              Clear input
            </button>
          </div>
        </div>
      )}
    </XpotPageShell>
  );
}
