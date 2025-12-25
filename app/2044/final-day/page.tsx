// app/2044/final-day/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Printer, Repeat2, Timer, Radio, ShieldCheck } from 'lucide-react';

type Era = '2044' | 'now';

const STORAGE_KEY = 'xpot_final_day_era_v3';
const LIVE_POLL_MS = 5000;

type LiveDraw = {
  jackpotXpot: number;
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

export default function FinalDayPage() {
  const [era, setEra] = useState<Era>('2044');

  // Live draw state for "Now"
  const [live, setLive] = useState<LiveDraw | null>(null);
  const [liveErr, setLiveErr] = useState<string | null>(null);
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

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
        dateLine: 'Saturday, 12 October 2044',
        section: 'Culture / Protocols',
        headline: "XPOT's Final Day",
        deck:
          'It did not collapse. It did not vanish. It did not betray anyone. It ended on schedule - after 19.18 years of daily continuity, and the world treated the last countdown like a national holiday.',
        byline: 'By The XPOT Desk',
      };
    }

    return {
      badge: 'PRESENT DAY',
      dateLine: 'Today',
      section: 'Live',
      headline: 'The Final Draw is Approaching',
      deck:
        'This is the live countdown. Flip to 2044 to read the archived edition - the one people shared, printed, and kept when the run finally ended.',
      byline: 'XPOT',
    };
  }, [era]);

  const onFlip = useCallback(() => {
    setEra(e => (e === '2044' ? 'now' : '2044'));
  }, []);

  const onPrint = useCallback(() => {
    // Always print the archive side
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
        setLiveErr(null);
        const res = await fetch('/api/draw/live', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP_${res.status}`);
        const json = await res.json();

        if (!alive) return;

        if (!json?.draw?.closesAt) {
          setLive(null);
          return;
        }

        const d: LiveDraw = {
          jackpotXpot: Number(json.draw.jackpotXpot ?? 1_000_000),
          closesAt: String(json.draw.closesAt),
          status: (json.draw.status as LiveDraw['status']) ?? 'OPEN',
        };

        setLive(d);
      } catch {
        if (!alive) return;
        setLiveErr('Live draw unavailable');
        setLive(null);
      }
    }

    pull();
    interval = window.setInterval(pull, LIVE_POLL_MS);

    return () => {
      alive = false;
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

  const closesIsoZ = useMemo(() => {
    if (!live?.closesAt) return null;
    const ms = Date.parse(live.closesAt);
    if (!Number.isFinite(ms)) return null;
    return new Date(ms).toISOString(); // ISO 8601 UTC format (YYYY-MM-DDTHH:MM:SSZ)
  }, [live?.closesAt]);

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
            'relative [transform-style:preserve-3d] motion-safe:transition-transform motion-safe:duration-[800ms]',
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
                <div className="justify-self-end font-black">€3.00</div>
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
                    t started like nothing.
                  </p>
                  <p className="mt-3 text-[15px] leading-[1.62]">
                    A small ritual, a daily pull, a quiet promise: the clock would reach zero, and a winner would be
                    chosen.
                  </p>
                  <p className="mt-3 text-[15px] leading-[1.62]">Then days became months. Months became years.</p>

                  <div className="mt-4 font-sans text-[12px] font-black uppercase tracking-[0.16em] text-[rgba(18,16,12,0.72)]">
                    Continuity
                  </div>
                  <p className="mt-2 text-[15px] leading-[1.62]">
                    For <strong>19.18 years</strong>, XPOT arrived on time. Through bubbles and boredom. Through wars,
                    weddings, hospital corridors and long, ordinary Tuesdays. Through everything.
                  </p>
                  <p className="mt-3 text-[15px] leading-[1.62]">
                    People did not just play it. They lived beside it. A shared clock for strangers who never met, but
                    always counted down together.
                  </p>
                  <p className="mt-3 text-[15px] leading-[1.62]">
                    Parents taught it to kids the way they taught them to cross roads. Grandparents checked it like they
                    checked the weather.
                  </p>

                  <blockquote className="mt-4 border-l-4 border-[rgba(18,16,12,0.35)] bg-[rgba(18,16,12,0.03)] px-3 py-3 italic">
                    “It did not promise miracles. It promised a draw - daily - and it kept that promise until the last
                    breath.”
                    <span className="mt-2 block font-sans text-[12px] font-black uppercase tracking-[0.10em] text-[rgba(18,16,12,0.65)] not-italic">
                      - Archive commentary, 2044
                    </span>
                  </blockquote>
                </div>

                {/* Column B */}
                <div>
                  <div className="font-sans text-[12px] font-black uppercase tracking-[0.16em] text-[rgba(18,16,12,0.72)]">
                    The final draw
                  </div>
                  <p className="mt-2 text-[15px] leading-[1.62]">Everyone knows it is the last one.</p>
                  <p className="mt-3 text-[15px] leading-[1.62]">
                    There are streams in kitchens and bars. Phones held up in crowded trains. People watching at work,
                    pretending not to.
                  </p>
                  <p className="mt-3 text-[15px] leading-[1.62]">
                    Not because the jackpot got bigger. Because the ending made every previous day mean something.
                  </p>

                  <div className="mt-4 rounded-2xl border border-[rgba(18,16,12,0.22)] bg-white/35 p-3">
                    <div className="font-sans text-[12px] font-black uppercase tracking-[0.12em]">The Final Draw</div>
                    <div className="mt-3 space-y-2 font-sans text-[13px]">
                      <div className="flex items-center justify-between border-t border-dashed border-black/15 pt-2">
                        <span>Jackpot</span>
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
                    No last-minute twist. No forced sequel. No fireworks to distract from the truth.
                  </p>
                  <p className="mt-3 text-[15px] leading-[1.62]">
                    The countdown enters its final minute and something spreads across the world - the same silence that
                    falls in a stadium before a penalty.
                  </p>
                  <p className="mt-3 text-[15px] leading-[1.62]">
                    When it hits zero, a winner is chosen. Someone ordinary. Someone random. Someone whose life will be
                    divided into before and after - like always.
                  </p>

                  <div className="my-4 h-px bg-[linear-gradient(90deg,transparent,rgba(18,16,12,0.35),transparent)]" />
                  <p className="text-[14px] leading-[1.62] text-[rgba(18,16,12,0.78)]">
                    What ends today is not only a product. It is a shared ritual - a daily habit that outlived cycles,
                    headlines and cynicism.
                  </p>
                </div>

                {/* Column C (wide) */}
                <div className="max-[980px]:col-span-2 max-[860px]:col-span-1">
                  <div className="font-sans text-[12px] font-black uppercase tracking-[0.16em] text-[rgba(18,16,12,0.72)]">
                    And then something rare happens
                  </div>
                  <p className="mt-2 text-[15px] leading-[1.62]">
                    Nothing breaks. Nothing explodes. Nothing disappears behind an apology post.
                  </p>
                  <p className="mt-3 text-[15px] leading-[1.62]">The system simply stops issuing draws.</p>
                  <p className="mt-3 text-[15px] leading-[1.62]">
                    The site stays online. The history stays visible. Every winner, every day, perfectly accounted for.
                    The proof does not fade.
                  </p>

                  <div className="mt-4 rounded-2xl border border-[rgba(18,16,12,0.22)] bg-white/40 p-4">
                    <div className="font-sans text-[11px] font-black uppercase tracking-[0.18em] text-[rgba(18,16,12,0.70)]">
                      A quiet line appears
                    </div>
                    <div className="mt-2 text-[18px] font-black tracking-[-0.01em]">“XPOT completed its mission.”</div>
                    <div className="mt-2 font-sans text-[13px] leading-[1.55] opacity-85">
                      No ads. No upsell. No “v2 coming soon”. Just the rarest thing in technology: an ending that tells
                      the truth.
                    </div>
                  </div>

                  <div className="mt-5 font-sans text-[12px] font-black uppercase tracking-[0.16em] text-[rgba(18,16,12,0.72)]">
                    The architect
                  </div>
                  <p className="mt-2 text-[15px] leading-[1.62]">
                    The person who built it is not remembered for being loud. The archive names them an architect - of
                    the longest fair game ever sustained.
                  </p>
                  <p className="mt-3 text-[15px] leading-[1.62]">
                    The rules did not move. The supply did not inflate to survive. The promise did not become “forever”
                    just to avoid saying goodbye.
                  </p>
                  <p className="mt-3 text-[15px] leading-[1.62]">
                    XPOT chose a rarer thing: a finite promise, honored all the way to the last second.
                  </p>

                  <div className="mt-5 font-sans text-[12px] font-black uppercase tracking-[0.16em] text-[rgba(18,16,12,0.72)]">
                    Legacy
                  </div>
                  <p className="mt-2 text-[15px] leading-[1.62]">
                    XPOT becomes studied - in economics, game theory and psychology - not as the biggest jackpot, but as
                    proof that trust can be engineered and kept.
                  </p>
                  <ul className="mt-3 list-disc pl-5 text-[15px] leading-[1.6]">
                    <li>The game that never cheated</li>
                    <li>The system that never inflated itself to survive</li>
                    <li>The ending that made the beginning sacred</li>
                  </ul>

                  <p className="mt-4 font-sans text-[15px] font-black tracking-[-0.01em]">
                    Most projects die because they do not know how to end. XPOT ended because it said it would.
                  </p>
                </div>
              </div>
            </div>

            <footer className="mt-5 flex items-center justify-center gap-3 font-sans text-[11px] font-black uppercase tracking-[0.16em] opacity-75 print:opacity-100">
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
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em]">
                <Radio size={14} className="opacity-90" />
                <span>{meta.badge}</span>
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
                  Enter today&apos;s XPOT
                </Link>
              </div>
            </header>

            {/* Live countdown */}
            <section className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.40)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] opacity-85">
                    <Timer size={14} />
                    <span>Live countdown</span>
                  </div>

                  <span
                    className={['inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black ring-1', statusTone].join(
                      ' ',
                    )}
                  >
                    {live?.status ?? (liveErr ? 'OFFLINE' : 'LOADING')}
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
                      Jackpot:{' '}
                      <span className="font-black">{(live?.jackpotXpot ?? 1_000_000).toLocaleString()} XPOT</span>
                    </span>
                  </div>

                  <div className="font-black">
                    {closesIsoZ ? `Closes at (UTC): ${closesIsoZ}` : liveErr ?? 'Fetching live draw...'}
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
                  This page is a live clock and a living story. It lets anyone feel the run - the tension, the cadence,
                  the moment the timer reaches zero.
                </p>

                <div className="mt-4 text-[12px] font-black uppercase tracking-[0.16em] opacity-80">How it works</div>
                <ul className="mt-2 list-disc pl-5 text-[14px] leading-[1.65] opacity-90">
                  <li>Countdown is pulled from the live draw endpoint</li>
                  <li>Winners are provable on-chain</li>
                  <li>Archive edition is designed for printing and sharing</li>
                </ul>

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
