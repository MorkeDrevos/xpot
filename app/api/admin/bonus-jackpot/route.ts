// app/api/admin/bonus-jackpot/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const body = await req.json();

    const payoutXpotRaw = body?.payoutXpot;
    const labelRaw = body?.label ?? '';

    const payoutXpot = Math.floor(Number(payoutXpotRaw || 0));
    const label = String(labelRaw).trim() || 'Bonus XPOT';

    if (!Number.isFinite(payoutXpot) || payoutXpot <= 0) {
      return NextResponse.json(
        { ok: false, error: 'INVALID_PAYOUT' },
        { status: 400 },
      );
    }

    // Madrid today window
    const todayStr = new Date().toISOString().slice(0, 10);

    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: new Date(`${todayStr}T00:00:00Z`),
          lt: new Date(`${todayStr}T23:59:59Z`),
        },
      },
      include: {
        tickets: {
          include: { wallet: true },
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

    const winningTicket =
      draw.tickets[Math.floor(Math.random() * draw.tickets.length)];

    const reward = await prisma.reward.create({
      data: {
        drawId: draw.id,
        ticketId: winningTicket.id,
        label,
        payoutXpot, // ✅ XPOT is the source of truth now
        isPaidOut: false,
      },
      include: {
        ticket: {
          include: {
            wallet: true,
            user: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      reward: {
        id: reward.id,
        label: reward.label,
        payoutXpot: reward.payoutXpot,
        ticketCode: reward.ticket.code,
        walletAddress: reward.ticket.wallet?.address ?? null,
        xHandle: reward.ticket.user?.xHandle ?? null,
        xAvatarUrl: reward.ticket.user?.xAvatarUrl ?? null,
        createdAt: reward.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('[ADMIN] bonus-jackpot error', err);
    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_DROP_BONUS' },
      { status: 500 },
    );
  }
}
