// app/2045/final-day/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Printer, Repeat2, Timer, Radio, ShieldCheck } from 'lucide-react';

import { RUN_DAYS, RUN_END, RUN_START, getFinalDrawEUShort } from '@/lib/xpotRun';

type Era = '2045' | 'now';

// ✅ bump key to reset any cached era from older run/version
const STORAGE_KEY = 'xpot_final_day_era_v8';
const LIVE_POLL_MS = 5000;

const RUN_TOTAL_DAYS = RUN_DAYS;
const DRAW_HOUR_MADRID = 22; // 22:00 Madrid time
const DRAW_MINUTE_MADRID = 0;
const MADRID_TZ = 'Europe/Madrid';

type LiveDraw = {
  dailyXpot: number;
  dayNumber: number; // API value (may be 1-based)
  dayTotal: number;
  drawDate: string; // ISO
  closesAt: string; // ISO (may be missing tz in edge cases)
  status: 'OPEN' | 'LOCKED' | 'COMPLETED';
};

function pad2(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { d, h, m, s };
}

function hasTimezone(iso: string) {
  // Ends with Z/z or a numeric offset like +01:00 / -05:00
  return /([zZ]|[+\-]\d{2}:\d{2})$/.test(iso.trim());
}

// ─────────────────────────────────────────────
// Madrid time helpers (no external libs)
// IMPORTANT: hourCycle:'h23' prevents "24:xx" edge cases that can break cutoff math.
// ─────────────────────────────────────────────
function getZonedParts(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }

  // Guard: some environments can still surface hour "24" at midnight.
  // Clamp to 0 (good enough for our daily cutoff + iterative offset math).
  const hourRaw = Number(map.hour);
  const hour = hourRaw === 24 ? 0 : hourRaw;

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function tzOffsetMinutes(timeZone: string, date: Date) {
  const p = getZonedParts(date, timeZone);
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return (asUTC - date.getTime()) / 60000;
}

// Convert a wall-clock time in a timezone to UTC ms (iterative offset resolve)
function zonedTimeToUtcMs(timeZone: string, y: number, m: number, d: number, hh: number, mm: number, ss: number) {
  let guess = Date.UTC(y, m - 1, d, hh, mm, ss);
  // 2-pass refinement handles DST edges well enough for our use
  for (let i = 0; i < 2; i++) {
    const off = tzOffsetMinutes(timeZone, new Date(guess));
    guess = Date.UTC(y, m - 1, d, hh, mm, ss) - off * 60_000;
  }
  return guess;
}

function daysBetweenYmd(
  a: { year: number; month: number; day: number },
  b: { year: number; month: number; day: number },
) {
  const aMs = Date.UTC(a.year, a.month - 1, a.day);
  const bMs = Date.UTC(b.year, b.month - 1, b.day);
  return Math.floor((bMs - aMs) / 86_400_000);
}

function formatArchiveDateLine(utcMs: number) {
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: MADRID_TZ,
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  return dtf.format(new Date(utcMs));
}

function formatMadridCutoffLabel() {
  return `Madrid ${pad2(DRAW_HOUR_MADRID)}:${pad2(DRAW_MINUTE_MADRID)}`;
}

function formatMadridTimeShort(utcMs: number) {
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: MADRID_TZ,
    hour12: false,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `Madrid ${dtf.format(new Date(utcMs))}`;
}

// ─────────────────────────────────────────────
// Robust ISO parsing
// - If tz is present: Date.parse
// - If tz is missing: treat as Madrid local time (NOT UTC)
// ─────────────────────────────────────────────
function parseIsoPartsNoTz(s: string) {
  // Accept: YYYY-MM-DDTHH:mm[:ss][.sss]
  const m = s
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d{1,3})?)?$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hh = Number(m[4] ?? '0');
  const mm = Number(m[5] ?? '0');
  const ss = Number(m[6] ?? '0');
  if (![year, month, day, hh, mm, ss].every(Number.isFinite)) return null;
  return { year, month, day, hh, mm, ss };
}

function safeParseUtcMsFromIso(iso: string | null | undefined) {
  if (!iso) return null;
  const s = String(iso).trim();
  if (!s) return null;

  if (hasTimezone(s)) {
    const ms = Date.parse(s);
    return Number.isFinite(ms) ? ms : null;
  }

  // ✅ IMPORTANT: no tz => assume Madrid wall time
  const p = parseIsoPartsNoTz(s);
  if (!p) return null;
  return zonedTimeToUtcMs(MADRID_TZ, p.year, p.month, p.day, p.hh, p.mm, p.ss);
}

