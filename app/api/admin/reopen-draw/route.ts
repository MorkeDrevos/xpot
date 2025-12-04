import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/app/api/admin/_auth'

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req)
  if (auth) return auth

  const todayStr = new Date().toISOString().slice(0, 10)

  const today = new Date(`${todayStr}T00:00:00.000Z`)
  const tomorrow = new Date(`${todayStr}T23:59:59.999Z`)

  const draw = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: today,
        lte: tomorrow,
      },
    },
  })

  if (!draw) {
    return NextResponse.json({ ok: false, error: 'DRAW_NOT_FOUND' }, { status: 404 })
  }

  const reopened = await prisma.draw.update({
    where: { id: draw.id },
    data: {
      isClosed: false,
      resolvedAt: null,
      paidAt: null,
      winnerTicketId: null,
    },
  })

  return NextResponse.json({
    ok: true,
    reopened: reopened.id,
  })
}
