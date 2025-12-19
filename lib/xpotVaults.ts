export type XpotVaultKey =
  | 'rewards'
  | 'liquidityOps'
  | 'treasury'
  | 'team'
  | 'partners'
  | 'community';

export const XPOT_VAULTS: Record<XpotVaultKey, { name: string; address: string }[]> = {
  rewards: [{ name: 'Rewards Vault', address: '...' }],
  liquidityOps: [{ name: 'Liquidity + Ops Vault', address: '...' }],
  treasury: [{ name: 'Treasury Vault', address: '...' }],
  team: [{ name: 'Team Vesting Vault', address: '...' }],
  partners: [{ name: 'Partners Vault', address: '...' }],
  community: [{ name: 'Community Vault', address: '...' }],
};
