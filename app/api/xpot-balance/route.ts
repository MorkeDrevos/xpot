// app/api/xpot-balance/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Missing address' },
        { status: 400 }
      );
    }

    const XPOT_MINT = process.env.XPOT_MINT;
    if (!XPOT_MINT) {
      console.error('XPOT_MINT env var is not set');
      return NextResponse.json(
        { error: 'XPOT_MINT not configured' },
        { status: 500 }
      );
    }

    // Fetch all XPOT token accounts for this wallet
    const res = await fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          address,
          { mint: XPOT_MINT },
          { encoding: 'jsonParsed' },
        ],
      }),
    });

    const json = await res.json();

    const accounts = json?.result?.value ?? [];
    if (!Array.isArray(accounts) || accounts.length === 0) {
      // No XPOT at all
      return NextResponse.json({
        balance: 0,
        raw: '0',
        decimals: 6,
      });
    }

    let rawTotal = 0n;
    let decimals = 6;

    for (const acc of accounts) {
      const info = acc?.account?.data?.parsed?.info;
      const tokenAmount = info?.tokenAmount;
      if (!tokenAmount?.amount) continue;

      const amountStr: string = tokenAmount.amount;
      const dec: number = tokenAmount.decimals ?? 6;

      decimals = dec; // they should all match
      rawTotal += BigInt(amountStr);
    }

    const balance =
      decimals >= 0
        ? Number(rawTotal) / Math.pow(10, decimals)
        : Number(rawTotal);

    return NextResponse.json({
      balance,
      raw: rawTotal.toString(),
      decimals,
    });
  } catch (err) {
    console.error('XPOT balance API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch XPOT balance' },
      { status: 500 }
    );
  }
}
