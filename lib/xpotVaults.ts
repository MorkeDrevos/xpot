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
    { name: 'Rewards / Distribution Vault', address: '4nsLrcTCVUjYuemcGAs26ySw7teRyofq2vzqSZiFukPJ' },
  ],
  liquidityOps: [
    { name: 'Liquidity + Market Ops Vault', address: '4nsLrcTCVUjYuemcGAs26ySw7teRyofq2vzqSZiFukPJ' },
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
