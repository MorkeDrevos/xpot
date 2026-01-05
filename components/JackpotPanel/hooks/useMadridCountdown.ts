// components/JackpotPanel/hooks/useMadridCountdown.ts
'use client';

import { useEffect, useState } from 'react';
import { getNextMadridCutoffUtcMs } from '../utils/madrid';

export function useMadridCountdown(cutoffHour = 22) {
  const [mounted, setMounted] = useState(false);
  const [countdownMs, setCountdownMs] = useState(0);
  const [countPulse, setCountPulse] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let raf = 0;
    let timer: number | null = null;
    let lastSecond = -1;

    const update = () => {
      const now = Date.now();
      const next = getNextMadridCutoffUtcMs(cutoffHour, new Date(now));
      const left = Math.max(0, next - now);
      setCountdownMs(left);

      const sec = Math.floor(left / 1000);
      if (sec !== lastSecond) {
        lastSecond = sec;
        setCountPulse(true);
        window.setTimeout(() => setCountPulse(false), 140);
      }
    };

    const tick = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    tick();
    timer = window.setInterval(tick, 250);

    return () => {
      if (timer !== null) window.clearInterval(timer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [cutoffHour]);

  return { mounted, countdownMs, countPulse };
}
