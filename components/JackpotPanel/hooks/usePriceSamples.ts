// components/JackpotPanel/hooks/usePriceSamples.ts
'use client';

import { useEffect, useMemo, useState } from 'react';
import { getMadridSessionKey } from '../utils/madrid';

type PriceSample = { t: number; p: number };

const RANGE_SAMPLE_MS = 10_000; // 10s
const RANGE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const RANGE_STORAGE_KEY = 'xpot_price_samples_24h_v1';

const SPARK_WINDOW_MS = 60 * 60 * 1000; // 1h
const SPARK_MAX_POINTS = 80;

function safeParseSamples(raw: string | null): PriceSample[] {
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

function buildSparklinePoints(samples: PriceSample[], width: number, height: number) {
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

export function usePriceSamples(priceUsd: number | null) {
  const [range24h, setRange24h] = useState<{ lowUsd: number; highUsd: number } | null>(null);
  const [coverageMs, setCoverageMs] = useState(0);
  const [spark, setSpark] = useState<{ points: string; min: number; max: number } | null>(null);
  const [sparkCoverageMs, setSparkCoverageMs] = useState(0);

  const [maxJackpotToday, setMaxJackpotToday] = useState<number | null>(null);

  const sessionKey = useMemo(() => getMadridSessionKey(22), []);
  const peakKey = useMemo(() => `xpot_session_peak_${sessionKey}`, [sessionKey]);

  const registerJackpotUsdForSessionPeak = (usd: number) => {
    if (typeof window === 'undefined') return;
    if (!Number.isFinite(usd)) return;

    try {
      const prev = Number(window.localStorage.getItem(peakKey) ?? NaN);
      const next = !Number.isFinite(prev) ? usd : Math.max(prev, usd);
      window.localStorage.setItem(peakKey, String(next));
      setMaxJackpotToday(next);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const v = Number(window.localStorage.getItem(peakKey) ?? NaN);
      setMaxJackpotToday(Number.isFinite(v) ? v : null);
    } catch {
      setMaxJackpotToday(null);
    }
  }, [peakKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (priceUsd == null || !Number.isFinite(priceUsd)) return;

    const now = Date.now();
    const raw = window.localStorage.getItem(RANGE_STORAGE_KEY);
    const samples = safeParseSamples(raw);

    samples.push({ t: now, p: priceUsd });

    const minT = now - RANGE_WINDOW_MS - RANGE_SAMPLE_MS * 3;
    const trimmed = samples.filter(s => s.t >= minT && Number.isFinite(s.p));

    const hardMax = Math.ceil(RANGE_WINDOW_MS / RANGE_SAMPLE_MS) + 200;
    const finalSamples = trimmed.length > hardMax ? trimmed.slice(trimmed.length - hardMax) : trimmed;

    try {
      window.localStorage.setItem(RANGE_STORAGE_KEY, JSON.stringify(finalSamples));
    } catch {
      // ignore quota
    }
  }, [priceUsd]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let raf = 0;
    let timer: number | null = null;

    const compute = () => {
      const now = Date.now();
      const raw = window.localStorage.getItem(RANGE_STORAGE_KEY);
      const all = safeParseSamples(raw);

      const from24 = now - RANGE_WINDOW_MS;
      const w24 = all.filter(s => s.t >= from24);

      if (w24.length >= 2) {
        let low = Infinity;
        let high = -Infinity;
        for (const s of w24) {
          low = Math.min(low, s.p);
          high = Math.max(high, s.p);
        }
        if (Number.isFinite(low) && Number.isFinite(high)) {
          setRange24h({ lowUsd: low, highUsd: high });
          setCoverageMs(Math.max(0, w24[w24.length - 1].t - w24[0].t));
        } else {
          setRange24h(null);
          setCoverageMs(0);
        }
      } else {
        setRange24h(null);
        setCoverageMs(0);
      }

      const fromSpark = now - SPARK_WINDOW_MS;
      const w1h = all.filter(s => s.t >= fromSpark);

      if (w1h.length >= 2) {
        const cov = Math.max(0, w1h[w1h.length - 1].t - w1h[0].t);
        setSparkCoverageMs(cov);

        const step = Math.max(1, Math.floor(w1h.length / SPARK_MAX_POINTS));
        const sampled: PriceSample[] = [];
        for (let i = 0; i < w1h.length; i += step) sampled.push(w1h[i]);
        if (sampled[sampled.length - 1]?.t !== w1h[w1h.length - 1]?.t) sampled.push(w1h[w1h.length - 1]);

        const built = buildSparklinePoints(sampled, 560, 54);
        setSpark(built);
      } else {
        setSpark(null);
        setSparkCoverageMs(0);
      }
    };

    const tick = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };

    tick();
    timer = window.setInterval(tick, 5000);

    return () => {
      if (timer !== null) window.clearInterval(timer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return {
    range24h,
    coverageMs,
    spark,
    sparkCoverageMs,
    maxJackpotToday,
    registerJackpotUsdForSessionPeak,
  };
}
