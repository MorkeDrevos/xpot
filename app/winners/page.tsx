// app/winners/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import XpotPageShell from '@/components/XpotPageShell';
import GoldAmount from '@/components/GoldAmount';

import {
  BadgeCheck,
  CalendarClock,
  Crown,
  ExternalLink,
  Info,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  X as XIcon,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

type WinnerKind = 'MAIN' | 'BONUS';

type WinnerRow = {
  id: string;
  drawId?: string | null;
  kind?: WinnerKind | string | null;

  drawDate?: string | null;
  ticketCode?: string | null;

  amountXpot?: number | null;

  walletAddress?: string | null;

  handle?: string | null;
  name?: string | null;
  avatarUrl?: string | null;

  isPaidOut?: boolean | null;

  txUrl?: string | null;
  txSig?: string | null;

  label?: string | null;
};

function shortWallet(addr: string) {
  if (!addr || addr.length < 10) return addr || '—';
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function safeTimeMs(iso?: string | null) {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : 0;
}

function formatDate(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB');
}

function normalizeHandle(h: string | null | undefined) {
  const s = String(h ?? '').trim();
  if (!s) return null;
  const clean = s.replace(/^@+/, '');
  if (!clean) return null;
  return `@${clean}`;
}

function toXProfileUrl(handle: string | null | undefined) {
  const h = normalizeHandle(handle);
  if (!h) return null;
  const raw = h.replace(/^@/, '');
  return `https://x.com/${encodeURIComponent(raw)}`;
}

function isValidHttpUrl(u: string | null | undefined) {
  if (!u) return false;
  return /^https?:\/\/.+/i.test(u);
}

function fmtInt(n: number) {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/* ─────────────────────────────────────────────
   Madrid cutoff + ICS download (client-safe)
───────────────────────────────────────────── */

const MADRID_TZ = 'Europe/Madrid';
const MADRID_CUTOFF_HH = 22;
const MADRID_CUTOFF_MM = 0;

function getTzParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const pick = (type: string) => parts.find(p => p.type === type)?.value ?? '00';

  return {
    y: Number(pick('year')),
    m: Number(pick('month')),
    d: Number(pick('day')),
    hh: Number(pick('hour')),
    mm: Number(pick('minute')),
    ss: Number(pick('second')),
  };
}

function wallClockToUtcMs({
  y,
  m,
  d,
  hh,
  mm,
  ss,
  timeZone,
}: {
  y: number;
  m: number;
  d: number;
  hh: number;
  mm: number;
  ss: number;
  timeZone: string;
}) {
  let t = Date.UTC(y, m - 1, d, hh, mm, ss);

  for (let i = 0; i < 3; i++) {
    const got = getTzParts(new Date(t), timeZone);

    const wantTotal = (((y * 12 + m) * 31 + d) * 24 + hh) * 60 + mm;
    const gotTotal = (((got.y * 12 + got.m) * 31 + got.d) * 24 + got.hh) * 60 + got.mm;

    const diffMin = gotTotal - wantTotal;
    if (diffMin === 0) break;

    t -= diffMin * 60_000;
  }

  return t;
}

function nextMadridCutoffUtcMs(now = new Date()) {
  const madridNow = getTzParts(now, MADRID_TZ);
  const nowMin = madridNow.hh * 60 + madridNow.mm;
  const cutoffMin = MADRID_CUTOFF_HH * 60 + MADRID_CUTOFF_MM;

  const baseDate = nowMin < cutoffMin ? now : new Date(now.getTime() + 24 * 60 * 60_000);
  const madridTargetDay = getTzParts(baseDate, MADRID_TZ);

  return wallClockToUtcMs({
    y: madridTargetDay.y,
    m: madridTargetDay.m,
    d: madridTargetDay.d,
    hh: MADRID_CUTOFF_HH,
    mm: MADRID_CUTOFF_MM,
    ss: 0,
    timeZone: MADRID_TZ,
  });
}

function makeIcsForCutoff(nextCutoffUtcMs: number) {
  const start = new Date(nextCutoffUtcMs);
  const end = new Date(nextCutoffUtcMs + 15 * 60_000);

  const toIcs = (d: Date) => {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const da = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    const ss = String(d.getUTCSeconds()).padStart(2, '0');
    return `${y}${m}${da}T${hh}${mm}${ss}Z`;
  };

  const uid = `xpot-cutoff-${toIcs(start)}@xpot`;
  const now = toIcs(new Date());

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//XPOT//Winners//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcs(start)}`,
    `DTEND:${toIcs(end)}`,
    'SUMMARY:XPOT draw cutoff (22:00 Madrid)',
    'DESCRIPTION:Last call to enter before today’s cutoff.',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function downloadTextFile(filename: string, content: string, mime = 'text/plain') {
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    // ignore
  }
}

/* ─────────────────────────────────────────────
   UI atoms
───────────────────────────────────────────── */

function Badge({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: 'slate' | 'emerald' | 'gold' | 'sky' | 'danger';
}) {
  const cls =
    tone === 'emerald'
      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
      : tone === 'gold'
      ? 'xpot-pill-gold border bg-[rgba(var(--xpot-gold),0.10)] text-[rgb(var(--xpot-gold-2))]'
      : tone === 'sky'
      ? 'border-sky-400/40 bg-sky-500/10 text-sky-100'
      : tone === 'danger'
      ? 'border-amber-300/35 bg-amber-500/10 text-amber-200'
      : 'border-slate-700/70 bg-slate-900/70 text-slate-300';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${cls}`}
    >
      {children}
    </span>
  );
}

function WinnerIdentity({
  avatarUrl,
  name,
  handle,
  walletAddress,
}: {
  avatarUrl?: string | null;
  name?: string | null;
  handle?: string | null;
  walletAddress?: string | null;
}) {
  const h = normalizeHandle(handle);
  const xUrl = toXProfileUrl(h);

  const title = name && name.trim() ? name.trim() : h ?? shortWallet(walletAddress || '—');
  const subtitle = h ?? shortWallet(walletAddress || '—');

  const content = (
    <div className="flex items-center gap-3">
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/10 bg-slate-900/60 ring-1 ring-white/[0.06]">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={subtitle} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] text-slate-400">
            <XIcon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-100">{title}</div>
        <div className="truncate font-mono text-xs text-slate-400">{subtitle}</div>
      </div>
    </div>
  );

  if (!xUrl) return content;

  return (
    <a
      href={xUrl}
      target="_blank"
      rel="noreferrer"
      className="group block rounded-xl outline-none transition hover:bg-white/[0.03] focus-visible:ring-2 focus-visible:ring-[rgba(var(--xpot-gold),0.35)]"
      title="Open X profile"
    >
      <div className="-m-2 p-2">{content}</div>
    </a>
  );
}

function makeDedupeKey(w: WinnerRow) {
  const drawId = (w.drawId || '').trim();
  if (drawId) {
    const k = String(w.kind || '').toUpperCase();
    return `draw:${drawId}|${k || 'WIN'}`;
  }

  const sig = (w.txSig || '').trim();
  if (sig) return `sig:${sig}`;

  const tx = (w.txUrl || '').trim();
  if (tx) return `tx:${tx}`;

  const id = (w.id || '').trim();
  if (id) return `id:${id}`;

  const d = (w.drawDate || '').trim();
  const k = String(w.kind || '').toUpperCase();
  const h = (normalizeHandle(w.handle) || '').trim();
  const wa = (w.walletAddress || '').trim();
  const a = typeof w.amountXpot === 'number' ? String(Math.round(w.amountXpot)) : '';
  return `fp:${d}|${k}|${h}|${wa}|${a}`;
}

export default function WinnersPage() {
  const [rows, setRows] = useState<WinnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'ALL' | 'MAIN' | 'BONUS'>('ALL');
  const [showTxOnly, setShowTxOnly] = useState(false);

  const liveIsOpen = false;

  useEffect(() => {
    let alive = true;

    async function loadAll() {
      try {
        setError(null);
        setLoading(true);

        const all: any[] = [];
        let cursor: string | null = null;

        for (let page = 0; page < 20; page++) {
          const params = new URLSearchParams();
          params.set('limit', '5000');
          if (cursor) params.set('cursor', cursor);

          const res = await fetch(`/api/winners/recent?${params.toString()}`, { cache: 'no-store' });
          if (!res.ok) throw new Error('Failed to load winners');

          const data = await res.json();

          const batch = Array.isArray(data?.winners) ? data
