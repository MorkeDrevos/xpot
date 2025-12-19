// app/api/vaults/route.ts
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

type VaultTx = {
  signature: string;
  blockTime: number | null;
  err: unknown | null;
};

type VaultEntry = {
  name: string;
  address: string; // owner wallet address
  ata: string; // XPOT associated token account for owner
  balance: {
    amount: string; // raw (integer as string)
    uiAmount: number; // float
    decimals: number;
  } | null;
  recentTx: VaultTx[];
};

type VaultResponse = {
  mint: string;
  fetchedAt: number;
  groups: Record<string, VaultEntry[]>;
};

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

export async function GET() {
  try {
    const conn = new Connection(RPC, 'confirmed');
    const mint = new PublicKey(TOKEN_MINT);

    const groups: VaultResponse['groups'] = {};

    for (const [groupKey, vaults] of Object.entries(XPOT_VAULTS)) {
      const out: VaultEntry[] = [];

      for (const v of vaults) {
        const owner = new PublicKey(v.address);
        const ata = getAssociatedTokenAddressSync(mint, owner, true);

        // Balance
        let balance: VaultEntry['balance'] = null;
        try {
          const bal = await conn.getTokenAccountBalance(ata);
          const ui = typeof bal.value.uiAmount === 'number' ? bal.value.uiAmount : 0;
          balance = {
            amount: bal.value.amount,
            uiAmount: ui,
            decimals: bal.value.decimals,
          };
        } catch {
          // account may not exist yet - keep null
          balance = null;
        }

        // Recent tx (for the OWNER wallet, not ATA - easier to understand)
        let recentTx: VaultTx[] = [];
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
          address: v.address,
          ata: ata.toBase58(),
          balance,
          recentTx,
        });
      }

      groups[groupKey] = out;
    }

    const body: VaultResponse = {
      mint: TOKEN_MINT,
      fetchedAt: Date.now(),
      groups,
    };

    return NextResponse.json(body);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Failed to load vaults' },
      { status: 500 },
    );
  }
}
