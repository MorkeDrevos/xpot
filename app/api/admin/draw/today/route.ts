// app/api/admin/draw/today/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function isAuthorized(req: NextRequest) {
  const token =
    req.headers.get('x-admin-token') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

  return token === process.env.XPOT_ADMIN_TOKEN
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  // Find today's draw (by date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const draw = await prisma.draw.findFirst({
    where: {
      drawDate: today
    }
  })

  if (!draw) {
    return NextResponse.json({
      ok: true,
      draw: null
    })
  }

  // Count tickets for this draw
  const ticketsCount = await prisma.ticket.count({
    where: {
      drawId: draw.id
    }
  })

  return NextResponse.json({
    ok: true,
    draw: {
      id: draw.id,
      date: draw.drawDate.toISOString(),
      status: draw.isClosed ? 'closed' : draw.resolvedAt ? 'completed' : 'open',
      jackpotUsd: Number(draw.jackpotUsd),      // ✅ FIXED FIELD
      rolloverUsd: Number(draw.rolloverUsd),
      ticketsCount
    }
  })
}
