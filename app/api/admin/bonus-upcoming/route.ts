// app/api/admin/bonus-upcoming/route.ts
import { NextResponse } from 'next/server';

// Temporary stub: no real bonus XPOT scheduling yet.
// We just return an empty list so the admin UI doesn’t blow up.
export async function GET() {
  return NextResponse.json({
    items: [],          // array shape you can evolve later
    hasMore: false,
    message: 'Bonus XPOT scheduling not wired yet',
  });
}
