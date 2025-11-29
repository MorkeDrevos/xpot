// app/api/tickets/claim/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma'; // adjust if TS paths use "@/lib/prisma"

// Same code generator as on the client
function makeCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = () =>
    Array.from({ length: 4 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join('');
  return `XPOT-${block()}-${block()}`;
}

// Date key like "2025-11-29" for today's draw
function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body.walletAddress !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Invalid body' },
        { status: 400 }
      );
    }

    const walletAddress = body.walletAddress.trim();
    if (!walletAddress) {
      return NextResponse.json(
        { ok: false, error: 'Empty wallet address' },
        { status: 400 }
      );
    }

    const dateKey = getTodayKey();

    // 1) Make sure today's Draw row exists
    const draw = await prisma.draw.upsert({
      where: { dateKey },
      create: {
        dateKey,
        jackpotUsd: 10_000, // adjust later if dynamic
        status: 'open',
      },
      update: {}, // nothing to update for now
    });

    // 2) Check if this wallet already has a ticket for today's draw
    const existing = await prisma.ticket.findFirst({
      where: {
        walletAddress,
        drawId: draw.id,
      },
    });

    if (existing) {
      const tickets = await prisma.ticket.findMany({
        where: { drawId: draw.id },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({
        ok: true,
        ticket: existing,
        tickets,
      });
    }

    // 3) Create a new ticket
    const code = makeCode();

    const ticket = await prisma.ticket.create({
      data: {
        code,
        status: 'in-draw',
        walletAddress,
        drawId: draw.id,
      },
    });

    // 4) Return full list for this draw (so UI can sync)
    const tickets = await prisma.ticket.findMany({
      where: { drawId: draw.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      ok: true,
      ticket,
      tickets,
    });
  } catch (err) {
    console.error('Error in /api/tickets/claim', err);
    return NextResponse.json(
      { ok: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
