// app/api/admin/mark-paid/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const ticketId = searchParams.get('ticketId');
  const winnerId = searchParams.get('winnerId');

  if (!ticketId && !winnerId) {
    return NextResponse.json(
      { ok: false, error: 'MISSING_ticketId_OR_winnerId' },
      { status: 400 },
    );
  }

  // If winnerId provided: mark the winner as "paid" WITHOUT touching unknown fields
  if (winnerId) {
    const winner = await prisma.winner.findUnique({ where: { id: winnerId } });
    if (!winner) {
      return NextResponse.json(
        { ok: false, error: 'WINNER_NOT_FOUND' },
        { status: 404 },
      );
    }

    // Some schemas have no winner.status field -> we only set txSig if present, otherwise no-op.
    const body = (await req.json().catch(() => ({}))) as { txSig?: string };

    // Update winner in the safest possible way (only if txSig provided)
    if (body?.txSig) {
      await prisma.winner.update({
        where: { id: winnerId },
        data: { txSig: body.txSig } as any,
      });
    }

    // Mark ticket as CLAIMED (this enum exists in your schema)
    if ((winner as any).ticketId) {
      await prisma.ticket.update({
        where: { id: (winner as any).ticketId as string },
        data: { status: 'CLAIMED' },
      });
    }

    return NextResponse.json({ ok: true, winnerId });
  }

  // Else ticketId provided: mark ticket as CLAIMED
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId! } });
  if (!ticket) {
    return NextResponse.json(
      { ok: false, error: 'TICKET_NOT_FOUND' },
      { status: 404 },
    );
  }

  await prisma.ticket.update({
    where: { id: ticketId! },
    data: { status: 'CLAIMED' },
  });

  return NextResponse.json({ ok: true, ticketId });
}
