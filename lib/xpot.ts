// lib/xpot.ts

type TokenConfig = {
  SYMBOL: string;
  MINT: string;
  REQUIRED: number; // minimum tokens required to join the draw
};

/* ENV MODE */

// true  → use DEV token (for local / staging / testing)
// false → use PROD token (real XPOT / PANDU live token)
export const IS_DEV_XPOT = false; // set to false at real launch

/* TOKENS */

// PRODUCTION TOKEN (real XPOT ticket token)
const PROD: TokenConfig = {
  SYMBOL: 'SOL',
  MINT: 'So11111111111111111111111111111111111111112',
  REQUIRED: 100_000,
};

// DEV / TEST TOKEN
const DEV: TokenConfig = {
  SYMBOL: 'BONK',
  MINT: 'DezXAZ8z7PnrnRJjz3wXBoHyRnHv7QBB7aLteS7r2N6v',
  REQUIRED: 100_000,
};

// Active token based on mode
export const TOKEN: TokenConfig = IS_DEV_XPOT ? DEV : PROD;

/* NORMALIZED EXPORTS */

export const REQUIRED_XPOT = TOKEN.REQUIRED;
export const TOKEN_SYMBOL = TOKEN.SYMBOL;
export const TOKEN_MINT = TOKEN.MINT;

// Simple SOL gas safety check
export const MIN_SOL_FOR_GAS = 0.01;

/* SWAP LINK (JUPITER) */

export function getXpotSwapUrl(wallet?: string) {
  const userParam = wallet ? `?user=${wallet}` : '';
  return `https://jup.ag/swap/SOL-${TOKEN_MINT}${userParam}`;
}
