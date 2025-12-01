// app/api/admin/draw/pick-winner/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '/vercel/path0/lib/prisma'; // same import style as your other admin routes

const DEFAULT_JACKPOT_USD = Number(
  process.env.XPOT_DAILY_JACKPOT_USD ?? 10_000
);

// ─────────────────────────────────────────────
// Auth helper (same pattern as other admin APIs)
// ─────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const header =
    req.headers.get('x-admin-token') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!header || header !== process.env.XPOT_ADMIN_TOKEN) {
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────
// POST /api/admin/draw/pick-winner
// Picks a random ticket from today’s open draw,
// closes the draw and records the winner.
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    // 1. Find the latest OPEN draw (today’s draw)
    const openDraw = await prisma.draw.findFirst({
      where: {
        isClosed: false,
        winnerTicketId: null,
      },
      orderBy: {
        drawDate: 'desc',
      },
      include: {
        tickets: {
          include: {
            wallet: true,
          },
        },
      },
    });

    if (!openDraw) {
      return NextResponse.json(
        { ok: false, error: 'No open draw to resolve' },
        { status: 400 }
      );
    }

    // 2. Filter eligible tickets (still in the pool)
    const eligibleTickets = openDraw.tickets.filter(
      t => t.status === 'IN_DRAW'
    );

    if (eligibleTickets.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No tickets in pool for this draw' },
        { status: 400 }
      );
    }

    // 3. Randomly pick a winner from eligible tickets
    const randomIndex = Math.floor(Math.random() * eligibleTickets.length);
    const winnerTicket = eligibleTickets[randomIndex];

    const jackpotUsd =
      typeof openDraw.jackpotUsd === 'number'
        ? openDraw.jackpotUsd
        : DEFAULT_JACKPOT_USD;

    // 4. Close the draw + mark tickets in a single transaction
    const updatedDraw = await prisma.$transaction(async tx => {
      // 4a. Mark winner + close draw
      const draw = await tx.draw.update({
        where: {
          id: openDraw.id,
        },
        data: {
          isClosed: true,
          resolvedAt: new Date(),
          winnerTicketId: winnerTicket.id,
          jackpotUsd: jackpotUsd,
        },
        include: {
          winnerTicket: {
            include: {
              wallet: true,
            },
          },
        },
      });

      // 4b. Update ticket statuses
      await tx.ticket.update({
        where: { id: winnerTicket.id },
        data: { status: 'WON' },
      });

      await tx.ticket.updateMany({
        where: {
          drawId: openDraw.id,
          id: { not: winnerTicket.id },
        },
        data: { status: 'NOT_PICKED' },
      });

      return draw;
    });

    const winner = updatedDraw.winnerTicket;

    // Safety: should always exist now
    if (!winner || !winner.wallet) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Winner recorded but missing ticket/wallet details',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      drawId: updatedDraw.id,
      winner: {
        id: winner.id,
        code: winner.code,
        wallet: winner.wallet.address,
        jackpotUsd: Number(updatedDraw.jackpotUsd ?? jackpotUsd),
      },
    });
  } catch (err) {
    console.error('[ADMIN] pick-winner fatal error:', err);
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : 'Unexpected error picking winner',
      },
      { status: 500 }
    );
  }
}
