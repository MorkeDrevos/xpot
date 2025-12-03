import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '../../_auth';
import { TicketStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const now = new Date();
    const today = now.toISOString().slice(0, 10); // e.g. "2025-12-03"

    // 1) Ensure we have a draw for today
    let draw = await prisma.draw.findFirst({
      where: { date: today },
    });

    if (!draw) {
      draw = await prisma.draw.create({
        data: {
          date: today,
          jackpotUsd: 1000,
          rolloverUsd: 0,
          // if your Draw model has required "status" enum, uncomment + adjust:
          // status: 'OPEN',
        },
      });
    }

    // 2) Create a few tickets if none exist yet
    const existingTickets = await prisma.ticket.count({
      where: { drawId: draw.id },
    });

    let created = 0;

    if (existingTickets === 0) {
      await prisma.ticket.createMany({
        data: [
          {
            code: 'XPOT-DEV-AAAA-BBBB',
            walletAddress: 'DevWallet11111111111111111111111111111111',
            status: TicketStatus.IN_DRAW,
            jackpotUsd: 1000,
            createdAt: now,
            drawId: draw.id,
          },
          {
            code: 'XPOT-DEV-CCCC-DDDD',
            walletAddress: 'DevWallet22222222222222222222222222222222',
            status: TicketStatus.IN_DRAW,
            jackpotUsd: 1000,
            createdAt: new Date(now.getTime() - 5 * 60 * 1000),
            drawId: draw.id,
          },
          {
            code: 'XPOT-DEV-EEEE-FFFF',
            walletAddress: 'DevWallet33333333333333333333333333333333',
            status: TicketStatus.IN_DRAW,
            jackpotUsd: 1000,
            createdAt: new Date(now.getTime() - 10 * 60 * 1000),
            drawId: draw.id,
          },
        ],
      });
      created = 3;
    }

    return NextResponse.json({
      ok: true,
      message: 'Dev seed done',
      draw,
      createdTickets: created,
    });
  } catch (error: any) {
    console.error('DEV SEED ERROR', error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}
