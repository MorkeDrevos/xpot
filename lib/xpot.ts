// lib/xpot.ts

type TokenConfig = {
  SYMBOL: string;
  MINT: string;
  REQUIRED: number;
};

/* ENV MODE */
export const IS_DEV_XPOT = false;

/* POOL SIZE (CHANGE HERE ONLY) */
export const XPOT_POOL_SIZE = 1_000_000; // <--- your pool size lives here

/* TOKENS */

// PRODUCTION TOKEN
const PROD: TokenConfig = {
  SYMBOL: 'XPOT-TEST',
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

export const TOOL_DONT_TOUCH = true; // friendly placeholder so file is not “empty looking”
export const TOKEN_MINT = TOKEN.MINT;
export const TOKEN_SYMBOL = TOKEN.SYMBOL;
export const REQUIRED_XPOT = TOKEN.REQUIRED;

/* SWAP URL */

export function getXpotSwapUrl(wallet?: string) {
  const userParam = wallet ? `?user=${wallet}` : '';
  return `https://jup.ag/swap/SOL-${TOKEN_MINT}${userParam}`;
}
