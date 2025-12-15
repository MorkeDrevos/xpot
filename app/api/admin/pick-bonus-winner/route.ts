// app/api/admin/pick-bonus-winner/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const amountXpot = Number(body?.amountXpot ?? 0);
  const label = String(body?.label ?? 'Bonus XPOT').slice(0, 64);

  if (!Number.isFinite(amountXpot) || amountXpot < 100000) {
    return NextResponse.json(
      { ok: false, error: 'Invalid amountXpot (min 100,000).' },
      { status: 400 },
    );
  }

  const today = new Date();
  const yyyyMmDd = today.toISOString().slice(0, 10);
  const startOfDay = new Date(`${yyyyMmDd}T00:00:00.000Z`);
  const endOfDay = new Date(`${yyyyMmDd}T23:59:59.999Z`);

  const draw = await prisma.draw.findFirst({
    where: { drawDate: { gte: startOfDay, lt: endOfDay } },
  });

  if (!draw) {
    return NextResponse.json(
      { ok: false, error: 'No draw found for today.' },
      { status: 404 },
    );
  }

  if (draw.status !== 'open') {
    return NextResponse.json(
      { ok: false, error: 'Draw is not open.' },
      { status: 400 },
    );
  }

  // Pull eligible tickets for the draw (adjust statuses to match your schema)
  const tickets = await prisma.ticket.findMany({
    where: {
      drawId: draw.id,
      status: 'IN_DRAW', // change if your enum differs
    },
    select: { id: true, code: true, walletAddress: true },
  });

  if (tickets.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'No eligible tickets in pool.' },
      { status: 400 },
    );
  }

  const picked = tickets[randInt(0, tickets.length - 1)];

  // Create bonus winner (adjust model/fields to your schema)
  const winner = await prisma.winner.create({
    data: {
      drawId: draw.id,
      ticketCode: picked.code,
      walletAddress: picked.walletAddress,
      kind: 'bonus', // ensure your enum supports this
      label,
      payoutUsd: amountXpot, // you’re using payoutUsd as XPOT amount in UI
      jackpotUsd: 0,
      isPaidOut: false,
    },
  });

  return NextResponse.json({ ok: true, winner });
}
