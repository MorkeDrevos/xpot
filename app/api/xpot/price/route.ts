import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const XPOT_MINT = '4NGbC4RRrUjS78ooSN53Up7gSg4dGrj6F6dxpMWHbonk';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// 1) XPOT → SOL
const XPOT_SOL_URL = `https://price.jup.ag/v6/price?ids=${XPOT_MINT}&vsToken=${SOL_MINT}`;
// 2) SOL → USD
const SOL_USD_URL = `https://price.jup.ag/v6/price?ids=${SOL_MINT}&vsToken=USDC`;

export async function GET() {
  try {
    const [xpotRes, solRes] = await Promise.all([
      fetch(XPOT_SOL_URL, { cache: 'no-store' }),
      fetch(SOL_USD_URL, { cache: 'no-store' }),
    ]);

    if (!xpotRes.ok || !solRes.ok) {
      return NextResponse.json({ ok: true, priceUsd: null, source: 'error' });
    }

    const xpotJson = await xpotRes.json();
    const solJson = await solRes.json();

    const xpotSol = xpotJson?.data?.[XPOT_MINT]?.price;
    const solUsd = solJson?.data?.[SOL_MINT]?.price;

    if (typeof xpotSol !== 'number' || typeof solUsd !== 'number') {
      console.error('[XPOT] Invalid Jupiter data', { xpotSol, solUsd });
      return NextResponse.json({ ok: true, priceUsd: null, source: 'error' });
    }

    const priceUsd = xpotSol * solUsd;

    return NextResponse.json({
      ok: true,
      priceUsd,
      source: 'jupiter (SOL)',
    });

  } catch (err) {
    console.error('[XPOT] Price fetch failed', err);
    return NextResponse.json({ ok: true, priceUsd: null, source: 'error' });
  }
}
