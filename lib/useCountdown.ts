// lib/useCountdown.ts
'use client';

import { useEffect, useState } from 'react';

export function useCountdown(targetIso: string | null) {
  const [label, setLabel] = useState<string>('–:–:–');
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    if (!targetIso) {
      setLabel('–:–:–');
      setIsPast(false);
      return;
    }

    const target = new Date(targetIso).getTime();

    function update() {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setLabel('00:00:00');
        setIsPast(true);
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const h = Math.floor(totalSeconds / 3600)
        .toString()
        .padStart(2, '0');
      const m = Math.floor((totalSeconds % 3600) / 60)
        .toString()
        .padStart(2, '0');
      const s = Math.floor(totalSeconds % 60)
        .toString()
        .padStart(2, '0');

      setLabel(`${h}:${m}:${s}`);
      setIsPast(false);
    }

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return { label, isPast };
}
