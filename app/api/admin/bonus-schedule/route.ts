// app/api/admin/bonus-schedule/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';
import { ensureTodayDraw } from '@/lib/ensureTodayDraw';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1) Admin gate
  const auth = requireAdmin(req);
  if (auth) return auth;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const amountXpot = Number(body.amountXpot);
  const label = (body.label ?? 'Bonus XPOT').toString().trim();
  const delayMinutes = Number(body.delayMinutes);

  // 2) Basic validation
  if (!Number.isFinite(amountXpot) || amountXpot < 100_000) {
    return NextResponse.json(
      { ok: false, error: 'amountXpot must be at least 100,000 XPOT' },
      { status: 400 },
    );
  }

  const allowedDelays = [5, 15, 30, 60];
  if (!allowedDelays.includes(delayMinutes)) {
    return NextResponse.json(
      { ok: false, error: 'delayMinutes must be one of 5, 15, 30, 60' },
      { status: 400 },
    );
  }

  // 3) Make sure today's draw exists and is linked
  const todayDraw = await ensureTodayDraw();
  if (!todayDraw) {
    return NextResponse.json(
      { ok: false, error: 'No XPOT draw detected for today' },
      { status: 500 },
    );
  }

  // Use current time + delay (UTC) – your worker can later use draw.drawDate
  const scheduledAt = new Date(Date.now() + delayMinutes * 60_000);

  // 4) Create the bonus drop row
  const drop = await prisma.bonusDrop.create({
    data: {
      drawId: todayDraw.id,
      label,
      amountXpot,
      scheduledAt,
      status: 'SCHEDULED',
    },
  });

  // 5) Return a clean object for the admin UI
  return NextResponse.json({
    ok: true,
    drop: {
      id: drop.id,
      drawId: drop.drawId,
      label: drop.label,
      amountXpot: drop.amountXpot,
      scheduledAt: drop.scheduledAt.toISOString(),
      status: drop.status,
    },
  });
}
