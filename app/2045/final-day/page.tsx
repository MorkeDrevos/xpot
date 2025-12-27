// app/2045/final-day/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Printer, Repeat2, Timer, Radio, ShieldCheck } from 'lucide-react';

type Era = '2045' | 'now';

const STORAGE_KEY = 'xpot_final_day_era_v5';
const LIVE_POLL_MS = 5000;

type LiveDraw = {
  dailyXpot: number;
  dayNumber: number;
  dayTotal: number;
  drawDate: string; // ISO-ish
  closesAt: string; // ISO-ish
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

/**
 * Tolerant ISO parsing:
 * - If backend sends "2025-12-27T01:23:03" (no timezone), Date.parse treats it as local time (bad).
 * - We force UTC by appending "Z" when no timezone info is present.
 */
function safeParseMs(iso: string | null | undefined) {
  if (!iso) return null;
  const s = String(iso).trim();
  if (!s) return null;

  const hasTz =
    s.endsWith('Z') ||
    /[+-]\d{2}:\d{2}$/.test(s) ||
    /[+-]\d{4}$/.test(s); // e.g. +0100

  const normalized = hasTz ? s : `${s}Z`;
  const ms = Date.parse(normalized);
  return Number.isFinite(ms) ? ms : null;
}

// ✅ Final Draw date must match lib/xpotRun.ts RUN_END = 2045-02-22 22:00 (Madrid)
// 2045-02-22 is Wednesday
const ARCHIVE_DATE_LINE = 'Wednesday, 22 February 2045';

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

  // Keyboard shortcuts: F = flip, P = print, Esc = back (make Esc reliable)
  useEffect(() => {
    function isTypingTarget(t: EventTarget | null) {
      const el = t as HTMLElement | null;
      if (!el) return false;
      const tag = (el.tagName || '').toLowerCase();
      return tag === 'input' || tag === 'textarea' || (el as any).isContentEditable;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;

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
        } catch {
          try {
            window.location.href = '/';
          } catch {}
        }
      }
    }

    // Use document + capture so it still works more often
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

        // Basic sanity checks to avoid rendering crashes
        if (!safeParseMs(d.closesAt)) throw new Error('BAD_CLOSESAT');
        if (!Number.isFinite(d.dailyXpot)) throw new Error('BAD_DAILY');
        if (!Number.isFinite(d.dayNumber) || d.dayNumber <= 0) d.dayNumber = 0;
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

  const closesAtMs = safeParseMs(live?.closesAt);

  // If closesAt exists but is already in the past, treat UI as "syncing next draw" (don’t show a fake broken 00:00)
  const remainingMsRaw = closesAtMs ? closesAtMs - nowTs : null;
  const isPast = remainingMsRaw !== null ? remainingMsRaw <= -1500 : false;
  const remainingMs = remainingMsRaw === null ? null : Math.max(0, remainingMsRaw);
  const cd = remainingMs !== null && !isPast ? formatCountdown(remainingMs) : null;

  const statusTone =
    liveErr || !live
      ? 'bg-white/5 text-white/80 ring-white/15'
      : live.status === 'OPEN'
        ? 'bg-emerald-500/10 text-emerald-200 ring-emerald-500/20'
        : live.status === 'COMPLETED'
          ? 'bg-white/5 text-white/85 ring-white/15'
          : 'bg-amber-500/10 text-amber-200 ring-amber-500/20';

  const statusLabel =
    liveErr ? 'OFFLINE' : !live ? 'SYNCING' : isPast ? 'SYNCING' : (live.status ?? 'OPEN');

  const dayLabel =
    live?.dayNumber && live?.dayTotal
      ? `Day ${live.dayNumber.toLocaleString()} of ${live.dayTotal.toLocaleString()}`
      : 'Day - of 7,000';

  const dayProgress =
    live?.dayNumber && live?.dayTotal ? Math.max(0, Math.min(1, live.dayNumber / live.dayTotal)) : 0;

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
      <section
        className="mx-auto max-w-[1120px] [perspective:1400px] print:[perspective:none]"
        aria-label="Final Day story"
      >
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
                <div className="mt-1 text-[clamp(36px,5vw,60px)] font-black leading-none tracking-[0.02em]">
                  XPOT Times
                </div>
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

            <div className="pt-1">
              <h1 className="text-[clamp(30px,4.2vw,52px)] font-black leading-[1.02] tracking-[-0.02em]">
                {meta.headline}
              </h1>
              <p className="mt-3 max-w-[78ch] text-[17px] leading-[1.45] text-[rgba(18,16,12,0.82)]">{meta.deck}</p>

              <div className="mt-5 grid grid-cols-[1fr_1fr_1.25fr] gap-4 max-[980px]:grid-cols-2 max-[860px]:grid-cols-1">
                {/* Column A */}
                <div>
                  <p className="text-[16px] leading-[1.62]">
                    <span className="float-left pr-2 text-[42px] font-black leading-[0.9] text-[rgba(18,16,12,0.92)]">
                      I
                    </span>
                    t’s the final day.
                  </p>
                  <p className="mt-3 text-[15px] leading-[1.62]">Not a crash. Not a rug. Not a scandal.</p>
                  <p className="mt-3 text-[15px] leading-[1.62]">A scheduled ending.</p>

                  <div className="mt-4 font-sans text-[12px] font-black uppercase tracking-[0.16em] text-[rgba(18,16,12,0.72)]">
                    Continuity
                  </div>
                  <p className="mt-2 text-[15px] leading-[1.62]">
                    For <strong>19.18 years</strong>, every single day, XPOT arrived on time. Same ritual. Same pause in
                    conversation. Same pull in the stomach when the numbers fell toward zero.
                  </p>
                  <p className="mt-3 text-[15px] leading-[1.62]">
                    People didn’t only play it. They <em>kept time with it</em>. School runs. Lunch breaks. Late nights.
                    A thousand ordinary days stitched into one shared clock.
                  </p>

                  <div className="mt-4 rounded-2xl border border-[rgba(18,16,12,0.22)] bg-white/40 p-4">
                    <div className="font-sans text-[11px] font-black uppercase tracking-[0.18em] text-[rgba(18,16,12,0.70)]">
                      Scale
                    </div>
                    <div className="mt-2 text-[18px] font-black tracking-[-0.01em]">
                      By 2045, XPOT is the{' '}
                      <span className="underline decoration-black/25">biggest game on the planet</span>.
                    </div>
                    <div className="mt-2 font-sans text-[13px] leading-[1.55] opacity-85">
                      Not because it shouted the loudest - because it never missed a day.
                    </div>
                  </div>

                  <p className="mt-4 text-[15px] leading-[1.62]">
                    By the last day, XPOT isn’t “a crypto project” anymore. It’s{' '}
                    <strong>a daily ritual the planet learned together</strong>.
                  </p>
                  <p className="mt-3 text-[15px] leading-[1.62]">
                    Not because of greed, but because it never asked anyone to believe in anything except the next day.
                  </p>

                  <blockquote className="mt-4 border-l-4 border-[rgba(18,16,12,0.35)] bg-[rgba(18,16,12,0.03)] px-3 py-3 italic">
                    “It didn’t promise miracles. It promised a daily draw - and it kept its word.”
                    <span className="mt-2 block font-sans text-[12px] font-black uppercase tracking-[0.10em] text-[rgba(18,16,12,0.65)] not-italic">
                      - Archive commentary, 2045
                    </span>
                  </blockquote>
                </div>

                {/* Column B */}
                <div>
                  <div className="font-sans text-[12px] font-black uppercase tracking-[0.16em] text-[rgba(18,16,12,0.72)]">
                    The final draw
                  </div>
                  <p className="mt-2 text-[15px] leading-[1.62]">Everyone knows it’s the last one.</p>
                  <p className="mt-3 text-[15px] leading-[1.62]">
                    Streams everywhere. Millions watching live. Some crying before it even begins - not because they
                    expect to win, but because they remember where they were when they first heard the sound.
                  </p>

                  <div className="mt-4 rounded-2xl border border-[rgba(18,16,12,0.22)] bg-white/35 p-3">
                    <div className="font-sans text-[12px] font-black uppercase tracking-[0.12em]">The Final Draw</div>
                    <div className="mt-3 space-y-2 font-sans text-[13px]">
                      <div className="flex items-center justify-between border-t border-dashed border-black/15 pt-2">
                        <span>Daily XPOT</span>
                        <span className="font-black">1,000,000 XPOT</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-dashed border-black/15 pt-2">
                        <span>Rule set</span>
                        <span className="font-black">Unchanged</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-dashed border-black/15 pt-2">
                        <span>Ending</span>
                        <span className="font-black">Scheduled</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-dashed border-black/15 pt-2">
                        <span>Reason</span>
                        <span className="font-black">Because it said it would</span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-[15px] leading-[1.62]">
                    No boost. No fireworks. No panic patch. No last-minute “upgrade”. Just the same rules, carried all
                    the way to the end.
                  </p>
                  <p className="mt-3 text-[15px] leading-[1.62]">
                    The countdown starts. And something changes in the room: people stop hoping for luck, and start
                    listening for closure.
                  </p>
                  <p className="mt-3 text-[15px] leading-[1.62]">
                    When it hits zero, a winner is chosen. Someone ordinary. Someone unknown. Someone who will carry the
                    last number like a scar and a medal at the same time.
                  </p>
                  <p className="mt-3 text-[15px] leading-[1.62]">XPOT does what it promised. One final time.</p>

                  <div className="my-4 h-px bg-[linear-gradient(90deg,transparent,rgba(18,16,12,0.35),transparent)]" />
                  <p className="text-[14px] leading-[1.62] text-[rgba(18,16,12,0.78)]">
                    What ends today isn’t only a product. It’s the disappearance of a tiny daily suspense that lived in
                    millions of lives - a shared habit that outlived cycles, headlines and skepticism.
                  </p>
                </div>

                {/* Column C (wide) */}
                <div className="max-[980px]:col-span-2 max-[860px]:col-span-1">
                  <div className="font-sans text-[12px] font-black uppercase tracking-[0.16em] text-[rgba(18,16,12,0.72)]">
                    Then the countdown ends
                  </div>
                  <p className="mt-2 text-[15px] leading-[1.62]">Nothing breaks. Nothing explodes. Nothing disappears.</p>
                  <p className="mt-3 text-[15px] leading-[1.62]">
                    The system simply stops issuing draws - like a candle allowed to burn down instead of being blown out.
                  </p>
                  <p className="mt-3 text-[15px] leading-[1.62]">
                    The protocol remains accessible. The record remains visible. Every winner. Every day. Nineteen point
                    one eight years - perfectly accounted for, as if it mattered enough to be kept.
                  </p>

                  <div className="mt-4 rounded-2xl border border-[rgba(18,16,12,0.22)] bg-white/40 p-4">
                    <div className="font-sans text-[11px] font-black uppercase tracking-[0.18em] text-[rgba(18,16,12,0.70)]">
                      A quiet line appears
                    </div>
                    <div className="mt-2 text-[18px] font-black tracking-[-0.01em]">“XPOT completed its mission.”</div>
                    <div className="mt-2 font-sans text-[13px] leading-[1.55] opacity-85">
                      No ads. No upsell. No “v2 coming soon”. No bargaining. Just the truth - and the silence after.
                    </div>
                  </div>

                  <div className="mt-5 font-sans text-[12px] font-black uppercase tracking-[0.16em] text-[rgba(18,16,12,0.72)]">
                    The architect
                  </div>
                  <p className="mt-2 text-[15px] leading-[1.62]">
                    In the years that follow, the origin story becomes strangely simple. No hero speeches. No victory laps.
                    Just a set of rules written once - then obeyed for nearly two decades.
                  </p>
                  <p className="mt-3 text-[15px] leading-[1.62]">
                    The people behind it are rarely discussed as personalities. Instead, XPOT is remembered as a decision:
                    the decision to stop. The decision to refuse inflation. The decision to never move the goalposts, even
                    when the world begged for “more”.
                  </p>
                  <p className="mt-3 text-[15px] leading-[1.62]">
                    That restraint becomes the signature. In a culture of endless beginnings, the rarest thing is an
                    ending that arrives on time.
                  </p>

                  <div className="mt-5 font-sans text-[12px] font-black uppercase tracking-[0.16em] text-[rgba(18,16,12,0.72)]">
                    Legacy
                  </div>
                  <p className="mt-2 text-[15px] leading-[1.62]">
                    XPOT becomes studied - in economics, in game theory, in psychology. Not as the biggest prize, but as
                    proof that trust can be engineered and kept.
                  </p>
                  <ul className="mt-3 list-disc pl-5 text-[15px] leading-[1.6]">
                    <li>The game that never cheated</li>
                    <li>The system that never inflated itself to survive</li>
                    <li>The ending that made the beginning sacred</li>
                  </ul>

                  <p className="mt-4 font-sans text-[15px] font-black tracking-[-0.01em]">
                    Most projects die because they don’t know how to end. XPOT ended because it said it would.
                  </p>
                </div>
              </div>
            </div>

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

                  {/* Mysterious (no single-person credit) */}
                  <div className="hidden sm:block text-[11px] font-black uppercase tracking-[0.14em] text-white/60">
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
                  Progress to Day 7,000
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

                  <span
                    className={['inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black ring-1', statusTone].join(
                      ' ',
                    )}
                  >
                    {statusLabel}
                  </span>
                </div>

                {liveErr ? (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[13px] font-bold text-white/80">
                    {liveErr}. Protocol telemetry should return{' '}
                    <span className="text-white/95">dailyXpot</span>, <span className="text-white/95">dayNumber</span>,{' '}
                    <span className="text-white/95">dayTotal</span> and <span className="text-white/95">closesAt</span>.
                  </div>
                ) : (
                  <>
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {(['d', 'h', 'm', 's'] as const).map((k) => {
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
                        {live?.closesAt && !isPast
                          ? `Closes at: ${new Date(safeParseMs(live.closesAt) ?? Date.now()).toUTCString()}`
                          : 'Syncing next draw...'}
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
                  The archive edition is how the ecosystem remembers the ending. The live side is how the ecosystem feels it
                  - one countdown at a time.
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
