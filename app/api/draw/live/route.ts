import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const closesAt = new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString();

  return NextResponse.json({
    draw: {
      jackpotXpot: 1_000_000,
      jackpotUsd: 2500,
      closesAt,
      status: 'OPEN',
    },
  });
}
