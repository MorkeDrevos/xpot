// app/api/bonus/live/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 *
 * - Default: return [] (no bonus scheduled)
 * - To test UI with mock data:
 *    - add ?mock=1 to the request URL
 *    - or set env XPOT_MOCK_BONUS=1
 */
export async function GET(req: Request) {
  const url = new URL(req.url);

  const mockEnabled =
    url.searchParams.get('mock') === '1' || process.env.XPOT_MOCK_BONUS === '1';

  if (!mockEnabled) {
    return NextResponse.json({ bonus: [] });
  }

  // Mock mode (explicitly enabled)
  const now = Date.now();

  return NextResponse.json({
    bonus: [
      {
        id: 'mock-b1',
        amountXpot: 50_000,
        scheduledAt: new Date(now + 1000 * 60 * 25).toISOString(),
        status: 'UPCOMING',
      },
      {
        id: 'mock-b2',
        amountXpot: 25_000,
        scheduledAt: new Date(now - 1000 * 60 * 40).toISOString(),
        status: 'CLAIMED',
      },
    ],
  });
}
