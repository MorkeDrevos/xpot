import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'MISSING_ADDRESS' }, { status: 400 });
    }

    const XPOT_MINT = process.env.XPOT_MINT;
    if (!XPOT_MINT) {
      return NextResponse.json({ error: 'XPOT_MINT_NOT_SET' }, { status: 500 });
    }

    const res = await fetch(RPC_URL, {
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

    let raw = 0n;
    let decimals = 6;

    for (const acc of accounts) {
      const amt = acc?.account?.data?.parsed?.info?.tokenAmount;
      if (!amt?.amount) continue;
      decimals = amt.decimals ?? 6;
      raw += BigInt(amt.amount);
    }

    const balance = Number(raw) / Math.pow(10, decimals);

    return NextResponse.json({
      ok: true,
      balance,
      raw: raw.toString(),
      decimals,
    });
  } catch (e) {
    console.error('[XPOT_BALANCE]', e);
    return NextResponse.json({ error: 'BALANCE_FAILED' }, { status: 500 });
  }
}
