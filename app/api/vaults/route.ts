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

type VaultTokenAccount = {
  tokenAccount: string; // token account pubkey
  uiAmount: number;
  amount: string;
  decimals: number;
};

type VaultEntry = {
  name: string;
  address: string; // owner wallet address

  // Kept for backward compatibility with your UI
  // (we set this to the ATA address, even if balance is elsewhere)
  ata: string;

  // Kept for backward compatibility with your UI
  // (now represents TOTAL XPOT owned by this wallet for this mint)
  balance: {
    amount: string;
    uiAmount: number;
    decimals: number;
  } | null;

  // New fields (optional for UI)
  ataExists: boolean;
  primaryTokenAccount: string | null; // where the tokens actually are (largest account)
  tokenAccounts: VaultTokenAccount[]; // all accounts for transparency

  recentTx: VaultTx[];
};

type VaultResponse = {
  mint: string;
  fetchedAt: number;
  groups: Record<string, VaultEntry[]>;
};

export async function GET() {
  try {
    const conn = new Connection(RPC, 'confirmed');
    const mint = new PublicKey(TOKEN_MINT);

    const groups: VaultResponse['groups'] = {};

    for (const [groupKey, vaults] of Object.entries(XPOT_VAULTS)) {
      const out: VaultEntry[] = [];

      for (const v of vaults) {
        const owner = new PublicKey(v.address);

        // Always compute the ATA (nice to display), but do NOT assume balance lives there.
        const ataPk = getAssociatedTokenAddressSync(mint, owner, true);
        const ata = ataPk.toBase58();

        // Pull ALL token accounts owned by this wallet for this mint (covers ATA + non-ATA)
        let tokenAccounts: VaultTokenAccount[] = [];
        try {
          const res = await conn.getTokenAccountsByOwner(owner, { mint });

          for (const { pubkey, account } of res.value) {
            try {
              // getTokenAccountBalance needs token account pubkey
              const bal = await conn.getTokenAccountBalance(pubkey);
              const ui = typeof bal.value.uiAmount === 'number' ? bal.value.uiAmount : 0;

              tokenAccounts.push({
                tokenAccount: pubkey.toBase58(),
                uiAmount: ui,
                amount: bal.value.amount,
                decimals: bal.value.decimals,
              });
            } catch {
              // ignore weird/unreadable accounts
            }
          }

          // Sort desc by uiAmount for a stable "primary"
          tokenAccounts.sort((a, b) => (b.uiAmount ?? 0) - (a.uiAmount ?? 0));
        } catch {
          tokenAccounts = [];
        }

        const ataExists = tokenAccounts.some(t => t.tokenAccount === ata);

        // Total (sum across all token accounts for this mint)
        const decimals = tokenAccounts[0]?.decimals ?? 0;
        const totalUi = tokenAccounts.reduce((sum, t) => sum + (Number.isFinite(t.uiAmount) ? t.uiAmount : 0), 0);

        // We keep `balance.amount` as a best-effort integer string.
        // If decimals is 0 this is exact. If decimals > 0, we still compute safely.
        const totalAmountRaw =
          decimals > 0
            ? Math.round(totalUi * Math.pow(10, decimals)).toString()
            : Math.round(totalUi).toString();

        const balance =
          tokenAccounts.length > 0
            ? {
                amount: totalAmountRaw,
                uiAmount: totalUi,
                decimals,
              }
            : null;

        const primaryTokenAccount = tokenAccounts[0]?.tokenAccount ?? null;

        // Recent tx (OWNER wallet) – your existing behavior
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
          ata,
          balance,
          ataExists,
          primaryTokenAccount,
          tokenAccounts,
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
