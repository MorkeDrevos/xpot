// lib/xpot.ts

/* ============================
   XPOT TOKEN CONFIG
   - Toggle dev / prod token with IS_DEV_XPOT
   - XPOT_POOL_SIZE is the ONLY source of truth
     for the jackpot pool size.
============================ */

type TokenConfig = {
  SYMBOL: string;
  MINT: string;
  REQUIRED: number; // minimum tokens required to join the draw
};

/* ============================
   ENV MODE
============================ */

// true  → use DEV token (for local / staging / testing)
// false → use PROD token (real XPOT token)
export const IS_DEV_XPOT = false; // set to false at real launch

/* ============================
   TOKENS
============================ */

// PRODUCTION TOKEN (real XPOT ticket token)
const PROD: TokenConfig = {
  SYMBOL: 'SOL',
  MINT: 'So11111111111111111111111111111111111111112',
  REQUIRED: 100_000,
};

// DEV / TEST TOKEN (e.g. BONK) – easier for staging
const DEV: TokenConfig = {
  SYMBOL: 'BONK',
  MINT: 'DezXAZ8z7PnrnRJjz3wXBoHyRnHv7QBB7aLteS7r2N6v',
  REQUIRED: 100_000,
};

// Active token based on mode
export const TOKEN: TokenConfig = IS_DEV_XPOT ? DEV : PROD;

/* ============================
   NORMALIZED EXPORTS
   - Import these everywhere
============================ */

export const REQUIRED_XPOT = TOKEN.REQUIRED;
export const TOKEN_SYMBOL = TOKEN.SYMBOL;
export const TOKEN_MINT = TOKEN.MINT;

/**
 * XPOT_POOL_SIZE
 *
 * Single source of truth for jackpot pool size.
 * Both the big "Today's XPOT" card and the green
 * "Today's XPOT (live)" pill must use THIS value.
 */
export const XPOT_POOL_SIZE = 100_000; // <— change here when you want a new pool size

/* ============================
   SWAP LINK (JUPITER)
============================ */

export function getXpotSwapUrl(wallet?: string) {
  const userParam = wallet ? `?user=${wallet}` : '';
  return `https://jup.ag/swap/SOL-${TOKEN_MINT}${userParam}`;
}
