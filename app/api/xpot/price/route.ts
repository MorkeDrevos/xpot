// app/api/xpot/price/route.ts
import { NextResponse } from 'next/server';
import { TOKEN_MINT } from '@/lib/xpot';

export const dynamic = 'force-dynamic';

const JUP_PRICE_URL = 'https://price.jup.ag/v6/price';

export async function GET() {
  try {
    const qs = new URLSearchParams({
      ids: TOKEN_MINT,
      vsToken: 'USDC',
    });

    const res = await fetch(`${JUP_PRICE_URL}?${qs.toString()}`, {
      cache: 'no-store',
      // @ts-ignore
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`Jupiter error: ${res.status}`);
    }

    const json = await res.json();
    const info = json.data?.[TOKEN_MINT];
    const priceUsd = typeof info?.price === 'number' ? info.price : null;

    return NextResponse.json({ priceUsd });
  } catch (err) {
    console.error('[XPOT] price API error', err);
    return NextResponse.json({ priceUsd: null }, { status: 500 });
  }
}
