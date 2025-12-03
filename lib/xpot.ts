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
  SYMBOL: 'SOL',
  MINT: 'pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn',
  REQUIRED: 100_000,
};

// DEV TOKEN
const DEV: TokenConfig = {
  SYMBOL: 'BONK',
  MINT: 'DezXAZ8z7PnrnRJjz3wXBoHyRnHv7QBB7aLteS7r2N6v',
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
