// app/api/xpot/price/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const XPOT_MINT = '4NGbC4RRrUjS78ooSN53Up7gSg4dGrj6F6dxpMWHbonk';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzyiH8ffA9H9n1tFoZT3k';

export async function GET() {
  let priceUsd: number | null = null;
  let source: 'jupiter' | 'none' = 'none';

  try {
    const url = new URL('https://price.jup.ag/v6/price');
    url.searchParams.set('ids', XPOT_MINT);
    url.searchParams.set('vsToken', USDC_MINT);

    const res = await fetch(url.toString(), {
      next: { revalidate: 15 },
    });

    if (!res.ok) {
      throw new Error(`Jupiter HTTP ${res.status}`);
    }

    const json = await res.json();
    const raw = json?.data?.[XPOT_MINT]?.price;
    const numeric = Number(raw);

    if (Number.isFinite(numeric) && numeric > 0) {
      priceUsd = numeric;
      source = 'jupiter';
    }
  } catch (err) {
    console.error('[XPOT] /api/xpot/price Jupiter error:', err);
  }

  return NextResponse.json({
    ok: true,
    priceUsd, // null = price unavailable
    source,
  });
}