// Next cutoff at 22:00 Madrid (today if before cutoff, else tomorrow)
function nextCutoffUtcMs(nowMs: number) {
  const now = new Date(nowMs);
  const p = getZonedParts(now, MADRID_TZ);

  const todayCutoff = zonedTimeToUtcMs(MADRID_TZ, p.year, p.month, p.day, DRAW_HOUR_MADRID, DRAW_MINUTE_MADRID, 0);
  if (nowMs < todayCutoff) return todayCutoff;

  // tomorrow via Date rollover in UTC, then read Madrid YMD
  const tomorrow = new Date(Date.UTC(p.year, p.month - 1, p.day) + 86_400_000);
  const t = getZonedParts(tomorrow, MADRID_TZ);
  return zonedTimeToUtcMs(MADRID_TZ, t.year, t.month, t.day, DRAW_HOUR_MADRID, DRAW_MINUTE_MADRID, 0);
}

export default function FinalDayPage() {
  // ✅ Read era on first render (prevents iOS/Safari "flash" + mirrored mid-flip)
  const [era, setEra] = useState<Era>(() => {
    try {
      if (typeof window === 'undefined') return '2045';
      const v = window.localStorage.getItem(STORAGE_KEY);
      return v === 'now' || v === '2045' ? (v as Era) : '2045';
    } catch {
      return '2045';
    }
  });

  // Live draw state for "Now"
  const [live, setLive] = useState<LiveDraw | null>(null);
  const [liveErr, setLiveErr] = useState<string | null>(null);

  // ✅ Keep local ticking stable
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  const abortRef = useRef<AbortController | null>(null);

  // ✅ Enable 3D flip only on desktop-ish screens (fixes mirrored NOW on mobile)
  const [use3DFlip, setUse3DFlip] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mqDesktop = window.matchMedia('(min-width: 860px)');
    const mqCoarse = window.matchMedia('(pointer: coarse)');

    const compute = () => {
      // Disable 3D if touch/coarse pointer even if wide (iPad Safari can still glitch)
      const ok = mqDesktop.matches && !mqCoarse.matches;
      setUse3DFlip(ok);
    };

    compute();

    const onChange = () => compute();

    // Safari-compatible listeners
    if ('addEventListener' in mqDesktop) {
      mqDesktop.addEventListener('change', onChange);
      mqCoarse.addEventListener('change', onChange);
      return () => {
        mqDesktop.removeEventListener('change', onChange);
        mqCoarse.removeEventListener('change', onChange);
      };
    }

    // @ts-ignore - older Safari
    mqDesktop.addListener(onChange);
    // @ts-ignore - older Safari
    mqCoarse.addListener(onChange);
    return () => {
      // @ts-ignore - older Safari
      mqDesktop.removeListener(onChange);
      // @ts-ignore - older Safari
      mqCoarse.removeListener(onChange);
    };
  }, []);

  // ✅ Persist era
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, era);
    } catch {}
  }, [era]);

  // ✅ Single-source schedule: lib/xpotRun.ts (matches homepage)
  const drawSchedule = useMemo(() => {
    const now = new Date(nowTs);
    const nowMadrid = getZonedParts(now, MADRID_TZ);

    const runStartYmd = { year: RUN_START.y, month: RUN_START.m, day: RUN_START.d };

    const runStartUtcMs = zonedTimeToUtcMs(MADRID_TZ, RUN_START.y, RUN_START.m, RUN_START.d, RUN_START.hh, RUN_START.mm, 0);
    const runEndUtcMs = zonedTimeToUtcMs(MADRID_TZ, RUN_END.y, RUN_END.m, RUN_END.d, RUN_END.hh, RUN_END.mm, 0);

    const endDateDMY = getFinalDrawEUShort();

    let completed = 0;

    if (nowTs >= runStartUtcMs) {
      const nowYmd = { year: nowMadrid.year, month: nowMadrid.month, day: nowMadrid.day };
      const dayDiff = daysBetweenYmd(runStartYmd, nowYmd);

      // Important:
      // RUN_START marks the beginning of Day 1 (not a completed draw).
      // The first completed draw only happens at the NEXT 22:00 cutoff after RUN_START.
      const afterCutoff =
        nowMadrid.hour > DRAW_HOUR_MADRID ||
        (nowMadrid.hour === DRAW_HOUR_MADRID && nowMadrid.minute >= DRAW_MINUTE_MADRID);

      if (dayDiff <= 0) {
        completed = 0;
      } else {
        completed = Math.max(0, dayDiff - (afterCutoff ? 0 : 1));
      }
    }

    completed = Math.min(RUN_TOTAL_DAYS, completed);

    const currentDayNumber = Math.min(RUN_TOTAL_DAYS, Math.max(1, completed + 1));
    const daysRemaining = Math.max(0, RUN_TOTAL_DAYS - completed);

    return {
      runStartUtcMs,
      runEndUtcMs,
      currentDayNumber,
      completedDraws: completed,
      daysRemaining,
      endDateDMY,
      archiveDateLine: formatArchiveDateLine(runEndUtcMs), // "Wednesday, 26 February 2045"
      nowMadrid,
    };
  }, [nowTs]);

  const meta = useMemo(() => {
    if (era === '2045') {
      return {
        badge: 'ARCHIVE EDITION',
        dateLine: drawSchedule.archiveDateLine,
        section: 'Culture / Protocols',
        headline: "XPOT’s Final Day",
        deck:
          'It did not collapse. It did not vanish. It did not betray anyone. It simply reached the end of its promise - after 19.18 years of daily continuity.',
        byline: 'By The XPOT Desk',
        price: 'FREE EDITION',
      };
    }

    return {
      badge: 'PRESENT DAY',
      dateLine: 'Today',
      section: 'Live',
      headline: 'A Daily Ritual With an Ending',
      deck:
        'This is the live countdown. When it reaches zero, the day’s winner is chosen - and XPOT moves one step closer to the Final Draw.',
      byline: 'XPOT',
      price: '',
    };
  }, [era, drawSchedule.archiveDateLine]);

  const onFlip = useCallback(() => {
    setEra((e) => (e === '2045' ? 'now' : '2045'));
  }, []);

  const onPrint = useCallback(() => {
    // Always print the archive side
    setEra('2045');
    window.setTimeout(() => {
      if (typeof window !== 'undefined') window.print();
    }, 60);
  }, []);

  // Keyboard shortcuts: F = flip, P = print, Esc = back
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const k = e.key.toLowerCase();

      if (k === 'f') {
        e.preventDefault();
        onFlip();
        return;
      }

      if (k === 'p') {
        e.preventDefault();
        onPrint();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        try {
          window.location.assign('/');
        } catch {}
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [onFlip, onPrint]);

  // Poll live draw (for "Now" side)
  useEffect(() => {
    let interval: number | null = null;
    let alive = true;

    async function pull() {
      try {
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        setLiveErr(null);

        const res = await fetch('/api/draw/live', {
          cache: 'no-store',
          signal: ac.signal,
        });

        if (!res.ok) throw new Error(`HTTP_${res.status}`);
        const json = await res.json();

        if (!alive) return;

        if (!json?.draw?.closesAt) {
          // no closesAt - fallback to schedule
          setLive(null);
          return;
        }

        const d: LiveDraw = {
          dailyXpot: Number(json.draw.dailyXpot ?? 1_000_000),
          dayNumber: Number(json.draw.dayNumber ?? 0),
          dayTotal: Number(json.draw.dayTotal ?? RUN_TOTAL_DAYS),
          drawDate: String(json.draw.drawDate ?? ''),
          closesAt: String(json.draw.closesAt ?? ''),
          status: (json.draw.status as LiveDraw['status']) ?? 'OPEN',
        };

        // Validate closesAt parse; if bad -> fallback to schedule
        const closesMs = safeParseUtcMsFromIso(d.closesAt);
        if (!closesMs) {
          setLive(null);
          return;
        }

        if (!Number.isFinite(d.dailyXpot)) d.dailyXpot = 1_000_000;
        if (!Number.isFinite(d.dayNumber) || d.dayNumber < 0) d.dayNumber = 0;
        if (!Number.isFinite(d.dayTotal) || d.dayTotal <= 0) d.dayTotal = RUN_TOTAL_DAYS;

        setLive(d);
      } catch (e: any) {
        if (!alive) return;
        if (e?.name === 'AbortError') return;
        setLiveErr('Live draw unavailable');
        setLive(null);
      }
    }

    pull();
    interval = window.setInterval(pull, LIVE_POLL_MS);

    return () => {
      alive = false;
      abortRef.current?.abort();
      if (interval) window.clearInterval(interval);
    };
  }, []);

  // Local ticking clock for countdown (smooth)
  useEffect(() => {
    const t = window.setInterval(() => setNowTs(Date.now()), 250);
    return () => window.clearInterval(t);
  }, []);

  // ─────────────────────────────────────────────
  // Countdown source:
  // - Prefer live.closesAt (API), BUT treat past timestamps as invalid
  // - Fallback to next 22:00 Madrid (protocol schedule)
  // ─────────────────────────────────────────────
  const liveClosesAtMs = safeParseUtcMsFromIso(live?.closesAt);
  const fallbackClosesAtMs = useMemo(() => nextCutoffUtcMs(nowTs), [nowTs]);

  // ✅ If the API gives us a closesAt that is already in the past, it's stale -> ignore it.
  const isLiveStale = !liveClosesAtMs || liveClosesAtMs <= nowTs;

  const usingFallback = isLiveStale;
  const closesAtMs = usingFallback ? fallbackClosesAtMs : liveClosesAtMs;

  // ✅ guard against NaN so we never get stuck
  const remainingMs = Number.isFinite(closesAtMs) ? Math.max(0, closesAtMs - nowTs) : Math.max(0, fallbackClosesAtMs - nowTs);
  const cd = formatCountdown(remainingMs);

  // Status logic (stable)
  const computedStatus: LiveDraw['status'] | 'SYNCING' | 'OFFLINE' =
    liveErr
      ? 'OFFLINE'
      : remainingMs === 0
        ? 'SYNCING'
        : usingFallback
          ? 'OPEN'
          : live
            ? live.status
            : 'OPEN';

  const statusTone =
    computedStatus === 'OPEN'
      ? 'bg-emerald-500/12 text-emerald-100 ring-emerald-400/35'
      : computedStatus === 'COMPLETED'
        ? 'bg-white/6 text-white/90 ring-white/18'
        : computedStatus === 'LOCKED'
          ? 'bg-amber-500/12 text-amber-100 ring-amber-400/35'
          : 'bg-white/6 text-white/90 ring-white/18';

  // ✅ Homepage-match labels
  const dayLabel = `Day ${drawSchedule.currentDayNumber.toLocaleString()} of ${RUN_TOTAL_DAYS.toLocaleString()}`;
  const drawStatusLabel = `${drawSchedule.completedDraws.toLocaleString()}/${RUN_TOTAL_DAYS.toLocaleString()}`;

  // ✅ Progress bar should represent completed draws
  const dayProgress = Math.max(0, Math.min(1, drawSchedule.completedDraws / RUN_TOTAL_DAYS));

  const cutoffLabel = formatMadridCutoffLabel();
  const closesAtLabel = formatMadridTimeShort(closesAtMs);

  const bgRoot =
    'bg-[#05070a] ' +
    '[background-image:radial-gradient(1200px_800px_at_20%_10%,rgba(56,189,248,0.12),transparent_55%),' +
    'radial-gradient(900px_700px_at_80%_20%,rgba(236,72,153,0.10),transparent_60%),' +
    'radial-gradient(1000px_900px_at_40%_90%,rgba(16,185,129,0.08),transparent_60%)]';

  const bgNowCard =
    '[background-image:radial-gradient(900px_600px_at_20%_10%,rgba(56,189,248,0.14),transparent_60%),' +
    'radial-gradient(900px_700px_at_85%_25%,rgba(236,72,153,0.12),transparent_62%),' +
    'radial-gradient(1000px_900px_at_50%_90%,rgba(16,185,129,0.08),transparent_60%),' +
    'linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0))]';

  return (
    <main
      className={[
        'min-h-screen px-3 pb-16 pt-7 text-white/90 print:p-0 print:text-black',
        bgRoot,
        'print:bg-white print:[background-image:none]',
      ].join(' ')}
    >
      {/* Controls (hidden on print) */}
      <div className="mx-auto mb-4 flex max-w-[1120px] items-center justify-between gap-3 print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] font-extrabold text-white/90 hover:bg-white/[0.05]"
        >
          <ChevronLeft size={18} />
          <span>Back</span>
        </Link>

        <div
          className="inline-flex overflow-hidden rounded-full border border-white/10 bg-white/[0.03]"
          role="tablist"
          aria-label="Edition selector"
        >
          <button
            type="button"
            className={[
              'px-4 py-2 text-[12px] font-black uppercase tracking-[0.12em]',
              era === '2045' ? 'bg-white/[0.08] text-white/95' : 'text-white/70 hover:text-white/90',
            ].join(' ')}
            onClick={() => setEra('2045')}
            role="tab"
            aria-selected={era === '2045'}
            aria-controls="xpot-fd-archive"
          >
            2045
          </button>
          <button
            type="button"
            className={[
              'px-4 py-2 text-[12px] font-black uppercase tracking-[0.12em]',
              era === 'now' ? 'bg-white/[0.08] text-white/95' : 'text-white/70 hover:text-white/90',
            ].join(' ')}
            onClick={() => setEra('now')}
            role="tab"
            aria-selected={era === 'now'}
            aria-controls="xpot-fd-now"
          >
            Now
          </button>
        </div>

        <div className="inline-flex gap-2">
          <button
            type="button"
            onClick={onFlip}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] font-extrabold text-white/90 hover:bg-white/[0.05]"
          >
            <Repeat2 size={16} />
            <span className="max-[520px]:hidden">Flip</span>
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] font-extrabold text-white/90 hover:bg-white/[0.05]"
          >
            <Printer size={16} />
            <span className="max-[520px]:hidden">Print</span>
          </button>
        </div>
      </div>

      {/* Scene */}
