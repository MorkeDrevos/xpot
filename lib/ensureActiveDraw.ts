// lib/ensureActiveDraw.ts
import { prisma } from '@/lib/prisma';

const MADRID_TZ = 'Europe/Madrid';
const MADRID_CUTOFF_HH = 22;
const MADRID_CUTOFF_MM = 0;

/* --- helper functions (copied as-is from claim route) --- */
function getTzParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const pick = (type: string) => parts.find(p => p.type === type)?.value ?? '00';

  return {
    y: Number(pick('year')),
    m: Number(pick('month')),
    d: Number(pick('day')),
    hh: Number(pick('hour')),
    mm: Number(pick('minute')),
    ss: Number(pick('second')),
  };
}

function wallClockToUtcMs({ y, m, d, hh, mm, ss, timeZone }: any) {
  let t = Date.UTC(y, m - 1, d, hh, mm, ss);

  for (let i = 0; i < 3; i++) {
    const got = getTzParts(new Date(t), timeZone);
    const want = (((y * 12 + m) * 31 + d) * 24 + hh) * 60 + mm;
    const have = (((got.y * 12 + got.m) * 31 + got.d) * 24 + got.hh) * 60 + got.mm;
    const diff = have - want;
    if (diff === 0) break;
    t -= diff * 60_000;
  }

  return t;
}

function getMadridCutoffWindowUtc(now = new Date()) {
  const madridNow = getTzParts(now, MADRID_TZ);
  const nowMin = madridNow.hh * 60 + madridNow.mm;
  const cutoffMin = MADRID_CUTOFF_HH * 60 + MADRID_CUTOFF_MM;

  const base = nowMin < cutoffMin ? now : new Date(now.getTime() + 86400000);
  const p = getTzParts(base, MADRID_TZ);

  const endUtcMs = wallClockToUtcMs({
    y: p.y,
    m: p.m,
    d: p.d,
    hh: MADRID_CUTOFF_HH,
    mm: MADRID_CUTOFF_MM,
    ss: 0,
    timeZone: MADRID_TZ,
  });

  return { end: new Date(endUtcMs) };
}

function getDrawBucketUtc(now = new Date()) {
  const { end } = getMadridCutoffWindowUtc(now);
  const inside = new Date(end.getTime() - 1);
  const p = getTzParts(inside, MADRID_TZ);
  return new Date(Date.UTC(p.y, p.m - 1, p.d, 0, 0, 0));
}

/* --- THE GUARANTEE --- */
export async function ensureActiveDraw(now = new Date()) {
  const { end } = getMadridCutoffWindowUtc(now);
  const drawDate = getDrawBucketUtc(now);

  return prisma.$transaction(async tx => {
    const existing = await tx.draw.findUnique({ where: { drawDate } });

    if (!existing) {
      return tx.draw.create({
        data: { drawDate, status: 'open', closesAt: end },
      });
    }

    if (now < end && existing.status !== 'open') {
      return tx.draw.update({
        where: { id: existing.id },
        data: { status: 'open', closesAt: end },
      });
    }

    if (!existing.closesAt || existing.closesAt.getTime() !== end.getTime()) {
      return tx.draw.update({
        where: { id: existing.id },
        data: { closesAt: end },
      });
    }

    return existing;
  });
}
