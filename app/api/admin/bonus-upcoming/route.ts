// app/api/admin/bonus-upcoming/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Temporary stub until the real bonus scheduler is wired
  const message =
    'No upcoming bonus XPOT drops scheduled yet. You can create bonus XPOT manually from the control room.';

  return new NextResponse(message, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
