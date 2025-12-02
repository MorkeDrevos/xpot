// app/api/xpot/price/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// XPOT is currently using the PANDU mint
const XPOT_MINT = '4NGbC4RRrUjS78ooSN53Up7gSg4dGrj6F6dxpMWHbonk';

// Jupiter price endpoint – it will internally route via SOL if needed
const JUPITER_PRICE_URL = `https://price.jup.ag/v6/price?ids=${XPOT_MINT}&vsToken=USDC`;

export async function GET() {
  try {
    const res = await fetch(JUPITER_PRICE_URL, {
      // don’t cache aggressively – we want fresh-ish prices
      cache: 'no-store',
      // small revalidate hint for edge / ISR if Vercel wants it
      // @ts-expect-error - next-specific option
      next: { revalidate: 10 },
    });

    if (!res.ok) {
      console.error('[XPOT] Jupiter price HTTP error', res.status);
      return NextResponse.json({ ok: true, priceUsd: null, source: 'error' });
    }

    const json = await res.json();

    // v6 shape: { data: { [mint]: { price: number, ... } }, timeTaken: ... }
    const info = json?.data?.[XPOT_MINT];
    const rawPrice =
      info && typeof info.price === 'number' && Number.isFinite(info.price)
        ? info.price
        : null;

    if (rawPrice == null) {
      console.error('[XPOT] Jupiter price missing/invalid for mint', XPOT_MINT);
      return NextResponse.json({ ok: true, priceUsd: null, source: 'error' });
    }

    // This price is already “per 1 XPOT in USD” – same number you see on Jupiter UI
    return NextResponse.json({
      ok: true,
      priceUsd: rawPrice,
      source: 'jupiter',
    });
  } catch (err) {
    console.error('[XPOT] Jupiter price fetch failed', err);
    return NextResponse.json({ ok: true, priceUsd: null, source: 'error' });
  }
}
