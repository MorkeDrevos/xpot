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
      // @ts-ignore – Next.js app router hint
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[XPOT] Jupiter price HTTP error', res.status, text);
      return NextResponse.json(
        { ok: false, priceUsd: null, error: 'JUPITER_FETCH_FAILED' },
        { status: 500 },
      );
    }

    const json = (await res.json()) as any;

    // v6 format: { data: { [mint]: { price: number, ... } } }
    const raw =
      json?.data?.[TOKEN_MINT]?.price ??
      json?.data?.[TOKEN_MINT]?.priceUsd ??
      null;

    if (typeof raw !== 'number' || !Number.isFinite(raw)) {
      console.error('[XPOT] Jupiter price missing for mint', TOKEN_MINT, json);
      return NextResponse.json(
        { ok: false, priceUsd: null, error: 'PRICE_NOT_FOUND' },
        { status: 500 },
      );
    }

    const priceUsd = raw;

    return NextResponse.json({ ok: true, priceUsd });
  } catch (err) {
    console.error('[XPOT] Jupiter price exception', err);
    return NextResponse.json(
      { ok: false, priceUsd: null, error: 'UNEXPECTED_ERROR' },
      { status: 500 },
    );
  }
}
