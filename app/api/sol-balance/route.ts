// app/api/sol-balance/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address')?.trim();

    if (!address) {
      return NextResponse.json(
        { error: 'Missing address' },
        { status: 400 }
      );
    }

    const res = await fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address],
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Solana RPC failed' },
        { status: 500 }
      );
    }

    const json = await res.json();
    const lamports = json?.result?.value ?? 0;

    return NextResponse.json({ lamports }, { status: 200 });
  } catch (err) {
    console.error('SOL balance API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
