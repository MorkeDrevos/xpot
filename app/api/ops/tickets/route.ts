// app/api/ops/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';
import { ensureActiveDraw } from '@/lib/ensureActiveDraw';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

type UiTicketStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

function mapTicketStatus(s: any): UiTicketStatus {
  const raw = String(s ?? '').toUpperCase();

  // common enum shapes we’ve seen in your repo
  if (raw === 'IN_DRAW') return 'in-draw';
  if (raw === 'WON') return 'won';
  if (raw === 'CLAIMED') return 'claimed';
  if (raw === 'EXPIRED') return 'expired';
  if (raw === 'NOT_PICKED' || raw === 'NOTPICKED') return 'not-picked';

  // fallback: treat unknowns as in-draw so ops UI can still function
  return 'in-draw';
}

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const draw = await ensureActiveDraw(new Date());

    const tickets = await prisma.ticket.findMany({
      where: { drawId: draw.id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        code: true,
        walletAddress: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        tickets: tickets.map(t => ({
          id: t.id,
          code: t.code,
          walletAddress: t.walletAddress ?? '',
          status: mapTicketStatus(t.status),
          createdAt: t.createdAt.toISOString(),
        })),
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'OPS_TICKETS_FAILED' },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }
}
