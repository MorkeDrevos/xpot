'use client';

import { useEffect, useRef, useState } from 'react';
import type { PriceSample } from './types';
import { buildSparklinePoints, clamp, safeParseSamples } from './utils';

export function usePriceSamples(opts: {
  priceUsd: number | null;
  jackpotXpot: number;
  rangeSampleMs: number;
  rangeWindowMs: number;
  rangeStorageKey: string;
  rangeMaxSamples: number;
  sparkWindowMs: number;
  sparkMaxPoints: number;
}) {
  const {
    priceUsd,
    jackpotXpot,
    rangeSampleMs,
    rangeWindowMs,
    rangeStorageKey,
    rangeMaxSamples,
    sparkWindowMs,
    sparkMaxPoints,
  } = opts;

  const samplesRef = useRef<PriceSample[]>([]);
  const lastSampleAtRef = useRef<number>(0);
  const lastPersistAtRef = useRef<number>(0);

  const [range24h, setRange24h] = useState<{ lowUsd: number; highUsd: number } | null>(null);
  const [coverageMs, setCoverageMs] = useState<number>(0);

  const [spark, setSpark] = useState<{ points: string; min: number; max: number } | null>(null);
  const [sparkCoverageMs, setSparkCoverageMs] = useState<number>(0);

  // initial load
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const now = Date.now();
    const cutoff = now - rangeWindowMs;

    const stored = safeParseSamples(window.localStorage.getItem(rangeStorageKey))
      .filter(s => s.t >= cutoff)
      .slice(-rangeMaxSamples);

    samplesRef.current = stored;
    lastSampleAtRef.current = stored.length ? stored[stored.length - 1].t : 0;

    if (stored.length >= 2) {
      let low = Infinity;
      let high = -Infinity;
      for (const s of stored) {
        if (s.p < low) low = s.p;
        if (s.p > high) high = s.p;
      }
      if (Number.isFinite(low) && Number.isFinite(high)) {
        setRange24h({ lowUsd: low * jackpotXpot, highUsd: high * jackpotXpot });
      }

      setCoverageMs(clamp(now - stored[0].t, 0, rangeWindowMs));

      const cutoffSpark = now - sparkWindowMs;
      const sparkRaw = stored.filter(s => s.t >= cutoffSpark);

      if (sparkRaw.length >= 2) {
        const step = Math.max(1, Math.floor(sparkRaw.length / sparkMaxPoints));
        const down: PriceSample[] = [];
        for (let i = 0; i < sparkRaw.length; i += step) down.push(sparkRaw[i]);
        if (down[down.length - 1] !== sparkRaw[sparkRaw.length - 1]) down.push(sparkRaw[sparkRaw.length - 1]);

        const built = buildSparklinePoints(down, 560, 54);
        setSpark(built ? { points: built.points, min: built.min, max: built.max } : null);
        setSparkCoverageMs(clamp(now - sparkRaw[0].t, 0, sparkWindowMs));
      } else {
        setSpark(null);
        setSparkCoverageMs(0);
      }
    }
  }, [rangeStorageKey, rangeMaxSamples, rangeWindowMs, sparkWindowMs, sparkMaxPoints, jackpotXpot]);

  // live updates
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (priceUsd == null || !Number.isFinite(priceUsd)) return;

    const now = Date.now();
    const cutoff = now - rangeWindowMs;

    if (now - lastSampleAtRef.current < rangeSampleMs) return;

    const arr = samplesRef.current;
    arr.push({ t: now, p: priceUsd });
    lastSampleAtRef.current = now;

    while (arr.length && arr[0].t < cutoff) arr.shift();
    if (arr.length > rangeMaxSamples) arr.splice(0, arr.length - rangeMaxSamples);

    let low = Infinity;
    let high = -Infinity;
    for (const s of arr) {
      if (s.p < low) low = s.p;
      if (s.p > high) high = s.p;
    }
    if (Number.isFinite(low) && Number.isFinite(high)) {
      setRange24h({ lowUsd: low * jackpotXpot, highUsd: high * jackpotXpot });
    }

    if (arr.length >= 2) setCoverageMs(clamp(now - arr[0].t, 0, rangeWindowMs));
    else setCoverageMs(0);

    const cutoffSpark = now - sparkWindowMs;
    const sparkRaw = arr.filter(s => s.t >= cutoffSpark);

    if (sparkRaw.length >= 2) {
      const step = Math.max(1, Math.floor(sparkRaw.length / sparkMaxPoints));
      const down: PriceSample[] = [];
      for (let i = 0; i < sparkRaw.length; i += step) down.push(sparkRaw[i]);
      if (down[down.length - 1] !== sparkRaw[sparkRaw.length - 1]) down.push(sparkRaw[sparkRaw.length - 1]);

      const built = buildSparklinePoints(down, 560, 54);
      setSpark(built ? { points: built.points, min: built.min, max: built.max } : null);
      setSparkCoverageMs(clamp(now - sparkRaw[0].t, 0, sparkWindowMs));
    } else {
      setSpark(null);
      setSparkCoverageMs(0);
    }

    if (now - lastPersistAtRef.current >= 60_000) {
      lastPersistAtRef.current = now;
      try {
        window.localStorage.setItem(rangeStorageKey, JSON.stringify(arr));
      } catch {
        // ignore
      }
    }
  }, [priceUsd, jackpotXpot, rangeSampleMs, rangeWindowMs, rangeMaxSamples, rangeStorageKey, sparkWindowMs, sparkMaxPoints]);

  return { range24h, coverageMs, spark, sparkCoverageMs };
}
