// app/api/admin/create-today-draw/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function POST(req: NextRequest) {
  await requireAdmin(req);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

  // Check if today's draw already exists
  const existing = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { ok: false, error: 'DRAW_ALREADY_EXISTS' },
      { status: 400 }
    );
  }

  // Create today's draw
  const newDraw = await prisma.draw.create({
    data: {
      drawDate: now,
      status: 'open',
    },
  });

  return NextResponse.json(
    {
      ok: true,
      drawId: newDraw.id,
      drawDate: newDraw.drawDate.toISOString(),
    },
    { status: 200 }
  );
}
