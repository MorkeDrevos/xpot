import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const todayStr = new Date().toISOString().slice(0, 10);
  const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

  const existing = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  if (existing) {
    return NextResponse.json({
      ok: true,
      alreadyExists: true,
      draw: existing,
    });
  }

  const draw = await prisma.draw.create({
    data: {
      drawDate: new Date(),
      jackpotUsd: 1_000_000,
    },
  });

  return NextResponse.json({
    ok: true,
    alreadyExists: false,
    draw,
  });
}
