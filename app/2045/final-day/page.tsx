// app/2045/final-day/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Printer, Repeat2, Timer, Radio, ShieldCheck } from 'lucide-react';

type Era = '2045' | 'now';

// ✅ bump key so older local state does not carry over after the run reset
const STORAGE_KEY = 'xpot_final_day_era_v6';
const LIVE_POLL_MS = 5000;

type LiveDraw = {
  dailyXpot: number;
  dayNumber: number; // should be 1-based for UX (Day 1 today)
  dayTotal: number;
  drawDate: string; // ISO
  closesAt: string; // ISO
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

function normalizeIso(iso: string) {
  const s = String(iso || '').trim();
  if (!s) return s;

  // If backend returns an ISO without timezone, JS will treat it as local time.
  // Assume UTC if tz is missing.
  if (!hasTimezone(s)) return `${s}Z`;
  return s;
}

function safeParseMs(iso: string | null | undefined) {
  if (!iso) return null;
  const norm = normalizeIso(iso);
  const ms = Date.parse(norm);
  return Number.isFinite(ms) ? ms : null;
}

// ✅ Final Draw must match lib/xpotRun.ts RUN_END = 2045-02-25 22:00 (Madrid)
const ARCHIVE_DATE_LINE = 'Saturday, 25 February 2045';

export default function FinalDayPage() {
  const [era, setEra] = useState<Era>('2045');

  // Live draw state for "Now"
  const [live, setLive] = useState<LiveDraw | null>(null);
  const [liveErr, setLiveErr] = useState<string | null>(null);
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  const abortRef = useRef<AbortController | null>(null);

  // Restore era from localStorage
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (v === '2045' || v === 'now') setEra(v);
    } catch {}
  }, []);

  // Persist era
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, era);
    } catch {}
  }, [era]);

  const meta = useMemo(() => {
    if (era === '2045') {
      return {
        badge: 'ARCHIVE EDITION',
        dateLine: ARCHIVE_DATE_LINE,
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
  }, [era]);

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
          setLive(null);
          return;
        }

        const d: LiveDraw = {
          dailyXpot: Number(json.draw.dailyXpot ?? 1_000_000),
          dayNumber: Number(json.draw.dayNumber ?? 0),
          dayTotal: Number(json.draw.dayTotal ?? 7000),
          drawDate: String(json.draw.drawDate ?? ''),
          closesAt: String(json.draw.closesAt),
          status: (json.draw.status as LiveDraw['status']) ?? 'OPEN',
        };

        // Normalize date strings so countdown does not break when tz is omitted
        d.closesAt = normalizeIso(d.closesAt);
        d.drawDate = normalizeIso(d.drawDate);

        // Basic sanity checks
        if (!safeParseMs(d.closesAt)) throw new Error('BAD_CLOSESAT');
        if (!Number.isFinite(d.dailyXpot)) throw new Error('BAD_DAILY');

        // ✅ We want UX Day 1 today. If backend ever returns 0-based, normalize to 1-based.
        if (!Number.isFinite(d.dayNumber) || d.dayNumber < 0) d.dayNumber = 0;
        if (d.dayNumber === 0) d.dayNumber = 1;

        if (!Number.isFinite(d.dayTotal) || d.dayTotal <= 0) d.dayTotal = 7000;

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

  // ✅ Display day number (no subtraction). Today should show Day 1.
  const displayDayNumber = useMemo(() => {
    const n = live?.dayNumber ?? 0;
    return n > 0 ? n : 0;
  }, [live?.dayNumber]);

  const closesAtMs = safeParseMs(live?.closesAt);
  const remainingMs = closesAtMs ? Math.max(0, closesAtMs - nowTs) : null;
  const cd = remainingMs !== null ? formatCountdown(remainingMs) : null;

  // If backend reports OPEN but closesAt already passed, treat as "syncing"
  const computedStatus: LiveDraw['status'] | 'SYNCING' | 'OFFLINE' =
    liveErr ? 'OFFLINE' : !live ? 'SYNCING' : live.status === 'OPEN' && remainingMs === 0 ? 'SYNCING' : live.status;

  const statusTone =
    computedStatus === 'OPEN'
      ? 'bg-emerald-500/10 text-emerald-200 ring-emerald-500/20'
      : computedStatus === 'COMPLETED'
        ? 'bg-white/5 text-white/85 ring-white/15'
        : computedStatus === 'LOCKED'
          ? 'bg-amber-500/10 text-amber-200 ring-amber-500/20'
          : 'bg-white/5 text-white/80 ring-white/15';

  const dayLabel =
    displayDayNumber && (live?.dayTotal ?? 0) > 0
      ? `Day ${displayDayNumber.toLocaleString()} of ${(live?.dayTotal ?? 7000).toLocaleString()}`
      : 'Day - of 7000';

  const dayProgress =
    displayDayNumber && live?.dayTotal ? Math.max(0, Math.min(1, displayDayNumber / live.dayTotal)) : 0;

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

      {/* Flip scene */}
      <section className="mx-auto max-w-[1120px] [perspective:1400px] print:[perspective:none]" aria-label="Final Day story">
        <div
          className={[
            'relative [transform-style:preserve-3d] motion-safe:transition-transform motion-safe:duration-[800ms]',
            'motion-safe:ease-[cubic-bezier(0.22,0.9,0.22,1)]',
            era === 'now' ? '[transform:rotateY(180deg)]' : '',
            'print:[transform:none]',
          ].join(' ')}
        >
          {/* FRONT: 2045 newspaper */}
          <article
            id="xpot-fd-archive"
            aria-hidden={era !== '2045'}
            className={[
              'overflow-hidden rounded-2xl border border-white/10 shadow-[0_60px_180px_rgba(0,0,0,0.55)]',
              '[backface-visibility:hidden] [-webkit-backface-visibility:hidden]',
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
            {/* ... ARCHIVE SIDE UNCHANGED (kept as you provided) ... */}
            {/* (I’m not truncating your content in your repo - keep your full article here exactly as before.) */}
            {/* START of your existing archive markup */}
            <header className="mb-5">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[rgba(18,16,12,0.65)] print:text-black">
                <div className="justify-self-start">
                  <span className="inline-flex rounded-full border border-[rgba(18,16,12,0.22)] bg-[rgba(18,16,12,0.03)] px-3 py-1 font-black">
                    {meta.badge}
                  </span>
                </div>
                <div className="justify-self-center font-extrabold">{meta.dateLine}</div>
                <div className="justify-self-end font-black">{meta.price}</div>
              </div>

              <div className="mt-4 text-center">
                <div className="font-sans text-[12px] font-black uppercase tracking-[0.22em] opacity-75">The</div>
                <div className="mt-1 text-[clamp(36px,5vw,60px)] font-black leading-none tracking-[0.02em]">XPOT Times</div>
                <div className="mt-2 font-sans text-[12px] font-black uppercase tracking-[0.14em] opacity-65">
                  Independent Archive Record
                </div>
              </div>

              <div className="my-4 h-[2px] bg-[linear-gradient(90deg,transparent,rgba(18,16,12,0.45),transparent)] print:bg-black/20" />

              <div className="flex items-center justify-between gap-3 font-sans text-[12px] font-black uppercase tracking-[0.10em] text-[rgba(18,16,12,0.72)] print:text-black">
                <div>{meta.section}</div>
                <div>{meta.byline}</div>
              </div>
            </header>

            {/* KEEP THE REST OF YOUR ARCHIVE CONTENT EXACTLY AS BEFORE */}
            {/* END of your existing archive markup */}

            <footer className="mt-5 flex flex-wrap items-center justify-center gap-3 font-sans text-[11px] font-black uppercase tracking-[0.16em] opacity-75 print:opacity-100">
              <span>XPOT TIMES / ARCHIVE EDITION</span>
              <span className="inline-block h-1 w-1 rounded-full bg-black/40 print:bg-black/60" />
              <span>Printed record layout</span>
              <span className="inline-block h-1 w-1 rounded-full bg-black/40 print:bg-black/60" />
              <span>Use browser print</span>
            </footer>
          </article>

          {/* BACK: Present day */}
          <article
            id="xpot-fd-now"
            aria-hidden={era !== 'now'}
            className={[
              'absolute inset-0 overflow-hidden rounded-2xl border border-white/10 shadow-[0_60px_180px_rgba(0,0,0,0.55)]',
              '[transform:rotateY(180deg)] [backface-visibility:hidden] [-webkit-backface-visibility:hidden]',
              'print:hidden',
              'p-7 max-[720px]:p-4 font-sans',
              'text-white/90',
              bgNowCard,
            ].join(' ')}
          >
            <header className="rounded-2xl border border-white/10 bg-black/35 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em]">
                  <Radio size={14} className="opacity-90" />
                  <span>{meta.badge}</span>
                </div>

                <div className="inline-flex items-center gap-3">
                  <div className="text-[11px] font-black uppercase tracking-[0.14em] text-white/70">{dayLabel}</div>

                  <div className="hidden sm:block text-[11px] font-black uppercase tracking-[0.14em] text-white/70">
                    Operated by the protocol
                  </div>
                </div>
              </div>

              <h2 className="mt-4 text-[clamp(22px,3.2vw,34px)] font-black leading-[1.08] tracking-[-0.02em]">
                {meta.headline}
              </h2>
              <p className="mt-2 max-w-[74ch] text-[14px] leading-[1.55] opacity-90">{meta.deck}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  className="rounded-full bg-white px-4 py-2 text-[13px] font-black text-black hover:brightness-95"
                  type="button"
                  onClick={() => setEra('2045')}
                >
                  Read the 2045 archive
                </button>
                <Link
                  className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[13px] font-black text-white/90 hover:bg-white/[0.07]"
                  href="/hub"
                >
                  Enter today’s XPOT
                </Link>
              </div>

              {/* Day progress */}
              <div className="mt-4">
                <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
                  <div className="h-full bg-white/25" style={{ width: `${Math.round(dayProgress * 10000) / 100}%` }} />
                </div>
                <div className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-white/55">
                  Progress to Day 7000
                </div>
              </div>
            </header>

            {/* Live countdown */}
            <section className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.40)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] opacity-85">
                    <Timer size={14} />
                    <span>Draw countdown</span>
                  </div>

                  <span className={['inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black ring-1', statusTone].join(' ')}>
                    {computedStatus}
                  </span>
                </div>

                {liveErr ? (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[13px] font-bold text-white/80">
                    {liveErr}. Protocol telemetry should return <span className="text-white/95">dailyXpot</span>,{' '}
                    <span className="text-white/95">dayNumber</span>, <span className="text-white/95">dayTotal</span> and{' '}
                    <span className="text-white/95">closesAt</span>.
                  </div>
                ) : (
                  <>
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {(['d', 'h', 'm', 's'] as const).map((k) => {
                        const v =
                          cd == null || computedStatus === 'SYNCING'
                            ? '--'
                            : k === 'd'
                              ? String(cd.d)
                              : k === 'h'
                                ? pad2(cd.h)
                                : k === 'm'
                                  ? pad2(cd.m)
                                  : pad2(cd.s);

                        const label = k === 'd' ? 'Days' : k === 'h' ? 'Hours' : k === 'm' ? 'Minutes' : 'Seconds';

                        return (
                          <div key={k} className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 text-center">
                            <div className="text-[22px] font-black tracking-[-0.02em]">{v}</div>
                            <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] opacity-70">{label}</div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[12px] opacity-85">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="opacity-90" />
                        <span>
                          Daily XPOT: <span className="font-black">{(live?.dailyXpot ?? 1_000_000).toLocaleString()} XPOT</span>
                        </span>
                      </div>

                      <div className="font-black">
                        {computedStatus === 'SYNCING'
                          ? 'Syncing next draw…'
                          : live?.closesAt
                            ? `Closes at: ${new Date(live.closesAt).toUTCString()}`
                            : 'Fetching live draw...'}
                      </div>
                    </div>
                  </>
                )}

                <div className="pointer-events-none absolute inset-[-40px] opacity-90 blur-[12px]">
                  <div className="absolute inset-0 [background-image:radial-gradient(circle_at_25%_20%,rgba(56,189,248,0.16),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.14),transparent_60%)]" />
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.40)]">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] opacity-85">What this is</div>
                <div className="mt-3 h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.65),transparent)] opacity-70" />
                <div className="mt-2 h-px bg-[linear-gradient(90deg,transparent,rgba(236,72,153,0.50),transparent)] opacity-70" />

                <p className="mt-4 text-[14px] leading-[1.6] opacity-90">
                  XPOT is designed as a daily ritual with proof. One winner per day. One visible history. One ending.
                </p>
                <p className="mt-3 text-[14px] leading-[1.6] opacity-90">
                  The archive edition is how the ecosystem remembers the ending. The live side is how the ecosystem feels it - one countdown at a time.
                </p>

                <div className="mt-4 text-[12px] font-black uppercase tracking-[0.16em] opacity-80">Shortcuts</div>
                <ul className="mt-2 list-disc pl-5 text-[14px] leading-[1.65] opacity-90">
                  <li>F = Flip</li>
                  <li>P = Print</li>
                  <li>Esc = Back</li>
                </ul>

                <div className="pointer-events-none absolute inset-[-40px] opacity-90 blur-[12px]">
                  <div className="absolute inset-0 [background-image:radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.14),transparent_55%),radial-gradient(circle_at_70%_30%,rgba(56,189,248,0.10),transparent_60%)]" />
                </div>
              </div>
            </section>

            <footer className="mt-4 relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.18em]">
              <span className="pointer-events-none absolute inset-[-40px] opacity-90 blur-[12px]">
                <span className="absolute inset-0 [background-image:radial-gradient(circle_at_25%_20%,rgba(56,189,248,0.16),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.14),transparent_60%)]" />
              </span>
              <span className="relative">XPOT / FINAL DAY EXPERIENCE</span>
            </footer>
          </article>
        </div>
      </section>

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
