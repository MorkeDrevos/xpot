import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // TEMP: replace later with DB query
  const entries = [
    { handle: 'CryptoNox' },
    { handle: 'XPOTMaxi' },
    { handle: 'ChartHermit' },
    { handle: 'SolanaSignals' },
    { handle: 'LoopMode' },
  ];

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    entries,
  });
}
