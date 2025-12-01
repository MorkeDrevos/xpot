// app/api/admin/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  // Gatekeeper: returns a response if not allowed, null if OK
  const guard = requireAdmin(request);
  if (guard) return guard;

  // If we get here, token is valid
  return NextResponse.json({
    ok: true,
    admin: true,
    envActive: true,
    now: new Date().toISOString(),
  });
}
