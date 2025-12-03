// app/api/xpot/price/route.ts
import { NextResponse } from 'next/server';
import { TOKEN_MINT } from '@/lib/xpot';

export const dynamic = 'force-dynamic';

const JUP_PRICE_URL = 'https://price.jup.ag/v6/price';

export async function GET() {
  try {
    // Ask Jupiter for the USD price of the active XPOT token (PROD or DEV)
    const qs = new URLSearchParams({
      ids: TOKEN_MINT,  // mint address from lib/xpot (single source of truth)
      vsToken: 'USDC',  // quote in USDC ~ USD
    });

    const res = await fetch(`${JUP_PRICE_URL}?${qs.toString()}`, {
      cache: 'no-store',
      // @ts-ignore - Next.js "next" is allowed here in app router
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error('[xpot/price] Jupiter HTTP error', res.status);
      return NextResponse.json(
        { ok: false, error: 'JUPITER_ERROR' },
        { status: 502 },
      );
    }

    const json = await res.json();

    // Jupiter v6 shape: { data: { [mint]: { price: number, ... } } }
    const tokenData = json?.data?.[TOKEN_MINT];

    const priceField =
      typeof tokenData?.price === 'number'
        ? tokenData.price
        : typeof tokenData?.priceUsd === 'number'
        ? tokenData.priceUsd
        : undefined;

    if (typeof priceField !== 'number' || Number.isNaN(priceField)) {
      console.error('[xpot/price] Missing price in Jupiter response', json);
      return NextResponse.json(
        { ok: false, error: 'NO_PRICE' },
        { status: 500 },
      );
    }

    const priceUsd = priceField;

    return NextResponse.json({ ok: true, priceUsd });
  } catch (err) {
    console.error('[xpot/price] Unexpected error', err);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
