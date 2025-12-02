// app/api/xpot/price/route.ts
import { NextResponse } from 'next/server';
import { TOKEN_MINT } from '@/lib/xpot';

export const dynamic = 'force-dynamic';

const JUP_PRICE_URL = 'https://price.jup.ag/v6/price';

export async function GET() {
  try {
    // Ask Jupiter for the USD price of the active XPOT token (PROD or DEV)
    const qs = new URLSearchParams({
      ids: TOKEN_MINT,   // mint address from lib/xpot
      vsToken: 'USDC',   // quote in USDC ~ USD
    });

    const res = await fetch(`${JUP_PRICE_URL}?${qs.toString()}`, {
      cache: 'no-store',
      // @ts-ignore - Next.js "next" is allowed here in app router
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[XPOT] Jupiter price error:', res.status, body);
      // Still return 200 so UI doesn’t break
      return NextResponse.json({ ok: false, priceUsd: null });
    }

    const json = await res.json();
    const entry = json?.data?.[TOKEN_MINT];

    const price =
      entry && typeof entry.price === 'number' && !Number.isNaN(entry.price)
        ? entry.price
        : null;

    return NextResponse.json({
      ok: !!price,
      priceUsd: price,
    });
  } catch (err) {
    console.error('[XPOT] /api/xpot/price error:', err);
    // Keep response format stable
    return NextResponse.json({ ok: false, priceUsd: null });
  }
}
