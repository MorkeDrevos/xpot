// lib/xpotVaults.ts

export type XpotVaultKey =
  | 'rewards'
  | 'liquidityOps'
  | 'treasury'
  | 'team'
  | 'partners'
  | 'community'
  | 'strategic';

export type XpotVault = { name: string; address: string };

export const XPOT_VAULTS: Record<XpotVaultKey, XpotVault[]> = {
  rewards: [
    { name: 'XPOT Rewards / Distribution Vault', address: 'Bk7ganFvbZ6XEvKmeTQ7NnoF5tGUnEoNbxsBq7K6kLk4' },
  ],
  liquidityOps: [
    { name: 'XPOT Liquidity + Market Ops Vault', address: '8VPiF9Mp8eoxSxg1m5m371d6D4V32iH6wf9KyMisxr67' },
  ],
  treasury: [
    { name: 'XPOT Treasury Vault', address: '88QKK3TKdqoBVcYqHN3pevwAXVDm3bMp6G4NASuQ9Ean' },
  ],
  team: [
    { name: 'XPOT Team Vesting Vault', address: 'G17RehqUAgMcAxcnLUZyf6WzuPqsM82q9SC1aSkBUR7w' },
  ],
  partners: [
    { name: 'XPOT Partners + Creators Vault', address: '9wrsrr17nsMDU4oD3VG9hUB7supWvoPBWGxhG3BQmVV2' },
  ],
  community: [
    { name: 'XPOT Community Incentives Vault', address: 'Cn4GdKEKEiWh4UH3VNVrRkYHcgeYynThhP175iM9z2cc' },
  ],
  strategic: [
    { name: 'XPOT Strategic Reserve Vault', address: '8M1xt2PNEJkSrN6JZU7TGf7cGvL9Tp4W7obDy4Y7awx8' },
  ],
};
