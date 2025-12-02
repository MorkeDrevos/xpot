// app/api/admin/winners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_auth';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const body = await req.json();
  const { drawId, txUrl } = body ?? {};

  if (!drawId) {
    return NextResponse.json(
      { ok: false, error: 'Missing drawId' },
      { status: 400 },
    );
  }

  // TODO: later we can persist paidOut + txUrl in DB.
  // For now we just return ok and let the frontend update state.
  return NextResponse.json({ ok: true });
}
