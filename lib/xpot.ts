// lib/xpot.ts

/* ============================
   ENV MODE
   Toggle dev token here
============================ */

export const IS_DEV_XPOT = true; // 🔁 switch to false at real launch

/* ============================
   TOKEN CONFIG
============================ */

// 🔴 PRODUCTION TOKEN (real XPOT)
const PROD = {
  SYMBOL: 'XPOT',
  MINT: '4NGbC4RRrUjS78ooSN53Up7gSg4dGrj6F6dxpMWHbonk',
  REQUIRED: 100_000,
};

// 🟡 DEV / TEST TOKEN (any token for testing)
const DEV = {
  SYMBOL: 'TEST',
  MINT: 'PASTE_TEST_TOKEN_MINT_HERE',
  REQUIRED: 10, // LOW for testing
};

export const TOKEN = IS_DEV_XPOT ? DEV : PROD;

/* ============================
   EXPORT NORMALIZED VALUES
============================ */

export const REQUIRED_XPOT = TOKEN.REQUIRED;
export const TOKEN_SYMBOL = TOKEN.SYMBOL;

/* TEMP SOL GATE */
export const MIN_SOL_FOR_GAS = 0.01;

/* ============================
   SWAP LINK GENERATOR
============================ */

export function getXpotSwapUrl(wallet?: string) {
  return `https://jup.ag/swap/SOL-${TOKEN.MINT}?user=${wallet ?? ''}`;
}
