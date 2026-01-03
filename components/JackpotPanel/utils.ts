// components/JackpotPanel/utils.ts
import { XPOT_POOL_SIZE } from '@/lib/xpot';

export const JACKPOT_XPOT = XPOT_POOL_SIZE;

export const PRICE_POLL_MS = 4000; // 4s

export const RANGE_SAMPLE_MS = 10_000; // 10s
export const RANGE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
export const RANGE_STORAGE_KEY = 'xpot_price_samples_24h_v1';

export const SPARK_WINDOW_MS = 60 * 60 * 1000; // 1h
export const SPARK_MAX_POINTS = 80;

export const MILESTONES = [
  5, 10, 15, 20, 25, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1_000, 1_500, 2_000,
  3_000, 4_000, 5_000, 7_500, 10_000, 15_000, 20_000, 30_000, 40_000, 50_000, 75_000,
  100_000, 150_000, 200_000, 300_000, 400_000, 500_000, 750_000, 1_000_000, 1_500_000,
  2_000_000, 3_000_000, 5_000_000, 10_000_000,
] as const;

export type PriceSample = { t: number; p: number };

export type DexMetrics = {
  priceUsd: number | null;
  changeH1: number | null;
};

export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function formatUsd(value: number | null) {
  if (value === null || !Number.isFinite(value)) return '$0.00';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCoverage(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}
