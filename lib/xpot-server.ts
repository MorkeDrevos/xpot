// lib/xpot-server.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { REQUIRED_XPOT } from './xpot';

// TODO: set your real RPC + XPOT mint in env
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const XPOT_MINT = new PublicKey(process.env.XPOT_MINT as string); // e.g. 'So11111111111111111111111111111111111111112'

const connection = new Connection(RPC_URL, 'confirmed');

export async function hasRequiredXpotBalance(walletAddress: string) {
  if (!XPOT_MINT) {
    // Temporary dev mode: skip strict check
    console.warn('XPOT_MINT not set, skipping XPOT balance check');
    return true;
  }

  const walletPubkey = new PublicKey(walletAddress);
  const ata = await getAssociatedTokenAddress(XPOT_MINT, walletPubkey);

  try {
    const account = await getAccount(connection, ata);
    const balance = Number(account.amount); // raw token units

    return balance >= REQUIRED_XPOT;
  } catch (err) {
    // No ATA or no tokens → definitely not enough XPOT
    return false;
  }
}
