// app/api/admin/bonus-upcoming/route.ts
import { NextRequest, NextResponse } from 'next/server';

// For now we ignore admin auth here — the UI is already admin-token gated.

type UpcomingBonus = {
  id: string;
  label: string;
  amount: number;
  scheduledFor: string; // ISO string
};

const FAKE_UPCOMING: UpcomingBonus[] = [];

export async function GET() {
  // No upcoming drops yet — just return an empty list so the UI stays happy.
  return NextResponse.json({ upcoming: FAKE_UPCOMING });
}

export async function POST(req: NextRequest) {
  // Temporary stub so the "Schedule bonus XPOT" button doesn't explode.
  // Later we’ll replace this with real scheduling logic + DB writes.
  const body = await req.json().catch(() => null);

  return NextResponse.json({
    ok: true,
    message: 'Bonus XPOT scheduling stub — not yet wired to DB.',
    received: body,
    status: 200,
  });
}
