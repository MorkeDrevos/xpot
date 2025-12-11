import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function POST(req: NextRequest) {
  await requireAdmin(req);

  const today = new Date();
  const yyyyMmDd = today.toISOString().slice(0, 10); // YYYY-MM-DD

  const startOfDay = new Date(`${yyyyMmDd}T00:00:00Z`);
  const endOfDay = new Date(`${yyyyMmDd}T23:59:59Z`);

  // Check if today's draw already exists
  const existing = await prisma.draw.findFirst({
    where: {
      date: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { ok: false, error: 'DRAW_ALREADY_EXISTS', id: existing.id },
      { status: 400 }
    );
  }

  // Create new today's draw
  const newDraw = await prisma.draw.create({
    data: {
      date: startOfDay,
      status: 'open',
    },
  });

  return NextResponse.json(
    {
      ok: true,
      id: newDraw.id,
      date: newDraw.date.toISOString(),
    },
    { status: 200 }
  );
}
