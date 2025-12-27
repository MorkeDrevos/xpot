// app/api/xpot-balance/route.ts
import { NextResponse } from 'next/server';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

import { TOKEN_MINT } from '@/lib/xpot';

export const dynamic = 'force-dynamic';

function json(res: any, status = 200) {
  return new NextResponse(JSON.stringify(res), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      pragma: 'no-cache',
      expires: '0',
    },
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) return json({ ok: false, error: 'MISSING_ADDRESS' }, 400);

    let owner: PublicKey;
    let mint: PublicKey;

    try {
      owner = new PublicKey(address);
    } catch {
      return json({ ok: false, error: 'INVALID_ADDRESS' }, 400);
    }

    try {
      mint = new PublicKey(TOKEN_MINT);
    } catch {
      return json({ ok: false, error: 'INVALID_TOKEN_MINT' }, 500);
    }

    // IMPORTANT: make sure this RPC points to the cluster your token is on.
    // If TOKEN_MINT is mainnet, use mainnet RPC. If devnet token, use devnet RPC.
    const rpc =
      process.env.SOLANA_RPC_URL ||
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      clusterApiUrl('mainnet-beta');

    const connection = new Connection(rpc, 'confirmed');

    // Sum all SPL token accounts owned by `address` for this specific mint
    const resp = await connection.getParsedTokenAccountsByOwner(owner, { mint });

    let total = 0;

    for (const { account } of resp.value) {
      const info: any = account.data?.parsed?.info;
      const tokenAmount = info?.tokenAmount;
      const uiAmount = tokenAmount?.uiAmount;

      if (typeof uiAmount === 'number') total += uiAmount;
      else {
        // fallback if uiAmount missing
        const amountStr = tokenAmount?.amount;
        const decimals = tokenAmount?.decimals;
        if (typeof amountStr === 'string' && typeof decimals === 'number') {
          const raw = Number(amountStr);
          if (Number.isFinite(raw)) total += raw / Math.pow(10, decimals);
        }
      }
    }

    // return number (your client expects `typeof balance === 'number'`)
    return json({
      ok: true,
      balance: total,
      mint: mint.toBase58(),
      clusterRpc: rpc,
      tokenAccounts: resp.value.length,
    });
  } catch (e: any) {
    console.error('[api/xpot-balance] error', e);
    return json({ ok: false, error: 'SERVER_ERROR' }, 500);
  }
}
