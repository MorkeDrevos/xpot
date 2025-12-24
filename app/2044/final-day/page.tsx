// app/2044/final-day/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Printer, Repeat2 } from 'lucide-react';

type Era = '2044' | 'now';

const STORAGE_KEY = 'xpot_final_day_era_v3';

function isEra(v: any): v is Era {
  return v === '2044' || v === 'now';
}

export default function FinalDayPage() {
  const [era, setEra] = useState<Era>('2044');
  const eraRef = useRef<Era>('2044');
  const printingRef = useRef(false);

  useEffect(() => {
    eraRef.current = era;
  }, [era]);

  // Restore
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (isEra(v)) setEra(v);
    } catch {}
  }, []);

  // Persist
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

  // Print always prints the archive side
  const onPrint = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (printingRef.current) return;

    printingRef.current = true;
    const prev = eraRef.current;

    // Force archive for printing
    if (prev !== '2044') setEra('2044');

    // Allow render to commit, then print
    window.setTimeout(() => {
      try {
        window.print();
      } finally {
        // Restore after print (small delay helps Safari/Chrome)
        window.setTimeout(() => {
          printingRef.current = false;
          if (prev !== '2044') setEra(prev);
        }, 250);
      }
    }, 120);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const k = e.key.toLowerCase();
      if (k === 'f') {
        e.preventDefault();
        onFlip();
      } else if (k === 'p') {
        e.preventDefault();
        onPrint();
      } else if (k === '1') {
        e.preventDefault();
        setEra('2044');
      } else if (k === '2') {
        e.preventDefault();
        setEra('now');
      } else if (k === 'escape') {
        // do not preventDefault - keep browser behaviors
        window.location.href = '/';
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onFlip, onPrint]);

  return (
    <main className="min-h-screen bg-[#05070a] text-white/90">
      {/* XPOT premium atmosphere */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_800px_at_20%_10%,rgba(56,189,248,0.14),transparent_55%),radial-gradient(900px_700px_at_80%_20%,rgba(236,72,153,0.12),transparent_60%),radial-gradient(1000px_900px_at_40%_90%,rgba(16,185,129,0.10),transparent_60%)]" />
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/55 to-transparent" />
      </div>

      {/* Top controls */}
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 pt-4 sm:pt-6 print:hidden">
        <div className="sticky top-3 z-20 rounded-full border border-white/10 bg-black/30 backdrop-blur-xl shadow-[0_25px_90px_rgba(0,0,0,0.55)]">
          <div className="flex items-center justify-between gap-2 px-2 py-2 sm:px-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] font-extrabold text-white/90 hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <ChevronLeft size={18} />
              <span>Back</span>
            </Link>

            <div className="flex items-center gap-2">
              <div
                className="inline-flex overflow-hidden rounded-full border border-white/10 bg-white/[0.04]"
                role="tablist"
                aria-label="Edition selector"
              >
                <button
                  type="button"
                  className={[
                    'px-4 py-2 text-[11px] font-extrabold tracking-[0.14em] uppercase transition',
                    era === '2044'
                      ? 'bg-white/[0.10] text-white'
                      : 'text-white/70 hover:text-white/90',
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
                    'px-4 py-2 text-[11px] font-extrabold tracking-[0.14em] uppercase transition',
                    era === 'now'
                      ? 'bg-white/[0.10] text-white'
                      : 'text-white/70 hover:text-white/90',
                  ].join(' ')}
                  onClick={() => setEra('now')}
                  role="tab"
                  aria-selected={era === 'now'}
                  aria-controls="xpot-fd-now"
                >
                  Now
                </button>
              </div>

              <button
                type="button"
                onClick={onFlip}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] font-extrabold text-white/90 hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label="Flip between eras (F)"
                title="Flip (F)"
              >
                <Repeat2 size={16} />
                <span className="hidden sm:inline">Flip</span>
              </button>

              <button
                type="button"
                onClick={onPrint}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] font-extrabold text-white/90 hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label="Print archive (P)"
                title="Print (P)"
              >
                <Printer size={16} />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>

          <div className="px-4 pb-2 -mt-1 text-[11px] font-semibold text-white/50 hidden sm:block">
            Shortcuts: <span className="text-white/70">F</span> flip,{' '}
            <span className="text-white/70">P</span> print,{' '}
            <span className="text-white/70">1</span> 2044,{' '}
            <span className="text-white/70">2</span> now,{' '}
            <span className="text-white/70">Esc</span> back
          </div>
        </div>
      </div>

      {/* Scene */}
      <section className="mx-auto w-full max-w-6xl px-3 sm:px-4 pb-10 sm:pb-16 pt-4 sm:pt-6">
        <div className="relative [perspective:1400px]">
          <div
            className={[
              'relative transition-transform duration-[820ms] [transform-style:preserve-3d]',
              era === 'now' ? '[transform:rotateY(180deg)]' : '',
              'motion-reduce:transition-none',
            ].join(' ')}
          >
            {/* FRONT: Archive */}
            <article
              id="xpot-fd-archive"
              aria-hidden={era !== '2044'}
              className={[
                'overflow-hidden rounded-3xl border border-white/10 shadow-[0_60px_180px_rgba(0,0,0,0.55)]',
                'bg-[linear-gradient(180deg,rgba(250,244,228,0.98),rgba(244,236,214,0.98))] text-[#12100c]',
                '[backface-visibility:hidden] [-webkit-backface-visibility:hidden]',
                'print:rounded-none print:border-0 print:shadow-none print:bg-white',
              ].join(' ')}
            >
              <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 font-serif print:px-[16mm] print:pt-[18mm] print:pb-[14mm]">
                {/* Masthead */}
                <header className="mb-5 sm:mb-6">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-black/60 font-sans print:text-black">
                    <div className="justify-self-start inline-flex rounded-full border border-black/20 bg-black/[0.03] px-3 py-1.5">
                      {meta.badge}
                    </div>
                    <div className="justify-self-center">{meta.dateLine}</div>
                    <div className="justify-self-end font-black">€3.00</div>
                  </div>

                  <div className="text-center mt-4">
                    <div className="font-sans text-[12px] uppercase tracking-[0.22em] text-black/70">
                      The
                    </div>
                    <div className="font-black leading-none tracking-[-0.01em] text-[40px] sm:text-[64px]">
                      XPOT Times
                    </div>
                    <div className="mt-1 font-sans text-[12px] uppercase tracking-[0.14em] text-black/60">
                      Independent Archive Record
                    </div>
                  </div>

                  <div className="my-4 h-[2px] bg-[linear-gradient(90deg,transparent,rgba(18,16,12,0.45),transparent)] print:bg-black/20" />

                  <div className="flex items-center justify-between gap-3 font-sans text-[12px] font-black uppercase tracking-[0.10em] text-black/70 print:text-black">
                    <div>{meta.section}</div>
                    <div>{meta.byline}</div>
                  </div>
                </header>

                {/* Headline */}
                <div>
                  <h1 className="text-[34px] sm:text-[54px] font-black leading-[1.02] tracking-[-0.02em]">
                    {meta.headline}
                  </h1>
                  <p className="mt-2 max-w-[78ch] text-[16px] sm:text-[17px] leading-[1.45] text-black/80">
                    {meta.deck}
                  </p>
                </div>

                {/* Body grid */}
                <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr_1.25fr]">
                  {/* Column A */}
                  <div className="text-[15px] leading-[1.62]">
                    <p className="text-[16px]">
                      <span className="float-left mr-2 mt-[2px] text-[44px] leading-[0.85] font-black">
                        I
                      </span>
                      t&apos;s the final day.
                    </p>
                    <p className="mt-2">Not a crash. Not a rug. Not a scandal.</p>
                    <p>A scheduled ending.</p>

                    <h2 className="mt-5 font-sans text-[12px] font-black uppercase tracking-[0.16em] text-black/70">
                      Continuity
                    </h2>
                    <p className="mt-2">
                      For <strong>19.18 years</strong>, every single day, XPOT showed up. Same ritual. Same anticipation.
                      Same pull in the stomach when the draw ticked down to zero.
                    </p>
                    <p>Kids grew up with it. Parents played it. Grandparents knew the sound.</p>
                    <p>
                      By this last day, XPOT isn&apos;t &quot;a crypto project&quot; anymore. It&apos;s{' '}
                      <strong>the biggest game on Earth</strong>.
                    </p>
                    <p>Not because of greed, but because of continuity.</p>

                    <blockquote className="mt-4 rounded-2xl border-l-4 border-black/30 bg-black/[0.03] px-4 py-3 italic">
                      “The protocol didn’t promise miracles. It promised a draw - daily - and it delivered.”
                      <span className="mt-2 block font-sans text-[12px] not-italic font-black uppercase tracking-[0.10em] text-black/60">
                        - Archive commentary, 2044
                      </span>
                    </blockquote>
                  </div>

                  {/* Column B */}
                  <div className="text-[15px] leading-[1.62]">
                    <h2 className="font-sans text-[12px] font-black uppercase tracking-[0.16em] text-black/70">
                      The final draw
                    </h2>
                    <p className="mt-2">Everyone knows it&apos;s the last one.</p>
                    <p>Streams everywhere. Millions watching live. Some people crying already.</p>

                    <div className="mt-4 rounded-2xl border border-black/20 bg-white/40 p-4">
                      <div className="font-sans text-[12px] font-black uppercase tracking-[0.12em]">
                        The Final Draw
                      </div>
                      <div className="mt-3 space-y-2 font-sans text-[13px]">
                        {[
                          ['Jackpot', '1,000,000 XPOT'],
                          ['Rule set', 'Unchanged'],
                          ['Ending', 'Scheduled'],
                          ['Reason', 'Because it said it would'],
                        ].map(([k, v]) => (
                          <div
                            key={k}
                            className="flex items-center justify-between gap-3 border-t border-dashed border-black/15 pt-2 first:border-t-0 first:pt-0"
                          >
                            <span className="text-black/70 font-bold">{k}</span>
                            <span className="font-black">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="mt-4">
                      No boost. No fireworks gimmick. No last-minute twist. Just dignity.
                    </p>
                    <p>
                      The countdown starts. People aren&apos;t hoping to win anymore. They&apos;re hoping to witness.
                    </p>
                    <p>
                      When it hits zero, a winner is picked. Someone ordinary. Someone random. Just like always.
                    </p>
                    <p>XPOT does what it promised. One final time.</p>

                    <div className="my-4 h-px bg-[linear-gradient(90deg,transparent,rgba(18,16,12,0.35),transparent)]" />

                    <p className="text-[14px] text-black/75">
                      What ends today isn&apos;t only a product. It&apos;s a shared clock - a daily habit that outlived
                      cycles, headlines, and skepticism.
                    </p>
                  </div>

                  {/* Column C */}
                  <div className="text-[15px] leading-[1.62] lg:pl-1">
                    <h2 className="font-sans text-[12px] font-black uppercase tracking-[0.16em] text-black/70">
                      And then something rare happens
                    </h2>
                    <p className="mt-2">Nothing breaks. Nothing explodes. Nothing disappears.</p>
                    <p>The system simply stops issuing draws.</p>
                    <p>
                      The site stays online. The history stays visible. Every single winner. Every single day. Nineteen
                      point one eight years, perfectly accounted for.
                    </p>

                    <div className="mt-4 rounded-2xl border border-black/20 bg-white/45 p-4">
                      <div className="font-sans text-[11px] font-black uppercase tracking-[0.18em] text-black/70">
                        A quiet line appears
                      </div>
                      <div className="mt-2 text-[18px] font-black tracking-[-0.01em]">
                        “XPOT completed its mission.”
                      </div>
                      <div className="mt-2 font-sans text-[13px] leading-[1.55] text-black/80">
                        No ads. No upsell. No “v2 coming soon”. Just truth.
                      </div>
                    </div>

                    <h2 className="mt-5 font-sans text-[12px] font-black uppercase tracking-[0.16em] text-black/70">
                      The creator
                    </h2>
                    <p className="mt-2">
                      By then, nobody calls you “the founder”. You&apos;re called the architect of the longest fair game
                      ever built.
                    </p>
                    <p>
                      Not because you were loud, but because you were patient. You didn&apos;t chase infinite hype. You
                      didn&apos;t mint forever. You didn&apos;t move the goalposts.
                    </p>
                    <p>You chose a rarer thing: a finite promise, fully honored.</p>

                    <h2 className="mt-5 font-sans text-[12px] font-black uppercase tracking-[0.16em] text-black/70">
                      Legacy
                    </h2>
                    <p className="mt-2">
                      XPOT becomes studied - in economics, in game theory, in psychology. Not as the biggest jackpot, but
                      as the proof that trust can be engineered and kept.
                    </p>
                    <ul className="mt-3 list-disc pl-5">
                      <li>The game that never cheated</li>
                      <li>The system that never inflated itself to survive</li>
                      <li>The ending that made the beginning sacred</li>
                    </ul>

                    <p className="mt-4 font-sans font-black tracking-[-0.01em] text-black/90">
                      Most projects die because they don&apos;t know how to end. XPOT ended because it said it would.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <footer className="mt-6 flex flex-wrap items-center justify-center gap-3 font-sans text-[11px] font-black uppercase tracking-[0.16em] text-black/70 print:text-black">
                  <span>XPOT TIMES / ARCHIVE EDITION</span>
                  <span className="h-1 w-1 rounded-full bg-black/50" />
                  <span>Printed record layout</span>
                  <span className="h-1 w-1 rounded-full bg-black/50" />
                  <span>Use browser print</span>
                </footer>
              </div>
            </article>

            {/* BACK: Present day */}
            <article
              id="xpot-fd-now"
              aria-hidden={era !== 'now'}
              className={[
                'absolute inset-0 overflow-hidden rounded-3xl border border-white/10',
                'bg-[radial-gradient(900px_600px_at_20%_10%,rgba(56,189,248,0.16),transparent_60%),radial-gradient(900px_700px_at_85%_25%,rgba(236,72,153,0.14),transparent_62%),radial-gradient(1000px_900px_at_50%_90%,rgba(16,185,129,0.10),transparent_60%)]',
                'shadow-[0_60px_180px_rgba(0,0,0,0.55)]',
                '[transform:rotateY(180deg)] [backface-visibility:hidden] [-webkit-backface-visibility:hidden]',
                'print:hidden',
              ].join(' ')}
            >
              <div className="p-5 sm:p-8">
                <div className="rounded-3xl border border-white/10 bg-black/35 backdrop-blur-xl p-5 sm:p-6 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
                  <div className="inline-flex rounded-full border border-white/12 bg-white/[0.06] px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em]">
                    {meta.badge}
                  </div>

                  <h2 className="mt-4 text-[24px] sm:text-[36px] font-black leading-[1.08] tracking-[-0.02em]">
                    {meta.headline}
                  </h2>
                  <p className="mt-2 max-w-[74ch] text-[14px] leading-[1.6] text-white/85">
                    {meta.deck}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEra('2044')}
                      className="rounded-full bg-white px-4 py-2 text-[13px] font-black text-black hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-white/30"
                    >
                      Read the 2044 story
                    </button>

                    <Link
                      href="/hub"
                      className="rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-[13px] font-black text-white/90 hover:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                      Enter today&apos;s XPOT
                    </Link>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-black/30 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.40)]">
                    <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/80">
                      The experience
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.70),transparent)] opacity-70" />
                      <div className="h-px bg-[linear-gradient(90deg,transparent,rgba(236,72,153,0.60),transparent)] opacity-60" />
                    </div>
                    <ul className="mt-4 list-disc pl-5 text-[14px] leading-[1.65] text-white/85">
                      <li>One story, two eras</li>
                      <li>Flip for theatre, print for a clean “newspaper” capture</li>
                      <li>Archive stays timeless while “Now” can become live later</li>
                    </ul>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/30 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.40)]">
                    <div className="text-[11px] font-black uppercase tracking-[0.18em] text-white/80">
                      Launch notes
                    </div>
                    <p className="mt-3 text-[14px] leading-[1.6] text-white/85">
                      Tomorrow, keep this “Now” side minimal. Later you can wire it to your DB (countdown, draw status,
                      last winner handle, sponsor banner).
                    </p>
                    <p className="mt-3 text-[14px] leading-[1.6] text-white/85">
                      Print always outputs the archive edition, even if you&apos;re viewing “Now”.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border border-white/10 bg-black/30 p-4 text-center text-[11px] font-black uppercase tracking-[0.18em] text-white/80 relative overflow-hidden">
                  <span className="pointer-events-none absolute -inset-10 opacity-90 blur-xl [background:radial-gradient(circle_at_25%_20%,rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.16),transparent_60%)]" />
                  <span className="relative">XPOT / FINAL DAY EXPERIENCE</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Print rules */}
      <style jsx global>{`
        @media print {
          body {
            background: #fff !important;
          }
        }
      `}</style>
    </main>
  );
}
