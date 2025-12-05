// app/api/tickets/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1) Require X login
  const session = await getServerSession(authOptions);

  if (!session || !(session as any).userId) {
    return NextResponse.json(
      { ok: false, error: 'NOT_LOGGED_IN' },
      { status: 401 }
    );
  }

  const userId = (session as any).userId as string;

  try {
    // 2) Find today’s draw (UTC day)
    const todayStr = new Date().toISOString().slice(0, 10);

    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: new Date(`${todayStr}T00:00:00.000Z`),
          lt:  new Date(`${todayStr}T23:59:59.999Z`),
        },
      },
    });

    if (!draw) {
      return NextResponse.json(
        { ok: false, error: 'NO_DRAW_TODAY' },
        { status: 400 }
      );
    }

    // 3) Enforce ONE TICKET per user per draw
    const existing = await prisma.ticket.findFirst({
      where: {
        drawId: draw.id,
        userId,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          ok: false,
          error: 'ALREADY_HAS_TICKET',
          ticket: {
            id: existing.id,
            code: existing.code,
          },
        },
        { status: 409 }
      );
    }

    // 4) Create new ticket
    const ticket = await prisma.ticket.create({
      data: {
        drawId: draw.id,
        userId,
        code: generateTicketCode(),
      },
    });

    return NextResponse.json(
      {
        ok: true,
        ticket: {
          id: ticket.id,
          code: ticket.code,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Create today ticket error', err);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

function generateTicketCode() {
  return 'XP-' + Math.random().toString(36).slice(2, 10).toUpperCase();
}
