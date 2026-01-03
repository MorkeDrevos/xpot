// components/home/hero/LiveControlRoom.tsx
'use client';

import { useEffect, useState } from 'react';

function useLocalReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(Boolean(m.matches));
    apply();
    m.addEventListener?.('change', apply);
    return () => m.removeEventListener?.('change', apply);
  }, []);
  return reduced;
}

function buildInitialLines(countdown: string, cutoffLabel: string, runLine: string) {
  return [
    `> XPOT_PROTOCOL`,
    `  run:            ${runLine}`,
    `  primitive:      daily reward selection`,
    `  eligibility:    hold XPOT (min threshold applies)`,
    `  identity:       @handle-first (not wallet profiles)`,
    `  proof:          on-chain payout verification`,
    ``,
    `> NEXT_DRAW`,
    `  in:             ${countdown}  (${cutoffLabel})`,
    ``,
    `> SESSION`,
    `  heartbeat:      ok`,
    `  status:         run telemetry`,
  ];
}

function updateLines(prev: string[], tick: number, countdown: string, cutoffLabel: string, runLine: string) {
  const next = [...prev];

  const runIdx = next.findIndex(l => l.trim().startsWith('run:'));
  if (runIdx !== -1) next[runIdx] = `  run:            ${runLine}`;

  const idx = next.findIndex(l => l.trim().startsWith('in:'));
  if (idx !== -1) next[idx] = `  in:             ${countdown}  (${cutoffLabel})`;

  const hbIdx = next.findIndex(l => l.trim().startsWith('heartbeat:'));
  if (hbIdx !== -1) next[hbIdx] = `  heartbeat:      ${tick % 9 === 0 ? 'sync' : 'ok'}`;

  const stIdx = next.findIndex(l => l.trim().startsWith('status:'));
  if (stIdx !== -1) {
    const modes = ['run telemetry', 'proof verify', 'pool telemetry', 'entry window open'];
    next[stIdx] = `  status:         ${modes[tick % modes.length]}`;
  }

  if (tick > 0 && tick % 7 === 0) {
    const stamp = String(tick).padStart(4, '0');
    const events = [
      `tick ${stamp}: eligibility index ok`,
      `tick ${stamp}: identity cache warm`,
      `tick ${stamp}: proof cache updated`,
      `tick ${stamp}: entry window open`,
      `tick ${stamp}: liquidity signal stable`,
    ];
    const line = `  log:            ${events[tick % events.length]}`;
    const insertAt = Math.max(0, next.length - 1);
    next.splice(insertAt, 0, line);
    while (next.length > 22) next.splice(insertAt, 1);
  }

  return next;
}

export default function LiveControlRoom({
  countdown,
  cutoffLabel,
  runLine,
}: {
  countdown: string;
  cutoffLabel: string;
  runLine: string;
}) {
  const reduced = useLocalReducedMotion();
  const [tick, setTick] = useState(0);
  const [lines, setLines] = useState<string[]>(() => buildInitialLines(countdown, cutoffLabel, runLine));

  useEffect(() => {
    const t = window.setInterval(() => setTick(v => v + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    setLines(prev => updateLines(prev, tick, countdown, cutoffLabel, runLine));
  }, [tick, countdown, cutoffLabel, runLine]);

  const scanCls = reduced ? '' : 'xpot-cr-scan';

  return (
    <div className="relative">
      <style jsx global>{`
        @keyframes xpotScan {
          0% {
            transform: translateY(-18%);
            opacity: 0;
          }
          18% {
            opacity: 0.22;
          }
          55% {
            opacity: 0.1;
          }
          100% {
            transform: translateY(118%);
            opacity: 0;
          }
        }
        @keyframes xpotFlicker {
          0% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.75;
          }
          100% {
            opacity: 0.35;
          }
        }
        .xpot-cr-scan {
          position: relative;
          isolation: isolate;
        }
        .xpot-cr-scan::before {
          content: '';
          pointer-events: none;
          position: absolute;
          inset: 0;
          border-radius: 18px;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(16, 185, 129, 0.1),
            rgba(56, 189, 248, 0.07),
            transparent
          );
          opacity: 0;
          transform: translateY(-20%);
          animation: xpotScan 5.6s ease-in-out infinite;
          mix-blend-mode: screen;
          z-index: 0;
        }
        .xpot-cr-scan > * {
          position: relative;
          z-index: 1;
        }
        .xpot-cr-cursor {
          display: inline-block;
          width: 8px;
          height: 14px;
          margin-left: 6px;
          background: rgba(16, 185, 129, 0.75);
          box-shadow: 0 0 16px rgba(52, 211, 153, 0.6);
          border-radius: 2px;
          vertical-align: -2px;
          animation: xpotFlicker 1.1s ease-in-out infinite;
        }
      `}</style>

      <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-emerald-200/80">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
          Control Room - session view
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="font-mono text-emerald-200/70">read-only</span>
        </span>
      </div>

      <div
        className={[
          'relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-emerald-950/20',
          'p-4 pb-5 shadow-[0_18px_60px_rgba(15,23,42,0.9)]',
          scanCls,
        ].join(' ')}
      >
        <div className="pointer-events-none absolute -inset-20 opacity-65 blur-3xl bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(circle_at_88%_30%,rgba(56,189,248,0.12),transparent_65%)]" />

        <pre className="relative z-10 max-h-60 overflow-auto whitespace-pre pr-2 pb-1 font-mono text-[11px] leading-relaxed text-emerald-100/90">
          {lines.join('\n')}
        </pre>

        <div className="relative z-10 mt-2 text-[11px] leading-snug text-emerald-200/75">
          Live cockpit feed - updates every 1s
          <span className="xpot-cr-cursor" />
        </div>
      </div>

      <p className="mt-3 text-[12px] text-slate-400">
        Read-only cockpit view. Run is public. Identity stays handle-first. Proof stays on-chain.
      </p>
    </div>
  );
}
