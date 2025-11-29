import { NextResponse } from 'next/server';
// ⬇️ Adjust this import to match how you already use Prisma
// Option A:
// import prisma from '@/lib/prisma';
// Option B (if you don't have a helper yet):
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Helper to generate ticket code, same pattern as frontend
function makeCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = () =>
    Array.from({ length: 4 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join('');
  return `XPOT-${block()}-${block()}`;
}

// Shape we send back to the UI
type Entry = {
  id: string;
  code: string;
  status: 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';
  label: string;
  jackpotUsd: string;
  createdAt: string;
  walletAddress: string;
};

// Map Prisma Ticket + Draw to dashboard Entry
function toEntry(ticket: any, draw: any): Entry {
  const jackpotUsdNumber = draw?.jackpotUsd ?? 10_000;

  return {
    id: ticket.id,
    code: ticket.code,
    status: ticket.status as Entry['status'],
    label: `Today's main jackpot • $${jackpotUsdNumber.toLocaleString()}`,
    jackpotUsd: `$${jackpotUsdNumber.toLocaleString()}`,
    createdAt: ticket.createdAt.toISOString(), // UI can format
    walletAddress: ticket.walletAddress,
  };
}

export async function POST(req: Request) {
  try {
    const { walletAddress } = await req.json();

    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Missing walletAddress' },
        { status: 400 }
      );
    }

    // "Today" key for the draw, YYYY-MM-DD in UTC
    const todayKey = new Date().toISOString().slice(0, 10);

    // 1) Find / create today's draw
    let draw = await prisma.draw.findFirst({
      where: { dateKey: todayKey },
    });

    if (!draw) {
      draw = await prisma.draw.create({
        data: {
          dateKey: todayKey,
          jackpotUsd: 10_000, // TODO: wire real jackpot later
          status: 'open',
        },
      });
    }

    // 2) Check if this wallet already has a ticket for today's draw
    let ticket = await prisma.ticket.findFirst({
      where: {
        drawId: draw.id,
        walletAddress,
      },
    });

    if (!ticket) {
      // 3) Create a new one
      ticket = await prisma.ticket.create({
        data: {
          code: makeCode(),
          status: 'in-draw',
          walletAddress,
          drawId: draw.id,
        },
      });
    }

    // 4) Load all tickets for this draw to refresh UI
    const allTickets = await prisma.ticket.findMany({
      where: { drawId: draw.id },
      orderBy: { createdAt: 'desc' },
    });

    const entry = toEntry(ticket, draw);
    const entries = allTickets.map(t => toEntry(t, draw));

    return NextResponse.json({
      ok: true,
      ticket: entry,
      tickets: entries,
    });
  } catch (err) {
    console.error('Error in /api/tickets/claim', err);
    return NextResponse.json(
      { ok: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
