// app/api/ops/ops-mode/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// VERY simple admin-key check
function assertAdmin(req: Request) {
  const key = req.headers.get('x-xpot-admin-key');
  if (!key || key !== process.env.XPOT_ADMIN_KEY) {
    return false;
  }
  return true;
}

export async function GET(req: Request) {
  if (!assertAdmin(req)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  return NextResponse.json({
    mode: 'MANUAL',
    effectiveMode: 'MANUAL',
    envAutoAllowed: false,
  });
}

export async function POST(req: Request) {
  if (!assertAdmin(req)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const mode = body?.mode === 'AUTO' ? 'AUTO' : 'MANUAL';

  return NextResponse.json({
    mode,
    effectiveMode: mode,
    envAutoAllowed: false,
  });
}
