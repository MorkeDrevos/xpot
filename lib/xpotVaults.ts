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
    { name: 'Liquidity + Market Ops Vault', address: 'D2N1rt1N9fKqefQWpu5GH7N6r6H3uQQoaYksUUtkHcJR' },
  ],
  treasury: [
    { name: 'Treasury Vault', address: '4nsLrcTCVUjYuemcGAs26ySw7teRyofq2vzqSZiFukPJ' },
  ],
  team: [
    { name: 'Team Vesting Vault', address: '4nsLrcTCVUjYuemcGAs26ySw7teRyofq2vzqSZiFukPJ' },
  ],
  partners: [
    { name: 'Partners + Creators Vault', address: '4nsLrcTCVUjYuemcGAs26ySw7teRyofq2vzqSZiFukPJ' },
  ],
  community: [
    { name: 'Community Incentives Vault', address: '4nsLrcTCVUjYuemcGAs26ySw7teRyofq2vzqSZiFukPJ' },
  ],
  strategic: [
    { name: 'Strategic Reserve Vault', address: '4nsLrcTCVUjYuemcGAs26ySw7teRyofq2vzqSZiFukPJ' },
  ],
};
