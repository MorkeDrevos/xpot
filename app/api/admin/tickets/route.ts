// app/api/admin/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  // Today as YYYY-MM-DD
  const todayStr = new Date().toISOString().slice(0, 10);

  // Find today’s draw by drawDate (DateTime)
  const draw = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: new Date(`${todayStr}T00:00:00.000Z`),
        lt:  new Date(`${todayStr}T23:59:59.999Z`),
      },
    },
    include: {
      tickets: true,
    },
  });

  if (!draw) {
    return NextResponse.json({
      ok: true,
      tickets: [],
    });
  }

  return NextResponse.json({
    ok: true,
    tickets: draw.tickets.map(t => ({
      id: t.id,
      code: t.code,
      walletAddress: '',      // fill from Wallet join later if you want
      status: t.status,
      createdAt: t.createdAt,
    })),
  });
}
