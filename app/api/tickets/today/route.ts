// app/api/tickets/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1) Require X login
  const session = await getServerSession(authOptions);

  const user = session?.user as any;

  if (!user?.id) {
    return NextResponse.json(
      { ok: false, error: 'NOT_LOGGED_IN' },
      { status: 401 }
    );
  }

  const userId = user.id as string;

  // 2) Read wallet address from body
  let body: { walletAddress?: string } = {};
  try {
    body = await req.json();
  } catch {
    // body stays {}
  }

  const walletAddress = body.walletAddress?.trim();

  if (!walletAddress) {
    return NextResponse.json(
      { ok: false, error: 'NO_WALLET_ADDRESS' },
      { status: 400 }
    );
  }

  try {
    // 3) Find today’s draw
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

    // 4) Find or create wallet for this user
    let wallet = await prisma.wallet.findUnique({
      where: { address: walletAddress },
    });

    // If wallet exists but belongs to another user, block it
    if (wallet && wallet.userId !== userId) {
      return NextResponse.json(
        { ok: false, error: 'WALLET_OWNED_BY_OTHER_USER' },
        { status: 403 }
      );
    }

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          address: walletAddress,
          userId,
        },
      });
    }

    // 5) Enforce ONE ticket per WALLET per draw
    const existing = await prisma.ticket.findFirst({
      where: {
        drawId: draw.id,
        walletId: wallet.id,
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

    // 6) Create new ticket
    const ticket = await prisma.ticket.create({
      data: {
        drawId: draw.id,
        userId,
        walletId: wallet.id,
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

// Simple helper – or reuse your existing one
function generateTicketCode() {
  return 'XP-' + Math.random().toString(36).slice(2, 10).toUpperCase();
}
