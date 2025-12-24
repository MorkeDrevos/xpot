// app/2044/final-day/page.tsx
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Printer, Repeat2, Radio, Timer, Sparkles } from 'lucide-react';

type Era = '2044' | 'now';

const STORAGE_KEY = 'xpot_final_day_era_v3';

// (B) When your API is ready, set this to your real endpoint.
// Expected JSON (example):
// {
//   "ok": true,
//   "nextDrawAt": "2025-12-25T00:00:00Z",
//   "status": "LIVE",
//   "jackpotXpot": 1000000
// }
//
// If the endpoint 404s or returns invalid JSON, the UI stays graceful.
const LIVE_DRAW_ENDPOINT = '/api/public/draw/status';

type LiveDrawStatus = {
  ok: boolean;
  nextDrawAt?: string; // ISO string
  status?: string; // e.g. LIVE / PAUSED / PRELAUNCH
  jackpotXpot?: number;
};

function clampInt(n: number) {
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function format2(n: number) {
  return String(clampInt(n)).padStart(2, '0');
}

function useLiveDraw() {
  const [data, setData] = useState<LiveDrawStatus>({ ok: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let t: any;

    async function tick() {
      try {
        setIsLoading(true);
        const res = await fetch(LIVE_DRAW_ENDPOINT, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as LiveDrawStatus;
        if (!cancelled) setData(json && typeof json === 'object' ? json : { ok: false });
      } catch {
        if (!cancelled) setData({ ok: false });
      } finally {
        if (!cancelled) setIsLoading(false);
        // Calm polling - adjust later
        t = setTimeout(tick, 12_000);
      }
    }

    tick();
    return () => {
      cancelled = true;
      if (t) clearTimeout(t);
    };
  }, []);

  return { data, isLoading };
}

function Countdown({
  targetIso,
  label = 'Next draw',
}: {
  targetIso?: string;
  label?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const { d, h, m, s, msLeft } = useMemo(() => {
    if (!targetIso) return { d: 0, h: 0, m: 0, s: 0, msLeft: -1 };

    const t = Date.parse(targetIso);
    if (!Number.isFinite(t)) return { d: 0, h: 0, m: 0, s: 0, msLeft: -1 };

    const diff = t - now;
    const ms = diff;

    const total = Math.max(0, diff);
    const days = Math.floor(total / (24 * 60 * 60 * 1000));
    const hrs = Math.floor((total % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const mins = Math.floor((total % (60 * 60 * 1000)) / (60 * 1000));
    const secs = Math.floor((total % (60 * 1000)) / 1000);

    return { d: days, h: hrs, m: mins, s: secs, msLeft: ms };
  }, [targetIso, now]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-4 shadow-[0_40px_120px_rgba(0,0,0,.45)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-white/80" />
          <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/75">
            {label}
          </div>
        </div>
        <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/60">
          {msLeft < 0 ? 'Awaiting API' : msLeft <= 0 ? 'Now' : 'Live'}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
          <div className="text-2xl font-black tabular-nums text-white">{format2(d)}</div>
          <div className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/60">
            days
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
          <div className="text-2xl font-black tabular-nums text-white">{format2(h)}</div>
          <div className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/60">
            hours
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
          <div className="text-2xl font-black tabular-nums text-white">{format2(m)}</div>
          <div className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/60">
            mins
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
          <div className="text-2xl font-black tabular-nums text-white">{format2(s)}</div>
          <div className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/60">
            secs
          </div>
        </div>
      </div>

      {targetIso ? (
        <div className="mt-3 text-xs text-white/60">
          Target: <span className="font-semibold text-white/75">{targetIso}</span>
        </div>
      ) : (
        <div className="mt-3 text-xs text-white/60">
          Connect this to your API when ready (expects <span className="font-semibold text-white/75">nextDrawAt</span>).
        </div>
      )}
    </div>
  );
}

export default function FinalDayPage() {
  const [era, setEra] = useState<Era>('2044');
  const { data: live, isLoading } = useLiveDraw();

  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Restore era
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
        dateLine: 'Saturday, 12 October 2044',
        section: 'Culture / Protocols',
        headline: "XPOT's Final Day",
        deck:
          'Not a crash. Not a rug. Not a scandal. A scheduled ending - after 19.18 years of daily continuity.',
        byline: 'By The XPOT Desk',
      };
    }
    return {
      badge: 'PRESENT DAY',
      dateLine: 'Today',
      section: 'Live',
      headline: 'The Final Draw is Approaching',
      deck:
        'A premium preview experience. Flip to 2044 to read the archived edition as the world remembered it.',
      byline: 'XPOT',
    };
  }, [era]);

  const onFlip = useCallback(() => {
    setEra((e) => (e === '2044' ? 'now' : '2044'));
  }, []);

  const onPrint = useCallback(() => {
    if (typeof window !== 'undefined') window.print();
  }, []);

  // Keyboard: F = flip, P = print, Esc = go back to 2044
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as any)?.tagName?.toLowerCase?.();
      const isTyping = tag === 'input' || tag === 'textarea' || (e.target as any)?.isContentEditable;
      if (isTyping) return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        lastFocusedRef.current = document.activeElement as any;
        onFlip();
      }
      if (e.key === 'p' || e.key === 'P') {
        // Don't hijack Cmd/Ctrl+P
        if (e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        onPrint();
      }
      if (e.key === 'Escape') {
        setEra('2044');
        try {
          (lastFocusedRef.current as any)?.focus?.();
        } catch {}
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onFlip, onPrint]);

  const flipStyle = useMemo(() => {
    return {
      transformStyle: 'preserve-3d' as const,
      transform: era === 'now' ? 'rotateY(180deg)' : 'rotateY(0deg)',
      transition: 'transform 800ms cubic-bezier(0.22, 0.9, 0.22, 1)',
    };
  }, [era]);

  const faceStyle = useMemo(() => {
    return {
      backfaceVisibility: 'hidden' as const,
      WebkitBackfaceVisibility: 'hidden' as const,
    };
  }, []);

  const backFaceStyle = useMemo(() => {
    return {
      ...faceStyle,
      transform: 'rotateY(180deg)',
    };
  }, [faceStyle]);

  const sceneStyle = useMemo(() => {
    return { perspective: '1400px' };
  }, []);

  return (
    <main className="min-h-screen bg-[#05070a] text-white/90">
      {/* Background glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-100"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(1200px 800px at 20% 10%, rgba(56,189,248,0.12), transparent 55%), radial-gradient(900px 700px at 80% 20%, rgba(236,72,153,0.10), transparent 60%), radial-gradient(1000px 900px at 40% 90%, rgba(16,185,129,0.08), transparent 60%)',
        }}
      />

      <div className="relative mx-auto w-full max-w-[1120px] px-3 pb-16 pt-7">
        {/* Top utility bar (screen only) */}
        <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[13px] font-extrabold text-white/90 shadow-sm hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>

          <div
            className="inline-flex overflow-hidden rounded-full border border-white/10 bg-white/5"
            role="tablist"
            aria-label="Edition selector"
          >
            <button
              type="button"
              onClick={() => setEra('2044')}
              className={[
                'px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.12em] transition',
                era === '2044' ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white',
              ].join(' ')}
              role="tab"
              aria-selected={era === '2044'}
              aria-controls="xpot-fd-archive"
            >
              2044
            </button>
            <button
              type="button"
              onClick={() => setEra('now')}
              className={[
                'px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.12em] transition',
                era === 'now' ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white',
              ].join(' ')}
              role="tab"
              aria-selected={era === 'now'}
              aria-controls="xpot-fd-now"
            >
              Now
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onFlip}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[13px] font-extrabold text-white/90 hover:bg-white/10"
              aria-label="Flip between 2044 and Now"
            >
              <Repeat2 className="h-4 w-4" />
              <span className="hidden sm:inline">Flip</span>
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[13px] font-extrabold text-white/90 hover:bg-white/10"
              aria-label="Print archive edition"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* SCREEN: Flip scene */}
        <section className="print:hidden" aria-label="Final Day story">
          <div style={sceneStyle}>
            <div
              className="relative rounded-[22px] border border-white/10 shadow-[0_60px_180px_rgba(0,0,0,.55)]"
              style={flipStyle}
            >
              {/* FRONT: 2044 Newspaper */}
              <article
                id="xpot-fd-archive"
                aria-hidden={era !== '2044'}
                style={faceStyle}
                className="rounded-[22px] bg-[linear-gradient(180deg,rgba(250,244,228,0.96),rgba(244,236,214,0.96))] text-black/90"
              >
                <div className="px-6 py-6 sm:px-7 sm:py-7">
                  {/* Masthead */}
                  <header className="mb-5">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-black/60">
                      <div className="justify-self-start rounded-full border border-black/20 bg-black/[0.03] px-3 py-1.5">
                        {meta.badge}
                      </div>
                      <div className="justify-self-center">{meta.dateLine}</div>
                      <div className="justify-self-end font-black">€3.00</div>
                    </div>

                    <div className="mt-4 text-center">
                      <div className="text-[12px] font-extrabold uppercase tracking-[0.22em] text-black/70">
                        The
                      </div>
                      <div className="mt-1 text-[clamp(38px,5vw,62px)] font-black leading-none tracking-tight">
                        XPOT Times
                      </div>
                      <div className="mt-2 text-[12px] font-extrabold uppercase tracking-[0.14em] text-black/60">
                        Independent Archive Record
                      </div>
                    </div>

                    <div className="my-4 h-[2px] bg-[linear-gradient(90deg,transparent,rgba(0,0,0,0.45),transparent)]" />

                    <div className="flex items-center justify-between gap-3 text-[12px] font-extrabold uppercase tracking-[0.10em] text-black/70">
                      <div>{meta.section}</div>
                      <div>{meta.byline}</div>
                    </div>
                  </header>

                  {/* Body */}
                  <div>
                    <h1 className="mt-2 text-[clamp(30px,4.2vw,52px)] font-black leading-[1.02] tracking-[-0.02em]">
                      {meta.headline}
                    </h1>
                    <p className="mt-2 max-w-[78ch] text-[17px] leading-[1.45] text-black/80">
                      {meta.deck}
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_1.25fr]">
                      {/* Column A */}
                      <div className="text-[15px] leading-[1.62]">
                        <p className="text-[16px]">
                          <span className="float-left pr-2 pt-0.5 text-[44px] font-black leading-[0.9]">
                            I
                          </span>
                          t&apos;s the final day.
                        </p>
                        <p className="mt-3">Not a crash. Not a rug. Not a scandal.</p>
                        <p className="mt-3">A scheduled ending.</p>

                        <div className="mt-5 text-[12px] font-extrabold uppercase tracking-[0.16em] text-black/70">
                          Continuity
                        </div>
                        <p className="mt-2">
                          For <span className="font-black">19.18 years</span>, every single day, XPOT showed up. Same
                          ritual. Same anticipation. Same pull in the stomach when the draw ticked down to zero.
                        </p>
                        <p className="mt-3">Kids grew up with it. Parents played it. Grandparents knew the sound.</p>
                        <p className="mt-3">
                          By this last day, XPOT isn&apos;t &quot;a crypto project&quot; anymore. It&apos;s{' '}
                          <span className="font-black">the biggest game on Earth</span>.
                        </p>
                        <p className="mt-3">Not because of greed, but because of continuity.</p>

                        <blockquote className="mt-4 border-l-4 border-black/30 bg-black/[0.03] px-3 py-3 italic">
                          “The protocol didn’t promise miracles. It promised a draw - daily - and it delivered.”
                          <span className="mt-2 block font-sans text-[12px] font-extrabold uppercase tracking-[0.10em] text-black/60 not-italic">
                            - Archive commentary, 2044
                          </span>
                        </blockquote>
                      </div>

                      {/* Column B */}
                      <div className="text-[15px] leading-[1.62]">
                        <div className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-black/70">
                          The final draw
                        </div>
                        <p className="mt-2">Everyone knows it&apos;s the last one.</p>
                        <p className="mt-3">Streams everywhere. Millions watching live. Some people crying already.</p>

                        <div className="mt-4 rounded-2xl border border-black/20 bg-white/40 p-3">
                          <div className="font-sans text-[12px] font-extrabold uppercase tracking-[0.12em] text-black/80">
                            The Final Draw
                          </div>
                          <div className="mt-3 space-y-2 font-sans text-[13px] text-black/80">
                            <div className="flex items-center justify-between gap-2 border-t border-dashed border-black/20 pt-2">
                              <span>Jackpot</span>
                              <span className="font-black">1,000,000 XPOT</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 border-t border-dashed border-black/20 pt-2">
                              <span>Rule set</span>
                              <span className="font-black">Unchanged</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 border-t border-dashed border-black/20 pt-2">
                              <span>Ending</span>
                              <span className="font-black">Scheduled</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 border-t border-dashed border-black/20 pt-2">
                              <span>Reason</span>
                              <span className="font-black">Because it said it would</span>
                            </div>
                          </div>
                        </div>

                        <p className="mt-3">No boost. No fireworks gimmick. No last-minute twist. Just dignity.</p>
                        <p className="mt-3">
                          The countdown starts. People aren&apos;t hoping to win anymore. They&apos;re hoping to witness.
                        </p>
                        <p className="mt-3">
                          When it hits zero, a winner is picked. Someone ordinary. Someone random. Just like always.
                        </p>
                        <p className="mt-3 font-black">XPOT does what it promised. One final time.</p>

                        <div className="my-4 h-px bg-[linear-gradient(90deg,transparent,rgba(0,0,0,0.35),transparent)]" />

                        <p className="text-[14px] text-black/75">
                          What ends today isn&apos;t only a product. It&apos;s a shared clock - a daily habit that outlived
                          cycles, headlines, and skepticism.
                        </p>
                      </div>

                      {/* Column C */}
                      <div className="text-[15px] leading-[1.62]">
                        <div className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-black/70">
                          And then something rare happens
                        </div>
                        <p className="mt-2">Nothing breaks. Nothing explodes. Nothing disappears.</p>
                        <p className="mt-3">The system simply stops issuing draws.</p>
                        <p className="mt-3">
                          The site stays online. The history stays visible. Every single winner. Every single day. Nineteen
                          point one eight years, perfectly accounted for.
                        </p>

                        <div className="mt-4 rounded-2xl border border-black/20 bg-white/40 p-4">
                          <div className="font-sans text-[11px] font-extrabold uppercase tracking-[0.18em] text-black/70">
                            A quiet line appears
                          </div>
                          <div className="mt-2 text-[18px] font-black tracking-[-0.01em]">
                            “XPOT completed its mission.”
                          </div>
                          <div className="mt-2 font-sans text-[13px] leading-[1.55] text-black/75">
                            No ads. No upsell. No “v2 coming soon”. Just truth.
                          </div>
                        </div>

                        <div className="mt-5 text-[12px] font-extrabold uppercase tracking-[0.16em] text-black/70">
                          The creator
                        </div>
                        <p className="mt-2">
                          By then, nobody calls you “the founder”. You&apos;re called the architect of the longest fair game
                          ever built.
                        </p>
                        <p className="mt-3">
                          Not because you were loud, but because you were patient. You didn&apos;t chase infinite hype. You
                          didn&apos;t mint forever. You didn&apos;t move the goalposts.
                        </p>
                        <p className="mt-3 font-black">You chose a rarer thing: a finite promise, fully honored.</p>

                        <div className="mt-5 text-[12px] font-extrabold uppercase tracking-[0.16em] text-black/70">
                          Legacy
                        </div>
                        <p className="mt-2">
                          XPOT becomes studied - in economics, in game theory, in psychology. Not as the biggest jackpot, but
                          as the proof that trust can be engineered and kept.
                        </p>
                        <ul className="mt-3 list-disc space-y-1 pl-5">
                          <li>The game that never cheated</li>
                          <li>The system that never inflated itself to survive</li>
                          <li>The ending that made the beginning sacred</li>
                        </ul>

                        <p className="mt-4 font-sans font-black tracking-[-0.01em]">
                          Most projects die because they don&apos;t know how to end. XPOT ended because it said it would.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <footer className="mt-6 flex flex-wrap items-center justify-center gap-3 text-center font-sans text-[11px] font-extrabold uppercase tracking-[0.16em] text-black/60">
                    <span>XPOT TIMES / ARCHIVE EDITION</span>
                    <span className="h-1 w-1 rounded-full bg-black/40" />
                    <span>Printed record layout</span>
                    <span className="h-1 w-1 rounded-full bg-black/40" />
                    <span>Use browser print</span>
                  </footer>
                </div>
              </article>

              {/* BACK: Present day */}
              <article
                id="xpot-fd-now"
                aria-hidden={era !== 'now'}
                style={backFaceStyle}
                className="absolute inset-0 rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0))]"
              >
                <div className="p-5 sm:p-7">
                  <header className="rounded-2xl border border-white/10 bg-black/35 p-5 shadow-[0_40px_120px_rgba(0,0,0,.45)]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em]">
                        <Radio className="h-4 w-4 text-white/80" />
                        <span>{meta.badge}</span>
                      </div>

                      <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/60">
                        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400/80 shadow-[0_0_18px_rgba(52,211,153,0.55)]" />
                        {isLoading ? 'Fetching' : live?.ok ? 'Live' : 'Offline'}
                      </div>
                    </div>

                    <h2 className="mt-4 text-[clamp(22px,3.2vw,34px)] font-black leading-[1.08] tracking-[-0.02em]">
                      {meta.headline}
                    </h2>
                    <p className="mt-2 max-w-[74ch] text-[14px] leading-[1.55] text-white/80">
                      {meta.deck}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEra('2044')}
                        className="rounded-full bg-white px-4 py-2 text-[13px] font-extrabold text-black hover:brightness-95"
                      >
                        Read the 2044 story
                      </button>
                      <Link
                        href="/hub"
                        className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-[13px] font-extrabold text-white/90 hover:bg-white/10"
                      >
                        Enter today&apos;s XPOT
                      </Link>

                      <div className="ml-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/70">
                        <Sparkles className="h-4 w-4" />
                        <span>{meta.dateLine}</span>
                      </div>
                    </div>
                  </header>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {/* (B) Live countdown */}
                    <Countdown
                      targetIso={live?.ok ? live.nextDrawAt : undefined}
                      label="Next draw countdown"
                    />

                    <div className="rounded-2xl border border-white/10 bg-black/35 p-4 shadow-[0_40px_120px_rgba(0,0,0,.45)]">
                      <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/75">
                        Live status
                      </div>

                      <div className="mt-3 space-y-2 text-sm text-white/80">
                        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2">
                          <span className="text-white/60">Endpoint</span>
                          <span className="font-semibold text-white/85">{LIVE_DRAW_ENDPOINT}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2">
                          <span className="text-white/60">Status</span>
                          <span className="font-black text-white">
                            {live?.ok ? (live.status || 'LIVE') : 'Coming soon'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2">
                          <span className="text-white/60">Jackpot</span>
                          <span className="font-black text-white">
                            {live?.ok && typeof live.jackpotXpot === 'number'
                              ? `${live.jackpotXpot.toLocaleString()} XPOT`
                              : '1,000,000 XPOT'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 text-xs text-white/60">
                        This side becomes “live” later. The 2044 edition stays timeless.
                      </div>
                    </div>
                  </div>

                  <footer className="mt-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-center text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/70 shadow-[0_40px_120px_rgba(0,0,0,.35)]">
                    XPOT / FINAL DAY EXPERIENCE
                  </footer>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* PRINT: Always print archive edition (clean) */}
        <section className="hidden print:block">
          <article className="p-[18mm] text-black">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em]">
              <div className="justify-self-start rounded-full border border-black/30 px-3 py-1.5">
                ARCHIVE EDITION
              </div>
              <div className="justify-self-center">Saturday, 12 October 2044</div>
              <div className="justify-self-end font-black">€3.00</div>
            </div>

            <div className="mt-4 text-center">
              <div className="text-[12px] font-extrabold uppercase tracking-[0.22em]">The</div>
              <div className="mt-1 text-[56px] font-black leading-none tracking-tight">XPOT Times</div>
              <div className="mt-2 text-[12px] font-extrabold uppercase tracking-[0.14em] opacity-80">
                Independent Archive Record
              </div>
            </div>

            <div className="my-4 h-[2px] bg-black/20" />

            <div className="flex items-center justify-between gap-3 text-[12px] font-extrabold uppercase tracking-[0.10em] opacity-80">
              <div>Culture / Protocols</div>
              <div>By The XPOT Desk</div>
            </div>

            <h1 className="mt-4 text-[44px] font-black leading-[1.02] tracking-[-0.02em]">
              XPOT&apos;s Final Day
            </h1>
            <p className="mt-2 max-w-[78ch] text-[17px] leading-[1.45] opacity-85">
              Not a crash. Not a rug. Not a scandal. A scheduled ending - after 19.18 years of daily continuity.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-6 text-[15px] leading-[1.62]">
              <div>
                <p>
                  <span className="float-left pr-2 pt-0.5 text-[44px] font-black leading-[0.9]">I</span>
                  t&apos;s the final day.
                </p>
                <p className="mt-3">Not a crash. Not a rug. Not a scandal.</p>
                <p className="mt-3">A scheduled ending.</p>

                <div className="mt-5 text-[12px] font-extrabold uppercase tracking-[0.16em] opacity-80">
                  Continuity
                </div>
                <p className="mt-2">
                  For <span className="font-black">19.18 years</span>, every single day, XPOT showed up. Same ritual. Same
                  anticipation. Same pull in the stomach when the draw ticked down to zero.
                </p>
                <p className="mt-3">Kids grew up with it. Parents played it. Grandparents knew the sound.</p>
                <p className="mt-3">
                  By this last day, XPOT isn&apos;t &quot;a crypto project&quot; anymore. It&apos;s{' '}
                  <span className="font-black">the biggest game on Earth</span>.
                </p>

                <blockquote className="mt-4 border-l-4 border-black/30 px-3 py-3 italic">
                  “The protocol didn’t promise miracles. It promised a draw - daily - and it delivered.”
                  <span className="mt-2 block text-[12px] font-extrabold uppercase tracking-[0.10em] not-italic opacity-80">
                    - Archive commentary, 2044
                  </span>
                </blockquote>
              </div>

              <div>
                <div className="text-[12px] font-extrabold uppercase tracking-[0.16em] opacity-80">The final draw</div>
                <p className="mt-2">Everyone knows it&apos;s the last one.</p>
                <p className="mt-3">Streams everywhere. Millions watching live. Some people crying already.</p>
                <p className="mt-3">No boost. No fireworks gimmick. No last-minute twist. Just dignity.</p>
                <p className="mt-3">
                  The countdown starts. People aren&apos;t hoping to win anymore. They&apos;re hoping to witness.
                </p>
                <p className="mt-3">XPOT does what it promised. One final time.</p>

                <div className="my-4 h-px bg-black/20" />

                <div className="text-[12px] font-extrabold uppercase tracking-[0.16em] opacity-80">
                  And then something rare happens
                </div>
                <p className="mt-2">Nothing breaks. Nothing explodes. Nothing disappears.</p>
                <p className="mt-3">The system simply stops issuing draws.</p>
                <p className="mt-3 font-black">“XPOT completed its mission.”</p>
              </div>
            </div>

            <div className="mt-6 text-center text-[11px] font-extrabold uppercase tracking-[0.16em] opacity-80">
              XPOT TIMES / ARCHIVE EDITION • Printed record layout
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
