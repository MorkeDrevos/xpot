export type XpotVaultKey =
  | 'rewards'
  | 'liquidityOps'
  | 'treasury'
  | 'team'
  | 'partners'
  | 'community';

export const XPOT_VAULTS: Record<XpotVaultKey, { name: string; address: string }[]> = {
  rewards: [{ name: 'Rewards Vault', address: '4nsLrcTCVUjYuemcGAs26ySw7teRyofq2vzqSZiFukPJ' }],
  liquidityOps: [{ name: 'Liquidity + Ops Vault', address: '4nsLrcTCVUjYuemcGAs26ySw7teRyofq2vzqSZiFukPJ' }],
  treasury: [{ name: 'Treasury Vault', address: '4nsLrcTCVUjYuemcGAs26ySw7teRyofq2vzqSZiFukPJ' }],
  team: [{ name: 'Team Vesting Vault', address: '4nsLrcTCVUjYuemcGAs26ySw7teRyofq2vzqSZiFukPJ' }],
  partners: [{ name: 'Partners Vault', address: '4nsLrcTCVUjYuemcGAs26ySw7teRyofq2vzqSZiFukPJ' }],
  community: [{ name: 'Community Vault', address: '4nsLrcTCVUjYuemcGAs26ySw7teRyofq2vzqSZiFukPJ' }],
};
