// app/api/xpot/price/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// TEMP: use your current dev mint (PANDU / XPOT test mint)
// Replace this with the real XPOT mint later.
const XPOT_MINT =
  process.env.NEXT_PUBLIC_XPOT_MINT ??
  '4NGbC4RRrUjS78ooSN53Up7gSg4dGrj6F6dxpMWHbonk';

export async function GET() {
  try {
    // If for some reason we still don’t have a mint, just return a fake price
    if (!XPOT_MINT || XPOT_MINT === 'XPOT_MINT_ADDRESS_HERE') {
      const fallbackPrice = 0.000031; // $31 for 1,000,000 XPOT
      return NextResponse.json({ ok: true, priceUsd: fallbackPrice });
    }

    const url = `https://price.jup.ag/v6/price?ids=${encodeURIComponent(
      XPOT_MINT,
    )}`;

    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      throw new Error(`Jupiter price failed: ${res.status}`);
    }

    const json = (await res.json()) as any;
    const record = json?.data?.[XPOT_MINT];
    const price =
      record && typeof record.price === 'number' && !Number.isNaN(record.price)
        ? record.price
        : 0;

    const priceUsd = price > 0 ? price : 0;

    return NextResponse.json({ ok: true, priceUsd });
  } catch (err) {
    console.error('[XPOT] /api/xpot/price error:', err);
    // Still respond 200 so the UI just shows $0 instead of breaking
    return NextResponse.json({ ok: false, priceUsd: 0 });
  }
}
