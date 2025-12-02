// app/api/xpot/price/route.ts
import { NextResponse } from 'next/server';

// Replace with your real XPOT mint if you want real Jupiter price:
const XPOT_MINT = 'XPOT_MINT_ADDRESS_HERE';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Simple Jupiter price call, returning USD price for XPOT
    const url = `https://price.jup.ag/v6/price?ids=${XPOT_MINT}`;
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      throw new Error(`Jupiter price failed: ${res.status}`);
    }

    const json = await res.json();
    const price = json?.data?.[XPOT_MINT]?.price;

    // Fallback to 0 if something is weird with the response
    const priceUsd =
      typeof price === 'number' && !Number.isNaN(price) ? price : 0;

    return NextResponse.json({ ok: true, priceUsd });
  } catch (err) {
    console.error('[XPOT] /api/xpot/price error:', err);
    // Still respond 200 so UI doesn’t break, just with 0 price
    return NextResponse.json({ ok: false, priceUsd: 0 });
  }
}
