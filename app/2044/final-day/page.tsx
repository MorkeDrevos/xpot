// app/2044/final-day/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Printer, Repeat2, Timer, Radio, ShieldCheck } from 'lucide-react';

type Era = '2044' | 'now';

const STORAGE_KEY = 'xpot_final_day_era_v4';
const LIVE_POLL_MS = 5000;

// Correct weekday for 2044-10-12 is Wednesday
const ARCHIVE_DATE_LINE = 'Wednesday, 12 October 2044';

type LiveDraw = {
  dailyXpot: number;
  closesAt: string; // ISO
  status: 'OPEN' | 'LOCKED' | 'COMPLETED';
};

type LivePayload = {
  draw: LiveDraw | null;
  progress?: {
    dayNumber?: number;
    totalDays?: number;
  };
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

export default function FinalDayPage() {
  const [era, setEra] = useState<Era>('2044');

  // Live draw state for "Now"
  const [live, setLive] = useState<LiveDraw | null>(null);
  const [liveErr, setLiveErr] = useState<string | null>(null);
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  // Day progress
  const [dayNumber, setDayNumber] = useState<number | null>(null);
  const [totalDays, setTotalDays] = useState<number>(7000);

  const abortRef = useRef<AbortController | null>(null);

  // Restore era from localStorage
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (v === '2044' || v === 'now') setEra(v);
    } catch {}
  }, []);

  // Persist era
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, era);
    } catch {}
  }, [era]);

  const meta = useMemo(() => {
    if (era === '2044') {
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
    setEra(e => (e === '2044' ? 'now' : '2044'));
  }, []);

  const onPrint = useCallback(() => {
    setEra('2044');
    window.setTimeout(() => {
      if (typeof window !== 'undefined') window.print();
    }, 60);
  }, []);

  // Keyboard shortcuts: F = flip, P = print, Esc = back
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
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
        try {
          window.location.href = '/';
        } catch {}
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
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
        const res = await fetch('/api/draw/live', { cache: 'no-store', signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP_${res.status}`);

        const json = (await res.json()) as LivePayload;
        if (!alive) return;

        const dn = json?.progress?.dayNumber;
        const td = json?.progress?.totalDays;
        if (typeof dn === 'number' && Number.isFinite(dn)) setDayNumber(Math.max(0, Math.floor(dn)));
        if (typeof td === 'number' && Number.isFinite(td)) setTotalDays(Math.max(1, Math.floor(td)));

        if (!json?.draw?.closesAt) {
          setLive(null);
          return;
        }

        const d: LiveDraw = {
          dailyXpot: Number(json.draw.dailyXpot ?? 1_000_000),
          closesAt: String(json.draw.closesAt),
          status: (json.draw.status as LiveDraw['status']) ?? 'OPEN',
        };

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

  const closesAtMs = live?.closesAt ? Date.parse(live.closesAt) : null;
  const remainingMs = closesAtMs ? Math.max(0, closesAtMs - nowTs) : null;
  const cd = remainingMs !== null ? formatCountdown(remainingMs) : null;

  const statusTone =
    live?.status === 'OPEN'
      ? 'bg-emerald-500/10 text-emerald-200 ring-emerald-500/20'
      : live?.status === 'COMPLETED'
      ? 'bg-white/5 text-white/85 ring-white/15'
      : 'bg-amber-500/10 text-amber-200 ring-amber-500/20';

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

  const dayLine =
    dayNumber == null
      ? 'DAY -- OF 7000'
      : `DAY ${Math.min(dayNumber, totalDays).toLocaleString()} OF ${totalDays.toLocaleString()}`;

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
              era === '2044' ? 'bg-white/[0.08] text-white/95' : 'text-white/70 hover:text-white/90',
            ].join(' ')}
            onClick={() => setEra('2044')}
            role="tab"
            aria-selected={era === '2044'}
            aria-controls="xpot-fd-archive"
          >
            2044
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
      <section
        className="mx-auto max-w-[1120px] [perspective:1400px] print:[perspective:none]"
        aria-label="Final Day story"
      >
        <div
          className={[
            // ✅ critical: give the 3D scene a stable height so "NOW" never collapses to blank
            'relative min-h-[720px] [transform-style:preserve-3d]',
            'motion-safe:transition-transform motion-safe:duration-[800ms]',
            'motion-safe:ease-[cubic-bezier(0.22,0.9,0.22,1)]',
            era === 'now' ? '[transform:rotateY(180deg)]' : '',
            'print:[transform:none]',
          ].join(' ')}
        >
          {/* FRONT: 2044 newspaper */}
          <article
            id="xpot-fd-archive"
            aria-hidden={era !== '2044'}
            className={[
              'min-h-[720px] overflow-hidden rounded-2xl border border-white/10 shadow-[0_60px_180px_rgba(0,0,0,0.55)]',
              '[backface-visibility:hidden] [-webkit-backface-visibility:hidden]',
              'print:min-h-0 print:rounded-none print:border-0 print:shadow-none',
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
            {/* ... keep your archive story exactly as you pasted (already updated) ... */}
            {/* I’m not duplicating the entire archive body here to keep this response readable.
                Paste your existing archive <header> + columns exactly as-is. */}
            {/* IMPORTANT: Ensure "The Final Draw" box labels stay "Daily XPOT" (no jackpot). */}

            {/* START: your existing archive content */}
            {/* (Paste from your current file: header, story columns, footer) */}
            {/* END: your existing archive content */}
          </article>

          {/* BACK: Present day */}
          <article
            id="xpot-fd-now"
            aria-hidden={era !== 'now'}
            className={[
              'absolute inset-0 min-h-[720px] overflow-hidden rounded-2xl border border-white/10 shadow-[0_60px_180px_rgba(0,0,0,0.55)]',
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

                <div className="flex items-center gap-2">
                  <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white/85">
                    {dayLine}
                  </div>

                  <div className="text-[11px] font-black uppercase tracking-[0.14em] text-white/70">
                    Initiated by <span className="text-white/90">@MorkeDrevos</span>
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
                  onClick={() => setEra('2044')}
                >
                  Read the 2044 archive
                </button>
                <Link
                  className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[13px] font-black text-white/90 hover:bg-white/[0.07]"
                  href="/hub"
                >
                  Enter today’s XPOT
                </Link>
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

                  <span
                    className={['inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black ring-1', statusTone].join(' ')}
                  >
                    {live?.status ?? (liveErr ? 'OFFLINE' : live ? 'OPEN' : 'LOADING')}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  {(['d', 'h', 'm', 's'] as const).map(k => {
                    const v =
                      cd == null
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
                      Daily XPOT:{' '}
                      <span className="font-black">{(live?.dailyXpot ?? 1_000_000).toLocaleString()} XPOT</span>
                    </span>
                  </div>

                  <div className="font-black">
                    {live?.closesAt
                      ? `Closes at: ${new Date(live.closesAt).toUTCString()}`
                      : liveErr
                      ? liveErr
                      : 'No active draw yet'}
                  </div>
                </div>

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
                  This page is your live clock - and your progress marker. {dayLine}.
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
