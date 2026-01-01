// app/api/token/supply/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

function asNumber(x: any) {
  const n = typeof x === 'number' ? x : Number(x);
  return Number.isFinite(n) ? n : null;
}

async function trySolscan(mint: string) {
  // Solscan's public API can be rate-limited - we treat it as best-effort.
  const url = `https://public-api.solscan.io/token/meta?tokenAddress=${mint}`;
  const res = await fetch(url, {
    // some edge/CDNs behave better with UA
    headers: { accept: 'application/json', 'user-agent': 'xpot/1.0' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`solscan ${res.status}`);
  const j: any = await res.json();

  // Solscan shapes vary; try common fields.
  const decimals = asNumber(j?.decimals ?? j?.tokenInfo?.decimals);
  const supplyRaw =
    typeof j?.supply === 'string'
      ? j.supply
      : typeof j?.tokenInfo?.supply === 'string'
        ? j.tokenInfo.supply
        : null;

  if (decimals == null || !supplyRaw) return null;

  // build uiAmount
  const raw = BigInt(supplyRaw);
  const base = BigInt(10) ** BigInt(Math.max(0, Math.min(18, decimals)));
  const whole = raw / base;
  const frac = raw % base;
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
  const uiAmountString = fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();

  return {
    source: 'solscan' as const,
    decimals,
    supplyRaw: supplyRaw,
    uiAmountString,
  };
}

async function tryRpc(mint: string) {
  const rpc =
    process.env.SOLANA_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    'https://api.mainnet-beta.solana.com';

  const conn = new Connection(rpc, 'confirmed');
  const pk = new PublicKey(mint);
  const r = await conn.getTokenSupply(pk);

  const decimals = r.value.decimals;
  const supplyRaw = r.value.amount; // string
  const uiAmountString = r.value.uiAmountString ?? null;

  if (typeof supplyRaw !== 'string') return null;

  return {
    source: 'rpc' as const,
    decimals,
    supplyRaw,
    uiAmountString: uiAmountString || null,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mint = (searchParams.get('mint') || '').trim();

  if (!mint) {
    return NextResponse.json({ ok: false, error: 'Missing mint' }, { status: 400 });
  }

  const fetchedAt = Date.now();

  try {
    // 1) Solscan first
    try {
      const s = await trySolscan(mint);
      if (s) {
        return NextResponse.json({ ok: true, mint, fetchedAt, ...s });
      }
    } catch {
      // ignore, fallback below
    }

    // 2) RPC fallback
    const r = await tryRpc(mint);
    if (!r) throw new Error('rpc no data');

    return NextResponse.json({ ok: true, mint, fetchedAt, ...r });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, mint, fetchedAt, error: e?.message || 'Failed to fetch supply' },
      { status: 500 },
    );
  }
}
