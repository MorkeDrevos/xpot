// lib/xpot.ts

type TokenConfig = {
  SYMBOL: string;
  MINT: string;
  REQUIRED: number;
};

/* ENV MODE */
export const IS_DEV_XPOT = false;

/* POOL SIZE (CHANGE HERE ONLY) */
export const XPOT_POOL_SIZE = 1_000_000;

/* TOKENS */

// PRODUCTION TOKEN
const PROD: TokenConfig = {
  SYMBOL: 'XPOT',
  MINT: 'FYeJCZvfzwUcFLq7mr82zJFu8qvoJ3kQB3W1kd1Ejko1',
  REQUIRED: 100_000,
};

// DEV TOKEN
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

/* CANONICAL MINT ACCOUNT (used across app for proof links) */
export const XPOT_MINT_ACCOUNT = TOKEN_MINT;

/* STREAMFLOW (CANONICAL HELPERS) */
export function streamflowDashboardUrl(mint: string = XPOT_MINT_ACCOUNT) {
  return `https://app.streamflow.finance/token-dashboard/solana/mainnet/${mint}`;
}

export function streamflowContractUrl(contractAccount: string, mint: string = XPOT_MINT_ACCOUNT) {
  return `${streamflowDashboardUrl(mint)}/contract/${contractAccount}`;
}

/* SWAP URL */
export function getXpotSwapUrl(wallet?: string) {
  const userParam = wallet ? `?user=${wallet}` : '';
  return `https://jup.ag/swap/SOL-${TOKEN_MINT}${userParam}`;
}
