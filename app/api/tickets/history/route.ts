import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  return NextResponse.json(
    { ok: false, error: 'Temporarily disabled (recovery mode).' },
    { status: 503 },
  );
}
