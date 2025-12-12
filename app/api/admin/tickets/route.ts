// app/api/admin/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const drawId = searchParams.get('drawId');

  const tickets = await prisma.ticket.findMany({
    where: drawId ? { drawId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 250,
  });

  return NextResponse.json({ ok: true, tickets });
}
