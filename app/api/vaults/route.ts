// app/api/vaults/route.ts
import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, getMint } from '@solana/spl-token';

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
  address: string;
  ata: string;
  balance: {
    amount: string;
    uiAmount: number;
    decimals: number;
  } | null;
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

  // ✅ add these
  mintAuthority: string | null;
  freezeAuthority: string | null;
  mintDecimals: number | null;

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
    return a;
  }
}

export async function GET() {
  try {
    const conn = new Connection(RPC, 'confirmed');
    const mintPk = new PublicKey(TOKEN_MINT);

    // ✅ Mint metadata (authority lives here, not in vault wallets)
    let mintAuthority: string | null = null;
    let freezeAuthority: string | null = null;
    let mintDecimals: number | null = null;

    try {
      const mintInfo = await getMint(conn, mintPk);
      mintAuthority = mintInfo.mintAuthority ? mintInfo.mintAuthority.toBase58() : null;
      freezeAuthority = mintInfo.freezeAuthority ? mintInfo.freezeAuthority.toBase58() : null;
      mintDecimals = typeof mintInfo.decimals === 'number' ? mintInfo.decimals : null;
    } catch {
      // keep nulls - UI can show “Unknown”
    }

    const groups: VaultResponse['groups'] = {};

    for (const [groupKey, vaults] of Object.entries(XPOT_VAULTS)) {
      const out: VaultEntry[] = [];

      for (const v of vaults) {
        const owner = new PublicKey(v.address);
        const ata = getAssociatedTokenAddressSync(mintPk, owner, true);

        let balance: VaultEntry['balance'] = null;
        let tokenAccounts: VaultEntry['tokenAccounts'] = [];

        try {
          const parsed = await conn.getParsedTokenAccountsByOwner(owner, { mint: mintPk });

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

            return { pubkey: acc.pubkey.toBase58(), amount, uiAmount };
          });

          balance = parsed.value.length ? { amount: totalRaw, uiAmount: totalUi, decimals } : null;
        } catch {
          balance = null;
          tokenAccounts = [];
        }

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
          tokenAccounts,
          recentTx,
        });
      }

      groups[groupKey] = out;
    }

    const body: VaultResponse = {
      mint: TOKEN_MINT,
      fetchedAt: Date.now(),
      mintAuthority,
      freezeAuthority,
      mintDecimals,
      groups,
    };

    return NextResponse.json(body);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Failed to load vaults' }, { status: 500 });
  }
}
