import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session as any).userId) {
    return NextResponse.json({ ok: false, error: 'NOT_LOGGED_IN' }, { status: 401 });
  }

  const userId = (session as any).userId;

  try {
    // today's draw
    const today = new Date().toISOString().slice(0, 10);

    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: new Date(`${today}T00:00:00Z`),
          lt: new Date(`${today}T23:59:59Z`)
        }
      }
    });

    if (!draw) {
      return NextResponse.json({ ok: false, error: 'NO_DRAW_TODAY' }, { status: 400 });
    }

    // ✅ Enforce ONE TICKET PER USER PER DRAW
    const existing = await prisma.ticket.findFirst({
      where: {
        drawId: draw.id,
        userId
      }
    });

    if (existing) {
      return NextResponse.json({
        ok: false,
        error: 'ALREADY_HAS_TICKET',
        ticket: existing
      }, { status: 409 });
    }

    const ticket = await prisma.ticket.create({
      data: {
        drawId: draw.id,
        userId,
        code: generateTicketCode()
      }
    });

    return NextResponse.json({ ok: true, ticket }, { status: 201 });

  } catch (err) {
    console.error('Ticket creation failed:', err);
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

function generateTicketCode() {
  return 'XP-' + Math.random().toString(36).slice(2, 10).toUpperCase();
}
