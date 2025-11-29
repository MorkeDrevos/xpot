// lib/xpot.ts

// 🔹 Paste the real XPOT CA here at launch
export const XPOT_MINT = 'PASTE_REAL_XPOT_CA_HERE';

// 🔹 How many XPOT are required to enter the draw
export const REQUIRED_XPOT = 100_000;

// 🔹 Temp: minimum SOL to cover gas while we are XPOT-testing
export const MIN_SOL_FOR_GAS = 0.01;

// 🔹 Helper: are we still in "pre-launch" (no real CA)?
export const IS_DEV_XPOT =
  !XPOT_MINT || XPOT_MINT === 'PASTE_REAL_XPOT_CA_HERE';

// 🔹 Optional: prebuilt Jupiter swap URL
export function getXpotSwapUrl() {
  // You can tweak this later – core idea is CA comes from XPOT_MINT
  return `https://jup.ag/swap/SOL-XPOT?outputMint=${XPOT_MINT}`;
}
