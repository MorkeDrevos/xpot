// app/final-day/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Printer, Repeat2 } from 'lucide-react';

type Era = '2044' | 'now';

export default function FinalDayPage() {
  const [era, setEra] = useState<Era>('2044');

  // Restore from localStorage
  useEffect(() => {
    try {
      const v = window.localStorage.getItem('xpot_final_day_era');
      if (v === '2044' || v === 'now') setEra(v);
    } catch {}
  }, []);

  // Persist
  useEffect(() => {
    try {
      window.localStorage.setItem('xpot_final_day_era', era);
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
        'This page is a preview experience. Flip back to 2044 to read how the world remembered it.',
      byline: 'XPOT',
    };
  }, [era]);

  function onPrint() {
    if (typeof window !== 'undefined') window.print();
  }

  return (
    <main className="xpot-fd-root">
      {/* Top utility bar (hidden on print) */}
      <div className="xpot-fd-topbar" aria-label="Final Day controls">
        <Link className="xpot-fd-back" href="/">
          <ChevronLeft size={18} />
          Back
        </Link>

        <div className="xpot-fd-toggle" role="tablist" aria-label="Date selector">
          <button
            type="button"
            className={`xpot-fd-tab ${era === '2044' ? 'is-active' : ''}`}
            onClick={() => setEra('2044')}
            role="tab"
            aria-selected={era === '2044'}
          >
            2044
          </button>
          <button
            type="button"
            className={`xpot-fd-tab ${era === 'now' ? 'is-active' : ''}`}
            onClick={() => setEra('now')}
            role="tab"
            aria-selected={era === 'now'}
          >
            Now
          </button>
        </div>

        <div className="xpot-fd-actions">
          <button type="button" className="xpot-fd-btn" onClick={() => setEra(era === '2044' ? 'now' : '2044')}>
            <Repeat2 size={16} />
            Flip
          </button>
          <button type="button" className="xpot-fd-btn" onClick={onPrint}>
            <Printer size={16} />
            Print
          </button>
        </div>
      </div>

      {/* Scene container */}
      <section className="xpot-fd-scene" aria-label="Newspaper story">
        <div className={`xpot-fd-card ${era === 'now' ? 'is-flipped' : ''}`}>
          {/* FRONT: 2044 newspaper */}
          <article className="xpot-fd-face xpot-fd-front" aria-hidden={era !== '2044'}>
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
              <h1 className="xpot-fd-h1">{meta.headline}</h1>
              <p className="xpot-fd-deck">{meta.deck}</p>

              <div className="xpot-fd-columns">
                <div className="xpot-fd-col">
                  <p>
                    It&apos;s the final day.
                  </p>
                  <p>
                    Not a crash. Not a rug. Not a scandal.
                  </p>
                  <p>
                    A scheduled ending.
                  </p>
                  <p>
                    For <strong>19.18 years</strong>, every single day, XPOT showed up. Same ritual. Same anticipation.
                    Same pull in the stomach when the draw ticked down to zero.
                  </p>

                  <p>
                    Kids grew up with it. Parents played it. Grandparents knew the sound.
                  </p>

                  <p>
                    By this last day, XPOT isn&apos;t &quot;a crypto project&quot; anymore. It&apos;s{' '}
                    <strong>the biggest game on Earth</strong>.
                  </p>

                  <p>
                    Not because of greed. But because of <em>continuity</em>.
                  </p>
                </div>

                <div className="xpot-fd-col">
                  <p>
                    Because it never lied. Because it never skipped a day. Because the rules never changed.
                  </p>

                  <blockquote className="xpot-fd-quote">
                    “The protocol didn’t promise miracles. It promised a draw - daily - and it delivered.”
                    <span className="xpot-fd-quote-cite">- Archive commentary, 2044</span>
                  </blockquote>

                  <p>
                    What ends today isn&apos;t only a product. It&apos;s a shared clock - a daily habit that outlived
                    cycles, headlines, and skepticism.
                  </p>

                  <div className="xpot-fd-sidebox">
                    <div className="xpot-fd-sidebox-title">The Final Draw</div>
                    <div className="xpot-fd-sidebox-row">
                      <span>Last entry window</span>
                      <span>23:59</span>
                    </div>
                    <div className="xpot-fd-sidebox-row">
                      <span>Draw moment</span>
                      <span>00:00</span>
                    </div>
                    <div className="xpot-fd-sidebox-row">
                      <span>Rule set</span>
                      <span>Unchanged</span>
                    </div>
                    <div className="xpot-fd-sidebox-row">
                      <span>Status</span>
                      <span>Scheduled ending</span>
                    </div>
                  </div>

                  <p className="xpot-fd-fine">
                    Archive note: This page is a stylized narrative layout for XPOT. Replace timing and facts with your
                    canonical values if you want it to be strictly factual.
                  </p>
                </div>
              </div>
            </div>

            <footer className="xpot-fd-footer">
              <span>XPOT TIMES / ARCHIVE EDITION</span>
              <span className="xpot-fd-footer-dot" />
              <span>Printed record layout</span>
              <span className="xpot-fd-footer-dot" />
              <span>Use browser print</span>
            </footer>
          </article>

          {/* BACK: present-day premium view */}
          <article className="xpot-fd-face xpot-fd-backface" aria-hidden={era !== 'now'}>
            <header className="xpot-fd-now-hero">
              <div className="xpot-fd-now-pill">PRESENT DAY</div>
              <h2 className="xpot-fd-now-title">Flip to 2044 to read the archived story</h2>
              <p className="xpot-fd-now-sub">
                This is the &quot;now&quot; side. Keep it minimal, premium, and tied to live data later if you want.
              </p>

              <div className="xpot-fd-now-cta">
                <button className="xpot-fd-now-btn" type="button" onClick={() => setEra('2044')}>
                  Read the 2044 story
                </button>
                <Link className="xpot-fd-now-link" href="/hub">
                  Enter today&apos;s XPOT
                </Link>
              </div>
            </header>

            <section className="xpot-fd-now-panel">
              <div className="xpot-fd-now-card">
                <div className="xpot-fd-now-kicker">Why this works</div>
                <div className="xpot-fd-now-lines">
                  <div className="xpot-fd-now-line" />
                  <div className="xpot-fd-now-line is-2" />
                </div>
                <ul className="xpot-fd-now-list">
                  <li>Same story, two eras</li>
                  <li>Flip animation for theatre</li>
                  <li>Print mode for “newspaper screenshot” moments</li>
                </ul>
              </div>

              <div className="xpot-fd-now-card">
                <div className="xpot-fd-now-kicker">Next upgrade</div>
                <p className="xpot-fd-now-copy">
                  Wire this panel to your DB (draw date, countdown, last winner, sponsor banner). Keep the archive side
                  static and timeless.
                </p>
                <p className="xpot-fd-now-copy">
                  If you want the story to reference exact numbers (holders, years, prize sizes), pass them in as props
                  or load them from your API.
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
          background: radial-gradient(1200px 800px at 20% 10%, rgba(56, 189, 248, 0.12), transparent 55%),
            radial-gradient(900px 700px at 80% 20%, rgba(236, 72, 153, 0.10), transparent 60%),
            radial-gradient(1000px 900px at 40% 90%, rgba(16, 185, 129, 0.08), transparent 60%),
            #05070a;
          color: rgba(255, 255, 255, 0.92);
          padding: 28px 14px 60px;
        }

        /* Hide page chrome in print */
        @media print {
          .xpot-fd-root {
            background: #fff !important;
            color: #000 !important;
            padding: 0 !important;
          }
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

        .xpot-fd-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.10);
          background: rgba(255, 255, 255, 0.03);
          text-decoration: none;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 650;
          font-size: 13px;
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
          color: rgba(255, 255, 255, 0.75);
          padding: 10px 14px;
          font-weight: 750;
          font-size: 12px;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .xpot-fd-tab.is-active {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.95);
        }

        .xpot-fd-actions {
          display: inline-flex;
          gap: 10px;
        }

        .xpot-fd-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.10);
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.9);
          font-weight: 650;
          font-size: 13px;
          cursor: pointer;
        }

        @media (max-width: 520px) {
          .xpot-fd-actions .xpot-fd-btn span {
            display: none;
          }
          .xpot-fd-btn {
            padding: 10px 10px;
          }
        }

        @media print {
          .xpot-fd-topbar {
            display: none !important;
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
        }

        .xpot-fd-face {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 60px 180px rgba(0, 0, 0, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.10);
        }

        /* Print: no 3D, no overlay borders/shadows */
        @media print {
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
            display: none !important; /* print the archive side by default */
          }
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
          font-weight: 750;
        }

        .xpot-fd-date {
          justify-self: center;
          font-weight: 700;
        }

        .xpot-fd-price {
          justify-self: end;
          font-weight: 750;
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
          font-weight: 900;
          line-height: 1.0;
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
          letter-spacing: 0.10em;
          text-transform: uppercase;
          font-weight: 800;
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

        .xpot-fd-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 860px) {
          .xpot-fd-columns {
            grid-template-columns: 1fr;
          }
        }

        .xpot-fd-col p {
          font-size: 15px;
          line-height: 1.62;
          margin: 0 0 12px;
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
          letter-spacing: 0.10em;
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
          font-weight: 900;
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

        .xpot-fd-fine {
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
          font-size: 12px;
          opacity: 0.7;
          margin-top: 10px;
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
          opacity: 0.7;
        }

        .xpot-fd-footer-dot {
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: rgba(18, 16, 12, 0.45);
          display: inline-block;
        }

        /* Print tweaks */
        @media print {
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
            opacity: 0.2 !important;
          }
          .xpot-fd-sidebox,
          .xpot-fd-quote {
            background: #fff !important;
          }
          .xpot-fd-sidebox-row {
            border-top: 1px dashed #000 !important;
            opacity: 0.85;
          }
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
            linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.0));
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
          font-weight: 850;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-size: 11px;
        }

        .xpot-fd-now-title {
          margin: 14px 0 8px;
          font-size: clamp(22px, 3.2vw, 34px);
          letter-spacing: -0.02em;
          font-weight: 900;
          line-height: 1.08;
        }

        .xpot-fd-now-sub {
          margin: 0;
          opacity: 0.85;
          line-height: 1.55;
          max-width: 70ch;
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
          font-weight: 850;
          background: #fff;
          color: #000;
        }

        .xpot-fd-now-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 800;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          text-decoration: none;
          color: rgba(255, 255, 255, 0.92);
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
          font-weight: 900;
          opacity: 0.8;
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
          opacity: 0.9;
        }

        .xpot-fd-now-copy {
          margin: 10px 0 0;
          line-height: 1.6;
          opacity: 0.9;
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
          font-weight: 850;
          font-size: 11px;
          position: relative;
          overflow: hidden;
        }

        .xpot-fd-now-footer-glow {
          position: absolute;
          inset: -40px;
          background: radial-gradient(circle at 25% 20%, rgba(56, 189, 248, 0.16), transparent 55%),
            radial-gradient(circle at 80% 30%, rgba(236, 72, 153, 0.14), transparent 60%);
          filter: blur(12px);
          opacity: 0.9;
          pointer-events: none;
        }
      `}</style>
    </main>
  );
}
