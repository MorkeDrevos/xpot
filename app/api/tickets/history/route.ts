// app/api/tickets/history/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { ok: false, error: 'walletAddress is required' },
        { status: 400 }
      );
    }

    // Tickets for this wallet (via Wallet.address relation)
    const tickets = await prisma.ticket.findMany({
      where: {
        wallet: {
          address: walletAddress,
        },
      },
      include: {
        draw: true,
        wallet: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 200, // tweak if you want
    });

    const history = tickets.map(t => ({
      id: t.id,
      code: t.code,
      status: 'in-draw' as const, // later you can compute real status
      label:
        t.draw && 'label' in t.draw
          ? // @ts-ignore if your type doesn't have label
            (t.draw as any).label
          : "Today's main jackpot • $10,000",
      jackpotUsd:
        t.draw && 'jackpotUsd' in t.draw
          ? // @ts-ignore
            (t.draw as any).jackpotUsd
          : 10_000,
      createdAt: t.createdAt.toISOString(),
      walletAddress: t.wallet.address,
      drawDate: t.draw ? t.draw.createdAt?.toISOString?.() ?? null : null,
    }));

    return NextResponse.json({ ok: true, tickets: history }, { status: 200 });
  } catch (err) {
    console.error('Error in /api/tickets/history', err);
    return NextResponse.json(
      { ok: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
