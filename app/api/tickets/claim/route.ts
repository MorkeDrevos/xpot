// app/api/tickets/claim/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Helper – today’s UTC range
function getTodayRange() {
  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const start = new Date(`${todayStr}T00:00:00.000Z`);
  const end = new Date(`${todayStr}T23:59:59.999Z`);
  return { start, end };
}

// Helper – simple ticket code generator
function makeCode() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const chunk = () =>
    Array.from({ length: 4 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join('');
  return `XPOT-${chunk()}-${chunk()}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const walletAddress: string | undefined =
      body.walletAddress || body.wallet || body.address;

    if (!walletAddress) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_WALLET_ADDRESS' },
        { status: 400 },
      );
    }

    // 1) Find today's open draw
    const { start, end } = getTodayRange();

    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: { gte: start, lt: end },
        status: 'open',
      },
    });

    if (!draw) {
      return NextResponse.json(
        { ok: false, error: 'NO_OPEN_DRAW' },
        { status: 400 },
      );
    }

    // 2) Ensure wallet row exists
    const wallet = await prisma.wallet.upsert({
      where: { address: walletAddress },
      update: {},
      create: {
        address: walletAddress,
      },
    });

    // 3) Check if this wallet already has an IN_DRAW ticket for today
    let ticket = await prisma.ticket.findFirst({
      where: {
        drawId: draw.id,
        walletAddress: walletAddress,
        status: 'IN_DRAW',
      },
      include: {
        wallet: true,
      },
    });

    // 4) If no ticket yet, create one (and include wallet so the type matches)
    if (!ticket) {
      ticket = await prisma.ticket.create({
        data: {
          code: makeCode(),
          walletId: wallet.id,
          walletAddress: walletAddress,
          drawId: draw.id,
        },
        include: {
          wallet: true,
        },
      });
    }

    return NextResponse.json(
      {
        ok: true,
        drawId: draw.id,
        ticket: {
          id: ticket.id,
          code: ticket.code,
          walletAddress: ticket.walletAddress,
          wallet: {
            id: ticket.wallet?.id ?? null,
            address: ticket.wallet?.address ?? walletAddress,
          },
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[XPOT] /tickets/claim error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
