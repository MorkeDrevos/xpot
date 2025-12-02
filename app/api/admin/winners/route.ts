import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_auth';

// Optional: stub GET so it's obvious this isn't used yet
export async function GET() {
  return NextResponse.json(
    { ok: false, error: 'Not implemented. Admin UI uses /api/admin/draw/recent-winners.' },
    { status: 404 },
  );
}

// Mark a specific winner as paid  (stub – no DB yet)
export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const { drawId, txUrl } = await req.json();

  // No winners table yet – just log for now so build compiles.
  console.log('[ADMIN] mark-paid stub', { drawId, txUrl });

  return NextResponse.json({ ok: true });
}
