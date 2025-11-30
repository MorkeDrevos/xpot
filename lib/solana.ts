// lib/solana.ts
import { Connection, PublicKey } from '@solana/web3.js';
import {
  getAccount,
  getAssociatedTokenAddress,
  getMint,
} from '@solana/spl-token';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const XPOT_MINT = process.env.XPOT_MINT;

if (!XPOT_MINT) {
  console.warn('XPOT_MINT env var is not set – XPOT balance checks will fail.');
}

const connection = new Connection(RPC_URL, 'confirmed');
const XPOT_MINT_KEY = XPOT_MINT ? new PublicKey(XPOT_MINT) : null;

let cachedDecimals: number | null = null;

async function getXpotDecimals() {
  if (!XPOT_MINT_KEY) throw new Error('XPOT_MINT not configured');
  if (cachedDecimals !== null) return cachedDecimals;

  const mintInfo = await getMint(connection, XPOT_MINT_KEY);
  cachedDecimals = mintInfo.decimals;
  return cachedDecimals;
}

/**
 * Returns XPOT balance in "normal" tokens (not raw lamports),
 * e.g. 1234.56 = 1,234.56 XPOT
 */
export async function getXpotBalanceUi(walletAddress: string): Promise<number> {
  if (!XPOT_MINT_KEY) throw new Error('XPOT_MINT not configured');

  const owner = new PublicKey(walletAddress);
  const ata = await getAssociatedTokenAddress(XPOT_MINT_KEY, owner);

  try {
    const account = await getAccount(connection, ata);
    const decimals = await getXpotDecimals();
    const rawAmount = account.amount; // bigint

    const divisor = 10 ** decimals;
    return Number(rawAmount) / divisor;
  } catch (err: any) {
    const msg = String(err?.message || '');

    // If wallet has no XPOT ATA yet, treat as 0 XPOT
    if (
      msg.includes('could not find account') ||
      msg.includes('TokenAccountNotFoundError')
    ) {
      return 0;
    }

    throw err;
  }
}
