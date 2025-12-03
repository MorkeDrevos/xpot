// app/api/admin/bonus/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const body = await req.json();
    const amountUsdRaw = body?.amountUsd;
    const labelRaw = body?.label ?? '';

    const amountUsd = Math.round(Number(amountUsdRaw || 0));
    const label = String(labelRaw).trim() || 'Bonus jackpot';

    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      return NextResponse.json(
        { ok: false, error: 'INVALID_AMOUNT' },
        { status: 400 },
      );
    }

    // Today as YYYY-MM-DD string (same logic as /admin/today)
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
          include: {
            wallet: true,
          },
        },
      },
    });

    if (!draw) {
      return NextResponse.json(
        { ok: false, error: 'NO_DRAW_TODAY' },
        { status: 400 },
      );
    }

    if (!draw.tickets.length) {
      return NextResponse.json(
        { ok: false, error: 'NO_TICKETS_TODAY' },
        { status: 400 },
      );
    }

    // Pick a random ticket from today’s pool
    const winnerTicket =
      draw.tickets[Math.floor(Math.random() * draw.tickets.length)];

    const reward = await prisma.reward.create({
      data: {
        drawId: draw.id,
        ticketId: winnerTicket.id,
        label,
        amountUsd,
      },
      include: {
        ticket: {
          include: {
            wallet: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      reward: {
        id: reward.id,
        label: reward.label,
        amountUsd: reward.amountUsd,
        ticketCode: reward.ticket.code,
        walletAddress: reward.ticket.wallet.address,
        createdAt: reward.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('[ADMIN] /bonus error', err);
    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_DROP_BONUS' },
      { status: 500 },
    );
  }
}
