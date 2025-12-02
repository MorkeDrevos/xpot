// app/api/xpot/price/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// REAL XPOT MINT HERE (PANDU FOR NOW)
const XPOT_MINT = 'YOUR_XPOT_MINT_ADDRESS_HERE';

export async function GET() {
  try {
    // Ask Jupiter for USD price of the mint directly
    const url = `https://price.jup.ag/v6/price?ids=${XPOT_MINT}&vsToken=USDC`;

    const res = await fetch(url, {
      // small revalidate window so we don’t hammer Jupiter
      next: { revalidate: 10 },
    });

    if (!res.ok) {
      throw new Error(`Jupiter HTTP ${res.status}`);
    }

    const json = await res.json();

    const entry = json?.data?.[XPOT_MINT];
    const rawPrice = entry?.price;

    const price =
      typeof rawPrice === 'number'
        ? rawPrice
        : rawPrice
        ? Number(rawPrice)
        : null;

    if (!price || !Number.isFinite(price)) {
      // Jupiter answered but without a usable number
      return NextResponse.json({
        ok: true,
        priceUsd: null,
        source: 'jupiter-invalid',
      });
    }

    // This should now match Jupiter UI (0.00003319 etc)
    return NextResponse.json({
      ok: true,
      priceUsd: price,
      source: 'jupiter',
    });
  } catch (err) {
    console.error('[XPOT] /api/xpot/price error:', err);
    // No fake price, just “no data”
    return NextResponse.json({
      ok: true,
      priceUsd: null,
      source: 'error',
    });
  }
}
