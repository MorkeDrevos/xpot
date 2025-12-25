// app/api/draw/live/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// UTC day bucket helper (MUST match how Draw.drawDate is written)
function utcDayStart(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0),
  );
}

function diffDaysUtc(a: Date, b: Date) {
  const dayMs = 86400 * 1000;
  const ax = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate(), 0, 0, 0);
  const bx = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate(), 0, 0, 0);
  return Math.floor((ax - bx) / dayMs);
}

// Cheap in-memory cache so we don't scan the DB every 5s
let genesisCache: { at: number; drawDate: Date | null } = { at: 0, drawDate: null };
const GENESIS_TTL_MS = 60_000;

// Change this only if your “mission length” changes
const DAY_TOTAL = 7000;

// Canonical daily amount (you can import from lib/xpot.ts if you want)
const DAILY_XPOT = 1_000_000;

export async function GET() {
  const today = utcDayStart(new Date());

  const draw = await prisma.draw.findUnique({
    where: { drawDate: today },
    select: {
      drawDate: true,
      closesAt: true,
      status: true,
    },
  });

  if (!draw || !draw.closesAt) {
    return NextResponse.json(
      { draw: null },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }

  // Resolve genesis (Day 1) from earliest draw in DB (cached)
  const now = Date.now();
  if (now - genesisCache.at > GENESIS_TTL_MS) {
    const first = await prisma.draw.findFirst({
      orderBy: { drawDate: 'asc' },
      select: { drawDate: true },
    });
    genesisCache = { at: now, drawDate: first?.drawDate ?? null };
  }

  const genesis = genesisCache.drawDate;
  const dayIndex =
    genesis ? diffDaysUtc(draw.drawDate, genesis) + 1 : null;

  // normalize status to what UI expects
  const status =
    draw.status === 'open'
      ? 'OPEN'
      : draw.status === 'completed'
      ? 'COMPLETED'
      : 'LOCKED';

  return NextResponse.json(
    {
      draw: {
        dailyXpot: DAILY_XPOT,
        closesAt: draw.closesAt.toISOString(),
        status,
        dayIndex, // 1..7000 (if genesis exists)
        dayTotal: DAY_TOTAL,
      },
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
