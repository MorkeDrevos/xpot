// app/api/xpot/price/route.ts

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// TEMP: hard-coded dev price so the route always works.
// 1 XPOT = $0.000031  → 1,000,000 XPOT ≈ $31
const DEV_PRICE_USD = 0.000031;

export async function GET() {
  try {
    // For now just return a fixed price so there are no failures.
    // When you want real Jupiter price again, we can re-enable it.
    return NextResponse.json({
      ok: true,
      priceUsd: DEV_PRICE_USD,
    });
  } catch (err) {
    console.error('[XPOT] /api/xpot/price error:', err);
    // Still respond 200 so UI doesn’t break
    return NextResponse.json({ ok: false, priceUsd: 0 });
  }
}
