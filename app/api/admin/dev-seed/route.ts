// app/api/admin/dev-seed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

// Shared handler so GET/POST both work in dev
async function handleDevSeed(req: NextRequest) {
  // Admin guard
  await requireAdmin(req);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

  // 1) Find today's draw by drawDate
  let draw = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  // 2) If none exists, create a simple open draw for today
  if (!draw) {
    draw = await prisma.draw.create({
      data: {
        drawDate: startOfDay,
        status: 'open', // uses your default shape; safe for dev
      },
    });
  }

  return NextResponse.json(
    {
      ok: true,
      draw: {
        id: draw.id,
        drawDate: draw.drawDate.toISOString(),
        status: draw.status,
      },
    },
    { status: 200 },
  );
}

export async function POST(req: NextRequest) {
  return handleDevSeed(req);
}

export async function GET(req: NextRequest) {
  return handleDevSeed(req);
}
