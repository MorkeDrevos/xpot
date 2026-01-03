// components/JackpotPanel/utils.ts
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

export function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function formatCoverage(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export function formatCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

/**
 * "Session" key that flips at 22:00 Madrid time.
 */
export function getMadridSessionKey(cutoffHour = 22) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const year = Number(parts.find(p => p.type === 'year')?.value ?? '0');
  const month = Number(parts.find(p => p.type === 'month')?.value ?? '1');
  const day = Number(parts.find(p => p.type === 'day')?.value ?? '1');
  const hour = Number(parts.find(p => p.type === 'hour')?.value ?? '0');

  const base = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  if (hour >= cutoffHour) base.setUTCDate(base.getUTCDate() + 1);

  const y = base.getUTCFullYear();
  const m = String(base.getUTCMonth() + 1).padStart(2, '0');
  const d = String(base.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/* ─────────────────────────────────────────────
   Madrid cutoff: correct UTC ms for "22:00 Europe/Madrid"
───────────────────────────────────────────── */

function getMadridParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const get = (type: string, fallback = '0') =>
    Number(parts.find(p => p.type === type)?.value ?? fallback);

  return {
    y: get('year', '0'),
    m: get('month', '1'),
    d: get('day', '1'),
    hh: get('hour', '0'),
    mm: get('minute', '0'),
    ss: get('second', '0'),
  };
}

function getMadridOffsetMs(now = new Date()) {
  const p = getMadridParts(now);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss);
  return asUtc - now.getTime();
}

export function getNextMadridCutoffUtcMs(cutoffHour = 22, now = new Date()) {
  const p = getMadridParts(now);
  const offsetMs = getMadridOffsetMs(now);

  const mkUtcFromMadridWallClock = (
    yy: number,
    mm: number,
    dd: number,
    hh: number,
    mi: number,
    ss: number,
  ) => {
    const asUtc = Date.UTC(yy, mm - 1, dd, hh, mi, ss);
    return asUtc - offsetMs;
  };

  let targetUtc = mkUtcFromMadridWallClock(p.y, p.m, p.d, cutoffHour, 0, 0);

  if (now.getTime() >= targetUtc) {
    const base = new Date(Date.UTC(p.y, p.m - 1, p.d, 0, 0, 0));
    base.setUTCDate(base.getUTCDate() + 1);
    const yy = base.getUTCFullYear();
    const mm = base.getUTCMonth() + 1;
    const dd = base.getUTCDate();
    targetUtc = mkUtcFromMadridWallClock(yy, mm, dd, cutoffHour, 0, 0);
  }

  return targetUtc;
}

export function safeParseSamples(raw: string | null): PriceSample[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    const out: PriceSample[] = [];
    for (const item of v) {
      const t = Number((item as any)?.t);
      const p = Number((item as any)?.p);
      if (Number.isFinite(t) && Number.isFinite(p)) out.push({ t, p });
    }
    return out;
  } catch {
    return [];
  }
}

export function buildSparklinePoints(samples: PriceSample[], width: number, height: number) {
  if (samples.length < 2) return null;

  let min = Infinity;
  let max = -Infinity;
  for (const s of samples) {
    if (s.p < min) min = s.p;
    if (s.p > max) max = s.p;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;

  const span = Math.max(1e-12, max - min);

  const n = samples.length;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * width;
    const yNorm = (samples[i].p - min) / span;
    const y = height - yNorm * height;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  return { points: pts.join(' '), min, max };
}

export function readDexScreenerMetrics(payload: unknown): DexMetrics {
  if (!payload || typeof payload !== 'object') return { priceUsd: null, changeH1: null };
  const p: any = payload;
  const pairs = Array.isArray(p?.pairs) ? p.pairs : [];
  if (!pairs.length) return { priceUsd: null, changeH1: null };

  // Prefer Solana + highest liquidity
  let best: any = null;
  for (const pair of pairs) {
    const priceUsd = Number(pair?.priceUsd ?? NaN);
    if (!Number.isFinite(priceUsd)) continue;

    if (!best) {
      best = pair;
      continue;
    }

    const chainOk = (pair?.chainId ?? '').toString().toLowerCase() === 'solana';
    const bestChainOk = (best?.chainId ?? '').toString().toLowerCase() === 'solana';

    const liqUsd = Number(pair?.liquidity?.usd ?? 0);
    const bestLiq = Number(best?.liquidity?.usd ?? 0);

    const better = (chainOk && !bestChainOk) || liqUsd > bestLiq;
    if (better) best = pair;
  }

  const outPrice = Number(best?.priceUsd ?? NaN);
  const outChange = Number(best?.priceChange?.h1 ?? NaN);

  return {
    priceUsd: Number.isFinite(outPrice) ? outPrice : null,
    changeH1: Number.isFinite(outChange) ? outChange : null,
  };
}
