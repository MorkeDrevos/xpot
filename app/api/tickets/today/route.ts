// app/api/tickets/today/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

type UiStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

function toUiStatus(raw: any): UiStatus {
  const s = String(raw ?? '').trim();

  if (s === 'in-draw' || s === 'expired' || s === 'not-picked' || s === 'won' || s === 'claimed') return s;

  const up = s.toUpperCase();
  if (up === 'IN_DRAW' || up === 'IN-DRAW') return 'in-draw';
  if (up === 'NOT_PICKED' || up === 'NOT-PICKED') return 'not-picked';
  if (up === 'WON') return 'won';
  if (up === 'CLAIMED') return 'claimed';
  if (up === 'EXPIRED') return 'expired';

  return 'in-draw';
}

export async function GET() {
  try {
    // ✅ account-level identity (Clerk)
    const { userId: clerkId } = auth();
    if (!clerkId) {
      return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Resolve app User
    const appUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!appUser?.id) {
      return NextResponse.json({ ok: true, draw: null, tickets: [] });
    }

    // Fetch wallets linked to this user
    const wallets = await prisma.wallet.findMany({
      where: { userId: appUser.id },
      select: { id: true, address: true },
    });

    if (!wallets.length) {
      return NextResponse.json({ ok: true, draw: null, tickets: [] });
    }

    // Today in UTC (same as your current endpoint)
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');

    const start = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
    const end = new Date(`${yyyy}-${mm}-${dd}T23:59:59.999Z`);

    const drawRecord = await prisma.draw.findFirst({
      where: {
        drawDate: { gte: start, lte: end },
      },
      orderBy: { drawDate: 'asc' },
      select: {
        id: true,
        drawDate: true,
        status: true,
        jackpotUsd: true,
        rolloverUsd: true,
        tickets: {
          where: {
            walletId: { in: wallets.map(w => w.id) },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            code: true,
            status: true,
            label: true,
            createdAt: true,
            walletAddress: true,
          },
        },
      },
    });

    if (!drawRecord) {
      return NextResponse.json({ ok: true, draw: null, tickets: [] });
    }

    const tickets = (drawRecord.tickets ?? []).map(t => ({
      id: t.id,
      code: t.code,
      status: toUiStatus(t.status),
      label: t.label ?? 'Ticket for today’s draw',
      jackpotUsd: drawRecord.jackpotUsd ?? 0,
      createdAt: t.createdAt,
      walletAddress: String(t.walletAddress ?? ''),
    }));

    return NextResponse.json({
      ok: true,
      draw: {
        id: drawRecord.id,
        drawDate: drawRecord.drawDate,
        status: String(drawRecord.status ?? 'open'),
        jackpotUsd: drawRecord.jackpotUsd ?? 0,
        rolloverUsd: drawRecord.rolloverUsd ?? 0,
      },
      tickets,
    });
  } catch (err) {
    console.error('GET /api/tickets/today error', err);
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
