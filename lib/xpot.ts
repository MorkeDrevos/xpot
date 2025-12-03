// lib/xpot.ts

/* ============================
   XPOT TOKEN CONFIG
   - Toggle dev / prod token with IS_DEV_XPOT
   - Use REQUIRED_XPOT + TOKEN_SYMBOL in UI to show min balance
============================ */

type TokenConfig = {
  SYMBOL: string;
  MINT: string;
  REQUIRED: number; // minimum tokens required to join the draw
};

/* ============================
   ENV MODE
   true  → use DEV token (for dev / staging / testing)
   false → use PROD token (real XPOT ticket token)
============================ */

export const IS_DEV_XPOT = false; // flip to true when you want dev token

/* ============================
   TOKENS
============================ */

// 🔴 PRODUCTION TOKEN (real XPOT ticket token)
const PROD: TokenConfig = {
  SYMBOL: 'SOL',
  MINT: 'So11111111111111111111111111111111111111112',
  // Minimum balance to be eligible for the real draw
  REQUIRED: 100_000,
};

// 🟡 DEV / TEST TOKEN (use any token for testing the flow)
const DEV: TokenConfig = {
  SYMBOL: 'BONK',
  MINT: 'DezXAZ8z7PnrnRJjz3wXBoHyRnHv7QBB7aLteS7r2N6v',
  // Lower threshold so it is easy to test
  REQUIRED: 100_000,
};

// Active token based on mode
export const TOKEN: TokenConfig = IS_DEV_XPOT ? DEV : PROD;

/* ============================
   NORMALIZED EXPORTS
   - Import these everywhere in the app
============================ */

export const REQUIRED_XPOT = TOKEN.REQUIRED; // min balance gate
export const TOKEN_SYMBOL = TOKEN.SYMBOL;
export const TOKEN_MINT = TOKEN.MINT;

// Simple SOL gas safety check
export const MIN_SOL_FOR_GAS = 0.01;

/* ============================
   SWAP LINK GENERATOR (JUPITER)
   - Used for "Buy XPOT" button
============================ */

export function getXpotSwapUrl(wallet?: string) {
  // Jupiter shorthand: SOL-<MINT>
  // Example: https://jup.ag/swap/SOL-<TOKEN_MINT>?user=<wallet>
  const userParam = wallet ? `?user=${wallet}` : '';
  return `https://jup.ag/swap/SOL-${TOKEN_MINT}${userParam}`;
}
