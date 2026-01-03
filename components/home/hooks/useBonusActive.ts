// components/home/hooks/useBonusActive.ts
'use client';

import { useEffect, useState } from 'react';

export function useBonusActive() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let alive = true;

    async function probe() {
      try {
        const r = await fetch('/api/bonus/upcoming', { cache: 'no-store' });
        if (!alive) return;

        if (!r.ok) {
          setActive(false);
          return;
        }

        const data = (await r.json().catch(() => null)) as any;
        setActive(Boolean(data?.bonus?.scheduledAt));
      } catch {
        if (!alive) return;
        setActive(false);
      }
    }

    probe();
    const t = window.setInterval(probe, 15_000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);

  return active;
}