<section
  className={[
    'mx-auto max-w-[1120px]',
    use3DFlip ? '[perspective:1400px]' : '',
    'print:[perspective:none]',
  ].join(' ')}
  aria-label="Final Day story"
>
  {use3DFlip ? (
    // ✅ Desktop: keep the 3D flip
    <div
      className={[
        'relative [transform-style:preserve-3d] motion-safe:transition-transform motion-safe:duration-[800ms]',
        'motion-safe:ease-[cubic-bezier(0.22,0.9,0.22,1)]',
        era === 'now' ? '[transform:rotateY(180deg)]' : '',
        'print:[transform:none]',
      ].join(' ')}
    >
      {/* FRONT: 2045 */}
      <article
        id="xpot-fd-archive"
        aria-hidden={era !== '2045'}
        className={[
          'overflow-hidden rounded-2xl border border-white/10 shadow-[0_60px_180px_rgba(0,0,0,0.55)]',
          '[backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:translateZ(0)]',
          'print:rounded-none print:border-0 print:shadow-none',
          'bg-[linear-gradient(180deg,rgba(250,244,228,0.96),rgba(244,236,214,0.96))]',
          'text-[rgba(18,16,12,0.95)]',
          'p-7 max-[720px]:p-4',
          'print:bg-white print:text-black print:p-[18mm_16mm_14mm]',
          '[background-image:radial-gradient(900px_600px_at_15%_10%,rgba(0,0,0,0.06),transparent_70%),' +
            'radial-gradient(900px_700px_at_90%_20%,rgba(0,0,0,0.05),transparent_65%),' +
            'linear-gradient(180deg,rgba(250,244,228,0.96),rgba(244,236,214,0.96))]',
          'print:[background-image:none]',
          'font-[ui-serif,Georgia,Times_New_Roman,Times,serif]',
        ].join(' ')}
      >
        {/* ⬇️ keep your existing 2045 content EXACTLY as-is */}
        {/* ... 2045 CONTENT ... */}
      </article>

      {/* BACK: NOW */}
      <article
        id="xpot-fd-now"
        aria-hidden={era !== 'now'}
        className={[
          'absolute inset-0 overflow-hidden rounded-2xl border border-white/10 shadow-[0_60px_180px_rgba(0,0,0,0.55)]',
          '[transform:rotateY(180deg) translateZ(0)] [backface-visibility:hidden] [-webkit-backface-visibility:hidden]',
          'print:hidden',
          'p-7 max-[720px]:p-4 font-sans',
          'text-white/90',
          bgNowCard,
        ].join(' ')}
      >
        {/* ⬇️ keep your existing NOW content EXACTLY as-is */}
        {/* ... NOW CONTENT ... */}
      </article>
    </div>
  ) : (
    // ✅ Mobile: no 3D transforms, just show one panel (fixes mirrored NOW)
    <>
      {era === '2045' ? (
        <article
          id="xpot-fd-archive"
          className={[
            'overflow-hidden rounded-2xl border border-white/10 shadow-[0_60px_180px_rgba(0,0,0,0.55)]',
            'bg-[linear-gradient(180deg,rgba(250,244,228,0.96),rgba(244,236,214,0.96))]',
            'text-[rgba(18,16,12,0.95)]',
            'p-7 max-[720px]:p-4',
            'font-[ui-serif,Georgia,Times_New_Roman,Times,serif]',
          ].join(' ')}
        >
          {/* ... 2045 CONTENT ... */}
        </article>
      ) : (
        <article
          id="xpot-fd-now"
          className={[
            'overflow-hidden rounded-2xl border border-white/10 shadow-[0_60px_180px_rgba(0,0,0,0.55)]',
            'p-7 max-[720px]:p-4 font-sans',
            'text-white/90',
            bgNowCard,
          ].join(' ')}
        >
          {/* ... NOW CONTENT ... */}
        </article>
      )}
    </>
  )}
</section>

      {/* Print rules */}
      <style jsx global>{`
        @media print {
          html,
          body {
            background: #fff !important;
          }
          a[href]:after {
            content: '' !important;
          }
        }
      `}</style>
    </main>
  );
}
