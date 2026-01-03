// components/home/madrid.ts
import { RUN_DAYS, RUN_END, RUN_START, RUN_END_EU, RUN_START_EU } from '@/lib/xpotRun';

export function getMadridParts(date = new Date()) {
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

export function getMadridOffsetMs(now = new Date()) {
  const p = getMadridParts(now);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss);
  return asUtc - now.getTime();
}

export function getMadridUtcMsFromWallClock(
  yy: number,
  mm: number,
  dd: number,
  hh: number,
  mi: number,
  ss: number,
  now = new Date(),
) {
  const offsetMs = getMadridOffsetMs(now);
  const asUtc = Date.UTC(yy, mm - 1, dd, hh, mi, ss);
  return asUtc - offsetMs;
}

function ymdToSerialUtc(yy: number, mm: number, dd: number) {
  return Math.floor(Date.UTC(yy, mm - 1, dd) / 86_400_000);
}

function addYmdDays(yy: number, mm: number, dd: number, days: number) {
  const base = new Date(Date.UTC(yy, mm - 1, dd, 12, 0, 0));
  base.setUTCDate(base.getUTCDate() + days);
  return { y: base.getUTCFullYear(), m: base.getUTCMonth() + 1, d: base.getUTCDate() };
}

export function getNextMadridCutoffUtcMs(cutoffHour = 22, now = new Date()) {
  const p = getMadridParts(now);

  let targetUtc = getMadridUtcMsFromWallClock(p.y, p.m, p.d, cutoffHour, 0, 0, now);

  if (now.getTime() >= targetUtc) {
    const next = addYmdDays(p.y, p.m, p.d, 1);
    targetUtc = getMadridUtcMsFromWallClock(next.y, next.m, next.d, cutoffHour, 0, 0, now);
  }

  return targetUtc;
}

export function formatCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;

  const pad2 = (n: number) => String(n).padStart(2, '0');
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
}

export function calcRunProgress(now = new Date()) {
  const p = getMadridParts(now);

  const runStartCutoffUtc = getMadridUtcMsFromWallClock(
    RUN_START.y,
    RUN_START.m,
    RUN_START.d,
    RUN_START.hh,
    RUN_START.mm,
    0,
    now,
  );

  const runEndCutoffUtc = getMadridUtcMsFromWallClock(
    RUN_END.y,
    RUN_END.m,
    RUN_END.d,
    RUN_END.hh,
    RUN_END.mm,
    0,
    now,
  );

  const todayCutoffUtc = getMadridUtcMsFromWallClock(p.y, p.m, p.d, 22, 0, 0, now);
  const anchorYmd =
    now.getTime() >= todayCutoffUtc ? { y: p.y, m: p.m, d: p.d } : addYmdDays(p.y, p.m, p.d, -1);

  const started = now.getTime() >= runStartCutoffUtc;

  let day = 0;
  if (started) {
    const diffDays =
      ymdToSerialUtc(anchorYmd.y, anchorYmd.m, anchorYmd.d) -
      ymdToSerialUtc(RUN_START.y, RUN_START.m, RUN_START.d);
    day = Math.max(1, diffDays + 1);
  }

  day = Math.max(0, Math.min(RUN_DAYS, day));
  const daysRemaining = Math.max(0, RUN_DAYS - day);

  const ended = now.getTime() >= runEndCutoffUtc;

  return { day, daysRemaining, started, ended };
}

export function runTitle(day: number, started: boolean, ended: boolean, cutoffLabel: string) {
  if (ended) return `XPOT - Final Draw live (${RUN_END_EU})`;
  if (started) return `XPOT - Day ${day}/${RUN_DAYS} (Next draw ${cutoffLabel})`;
  return `XPOT - Run starts ${RUN_START_EU}`;
}

export function formatIsoToMadridYmd(iso: string) {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
