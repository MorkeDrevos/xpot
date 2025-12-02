// app/api/xpot/price/route.ts
import { NextResponse } from 'next/server';
import { TOKEN_MINT } from '@/lib/xpot';

export const dynamic = 'force-dynamic';

const JUP_PRICE_URL = 'https://price.jup.ag/v6/price';
const BIRDEYE_PRICE_URL = 'https://public-api.birdeye.so/defi/price';

const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY; // set this in Vercel

async function fetchFromBirdeye(): Promise<number | null> {
  if (!BIRDEYE_API_KEY) return null;

  try {
    const qs = new URLSearchParams({
      address: TOKEN_MINT,
      chain: 'solana',
    });

    const res = await fetch(`${BIRDEYE_PRICE_URL}?${qs.toString()}`, {
      headers: {
        'X-API-KEY': BIRDEYE_API_KEY,
        accept: 'application/json',
      },
      cache: 'no-store',
      // @ts-ignore
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[XPOT] Birdeye price error:', res.status, body);
      return null;
    }

    const json = await res.json();
    // Birdeye single-price response: { data: { value: number, ... } }
    const value = json?.data?.value;
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value; // already USD
    }
    return null;
  } catch (err) {
    console.error('[XPOT] Birdeye price fetch failed:', err);
    return null;
  }
}

async function fetchFromJupiter(): Promise<number | null> {
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
      const body = await res.text().catch(() => '');
      console.error('[XPOT] Jupiter price error:', res.status, body);
      return null;
    }

    const json = await res.json();
    const entry = json?.data?.[TOKEN_MINT];
    const price =
      entry && typeof entry.price === 'number' && !Number.isNaN(entry.price)
        ? entry.price
        : null;

    return price;
  } catch (err) {
    console.error('[XPOT] Jupiter price fetch failed:', err);
    return null;
  }
}

export async function GET() {
  try {
    // 1) Try Birdeye (matches what you see on the Birdeye token page)
    let price = await fetchFromBirdeye();

    // 2) Fallback to Jupiter if Birdeye fails / no key / null
    if (price === null) {
      price = await fetchFromJupiter();
    }

    return NextResponse.json({
      ok: price !== null,
      priceUsd: price,
    });
  } catch (err) {
    console.error('[XPOT] /api/xpot/price error:', err);
    return NextResponse.json({ ok: false, priceUsd: null });
  }
}
