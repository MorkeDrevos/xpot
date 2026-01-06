// app/2045/final-day/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Printer, Repeat2, Timer, Radio, ShieldCheck } from 'lucide-react';

import { RUN_DAYS, RUN_END, RUN_START, getFinalDrawEUShort } from '@/lib/xpotRun';

type Era = '2045' | 'now';

// ✅ bump key to reset any cached era from older run/version
const STORAGE_KEY = 'xpot_final_day_era_v9';
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

  const tomorrow = new Date(Date.UTC(p.year, p.month - 1, p.day) + 86_400_000);
  const t = getZonedParts(tomorrow, MADRID_TZ);
  return zonedTimeToUtcMs(MADRID_TZ, t.year, t.month, t.day, DRAW_HOUR_MADRID, DRAW_MINUTE_MADRID, 0);
}

type Meta = {
  badge: string;
  dateLine: string;
  section: string;
  headline: string;
  deck: string;
  byline: string;
  price: string;
};

function ArchivePanel({ meta }: { meta: Meta }) {
  return (
    <article
      id="xpot-fd-archive"
      className={[
        'overflow-hidden rounded-2xl border border-white/10 shadow-[0_60px_180px_rgba(0,0,0,0.55)]',
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

      <div className="pt-1">
        <h1 className="text-[clamp(30px,4.2vw,52px)] font-black leading-[1.02] tracking-[-0.02em]">{meta.headline}</h1>
        <p className="mt-3 max-w-[78ch] text-[17px] leading-[1.45] text-[rgba(18,16,12,0.82)]">{meta.deck}</p>

        <div className="mt-5 grid grid-cols-[1fr_1fr_1.25fr] gap-4 max-[980px]:grid-cols-2 max-[860px]:grid-cols-1">
          {/* Column A */}
          <div>
            <p className="text-[16px] leading-[1.62]">
              <span className="float-left pr-2 text-[42px] font-black leading-[0.9] text-[rgba(18,16,12,0.92)]">I</span>
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
              People didn’t only play it. They <em>kept time with it</em>. School runs. Lunch breaks. Late nights. A
              thousand ordinary days stitched into one shared clock.
            </p>

            <div className="mt-4 rounded-2xl border border-[rgba(18,16,12,0.22)] bg-white/40 p-4">
              <div className="font-sans text-[11px] font-black uppercase tracking-[0.18em] text-[rgba(18,16,12,0.70)]">
                Scale
              </div>
              <div className="mt-2 text-[18px] font-black tracking-[-0.01em]">
                By 2045, XPOT is the <span className="underline decoration-black/25">biggest game on the planet</span>.
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
              Streams everywhere. Millions watching live. Some crying before it even begins - not because they expect
              to win, but because they remember where they were when they first heard the sound.
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
              No boost. No fireworks. No panic patch. No last-minute “upgrade”. Just the same rules, carried all the
              way to the end.
            </p>
            <p className="mt-3 text-[15px] leading-[1.62]">
              The countdown starts. And something changes in the room: people stop hoping for luck, and start listening
              for closure.
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

          {/* Column C */}
          <div className="max-[980px]:col-span-2 max-[860px]:col-span-1">
            <div className="font-sans text-[12px] font-black uppercase tracking-[0.16em] text-[rgba(18,16,12,0.72)]">
              Then something rare happens
            </div>
            <p className="mt-2 text-[15px] leading-[1.62]">Nothing breaks. Nothing explodes. Nothing disappears.</p>
            <p className="mt-3 text-[15px] leading-[1.62]">
              The system simply stops issuing draws - like a candle allowed to burn down instead of being blown out.
            </p>
            <p className="mt-3 text-[15px] leading-[1.62]">
              The protocol remains accessible. The record remains visible. Every winner. Every day. Nineteen point one
              eight years - perfectly accounted for, as if it mattered enough to be kept.
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
              The people behind it are rarely discussed as personalities. Instead, they are remembered as a decision:
              the decision to stop. The decision to refuse inflation. The decision to never move the goalposts, even
              when the world begged for “more”.
            </p>
            <p className="mt-3 text-[15px] leading-[1.62]">
              That restraint becomes the signature. In a culture of endless beginnings, the rarest thing is an ending
              that arrives on time.
            </p>

            <div className="mt-5 font-sans text-[12px] font-black uppercase tracking-[0.16em] text-[rgba(18,16,12,0.72)]">
              Legacy
            </div>
            <p className="mt-2 text-[15px] leading-[1.62]">
              XPOT becomes studied - in economics, in game theory, in psychology. Not as the biggest prize, but as proof
              that trust can be engineered and kept.
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
  );
}

function NowPanel({
  meta,
  setEra,
  drawSchedule,
  dayLabel,
  drawStatusLabel,
  dayProgress,
  computedStatus,
  statusTone,
  usingFallback,
  cutoffLabel,
  closesAtLabel,
  cd,
  live,
  liveErr,
  bgNowCard,
}: {
  meta: Meta;
  setEra: (e: Era) => void;
  drawSchedule: {
    archiveDateLine: string;
    currentDayNumber: number;
    completedDraws: number;
    daysRemaining: number;
  };
  dayLabel: string;
  drawStatusLabel: string;
  dayProgress: number;
  computedStatus: LiveDraw['status'] | 'SYNCING' | 'OFFLINE';
  statusTone: string;
  usingFallback: boolean;
  cutoffLabel: string;
  closesAtLabel: string;
  cd: { d: number; h: number; m: number; s: number };
  live: LiveDraw | null;
  liveErr: string | null;
  bgNowCard: string;
}) {
  return (
    <article
      id="xpot-fd-now"
      className={[
        'overflow-hidden rounded-2xl border border-white/10 shadow-[0_60px_180px_rgba(0,0,0,0.55)]',
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

          <div className="inline-flex items-center gap-4">
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-white/70">{dayLabel}</div>
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-white/70">
              Draw status {drawStatusLabel}
            </div>

            <div className="hidden lg:block text-[11px] font-black uppercase tracking-[0.14em] text-white/70">
              Final day {drawSchedule.archiveDateLine}
            </div>

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

        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
            <div className="h-full bg-white/25" style={{ width: `${Math.round(dayProgress * 10000) / 100}%` }} />
          </div>
          <div className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-white/55">
            {drawSchedule.daysRemaining.toLocaleString()} days remaining
          </div>
        </div>
      </header>

      <section className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.40)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] opacity-85">
              <Timer size={14} />
              <span>Draw countdown</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={[
                  'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black ring-1',
                  statusTone,
                  'shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_10px_30px_rgba(0,0,0,0.35)]',
                ].join(' ')}
              >
                {computedStatus}
              </span>

              <span className="hidden sm:inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white/70">
                {usingFallback ? 'Protocol schedule' : 'Live feed'}
              </span>
            </div>
          </div>

          {liveErr ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[13px] font-bold text-white/80">
              {liveErr}. Falling back to protocol schedule ({cutoffLabel}).
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-4 gap-2">
            {(['d', 'h', 'm', 's'] as const).map((k) => {
              const v =
                computedStatus === 'SYNCING'
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
              {computedStatus === 'SYNCING' ? 'Syncing next draw…' : `Cutoff: ${closesAtLabel}`}
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
  );
}

export default function FinalDayPage() {
  // ✅ Read era on first render (prevents Safari flash)
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

      const afterCutoff =
        nowMadrid.hour > DRAW_HOUR_MADRID || (nowMadrid.hour === DRAW_HOUR_MADRID && nowMadrid.minute >= DRAW_MINUTE_MADRID);

      if (dayDiff <= 0) {
        completed = 0;
      } else {
        completed = Math.max(0, dayDiff - (afterCutoff ? 0 : 1));
      }
    }

    completed = Math.min(RUN_TOTAL_DAYS, completed);

    const currentDayNumber = Math.min(RUN_TOTAL_DAYS, Math.max(1, completed + 1));

    // ✅ FIX: days remaining should be "days after today", so subtract currentDayNumber (not completed draws)
    const daysRemaining = Math.max(0, RUN_TOTAL_DAYS - currentDayNumber);

    return {
      runStartUtcMs,
      runEndUtcMs,
      currentDayNumber,
      completedDraws: completed,
      daysRemaining,
      endDateDMY,
      archiveDateLine: formatArchiveDateLine(runEndUtcMs),
      nowMadrid,
    };
  }, [nowTs]);

  // ✅ Meta is now fixed per side (prevents desktop “wrong header” + overlap feeling)
  const archiveMeta = useMemo<Meta>(
    () => ({
      badge: 'ARCHIVE EDITION',
      dateLine: drawSchedule.archiveDateLine,
      section: 'Culture / Protocols',
      headline: "XPOT’s Final Day",
      deck:
        'It did not collapse. It did not vanish. It did not betray anyone. It simply reached the end of its promise - after 19.18 years of daily continuity.',
      byline: 'By The XPOT Desk',
      price: 'FREE EDITION',
    }),
    [drawSchedule.archiveDateLine],
  );

  const nowMeta = useMemo<Meta>(
    () => ({
      badge: 'PRESENT DAY',
      dateLine: 'Today',
      section: 'Live',
      headline: 'A Daily Ritual With an Ending',
      deck: 'This is the live countdown. When it reaches zero, the day’s winner is chosen - and XPOT moves one step closer to the Final Draw.',
      byline: 'XPOT',
      price: '',
    }),
    [],
  );

  const onFlip = useCallback(() => {
    setEra((e) => (e === '2045' ? 'now' : '2045'));
  }, []);

  const onPrint = useCallback(() => {
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
          dayTotal: Number(json.draw.dayTotal ?? RUN_TOTAL_DAYS),
          drawDate: String(json.draw.drawDate ?? ''),
          closesAt: String(json.draw.closesAt ?? ''),
          status: (json.draw.status as LiveDraw['status']) ?? 'OPEN',
        };

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

  // Countdown source:
  // - Prefer live.closesAt (API), BUT treat past timestamps as invalid
  // - Fallback to next 22:00 Madrid (protocol schedule)
  const liveClosesAtMs = safeParseUtcMsFromIso(live?.closesAt);
  const fallbackClosesAtMs = useMemo(() => nextCutoffUtcMs(nowTs), [nowTs]);

  const isLiveStale = !liveClosesAtMs || liveClosesAtMs <= nowTs;
  const usingFallback = isLiveStale;
  const closesAtMs = usingFallback ? fallbackClosesAtMs : liveClosesAtMs;

  const remainingMs = Number.isFinite(closesAtMs)
    ? Math.max(0, closesAtMs - nowTs)
    : Math.max(0, fallbackClosesAtMs - nowTs);

  const cd = formatCountdown(remainingMs);

  const computedStatus: LiveDraw['status'] | 'SYNCING' | 'OFFLINE' =
    liveErr ? 'OFFLINE' : remainingMs === 0 ? 'SYNCING' : usingFallback ? 'OPEN' : live ? live.status : 'OPEN';

  const statusTone =
    computedStatus === 'OPEN'
      ? 'bg-emerald-500/12 text-emerald-100 ring-emerald-400/35'
      : computedStatus === 'COMPLETED'
        ? 'bg-white/6 text-white/90 ring-white/18'
        : computedStatus === 'LOCKED'
          ? 'bg-amber-500/12 text-amber-100 ring-amber-400/35'
          : 'bg-white/6 text-white/90 ring-white/18';

  const dayLabel = `Day ${drawSchedule.currentDayNumber.toLocaleString()} of ${RUN_TOTAL_DAYS.toLocaleString()}`;

  // ✅ Day label should read 7/7000 (not 6/7000)
  const drawStatusLabel = `${drawSchedule.currentDayNumber.toLocaleString()}/${RUN_TOTAL_DAYS.toLocaleString()}`;

  // ✅ Progress tracks current day position
  const dayProgress = Math.max(0, Math.min(1, drawSchedule.currentDayNumber / RUN_TOTAL_DAYS));

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

      {/* Scene (desktop-safe: no 3D flip; fixes overlap/blank rendering) */}
      <section className="mx-auto max-w-[1120px]" aria-label="Final Day story">
        {era === '2045' ? (
          <ArchivePanel meta={archiveMeta} />
        ) : (
          <NowPanel
            meta={nowMeta}
            setEra={setEra}
            drawSchedule={{
              archiveDateLine: drawSchedule.archiveDateLine,
              currentDayNumber: drawSchedule.currentDayNumber,
              completedDraws: drawSchedule.completedDraws,
              daysRemaining: drawSchedule.daysRemaining,
            }}
            dayLabel={dayLabel}
            drawStatusLabel={drawStatusLabel}
            dayProgress={dayProgress}
            computedStatus={computedStatus}
            statusTone={statusTone}
            usingFallback={usingFallback}
            cutoffLabel={cutoffLabel}
            closesAtLabel={closesAtLabel}
            cd={cd}
            live={live}
            liveErr={liveErr}
            bgNowCard={bgNowCard}
          />
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
