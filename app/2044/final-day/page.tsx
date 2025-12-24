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

  const archiveH1Ref = useRef<HTMLHeadingElement | null>(null);
  const nowH2Ref = useRef<HTMLHeadingElement | null>(null);

  // Restore from localStorage
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (isEra(v)) setEra(v);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, era);
    } catch {}
  }, [era]);

  // Premium: set a nice document title per era
  useEffect(() => {
    try {
      document.title =
        era === '2044'
          ? "XPOT Times (2044) - XPOT's Final Day"
          : 'XPOT - The Final Draw';
    } catch {}
  }, [era]);

  // Focus management after flipping (keyboard + a11y)
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (era === '2044') archiveH1Ref.current?.focus();
      else nowH2Ref.current?.focus();
    }, 120);
    return () => window.clearTimeout(t);
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

  // Keyboard shortcuts: F = flip, P = print, 1/2 = switch tabs
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // don't hijack typing
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName?.toLowerCase();
      const isTyping =
        tag === 'input' || tag === 'textarea' || (el as any)?.isContentEditable;
      if (isTyping) return;

      const k = e.key.toLowerCase();
      if (k === 'f') {
        e.preventDefault();
        onFlip();
      }
      if (k === 'p') {
        e.preventDefault();
        onPrint();
      }
      if (e.key === '1') setEra('2044');
      if (e.key === '2') setEra('now');
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onFlip, onPrint]);

  return (
    <main className="xpot-fd-root">
      {/* Top utility bar (hidden on print) */}
      <div className="xpot-fd-topbar" aria-label="Final Day controls">
        <Link className="xpot-fd-back" href="/" aria-label="Back to home">
          <ChevronLeft size={18} />
          <span>Back</span>
        </Link>

        <div className="xpot-fd-toggle" role="tablist" aria-label="Edition selector">
          <button
            type="button"
            className={`xpot-fd-tab ${era === '2044' ? 'is-active' : ''}`}
            onClick={() => setEra('2044')}
            role="tab"
            aria-selected={era === '2044'}
            aria-controls="xpot-fd-archive"
            id="xpot-tab-2044"
          >
            2044
          </button>
          <button
            type="button"
            className={`xpot-fd-tab ${era === 'now' ? 'is-active' : ''}`}
            onClick={() => setEra('now')}
            role="tab"
            aria-selected={era === 'now'}
            aria-controls="xpot-fd-now"
            id="xpot-tab-now"
          >
            Now
          </button>
        </div>

        <div className="xpot-fd-actions" aria-label="Actions">
          <button type="button" className="xpot-fd-btn" onClick={onFlip} aria-label="Flip edition (shortcut: F)">
            <Repeat2 size={16} />
            <span>Flip</span>
          </button>
          <button type="button" className="xpot-fd-btn" onClick={onPrint} aria-label="Print archive (shortcut: P)">
            <Printer size={16} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Scene container */}
      <section className="xpot-fd-scene" aria-label="Final Day story">
        <div className={`xpot-fd-card ${era === 'now' ? 'is-flipped' : ''}`}>
          {/* FRONT: 2044 newspaper */}
          <article
            id="xpot-fd-archive"
            className="xpot-fd-face xpot-fd-front"
            role="tabpanel"
            aria-labelledby="xpot-tab-2044"
            aria-hidden={era !== '2044'}
          >
            <header className="xpot-fd-masthead">
              <div className="xpot-fd-mast-top">
                <div className="xpot-fd-badge">{meta.badge}</div>
                <div className="xpot-fd-date">{meta.dateLine}</div>
                <div className="xpot-fd-price">€3.00</div>
              </div>

              <div className="xpot-fd-paper-title">
                <div className="xpot-fd-paper-kicker">The</div>
                <div className="xpot-fd-paper-name">XPOT Times</div>
                <div className="xpot-fd-paper-tag">Independent Archive Record</div>
              </div>

              <div className="xpot-fd-rule" />

              <div className="xpot-fd-meta">
                <div className="xpot-fd-section">{meta.section}</div>
                <div className="xpot-fd-byline">{meta.byline}</div>
              </div>
            </header>

            <div className="xpot-fd-body">
              <h1
                ref={archiveH1Ref}
                tabIndex={-1}
                className="xpot-fd-h1"
              >
                {meta.headline}
              </h1>
              <p className="xpot-fd-deck">{meta.deck}</p>

              <div className="xpot-fd-grid">
                {/* Column A */}
                <div className="xpot-fd-col">
                  <p className="xpot-fd-lead">
                    <span className="xpot-fd-dropcap">I</span>
                    t&apos;s the final day.
                  </p>
                  <p>Not a crash. Not a rug. Not a scandal.</p>
                  <p>A scheduled ending.</p>

                  <h2 className="xpot-fd-h2">Continuity</h2>
                  <p>
                    For <strong>19.18 years</strong>, every single day, XPOT showed up. Same ritual. Same anticipation.
                    Same pull in the stomach when the draw ticked down to zero.
                  </p>
                  <p>Kids grew up with it. Parents played it. Grandparents knew the sound.</p>
                  <p>
                    By this last day, XPOT isn&apos;t &quot;a crypto project&quot; anymore. It&apos;s{' '}
                    <strong>the biggest game on Earth</strong>.
                  </p>
                  <p>Not because of greed, but because of continuity.</p>

                  <blockquote className="xpot-fd-quote">
                    “The protocol didn’t promise miracles. It promised a draw - daily - and it delivered.”
                    <span className="xpot-fd-quote-cite">- Archive commentary, 2044</span>
                  </blockquote>
                </div>

                {/* Column B */}
                <div className="xpot-fd-col">
                  <h2 className="xpot-fd-h2">The final draw</h2>
                  <p>Everyone knows it&apos;s the last one.</p>
                  <p>Streams everywhere. Millions watching live. Some people crying already.</p>

                  <div className="xpot-fd-sidebox" aria-label="Final draw facts">
                    <div className="xpot-fd-sidebox-title">The Final Draw</div>
                    <div className="xpot-fd-sidebox-row">
                      <span>Jackpot</span>
                      <span>1,000,000 XPOT</span>
                    </div>
                    <div className="xpot-fd-sidebox-row">
                      <span>Rule set</span>
                      <span>Unchanged</span>
                    </div>
                    <div className="xpot-fd-sidebox-row">
                      <span>Ending</span>
                      <span>Scheduled</span>
                    </div>
                    <div className="xpot-fd-sidebox-row">
                      <span>Reason</span>
                      <span>Because it said it would</span>
                    </div>
                  </div>

                  <p>No boost. No fireworks gimmick. No last-minute twist. Just dignity.</p>
                  <p>The countdown starts. People aren&apos;t hoping to win anymore. They&apos;re hoping to witness.</p>
                  <p>When it hits zero, a winner is picked. Someone ordinary. Someone random. Just like always.</p>
                  <p>XPOT does what it promised. One final time.</p>

                  <div className="xpot-fd-break" />
                  <p className="xpot-fd-small">
                    What ends today isn&apos;t only a product. It&apos;s a shared clock - a daily habit that outlived
                    cycles, headlines, and skepticism.
                  </p>
                </div>

                {/* Column C */}
                <div className="xpot-fd-col xpot-fd-col-wide">
                  <h2 className="xpot-fd-h2">And then something rare happens</h2>
                  <p>Nothing breaks. Nothing explodes. Nothing disappears.</p>
                  <p>The system simply stops issuing draws.</p>
                  <p>
                    The site stays online. The history stays visible. Every single winner. Every single day.
                    Nineteen point one eight years, perfectly accounted for.
                  </p>

                  <div className="xpot-fd-stamp" aria-label="Archive conclusion">
                    <div className="xpot-fd-stamp-label">A quiet line appears</div>
                    <div className="xpot-fd-stamp-text">“XPOT completed its mission.”</div>
                    <div className="xpot-fd-stamp-sub">
                      No ads. No upsell. No “v2 coming soon”. Just truth.
                    </div>
                  </div>

                  <h2 className="xpot-fd-h2">The creator</h2>
                  <p>
                    By then, nobody calls you “the founder”. You&apos;re called the architect of the longest fair game
                    ever built.
                  </p>
                  <p>
                    Not because you were loud, but because you were patient. You didn&apos;t chase infinite hype.
                    You didn&apos;t mint forever. You didn&apos;t move the goalposts.
                  </p>
                  <p>You chose a rarer thing: a finite promise, fully honored.</p>

                  <h2 className="xpot-fd-h2">Legacy</h2>
                  <p>
                    XPOT becomes studied - in economics, in game theory, in psychology. Not as the biggest jackpot, but as
                    the proof that trust can be engineered and kept.
                  </p>
                  <ul className="xpot-fd-bullets">
                    <li>The game that never cheated</li>
                    <li>The system that never inflated itself to survive</li>
                    <li>The ending that made the beginning sacred</li>
                  </ul>

                  <p className="xpot-fd-kicker">
                    Most projects die because they don&apos;t know how to end. XPOT ended because it said it would.
                  </p>
                </div>
              </div>
            </div>

            <footer className="xpot-fd-footer" aria-label="Archive footer">
              <span>XPOT TIMES / ARCHIVE EDITION</span>
              <span className="xpot-fd-footer-dot" />
              <span>Printed record layout</span>
              <span className="xpot-fd-footer-dot" />
              <span>Use browser print</span>
            </footer>
          </article>

          {/* BACK: present-day premium view */}
          <article
            id="xpot-fd-now"
            className="xpot-fd-face xpot-fd-backface"
            role="tabpanel"
            aria-labelledby="xpot-tab-now"
            aria-hidden={era !== 'now'}
          >
            <header className="xpot-fd-now-hero">
              <div className="xpot-fd-now-pill">{meta.badge}</div>
              <h2
                ref={nowH2Ref}
                tabIndex={-1}
                className="xpot-fd-now-title"
              >
                {meta.headline}
              </h2>
              <p className="xpot-fd-now-sub">{meta.deck}</p>

              <div className="xpot-fd-now-cta">
                <button className="xpot-fd-now-btn" type="button" onClick={() => setEra('2044')}>
                  Read the 2044 story
                </button>
                <Link className="xpot-fd-now-link" href="/hub">
                  Enter today&apos;s XPOT
                </Link>
              </div>

              <div className="xpot-fd-hints" aria-label="Keyboard shortcuts">
                <span>Shortcuts:</span>
                <span className="xpot-fd-kbd">F</span> flip
                <span className="xpot-fd-dot" />
                <span className="xpot-fd-kbd">P</span> print
                <span className="xpot-fd-dot" />
                <span className="xpot-fd-kbd">1</span> 2044
                <span className="xpot-fd-dot" />
                <span className="xpot-fd-kbd">2</span> now
              </div>
            </header>

            <section className="xpot-fd-now-panel">
              <div className="xpot-fd-now-card">
                <div className="xpot-fd-now-kicker">The experience</div>
                <div className="xpot-fd-now-lines">
                  <div className="xpot-fd-now-line" />
                  <div className="xpot-fd-now-line is-2" />
                </div>
                <ul className="xpot-fd-now-list">
                  <li>One story, two eras</li>
                  <li>Flip for theatre, print for a clean “newspaper” capture</li>
                  <li>Archive stays timeless while “Now” can become live</li>
                </ul>
              </div>

              <div className="xpot-fd-now-card">
                <div className="xpot-fd-now-kicker">Ready for launch</div>
                <p className="xpot-fd-now-copy">
                  Tomorrow: keep “Now” minimal and premium. Later: bind this side to your draw data (countdown, status,
                  last winner handle and sponsor banner).
                </p>
                <p className="xpot-fd-now-copy">
                  Print always outputs the archive edition - even if you’re viewing “Now”.
                </p>
              </div>
            </section>

            <footer className="xpot-fd-now-footer">
              <span className="xpot-fd-now-footer-glow" />
              <span>XPOT / FINAL DAY EXPERIENCE</span>
            </footer>
          </article>
        </div>
      </section>

      <style jsx>{`
        /* ---------- Base ---------- */
        .xpot-fd-root {
          min-height: 100vh;
          background:
            radial-gradient(1200px 800px at 20% 10%, rgba(56, 189, 248, 0.12), transparent 55%),
            radial-gradient(900px 700px at 80% 20%, rgba(236, 72, 153, 0.10), transparent 60%),
            radial-gradient(1000px 900px at 40% 90%, rgba(16, 185, 129, 0.08), transparent 60%),
            #05070a;
          color: rgba(255, 255, 255, 0.92);
          padding: 28px 14px 60px;
          position: relative;
          overflow-x: hidden;
        }

        /* Subtle premium grain */
        .xpot-fd-root::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.18'/%3E%3C/svg%3E");
          opacity: 0.10;
          mix-blend-mode: overlay;
        }

        /* ---------- Controls Topbar (screen only) ---------- */
        .xpot-fd-topbar {
          max-width: 1120px;
          margin: 0 auto 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .xpot-fd-back,
        .xpot-fd-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.10);
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.92);
          font-weight: 800;
          font-size: 13px;
          text-decoration: none;
          cursor: pointer;
          transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
        }

        .xpot-fd-back:hover,
        .xpot-fd-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.14);
          transform: translateY(-1px);
        }

        .xpot-fd-back:active,
        .xpot-fd-btn:active {
          transform: translateY(0px);
        }

        .xpot-fd-back:focus-visible,
        .xpot-fd-btn:focus-visible,
        .xpot-fd-tab:focus-visible,
        .xpot-fd-now-btn:focus-visible,
        .xpot-fd-now-link:focus-visible {
          outline: 2px solid rgba(56, 189, 248, 0.75);
          outline-offset: 3px;
        }

        .xpot-fd-toggle {
          display: inline-flex;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.10);
          background: rgba(255, 255, 255, 0.03);
          overflow: hidden;
        }

        .xpot-fd-tab {
          appearance: none;
          border: 0;
          background: transparent;
          color: rgba(255, 255, 255, 0.72);
          padding: 10px 14px;
          font-weight: 900;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 160ms ease, color 160ms ease;
        }

        .xpot-fd-tab.is-active {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.95);
        }

        .xpot-fd-actions {
          display: inline-flex;
          gap: 10px;
        }

        @media (max-width: 520px) {
          .xpot-fd-btn span {
            display: none;
          }
          .xpot-fd-btn {
            padding: 10px 10px;
          }
        }

        /* ---------- Flip Scene ---------- */
        .xpot-fd-scene {
          max-width: 1120px;
          margin: 0 auto;
          perspective: 1400px;
        }

        .xpot-fd-card {
          position: relative;
          transform-style: preserve-3d;
          transition: transform 800ms cubic-bezier(0.22, 0.9, 0.22, 1);
        }

        .xpot-fd-card.is-flipped {
          transform: rotateY(180deg);
        }

        @media (prefers-reduced-motion: reduce) {
          .xpot-fd-card {
            transition: none !important;
          }
          .xpot-fd-back:hover,
          .xpot-fd-btn:hover {
            transform: none !important;
          }
        }

        .xpot-fd-face {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 60px 180px rgba(0, 0, 0, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.10);
        }

        /* ---------- 2044 Newspaper (front) ---------- */
        .xpot-fd-front {
          background:
            radial-gradient(900px 600px at 15% 10%, rgba(0, 0, 0, 0.06), transparent 70%),
            radial-gradient(900px 700px at 90% 20%, rgba(0, 0, 0, 0.05), transparent 65%),
            linear-gradient(180deg, rgba(250, 244, 228, 0.96), rgba(244, 236, 214, 0.96));
          color: rgba(18, 16, 12, 0.95);
          padding: 28px 28px 20px;
          font-family: ui-serif, Georgia, 'Times New Roman', Times, serif;
          position: relative;
        }

        /* Paper grain inside the archive */
        .xpot-fd-front::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(1200px 900px at 50% 10%, rgba(0,0,0,0.06), transparent 60%),
            radial-gradient(900px 700px at 20% 90%, rgba(0,0,0,0.05), transparent 62%);
          opacity: 0.55;
        }

        .xpot-fd-front > * {
          position: relative;
          z-index: 1;
        }

        @media (max-width: 720px) {
          .xpot-fd-front {
            padding: 18px 16px 16px;
          }
        }

        .xpot-fd-masthead {
          margin-bottom: 18px;
        }

        .xpot-fd-mast-top {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 10px;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 11px;
          color: rgba(18, 16, 12, 0.65);
        }

        .xpot-fd-badge {
          justify-self: start;
          display: inline-flex;
          padding: 6px 10px;
          border: 1px solid rgba(18, 16, 12, 0.22);
          border-radius: 999px;
          background: rgba(18, 16, 12, 0.03);
          font-weight: 900;
        }

        .xpot-fd-date {
          justify-self: center;
          font-weight: 900;
        }

        .xpot-fd-price {
          justify-self: end;
          font-weight: 950;
        }

        .xpot-fd-paper-title {
          text-align: center;
          margin-top: 14px;
        }

        .xpot-fd-paper-kicker {
          font-size: 12px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          opacity: 0.75;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        }

        .xpot-fd-paper-name {
          font-size: clamp(36px, 5vw, 60px);
          letter-spacing: 0.02em;
          font-weight: 950;
          line-height: 1;
        }

        .xpot-fd-paper-tag {
          margin-top: 6px;
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          opacity: 0.65;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        }

        .xpot-fd-rule {
          margin: 16px 0 12px;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(18, 16, 12, 0.45), transparent);
        }

        .xpot-fd-meta {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
          font-size: 12px;
          color: rgba(18, 16, 12, 0.72);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 950;
        }

        .xpot-fd-body {
          padding: 6px 0 0;
        }

        .xpot-fd-h1 {
          font-size: clamp(30px, 4.2vw, 52px);
          line-height: 1.02;
          margin: 10px 0 10px;
          letter-spacing: -0.02em;
          font-weight: 950;
        }

        .xpot-fd-deck {
          font-size: 17px;
          line-height: 1.45;
          margin: 0 0 18px;
          color: rgba(18, 16, 12, 0.82);
          max-width: 78ch;
        }

        .xpot-fd-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1.25fr;
          gap: 18px;
        }

        @media (max-width: 980px) {
          .xpot-fd-grid {
            grid-template-columns: 1fr 1fr;
          }
          .xpot-fd-col-wide {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 860px) {
          .xpot-fd-grid {
            grid-template-columns: 1fr;
          }
          .xpot-fd-col-wide {
            grid-column: auto;
          }
        }

        .xpot-fd-col p {
          font-size: 15px;
          line-height: 1.62;
          margin: 0 0 12px;
        }

        .xpot-fd-h2 {
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
          font-size: 12px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 950;
          margin: 16px 0 10px;
          color: rgba(18, 16, 12, 0.72);
        }

        .xpot-fd-lead {
          font-size: 16px;
        }

        .xpot-fd-dropcap {
          float: left;
          font-size: 42px;
          line-height: 0.9;
          padding: 2px 8px 0 0;
          font-weight: 950;
          color: rgba(18, 16, 12, 0.92);
        }

        .xpot-fd-quote {
          border-left: 4px solid rgba(18, 16, 12, 0.35);
          padding: 10px 12px;
          margin: 14px 0 14px;
          background: rgba(18, 16, 12, 0.03);
          font-style: italic;
        }

        .xpot-fd-quote-cite {
          display: block;
          margin-top: 8px;
          font-style: normal;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(18, 16, 12, 0.65);
        }

        .xpot-fd-sidebox {
          border: 1px solid rgba(18, 16, 12, 0.22);
          background: rgba(255, 255, 255, 0.35);
          padding: 12px 12px;
          border-radius: 14px;
          margin: 14px 0 12px;
        }

        .xpot-fd-sidebox-title {
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
          font-weight: 950;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-size: 12px;
          margin-bottom: 10px;
        }

        .xpot-fd-sidebox-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
          font-size: 13px;
          padding: 6px 0;
          border-top: 1px dashed rgba(18, 16, 12, 0.18);
        }

        .xpot-fd-sidebox-row:first-of-type {
          border-top: none;
        }

        .xpot-fd-break {
          height: 1px;
          margin: 14px 0;
          background: linear-gradient(90deg, transparent, rgba(18, 16, 12, 0.35), transparent);
        }

        .xpot-fd-small {
          font-size: 14px;
          color: rgba(18, 16, 12, 0.78);
        }

        .xpot-fd-stamp {
          border: 1px solid rgba(18, 16, 12, 0.22);
          background: rgba(255, 255, 255, 0.4);
          border-radius: 16px;
          padding: 14px 14px;
          margin: 14px 0 16px;
        }

        .xpot-fd-stamp-label {
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 950;
          color: rgba(18, 16, 12, 0.7);
        }

        .xpot-fd-stamp-text {
          margin-top: 8px;
          font-size: 18px;
          font-weight: 950;
          letter-spacing: -0.01em;
        }

        .xpot-fd-stamp-sub {
          margin-top: 8px;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
          font-size: 13px;
          opacity: 0.85;
          line-height: 1.55;
        }

        .xpot-fd-bullets {
          margin: 10px 0 0;
          padding-left: 18px;
          line-height: 1.6;
        }

        .xpot-fd-kicker {
          margin-top: 14px !important;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
          font-weight: 950;
          letter-spacing: -0.01em;
        }

        .xpot-fd-footer {
          margin-top: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          opacity: 0.75;
        }

        .xpot-fd-footer-dot {
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: rgba(18, 16, 12, 0.45);
          display: inline-block;
        }

        /* ---------- Present Day (back face) ---------- */
        .xpot-fd-backface {
          position: absolute;
          inset: 0;
          transform: rotateY(180deg);
          background:
            radial-gradient(900px 600px at 20% 10%, rgba(56, 189, 248, 0.14), transparent 60%),
            radial-gradient(900px 700px at 85% 25%, rgba(236, 72, 153, 0.12), transparent 62%),
            radial-gradient(1000px 900px at 50% 90%, rgba(16, 185, 129, 0.08), transparent 60%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0));
          padding: 28px;
          color: rgba(255, 255, 255, 0.92);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        }

        @media (max-width: 720px) {
          .xpot-fd-backface {
            padding: 18px 16px 16px;
          }
        }

        .xpot-fd-now-hero {
          padding: 22px 18px 18px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.10);
          background: rgba(0, 0, 0, 0.35);
          box-shadow: 0 40px 120px rgba(0, 0, 0, 0.45);
        }

        .xpot-fd-now-pill {
          display: inline-flex;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.06);
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-size: 11px;
        }

        .xpot-fd-now-title {
          margin: 14px 0 8px;
          font-size: clamp(22px, 3.2vw, 34px);
          letter-spacing: -0.02em;
          font-weight: 950;
          line-height: 1.08;
        }

        .xpot-fd-now-sub {
          margin: 0;
          opacity: 0.86;
          line-height: 1.55;
          max-width: 74ch;
          font-size: 14px;
        }

        .xpot-fd-now-cta {
          margin-top: 14px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .xpot-fd-now-btn {
          border: 0;
          cursor: pointer;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 950;
          background: #fff;
          color: #000;
          transition: transform 160ms ease, filter 160ms ease;
        }

        .xpot-fd-now-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.02);
        }

        .xpot-fd-now-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 900;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          text-decoration: none;
          color: rgba(255, 255, 255, 0.92);
          transition: background 160ms ease, transform 160ms ease;
        }

        .xpot-fd-now-link:hover {
          background: rgba(255, 255, 255, 0.07);
          transform: translateY(-1px);
        }

        .xpot-fd-hints {
          margin-top: 14px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          opacity: 0.78;
          font-size: 12px;
          letter-spacing: 0.02em;
        }

        .xpot-fd-kbd {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 2px 8px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.06);
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .xpot-fd-dot {
          width: 3px;
          height: 3px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.35);
          display: inline-block;
        }

        .xpot-fd-now-panel {
          margin-top: 16px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        @media (max-width: 860px) {
          .xpot-fd-now-panel {
            grid-template-columns: 1fr;
          }
        }

        .xpot-fd-now-card {
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.10);
          background: rgba(0, 0, 0, 0.30);
          padding: 16px 16px;
          box-shadow: 0 40px 120px rgba(0, 0, 0, 0.40);
          position: relative;
          overflow: hidden;
        }

        .xpot-fd-now-kicker {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 950;
          opacity: 0.85;
        }

        .xpot-fd-now-lines {
          margin: 12px 0 12px;
        }

        .xpot-fd-now-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.65), transparent);
          opacity: 0.65;
        }

        .xpot-fd-now-line.is-2 {
          margin-top: 8px;
          background: linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.50), transparent);
        }

        .xpot-fd-now-list {
          margin: 0;
          padding-left: 18px;
          line-height: 1.65;
          opacity: 0.92;
        }

        .xpot-fd-now-copy {
          margin: 10px 0 0;
          line-height: 1.6;
          opacity: 0.92;
          font-size: 14px;
        }

        .xpot-fd-now-footer {
          margin-top: 16px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.10);
          background: rgba(0, 0, 0, 0.30);
          padding: 14px 16px;
          text-align: center;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 950;
          font-size: 11px;
          position: relative;
          overflow: hidden;
        }

        .xpot-fd-now-footer-glow {
          position: absolute;
          inset: -40px;
          background:
            radial-gradient(circle at 25% 20%, rgba(56, 189, 248, 0.16), transparent 55%),
            radial-gradient(circle at 80% 30%, rgba(236, 72, 153, 0.14), transparent 60%);
          filter: blur(12px);
          opacity: 0.9;
          pointer-events: none;
        }

        /* ---------- Print ---------- */
        @media print {
          .xpot-fd-root {
            background: #fff !important;
            color: #000 !important;
            padding: 0 !important;
          }

          .xpot-fd-root::before {
            display: none !important;
          }

          .xpot-fd-topbar {
            display: none !important;
          }

          .xpot-fd-scene {
            perspective: none !important;
          }

          .xpot-fd-card {
            transform: none !important;
          }

          .xpot-fd-face {
            border-radius: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }

          .xpot-fd-backface {
            display: none !important;
          }

          .xpot-fd-front {
            padding: 18mm 16mm 14mm !important;
            background: #fff !important;
            color: #000 !important;
          }

          .xpot-fd-mast-top,
          .xpot-fd-meta,
          .xpot-fd-paper-kicker,
          .xpot-fd-paper-tag,
          .xpot-fd-footer {
            color: #000 !important;
            opacity: 1 !important;
          }

          .xpot-fd-rule {
            background: #000 !important;
            opacity: 0.18 !important;
          }

          .xpot-fd-sidebox,
          .xpot-fd-quote,
          .xpot-fd-stamp {
            background: #fff !important;
          }

          .xpot-fd-sidebox-row {
            border-top: 1px dashed #000 !important;
            opacity: 0.9;
          }
        }
      `}</style>
    </main>
  );
}
