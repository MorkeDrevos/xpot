// lib/xpot.ts

type TokenConfig = {
  SYMBOL: string;
  MINT: string;
  REQUIRED: number;
};

/* ENV MODE */
export const IS_DEV_XPOT = false;

/* POOL SIZE (CHANGE HERE ONLY) */
export const XPOT_POOL_SIZE = 1_000_000; // daily pool size

/* TOKENS */

// PRODUCTION TOKEN
const PROD: TokenConfig = {
  SYMBOL: 'XPOT',
  MINT: 'FYeJCZvfzwUcFLq7mr82zJFu8qvoJ3kQB3W1kd1Ejko1',
  REQUIRED: 100_000,
};

// DEV TOKEN (same mint on purpose for now)
const DEV: TokenConfig = {
  SYMBOL: 'XPOT-DEV',
  MINT: 'FYeJCZvfzwUcFLq7mr82zJFu8qvoJ3kQB3W1kd1Ejko1',
  REQUIRED: 100_000,
};

export const TOKEN = IS_DEV_XPOT ? DEV : PROD;

/* NORMALISED EXPORTS */

export const TOKEN_MINT = TOKEN.MINT;
export const TOKEN_SYMBOL = TOKEN.SYMBOL;
export const REQUIRED_XPOT = TOKEN.REQUIRED;

/**
 * Canonical XPOT mint export
 * Use this everywhere instead of hardcoding
 */
export const XPOT_MINT_ACCOUNT = TOKEN_MINT;

/* STREAMFLOW (canonical helper) */

/**
 * Builds the correct Streamflow token-dashboard URL
 * This avoids broken / almost-404 links
 */
export function getStreamflowContractUrl(contractAccount: string) {
  return `https://app.streamflow.finance/token-dashboard/solana/mainnet/${XPOT_MINT_ACCOUNT}/contract/${contractAccount}`;
}

/* SWAP URL */

export function getXpotSwapUrl(wallet?: string) {
  const userParam = wallet ? `?user=${wallet}` : '';
  return `https://jup.ag/swap/SOL-${TOKEN_MINT}${userParam}`;
}
