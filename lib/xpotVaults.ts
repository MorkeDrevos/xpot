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
  ata: string; // canonical ATA for owner+mint (may or may not be used)
  balance: {
    amount: string; // raw integer as string (sum)
    uiAmount: number; // sum in UI units
    decimals: number;
  } | null;
  // Optional debugging/trust: show where the balance is actually stored
  tokenAccounts?: {
    pubkey: string;
    amount: string;
    uiAmount: number;
  }[];
  recentTx: VaultTx[];
};

type VaultResponse = {
  mint: string;
  fetchedAt: number;
  groups: Record<string, VaultEntry[]>;
};

function safeNum(n: unknown) {
  const v = typeof n === 'number' ? n : Number(n);
  return Number.isFinite(v) ? v : 0;
}

function addBigIntStrings(a: string, b: string) {
  try {
    return (BigInt(a) + BigInt(b)).toString();
  } catch {
    // fallback (shouldn’t happen unless bad RPC response)
    return a;
  }
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

        // Canonical ATA (for display + copy convenience)
        const ata = getAssociatedTokenAddressSync(mint, owner, true);

        // ✅ Balance: sum ALL token accounts for this owner+mint
        let balance: VaultEntry['balance'] = null;
        let tokenAccounts: VaultEntry['tokenAccounts'] = [];

        try {
          const parsed = await conn.getParsedTokenAccountsByOwner(owner, { mint });

          let decimals = 0;
          let totalUi = 0;
          let totalRaw = '0';

          tokenAccounts = parsed.value.map(acc => {
            const info: any = acc.account.data?.parsed?.info;
            const tokenAmount = info?.tokenAmount;

            const uiAmount = safeNum(tokenAmount?.uiAmount);
            const amount = typeof tokenAmount?.amount === 'string' ? tokenAmount.amount : '0';
            const dec = safeNum(tokenAmount?.decimals);

            decimals = Math.max(decimals, dec);
            totalUi += uiAmount;
            totalRaw = addBigIntStrings(totalRaw, amount);

            return {
              pubkey: acc.pubkey.toBase58(),
              amount,
              uiAmount,
            };
          });

          if (parsed.value.length) {
            balance = {
              amount: totalRaw,
              uiAmount: totalUi,
              decimals,
            };
          } else {
            balance = null;
          }
        } catch {
          balance = null;
          tokenAccounts = [];
        }

        // Recent tx (owner wallet)
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
          tokenAccounts, // you can keep or remove this later
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
    return NextResponse.json({ ok: false, error: e?.message ?? 'Failed to load vaults' }, { status: 500 });
  }
}
