// components/home/hooks/useLatestWinner.ts
'use client';

import { useEffect, useState } from 'react';

export type WinnerRow = {
  id: string;
  handle: string | null;
  wallet: string | null;
  amount: number | null;
  drawDate: string | null; // ISO
  txUrl?: string | null;
  isPaidOut?: boolean;
};

async function fetchFirstOk<T = any>(urls: string[]): Promise<T | null> {
  for (const url of urls) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) continue;
      const data = (await r.json().catch(() => null)) as T | null;
      if (data) return data;
    } catch {
      // try fallbacks
    }
  }
  return null;
}

export function useLatestWinner() {
  const [winner, setWinner] = useState<WinnerRow | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      const data = await fetchFirstOk<any>([
        '/api/public/winners/latest',
        '/api/winners/recent?limit=1',
      ]);

      if (!alive) return;

      // /api/public/winners/latest -> { ok, winner }
      if (data?.winner) {
        setWinner(data.winner as WinnerRow);
        return;
      }

      // /api/winners/recent -> { ok, winners: [...] }
      if (Array.isArray(data?.winners) && data.winners[0]) {
        const w = data.winners[0];
        setWinner({
          id: w.id,
          handle: w.handle ?? null,
          wallet: w.walletAddress ?? null,
          amount: null,
          drawDate: w.drawDate ?? null,
        });
        return;
      }

      setWinner(null);
    }

    load();
    const t = window.setInterval(load, 12_000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);

  return winner;
}
