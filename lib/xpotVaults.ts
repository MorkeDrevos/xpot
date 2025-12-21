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
    { name: 'XPOT Rewards / Distribution Vault', address: '8FfoRtXDj1Q1Y2DbY2b8Rp5bLBLLstd6fYe2GcDTMg9o' },
  ],
  liquidityOps: [
    { name: 'XPOT Liquidity + Market Ops Vault', address: '8VPiF9Mp8eoxSxg1m5m371d6D4V32iH6wf9KyMisxr67' },
  ],
  treasury: [
    { name: 'Treasury Vault', address: '88QKK3TKdqoBVcYqHN3pevwAXVDm3bMp6G4NASuQ9Ean' },
  ],
  team: [
    { name: 'Team Vesting Vault', address: 'G17RehqUAgMcAxcnLUZyf6WzuPqsM82q9SC1aSkBUR7w' },
  ],
  partners: [
    { name: 'Partners + Creators Vault', address: '9wrsrr17nsMDU4oD3VG9hUB7supWvoPBWGxhG3BQmVV2' },
  ],
  community: [
    { name: 'Community Incentives Vault', address: '4nsLrcTCVUjYuemcGAs26ySw7teRyofq2vzqSZiFukPJ' },
  ],
  strategic: [
    { name: 'Strategic Reserve Vault', address: '8M1xt2PNEJkSrN6JZU7TGf7cGvL9Tp4W7obDy4Y7awx8' },
  ],
};
