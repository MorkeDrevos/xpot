import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

import { TOKEN_MINT } from '@/lib/xpot';
import { XPOT_VAULTS } from '@/lib/xpotVaults';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const RPC =
  process.env.SOLANA_RPC_URL ||
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
  'https://api.mainnet-beta.solana.com';

function clean(s: string) {
  return (s ?? '').trim();
}

function pk(label: string, value: string) {
  try {
    return new PublicKey(clean(value));
  } catch (e: any) {
    // Return a very explicit error
    throw new Error(`${label} is not a valid base58 pubkey: "${value}"`);
  }
}

export async function GET() {
  try {
    const conn = new Connection(RPC, 'confirmed');

    // ✅ This will now tell you if TOKEN_MINT is the bad one
    const mint = pk('TOKEN_MINT', TOKEN_MINT);

    const groups: any = {};

    for (const [groupKey, vaults] of Object.entries(XPOT_VAULTS)) {
      const out: any[] = [];

      for (const v of vaults) {
        // ✅ This will now tell you exactly which vault address is bad
        const owner = pk(`Vault address (${groupKey} - ${v.name})`, v.address);

        const ata = getAssociatedTokenAddressSync(mint, owner, true);

        let balance = null;
        try {
          const bal = await conn.getTokenAccountBalance(ata);
          balance = {
            amount: bal.value.amount,
            uiAmount: typeof bal.value.uiAmount === 'number' ? bal.value.uiAmount : 0,
            decimals: bal.value.decimals,
          };
        } catch {
          balance = null;
        }

        let recentTx: any[] = [];
        try {
          const sigs = await conn.getSignaturesForAddress(owner, { limit: 5 });
          recentTx = sigs.map(s => ({
            signature: s.signature,
            blockTime: s.blockTime ?? null,
            err: (s.err as any) ?? null,
          }));
        } catch {
          recentTx = [];
        }

        out.push({
          name: v.name,
          address: owner.toBase58(),
          ata: ata.toBase58(),
          balance,
          recentTx,
        });
      }

      groups[groupKey] = out;
    }

    return NextResponse.json({
      ok: true,
      mint: mint.toBase58(),
      fetchedAt: Date.now(),
      groups,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Failed to load vaults' },
      { status: 500 },
    );
  }
}
