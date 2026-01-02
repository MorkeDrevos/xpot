'use client';

import { useEffect, useState } from 'react';
import { getNextMadridCutoffUtcMs } from './utils';

export function useMadridCountdown(cutoffHour = 22) {
  const [mounted, setMounted] = useState(false);
  const [nextDrawUtcMs, setNextDrawUtcMs] = useState<number>(0);
  const [countdownMs, setCountdownMs] = useState<number>(0);
  const [countPulse, setCountPulse] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const nd = getNextMadridCutoffUtcMs(cutoffHour, new Date());
    setNextDrawUtcMs(nd);
    setCountdownMs(Math.max(0, nd - Date.now()));
  }, [mounted, cutoffHour]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!mounted) return;

    let interval: number | null = null;

    const tick = () => {
      const nd = nextDrawUtcMs || getNextMadridCutoffUtcMs(cutoffHour, new Date());
      const now = Date.now();
      setCountdownMs(Math.max(0, nd - now));
      setCountPulse(p => !p);

      if (now >= nd) {
        const next = getNextMadridCutoffUtcMs(cutoffHour, new Date());
        setNextDrawUtcMs(next);
      }
    };

    const msToNextSecond = 1000 - (Date.now() % 1000);
    const t = window.setTimeout(() => {
      tick();
      interval = window.setInterval(tick, 1000);
    }, msToNextSecond);

    return () => {
      window.clearTimeout(t);
      if (interval) window.clearInterval(interval);
    };
  }, [nextDrawUtcMs, mounted, cutoffHour]);

  return { mounted, countdownMs, countPulse };
}
