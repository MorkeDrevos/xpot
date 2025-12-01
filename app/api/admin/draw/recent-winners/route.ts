// app/api/admin/draw/recent-winners/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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

  const draws = await prisma.draw.findMany({
    where: {
      winnerTicketId: {
        not: null
      }
    },
    orderBy: {
      drawDate: 'desc'
    },
    take: 10,
    include: {
      winnerTicket: true
    }
  })

  const winners = draws.map(draw => ({
    drawId: draw.id,
    date: draw.drawDate.toISOString(),
    ticketCode: draw.winnerTicket?.code ?? 'UNKNOWN',
    walletAddress: draw.winnerTicket?.walletAddress ?? 'UNKNOWN',
    jackpotUsd: Number(draw.jackpotUsd),
    paidOut: !!draw.paidAt,
    txUrl: draw.payoutTx || null
  }))

  return NextResponse.json({
    ok: true,
    winners
  })
}
