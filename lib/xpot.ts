// lib/xpot.ts

type TokenConfig = {
  SYMBOL: string;
  MINT: string;
  REQUIRED: number;
};

export const IS_DEV_XPOT = false;

const PROD: TokenConfig = {
  SYMBOL: 'SOL',
  MINT: 'So11111111111111111111111111111111111111112',
  REQUIRED: 5_000,
};

const DEV: TokenConfig = {
  SYMBOL: 'BONK',
  MINT: 'DezXAZ8z7PnrnRJjz3wXBoHyRnHv7QBB7aLteS7r2N6v',
  REQUIRED: 100_000,
};

export const TOKEN: TokenConfig = IS_DEV_XPOT ? DEV : PROD;

export const REQUIRED_XPOT = TOKEN.REQUIRED;
export const TOKEN_SYMBOL = TOKEN.SYMBOL;
export const TOKEN_MINT = TOKEN.MINT;

// 🔹 Single source of truth for XPOT pool size
export const XPOT_POOL_SIZE = 10_000_000;

export function getXpotSwapUrl(wallet?: string) {
  const userParam = wallet ? `?user=${wallet}` : '';
  return `https://jup.ag/swap/SOL-${TOKEN_MINT}${userParam}`;
}
