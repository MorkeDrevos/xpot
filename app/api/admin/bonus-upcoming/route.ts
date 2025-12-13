// app/api/admin/bonus-upcoming/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_auth';

// Ops UI expects a list of upcoming bonus drops.
// Keep this as a safe stub until you wire DB scheduling.

type UpcomingDrop = {
  id: string;
  label: string;
  amountXpot: number;
  scheduledAt: string; // ISO
  status: 'SCHEDULED' | 'FIRED' | 'CANCELLED';
};

const FAKE_DROPS: UpcomingDrop[] = [
  {
    id: 'bonus_001',
    label: 'Campfire Bonus',
    amountXpot: 250_000,
    scheduledAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // +30m
    status: 'SCHEDULED',
  },
  {
    id: 'bonus_002',
    label: 'Night Owl Bonus',
    amountXpot: 500_000,
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // +2h
    status: 'SCHEDULED',
  },
];

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  // Return BOTH keys to be backwards-compatible with any UI expectations.
  return NextResponse.json({
    ok: true,
    drops: FAKE_DROPS,
    upcoming: FAKE_DROPS,
  });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);

  return NextResponse.json({
    ok: true,
    message: 'Bonus scheduling stub - not yet wired to DB.',
    received: body,
  });
}

export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);

  return NextResponse.json({
    ok: true,
    message: 'Bonus cancel stub - not yet wired to DB.',
    received: body,
  });
}
