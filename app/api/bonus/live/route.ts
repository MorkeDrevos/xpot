import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const now = Date.now();

  return NextResponse.json({
    bonus: [
      {
        id: 'b1',
        amountXpot: 50_000,
        scheduledAt: new Date(now + 1000 * 60 * 25).toISOString(),
        status: 'UPCOMING',
      },
      {
        id: 'b2',
        amountXpot: 25_000,
        scheduledAt: new Date(now - 1000 * 60 * 40).toISOString(),
        status: 'CLAIMED',
      },
    ],
  });
}
