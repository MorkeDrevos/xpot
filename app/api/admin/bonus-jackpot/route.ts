// app/api/admin/bonus-jackpot/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const body = await req.json().catch(() => ({}));
    const amountUsd = Number(body.amountUsd);
    const label: string = body.label || 'Bonus jackpot';

    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      return NextResponse.json(
        { ok: false, error: 'INVALID_AMOUNT' },
        { status: 400 },
      );
    }

    // Today as YYYY-MM-DD string (UTC, same as /today API)
    const todayStr = new Date().toISOString().slice(0, 10);

    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: new Date(`${todayStr}T00:00:00.000Z`),
          lt: new Date(`${todayStr}T23:59:59.999Z`),
        },
      },
      include: {
        tickets: {
          include: { wallet: true },
          where: { status: 'IN_DRAW' },
        },
      },
    });

    if (!draw || draw.tickets.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'NO_TICKETS_FOR_TODAY' },
        { status: 400 },
      );
    }

    // Pick random ticket from today's pool
    const randomIndex = Math.floor(Math.random() * draw.tickets.length);
    const winningTicket = draw.tickets[randomIndex];

    // Create Reward row
    const reward = await prisma.reward.create({
      data: {
        drawId: draw.id,
        ticketId: winningTicket.id,
        label,
        amountUsd: Math.round(amountUsd), // store as whole dollars for now
      },
      include: {
        ticket: {
          include: {
            wallet: true,
          },
        },
        draw: true,
      },
    });

    const winner = {
      id: reward.id,
      kind: 'bonus' as const,
      label: reward.label,
      drawId: reward.drawId,
      date: reward.createdAt.toISOString(),
      ticketCode: reward.ticket.code,
      walletAddress: reward.ticket.wallet.address,
      jackpotUsd: reward.amountUsd,
      payoutUsd: reward.amountUsd,
      isPaidOut: reward.isPaidOut,
      txUrl: reward.payoutTx ?? null,
    };

    return NextResponse.json({
      ok: true,
      winner,
    });
  } catch (err) {
    console.error('[ADMIN] /bonus-jackpot error', err);
    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_CREATE_BONUS_JACKPOT' },
      { status: 500 },
    );
  }
}
