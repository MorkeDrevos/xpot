// app/api/admin/bonus-upcoming/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_auth';

type AdminBonusDrop = {
  id: string;
  label: string;
  amountXpot: number;
  scheduledAt: string;
  status: 'SCHEDULED' | 'FIRED' | 'CANCELLED';
};

const FAKE_DROPS: AdminBonusDrop[] = [];

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  return NextResponse.json({ drops: FAKE_DROPS });
}
